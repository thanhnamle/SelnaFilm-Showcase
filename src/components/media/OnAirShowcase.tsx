import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Info, Play } from 'lucide-react';
import type { ListQueryOptions } from '@/lib/queries';
import { useI18n } from '@/i18n';
import { useInView } from '@/hooks/useInView';
import { usePrefetchDetails } from '@/hooks/usePrefetchDetails';
import { genreNames } from '@/lib/genres';
import { backdropSrcSet, img, mediaPath, watchPath, type MediaItem } from '@/lib/media';
import { cn } from '@/lib/utils';
import Img from '@/components/ui/Img';
import Rating, { MetaLine } from '@/components/ui/Rating';
import Segmented from '@/components/ui/Segmented';
import { buttonClass } from '@/components/ui/button';
import { PAGE_X } from './MediaRow';

const COUNT = 5;

interface OnAirShowcaseProps {
  title: string;
  tabs: { value: string; label: string; query: ListQueryOptions; seeAllTo?: string }[];
}

function ChartRow({ item, rank, active, onPreview }: { item: MediaItem; rank: number; active: boolean; onPreview: () => void }) {
  const { href, locale } = useI18n();
  const prefetch = usePrefetchDetails(item);
  const genres = genreNames(item.genreIds, locale, 2);

  return (
    <Link
      to={href(mediaPath(item))}
      {...prefetch}
      onMouseEnter={onPreview}
      onFocus={onPreview}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-card p-2 pr-3 ring-1 transition-[background-color,box-shadow] duration-300',
        active ? 'bg-surface-2 ring-line-strong' : 'ring-transparent hover:bg-surface',
      )}
    >
      <span className={cn('w-7 shrink-0 text-center text-2xl font-extrabold tabular-nums transition-colors', active ? 'text-gradient' : 'text-subtle')}>
        {rank}
      </span>
      <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-surface-3 sm:w-32">
        <Img src={img(item.backdrop, 'w300')} alt="" className="absolute inset-0 size-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 font-semibold">{item.title}</p>
        <p className="line-clamp-1 text-xs text-subtle">{genres.length ? genres.join(' · ') : item.subtitle}</p>
        <p className="mt-1 flex items-center gap-2 text-xs text-muted">
          <Rating value={item.rating} />
          {item.year && <span>{item.year}</span>}
        </p>
      </div>
      <ChevronRight className={cn('size-4 shrink-0 text-muted transition-opacity', active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')} />
    </Link>
  );
}

/** "On air now": one featured series beside a numbered chart; hovering the chart swaps the feature. */
export default function OnAirShowcase({ title, tabs }: OnAirShowcaseProps) {
  const { t, href, locale } = useI18n();
  const [ref, inView] = useInView<HTMLElement>();
  const [value, setValue] = useState(tabs[0].value);
  const [index, setIndex] = useState(0);
  const tab = tabs.find((x) => x.value === value) ?? tabs[0];
  const { data } = useQuery({ ...tab.query, enabled: inView });
  const items = (data ?? []).filter((m) => m.backdrop).slice(0, COUNT);
  const featured = items[Math.min(index, items.length - 1)];

  return (
    <section ref={ref} className={PAGE_X}>
      <div className="mb-3 flex flex-wrap items-center gap-3 sm:mb-4">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
        <Segmented
          label={title}
          value={value}
          onChange={(v) => {
            setValue(v);
            setIndex(0);
          }}
          options={tabs.map(({ value: v, label }) => ({ value: v, label }))}
        />
        {tab.seeAllTo && (
          <Link to={href(tab.seeAllTo)} className="ml-auto flex items-center gap-0.5 text-sm text-muted transition-colors hover:text-ink">
            {t('common.seeAll')} <ChevronRight className="size-4" />
          </Link>
        )}
      </div>

      {featured ? (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-4">
          <div className="group relative isolate flex min-h-80 overflow-hidden rounded-panel bg-surface ring-1 ring-line sm:min-h-95">
            <Img
              key={featured.id}
              src={img(featured.backdrop, 'w1280')}
              srcSet={backdropSrcSet(featured.backdrop)}
              sizes="(min-width: 1024px) 60vw, 100vw"
              alt=""
              className="absolute inset-0 -z-10 size-full object-cover transition-[opacity,transform] duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 -z-10 bg-linear-to-t from-black via-black/50 to-black/5" />
            <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/75 via-black/20 to-transparent" />
            {/* The picture itself opens the details; the buttons below sit above this link. */}
            <Link to={href(mediaPath(featured))} aria-hidden tabIndex={-1} className="absolute inset-0" />

            <span className="pointer-events-none absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-[11px] font-bold tracking-wider text-white uppercase ring-1 ring-white/15 backdrop-blur-md sm:top-5 sm:left-5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-2 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-accent-2" />
              </span>
              {t('home.onAir')}
            </span>

            <div key={featured.id} className="pointer-events-none relative mt-auto max-w-xl animate-rise p-5 sm:p-7">
              <h3 className="text-2xl font-extrabold tracking-tight text-balance text-white drop-shadow sm:text-4xl">{featured.title}</h3>
              {featured.subtitle && <p className="mt-1 text-sm text-white/60">{featured.subtitle}</p>}
              <MetaLine
                className="mt-3 text-white/75"
                items={[<Rating key="r" value={featured.rating} className="text-white" />, featured.year, ...genreNames(featured.genreIds, locale, 2)]}
              />
              {featured.overview && <p className="mt-3 hidden text-sm leading-relaxed text-white/70 sm:line-clamp-2">{featured.overview}</p>}
              <div className="pointer-events-auto mt-5 flex gap-3">
                <Link to={href(watchPath(featured))} className={buttonClass('primary', 'md')}>
                  <Play className="size-4 fill-current" /> {t('common.play')}
                </Link>
                <Link to={href(mediaPath(featured))} className={buttonClass('secondary', 'md')}>
                  <Info className="size-4" /> {t('common.details')}
                </Link>
              </div>
            </div>
          </div>

          <ol className="flex flex-col justify-between gap-1.5">
            {items.map((item, i) => (
              <li key={`${item.type}-${item.id}`}>
                <ChartRow item={item} rank={i + 1} active={item === featured} onPreview={() => setIndex(i)} />
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-4">
          <div className="skeleton min-h-80 rounded-panel sm:min-h-95" />
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: COUNT }, (_, i) => (
              <div key={i} className="skeleton h-20 rounded-card" />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
