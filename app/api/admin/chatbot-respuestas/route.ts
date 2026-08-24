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
    const vista = searchParams.get('vista') || 'respuestas'
    const hiloId = searchParams.get('id')

    const admin = createServiceClient()

    if (vista === 'hilo' && hiloId) {
      return NextResponse.json(await cargarHilo(admin, hiloId))
    }

    if (vista === 'conversaciones') {
      return NextResponse.json(await cargarConversaciones(admin, { filtro, filtroIA, filtroVoto, pagina }))
    }

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

    const enriched = await adjuntarUbicacion(admin, rows.map((r: any) => ({
      ...r,
      usuario: r.user_id ? usuarios[r.user_id] || null : null,
    })))

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

const QUALITY_SCORE: Record<string, number> = { correcta: 10, mejorable: 5, incorrecta: 0 }

export function textoUbicacion(u?: { ciudad?: string | null; pais?: string | null } | null): string {
  const ciudad = String(u?.ciudad || '').trim()
  const pais = String(u?.pais || '').trim()
  if (ciudad && pais && ciudad.toLowerCase() !== pais.toLowerCase()) return `${ciudad}, ${pais}`
  if (ciudad) return ciudad
  if (pais) return pais
  return 'Ubicación desconocida'
}

function ubicacionDeFila(row: any, conv?: any): { ciudad: string | null; pais: string | null; ubicacion: string } {
  const pref = conv?.preferencias_detectadas?.ubicacion || {}
  const meta = (row.funciones || []).find((f: any) => f?.name === '_ubicacion')?.args || {}
  const ciudad = row.ciudad || pref.ciudad || meta.ciudad || null
  const pais = row.pais || pref.pais || meta.pais || null
  return { ciudad, pais, ubicacion: textoUbicacion({ ciudad, pais }) }
}

async function adjuntarUbicacion(admin: any, rows: any[]) {
  const ids = [...new Set(rows.map((r) => r.conversacion_id).filter(Boolean))]
  const convMap = new Map<string, any>()
  if (ids.length) {
    const { data } = await admin
      .from('chatbot_conversaciones')
      .select('id, ubicacion_usuario, preferencias_detectadas')
      .in('id', ids)
    for (const c of data || []) convMap.set(c.id, c)
  }
  return rows.map((r) => {
    const extra = ubicacionDeFila(r, r.conversacion_id ? convMap.get(r.conversacion_id) : null)
    return { ...r, ...extra }
  })
}

function applyRevision(q: any, filtro: string) {
  if (filtro === 'pendientes') return q.eq('revisado', false)
  if (filtro === 'revisadas') return q.eq('revisado', true)
  return q
}

async function statsLogs(admin: any, filtro: string) {
  const countCat = async (extra?: (q: any) => any) => {
    let q = applyRevision(
      admin.from('chatbot_respuestas_log').select('id', { count: 'exact', head: true })
    , filtro)
    if (extra) q = extra(q)
    const { count: n } = await q
    return n || 0
  }
  const [correcta, mejorable, incorrecta, sin_evaluar, total, voto_up, voto_down, sin_voto] = await Promise.all([
    countCat((q) => q.eq('valoracion_ia', 'correcta')),
    countCat((q) => q.eq('valoracion_ia', 'mejorable')),
    countCat((q) => q.eq('valoracion_ia', 'incorrecta')),
    countCat((q) => q.is('evaluado_at', null)),
    countCat(),
    countCat((q) => q.eq('voto_usuario', 'up')),
    countCat((q) => q.eq('voto_usuario', 'down')),
    countCat((q) => q.is('voto_usuario', null)),
  ])
  return { correcta, mejorable, incorrecta, sin_evaluar, total, voto_up, voto_down, sin_voto }
}

async function usuariosDeIds(admin: any, userIds: string[]) {
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
  return usuarios
}

async function cargarHilo(admin: any, id: string) {
  const [{ data: conv }, { data: logs }, { data: msgs }] = await Promise.all([
    admin.from('chatbot_conversaciones').select('*').eq('id', id).maybeSingle(),
    admin.from('chatbot_respuestas_log').select('*').eq('conversacion_id', id).order('created_at', { ascending: true }),
    admin.from('chatbot_mensajes').select('id,rol,contenido,created_at').eq('conversacion_id', id).order('created_at', { ascending: true }),
  ])

  const hilo: Array<{
    role: 'user' | 'assistant'
    content: string | null
    created_at: string
    log?: any
  }> = []

  if (logs && logs.length > 0) {
    for (const log of logs) {
      hilo.push({ role: 'user', content: log.pregunta, created_at: log.created_at })
      hilo.push({ role: 'assistant', content: log.respuesta, created_at: log.created_at, log })
    }
  } else {
    for (const m of msgs || []) {
      hilo.push({
        role: m.rol === 'user' ? 'user' : 'assistant',
        content: m.contenido,
        created_at: m.created_at,
      })
    }
  }

  let usuario = null
  if (conv?.user_id) {
    const map = await usuariosDeIds(admin, [conv.user_id])
    usuario = map[conv.user_id] || null
  }

  const ubi = ubicacionDeFila(logs?.[0] || {}, conv)
  return { conversacion: conv ? { ...conv, usuario, ...ubi } : { id, ...ubi }, hilo }
}

