import { X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { watchPath } from '@/lib/media';
import { sortedEntries, useContinueStore } from '@/store/useContinueStore';
import MediaCard from './MediaCard';
import { RowShell } from './MediaRow';

export default function ContinueRow() {
  const { t } = useI18n();
  const entries = sortedEntries(useContinueStore((s) => s.entries));
  const remove = useContinueStore((s) => s.remove);
  if (!entries.length) return null;

  return (
    <RowShell title={t('home.continue')}>
      {entries.map((entry) => (
        <div key={`${entry.media.type}-${entry.media.id}`} className="group/item relative w-[270px] shrink-0 snap-start sm:w-[300px] lg:w-[340px]">
          <MediaCard
            item={entry.media}
            variant="backdrop"
            to={watchPath(entry.media, entry.season, entry.episode)}
            progress={entry.duration ? entry.position / entry.duration : 0}
            label={entry.media.type === 'tv' ? t('common.seasonEpisode', { s: entry.season ?? 1, e: entry.episode ?? 1 }) : undefined}
          />
          {/* Sibling of the card link, so clicking it never navigates. */}
          <button
            type="button"
            onClick={() => remove(entry.media.type, entry.media.id)}
            aria-label={t('home.removeContinue')}
            title={t('home.removeContinue')}
            className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/60 text-white/90 backdrop-blur transition-opacity hover:bg-black/80 hover:text-white lg:opacity-0 lg:group-hover/item:opacity-100 lg:focus-visible:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </RowShell>
  );
}
