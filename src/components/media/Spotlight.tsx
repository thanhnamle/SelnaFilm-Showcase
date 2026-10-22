import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import type { ListQueryOptions } from '@/lib/queries';
import { Play } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useInView } from '@/hooks/useInView';
import { genreNames } from '@/lib/genres';
import { img, mediaPath, watchPath } from '@/lib/media';
import { cn } from '@/lib/utils';
import Img from '@/components/ui/Img';
import Rating, { MetaLine } from '@/components/ui/Rating';
import { buttonClass } from '@/components/ui/button';
import { PAGE_X } from './MediaRow';

/** Large editorial panel: one featured title plus a strip of posters to switch between. */
export default function Spotlight({ title, query }: { title: string; query: ListQueryOptions }) {
  const { t, href, locale } = useI18n();
  const [ref, inView] = useInView<HTMLElement>();
  const { data } = useQuery({ ...query, enabled: inView });
  const items = (data ?? []).filter((m) => m.backdrop && m.poster).slice(0, 10);
  const [index, setIndex] = useState(0);
  const featured = items[Math.min(index, items.length - 1)];

  return (
    <section ref={ref} className={PAGE_X}>
      <h2 className="mb-4 text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
      <div className="relative isolate overflow-hidden rounded-panel bg-surface ring-1 ring-line">
        {featured ? (
          <>
            <Img
              key={featured.id}
              src={img(featured.backdrop, 'w1280')}
              alt=""
              className="absolute inset-0 -z-10 size-full object-cover object-center"
            />
            <div className="absolute inset-0 -z-10 bg-linear-to-r from-surface via-surface/85 to-surface/10" />
            <div className="absolute inset-0 -z-10 bg-linear-to-t from-surface via-transparent to-transparent" />

            <div className="flex min-h-[420px] flex-col justify-between gap-8 p-6 sm:p-8 lg:min-h-[460px] lg:p-12">
              <div key={featured.id} className="max-w-lg animate-rise">
                <h3 className="text-2xl font-extrabold tracking-tight text-balance sm:text-4xl">{featured.title}</h3>
                {featured.subtitle && <p className="mt-1 text-sm text-white/60">{featured.subtitle}</p>}
                <MetaLine
                  className="mt-3 text-white/75"
                  items={[<Rating key="r" value={featured.rating} className="text-white" />, featured.year, ...genreNames(featured.genreIds, locale, 2)]}
                />
                {featured.overview && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/70">{featured.overview}</p>}
                <div className="mt-6 flex gap-3">
                  <Link to={href(watchPath(featured))} className={buttonClass('primary', 'md')}>
                    <Play className="size-4 fill-current" /> {t('common.play')}
                  </Link>
                  <Link to={href(mediaPath(featured))} className={buttonClass('secondary', 'md')}>
                    {t('common.details')}
                  </Link>
                </div>
              </div>

              <div className="scrollbar-none -mx-1 flex gap-2.5 overflow-x-auto px-1 py-2 lg:justify-end">
                {items.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    onMouseEnter={() => setIndex(i)}
                    aria-label={item.title}
                    aria-current={i === index}
                    className={cn(
                      'relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg ring-1 transition-all duration-300 sm:w-20',
                      i === index ? 'ring-2 ring-white' : 'opacity-60 ring-line hover:opacity-100',
                    )}
                  >
                    <Img src={img(item.poster, 'w185')} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="skeleton min-h-[420px]" />
        )}
      </div>
    </section>
  );
}