async function cargarConversaciones(
  admin: any,
  opts: { filtro: string; filtroIA: string; filtroVoto: string; pagina: number }
) {
  const { filtro, filtroIA, filtroVoto, pagina } = opts

  const [{ data: logsAll }, { data: msgRows }, stats] = await Promise.all([
    admin.from('chatbot_respuestas_log').select('*').not('conversacion_id', 'is', null).order('created_at', { ascending: true }),
    admin.from('chatbot_mensajes').select('conversacion_id,rol,contenido,created_at').order('created_at', { ascending: true }),
    statsLogs(admin, filtro),
  ])

  const logsFiltrados = (logsAll || []).filter((log: any) => {
    if (filtro === 'pendientes' && log.revisado) return false
    if (filtro === 'revisadas' && !log.revisado) return false
    if (filtroIA === 'sin_evaluar' && log.evaluado_at) return false
    if (filtroIA !== 'todas' && filtroIA !== 'sin_evaluar' && log.valoracion_ia !== filtroIA) return false
    if (filtroVoto === 'sin_voto' && log.voto_usuario) return false
    if ((filtroVoto === 'up' || filtroVoto === 'down') && log.voto_usuario !== filtroVoto) return false
    return true
  })

  const idsConFiltro = new Set(logsFiltrados.map((l: any) => l.conversacion_id).filter(Boolean))
  const hayFiltroFino = filtro !== 'todas' || filtroIA !== 'todas' || filtroVoto !== 'todas'

  const byConv = new Map<string, any[]>()
  for (const log of logsAll || []) {
    if (!log.conversacion_id) continue
    if (hayFiltroFino && !idsConFiltro.has(log.conversacion_id)) continue
    const arr = byConv.get(log.conversacion_id) || []
    arr.push(log)
    byConv.set(log.conversacion_id, arr)
  }

  const firstUserMsg = new Map<string, string>()
  const lastMsgAt = new Map<string, string>()
  const msgCount = new Map<string, number>()
  for (const m of msgRows || []) {
    if (!m.conversacion_id) continue
    msgCount.set(m.conversacion_id, (msgCount.get(m.conversacion_id) || 0) + 1)
    if (m.created_at && (!lastMsgAt.has(m.conversacion_id) || m.created_at > lastMsgAt.get(m.conversacion_id)!)) {
      lastMsgAt.set(m.conversacion_id, m.created_at)
    }
    if (m.rol === 'user' && m.contenido && !firstUserMsg.has(m.conversacion_id)) {
      firstUserMsg.set(m.conversacion_id, m.contenido)
    }
  }

  if (!hayFiltroFino) {
    for (const id of msgCount.keys()) {
      if (!byConv.has(id)) byConv.set(id, [])
    }
  }

  const ids = [...byConv.keys()]
  const { data: convs } = ids.length
    ? await admin.from('chatbot_conversaciones').select('*').in('id', ids)
    : { data: [] }
  const convMap = new Map((convs || []).map((c: any) => [c.id, c]))

  const userIds = [...new Set((convs || []).map((c: any) => c.user_id).filter(Boolean))] as string[]
  const usuarios = await usuariosDeIds(admin, userIds)

  const rows = ids.map((id) => {
    const logs = byConv.get(id) || []
    const conv = convMap.get(id)
    let scoreSum = 0
    let classified = 0
    let unclassified = 0
    let correcta = 0
    let mejorable = 0
    let incorrecta = 0
    for (const log of logs) {
      if (!log.valoracion_ia) unclassified++
      else if (log.valoracion_ia in QUALITY_SCORE) {
        classified++
        scoreSum += QUALITY_SCORE[log.valoracion_ia]
        if (log.valoracion_ia === 'correcta') correcta++
        else if (log.valoracion_ia === 'mejorable') mejorable++
        else incorrecta++
      }
    }
    const lastLog = logs[logs.length - 1]
    const firstLog = logs[0]
    const ubi = ubicacionDeFila(lastLog || firstLog || {}, conv)
    return {
      id,
      created_at: conv?.created_at || firstLog?.created_at || lastMsgAt.get(id) || null,
      ultimo_mensaje_at: conv?.ultimo_mensaje_at || lastLog?.created_at || lastMsgAt.get(id) || null,
      titulo: conv?.titulo || firstLog?.pregunta || firstUserMsg.get(id) || 'Conversación',
      user_id: conv?.user_id || lastLog?.user_id || null,
      usuario: (conv?.user_id && usuarios[conv.user_id]) || null,
      locale: lastLog?.locale || firstLog?.locale || null,
      respuestas: logs.length || Math.ceil((msgCount.get(id) || 0) / 2),
      mensajes: msgCount.get(id) || logs.length * 2,
      first_user_message: firstLog?.pregunta || firstUserMsg.get(id) || '',
      last_message: lastLog?.respuesta || lastLog?.pregunta || '',
      correcta,
      mejorable,
      incorrecta,
      sin_evaluar: unclassified,
      quality_score: classified > 0 ? Math.round((scoreSum / classified) * 10) / 10 : null,
      ciudad: ubi.ciudad,
      pais: ubi.pais,
      ubicacion: ubi.ubicacion,
    }
  })

  rows.sort((a, b) => String(b.ultimo_mensaje_at || '').localeCompare(String(a.ultimo_mensaje_at || '')))

  const total = rows.length
  const page = rows.slice(pagina * PAGE_SIZE, (pagina + 1) * PAGE_SIZE)

  return { data: page, total, stats, totalConversaciones: total }
}
