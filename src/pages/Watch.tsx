import { useCallback, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Server, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { detailsQuery, seasonQuery, streamsQuery, type StreamServer } from '@/lib/queries';
import { img, mediaPath, type MediaType } from '@/lib/media';
import { cn } from '@/lib/utils';
import { useContinueStore } from '@/store/useContinueStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEmbedProgress } from '@/hooks/useEmbedProgress';
import VideoPlayer from '@/components/watch/VideoPlayer';
import EpisodeNav from '@/components/watch/EpisodeNav';
import EpisodeList from '@/components/media/EpisodeList';
import MediaCard from '@/components/media/MediaCard';
import Rating, { MetaLine } from '@/components/ui/Rating';
import { MediaRow, PAGE_X } from '@/components/media/MediaRow';

function PlayerMessage({ title, desc, spinning }: { title: string; desc?: string; spinning?: boolean }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-surface p-6 text-center">
      <div className="max-w-sm">
        {spinning ? (
          <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-white/15 border-t-accent" />
        ) : (
          <AlertCircle className="mx-auto mb-4 size-10 text-subtle" />
        )}
        <p className="font-semibold">{title}</p>
        {desc && <p className="mt-1.5 text-sm text-muted">{desc}</p>}
      </div>
    </div>
  );
}

