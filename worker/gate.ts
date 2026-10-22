// Who may open the site. In this public build everyone may: the demo serves only
// TMDB metadata and open movies. (A private deployment can swap in an IP allowlist /
// Cloudflare Access check here; see access.ts and ip.ts.)
import type { MiddlewareHandler } from 'hono';
import type { App } from './app';

export const gate: MiddlewareHandler<App> = async (_c, next) => {
  await next();
};
