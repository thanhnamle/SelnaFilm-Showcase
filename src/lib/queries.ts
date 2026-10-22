import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import type { Locale } from '@/i18n';
import type {
  CastMember, Genre, MovieVideos, PersonDetails, TMDBResponse, TVSeason, TVSeasonDetails, WatchProvidersData,
} from '@/types/movie';
import { getJson, tmdb } from './tmdb';
import { toMedia, type MediaItem, type MediaType, type RawMedia } from './media';

const DAY = 24 * 60 * 60 * 1000;

// ---------- Lists ----------

/** Any TMDB list endpoint, normalized to MediaItem[]. `en=1` asks the worker to attach English titles. */
export const listQuery = (locale: Locale, path: string, params: Record<string, string> = {}) => {
  const fallback: MediaType = path.includes('/tv') ? 'tv' : 'movie';
  return queryOptions({
    queryKey: ['list', locale, path, params],
    queryFn: async ({ signal }) => {
      const data = await tmdb<TMDBResponse<RawMedia>>(path, { language: locale, en: 1, ...params }, signal);
      return (data.results ?? []).map((raw) => toMedia(raw, fallback));
    },
  });
};

export type ListQueryOptions = ReturnType<typeof listQuery>;

/**
 * Titles the stream source updated most recently, so all of them play right away (worker/providers).
 * Shares listQuery's key shape so it plugs into the same rows; `type` narrows it client-side.
 */
export const latestQuery = (locale: Locale, type?: MediaType): ListQueryOptions => {
  const filter: Record<string, string> = type ? { type } : {};
  return queryOptions({
    queryKey: ['list', locale, '/api/latest', filter],
    staleTime: 10 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const data = await getJson<TMDBResponse<RawMedia>>('/api/latest', { language: locale }, signal);
      const items = (data.results ?? []).map((raw) => toMedia(raw));
      return type ? items.filter((m) => m.type === type) : items;
    },
  });
};

export type DiscoverSort = 'popularity.desc' | 'vote_average.desc' | 'date.desc';

export interface DiscoverFilters {
  genre: number | null;
  /** ISO 3166-1 code, matched against the title's origin country. */
  country: string | null;
  sort: DiscoverSort;
}

export const discoverQuery = (locale: Locale, type: MediaType, { genre, country, sort }: DiscoverFilters) =>
  infiniteQueryOptions({
    queryKey: ['discover', locale, type, genre, country, sort],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date';
      const today = new Date().toISOString().slice(0, 10);
      const data = await tmdb<TMDBResponse<RawMedia>>(
        `/discover/${type}`,
        {
          language: locale,
          en: 1,
          page: pageParam,
          with_genres: genre ?? undefined,
          with_origin_country: country ?? undefined,
          // "Phim bộ" means series: leave out news, reality and talk shows.
          without_genres: type === 'tv' ? '10763,10764,10767' : undefined,
          sort_by: sort === 'date.desc' ? `${dateField}.desc` : sort,
          // Keep "top rated" and "newest" meaningful: enough votes, nothing unreleased.
          // A single country has far fewer votes (Vietnam has a handful above 10), so its bar is lower.
          'vote_count.gte': sort === 'vote_average.desc' ? (country ? 10 : 300) : sort === 'date.desc' ? (country ? 2 : 20) : undefined,
          [`${dateField}.lte`]: today,
        },
        signal,
      );
      return { items: (data.results ?? []).map((raw) => toMedia(raw, type)), page: data.page, totalPages: data.total_pages };
    },
    getNextPageParam: (last) => (last.page < Math.min(last.totalPages, 500) ? last.page + 1 : undefined),
  });

export const searchQuery = (locale: Locale, q: string) =>
  infiniteQueryOptions({
    queryKey: ['search', locale, q],
    initialPageParam: 1,
    enabled: q.trim().length > 0,
    queryFn: async ({ pageParam, signal }) => {
      const data = await tmdb<TMDBResponse<RawMedia>>('/search/multi', { language: locale, query: q, page: pageParam }, signal);
      const items = (data.results ?? [])
        .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
        .map((raw) => toMedia(raw));
      return { items, page: data.page, totalPages: data.total_pages };
    },
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });

// ---------- Details (one request thanks to append_to_response) ----------

