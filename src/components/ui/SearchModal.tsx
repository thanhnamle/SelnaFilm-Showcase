import { useEffect, useRef, useState, type ComponentType, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock, CornerDownLeft, Film, Flame, History, Loader2, Search, Sparkles, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useSearchStore } from '@/store/useSearchStore';
import { useSearchHistoryStore } from '@/store/useSearchHistoryStore';
import { useDebounced } from '@/hooks/useDebounced';
import { listQuery, searchQuery } from '@/lib/queries';
import { genreName } from '@/lib/genres';
import { img, mediaPath, type MediaItem } from '@/lib/media';
import { cn } from '@/lib/utils';
import Dialog from './Dialog';
import Rating from './Rating';

const MAX_RESULTS = 8;
/** Movie genres offered as shortcuts to the browse page. */
const GENRE_SHORTCUTS = [28, 16, 35, 27, 10749, 878, 53, 18];

const fold = (ch: string) => ch.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Marks the part of a title that matches the query, ignoring case and Vietnamese diacritics. */
function Highlight({ text, query }: { text: string; query: string }) {
  const chars = [...text];
  const folded = chars.map(fold);
  const needle = [...query].map(fold).join('');
  // Index arithmetic below needs every character to fold to exactly one.
  const start = needle && folded.every((c) => c.length === 1) ? folded.join('').indexOf(needle) : -1;
  if (start < 0) return <>{text}</>;
  const end = start + needle.length;
  return (
    <>
      {chars.slice(0, start).join('')}
      <mark className="bg-transparent text-accent">{chars.slice(start, end).join('')}</mark>
      {chars.slice(end).join('')}
    </>
  );
}

function Section({ icon: Icon, title, action, children }: { icon: ComponentType<{ className?: string }>; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-subtle uppercase">
          <Icon className="size-3.5" />
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid h-5 min-w-5 place-items-center rounded-md border border-line-strong bg-white/5 px-1 font-sans text-[10px] font-semibold text-muted">
      {children}
    </kbd>
  );
}

function Poster({ item, className }: { item: MediaItem; className?: string }) {
  return (
    <div className={cn('grid shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2 ring-1 ring-line', className)}>
      {/* Not lazy: inside the fixed, fading-in dialog lazy images never start loading. */}
      {item.poster ? (
        <img src={img(item.poster, 'w185')} alt="" className="size-full object-cover" />
      ) : (
        <Film className="size-1/3 text-subtle" />
      )}
    </div>
  );
}

