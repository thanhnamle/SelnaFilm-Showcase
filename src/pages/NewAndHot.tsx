import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { listQuery } from '@/lib/queries';
import HeroCarousel from '@/components/media/HeroCarousel';
import { QueryRow } from '@/components/media/MediaRow';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function NewAndHot() {
  const { t, locale } = useI18n();
  useDocumentTitle(t('nav.new'));
  const upcoming = useQuery(listQuery(locale, '/movie/upcoming'));

  return (
    <>
      <HeroCarousel items={upcoming.data} />
      <div className="relative z-10 -mt-12 space-y-10 sm:-mt-16 sm:space-y-14">
        <QueryRow eager title={t('new.upcoming')} query={listQuery(locale, '/movie/upcoming')} />
        <QueryRow title={t('new.nowPlaying')} variant="backdrop" query={listQuery(locale, '/movie/now_playing')} />
        <QueryRow title={t('new.trendingMovies')} query={listQuery(locale, '/trending/movie/week')} />
        <QueryRow title={t('new.trendingTV')} variant="backdrop" query={listQuery(locale, '/trending/tv/week')} />
      </div>
    </>
  );
}
