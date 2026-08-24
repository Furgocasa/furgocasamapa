import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const PAGE_SIZE = 25

async function requireAdmin() {
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()

  if (!user || !user.user_metadata?.is_admin) {
    return null
  }
  return user
}

export async function GET(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { searchParams } = request.nextUrl
    const filtro = searchParams.get('filtro') || 'pendientes'
    const filtroIA = searchParams.get('filtroIA') || 'todas'
    const filtroVoto = searchParams.get('filtroVoto') || 'todas'
    const pagina = Math.max(0, parseInt(searchParams.get('pagina') || '0', 10) || 0)

    const admin = createServiceClient()

    const applyRevisionFilter = (q: any) => {
      if (filtro === 'pendientes') return q.eq('revisado', false)
      if (filtro === 'revisadas') return q.eq('revisado', true)
      return q
    }

    const countCat = async (extra?: (q: any) => any) => {
      let q = applyRevisionFilter(
        (admin as any).from('chatbot_respuestas_log').select('id', { count: 'exact', head: true })
      )
      if (extra) q = extra(q)
      const { count: n, error: countError } = await q
      if (countError) throw countError
      return n || 0
    }

    let query = (admin as any)
      .from('chatbot_respuestas_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pagina * PAGE_SIZE, (pagina + 1) * PAGE_SIZE - 1)

    query = applyRevisionFilter(query)

    if (filtroIA === 'sin_evaluar') query = query.is('evaluado_at', null)
    else if (filtroIA !== 'todas') query = query.eq('valoracion_ia', filtroIA)

    if (filtroVoto === 'sin_voto') query = query.is('voto_usuario', null)
    else if (filtroVoto === 'up' || filtroVoto === 'down') query = query.eq('voto_usuario', filtroVoto)

    const [{ data, error, count }, stats] = await Promise.all([
      query,
      Promise.all([
        countCat((q) => q.eq('valoracion_ia', 'correcta')),
        countCat((q) => q.eq('valoracion_ia', 'mejorable')),
        countCat((q) => q.eq('valoracion_ia', 'incorrecta')),
        countCat((q) => q.is('evaluado_at', null)),
        countCat(),
        countCat((q) => q.eq('voto_usuario', 'up')),
        countCat((q) => q.eq('voto_usuario', 'down')),
        countCat((q) => q.is('voto_usuario', null)),
      ]).then(([correcta, mejorable, incorrecta, sin_evaluar, total, voto_up, voto_down, sin_voto]) => ({
        correcta,
        mejorable,
        incorrecta,
        sin_evaluar,
        total,
        voto_up,
        voto_down,
        sin_voto,
      })),
    ])
    if (error) {
      console.error('[admin/chatbot-respuestas] GET', error)
      return NextResponse.json(
        { error: 'Error cargando respuestas', details: error.message },
        { status: 500 }
      )
    }

    const rows = data || []
    const userIds = [...new Set(rows.map((r: any) => r.user_id).filter(Boolean))] as string[]
    const usuarios: Record<string, { nombre: string | null; email: string | null }> = {}

    await Promise.all(
      userIds.map(async (id) => {
        try {
          const { data: authData } = await admin.auth.admin.getUserById(id)
          const u = authData?.user
          if (!u) return
          const meta = u.user_metadata || {}
          usuarios[id] = {
            email: u.email || null,
            nombre:
              meta.full_name ||
              meta.username ||
              [meta.first_name, meta.last_name].filter(Boolean).join(' ') ||
              null,
          }
        } catch (e) {
          console.error('[admin/chatbot-respuestas] usuario', id, e)
        }
      })
    )

    const enriched = rows.map((r: any) => ({
      ...r,
      usuario: r.user_id ? usuarios[r.user_id] || null : null,
    }))

    return NextResponse.json({ data: enriched, total: count || 0, stats })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error cargando respuestas' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, revisado, nota_revision } = body || {}

    if (!id || typeof revisado !== 'boolean') {
      return NextResponse.json({ error: 'id y revisado son requeridos' }, { status: 400 })
    }

    const admin = createServiceClient()
    const { data, error } = await (admin as any)
      .from('chatbot_respuestas_log')
      .update({
        revisado,
        nota_revision: typeof nota_revision === 'string' ? nota_revision.trim() || null : null,
      })
      .eq('id', id)
      .select('id, revisado, nota_revision')
      .single()

    if (error) {
      console.error('[admin/chatbot-respuestas] PATCH', error)
      return NextResponse.json(
        { error: 'No se pudo actualizar', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'No se pudo actualizar' },
      { status: 500 }
    )
  }
}
