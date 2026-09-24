export type AppLang = 'en' | 'de' | 'fr' | 'it';

export const AVAILABLE_LANGS: AppLang[] = ['en', 'de', 'fr', 'it'];
export const DEFAULT_LANG: AppLang = 'en';
export const LANG_STORAGE_KEY = 'atoll_lang';

export function isAppLang(value: string | null | undefined): value is AppLang {
  return !!value && (AVAILABLE_LANGS as string[]).includes(value);
}
