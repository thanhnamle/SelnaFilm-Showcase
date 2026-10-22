import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Play } from 'lucide-react';
import { useI18n } from '@/i18n';
import { detailsQuery } from '@/lib/queries';
import { genreNames } from '@/lib/genres';
import { img, mediaPath, type MediaItem } from '@/lib/media';
import { useResume } from '@/hooks/useResume';
import { cn } from '@/lib/utils';
import Img from '@/components/ui/Img';
import Rating, { MetaLine } from '@/components/ui/Rating';
import MyListButton from '@/components/ui/MyListButton';
import { buttonClass } from '@/components/ui/button';

const SLIDE_SECONDS = 8;

function HeroContent({ item }: { item: MediaItem }) {
  const { t, href, locale } = useI18n();
  const { data } = useQuery(detailsQuery(locale, item.type, item.id));
  const resume = useResume(item);
  const genres = genreNames(item.genreIds, locale, 2);

  return (
    <div key={item.id} className="max-w-xl animate-rise">
      {data?.logo ? (
        <img
          src={img(data.logo, 'w500')}
          alt={item.title}
          className="mb-5 max-h-24 w-auto max-w-[78%] animate-fade-in object-contain object-left drop-shadow-[0_4px_24px_rgb(0_0_0/0.6)] sm:max-h-32"
        />
      ) : (
        <h1 className="mb-4 text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">{item.title}</h1>
      )}
      <MetaLine
        className="mb-4 text-white/80"
        items={[<Rating key="r" value={item.rating} className="text-white" />, item.year, item.type === 'movie' ? t('common.movie') : t('common.tv'), ...genres]}
      />
      {item.overview && <p className="mb-7 line-clamp-3 max-w-lg text-[15px] leading-relaxed text-white/75">{item.overview}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Link to={href(resume.to)} className={buttonClass('primary', 'lg')}>
          <Play className="size-5 fill-current" />
          {resume.resumable ? t('common.resume') : t('common.play')}
        </Link>
        <Link to={href(mediaPath(item))} className={buttonClass('secondary', 'lg')}>
          <Info className="size-5" />
          {t('common.details')}
        </Link>
        <MyListButton item={item} compact />
      </div>
    </div>
  );
}

export default function HeroCarousel({ items }: { items?: MediaItem[] }) {
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const slides = useMemo(() => (items ?? []).filter((m) => m.backdrop).slice(0, 6), [items]);
  const [index, setIndex] = useState(0);
  // Only slides that have been shown keep an <img>, so the hero downloads one backdrop up front.
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const active = slides[index];

  useEffect(() => {
    setVisited((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
    const next = slides[(index + 1) % slides.length];
    if (next) {
      void queryClient.prefetchQuery(detailsQuery(locale, next.type, next.id));
      new Image().src = img(next.backdrop, 'w1280') ?? '';
    }
  }, [index, slides, queryClient, locale]);

  if (!active) {
    return <div className="skeleton h-[72vh] min-h-[480px] w-full rounded-none" />;
  }

  return (
    <section className="group/hero relative h-[76vh] min-h-[520px] w-full overflow-hidden lg:h-[86vh] lg:max-h-[900px]" aria-roledescription="carousel">
      {slides.map((slide, i) =>
        visited.has(i) ? (
          <Img
            key={slide.id}
            priority={i === 0}
            src={img(slide.backdrop, 'w1280')}
            srcSet={`${img(slide.backdrop, 'w780')} 780w, ${img(slide.backdrop, 'w1280')} 1280w, ${img(slide.backdrop, 'original')} 1920w`}
            sizes="100vw"
            className={cn(
              'absolute inset-0 size-full object-cover object-[center_20%] transition-[opacity,transform] duration-[1200ms] ease-out-soft',
              i === index ? 'scale-100 !opacity-100' : 'scale-105 !opacity-0',
            )}
          />
        ) : null,
      )}

      <div className="absolute inset-0 bg-linear-to-r from-canvas via-canvas/60 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-canvas via-canvas/20 to-black/30" />

      <div className="relative mx-auto flex h-full max-w-[1680px] items-end px-4 pb-20 sm:px-6 sm:pb-24 lg:px-10 lg:pb-28">
        <HeroContent item={active} />
      </div>

      {slides.length > 1 && (
        <div className="absolute right-4 bottom-8 flex gap-1.5 sm:right-6 lg:right-10 lg:bottom-12">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={slide.title}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className="group/dot relative h-1 w-6 overflow-hidden rounded-full bg-white/25 transition-[width] duration-300 aria-[current=true]:w-12"
            >
              {i === index && (
                <span
                  key={index}
                  className="progress-fill absolute inset-0 rounded-full bg-white group-hover/hero:[animation-play-state:paused]"
                  style={{ ['--duration' as string]: `${SLIDE_SECONDS}s` }}
                  onAnimationEnd={() => setIndex((index + 1) % slides.length)}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
