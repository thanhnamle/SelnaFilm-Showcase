// api.tmdb.org is the official alias; some Vietnamese ISPs reset TLS to api.themoviedb.org.
const TMDB_BASE = 'https://api.tmdb.org/3';

// Only the read endpoints the app actually uses can be proxied.
const ALLOWED_PATH =
  /^\/(trending\/(movie|tv|all)\/(day|week)|(movie|tv)\/(popular|top_rated|now_playing|upcoming|on_the_air|airing_today)|(movie|tv)\/\d+(\/(credits|videos|similar|recommendations|watch\/providers|images))?|tv\/\d+\/season\/\d+|person\/\d+(\/combined_credits)?|search\/(multi|movie|tv)|discover\/(movie|tv)|genre\/(movie|tv)\/list)$/;

export const isAllowedTmdbPath = (path: string) => ALLOWED_PATH.test(path);

export class TmdbError extends Error {
  constructor(public status: number) {
    super(`TMDB responded ${status}`);
  }
}

async function tmdbFetch<T>(env: Env, path: string, params: URLSearchParams): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  params.forEach((value, key) => url.searchParams.set(key, value));

  const headers: HeadersInit = { accept: 'application/json' };
  if (env.TMDB_ACCESS_TOKEN) headers.authorization = `Bearer ${env.TMDB_ACCESS_TOKEN}`;
  else if (env.TMDB_API_KEY) url.searchParams.set('api_key', env.TMDB_API_KEY);

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new TmdbError(res.status);
  return res.json<T>();
}

interface ListItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  english_name?: string;
}

interface ListResponse {
  results?: ListItem[];
}

/**
 * Fetches a TMDB endpoint. With `withEnglish`, list results get an `english_name`
 * so Korean/Japanese/Chinese titles can be shown with a readable subtitle
 * (TMDB's original_title is often in native script).
 */
export async function getTmdb(env: Env, path: string, params: URLSearchParams, withEnglish: boolean) {
  const language = params.get('language') ?? 'vi';
  if (!withEnglish) return tmdbFetch<unknown>(env, path, params);

  if (language === 'en') {
    const data = await tmdbFetch<ListResponse>(env, path, params);
    data.results = data.results?.map((m) => ({ ...m, english_name: m.title ?? m.name }));
    return data;
  }

  const englishParams = new URLSearchParams(params);
  englishParams.set('language', 'en');
  const [localized, english] = await Promise.all([
    tmdbFetch<ListResponse>(env, path, params),
    tmdbFetch<ListResponse>(env, path, englishParams).catch(() => ({ results: [] }) as ListResponse),
  ]);

  const englishById = new Map((english.results ?? []).map((m) => [m.id, m.title ?? m.name]));
  localized.results = localized.results?.map((m) => ({
    ...m,
    english_name: englishById.get(m.id) ?? m.original_title ?? m.original_name,
  }));
  return localized;
}
