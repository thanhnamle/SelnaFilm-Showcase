import { Link } from 'react-router';
import { ChevronLeft, SkipForward } from 'lucide-react';
import { useI18n } from '@/i18n';
import { buttonClass } from '@/components/ui/button';

interface EpisodeNavProps {
  prevHref?: string;
  nextHref?: string;
  /** e.g. "T4 · Bí mật được giữ kín" — what the next button leads to. */
  nextLabel?: string;
}

/** Prev / next episode right under the player — embeds can't tell us when an episode ends. */
export default function EpisodeNav({ prevHref, nextHref, nextLabel }: EpisodeNavProps) {
  const { t, href } = useI18n();
  if (!prevHref && !nextHref) return null;

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      {prevHref ? (
        <Link to={href(prevHref)} replace aria-label={t('watch.prevEpisode')} className={buttonClass('secondary', 'md')}>
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">{t('watch.prevEpisode')}</span>
        </Link>
      ) : (
        <span />
      )}
      {nextHref && (
        <Link to={href(nextHref)} replace className={buttonClass('primary', 'md', 'min-w-0 max-w-[75%]')}>
          <span className="flex min-w-0 flex-col items-start leading-tight">
            <span>{t('watch.nextEpisode')}</span>
            {nextLabel && <span className="max-w-full truncate text-[11px] font-medium text-black/60">{nextLabel}</span>}
          </span>
          <SkipForward className="size-4 shrink-0 fill-current" />
        </Link>
      )}
    </div>
  );
}
