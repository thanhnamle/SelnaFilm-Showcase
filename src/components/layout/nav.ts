import { Bookmark, Clapperboard, Flame, House, Tv } from 'lucide-react';
import type { MessageKey } from '@/i18n';

export const NAV_LINKS: { path: string; label: MessageKey; icon: typeof House }[] = [
  { path: '/', label: 'nav.home', icon: House },
  { path: '/movies', label: 'nav.movies', icon: Clapperboard },
  { path: '/tv', label: 'nav.tv', icon: Tv },
  { path: '/new', label: 'nav.new', icon: Flame },
  { path: '/my-list', label: 'nav.myList', icon: Bookmark },
];

/** Strips the locale prefix: "/vi/movies" -> "/movies", "/vi" -> "/". */
export const appPath = (pathname: string) => pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

export const isActivePath = (current: string, path: string) =>
  path === '/' ? current === '/' : current === path || current.startsWith(`${path}/`);
