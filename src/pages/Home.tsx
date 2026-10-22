import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { latestQuery, listQuery } from '@/lib/queries';
import HeroCarousel from '@/components/media/HeroCarousel';
import ContinueRow from '@/components/media/ContinueRow';
import BecauseYouRows from '@/components/media/BecauseYouRows';
import TabbedRow from '@/components/media/TabbedRow';
import Spotlight from '@/components/media/Spotlight';
import OnAirShowcase from '@/components/media/OnAirShowcase';
import { QueryRow } from '@/components/media/MediaRow';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/** "YYYY-MM-DD", `days` from today (negative = in the past). */
function dayOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// News, reality and talk shows crowd out dramas in country lists.
const NOT_DRAMA = '10763,10764,10767';

export default function Home() {
  const { t, locale } = useI18n();
  useDocumentTitle();
  // The hero leads with what was just added to the source; trending is the fallback if that fails.
  const latest = useQuery(latestQuery(locale));
  const fresh = useMemo(() => (latest.data ?? []).filter((m) => m.backdrop && m.overview), [latest.data]);
  const useFallback = latest.isError || (latest.isSuccess && fresh.length < 3);
  const trending = useQuery({ ...listQuery(locale, '/trending/movie/week'), enabled: useFallback });
  const heroItems = useFallback ? trending.data : latest.isSuccess ? fresh : undefined;

  const dates = useMemo(
    () => ({ airFrom: dayOffset(-21), airTo: dayOffset(7), yearAgo: dayOffset(-365), tenYearsAgo: dayOffset(-3650), twoYearsAgo: dayOffset(-730), today: dayOffset(0) }),
    [],
  );
  // "On air now": an episode aired in the last three weeks (or airs this week).
  const airing = { 'air_date.gte': dates.airFrom, 'air_date.lte': dates.airTo, sort_by: 'popularity.desc' };

  // New series that are airing now; animation lives in its own row.
  const byCountry = (country: string) =>
    listQuery(locale, '/discover/tv', {
      ...airing,
      with_origin_country: country,
      'first_air_date.gte': dates.yearAgo,
      without_genres: `16,${NOT_DRAMA}`,
    });

  return (
    <>
      <HeroCarousel items={heroItems} />

      <div className="relative z-10 -mt-12 space-y-10 sm:-mt-16 sm:space-y-14">
        <ContinueRow />
        <TabbedRow
          title={t('home.latest')}
          eager
          tabs={[
            { value: 'all', label: t('common.all'), query: latestQuery(locale) },
            { value: 'tv', label: t('common.tv'), query: latestQuery(locale, 'tv') },
            { value: 'movie', label: t('common.movie'), query: latestQuery(locale, 'movie') },
          ]}
        />
        <BecauseYouRows />
        <OnAirShowcase
          title={t('home.byCountry')}
          tabs={[
            { value: 'kr', label: t('home.korea'), query: byCountry('KR'), seeAllTo: '/tv?country=KR&sort=date.desc' },
            { value: 'cn', label: t('home.china'), query: byCountry('CN'), seeAllTo: '/tv?country=CN&sort=date.desc' },
            { value: 'us', label: t('home.usuk'), query: byCountry('US|GB'), seeAllTo: '/tv?country=US&sort=date.desc' },
          ]}
        />
        <TabbedRow
          title={t('home.animation')}
          tabs={[
            {
              value: 'anime',
              label: t('home.anime'),
              // Long-runners (Conan, Doraemon…) air every week; keep series from the last decade.
              query: listQuery(locale, '/discover/tv', { ...airing, with_genres: '16', with_original_language: 'ja', 'first_air_date.gte': dates.tenYearsAgo }),
              seeAllTo: '/tv?genre=16&country=JP',
            },
            {
              value: 'donghua',
              label: t('home.donghua'),
              query: listQuery(locale, '/discover/tv', { ...airing, with_genres: '16', with_origin_country: 'CN' }),
              seeAllTo: '/tv?genre=16&country=CN',
            },
            {
              value: 'movies',
              label: t('home.animatedMovies'),
              query: listQuery(locale, '/discover/movie', {
                with_genres: '16',
                sort_by: 'popularity.desc',
                'primary_release_date.gte': dates.twoYearsAgo,
                'primary_release_date.lte': dates.today,
                'vote_count.gte': '30',
              }),
              seeAllTo: '/movies?genre=16',
            },
          ]}
        />
        <TabbedRow
          title={t('home.trending')}
          tabs={[
            { value: 'day', label: t('home.today'), query: listQuery(locale, '/trending/movie/day') },
            { value: 'week', label: t('home.thisWeek'), query: listQuery(locale, '/trending/movie/week') },
          ]}
        />
        <QueryRow title={t('home.top10')} variant="top10" query={listQuery(locale, '/trending/tv/week')} />
        <Spotlight
          title={t('home.romance')}
          query={listQuery(locale, '/discover/movie', {
            with_genres: '10749',
            sort_by: 'popularity.desc',
            'primary_release_date.gte': dates.twoYearsAgo,
            'primary_release_date.lte': dates.today,
            'vote_count.gte': '50',
          })}
        />
        <QueryRow title={t('home.popularMovies')} query={listQuery(locale, '/movie/popular')} seeAllTo="/movies" />
        <QueryRow title={t('home.nowPlaying')} query={listQuery(locale, '/movie/now_playing')} seeAllTo="/new" />
      </div>
    </>
  );
}
