import { Link } from 'react-router';
import { Bookmark } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useMyListStore } from '@/store/useMyListStore';
import { useContinueStore } from '@/store/useContinueStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import ContinueRow from '@/components/media/ContinueRow';
import MediaGrid from '@/components/media/MediaGrid';
import { PAGE_X } from '@/components/media/MediaRow';
import { buttonClass } from '@/components/ui/button';

export default function MyList() {
  const { t, href } = useI18n();
  useDocumentTitle(t('myList.title'));
  const items = useMyListStore((s) => s.items);
  const hasHistory = useContinueStore((s) => Object.keys(s.entries).length > 0);
  const clearHistory = useContinueStore((s) => s.clear);

  return (
    <div className="space-y-12 pt-24 sm:pt-28">
      <header className={cn('flex items-end justify-between gap-4', PAGE_X)}>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t('myList.title')}</h1>
        {hasHistory && (
          <button type="button" onClick={clearHistory} className={buttonClass('ghost', 'sm')}>
            {t('myList.clearHistory')}
          </button>
        )}
      </header>

      <ContinueRow />

      <section className={PAGE_X}>
        <h2 className="mb-4 text-lg font-bold tracking-tight sm:text-xl">{t('myList.saved')}</h2>
        {items.length ? (
          <MediaGrid items={items} />
        ) : (
          <div className="flex flex-col items-center rounded-panel border border-dashed border-line px-6 py-16 text-center">
            <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-white/5">
              <Bookmark className="size-6 text-muted" />
            </span>
            <p className="font-semibold">{t('myList.emptyTitle')}</p>
            <p className="mt-1.5 max-w-sm text-sm text-muted">{t('myList.emptyDesc')}</p>
            <Link to={href('/')} className={buttonClass('primary', 'md', 'mt-6')}>
              {t('myList.explore')}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
