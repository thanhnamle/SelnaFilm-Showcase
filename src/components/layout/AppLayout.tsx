import { useEffect } from 'react';
import { Navigate, Outlet, ScrollRestoration, useLocation, useParams } from 'react-router';
import { DEFAULT_LOCALE, I18nProvider, isLocale } from '@/i18n';
import Navbar from './Navbar';
import MobileTabBar from './MobileTabBar';
import Footer from './Footer';
import SearchModal from '@/components/ui/SearchModal';
import Toaster from '@/components/ui/Toaster';

export default function AppLayout() {
  const { locale } = useParams();
  const location = useLocation();

  useEffect(() => {
    if (isLocale(locale)) document.documentElement.lang = locale;
  }, [locale]);

  // Old links without a locale prefix (e.g. /movie/123) still work.
  if (!isLocale(locale)) {
    return <Navigate to={`/${DEFAULT_LOCALE}${location.pathname}${location.search}`} replace />;
  }

  const isWatch = location.pathname.includes('/watch/');

  return (
    <I18nProvider locale={locale}>
      <Navbar />
      <main className="min-h-dvh pb-24 lg:pb-0">
        <Outlet />
      </main>
      {!isWatch && <Footer />}
      <MobileTabBar />
      <SearchModal />
      <Toaster />
      <ScrollRestoration />
    </I18nProvider>
  );
}
