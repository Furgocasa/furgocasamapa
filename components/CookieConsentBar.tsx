'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChartBarIcon,
  Cog6ToothIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/lib/i18n'

export const COOKIE_CONSENT_KEY = 'mapafc_cookie_consent'
export const COOKIE_PREFERENCES_KEY = 'mapafc_cookie_preferences'
export const COOKIE_CONSENT_CHANGE = 'mapafc:cookie-consent'
export const COOKIE_CONSENT_ASK = 'mapafc:pedir-cookies'
const OPEN_SETTINGS_EVENT = 'openCookieSettings'
const PREFS_SYNC_EVENT = 'mapafc:cookie-prefs'

export interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  functional: boolean
  marketing: boolean
}

const ALL_ACCEPTED: CookiePreferences = {
  necessary: true,
  analytics: true,
  functional: true,
  marketing: true,
}

const ONLY_NECESSARY: CookiePreferences = {
  necessary: true,
  analytics: false,
  functional: false,
  marketing: false,
}

function CookieIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2a9.5 9.5 0 0 0-1.2 18.93A10 10 0 1 0 21.8 11.4 7 7 0 0 1 12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="8.2" cy="10" r="1.1" fill="currentColor" />
      <circle cx="12.5" cy="8" r="1" fill="currentColor" />
      <circle cx="10.5" cy="14.2" r="1.15" fill="currentColor" />
      <circle cx="15.2" cy="13.2" r="0.9" fill="currentColor" />
    </svg>
  )
}

