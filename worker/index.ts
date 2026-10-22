import { Hono } from 'hono';
import type { App, AppContext } from './app';
import { gate } from './gate';
import { getTmdb, isAllowedTmdbPath, TmdbError } from './tmdb';
import { latestTitles, resolveStreams, scheduledSync, type StreamQuery } from './providers';

const app = new Hono<App>();

// 1. Gate (worker/gate.ts): IP allowlist or Cloudflare Access sign-in.
app.use('*', gate);

/**
 * Serves a JSON response from the edge cache when possible (custom domains only; no-op on workers.dev).
 * `cacheable` can veto caching a result, e.g. an empty source list that may fill up soon.
 */
async function cachedJson<T>(c: AppContext, ttlSeconds: number, compute: () => Promise<T>, cacheable: (data: T) => boolean = () => true) {
  const cache = caches.default;
  const key = new Request(new URL(c.req.url).toString(), { method: 'GET' });
  const hit = await cache.match(key);
  if (hit) return new Response(hit.body, hit);

  const data = await compute();
  const keep = cacheable(data);
  const res = new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // `private` so shared caches outside Cloudflare never store allowlisted content.
      'cache-control': keep ? `private, max-age=${Math.min(ttlSeconds, 600)}` : 'private, no-store',
    },
  });
  if (!keep) return res;
  const edgeCopy = new Response(res.clone().body, res);
  edgeCopy.headers.set('cache-control', `public, max-age=${ttlSeconds}`);
  c.executionCtx.waitUntil(cache.put(key, edgeCopy));
  return res;
}

// 2. TMDB proxy — keeps the API token on the server.
app.get('/api/tmdb/*', async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname.slice('/api/tmdb'.length);
  if (!isAllowedTmdbPath(path)) return c.json({ error: 'Not found' }, 404);
  if (!c.env.TMDB_ACCESS_TOKEN && !c.env.TMDB_API_KEY) {
    return c.json({ error: 'TMDB credentials are not configured' }, 500);
  }

  const params = new URLSearchParams(url.search);
  const withEnglish = params.get('en') === '1';
  params.delete('en');

  try {
    return await cachedJson(c, 3600, () => getTmdb(c.env, path, params, withEnglish));
  } catch (error) {
    const status = error instanceof TmdbError && error.status === 404 ? 404 : 502;
    return c.json({ error: 'TMDB request failed' }, status);
  }
});

// 3. Stream sources (worker/providers).
app.get('/api/stream', async (c) => {
  const type = c.req.query('type');
  const tmdbId = c.req.query('id') ?? '';
  if ((type !== 'movie' && type !== 'tv') || !/^\d+$/.test(tmdbId)) {
    return c.json({ error: 'Invalid query' }, 400);
  }

  const titles = [...new Set((c.req.queries('t') ?? []).map((t) => t.trim()).filter(Boolean))].slice(0, 3);
  const absolute = c.req.query('a');

  const query: StreamQuery = {
    type,
    tmdbId,
    titles,
    year: c.req.query('year') || undefined,
    season: c.req.query('s') || '1',
    episode: c.req.query('e') || '1',
    absolute: absolute && /^\d+$/.test(absolute) ? absolute : undefined,
  };
  return cachedJson(
    c,
    1800,
    async () => ({ servers: await resolveStreams(c.env, query) }),
    // New episodes appear on the sources any minute; only remember hits.
    (data) => data.servers.length > 0,
  );
});

// Titles the stream provider added most recently, as TMDB details.
app.get('/api/latest', (c) => {
  const language = c.req.query('language') === 'en' ? 'en' : 'vi';
  return cachedJson(c, 600, () => latestTitles(c.env, language), (data) => data.results.length > 0);
});

// 4. Who is signed in through Cloudflare Access (null when let in by IP, e.g. local dev).
app.get('/api/me', (c) => {
  // DEV_ACCESS_EMAIL previews the account menu on localhost; it is display-only and never opens the gate.
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(c.req.url).hostname);
  const email = c.get('email') ?? (local ? c.env.DEV_ACCESS_EMAIL : undefined) ?? null;
  return c.json({ email }, 200, { 'cache-control': 'private, no-store' });
});

app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404));

// 5. Everything else is the SPA (index.html for unknown paths via not_found_handling).
app.all('*', async (c) => {
  const res = await c.env.ASSETS.fetch(c.req.raw);
  return new Response(res.body, res); // copy so headers are mutable
});

export default {
  fetch: app.fetch,
  // Cron (wrangler.jsonc "triggers"): let the provider refresh whatever it caches.
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(scheduledSync(env).then((r) => console.log('provider sync', r)));
  },
} satisfies ExportedHandler<Env>;
