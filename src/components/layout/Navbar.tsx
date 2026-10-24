import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import { useI18n, type Locale } from '@/i18n';
import { useSearchStore } from '@/store/useSearchStore';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import AccountMenu from './AccountMenu';
import ThemePicker from './ThemePicker';
import { appPath, isActivePath, NAV_LINKS } from './nav';

export default function Navbar() {
  const { t, href, locale } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const openSearch = useSearchStore((s) => s.open);
  const [scrolled, setScrolled] = useState(false);
  const current = appPath(location.pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const switchLocale = () => {
    const next: Locale = locale === 'vi' ? 'en' : 'vi';
    navigate(`/${next}${current === '/' ? '' : current}${location.search}`, { replace: true });
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled ? 'glass border-b border-line' : 'border-b border-transparent bg-linear-to-b from-black/70 to-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1680px] items-center gap-6 px-4 sm:px-6 lg:px-10">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = isActivePath(current, link.path);
            return (
              <Link
                key={link.path}
                to={href(link.path)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                  active ? 'bg-white/10 text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {t(link.label)}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={openSearch}
            className="flex h-9 items-center gap-2 rounded-full border border-line bg-white/5 px-3 text-sm text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            <Search className="size-4" />
            <span className="hidden pr-1 sm:inline">{t('nav.search')}</span>
            <kbd className="hidden rounded-md border border-line bg-black/30 px-1.5 py-0.5 font-sans text-[10px] text-subtle xl:inline">
              Ctrl K
            </kbd>
          </button>
          <ThemePicker />
          <button
            type="button"
            onClick={switchLocale}
            aria-label={t('nav.language')}
            className="grid h-9 min-w-9 place-items-center rounded-full border border-line bg-white/5 px-2.5 text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            {locale === 'vi' ? 'EN' : 'VI'}
          </button>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
