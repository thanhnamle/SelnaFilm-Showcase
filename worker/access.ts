import { verifyWithJwks } from 'hono/jwt';
import type { HonoJsonWebKey } from 'hono/utils/jwt/jws';

/**
 * Cloudflare Access (email one-time PIN) in front of the worker.
 * Access signs every request it lets through with a JWT; we verify it ourselves so
 * that a request reaching the worker any other way (e.g. a preview URL) can't fake it.
 */

const KEYS_TTL_MS = 60 * 60 * 1000;
/** A token signed by an unknown key triggers a refetch, but at most this often. */
const REFETCH_MIN_MS = 5 * 60 * 1000;
let cached: { team: string; keys: HonoJsonWebKey[]; fetchedAt: number } | undefined;

/** Accepts "myteam", "myteam.cloudflareaccess.com" or the full https URL. */
function teamOrigin(team: string) {
  const host = team.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return `https://${host.includes('.') ? host : `${host}.cloudflareaccess.com`}`;
}

async function getKeys(origin: string, force = false) {
  const age = cached?.team === origin ? Date.now() - cached.fetchedAt : Infinity;
  if (cached && age < (force ? REFETCH_MIN_MS : KEYS_TTL_MS)) return cached.keys;
  const res = await fetch(`${origin}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Access certs ${res.status}`);
  const { keys } = (await res.json()) as { keys: HonoJsonWebKey[] };
  cached = { team: origin, keys, fetchedAt: Date.now() };
  return keys;
}

function readToken(req: Request) {
  const header = req.headers.get('cf-access-jwt-assertion');
  if (header) return header;
  const cookie = req.headers.get('cookie') ?? '';
  return /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(cookie)?.[1];
}

export interface AccessIdentity {
  email?: string;
}

/** The signed-in identity when the request carries a valid Access token for this application, else null. */
export async function getAccessIdentity(req: Request, env: Env): Promise<AccessIdentity | null> {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;
  const token = readToken(req);
  if (!token) return null;

  const origin = teamOrigin(env.ACCESS_TEAM_DOMAIN);
  const verify = (keys: HonoJsonWebKey[]) =>
    verifyWithJwks(token, {
      keys,
      allowedAlgorithms: ['RS256'],
      verification: { iss: origin, aud: env.ACCESS_AUD!.trim() },
    });

  const identity = (payload: Awaited<ReturnType<typeof verify>>): AccessIdentity => ({
    email: typeof payload.email === 'string' ? payload.email : undefined,
  });

  try {
    return identity(await verify(await getKeys(origin)));
  } catch {
    // Access rotates its signing keys; retry once with a fresh set before refusing.
    try {
      return identity(await verify(await getKeys(origin, true)));
    } catch {
      return null;
    }
  }
}
