import { useEffect, useRef } from 'react';
import type { MediaItem } from '@/lib/media';
import { useContinueStore } from '@/store/useContinueStore';

const TICK_SECONDS = 10;
/** An estimate can never prove the title was finished, so it never claims more than this. */
const MAX_ESTIMATE = 0.9;

interface EmbedProgressArgs {
  enabled: boolean;
  media?: MediaItem;
  season?: number;
  episode?: number;
  /** Runtime in seconds, from TMDB. */
  duration: number;
  startAt: number;
}

/**
 * Third-party embed players are cross-origin and don't report their time, so we
 * record the title/episode right away and estimate progress from how long the
 * watch page stays visible. The embed (JWPlayer) restores its exact position itself.
 */
export function useEmbedProgress({ enabled, media, season, episode, duration, startAt }: EmbedProgressArgs) {
  const save = useContinueStore((s) => s.save);
  // Read once per episode: our own saves keep moving startAt and must not restart the timer.
  const start = useRef(startAt);
  start.current = startAt;

  useEffect(() => {
    if (!enabled || !media || duration <= 0) return;
    let position = Math.min(start.current, duration * MAX_ESTIMATE);
    const write = () => save({ media, season, episode, position, duration, estimated: true });
    write();

    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      position = Math.min(position + TICK_SECONDS, duration * MAX_ESTIMATE);
      write();
    }, TICK_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [enabled, media, season, episode, duration, save]);
}
