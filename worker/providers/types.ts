// The contract between the worker and a stream provider; worker/providers/index.ts picks the active one.

export interface StreamServer {
  id: string;
  name: string;
  url: string;
  kind: 'hls' | 'embed';
}

export interface StreamQuery {
  type: 'movie' | 'tv';
  tmdbId: string;
  titles: string[];
  year?: string;
  season: string;
  episode: string;
  /** Episode number counted across all seasons, for sources that list a long show as one entry. */
  absolute?: string;
}

/** Recently added titles as TMDB detail objects (with `media_type`), newest first. */
export interface LatestResult {
  results: Record<string, unknown>[];
}
