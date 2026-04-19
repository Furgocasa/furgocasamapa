'use client'

import { Suspense, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { isNewSession, track } from '@/lib/analytics/track'

/**
 * Componente cliente sin UI que se monta una sola vez en el layout raíz.
 * Registra automáticamente:
 *   - 'session_start' la primera vez que se carga la web (o tras 30 min inactivo)
 *   - 'page_view' en cada cambio de pathname/search (Next.js App Router)
 *
 * No depende de ningún wrapper porque usa hooks de navegación;
 * va envuelto en <Suspense> porque useSearchParams lo requiere durante SSR/SSG.
 */
function InnerTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTrackedRef = useRef<string>('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const search = searchParams?.toString() || ''
    const url = `${pathname}${search ? `?${search}` : ''}`

    if (lastTrackedRef.current === url) return
    lastTrackedRef.current = url

    // Si es una sesión nueva (primera visita o caducada), marcar inicio de sesión
    if (isNewSession()) {
      track('session_start', {
        page_url: url,
        event_data: { entry_url: url },
      })
    }

    track('page_view', { page_url: url })
  }, [pathname, searchParams])

  return null
}

export default function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <InnerTracker />
    </Suspense>
  )
}
