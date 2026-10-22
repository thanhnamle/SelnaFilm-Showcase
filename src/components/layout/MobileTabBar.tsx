import { Link, useLocation } from 'react-router';
import { Search } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useSearchStore } from '@/store/useSearchStore';
import { cn } from '@/lib/utils';
import { appPath, isActivePath, NAV_LINKS } from './nav';

const TABS = NAV_LINKS.filter((l) => l.path !== '/new');

/** App-style bottom navigation for phones and tablets. */
export default function MobileTabBar() {
  const { t, href } = useI18n();
  const current = appPath(useLocation().pathname);
  const openSearch = useSearchStore((s) => s.open);

  const itemClass = (active: boolean) =>
    cn(
      'flex flex-1 flex-col items-center gap-1 pt-2 pb-1 text-[10px] font-medium transition-colors',
      active ? 'text-ink' : 'text-subtle',
    );

  return (
    <nav
      aria-label="Tabs"
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[max(env(safe-area-inset-bottom),0.5rem)] lg:hidden"
    >
      <div className="mx-auto flex max-w-lg">
        {TABS.slice(0, 3).map(({ path, label, icon: Icon }) => {
          const active = isActivePath(current, path);
          return (
            <Link key={path} to={href(path)} className={itemClass(active)} aria-current={active ? 'page' : undefined}>
              <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
              {t(label)}
            </Link>
          );
        })}
        <button type="button" onClick={openSearch} className={itemClass(false)}>
          <Search className="size-5" strokeWidth={1.8} />
          {t('nav.search')}
        </button>
        {TABS.slice(3).map(({ path, label, icon: Icon }) => {
          const active = isActivePath(current, path);
          return (
            <Link key={path} to={href(path)} className={itemClass(active)} aria-current={active ? 'page' : undefined}>
              <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
              {t(label)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
