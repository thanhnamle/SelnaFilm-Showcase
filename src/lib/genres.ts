import type { Locale } from '@/i18n';
import type { MediaType } from './media';

// TMDB genre ids rarely change; a static table saves two requests per page.
const GENRES: Record<number, { vi: string; en: string; types: MediaType[] }> = {
  28: { vi: 'Hành động', en: 'Action', types: ['movie'] },
  12: { vi: 'Phiêu lưu', en: 'Adventure', types: ['movie'] },
  16: { vi: 'Hoạt hình', en: 'Animation', types: ['movie', 'tv'] },
  35: { vi: 'Hài', en: 'Comedy', types: ['movie', 'tv'] },
  80: { vi: 'Hình sự', en: 'Crime', types: ['movie', 'tv'] },
  99: { vi: 'Tài liệu', en: 'Documentary', types: ['movie', 'tv'] },
  18: { vi: 'Chính kịch', en: 'Drama', types: ['movie', 'tv'] },
  10751: { vi: 'Gia đình', en: 'Family', types: ['movie', 'tv'] },
  14: { vi: 'Giả tưởng', en: 'Fantasy', types: ['movie'] },
  36: { vi: 'Lịch sử', en: 'History', types: ['movie'] },
  27: { vi: 'Kinh dị', en: 'Horror', types: ['movie'] },
  10402: { vi: 'Âm nhạc', en: 'Music', types: ['movie'] },
  9648: { vi: 'Bí ẩn', en: 'Mystery', types: ['movie', 'tv'] },
  10749: { vi: 'Lãng mạn', en: 'Romance', types: ['movie'] },
  878: { vi: 'Khoa học viễn tưởng', en: 'Science Fiction', types: ['movie'] },
  53: { vi: 'Gây cấn', en: 'Thriller', types: ['movie'] },
  10752: { vi: 'Chiến tranh', en: 'War', types: ['movie'] },
  37: { vi: 'Miền Tây', en: 'Western', types: ['movie', 'tv'] },
  10759: { vi: 'Hành động & Phiêu lưu', en: 'Action & Adventure', types: ['tv'] },
  10762: { vi: 'Trẻ em', en: 'Kids', types: ['tv'] },
  10764: { vi: 'Thực tế', en: 'Reality', types: ['tv'] },
  10765: { vi: 'Viễn tưởng & Giả tưởng', en: 'Sci-Fi & Fantasy', types: ['tv'] },
  10766: { vi: 'Phim dài tập', en: 'Soap', types: ['tv'] },
  10768: { vi: 'Chiến tranh & Chính trị', en: 'War & Politics', types: ['tv'] },
};

export const genreName = (id: number, locale: Locale) => GENRES[id]?.[locale];

export const genreNames = (ids: number[], locale: Locale, limit = 3) =>
  ids.map((id) => genreName(id, locale)).filter((name): name is string => Boolean(name)).slice(0, limit);

export const genresFor = (type: MediaType, locale: Locale) =>
  Object.entries(GENRES)
    .filter(([, g]) => g.types.includes(type))
    .map(([id, g]) => ({ id: Number(id), name: g[locale] }));
