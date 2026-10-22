import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { discoverQuery, type DiscoverSort } from '@/lib/queries';
import { genresFor } from '@/lib/genres';
import { countriesFor, isCountry } from '@/lib/countries';
import type { MediaType } from '@/lib/media';
import { cn } from '@/lib/utils';
import MediaGrid from '@/components/media/MediaGrid';
import { PAGE_X } from '@/components/media/MediaRow';
import Segmented from '@/components/ui/Segmented';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const SORTS: DiscoverSort[] = ['popularity.desc', 'vote_average.desc', 'date.desc'];

export default function BrowsePage({ type }: { type: MediaType }) {
  const { t, locale } = useI18n();
  const [params, setParams] = useSearchParams();
  const genre = Number(params.get('genre')) || null;
  const sort = (SORTS.find((s) => s === params.get('sort')) ?? 'popularity.desc') as DiscoverSort;
  const countryParam = params.get('country');
  const country = isCountry(countryParam) ? countryParam : null;
  const genres = useMemo(() => genresFor(type, locale), [type, locale]);
  const countries = useMemo(() => countriesFor(locale), [locale]);
  const countryName = countries.find((c) => c.code === country)?.name;
  const title = type === 'movie' ? t('browse.moviesTitle') : t('browse.tvTitle');
  useDocumentTitle(countryName ? `${title} · ${countryName}` : title);

  const query = useInfiniteQuery(discoverQuery(locale, type, { genre, country, sort }));
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  // Edits made before the URL re-renders (two quick clicks) build on each other instead of
  // the stale `params` — React Router's functional setter also receives the stale value.
  const pending = useRef<URLSearchParams | null>(null);
  useEffect(() => {
    pending.current = null;
  }, [params]);

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(pending.current ?? params);
    if (value) next.set(key, value);
    else next.delete(key);
    pending.current = next;
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const chip = (active: boolean) =>
    cn(
      'shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
      active ? 'border-white bg-white text-black' : 'border-line bg-white/5 text-muted hover:border-line-strong hover:text-ink',
    );

  const filterLabel = 'w-16 shrink-0 text-xs font-semibold tracking-wider text-subtle uppercase sm:w-20';

  return (
    <div className="pt-24 sm:pt-28">
      <header className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', PAGE_X)}>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {title}
            {countryName && <span className="text-gradient"> · {countryName}</span>}
          </h1>
          <p className="mt-1.5 text-muted">{type === 'movie' ? t('browse.moviesDesc') : t('browse.tvDesc')}</p>
        </div>
        <Segmented
          label="Sort"
          value={sort}
          onChange={(value) => update('sort', value === 'popularity.desc' ? null : value)}
          options={[
            { value: 'popularity.desc', label: t('browse.sortPopular') },
            { value: 'vote_average.desc', label: t('browse.sortRated') },
            { value: 'date.desc', label: t('browse.sortNewest') },
          ]}
        />
      </header>

      <div className="mb-8 space-y-2.5">
        <div className={cn('scrollbar-none flex items-center gap-2 overflow-x-auto pb-1', PAGE_X)} role="group" aria-label={t('browse.genre')}>
          <span className={filterLabel}>{t('browse.genre')}</span>
          <button type="button" className={chip(genre === null)} onClick={() => update('genre', null)}>
            {t('common.all')}
          </button>
          {genres.map((g) => (
            <button key={g.id} type="button" className={chip(genre === g.id)} onClick={() => update('genre', String(g.id))}>
              {g.name}
            </button>
          ))}
        </div>

        <div className={cn('scrollbar-none flex items-center gap-2 overflow-x-auto pb-1', PAGE_X)} role="group" aria-label={t('browse.country')}>
          <span className={filterLabel}>{t('browse.country')}</span>
          <button type="button" className={chip(country === null)} onClick={() => update('country', null)}>
            {t('common.all')}
          </button>
          {countries.map((c) => (
            <button key={c.code} type="button" className={chip(country === c.code)} onClick={() => update('country', c.code)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className={PAGE_X}>
        {!query.isPending && items.length === 0 ? (
          <p className="py-20 text-center text-muted">{t('browse.empty')}</p>
        ) : (
          <MediaGrid
            items={items}
            loading={query.isPending}
            hasMore={query.hasNextPage}
            loadingMore={query.isFetchingNextPage}
            onLoadMore={() => void query.fetchNextPage()}
          />
        )}
      </div>
    </div>
  );
}
