/**
 * Helper de tracking de eventos de usuario en el frontend.
 *
 * - Usa POST /api/analytics/track (que escribe en user_interactions con service role)
 * - Genera y persiste un session_id anónimo en localStorage (caduca a 30 min de inactividad)
 * - Detecta dispositivo / browser / OS para enriquecer los eventos
 * - Nunca lanza errores: el tracking jamás debe romper la UI
 */

const SESSION_KEY = 'fc_analytics_session_id'
const SESSION_TS_KEY = 'fc_analytics_session_ts'
const SESSION_TTL_MS = 30 * 60 * 1000 // 30 minutos

export interface TrackOptions {
  event_data?: Record<string, unknown>
  page_url?: string
  page_title?: string
  area_id?: string
  ruta_id?: string
}

export type TrackableEvent =
  | 'page_view'
  | 'area_view'
  | 'area_search'
  | 'route_calculate'
  | 'route_save'
  | 'area_favorite'
  | 'area_unfavorite'
  | 'area_visit_register'
  | 'area_rate'
  | 'filter_apply'
  | 'map_interaction'
  | 'chatbot_open'
  | 'chatbot_message'
  | 'vehicle_register'
  | 'vehicle_update'
  | 'profile_view'
  | 'profile_update'
  | 'login'
  | 'logout'
  | 'signup'
  | 'share'
  | 'download'
  | 'click'
  | 'scroll'
  | 'form_submit'
  | 'error'
  | 'session_start'
  | 'other'

function uuidLike(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    const now = Date.now()
    const existing = localStorage.getItem(SESSION_KEY)
    const ts = parseInt(localStorage.getItem(SESSION_TS_KEY) || '0', 10)

    if (existing && now - ts < SESSION_TTL_MS) {
      localStorage.setItem(SESSION_TS_KEY, String(now))
      return existing
    }

    const fresh = uuidLike()
    localStorage.setItem(SESSION_KEY, fresh)
    localStorage.setItem(SESSION_TS_KEY, String(now))
    return fresh
  } catch {
    return ''
  }
}

export function isNewSession(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const ts = parseInt(localStorage.getItem(SESSION_TS_KEY) || '0', 10)
    if (!ts) return true
    return Date.now() - ts >= SESSION_TTL_MS
  } catch {
    return false
  }
}

export interface DeviceInfo {
  device_type: 'mobile' | 'tablet' | 'desktop'
  browser: string
  os: string
  screen: string
  language: string
  referrer?: string
}

export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      device_type: 'desktop',
      browser: 'unknown',
      os: 'unknown',
      screen: '0x0',
      language: 'es',
    }
  }

  const ua = navigator.userAgent || ''
  const uaLower = ua.toLowerCase()

  let device_type: DeviceInfo['device_type'] = 'desktop'
  if (/ipad|tablet|playbook|silk|kindle/i.test(ua) || (uaLower.includes('android') && !uaLower.includes('mobile'))) {
    device_type = 'tablet'
  } else if (/mobi|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile|windows phone/i.test(ua)) {
    device_type = 'mobile'
  }

  let browser = 'Otro'
  if (uaLower.includes('edg/')) browser = 'Edge'
  else if (uaLower.includes('chrome/') && !uaLower.includes('edg/') && !uaLower.includes('opr/')) browser = 'Chrome'
  else if (uaLower.includes('firefox/')) browser = 'Firefox'
  else if (uaLower.includes('safari/') && !uaLower.includes('chrome/')) browser = 'Safari'
  else if (uaLower.includes('opr/') || uaLower.includes('opera')) browser = 'Opera'
  else if (uaLower.includes('samsungbrowser')) browser = 'Samsung'

  let os = 'Otro'
  if (uaLower.includes('windows')) os = 'Windows'
  else if (uaLower.includes('android')) os = 'Android'
  else if (uaLower.includes('iphone') || uaLower.includes('ipad') || uaLower.includes('ipod')) os = 'iOS'
  else if (uaLower.includes('mac os x') || uaLower.includes('macintosh')) os = 'macOS'
  else if (uaLower.includes('linux')) os = 'Linux'

  return {
    device_type,
    browser,
    os,
    screen: typeof window !== 'undefined' ? `${window.screen?.width || 0}x${window.screen?.height || 0}` : '0x0',
    language: navigator.language || 'es',
    referrer: document.referrer ? document.referrer.slice(0, 300) : undefined,
  }
}

let lastFireKey = ''
let lastFireTs = 0

/**
 * Registra un evento. No bloquea ni lanza errores.
 * - dedup: ignora repeticiones idénticas en menos de 800ms (por dobles renders)
 */
export function track(eventType: TrackableEvent, options: TrackOptions = {}): void {
  if (typeof window === 'undefined') return

  // Dedup
  const dedupKey = `${eventType}|${options.page_url || ''}|${options.area_id || ''}`
  const now = Date.now()
  if (dedupKey === lastFireKey && now - lastFireTs < 800) return
  lastFireKey = dedupKey
  lastFireTs = now

  const session_id = getOrCreateSessionId()
  const page_url = options.page_url ?? (window.location?.pathname + window.location?.search || '')
  const page_title = options.page_title ?? (typeof document !== 'undefined' ? document.title : '')

  const device = getDeviceInfo()
  const event_data: Record<string, unknown> = {
    ...device,
    ...(options.event_data || {}),
  }

  const body = JSON.stringify({
    event_type: eventType,
    event_data,
    page_url: page_url?.slice(0, 500),
    page_title: page_title?.slice(0, 200),
    area_id: options.area_id,
    ruta_id: options.ruta_id,
    session_id,
  })

  // Preferir sendBeacon en page_view / unload para no bloquear navegación
  try {
    if (
      (eventType === 'page_view' || eventType === 'session_start') &&
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function'
    ) {
      const blob = new Blob([body], { type: 'application/json' })
      const ok = navigator.sendBeacon('/api/analytics/track', blob)
      if (ok) return
    }
  } catch {
    /* fallback abajo */
  }

  void fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    /* tracking nunca rompe la UI */
  })
}