function WatchView({ type, id }: { type: MediaType; id: string }) {
  const { t, href, locale } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const season = Number(params.get('s')) || 1;
  const requested = Number(params.get('e')) || 1;

  const details = useQuery(detailsQuery(locale, type, id));
  const data = details.data;
  const seasonData = useQuery({ ...seasonQuery(locale, id, season), enabled: type === 'tv' });
  const seasonEpisodes = seasonData.data?.episodes ?? [];

  // TMDB numbers some long anime across seasons (Shippuden's season 2 runs 33–53), while links
  // built from counts (next season, season picker) say e=1: those are read as a position instead.
  let index = seasonEpisodes.findIndex((ep) => ep.episode_number === requested);
  if (index < 0 && requested <= seasonEpisodes.length) index = requested - 1;
  const episode = seasonEpisodes[index]?.episode_number ?? requested;
  const position = index >= 0 ? index + 1 : requested;

  // Episodes of earlier seasons (specials excluded) + this one.
  const absolute =
    type === 'tv' && data
      ? data.seasons.filter((s) => s.season_number < season).reduce((n, s) => n + s.episode_count, 0) + position
      : undefined;
  const streamArgs = { type, id, titles: data?.lookupTitles ?? [], year: data?.media.year, season, episode: position, absolute };
  const streams = useQuery({
    ...streamsQuery(streamArgs),
    // Wait for the season so the episode's position is known.
    enabled: streamArgs.titles.length > 0 && (type !== 'tv' || !seasonData.isPending),
  });
  const servers = useMemo(() => streams.data ?? [], [streams.data]);

  const [chosen, setChosen] = useState<string | null>(null);
  // Failures are remembered per episode: a server that broke on E3 may work on E4.
  const [failedKeys, setFailedKeys] = useState<Set<string>>(() => new Set());
  const isFailed = (serverId: string) => failedKeys.has(`${season}:${episode}:${serverId}`);
  const active: StreamServer | undefined =
    servers.find((s) => s.id === chosen && !isFailed(s.id)) ?? servers.find((s) => !isFailed(s.id));

  const saved = useContinueStore((s) => s.entries[`${type}:${id}`]);
  const save = useContinueStore((s) => s.save);
  // Resume only when the saved entry is this exact episode.
  const startAt = saved && (type === 'movie' || (saved.season === season && saved.episode === episode)) ? saved.position : 0;

  const currentSeason = data?.seasons.find((s) => s.season_number === season);
  // Neighbours by position; another season is entered by position too (e=1 / e=count).
  const nextNumber = index >= 0 ? seasonEpisodes[index + 1]?.episode_number : undefined;
  const prevNumber = index > 0 ? seasonEpisodes[index - 1]?.episode_number : undefined;
  const nextHref = useMemo(() => {
    if (type !== 'tv' || !data) return undefined;
    if (nextNumber) return `/watch/tv/${id}?s=${season}&e=${nextNumber}`;
    if (index < 0 && currentSeason && episode < currentSeason.episode_count) return `/watch/tv/${id}?s=${season}&e=${episode + 1}`;
    const nextSeason = data.seasons.find((s) => s.season_number > season);
    return nextSeason ? `/watch/tv/${id}?s=${nextSeason.season_number}&e=1` : undefined;
  }, [type, data, nextNumber, index, currentSeason, episode, season, id]);

  const prevHref = useMemo(() => {
    if (type !== 'tv' || !data) return undefined;
    if (prevNumber) return `/watch/tv/${id}?s=${season}&e=${prevNumber}`;
    if (index < 0 && episode > 1) return `/watch/tv/${id}?s=${season}&e=${episode - 1}`;
    const prevSeason = [...data.seasons].reverse().find((s) => s.season_number < season);
    return prevSeason ? `/watch/tv/${id}?s=${prevSeason.season_number}&e=${prevSeason.episode_count}` : undefined;
  }, [type, data, prevNumber, index, episode, season, id]);

  const onProgress = useCallback(
    (position: number, duration: number) => {
      if (data) save({ media: data.media, season: type === 'tv' ? season : undefined, episode: type === 'tv' ? episode : undefined, position, duration });
    },
    [data, save, type, season, episode],
  );

  // Runtime for the progress estimate: the episode's own runtime when TMDB has it.
  const runtimeMinutes =
    (type === 'tv' ? seasonData.data?.episodes.find((ep) => ep.episode_number === episode)?.runtime : undefined) ??
    data?.runtime ??
    (type === 'tv' ? 45 : 110);

  useEmbedProgress({
    enabled: active?.kind === 'embed',
    media: data?.media,
    season: type === 'tv' ? season : undefined,
    episode: type === 'tv' ? episode : undefined,
    duration: runtimeMinutes * 60,
    startAt,
  });

  // "T4 · Episode name" in this season, or "Season 2 · Episode 1" when the next one starts a new season.
  const nextLabel = useMemo(() => {
    if (!nextHref) return undefined;
    const next = new URLSearchParams(nextHref.split('?')[1]);
    const s = Number(next.get('s'));
    const e = Number(next.get('e'));
    if (s !== season) return `${t('common.season', { n: s })} · ${t('common.episode', { n: e })}`;
    const name = seasonData.data?.episodes.find((ep) => ep.episode_number === e)?.name;
    return name ? `${t('common.episode', { n: e })} · ${name}` : t('common.episode', { n: e });
  }, [nextHref, season, seasonData.data, t]);

  const onFatal = useCallback(() => {
    if (active) setFailedKeys((prev) => new Set(prev).add(`${season}:${episode}:${active.id}`));
  }, [active, season, episode]);

  const onEnded = useCallback(() => {
    if (nextHref) navigate(href(nextHref));
  }, [nextHref, navigate, href]);

  useDocumentTitle(data ? (type === 'tv' ? `${data.media.title} · ${t('common.seasonEpisode', { s: season, e: episode })}` : data.media.title) : undefined);

  const subtitle = type === 'tv' ? `${t('common.season', { n: season })} · ${t('common.episode', { n: episode })}` : undefined;

  let stage;
  if (details.isPending || (type === 'tv' && seasonData.isPending) || (streams.isPending && streams.fetchStatus !== 'idle')) {
    stage = <PlayerMessage spinning title={t('watch.finding')} />;
  } else if (!servers.length) {
    stage = <PlayerMessage title={t('watch.unavailableTitle')} desc={t('watch.unavailableDesc')} />;
  } else if (!active) {
    stage = <PlayerMessage title={t('watch.allFailed')} />;
  } else if (active.kind === 'hls') {
    stage = (
      <VideoPlayer
        key={`${active.id}-${season}-${episode}`}
        src={active.url}
        title={data?.media.title ?? ''}
        subtitle={subtitle}
        poster={img(data?.media.backdrop, 'w1280')}
        startAt={startAt}
        prevHref={prevHref}
        nextHref={nextHref}
        onProgress={onProgress}
        onEnded={onEnded}
        onFatal={onFatal}
      />
    );
  } else {
    stage = (
      <iframe
        key={active.id}
        src={active.url}
        title={data?.media.title ?? 'Player'}
        className="absolute inset-0 size-full border-0"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      />
    );
  }

  return (
    <div className="pt-16">
      {/* Theater: the player fills the screen under the navbar, episodes on the right. */}
      <div className="grid bg-black lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="relative aspect-video w-full lg:aspect-auto lg:h-[calc(100dvh-4rem)]">{stage}</div>

        <aside className="flex min-w-0 flex-col bg-surface lg:h-[calc(100dvh-4rem)] lg:border-l lg:border-line">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate font-bold">{data?.media.title}</p>
              <p className="truncate text-xs text-subtle">{data?.media.subtitle || data?.media.year}</p>
            </div>
            <Link
              to={href(mediaPath({ type, id: Number(id) }))}
              aria-label={t('common.back')}
              title={t('common.back')}
              className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-ink"
            >
              <X className="size-5" />
            </Link>
          </div>

          <div data-episode-scroll className="min-h-0 flex-1 px-4 pb-4 lg:overflow-y-auto">
            {type === 'tv' && data && data.seasons.length > 0 ? (
              <EpisodeList
                compact
                tvId={data.media.id}
                seasons={data.seasons}
                season={season}
                currentEpisode={episode}
                onSeasonChange={(s) => navigate(href(`/watch/tv/${id}?s=${s}&e=1`), { replace: true })}
              />
            ) : (
              data && (
                <div className="pt-4">
                  <h2 className="mb-3 font-bold">{t('watch.upNext')}</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {data.related.slice(0, 4).map((item) => (
                      <MediaCard key={item.id} item={item} variant="backdrop" />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </aside>
      </div>

      <div className={cn('mx-auto max-w-[1680px]', PAGE_X)}>
        {/* Our own player has prev / next on its edges; embeds need them here. */}
        {active?.kind !== 'hls' && <EpisodeNav prevHref={prevHref} nextHref={nextHref} nextLabel={nextLabel} />}

        {servers.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 flex items-center gap-1.5 text-sm text-muted">
              <Server className="size-4" /> {t('watch.servers')}
            </span>
            {servers.map((server) => (
              <button
                key={server.id}
                type="button"
                disabled={isFailed(server.id)}
                onClick={() => setChosen(server.id)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors disabled:line-through disabled:opacity-40',
                  active?.id === server.id ? 'border-white bg-white text-black' : 'border-line bg-white/5 text-muted hover:text-ink',
                )}
              >
                {server.name}
              </button>
            ))}
          </div>
        )}

        {data && (
          <div className="mt-8 flex gap-5">
            {data.media.poster && (
              <img src={img(data.media.poster, 'w185')} alt="" className="hidden aspect-[2/3] w-24 shrink-0 rounded-xl object-cover ring-1 ring-line sm:block" />
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{data.media.title}</h1>
              {data.media.subtitle && <p className="text-sm text-subtle">{data.media.subtitle}</p>}
              <MetaLine className="mt-2" items={[<Rating key="r" value={data.media.rating} />, data.media.year, subtitle, ...data.genres.slice(0, 2).map((g) => g.name)]} />
              {data.media.overview && <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-relaxed text-muted">{data.media.overview}</p>}
            </div>
          </div>
        )}

        {data && type === 'tv' && (
          <div className="-mx-4 mt-14 sm:-mx-6 lg:-mx-10">
            <MediaRow title={t('detail.recommended')} items={data.related} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Watch() {
  const { type, id = '' } = useParams();
  const { href } = useI18n();
  if ((type !== 'movie' && type !== 'tv') || !/^\d+$/.test(id)) return <Navigate to={href('/')} replace />;
  return <WatchView key={`${type}-${id}`} type={type} id={id} />;
}
