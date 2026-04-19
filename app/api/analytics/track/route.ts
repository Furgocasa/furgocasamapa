import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * Endpoint genérico de tracking de eventos de usuario.
 *
 * Acepta peticiones tanto de usuarios autenticados como anónimos.
 * Usa service role para insertar en `user_interactions` saltándose RLS,
 * de modo que cualquier visitante (logueado o no) queda registrado.
 *
 * Body esperado (todos los campos opcionales salvo event_type):
 *   {
 *     event_type: string,            // obligatorio (uno de los del CHECK)
 *     event_data?: object,           // payload libre (incluye device, browser, etc.)
 *     page_url?: string,
 *     page_title?: string,
 *     area_id?: string (uuid),
 *     ruta_id?: string (uuid),
 *     session_id?: string            // id de sesión cliente (no FK, va a event_data)
 *   }
 */
export const dynamic = 'force-dynamic'

const ALLOWED_EVENTS = new Set([
  'page_view',
  'area_view',
  'area_search',
  'route_calculate',
  'route_save',
  'area_favorite',
  'area_unfavorite',
  'area_visit_register',
  'area_rate',
  'filter_apply',
  'map_interaction',
  'chatbot_open',
  'chatbot_message',
  'vehicle_register',
  'vehicle_update',
  'profile_view',
  'profile_update',
  'login',
  'logout',
  'signup',
  'share',
  'download',
  'click',
  'scroll',
  'form_submit',
  'error',
  'session_start',
  'other',
])

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}

export async function POST(request: Request) {
  try {
    const supabaseAuth = await createClient()
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      /* cuerpo vacío */
    }

    let eventType = String(body.event_type || '').trim()
    if (!ALLOWED_EVENTS.has(eventType)) {
      // Normalizamos a 'other' antes que rechazar (evita perder métricas por typos del cliente)
      eventType = 'other'
    }
    // session_start no existe en el CHECK de la tabla, lo mapeamos a 'login' o 'other'
    if (eventType === 'session_start') eventType = 'other'

    const eventData =
      body.event_data && typeof body.event_data === 'object' ? body.event_data : {}

    // Anexamos el session_id (cliente) al event_data para no romper la FK de sessions
    const sessionIdClient =
      typeof body.session_id === 'string' ? body.session_id.slice(0, 100) : null
    const enrichedData: Record<string, unknown> = {
      ...(eventData as Record<string, unknown>),
      ...(sessionIdClient ? { session_id_client: sessionIdClient } : {}),
    }

    const pageUrl =
      typeof body.page_url === 'string' ? body.page_url.slice(0, 500) : null
    const pageTitle =
      typeof body.page_title === 'string' ? body.page_title.slice(0, 200) : null
    const areaId = isUuid(body.area_id) ? body.area_id : null
    const rutaId = isUuid(body.ruta_id) ? body.ruta_id : null

    const admin = createServiceClient()
    const { error } = await (admin as any).from('user_interactions').insert({
      user_id: user?.id ?? null,
      session_id: null, // FK a user_sessions; lo dejamos null y guardamos el session_id cliente en event_data
      event_type: eventType,
      event_data: enrichedData,
      page_url: pageUrl,
      page_title: pageTitle,
      area_id: areaId,
      ruta_id: rutaId,
    })

    if (error) {
      console.error('[analytics/track] insert error:', error)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[analytics/track]', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
