import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Clapperboard, Play } from 'lucide-react';
import { useI18n } from '@/i18n';
import { detailsQuery } from '@/lib/queries';
import { img, type MediaType } from '@/lib/media';
import { HttpError } from '@/lib/tmdb';
import { cn } from '@/lib/utils';
import { useResume } from '@/hooks/useResume';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import Img from '@/components/ui/Img';
import Rating, { MetaLine } from '@/components/ui/Rating';
import MyListButton from '@/components/ui/MyListButton';
import TrailerDialog from '@/components/ui/TrailerDialog';
import { buttonClass } from '@/components/ui/button';
import EpisodeList from '@/components/media/EpisodeList';
import CastRow from '@/components/media/CastRow';
import InfoPanel, { useRuntimeLabel } from '@/components/media/InfoPanel';
import { MediaRow, PAGE_X } from '@/components/media/MediaRow';
import NotFound from './NotFound';

function DetailSkeleton() {
  return (
    <div className="relative h-[70vh] min-h-[520px]">
      <div className="skeleton absolute inset-0 opacity-40" />
      <div className={cn('absolute inset-x-0 bottom-16 mx-auto max-w-[1680px] space-y-4', PAGE_X)}>
        <div className="skeleton h-12 w-2/3 max-w-lg rounded-xl" />
        <div className="skeleton h-4 w-64 rounded" />
        <div className="skeleton h-20 w-full max-w-2xl rounded-xl" />
      </div>
    </div>
  );
}

export default function DetailPage({ type }: { type: MediaType }) {
  const { id = '' } = useParams();
  const { t, href, locale } = useI18n();
  const { data, isPending, error } = useQuery(detailsQuery(locale, type, id));
  const runtime = useRuntimeLabel();
  const [trailerOpen, setTrailerOpen] = useState(false);
  const resume = useResume({ type, id: Number(id) });
  const [season, setSeason] = useState<number | null>(null);
  useDocumentTitle(data?.media.title);

  if (isPending) return <DetailSkeleton />;
  if (error || !data) {
    if (error instanceof HttpError && error.status === 404) return <NotFound message={t('detail.notFound')} />;
    throw error;
  }

  const { media } = data;
  const activeSeason = season ?? resume.entry?.season ?? data.seasons[0]?.season_number ?? 1;

  return (
    <>
      <section className="relative isolate min-h-[600px] overflow-hidden lg:min-h-[78vh]">
        {media.backdrop && (
          <Img
            priority
            src={img(media.backdrop, 'w1280')}
            srcSet={`${img(media.backdrop, 'w780')} 780w, ${img(media.backdrop, 'w1280')} 1280w, ${img(media.backdrop, 'original')} 1920w`}
            sizes="100vw"
            alt=""
            className="absolute inset-0 -z-10 size-full object-cover object-[center_20%]"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-canvas via-canvas/75 to-canvas/10" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-canvas via-canvas/30 to-black/40" />

        <div className={cn('mx-auto flex min-h-[600px] max-w-[1680px] items-end gap-10 pt-28 pb-14 lg:min-h-[78vh] lg:pb-20', PAGE_X)}>
          {media.poster && (
            <div className="hidden w-[220px] shrink-0 overflow-hidden rounded-panel shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9)] ring-1 ring-line md:block xl:w-[260px]">
              <Img priority src={img(media.poster, 'w500')} alt={media.title} className="aspect-[2/3] w-full object-cover" />
            </div>
          )}

          <div className="max-w-2xl animate-rise">
            {data.logo ? (
              <img src={img(data.logo, 'w500')} alt={media.title} className="mb-4 max-h-28 w-auto max-w-[80%] object-contain object-left drop-shadow-[0_4px_24px_rgb(0_0_0/0.6)]" />
            ) : (
              <h1 className="mb-2 text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">{media.title}</h1>
            )}
            {media.subtitle && <p className="mb-3 text-white/60">{media.subtitle}</p>}
            {data.tagline && <p className="mb-4 text-lg text-white/80 italic">{data.tagline}</p>}

            <MetaLine
              className="mb-5 text-white/80"
              items={[
                <Rating key="r" value={media.rating} className="text-white" />,
                media.year,
                type === 'movie' ? runtime(data.runtime) : data.seasonCount && t('common.seasons', { n: data.seasonCount }),
                ...data.genres.slice(0, 3).map((g) => g.name),
              ]}
            />

            {media.overview && <p className="mb-8 line-clamp-5 text-[15px] leading-relaxed text-white/75 md:line-clamp-none">{media.overview}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <Link to={href(resume.to)} className={buttonClass('primary', 'lg')}>
                <Play className="size-5 fill-current" />
                {resume.resumable
                  ? type === 'tv'
                    ? `${t('common.resume')} · ${t('common.seasonEpisode', { s: resume.entry?.season ?? 1, e: resume.entry?.episode ?? 1 })}`
                    : t('common.resume')
                  : t('common.play')}
              </Link>
              {data.trailerKey && (
                <button type="button" onClick={() => setTrailerOpen(true)} className={buttonClass('secondary', 'lg')}>
                  <Clapperboard className="size-5" />
                  {t('common.trailer')}
                </button>
              )}
              <MyListButton item={media} />
            </div>
          </div>
        </div>
      </section>

      <div className={cn('mx-auto grid max-w-[1680px] gap-12 lg:grid-cols-[minmax(0,1fr)_320px]', PAGE_X)}>
        <div className="min-w-0 space-y-12">
          {type === 'tv' && data.seasons.length > 0 && (
            <EpisodeList
              tvId={media.id}
              seasons={data.seasons}
              season={activeSeason}
              onSeasonChange={setSeason}
              currentEpisode={resume.entry?.season === activeSeason ? resume.entry.episode : undefined}
            />
          )}
          <CastRow cast={data.cast} />
        </div>
        <InfoPanel details={data} />
      </div>

      <div className="mt-14">
        <MediaRow title={t('detail.recommended')} items={data.related} />
      </div>

      <TrailerDialog videoKey={data.trailerKey} open={trailerOpen} onClose={() => setTrailerOpen(false)} />
    </>
  );
}
