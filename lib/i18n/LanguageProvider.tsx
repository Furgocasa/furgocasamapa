'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_LOCALE,
  LANG_COOKIE,
  LANG_STORAGE_KEY,
  type Locale,
  normalizeLocale,
} from './config'
import { t as translate } from './ui'

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  try {
    const fromStorage = localStorage.getItem(LANG_STORAGE_KEY)
    if (fromStorage) return normalizeLocale(fromStorage)
  } catch {}
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]*)`))
    if (match?.[1]) return normalizeLocale(decodeURIComponent(match[1]))
  } catch {}
  return DEFAULT_LOCALE
}

function persistLocale(locale: Locale) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, locale)
  } catch {}
  try {
    document.cookie = `${LANG_COOKIE}=${encodeURIComponent(locale)};path=/;max-age=31536000;SameSite=Lax`
  } catch {}
  try {
    document.documentElement.lang = locale
  } catch {}
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = readStoredLocale()
    setLocaleState(stored)
    persistLocale(stored)
    setReady(true)
  }, [])

  const setLocale = useCallback((next: Locale) => {
    const normalized = normalizeLocale(next)
    setLocaleState(normalized)
    persistLocale(normalized)
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    }),
    [locale, setLocale]
  )

  // Evitar flash: renderizar hijos siempre; el idioma se corrige tras hidratar
  void ready

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: string, vars?: Record<string, string | number>) =>
        translate(DEFAULT_LOCALE, key, vars),
    }
  }
  return ctx
}
