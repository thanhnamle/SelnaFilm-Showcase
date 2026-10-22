import type { Locale } from '@/i18n';

// ISO 3166-1 codes for TMDB's `with_origin_country`, in the order shown in the filter.
const COUNTRIES: { code: string; vi: string; en: string }[] = [
  { code: 'KR', vi: 'Hàn Quốc', en: 'South Korea' },
  { code: 'CN', vi: 'Trung Quốc', en: 'China' },
  { code: 'US', vi: 'Mỹ', en: 'United States' },
  { code: 'JP', vi: 'Nhật Bản', en: 'Japan' },
  { code: 'GB', vi: 'Anh', en: 'United Kingdom' },
  { code: 'TH', vi: 'Thái Lan', en: 'Thailand' },
  { code: 'TW', vi: 'Đài Loan', en: 'Taiwan' },
  { code: 'HK', vi: 'Hồng Kông', en: 'Hong Kong' },
  { code: 'VN', vi: 'Việt Nam', en: 'Vietnam' },
  { code: 'IN', vi: 'Ấn Độ', en: 'India' },
  { code: 'FR', vi: 'Pháp', en: 'France' },
  { code: 'ES', vi: 'Tây Ban Nha', en: 'Spain' },
  { code: 'DE', vi: 'Đức', en: 'Germany' },
  { code: 'CA', vi: 'Canada', en: 'Canada' },
  { code: 'AU', vi: 'Úc', en: 'Australia' },
  { code: 'PH', vi: 'Philippines', en: 'Philippines' },
];

const CODES = new Set(COUNTRIES.map((c) => c.code));

export const isCountry = (code: string | null): code is string => code !== null && CODES.has(code);

export const countriesFor = (locale: Locale) => COUNTRIES.map((c) => ({ code: c.code, name: c[locale] }));
