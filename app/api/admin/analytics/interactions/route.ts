import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

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

    const allInteractions: any[] = []
    const pageSize = 1000
    let page = 0
    let hasMore = true

    while (hasMore) {
      const { data, error } = await (admin as any)
        .from('user_interactions')
        .select('id, created_at, timestamp, user_id, event_type, event_data, page_url, area_id')
        .order('timestamp', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        console.error('[admin/analytics/interactions]', error)
        return NextResponse.json(
          { error: 'Error cargando interacciones', details: error.message },
          { status: 500 }
        )
      }

      if (data && data.length > 0) {
        allInteractions.push(...data)
        page++
        if (data.length < pageSize) hasMore = false
      } else {
        hasMore = false
      }
      if (page > 100) break
    }

    const { data: rutas, error: rutasError } = await (admin as any)
      .from('rutas')
      .select('*')

    if (rutasError) {
      console.error('[admin/analytics/interactions] rutas', rutasError)
    }

    const routeCalculateCount = allInteractions.filter(
      (i) => i.event_type === 'route_calculate'
    ).length

    const response = NextResponse.json({
      interactions: allInteractions,
      rutas: rutas || [],
      meta: {
        totalInteractions: allInteractions.length,
        routeCalculateCount,
        totalRutas: rutas?.length || 0,
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
