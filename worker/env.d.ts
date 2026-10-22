interface Env {
  ASSETS: Fetcher;
  /** Comma/space separated IPs or CIDRs allowed to open the site. Empty = nobody. */
  ALLOWED_IPS?: string;
  /** Cloudflare Access team, e.g. "myteam" or "myteam.cloudflareaccess.com". With ACCESS_AUD, signed-in visitors pass from any IP. */
  ACCESS_TEAM_DOMAIN?: string;
  /** Application Audience (AUD) tag of the Access application. */
  ACCESS_AUD?: string;
  /** Local dev only: pretend this email is signed in, to preview the account menu. */
  DEV_ACCESS_EMAIL?: string;
  TMDB_ACCESS_TOKEN?: string;
  TMDB_API_KEY?: string;
}
