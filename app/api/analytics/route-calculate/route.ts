import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * Registra un cálculo exitoso de ruta en el planificador (incl. usuarios sin sesión).
 * Inserta con service role para no depender de RLS ni de user_sessions.
 */
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

    const rawKm = body.distancia_km
    const distancia_km =
      typeof rawKm === 'number' && Number.isFinite(rawKm)
        ? Math.min(Math.max(rawKm, 0), 50_000)
        : undefined

    const rawParadas = body.num_paradas
    const num_paradas =
      typeof rawParadas === 'number' && Number.isFinite(rawParadas)
        ? Math.min(Math.max(0, Math.floor(rawParadas)), 50)
        : undefined

    const rawUrl = body.page_url
    const page_url =
      typeof rawUrl === 'string' ? rawUrl.slice(0, 500) : null

    const admin = createServiceClient()
    const { error } = await (admin as any).from('user_interactions').insert({
      user_id: user?.id ?? null,
      session_id: null,
      event_type: 'route_calculate',
      event_data: {
        distancia_km: distancia_km ?? null,
        num_paradas: num_paradas ?? null,
      },
      page_url,
      page_title: 'Planificador de rutas',
    })

    if (error) {
      console.error('[route-calculate]', error)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[route-calculate]', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