export default function SearchModal() {
  const { t, href, locale } = useI18n();
  const navigate = useNavigate();
  const { isOpen, close, toggle } = useSearchStore();
  const history = useSearchHistoryStore();
  const [query, setQuery] = useState('');
  // Row picked with the arrow keys; -1 = none, so Enter searches the keyword instead of opening a title.
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounced = useDebounced(query.trim(), 250);

  const { data, isFetching } = useInfiniteQuery({ ...searchQuery(locale, debounced), enabled: isOpen && debounced.length > 0 });
  const results = (data?.pages[0]?.items ?? []).slice(0, MAX_RESULTS);
  const trending = useQuery({ ...listQuery(locale, '/trending/all/day'), enabled: isOpen && !debounced, staleTime: 30 * 60 * 1000 });
  const type = (item: MediaItem) => (item.type === 'movie' ? t('common.movie') : t('common.tv'));

  // Ctrl/Cmd + K or "/" opens search from anywhere.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        useSearchStore.getState().open();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => inputRef.current?.focus());
    else setQuery('');
  }, [isOpen]);

  useEffect(() => setActive(-1), [debounced]);

  // Keep the highlighted row in view while moving with the arrow keys.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = (path: string) => {
    close();
    navigate(href(path));
  };

  const searchAll = (q: string) => {
    history.addQuery(q);
    go(`/search?q=${encodeURIComponent(q)}`);
  };

  const openTitle = (item: MediaItem, fromQuery?: string) => {
    if (fromQuery) history.addQuery(fromQuery);
    history.addTitle(item);
    go(mediaPath(item));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const selected = active >= 0 ? results[active] : undefined;
    if (selected && debounced === query.trim()) openTitle(selected, debounced);
    else if (query.trim()) searchAll(query.trim());
  };

  // Down from the input picks the first row, Up the last; past either end returns to the input.
  const onKeyDown = (e: KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1 < results.length ? i + 1 : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i === -1 ? results.length - 1 : i - 1));
    }
  };

  const clearAll = (
    <button type="button" onClick={history.clear} className="text-xs font-medium text-subtle transition-colors hover:text-ink">
      {t('search.clearAll')}
    </button>
  );

  const emptyState = (
    <div className="divide-y divide-line">
      {history.queries.length > 0 && (
        <Section icon={Clock} title={t('search.recent')} action={clearAll}>
          <div className="flex flex-wrap gap-2">
            {history.queries.map((q) => (
              <span
                key={q}
                className="inline-flex items-center rounded-full border border-line bg-white/4 transition-colors hover:border-line-strong hover:bg-white/8"
              >
                <button type="button" onClick={() => setQuery(q)} className="flex items-center gap-2 py-1.5 pr-1 pl-3 text-sm text-ink/85">
                  <Clock className="size-3.5 text-subtle" />
                  {q}
                </button>
                <button
                  type="button"
                  onClick={() => history.removeQuery(q)}
                  aria-label={`${t('search.remove')}: ${q}`}
                  className="mr-1 grid size-6 place-items-center rounded-full text-subtle transition-colors hover:bg-white/10 hover:text-ink"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </Section>
      )}

      {history.titles.length > 0 && (
        <Section icon={History} title={t('search.recentTitles')} action={history.queries.length === 0 && clearAll}>
          <ul className="scrollbar-none -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {history.titles.map((item) => (
              <li key={`${item.type}-${item.id}`} className="group/title relative w-22 shrink-0">
                <button type="button" onClick={() => openTitle(item)} className="block w-full text-left">
                  <Poster item={item} className="aspect-2/3 w-full transition-shadow group-hover/title:ring-accent/60" />
                  <p className="mt-1.5 line-clamp-2 text-xs leading-snug font-medium text-ink/80 group-hover/title:text-ink">{item.title}</p>
                </button>
                <button
                  type="button"
                  onClick={() => history.removeTitle(item.type, item.id)}
                  aria-label={`${t('search.remove')}: ${item.title}`}
                  className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/70 text-white/80 opacity-0 backdrop-blur transition-opacity group-hover/title:opacity-100 hover:text-white focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section icon={Flame} title={t('search.trending')}>
        <ol className="grid gap-1 sm:grid-cols-2">
          {trending.data
            ? trending.data.slice(0, 6).map((item, i) => (
                <li key={`${item.type}-${item.id}`}>
                  <button
                    type="button"
                    onClick={() => openTitle(item)}
                    className="group flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-white/5"
                  >
                    <span className="w-5 text-center text-lg font-extrabold text-subtle tabular-nums transition-colors group-hover:text-accent">{i + 1}</span>
                    <Poster item={item} className="h-14 w-10 rounded-md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.title}</span>
                      <span className="block truncate text-xs text-muted">
                        {type(item)}
                        {item.year && ` · ${item.year}`}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            : Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="flex items-center gap-3 p-1.5">
                  <span className="w-5" />
                  <span className="skeleton h-14 w-10 rounded-md" />
                  <span className="skeleton h-3 flex-1 rounded-full" />
                </li>
              ))}
        </ol>
      </Section>

      <Section icon={Sparkles} title={t('search.genres')}>
        <div className="flex flex-wrap gap-2">
          {GENRE_SHORTCUTS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => go(`/movies?genre=${id}`)}
              className="rounded-full bg-linear-to-br from-white/8 to-white/2 px-3.5 py-1.5 text-sm text-ink/80 ring-1 ring-line transition-[color,box-shadow] hover:text-ink hover:ring-accent/50"
            >
              {genreName(id, locale)}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );

  const resultList = (
    <ul ref={listRef} role="listbox" aria-label={t('search.suggestions')} className="space-y-1 p-2">
      {results.map((item, i) => {
        const selected = i === active;
        const featured = i === 0 && Boolean(item.backdrop);
        const meta = (
          <span className="mt-1.5 flex items-center gap-2 text-xs text-muted">
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-ink/80 uppercase">{type(item)}</span>
            {item.year && <span>{item.year}</span>}
            {item.rating > 0 && <Rating value={item.rating} />}
          </span>
        );
        return (
          <li key={`${item.type}-${item.id}`} role="option" aria-selected={selected}>
            <button
              type="button"
              onClick={() => openTitle(item, debounced)}
              className={cn(
                'group relative flex w-full items-center gap-3.5 overflow-hidden text-left transition-[background-color,box-shadow]',
                featured ? 'mb-1 rounded-2xl p-3 ring-1' : 'rounded-xl p-2 pr-3 hover:bg-white/4',
                featured && (selected ? 'ring-accent/60' : 'ring-line hover:ring-line-strong'),
                !featured && selected && 'bg-white/6 hover:bg-white/6',
              )}
            >
              {featured ? (
                <>
                  <img src={img(item.backdrop, 'w780')} alt="" className="absolute inset-0 size-full object-cover opacity-45 transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-linear-to-r from-surface via-surface/85 to-surface/20" />
                </>
              ) : (
                selected && <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-linear-to-b from-accent to-accent-2" />
              )}
              <Poster item={item} className={cn('relative', featured ? 'h-24 w-16' : 'h-18 w-12')} />
              <span className="relative min-w-0 flex-1">
                {featured && <span className="block text-[10px] font-semibold tracking-[0.14em] text-accent uppercase">{t('search.topResult')}</span>}
                <span className={cn('block truncate font-semibold', featured && 'text-lg')}>
                  <Highlight text={item.title} query={debounced} />
                </span>
                {item.subtitle && <span className="block truncate text-xs text-subtle">{item.subtitle}</span>}
                {meta}
              </span>
              <ArrowRight
                className={cn(
                  'relative size-4 shrink-0 text-accent transition-[opacity,translate]',
                  selected ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60',
                )}
              />
            </button>
          </li>
        );
      })}
      <li className="border-t border-line pt-1">
        <button
          type="button"
          onClick={() => searchAll(debounced)}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm text-muted transition-colors hover:bg-white/6 hover:text-ink"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/6">
            <Search className="size-4" />
          </span>
          <span className="flex-1 truncate">{t('search.viewAll', { q: debounced })}</span>
          {active === -1 ? (
            <Kbd>
              <CornerDownLeft className="size-3" />
            </Kbd>
          ) : (
            <ArrowRight className="size-4 shrink-0" />
          )}
        </button>
      </li>
    </ul>
  );

  return (
    <Dialog open={isOpen} onClose={close} label={t('nav.search')} align="top" className="max-w-2xl">
      <div className="overflow-hidden rounded-panel border border-line bg-surface/95 shadow-[0_40px_100px_-20px_rgb(0_0_0/0.85)] backdrop-blur-xl">
        <div aria-hidden className="h-px bg-linear-to-r from-transparent via-accent/70 to-transparent" />
        <form onSubmit={submit} className="flex items-center gap-3 border-b border-line px-5">
          <Search className={cn('size-5 shrink-0 transition-colors', query ? 'text-accent' : 'text-muted')} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('nav.searchPlaceholder')}
            aria-label={t('nav.search')}
            className="h-16 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-subtle"
          />
          {isFetching && <Loader2 className="size-4 shrink-0 animate-spin text-muted" />}
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label={t('common.close')}
              className="grid size-7 shrink-0 place-items-center rounded-full bg-white/8 text-muted hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <button type="button" onClick={close} className="hidden sm:block" aria-label={t('common.close')}>
              <Kbd>esc</Kbd>
            </button>
          )}
        </form>

        <div className="max-h-[min(64vh,600px)] overflow-y-auto overscroll-contain">
          {!debounced
            ? emptyState
            : results.length > 0
              ? resultList
              : isFetching
                ? (
                    <div className="space-y-1 p-2">
                      {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="flex items-center gap-3.5 p-2">
                          <span className="skeleton h-18 w-12 rounded-lg" />
                          <span className="flex-1 space-y-2">
                            <span className="skeleton block h-3.5 w-1/2 rounded-full" />
                            <span className="skeleton block h-3 w-1/4 rounded-full" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                : (
                    <div className="px-6 py-12 text-center">
                      <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-white/5 text-subtle">
                        <Search className="size-5" />
                      </span>
                      <p className="font-semibold">{t('search.noResults')}</p>
                      <p className="mt-1 text-sm text-muted">{t('search.hint')}</p>
                    </div>
                  )}
        </div>

        <div className="hidden items-center gap-4 border-t border-line px-5 py-2.5 text-[11px] text-subtle sm:flex">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            {t('search.navigate')}
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>
              <CornerDownLeft className="size-3" />
            </Kbd>
            {active >= 0 ? t('search.open') : t('search.searchAll')}
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>esc</Kbd>
            {t('search.closeHint')}
          </span>
        </div>
      </div>
    </Dialog>
  );
}
