import { memo } from 'react';
import { Link } from 'react-router';
import { Play } from 'lucide-react';
import { useI18n } from '@/i18n';
import { backdropSrcSet, img, mediaPath, posterSrcSet, type MediaItem } from '@/lib/media';
import { usePrefetchDetails } from '@/hooks/usePrefetchDetails';
import { cn } from '@/lib/utils';
import Img from '@/components/ui/Img';
import Rating from '@/components/ui/Rating';

export type CardVariant = 'poster' | 'backdrop' | 'top10';

interface MediaCardProps {
  item: MediaItem;
  variant?: CardVariant;
  rank?: number;
  /** Continue-watching progress, 0..1. */
  progress?: number;
  label?: string;
  to?: string;
  className?: string;
}

const POSTER_SIZES = '(min-width: 1280px) 190px, (min-width: 768px) 170px, 150px';

function Fallback({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-linear-to-br from-surface-2 to-surface-3 p-3 text-center text-sm font-semibold text-muted">
      {title}
    </div>
  );
}

function MediaCard({ item, variant = 'poster', rank, progress, label, to, className }: MediaCardProps) {
  const { href } = useI18n();
  const prefetch = usePrefetchDetails(item);
  const link = href(to ?? mediaPath(item));

  if (variant === 'backdrop') {
    const src = item.backdrop ?? item.poster;
    return (
      <Link to={link} {...prefetch} className={cn('group block', className)}>
        <div className="relative aspect-video overflow-hidden rounded-card bg-surface-2 ring-1 ring-line transition-transform duration-300 ease-out-soft group-hover:-translate-y-1">
          {src ? (
            <Img
              src={img(src, 'w780')}
              srcSet={backdropSrcSet(src)}
              sizes="(min-width: 1024px) 340px, 300px"
              alt={item.title}
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <Fallback title={item.title} />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3.5">
            {label && <p className="mb-0.5 text-[11px] font-semibold tracking-wide text-white/70 uppercase">{label}</p>}
            <p className="line-clamp-1 font-semibold text-white">{item.title}</p>
            {progress !== undefined && (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(3, progress * 100)}%` }} />
              </div>
            )}
          </div>
          <span className="absolute top-1/2 left-1/2 grid size-12 -translate-1/2 scale-90 place-items-center rounded-full bg-white/90 text-black opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
            <Play className="ml-0.5 size-5 fill-current" />
          </span>
        </div>
      </Link>
    );
  }

  const poster = (
    <div className="relative aspect-[2/3] overflow-hidden rounded-card bg-surface-2 ring-1 ring-line transition-[transform,box-shadow] duration-300 ease-out-soft group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-12px_rgb(0_0_0/0.8)] group-hover:ring-line-strong">
      {item.poster ? (
        <Img
          src={img(item.poster, 'w342')}
          srcSet={posterSrcSet(item.poster)}
          sizes={POSTER_SIZES}
          alt={item.title}
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <Fallback title={item.title} />
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/80 to-transparent p-2.5 pt-8 text-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <Rating value={item.rating} className="text-white" />
        {item.year && <span className="font-medium text-white/80">{item.year}</span>}
      </div>
    </div>
  );

  if (variant === 'top10') {
    return (
      <Link to={link} {...prefetch} className={cn('group flex items-end', className)}>
        <span
          aria-hidden
          className="-mr-4 translate-y-2 text-[7.5rem] leading-none font-extrabold tracking-tighter text-transparent select-none [-webkit-text-stroke:2px_rgb(255_255_255/0.28)] transition-[-webkit-text-stroke-color] group-hover:[-webkit-text-stroke-color:var(--color-accent)] sm:text-[9rem]"
        >
          {rank}
        </span>
        <div className="relative w-[120px] shrink-0 sm:w-[140px] xl:w-[160px]">{poster}</div>
      </Link>
    );
  }

  return (
    <Link to={link} {...prefetch} className={cn('group block', className)}>
      {poster}
      <div className="mt-2.5 px-0.5">
        <p className="line-clamp-1 text-sm font-medium text-ink/95 transition-colors group-hover:text-ink">{item.title}</p>
        <p className="line-clamp-1 text-xs text-subtle">{item.subtitle ?? item.year ?? ' '}</p>
      </div>
    </Link>
  );
}

export default memo(MediaCard);

export function CardSkeleton({ variant = 'poster', className }: { variant?: CardVariant; className?: string }) {
  if (variant === 'backdrop') return <div className={cn('skeleton aspect-video rounded-card', className)} />;
  return (
    <div className={className}>
      <div className="skeleton aspect-[2/3] rounded-card" />
      {variant === 'poster' && <div className="skeleton mt-2.5 h-3.5 w-3/4 rounded" />}
    </div>
  );
}
