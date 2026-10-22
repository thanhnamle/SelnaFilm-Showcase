import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import type { ListQueryOptions } from '@/lib/queries';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useInView } from '@/hooks/useInView';
import type { MediaItem } from '@/lib/media';
import { cn } from '@/lib/utils';
import MediaCard, { CardSkeleton, type CardVariant } from './MediaCard';

export const PAGE_X = 'px-4 sm:px-6 lg:px-10';

const ITEM_WIDTH: Record<CardVariant, string> = {
  poster: 'w-[140px] sm:w-[150px] md:w-[170px] xl:w-[190px]',
  backdrop: 'w-[270px] sm:w-[300px] lg:w-[340px]',
  top10: '',
};

interface RowShellProps {
  title: string;
  action?: ReactNode;
  seeAllTo?: string;
  children: ReactNode;
}

/** Section title + horizontally scrolling track with arrow buttons. */
export function RowShell({ title, action, seeAllTo, children }: RowShellProps) {
  const { t, href } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    updateEdges();
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateEdges, children]);

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const arrow = 'absolute top-0 bottom-10 z-10 hidden w-10 place-items-center text-white opacity-0 transition-opacity group-hover/row:opacity-100 disabled:!opacity-0 md:grid lg:w-12';

  return (
    <section className="group/row relative">
      <div className={cn('mb-3 flex items-center gap-3 sm:mb-4', PAGE_X)}>
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
        {action}
        {seeAllTo && (
          <Link to={href(seeAllTo)} className="ml-auto flex items-center gap-0.5 text-sm text-muted transition-colors hover:text-ink">
            {t('common.seeAll')} <ChevronRight className="size-4" />
          </Link>
        )}
      </div>

      <div className="relative">
        <button type="button" aria-label="Previous" disabled={edges.start} onClick={() => scroll(-1)} className={cn(arrow, 'left-0 bg-linear-to-r from-canvas to-transparent')}>
          <ChevronLeft className="size-7" />
        </button>
        <div
          ref={trackRef}
          onScroll={updateEdges}
          className={cn('scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto pt-1 pb-3 sm:gap-4', PAGE_X, 'scroll-px-4 sm:scroll-px-6 lg:scroll-px-10')}
        >
          {children}
        </div>
        <button type="button" aria-label="Next" disabled={edges.end} onClick={() => scroll(1)} className={cn(arrow, 'right-0 bg-linear-to-l from-canvas to-transparent')}>
          <ChevronRight className="size-7" />
        </button>
      </div>
    </section>
  );
}

interface MediaRowProps {
  title: string;
  items?: MediaItem[];
  loading?: boolean;
  variant?: CardVariant;
  action?: ReactNode;
  seeAllTo?: string;
  limit?: number;
}

export function MediaRow({ title, items, loading, variant = 'poster', action, seeAllTo, limit = 20 }: MediaRowProps) {
  if (!loading && !items?.length) return null;
  const list = (items ?? []).slice(0, variant === 'top10' ? 10 : limit);

  return (
    <RowShell title={title} action={action} seeAllTo={seeAllTo}>
      {loading
        ? Array.from({ length: 8 }, (_, i) => (
            <CardSkeleton key={i} variant={variant} className={cn('shrink-0', ITEM_WIDTH[variant] || 'w-[220px]')} />
          ))
        : list.map((item, i) => (
            <div key={`${item.type}-${item.id}`} className={cn('shrink-0 snap-start', ITEM_WIDTH[variant])}>
              <MediaCard item={item} variant={variant} rank={i + 1} />
            </div>
          ))}
    </RowShell>
  );
}

/** A row that only fetches once it is about to scroll into view. */
export function QueryRow({ query, eager, ...props }: Omit<MediaRowProps, 'items' | 'loading'> & { query: ListQueryOptions; eager?: boolean }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const { data, isPending } = useQuery({ ...query, enabled: eager || inView });
  return (
    <div ref={ref} className={cn('[contain-intrinsic-size:auto_320px] [content-visibility:auto]', isPending && 'min-h-[300px]')}>
      <MediaRow {...props} items={data} loading={isPending} />
    </div>
  );
}
