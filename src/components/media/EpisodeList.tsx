import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, Play, Search } from 'lucide-react';
import { useI18n } from '@/i18n';
import { seasonQuery } from '@/lib/queries';
import { img } from '@/lib/media';
import { cn } from '@/lib/utils';
import type { TVSeason } from '@/types/movie';
import Img from '@/components/ui/Img';
import Segmented from '@/components/ui/Segmented';

interface EpisodeListProps {
  tvId: number;
  seasons: TVSeason[];
  season: number;
  onSeasonChange: (season: number) => void;
  currentEpisode?: number;
  /** Narrow single-column layout for the watch page sidebar. */
  compact?: boolean;
}

/** Episodes per range chip in the compact grid ("1 - 100", "101 - 200", …). */
const RANGE = 100;
/** Seasons longer than this open as a number grid in the compact panel. */
const GRID_FROM = 24;

/** "5, 12" matches episodes 5 and 12; anything else matches episode names. */
function matchesQuery(ep: { episode_number: number; name: string }, query: string) {
  const numbers = query.split(/[\s,]+/).filter(Boolean);
  if (numbers.every((n) => /^\d+$/.test(n))) return numbers.includes(String(ep.episode_number));
  return ep.name.toLowerCase().includes(query.toLowerCase());
}

export default function EpisodeList({ tvId, seasons, season, onSeasonChange, currentEpisode, compact }: EpisodeListProps) {
  const { t, href, locale } = useI18n();
  const { data, isPending } = useQuery(seasonQuery(locale, tvId, season));
  const fallbackCount = seasons.find((s) => s.season_number === season)?.episode_count ?? 0;
  const allEpisodes =
    data?.episodes ??
    Array.from({ length: fallbackCount }, (_, i) => ({ id: i, episode_number: i + 1, name: '', overview: '', still_path: null, runtime: null }));

  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>();
  const [picked, setPicked] = useState<{ season: number; range: number }>();
  const layout = compact ? (view ?? (allEpisodes.length > GRID_FROM ? 'grid' : 'list')) : 'list';
  const search = compact ? query.trim() : '';

  // Long seasons are split into ranges; the one holding the current episode opens first.
  const rangeCount = compact && !search ? Math.ceil(allEpisodes.length / RANGE) : 0;
  const currentIndex = allEpisodes.findIndex((ep) => ep.episode_number === currentEpisode);
  const range = picked?.season === season ? picked.range : Math.floor(Math.max(0, currentIndex) / RANGE);
  const episodes = search
    ? allEpisodes.filter((ep) => matchesQuery(ep, search))
    : rangeCount > 1
      ? allEpisodes.slice(range * RANGE, (range + 1) * RANGE)
      : allEpisodes;

  // Keep the current episode in view inside the sidebar (desktop, where the panel scrolls on its own).
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const el = activeRef.current;
    const panel = el?.closest<HTMLElement>('[data-episode-scroll]');
    if (!el || !panel || panel.scrollHeight <= panel.clientHeight) return;
    const box = el.getBoundingClientRect();
    const frame = panel.getBoundingClientRect();
    panel.scrollTop += box.top - frame.top - (frame.height - box.height) / 2;
  }, [currentEpisode, season, layout, data]);

  const seasonPicker =
    seasons.length > 1 &&
    (seasons.length <= 5 && !compact ? (
      <Segmented
        label={t('detail.episodes')}
        value={String(season)}
        onChange={(v) => onSeasonChange(Number(v))}
        options={seasons.map((s) => ({ value: String(s.season_number), label: t('common.season', { n: s.season_number }) }))}
      />
    ) : (
      <select
        value={season}
        onChange={(e) => onSeasonChange(Number(e.target.value))}
        aria-label={t('detail.episodes')}
        className="rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-sm outline-none focus:border-accent"
      >
        {seasons.map((s) => (
          <option key={s.id} value={s.season_number}>
            {t('common.season', { n: s.season_number })} · {s.episode_count}
          </option>
        ))}
      </select>
    ));

  return (
    <section>
      {/* In the watch sidebar the controls stay put while the episodes scroll under them. */}
      <div className={cn(compact ? 'sticky top-0 z-10 -mx-4 mb-1 bg-surface px-4 pt-4 pb-3' : 'mb-4')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">{t('detail.episodes')}</h2>
          {seasonPicker}
        </div>

        {compact && allEpisodes.length > 0 && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-surface-2 px-3.5 py-2 text-sm focus-within:border-accent">
                <Search className="size-4 shrink-0 text-subtle" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('watch.findEpisode')}
                  aria-label={t('watch.findEpisode')}
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-subtle"
                />
              </label>
              <div className="flex shrink-0 rounded-full border border-line bg-surface-2 p-0.5">
                {(
                  [
                    ['grid', LayoutGrid, t('watch.gridView')],
                    ['list', List, t('watch.listView')],
                  ] as const
                ).map(([value, Icon, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setView(value)}
                    aria-pressed={layout === value}
                    aria-label={label}
                    title={label}
                    className={cn(
                      'grid size-8 place-items-center rounded-full transition-colors',
                      layout === value ? 'bg-white text-black' : 'text-muted hover:text-ink',
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>
            </div>

            {rangeCount > 1 && (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: rangeCount }, (_, i) => {
                  const first = allEpisodes[i * RANGE].episode_number;
                  const last = allEpisodes[Math.min(allEpisodes.length, (i + 1) * RANGE) - 1].episode_number;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPicked({ season, range: i })}
                      aria-pressed={range === i}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors',
                        range === i ? 'bg-accent text-white' : 'bg-surface-2 text-muted ring-1 ring-line hover:text-ink',
                      )}
                    >
                      {first} - {last}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {!isPending && allEpisodes.length === 0 ? (
        <p className="py-8 text-sm text-muted">{t('detail.noEpisodes')}</p>
      ) : search && episodes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">{t('watch.noMatch')}</p>
      ) : layout === 'grid' ? (
        <ol className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-5">
          {episodes.map((ep) => {
            const active = ep.episode_number === currentEpisode;
            return (
              <li key={ep.id}>
                <Link
                  ref={active ? activeRef : undefined}
                  to={href(`/watch/tv/${tvId}?s=${season}&e=${ep.episode_number}`)}
                  aria-current={active ? 'true' : undefined}
                  title={ep.name || t('common.episode', { n: ep.episode_number })}
                  className={cn(
                    'grid h-11 place-items-center rounded-lg text-sm font-semibold tabular-nums transition-colors',
                    active
                      ? 'bg-linear-to-br from-accent to-accent-2 text-white shadow-lg shadow-accent/30'
                      : 'bg-surface-2 text-ink/90 ring-1 ring-line hover:bg-surface-3 hover:text-ink',
                  )}
                >
                  {ep.episode_number}
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className={cn('grid gap-2', !compact && 'sm:grid-cols-2 sm:gap-3 xl:grid-cols-3')}>
          {episodes.map((ep) => {
            const active = ep.episode_number === currentEpisode;
            return (
              <li key={ep.id}>
                <Link
                  ref={active ? activeRef : undefined}
                  to={href(`/watch/tv/${tvId}?s=${season}&e=${ep.episode_number}`)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'group flex gap-3 rounded-card p-2 transition-colors',
                    active ? 'bg-white/10 ring-1 ring-accent/60' : 'hover:bg-white/5',
                  )}
                >
                  <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:w-36">
                    {ep.still_path && <Img src={img(ep.still_path, 'w300')} alt="" className="size-full object-cover" />}
                    <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="size-6 fill-white text-white" />
                    </span>
                    {active && <span className="absolute inset-x-0 bottom-0 h-1 bg-accent" />}
                  </div>
                  <div className="min-w-0 py-0.5">
                    <p className={cn('line-clamp-1 text-sm font-semibold', active && 'text-accent')}>
                      {ep.episode_number}. {ep.name || t('common.episode', { n: ep.episode_number })}
                    </p>
                    {ep.runtime ? <p className="text-xs text-subtle">{t('common.minutes', { n: ep.runtime })}</p> : null}
                    {ep.overview && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{ep.overview}</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
