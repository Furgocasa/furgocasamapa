export const LOCALES = ['es', 'en', 'fr', 'de', 'it'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'es'
export const TRANSLATION_LOCALES = ['en', 'fr', 'de', 'it'] as const
export type TranslationLocale = (typeof TRANSLATION_LOCALES)[number]

export const LANG_COOKIE = 'fc_lang'
export const LANG_STORAGE_KEY = 'fc_lang'

export const LOCALE_LABELS: Record<Locale, string> = {
  es: 'ES',
  en: 'EN',
  fr: 'FR',
  de: 'DE',
  it: 'IT',
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export function isTranslationLocale(value: unknown): value is TranslationLocale {
  return typeof value === 'string' && (TRANSLATION_LOCALES as readonly string[]).includes(value)
}

export function normalizeLocale(value: unknown): Locale {
  if (isLocale(value)) return value
  return DEFAULT_LOCALE
}
