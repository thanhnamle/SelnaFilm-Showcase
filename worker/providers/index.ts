// The active stream provider. Every provider exports the same three functions:
//   resolveStreams(env, query)  playable servers for a TMDB title / episode
//   latestTitles(env, language) recently added titles for the Home page
//   scheduledSync(env)          work for the cron trigger (may be a no-op)
// This public build uses the demo provider: open movies + official trailers.
export * from './demo';
export type { LatestResult, StreamQuery, StreamServer } from './types';
