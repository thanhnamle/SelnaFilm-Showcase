import type { MediaItem } from '@/lib/media';
import { watchPath } from '@/lib/media';
import { useContinueStore } from '@/store/useContinueStore';

/** Where "Play" should go: the saved episode/position if there is one. */
export function useResume(item: Pick<MediaItem, 'type' | 'id'>) {
  const entry = useContinueStore((s) => s.entries[`${item.type}:${item.id}`]);
  return {
    entry,
    to: watchPath(item, entry?.season, entry?.episode),
    resumable: Boolean(entry && entry.position > 30),
  };
}
