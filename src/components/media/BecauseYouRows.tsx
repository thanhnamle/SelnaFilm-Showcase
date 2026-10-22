import { useMemo } from 'react';
import { useI18n } from '@/i18n';
import { listQuery } from '@/lib/queries';
import type { MediaItem } from '@/lib/media';
import { sortedEntries, useContinueStore } from '@/store/useContinueStore';
import { useMyListStore } from '@/store/useMyListStore';
import { QueryRow } from './MediaRow';

const keyOf = (m: Pick<MediaItem, 'type' | 'id'>) => `${m.type}:${m.id}`;
const MAX_ROWS = 2;

/**
 * "Because you watched / liked …" rows, seeded by the latest Continue-watching
 * title and the latest saved title. Titles already watched or saved are left out.
 */
export default function BecauseYouRows() {
  const { t, locale } = useI18n();
  const entries = useContinueStore((s) => s.entries);
  const saved = useMyListStore((s) => s.items);

  const { seeds, known } = useMemo(() => {
    const watched = sortedEntries(entries).map((e) => e.media);
    const known = new Set([...watched, ...saved].map(keyOf));
    const candidates = [
      ...watched.slice(0, 1).map((media) => ({ media, reason: 'watched' as const })),
      ...saved.slice(0, 1).map((media) => ({ media, reason: 'liked' as const })),
      // Fill up with older history if the two latest are the same title.
      ...watched.slice(1).map((media) => ({ media, reason: 'watched' as const })),
      ...saved.slice(1).map((media) => ({ media, reason: 'liked' as const })),
    ];
    const seen = new Set<string>();
    const seeds = candidates
      .filter(({ media }) => !seen.has(keyOf(media)) && seen.add(keyOf(media)))
      .slice(0, MAX_ROWS);
    return { seeds, known };
  }, [entries, saved]);

  return (
    <>
      {seeds.map(({ media, reason }) => (
        <QueryRow
          key={keyOf(media)}
          title={t(reason === 'watched' ? 'home.becauseWatched' : 'home.becauseLiked', { title: media.title })}
          query={{
            ...listQuery(locale, `/${media.type}/${media.id}/recommendations`),
            select: (items: MediaItem[]) => items.filter((m) => m.poster && !known.has(keyOf(m))),
          }}
        />
      ))}
    </>
  );
}