interface RawDetails extends RawMedia {
  runtime?: number | null;
  episode_run_time?: number[];
  status?: string;
  tagline?: string | null;
  budget?: number;
  revenue?: number;
  number_of_seasons?: number;
  seasons?: TVSeason[];
  genres?: Genre[];
  production_companies?: { name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  origin_country?: string[];
  adult?: boolean;
  credits?: { cast: CastMember[] };
  videos?: MovieVideos;
  images?: { logos?: { file_path: string; iso_639_1: string | null; aspect_ratio: number }[] };
  recommendations?: TMDBResponse<RawMedia>;
  similar?: TMDBResponse<RawMedia>;
  'watch/providers'?: { results?: Record<string, WatchProvidersData> };
}

export interface Details {
  media: MediaItem;
  originalTitle?: string;
  tagline?: string;
  genres: Genre[];
  runtime?: number;
  status?: string;
  budget?: number;
  revenue?: number;
  seasons: TVSeason[];
  seasonCount?: number;
  studio?: string;
  country?: string;
  logo?: string;
  trailerKey?: string;
  cast: CastMember[];
  related: MediaItem[];
  providers?: WatchProvidersData;
  /** Titles to look the stream up by (localized + original). */
  lookupTitles: string[];
}

function pickLogo(logos: NonNullable<RawDetails['images']>['logos'], locale: Locale) {
  if (!logos?.length) return undefined;
  const wide = logos.filter((l) => l.aspect_ratio >= 1.4);
  const pool = wide.length ? wide : logos;
  return (pool.find((l) => l.iso_639_1 === locale) ?? pool.find((l) => l.iso_639_1 === 'en') ?? pool[0]).file_path;
}

function pickTrailer(videos?: MovieVideos) {
  const yt = (videos?.results ?? []).filter((v) => v.site === 'YouTube');
  return (
    yt.find((v) => v.type === 'Trailer' && v.official) ??
    yt.find((v) => v.type === 'Trailer') ??
    yt.find((v) => v.type === 'Teaser') ??
    yt[0]
  )?.key;
}

export const detailsQuery = (locale: Locale, type: MediaType, id: number | string) =>
  queryOptions({
    queryKey: ['details', locale, type, String(id)],
    queryFn: async ({ signal }): Promise<Details> => {
      const raw = await tmdb<RawDetails>(
        `/${type}/${id}`,
        {
          language: locale,
          append_to_response: 'credits,videos,images,recommendations,similar,watch/providers',
          include_image_language: `${locale},en,null`,
          include_video_language: `${locale},en,null`,
        },
        signal,
      );
      const media = toMedia({ ...raw, media_type: type }, type);
      const originalTitle = type === 'movie' ? raw.original_title : raw.original_name;
      const related = (raw.recommendations?.results?.length ? raw.recommendations.results : raw.similar?.results ?? [])
        .filter((r) => r.poster_path)
        .map((r) => toMedia(r, type));
      const region = locale === 'vi' ? 'VN' : 'US';
      const providerResults = raw['watch/providers']?.results;

      return {
        media: { ...media, subtitle: originalTitle && originalTitle !== media.title ? originalTitle : undefined },
        originalTitle,
        tagline: raw.tagline || undefined,
        genres: raw.genres ?? [],
        runtime: raw.runtime ?? raw.episode_run_time?.[0] ?? undefined,
        status: raw.status,
        budget: raw.budget || undefined,
        revenue: raw.revenue || undefined,
        seasons: (raw.seasons ?? []).filter((s) => s.season_number > 0 && s.episode_count > 0),
        seasonCount: raw.number_of_seasons,
        studio: raw.production_companies?.[0]?.name,
        country: raw.production_countries?.[0]?.name ?? raw.origin_country?.[0],
        logo: pickLogo(raw.images?.logos, locale),
        trailerKey: pickTrailer(raw.videos),
        cast: raw.credits?.cast ?? [],
        related,
        providers: providerResults?.[region] ?? providerResults?.US,
        lookupTitles: [...new Set([media.title, originalTitle].filter((t): t is string => Boolean(t)))],
      };
    },
  });

export const seasonQuery = (locale: Locale, tvId: number | string, season: number) =>
  queryOptions({
    queryKey: ['season', locale, String(tvId), season],
    queryFn: ({ signal }) => tmdb<TVSeasonDetails>(`/tv/${tvId}/season/${season}`, { language: locale }, signal),
  });

// ---------- People ----------

interface RawPerson extends PersonDetails {
  combined_credits?: { cast: RawMedia[] };
}

export const personQuery = (locale: Locale, id: number | string) =>
  queryOptions({
    queryKey: ['person', locale, String(id)],
    staleTime: DAY,
    queryFn: async ({ signal }) => {
      const raw = await tmdb<RawPerson>(`/person/${id}`, { language: locale, append_to_response: 'combined_credits' }, signal);
      const seen = new Set<string>();
      const credits = (raw.combined_credits?.cast ?? [])
        .filter((c) => c.poster_path && (c.media_type === 'movie' || c.media_type === 'tv'))
        .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
        .filter((c) => {
          const key = `${c.media_type}-${c.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((c) => ({ media: toMedia(c), character: c.character }));
      return { person: raw as PersonDetails, credits };
    },
  });

// ---------- Streams ----------

export interface StreamServer {
  id: string;
  name: string;
  url: string;
  kind: 'hls' | 'embed';
}

export const streamsQuery = (args: {
  type: MediaType;
  id: string;
  titles: string[];
  year?: string;
  season: number;
  episode: number;
  /** Episode number counted across seasons (for sources that list a long show as one entry). */
  absolute?: number;
}) =>
  queryOptions({
    queryKey: ['streams', args],
    // Keep hits for 30 min; "no source yet" is re-checked on the next visit.
    staleTime: ({ state }: { state: { data?: StreamServer[] } }) => (state.data?.length ? 30 * 60 * 1000 : 0),
    enabled: args.titles.length > 0,
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ type: args.type, id: args.id, s: String(args.season), e: String(args.episode) });
      if (args.year) params.set('year', args.year);
      if (args.absolute) params.set('a', String(args.absolute));
      args.titles.forEach((t) => params.append('t', t));
      return getJson<{ servers: StreamServer[] }>(`/api/stream?${params}`, {}, signal).then((r) => r.servers);
    },
  });

// ---------- Account ----------

/** Email signed in through Cloudflare Access; null when the site was opened by IP (e.g. local dev). */
export const meQuery = () =>
  queryOptions({
    queryKey: ['me'],
    staleTime: Infinity,
    retry: false,
    queryFn: ({ signal }) => getJson<{ email: string | null }>('/api/me', {}, signal),
  });
