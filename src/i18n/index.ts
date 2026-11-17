import en from '@/i18n/en.json';
import hi from '@/i18n/hi.json';
import { useLocaleStore, type AppLocale } from '@/shared/store/locale-store';

const catalogs = { en, hi } as const;

type Dictionary = typeof en;

function getByPath(dict: Dictionary, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = dict;
  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export function translate(
  locale: AppLocale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const value =
    getByPath(catalogs[locale], key) ?? getByPath(catalogs.en, key) ?? key;

  if (!params) return value;
  return Object.entries(params).reduce(
    (text, [name, replacement]) => text.replaceAll(`{{${name}}}`, String(replacement)),
    value,
  );
}

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const toggleLocale = useLocaleStore((state) => state.toggleLocale);

  return {
    locale,
    setLocale,
    toggleLocale,
    t: (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params),
  };
}
