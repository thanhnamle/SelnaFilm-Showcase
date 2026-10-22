// Demo provider for the public build. Every title plays one of the Blender Foundation's
// open movies (CC BY 3.0) over HLS in the app's own player, plus its official YouTube
// trailer from TMDB. "Just added" is TMDB's daily trending list.
import { getTmdb } from '../tmdb';
import type { LatestResult, StreamQuery, StreamServer } from './types';

const OPEN_MOVIES = [
  { id: 'big-buck-bunny', name: 'Big Buck Bunny', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  {
    id: 'tears-of-steel',
    name: 'Tears of Steel',
    url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
  },
];

/** Small stable hash, so the same episode always gets the same demo film. */
function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

interface Video {
  site?: string;
  type?: string;
  key?: string;
  official?: boolean;
}

async function trailer(env: Env, q: StreamQuery): Promise<StreamServer | null> {
  const data = (await getTmdb(env, `/${q.type}/${q.tmdbId}/videos`, new URLSearchParams({ language: 'en' }), false)) as {
    results?: Video[];
  };
  const youtube = (data.results ?? []).filter((v) => v.site === 'YouTube' && v.key);
  const pick = youtube.find((v) => v.type === 'Trailer' && v.official) ?? youtube.find((v) => v.type === 'Trailer') ?? youtube[0];
  return pick
    ? { id: 'trailer', name: 'Trailer · YouTube', url: `https://www.youtube-nocookie.com/embed/${pick.key}?autoplay=1&rel=0`, kind: 'embed' }
    : null;
}

export async function resolveStreams(env: Env, q: StreamQuery): Promise<StreamServer[]> {
  const film = OPEN_MOVIES[hash(`${q.type}:${q.tmdbId}:${q.season}:${q.episode}`) % OPEN_MOVIES.length];
  const servers: StreamServer[] = [{ id: `demo-${film.id}`, name: `Demo · ${film.name} (Blender, CC BY 3.0)`, url: film.url, kind: 'hls' }];
  const official = await trailer(env, q).catch(() => null);
  if (official) servers.push(official);
  return servers;
}

export async function latestTitles(env: Env, language: 'vi' | 'en'): Promise<LatestResult> {
  const data = (await getTmdb(env, '/trending/all/day', new URLSearchParams({ language }), false)) as {
    results?: Record<string, unknown>[];
  };
  return { results: (data.results ?? []).filter((r) => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path) };
}

export async function scheduledSync(_env: Env) {
  return { skipped: 'the demo provider has nothing to sync' };
}
