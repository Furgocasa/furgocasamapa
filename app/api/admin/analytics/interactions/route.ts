import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const maxDuration = 60

/** Ventana de interacciones: suficiente para gráficos mensuales sin tumbar Vercel */
const INTERACTIONS_LOOKBACK_DAYS = 365
const PAGE_SIZE = 1000
const MAX_PAGES = 40 // tope duro ~40k filas

/**
 * Devuelve user_interactions y rutas con service role (bypass RLS)
 * para que analytics admin vea cálculos reales del planificador, no solo los del admin.
 */
export async function GET() {
  try {
    const supabaseAuth = await createClient()
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user || !user.user_metadata?.is_admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const admin = createServiceClient()

    const since = new Date()
    since.setDate(since.getDate() - INTERACTIONS_LOOKBACK_DAYS)
    const sinceIso = since.toISOString()

    const allInteractions: any[] = []
    let page = 0
    let hasMore = true

    while (hasMore) {
      const { data, error } = await (admin as any)
        .from('user_interactions')
        .select('id, created_at, timestamp, user_id, event_type, event_data, area_id')
        .gte('timestamp', sinceIso)
        .order('timestamp', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) {
        console.error('[admin/analytics/interactions]', error)
        return NextResponse.json(
          { error: 'Error cargando interacciones', details: error.message },
          { status: 500 }
        )
      }

      if (data && data.length > 0) {
        // Solo campos de event_data que usa el dashboard (reduce payload JSON)
        for (const row of data) {
          const ed = row.event_data || {}
          row.event_data = {
            session_id_client: ed.session_id_client ?? null,
            device_type: ed.device_type ?? null,
            distancia_km: typeof ed.distancia_km === 'number' ? ed.distancia_km : null,
          }
        }
        allInteractions.push(...data)
        page++
        if (data.length < PAGE_SIZE) hasMore = false
      } else {
        hasMore = false
      }
      if (page >= MAX_PAGES) break
    }

    const { data: rutas, error: rutasError } = await (admin as any)
      .from('rutas')
      .select('id, created_at, user_id, distancia_km, waypoints')

    if (rutasError) {
      console.error('[admin/analytics/interactions] rutas', rutasError)
    }

    // Tablas de producto: el panel las dejaba vacías o las leía con RLS de usuario
    // (favoritos solo los del admin; visitas pide role=admin, no is_admin).
    const [
      conversacionesRes,
      chatbotAnalyticsRes,
      mensajesUserRes,
      mensajesTotalRes,
      mantenimientosRes,
      averiasRes,
      reportesRes,
      visitasRes,
      favoritosRes,
    ] = await Promise.all([
      (admin as any).from('chatbot_conversaciones').select('id, created_at, total_mensajes, user_id'),
      (admin as any).from('chatbot_analytics').select('id, evento, detalles, created_at'),
      (admin as any).from('chatbot_mensajes').select('id', { count: 'exact', head: true }).eq('rol', 'user'),
      (admin as any).from('chatbot_mensajes').select('id', { count: 'exact', head: true }),
      (admin as any).from('mantenimientos').select('id, coste, created_at, user_id'),
      (admin as any).from('averias').select('id, coste_total, coste_reparacion, created_at, user_id'),
      (admin as any).from('reportes_accidentes').select('id, created_at'),
      (admin as any).from('visitas').select('id, created_at, area_id, user_id, fecha_visita'),
      (admin as any).from('favoritos').select('id, created_at, area_id, user_id'),
    ])

    for (const [label, res] of [
      ['chatbot_conversaciones', conversacionesRes],
      ['chatbot_analytics', chatbotAnalyticsRes],
      ['mantenimientos', mantenimientosRes],
      ['averias', averiasRes],
      ['reportes_accidentes', reportesRes],
      ['visitas', visitasRes],
      ['favoritos', favoritosRes],
    ] as const) {
      if (res.error) {
        console.error(`[admin/analytics/interactions] ${label}`, res.error)
      }
    }

    const routeCalculateCount = allInteractions.filter(
      (i) => i.event_type === 'route_calculate'
    ).length

    const response = NextResponse.json({
      interactions: allInteractions,
      rutas: rutas || [],
      chatbotConversaciones: conversacionesRes.data || [],
      chatbotAnalytics: chatbotAnalyticsRes.data || [],
      mantenimientos: mantenimientosRes.data || [],
      averias: averiasRes.data || [],
      reportesAccidentes: reportesRes.data || [],
      visitas: visitasRes.data || [],
      favoritos: favoritosRes.data || [],
      meta: {
        totalInteractions: allInteractions.length,
        routeCalculateCount,
        totalRutas: rutas?.length || 0,
        lookbackDays: INTERACTIONS_LOOKBACK_DAYS,
        truncated: page >= MAX_PAGES,
        chatbotMensajesUser: mensajesUserRes.count ?? 0,
        chatbotMensajesTotal: mensajesTotalRes.count ?? 0,
      },
    })

    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    )
    return response
  } catch (e: any) {
    console.error('[admin/analytics/interactions]', e)
    return NextResponse.json(
      { error: 'Error interno', details: e?.message },
      { status: 500 }
    )
  }
}