function updateGtagConsent(params: Record<string, string>) {
  if (typeof window === 'undefined') return
  const apply = () => {
    if ((window as any).gtag) {
      ;(window as any).gtag('consent', 'update', params)
      return true
    }
    return false
  }
  if (apply()) return
  window.setTimeout(apply, 100)
  window.setTimeout(apply, 500)
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`
}

function applyConsentSideEffects(prefs: CookiePreferences) {
  if (prefs.analytics) {
    updateGtagConsent({ analytics_storage: 'granted' })
  } else {
    updateGtagConsent({ analytics_storage: 'denied' })
    deleteCookie('_ga')
    deleteCookie('_gid')
    document.cookie.split(';').forEach((c) => {
      if (c.trim().startsWith('_ga_')) {
        deleteCookie(c.split('=')[0].trim())
      }
    })
  }

  if (prefs.marketing) {
    updateGtagConsent({
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    })
    if ((window as any).fbq) (window as any).fbq('consent', 'grant')
  } else {
    updateGtagConsent({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
    if ((window as any).fbq) (window as any).fbq('consent', 'revoke')
    deleteCookie('_fbp')
    deleteCookie('_gcl_au')
  }
}

function optionalGranted(prefs: CookiePreferences) {
  return prefs.analytics || prefs.functional || prefs.marketing
}

function persistPreferences(prefs: CookiePreferences) {
  const granted = optionalGranted(prefs)
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, granted ? 'granted' : 'denied')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs))
  } catch {
    /* modo privado */
  }
  applyConsentSideEffects(prefs)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE, { detail: { granted } }))
    window.dispatchEvent(new CustomEvent(PREFS_SYNC_EVENT, { detail: { prefs } }))
  }
}

function readStoredPreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY)
    if (savedPrefs) {
      return { ...ALL_ACCEPTED, ...JSON.parse(savedPrefs), necessary: true }
    }
    const legacy = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (legacy === 'granted') return ALL_ACCEPTED
    if (legacy === 'denied') return ONLY_NECESSARY
  } catch {
    /* modo privado */
  }
  return null
}

export function getCookieConsent(): 'granted' | 'denied' | null {
  if (typeof window === 'undefined') return null
  try {
    const prefs = readStoredPreferences()
    if (!prefs) {
      const v = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (v === 'granted' || v === 'denied') return v
      return null
    }
    if (!localStorage.getItem(COOKIE_CONSENT_KEY) && !localStorage.getItem(COOKIE_PREFERENCES_KEY)) {
      return null
    }
    return optionalGranted(prefs) ? 'granted' : 'denied'
  } catch {
    return null
  }
}

export function cookiesGranted(): boolean {
  return getCookieConsent() === 'granted'
}

export function setCookieConsent(granted: boolean) {
  persistPreferences(granted ? ALL_ACCEPTED : ONLY_NECESSARY)
}

export function pedirAceptarCookies() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_ASK))
  }
}

export function onCookieConsentChange(cb: (granted: boolean) => void) {
  const handler = (e: Event) => {
    const granted = Boolean((e as CustomEvent).detail?.granted)
    cb(granted)
  }
  window.addEventListener(COOKIE_CONSENT_CHANGE, handler)
  return () => window.removeEventListener(COOKIE_CONSENT_CHANGE, handler)
}

export const GPS_ACTIVE_KEY = 'gpsActive'
export const GPS_CHANGE = 'mapafc:gps'

export function gpsActivo(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(GPS_ACTIVE_KEY) === 'true'
  } catch {
    return false
  }
}

/** Mapa y chat comparten el mismo interruptor. Apagar el GPS deja el chat sombreado. */
export function avisarGps(active: boolean, coords?: { lat: number; lng: number } | null) {
  try {
    localStorage.setItem(GPS_ACTIVE_KEY, active ? 'true' : 'false')
  } catch {
    /* modo privado */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GPS_CHANGE, { detail: { active, coords: coords || null } }))
  }
}

export function onGpsChange(
  cb: (active: boolean, coords: { lat: number; lng: number } | null) => void
) {
  const handler = (e: Event) => {
    const d = (e as CustomEvent).detail || {}
    cb(Boolean(d.active), d.coords || null)
  }
  window.addEventListener(GPS_CHANGE, handler)
  return () => window.removeEventListener(GPS_CHANGE, handler)
}

interface CookieContextType {
  preferences: CookiePreferences
  hasConsented: boolean
  updatePreferences: (prefs: Partial<CookiePreferences>) => void
  acceptAll: () => void
  rejectAll: () => void
  savePreferences: () => void
  openSettings: () => void
  closeSettings: () => void
  isSettingsOpen: boolean
  showBanner: boolean
  setShowBanner: (show: boolean) => void
}

const CookieContext = createContext<CookieContextType | undefined>(undefined)

export function CookieProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdmin = Boolean(pathname?.startsWith('/admin'))
  const [preferences, setPreferences] = useState<CookiePreferences>(ALL_ACCEPTED)
  const [hasConsented, setHasConsented] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const applySaved = useCallback((prefs: CookiePreferences) => {
    setPreferences(prefs)
    setHasConsented(true)
    setShowBanner(false)
    setIsSettingsOpen(false)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = readStoredPreferences()
    const hasStoredChoice =
      Boolean(localStorage.getItem(COOKIE_PREFERENCES_KEY)) ||
      localStorage.getItem(COOKIE_CONSENT_KEY) === 'granted' ||
      localStorage.getItem(COOKIE_CONSENT_KEY) === 'denied'

    if (stored && hasStoredChoice) {
      setPreferences(stored)
      setHasConsented(true)
      setShowBanner(false)
    } else if (!isAdmin) {
      setShowBanner(true)
    }
    setIsLoaded(true)

    const handleOpenSettings = () => setIsSettingsOpen(true)
    const handleAsk = () => {
      if (!isAdmin) setShowBanner(true)
    }
    const handlePrefs = (e: Event) => {
      const prefs = (e as CustomEvent).detail?.prefs as CookiePreferences | undefined
      if (prefs) applySaved({ ...prefs, necessary: true })
    }

    window.addEventListener(OPEN_SETTINGS_EVENT, handleOpenSettings)
    window.addEventListener(COOKIE_CONSENT_ASK, handleAsk)
    window.addEventListener(PREFS_SYNC_EVENT, handlePrefs)
    return () => {
      window.removeEventListener(OPEN_SETTINGS_EVENT, handleOpenSettings)
      window.removeEventListener(COOKIE_CONSENT_ASK, handleAsk)
      window.removeEventListener(PREFS_SYNC_EVENT, handlePrefs)
    }
  }, [applySaved, isAdmin])

  useEffect(() => {
    if (!isLoaded || !hasConsented) return
    applyConsentSideEffects(preferences)
  }, [preferences, hasConsented, isLoaded])

  const updatePreferences = (prefs: Partial<CookiePreferences>) => {
    setPreferences((prev) => ({ ...prev, ...prefs, necessary: true }))
  }

  const savePreferences = () => {
    persistPreferences(preferences)
    setHasConsented(true)
    setShowBanner(false)
    setIsSettingsOpen(false)
  }

  const acceptAll = () => {
    setPreferences(ALL_ACCEPTED)
    persistPreferences(ALL_ACCEPTED)
    setHasConsented(true)
    setShowBanner(false)
    setIsSettingsOpen(false)
  }

  const rejectAll = () => {
    setPreferences(ONLY_NECESSARY)
    persistPreferences(ONLY_NECESSARY)
    setHasConsented(true)
    setShowBanner(false)
    setIsSettingsOpen(false)
  }

  return (
    <CookieContext.Provider
      value={{
        preferences,
        hasConsented,
        updatePreferences,
        acceptAll,
        rejectAll,
        savePreferences,
        openSettings: () => setIsSettingsOpen(true),
        closeSettings: () => setIsSettingsOpen(false),
        isSettingsOpen,
        showBanner: isAdmin ? false : showBanner,
        setShowBanner,
      }}
    >
      {children}
    </CookieContext.Provider>
  )
}

export function useCookies() {
  const context = useContext(CookieContext)
  if (context === undefined) {
    throw new Error('useCookies must be used within a CookieProvider')
  }
  return context
}

export function CookieBanner() {
  const { showBanner, acceptAll, openSettings } = useCookies()
  const { t } = useLanguage()

  if (!showBanner) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[12000] p-4 bg-white border-t border-gray-200 shadow-lg md:p-6"
      role="region"
      aria-label={t('cookies_banner_label')}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <CookieIcon className="h-8 w-8 text-accent-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{t('cookies_banner_title')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('cookies_banner_text')}{' '}
                  <Link href="/cookies" className="text-accent-500 hover:underline">
                    {t('footer_cookies')}
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={openSettings}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
            >
              {t('cookies_configure')}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="px-4 py-2 bg-accent-500 text-white rounded-lg font-medium hover:bg-accent-600 transition-colors text-sm"
            >
              {t('cookies_accept_all')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CookieSettingsModal() {
  const {
    isSettingsOpen,
    closeSettings,
    preferences,
    updatePreferences,
    savePreferences,
    acceptAll,
    rejectAll,
  } = useCookies()
  const { t } = useLanguage()

  if (!isSettingsOpen) return null

  const cookieTypes = [
    {
      id: 'necessary' as const,
      name: t('cookies_necessary'),
      description: t('cookies_necessary_desc'),
      icon: ShieldCheckIcon,
      required: true,
      enabled: preferences.necessary,
    },
    {
      id: 'analytics' as const,
      name: t('cookies_analytics'),
      description: t('cookies_analytics_desc'),
      icon: ChartBarIcon,
      required: false,
      enabled: preferences.analytics,
    },
    {
      id: 'functional' as const,
      name: t('cookies_functional'),
      description: t('cookies_functional_desc'),
      icon: Cog6ToothIcon,
      required: false,
      enabled: preferences.functional,
    },
    {
      id: 'marketing' as const,
      name: t('cookies_marketing'),
      description: t('cookies_marketing_desc'),
      icon: MegaphoneIcon,
      required: false,
      enabled: preferences.marketing,
    },
  ]

  return (
    <div
      className="fixed inset-0 z-[12100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-settings-title"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <CookieIcon className="h-8 w-8 text-accent-500" />
            <h2 id="cookie-settings-title" className="text-xl font-bold text-gray-900">
              {t('cookies_settings_title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeSettings}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('cookies_settings_close')}
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-gray-600 mb-6">{t('cookies_settings_intro')}</p>

          <div className="space-y-4">
            {cookieTypes.map((cookie) => (
              <div
                key={cookie.id}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  cookie.enabled
                    ? 'border-accent-500 bg-accent-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      cookie.enabled ? 'bg-accent-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                    aria-hidden="true"
                  >
                    <cookie.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1 gap-3">
                      <h3 className="font-semibold text-gray-900" id={`cookie-${cookie.id}-label`}>
                        {cookie.name}
                      </h3>
                      {cookie.required ? (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap">
                          {t('cookies_always_on')}
                        </span>
                      ) : (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cookie.enabled}
                            onChange={(e) => updatePreferences({ [cookie.id]: e.target.checked })}
                            className="sr-only peer"
                            aria-labelledby={`cookie-${cookie.id}-label`}
                            aria-describedby={`cookie-${cookie.id}-desc`}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500" />
                        </label>
                      )}
                    </div>
                    <p className="text-sm text-gray-600" id={`cookie-${cookie.id}-desc`}>
                      {cookie.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-6">
            {t('cookies_more_info')}{' '}
            <Link href="/cookies" className="text-accent-500 hover:underline" onClick={closeSettings}>
              {t('footer_cookies')}
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={rejectAll}
            className="flex-1 px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-white transition-colors"
          >
            {t('cookies_reject_all')}
          </button>
          <button
            type="button"
            onClick={savePreferences}
            className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            {t('cookies_save')}
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="flex-1 px-4 py-2.5 bg-accent-500 text-white rounded-lg font-medium hover:bg-accent-600 transition-colors"
          >
            {t('cookies_accept_all')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CookieConsentBar() {
  return (
    <>
      <CookieBanner />
      <CookieSettingsModal />
    </>
  )
}

export function openCookieSettings() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT))
  }
}
