import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useInView } from '@/hooks/useInView';
import type { MediaItem } from '@/lib/media';
import { cn } from '@/lib/utils';
import MediaCard, { CardSkeleton } from './MediaCard';

export const GRID = 'grid grid-cols-2 gap-x-3 gap-y-6 min-[480px]:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7';

interface MediaGridProps {
  items: MediaItem[];
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

/** Poster grid; keeps loading pages as the user nears the bottom. */
export default function MediaGrid({ items, loading, hasMore, loadingMore, onLoadMore, className }: MediaGridProps) {
  const { t } = useI18n();
  const [sentinel, nearEnd] = useInView<HTMLDivElement>('800px', false);

  useEffect(() => {
    if (nearEnd && hasMore && !loadingMore) onLoadMore?.();
  }, [nearEnd, hasMore, loadingMore, onLoadMore, items.length]);

  if (loading) {
    return (
      <div className={cn(GRID, className)}>
        {Array.from({ length: 14 }, (_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <>
      <div className={cn(GRID, className)}>
        {items.map((item, i) => (
          <MediaCard key={`${item.type}-${item.id}-${i}`} item={item} />
        ))}
      </div>
      {hasMore && (
        <div ref={sentinel} className="flex justify-center py-10">
          {loadingMore ? (
            <Loader2 className="size-6 animate-spin text-muted" />
          ) : (
            <button type="button" onClick={onLoadMore} className="rounded-full border border-line px-5 py-2 text-sm text-muted hover:text-ink">
              {t('common.loadMore')}
            </button>
          )}
        </div>
      )}
    </>
  );
}
