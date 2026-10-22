import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import vi from './messages/vi.json';
import en from './messages/en.json';

export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'vi';

type Messages = typeof vi;
const MESSAGES: Record<Locale, Messages> = { vi, en };

// "nav.home" | "common.play" | ... — only string leaves are valid keys.
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : T[K] extends readonly unknown[] ? never : T[K] extends object ? Leaves<T[K], `${P}${K}.`> : never;
}[keyof T & string];
export type MessageKey = Leaves<Messages>;

export const isLocale = (value: string | undefined): value is Locale => LOCALES.includes(value as Locale);

function lookup(messages: Messages, key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages);
}

interface I18nValue {
  locale: Locale;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  messages: Messages;
  /** Prefixes an app path with the current locale: "/movies" -> "/vi/movies". */
  href: (path: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const messages = MESSAGES[locale];

  const t = useCallback<I18nValue['t']>(
    (key, vars) => {
      const raw = lookup(messages, key);
      const text = typeof raw === 'string' ? raw : key;
      return vars ? text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? '')) : text;
    },
    [messages],
  );

  const href = useCallback((path: string) => `/${locale}${path === '/' ? '' : path}`, [locale]);

  const value = useMemo(() => ({ locale, t, messages, href }), [locale, t, messages, href]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}
