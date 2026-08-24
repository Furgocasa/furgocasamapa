'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export const COOKIE_CONSENT_KEY = 'mapafc_cookie_consent'
export const COOKIE_CONSENT_CHANGE = 'mapafc:cookie-consent'
export const COOKIE_CONSENT_ASK = 'mapafc:pedir-cookies'

function updateGtag(granted: boolean) {
  if (typeof window === 'undefined' || !(window as any).gtag) return
  const value = granted ? 'granted' : 'denied'
  ;(window as any).gtag('consent', 'update', {
    analytics_storage: value,
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  })
}

export function getCookieConsent(): 'granted' | 'denied' | null {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (v === 'granted' || v === 'denied') return v
  } catch {
    /* modo privado */
  }
  return null
}

export function cookiesGranted(): boolean {
  return getCookieConsent() === 'granted'
}

export function setCookieConsent(granted: boolean) {
  const value = granted ? 'granted' : 'denied'
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, value)
  } catch {
    /* modo privado */
  }
  updateGtag(granted)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE, { detail: { granted } }))
  }
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

export function CookieConsentBar() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return
    if (!getCookieConsent()) setShow(true)
    const pedir = () => setShow(true)
    window.addEventListener(COOKIE_CONSENT_ASK, pedir)
    return () => window.removeEventListener(COOKIE_CONSENT_ASK, pedir)
  }, [pathname])

  if (pathname?.startsWith('/admin') || !show) return null

  const save = (granted: boolean) => {
    setCookieConsent(granted)
    setShow(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[12000] bg-slate-900 text-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          Usamos cookies para medir visitas, situarte en el mapa y que el Tío Viajero te responda cerca de ti.
          Sin aceptarlas no hay ubicación ni chat.
        </p>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={() => save(false)} className="px-4 py-2 text-sm text-white/80">
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            className="px-4 py-2 text-sm font-semibold bg-white text-slate-900 rounded"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
