import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Clock, Search as SearchIcon, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { searchQuery } from '@/lib/queries';
import { useSearchHistoryStore } from '@/store/useSearchHistoryStore';
import { useDebounced } from '@/hooks/useDebounced';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import MediaGrid from '@/components/media/MediaGrid';
import { PAGE_X } from '@/components/media/MediaRow';
import Segmented from '@/components/ui/Segmented';

type Filter = 'all' | 'movie' | 'tv';

export default function Search() {
  const { t, locale } = useI18n();
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') ?? '';
  const [text, setText] = useState(initial);
  const [filter, setFilter] = useState<Filter>('all');
  const q = useDebounced(text.trim(), 350);
  useDocumentTitle(q || t('search.title'));
  const { queries: recent, addQuery, removeQuery } = useSearchHistoryStore();

  // Keep the URL shareable without adding a history entry per keystroke.
  useEffect(() => {
    if (q === (params.get('q') ?? '')) return;
    setParams(q ? { q } : {}, { replace: true });
  }, [q, params, setParams]);

  // The URL changed from outside (e.g. the search modal) — not from our own debounced write.
  useEffect(() => {
    if (initial !== q) setText(initial);
    // Only react to URL changes; q is compared, not tracked.
  }, [initial]);

  const query = useInfiniteQuery(searchQuery(locale, q));
  const all = query.data?.pages.flatMap((p) => p.items) ?? [];
  const items = filter === 'all' ? all : all.filter((m) => m.type === filter);

  return (
    <div className={cn('pt-24 sm:pt-28', PAGE_X)}>
      <label className="mb-6 flex h-14 items-center gap-3 rounded-2xl border border-line bg-surface px-5 transition-colors focus-within:border-line-strong">
        <SearchIcon className="size-5 text-muted" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('nav.searchPlaceholder')}
          aria-label={t('search.title')}
          className="flex-1 bg-transparent text-lg outline-none placeholder:text-subtle"
          autoFocus={!initial}
        />
      </label>

      {q ? (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight">{t('search.resultsFor', { q })}</h1>
            <Segmented
              label="Filter"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: t('common.all') },
                { value: 'movie', label: t('common.movie') },
                { value: 'tv', label: t('common.tv') },
              ]}
            />
          </div>
          {!query.isPending && items.length === 0 && !query.hasNextPage ? (
            <div className="py-20 text-center">
              <p className="font-semibold">{t('search.noResults')}</p>
              <p className="mt-1.5 text-sm text-muted">{t('search.hint')}</p>
            </div>
          ) : (
            // Opening a result is what makes a search worth remembering.
            <div onClickCapture={(e) => (e.target as HTMLElement).closest('a') && addQuery(q)}>
              <MediaGrid
                items={items}
                loading={query.isPending}
                hasMore={query.hasNextPage}
                loadingMore={query.isFetchingNextPage}
                onLoadMore={() => void query.fetchNextPage()}
              />
            </div>
          )}
        </>
      ) : recent.length > 0 ? (
        <section className="py-4">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-subtle uppercase">
            <Clock className="size-3.5" /> {t('search.recent')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <span key={r} className="inline-flex items-center rounded-full border border-line bg-white/4 transition-colors hover:border-line-strong hover:bg-white/8">
                <button type="button" onClick={() => setText(r)} className="py-2 pr-1 pl-4 text-sm text-ink/85">
                  {r}
                </button>
                <button
                  type="button"
                  onClick={() => removeQuery(r)}
                  aria-label={`${t('search.remove')}: ${r}`}
                  className="mr-1.5 grid size-6 place-items-center rounded-full text-subtle hover:bg-white/10 hover:text-ink"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </section>
      ) : (
        <p className="py-20 text-center text-muted">{t('search.start')}</p>
      )}
    </div>
  );
}
