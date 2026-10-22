// One normalized shape for movies and TV shows, so cards and rows never branch on title/name.

export type MediaType = 'movie' | 'tv';

export interface MediaItem {
  id: number;
  type: MediaType;
  title: string;
  /** English / original title shown under the localized one when different. */
  subtitle?: string;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  year?: string;
  genreIds: number[];
  overview?: string;
}

/** Loose TMDB list item: covers movie, tv and multi-search results. */
export interface RawMedia {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  english_name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number }[];
  overview?: string;
  character?: string;
  popularity?: number;
}

export function mediaType(raw: RawMedia, fallback: MediaType = 'movie'): MediaType {
  if (raw.media_type === 'movie' || raw.media_type === 'tv') return raw.media_type;
  if (raw.title !== undefined) return 'movie';
  if (raw.name !== undefined) return 'tv';
  return fallback;
}

// Thai, kana, CJK ideographs and Hangul: titles TMDB has not translated yet.
const NATIVE_SCRIPT = /[฀-๿぀-ヿ㐀-鿿가-힯]/;

export function toMedia(raw: RawMedia, fallback?: MediaType): MediaItem {
  const type = mediaType(raw, fallback);
  let title = (type === 'movie' ? raw.title : raw.name) ?? raw.title ?? raw.name ?? '';
  let alt = raw.english_name ?? (type === 'movie' ? raw.original_title : raw.original_name);
  // Show a readable title first when the localized one is still in native script.
  if (alt && NATIVE_SCRIPT.test(title) && !NATIVE_SCRIPT.test(alt)) [title, alt] = [alt, title];
  const date = type === 'movie' ? raw.release_date : raw.first_air_date;
  return {
    id: raw.id,
    type,
    title,
    subtitle: alt && alt !== title ? alt : undefined,
    poster: raw.poster_path ?? null,
    backdrop: raw.backdrop_path ?? null,
    rating: raw.vote_average ?? 0,
    year: date ? date.slice(0, 4) : undefined,
    genreIds: raw.genre_ids ?? raw.genres?.map((g) => g.id) ?? [],
    overview: raw.overview,
  };
}

export const mediaPath = (item: Pick<MediaItem, 'type' | 'id'>) => `/${item.type}/${item.id}`;

type PosterSize = 'w185' | 'w342' | 'w500' | 'w780';
type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original';
type ProfileSize = 'w185' | 'h632';

export function img(path: string | null | undefined, size: PosterSize | BackdropSize | ProfileSize | 'w92' | 'w154') {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}

export const posterSrcSet = (path: string | null | undefined) =>
  path ? `${img(path, 'w185')} 185w, ${img(path, 'w342')} 342w, ${img(path, 'w500')} 500w` : undefined;

export const backdropSrcSet = (path: string | null | undefined) =>
  path ? `${img(path, 'w300')} 300w, ${img(path, 'w780')} 780w, ${img(path, 'w1280')} 1280w` : undefined;

export function watchPath(item: Pick<MediaItem, 'type' | 'id'>, season = 1, episode = 1) {
  return item.type === 'movie' ? `/watch/movie/${item.id}` : `/watch/tv/${item.id}?s=${season}&e=${episode}`;
}
