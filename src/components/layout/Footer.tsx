import { Link } from 'react-router';
import { Heart } from 'lucide-react';
import { useI18n } from '@/i18n';
import Logo from './Logo';
import { NAV_LINKS } from './nav';

export default function Footer() {
  const { t, href } = useI18n();
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-10">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm text-muted">{t('footer.tagline')}</p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted" aria-label="Footer">
          {NAV_LINKS.map((link) => (
            <Link key={link.path} to={href(link.path)} className="transition-colors hover:text-ink">
              {t(link.label)}
            </Link>
          ))}
        </nav>

        <div className="max-w-xs space-y-2 text-xs text-subtle">
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="inline-block font-semibold text-muted hover:text-ink">
            TMDB
          </a>
          <p>{t('footer.tmdb')}</p>
          <p className="flex items-center gap-1.5">
            {t('footer.madeWith')} <Heart className="size-3.5 fill-accent-2 text-accent-2" /> © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
