'use client'

/**
 * ADMIN: REVISIÓN DE RESPUESTAS DEL TÍO VIAJERO
 * =============================================
 * Tabla de todas las respuestas del chatbot (incluidas las de usuarios
 * anónimos) registradas en chatbot_respuestas_log.
 */

import { Fragment, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { createClient } from '@/lib/supabase/client'
interface UsuarioLog {
  nombre: string | null
  email: string | null
}

interface RespuestaLog {
  id: string
  created_at: string
  conversacion_id: string | null
  user_id: string | null
  usuario?: UsuarioLog | null
  locale: string | null
  pregunta: string | null
  respuesta: string | null
  funciones: Array<{ name: string; args: any }> | null
  areas_ids: string[] | null
  tokens: number | null
  modelo: string | null
  duracion_ms: number | null
  revisado: boolean
  nota_revision: string | null
  valoracion_ia: 'correcta' | 'mejorable' | 'incorrecta' | null
  motivo_ia: string | null
  sugerencia_ia: string | null
  evaluado_at: string | null
  voto_usuario: 'up' | 'down' | null
  votado_at: string | null
  ciudad?: string | null
  pais?: string | null
  ubicacion?: string | null
  ip_hash?: string | null
}

const BADGE_IA: Record<string, { label: string; clase: string }> = {
  correcta: { label: 'Correcta', clase: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200' },
  mejorable: { label: 'Mejorable', clase: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  incorrecta: { label: 'Incorrecta', clase: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
}

type FiltroIA = 'todas' | 'correcta' | 'mejorable' | 'incorrecta' | 'sin_evaluar'
type FiltroVoto = 'todas' | 'up' | 'down' | 'sin_voto'
type Vista = 'respuestas' | 'conversaciones'

interface ConversacionRow {
  id: string
  created_at: string | null
  ultimo_mensaje_at: string | null
  titulo: string
  user_id: string | null
  ip_hash?: string | null
  funciones?: Array<{ name: string; args: any }> | null
  usuario: UsuarioLog | null
  locale: string | null
  respuestas: number
  mensajes: number
  first_user_message: string
  last_message: string
  correcta: number
  mejorable: number
  incorrecta: number
  sin_evaluar: number
  quality_score: number | null
  interaccion?: 'correcta' | 'mejorable' | 'con_errores' | 'sin_valorar'
  pct_correctas?: number | null
  ciudad?: string | null
  pais?: string | null
  ubicacion?: string | null
}

interface HiloMensaje {
  role: 'user' | 'assistant'
  content: string | null
  created_at: string
  log?: RespuestaLog
}

interface StatsIA {
  correcta: number
  mejorable: number
  incorrecta: number
  sin_evaluar: number
  total: number
  voto_up: number
  voto_down: number
  sin_voto: number
}

const CATEGORIAS_PIE: Array<{
  key: Exclude<FiltroIA, 'todas'>
  name: string
  color: string
}> = [
  { key: 'correcta', name: 'Correctas', color: '#16a34a' },
  { key: 'mejorable', name: 'Mejorables', color: '#d97706' },
  { key: 'incorrecta', name: 'Incorrectas', color: '#dc2626' },
  { key: 'sin_evaluar', name: 'Sin evaluar', color: '#9ca3af' },
]

const STATS_VACIOS: StatsIA = {
  correcta: 0,
  mejorable: 0,
  incorrecta: 0,
  sin_evaluar: 0,
  total: 0,
  voto_up: 0,
  voto_down: 0,
  sin_voto: 0,
}

function etiquetaVoto(voto: RespuestaLog['voto_usuario']) {
  if (voto === 'up') return { label: '👍 Bien', clase: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200' }
  if (voto === 'down') return { label: '👎 Mal', clase: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' }
  return { label: '—', clase: 'bg-gray-100 text-gray-500' }
}

const PAGE_SIZE = 25

function formatFecha(iso: string) {
  const d = new Date(iso)
  return {
    dia: d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    hora: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  }
}

function huellaAnonimo(row: { funciones?: Array<{ name: string; args: any }> | null; ip_hash?: string | null }) {
  if (row.ip_hash) return String(row.ip_hash).slice(0, 6)
  const h = (row.funciones || []).find((f) => f?.name === '_cliente')?.args?.huella
  return h ? String(h).slice(0, 6) : null
}

function nombreUsuario(log: RespuestaLog) {
  if (!log.user_id) {
    const h = huellaAnonimo(log)
    return h ? `Anónimo · ${h}` : 'Anónimo'
  }
  const nombre = log.usuario?.nombre?.trim()
  if (nombre) return nombre
  if (log.usuario?.email) return log.usuario.email.split('@')[0]
  return 'Usuario'
}

function etiquetaInteraccion(c: ConversacionRow) {
  if (c.interaccion === 'correcta' || (c.quality_score === 10 && !c.incorrecta && !c.mejorable && (c.correcta || 0) > 0)) {
    return { label: '100% correcta', clase: 'bg-green-50 text-green-700' }
  }
  if (c.interaccion === 'mejorable') {
    return { label: 'Mejorable', clase: 'bg-amber-50 text-amber-700' }
  }
  if (c.interaccion === 'con_errores') {
    return { label: 'Con errores', clase: 'bg-red-50 text-red-700' }
  }
  return { label: 'Sin valorar', clase: 'bg-gray-100 text-gray-500' }
}

function textoUbicacion(row: { ubicacion?: string | null; ciudad?: string | null; pais?: string | null }) {
  if (row.ubicacion) return row.ubicacion
  const ciudad = (row.ciudad || '').trim()
  const pais = (row.pais || '').trim()
  if (ciudad && pais && ciudad !== pais) return `${ciudad}, ${pais}`
  if (ciudad || pais) return ciudad || pais
  return 'Ubicación desconocida'
}

export default function ChatbotRespuestasPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [vista, setVista] = useState<Vista>('respuestas')
  const [logs, setLogs] = useState<RespuestaLog[]>([])
  const [conversaciones, setConversaciones] = useState<ConversacionRow[]>([])
  const [hilo, setHilo] = useState<HiloMensaje[] | null>(null)
  const [hiloMeta, setHiloMeta] = useState<ConversacionRow | null>(null)
  const [hiloId, setHiloId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'pendientes' | 'revisadas' | 'todas'>('todas')
  const [filtroIA, setFiltroIA] = useState<FiltroIA>('todas')
  const [filtroVoto, setFiltroVoto] = useState<FiltroVoto>('todas')
  const [pagina, setPagina] = useState(0)
  const [total, setTotal] = useState(0)
  const [totalConversaciones, setTotalConversaciones] = useState(0)
  const [stats, setStats] = useState<StatsIA>(STATS_VACIOS)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [notas, setNotas] = useState<Record<string, string>>({})
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user || !session.user.user_metadata?.is_admin) {
        router.push('/mapa')
        return
      }
      setAuthorized(true)
    }
    checkAdmin()
  }, [router])

  const cargar = useCallback(async () => {
    if (!authorized) return
    setLoading(true)
    setErrorCarga(null)
    try {
      const params = new URLSearchParams({
        vista,
        filtro,
        filtroIA,
        filtroVoto,
        pagina: String(pagina),
      })
      const res = await fetch(`/api/admin/chatbot-respuestas?${params}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.details || json.error || 'Error cargando respuestas')
      if (vista === 'conversaciones') {
        setConversaciones(json.data || [])
        setTotalConversaciones(json.totalConversaciones || json.total || 0)
        setLogs([])
      } else {
        setLogs(json.data || [])
        setConversaciones([])
      }
      setTotal(json.total || 0)
      setStats(json.stats || STATS_VACIOS)
    } catch (e: any) {
      console.error('Error cargando respuestas:', e)
      setLogs([])
      setTotal(0)
      setStats(STATS_VACIOS)
      setErrorCarga(e?.message || 'Error cargando respuestas')
    } finally {
      setLoading(false)
    }
  }, [authorized, vista, filtro, filtroIA, filtroVoto, pagina])

  useEffect(() => {
    cargar()
  }, [cargar])

  const abrirHilo = async (id: string) => {
    setHiloId(id)
    setHilo(null)
    setHiloMeta(null)
    try {
      const res = await fetch(`/api/admin/chatbot-respuestas?vista=hilo&id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo cargar el hilo')
      setHilo(json.hilo || [])
      if (json.conversacion) setHiloMeta(json.conversacion)
    } catch (e) {
      console.error(e)
      setHilo([])
    }
  }

  const marcarRevisado = async (id: string, revisado: boolean) => {
    try {
      const res = await fetch('/api/admin/chatbot-respuestas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          revisado,
          nota_revision: notas[id]?.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.details || json.error || 'No se pudo actualizar')
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, revisado, nota_revision: notas[id]?.trim() || null } : l)))
    } catch (e) {
      console.error('Error actualizando:', e)
      alert('No se pudo actualizar la revisión. Inténtalo de nuevo.')
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const totalGrafico = stats.total || 0
  const pieData = CATEGORIAS_PIE
    .map((c) => ({ ...c, value: stats[c.key] || 0 }))
    .filter((c) => c.value > 0)

  const seleccionarCategoria = (key: FiltroIA) => {
    setFiltroIA((prev) => (prev === key ? 'todas' : key))
    setPagina(0)
    setExpandido(null)
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-sky-200 border-t-sky-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Respuestas del Tío Viajero</h1>
              <p className="text-gray-500 text-sm mt-1">
                {vista === 'conversaciones'
                  ? 'Mismo usuario en el mismo rato. La nota es de toda la interacción; las respuestas sueltas se siguen corrigiendo en la otra pestaña.'
                  : 'Cada pregunta-respuesta por separado. Incluye anónimos.'}
              </p>
            </div>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => { setVista('respuestas'); setPagina(0); setExpandido(null); setHiloId(null) }}
                className={`px-4 py-2 text-sm font-medium ${vista === 'respuestas' ? 'bg-sky-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Respuestas
              </button>
              <button
                type="button"
                onClick={() => { setVista('conversaciones'); setPagina(0); setExpandido(null) }}
                className={`px-4 py-2 text-sm font-medium ${vista === 'conversaciones' ? 'bg-sky-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Conversaciones
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Distribución por categorización</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalGrafico} respuestas
              {filtro !== 'todas' ? ` · filtro ${filtro}` : ''}
              . Pulsa un quesito para filtrar la tabla.
            </p>
          </div>
          {totalGrafico === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Sin datos todavía</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] items-center gap-2 p-4">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 8, right: 8, bottom: 28, left: 8 }}>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="44%"
                      outerRadius={88}
                      paddingAngle={2}
                      stroke="#fff"
                      strokeWidth={2}
                      label={({ percent }: any) => `${Math.round((percent || 0) * 100)}%`}
                      labelLine={false}
                      fontSize={12}
                      onClick={(_, index) => {
                        const item = pieData[index]
                        if (item) seleccionarCategoria(item.key)
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {pieData.map((slice) => (
                        <Cell
                          key={slice.key}
                          fill={slice.color}
                          opacity={filtroIA === 'todas' || filtroIA === slice.key ? 1 : 0.35}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        const pct = totalGrafico ? Math.round((value / totalGrafico) * 100) : 0
                        return [`${value} (${pct}%)`, name]
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIAS_PIE.map((c) => {
                  const valor = stats[c.key] || 0
                  const pct = totalGrafico ? Math.round((valor / totalGrafico) * 100) : 0
                  const activo = filtroIA === c.key
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => seleccionarCategoria(c.key)}
                      className={`text-left rounded-lg border px-3 py-3 transition-colors ${
                        activo ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-xs font-medium text-gray-600">{c.name}</span>
                      </div>
                      <div className="text-xl font-semibold text-gray-900 tabular-nums">{pct}%</div>
                      <div className="text-xs text-gray-500">{valor} respuestas</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {(['todas', 'pendientes', 'revisadas'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFiltro(f); setPagina(0); setExpandido(null) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtro === f ? 'bg-sky-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-sky-300'
              }`}
            >
              {f === 'pendientes' ? 'Pendientes' : f === 'revisadas' ? 'Revisadas' : 'Todas'}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-500">
            {vista === 'conversaciones' ? `${totalConversaciones} conversaciones` : `${total} respuestas`}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase">Categorización</span>
          {([
            ['todas', 'Todas'],
            ['correcta', 'Correctas'],
            ['mejorable', 'Mejorables'],
            ['incorrecta', 'Incorrectas'],
            ['sin_evaluar', 'Sin evaluar'],
          ] as const).map(([valor, etiqueta]) => (
            <button
              key={valor}
              onClick={() => { setFiltroIA(valor); setPagina(0); setExpandido(null) }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroIA === valor ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase">Voto usuario</span>
          {([
            ['todas', `Todos (${stats.voto_up + stats.voto_down + stats.sin_voto || stats.total})`],
            ['up', `👍 ${stats.voto_up}`],
            ['down', `👎 ${stats.voto_down}`],
            ['sin_voto', `Sin voto (${stats.sin_voto})`],
          ] as const).map(([valor, etiqueta]) => (
            <button
              key={valor}
              onClick={() => { setFiltroVoto(valor); setPagina(0); setExpandido(null) }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroVoto === valor ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-sky-200 border-t-sky-600"></div>
          </div>
        ) : errorCarga ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-red-600">
            No se pudieron cargar las respuestas.
            <p className="text-xs mt-2 text-gray-500">{errorCarga}</p>
          </div>
        ) : (vista === 'conversaciones' ? conversaciones.length === 0 : logs.length === 0) ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            {vista === 'conversaciones'
              ? 'No hay interacciones con este filtro.'
              : `No hay respuestas ${filtro === 'pendientes' ? 'pendientes de revisar' : filtro === 'revisadas' ? 'revisadas' : 'registradas'} todavía.`}
          </div>
        ) : vista === 'conversaciones' ? (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-[12%]">Fecha</th>
                      <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-[12%]">Usuario</th>
                      <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-[16%]">Ubicación</th>
                      <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-[30%]">Primer mensaje</th>
                      <th className="px-2.5 py-2.5 text-center text-xs font-medium text-gray-500 uppercase w-[10%]">Preg.</th>
                      <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-[16%]">Nota interacción</th>
                      <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Idioma</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {conversaciones.map((c) => {
                      const fecha = formatFecha(c.ultimo_mensaje_at || c.created_at || new Date().toISOString())
                      const huella = huellaAnonimo(c as any)
                      const nombre = c.usuario?.nombre || c.usuario?.email?.split('@')[0] || (c.user_id ? 'Usuario' : (huella ? `Anónimo · ${huella}` : 'Anónimo'))
                      return (
                        <tr
                          key={c.id}
                          onClick={() => abrirHilo(c.id)}
                          className={`cursor-pointer hover:bg-gray-50 ${hiloId === c.id ? 'bg-sky-50/60' : ''}`}
                        >
                          <td className="px-2.5 py-2 align-top">
                            <div className="text-sm font-medium text-gray-900">{fecha.dia}</div>
                            <div className="text-xs text-gray-500">{fecha.hora}</div>
                          </td>
                          <td className="px-2.5 py-2 align-top overflow-hidden">
                            <div className="text-sm font-medium text-gray-900 truncate">{nombre}</div>
                            {c.usuario?.email && <div className="text-xs text-gray-500 truncate">{c.usuario.email}</div>}
                          </td>
                          <td className="px-2.5 py-2 align-top overflow-hidden">
                            <p className={`text-sm truncate ${textoUbicacion(c) === 'Ubicación desconocida' ? 'text-gray-400' : 'text-gray-800'}`}>
                              {textoUbicacion(c)}
                            </p>
                          </td>
                          <td className="px-2.5 py-2 align-top overflow-hidden">
                            <p className="text-sm text-gray-900 line-clamp-2">{c.first_user_message || c.titulo || '—'}</p>
                          </td>
                          <td className="px-2.5 py-2 text-center text-sm text-gray-700 tabular-nums">{c.respuestas}</td>
                          <td className="px-2.5 py-2 align-top">
                            {(() => {
                              const nota = etiquetaInteraccion(c)
                              return (
                                <>
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${nota.clase}`}>
                                    {c.quality_score == null ? nota.label : `${c.quality_score.toFixed(1)}/10 · ${nota.label}`}
                                  </span>
                                  <div className="text-[10px] text-gray-400 mt-0.5">
                                    {c.correcta} correctas · {c.mejorable} mejorables · {c.incorrecta} incorrectas
                                    {c.sin_evaluar > 0 ? ` · ${c.sin_evaluar} sin evaluar` : ''}
                                  </div>
                                </>
                              )
                            })()}
                          </td>
                          <td className="px-2.5 py-2 text-xs uppercase text-gray-500">{c.locale || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => { setPagina((p) => Math.max(0, p - 1)); setHiloId(null) }}
                  disabled={pagina === 0}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-200 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">Página {pagina + 1} de {totalPaginas}</span>
                <button
                  onClick={() => { setPagina((p) => Math.min(totalPaginas - 1, p + 1)); setHiloId(null) }}
                  disabled={pagina >= totalPaginas - 1}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-200 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">Fecha</th>
                      <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[11%]">Usuario</th>
                      <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[13%]">Ubicación</th>
                      <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">Tipo</th>
                      <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Mensaje del usuario</th>
                      <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[19%]">Respuesta</th>
                      <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[11%]">Categorización</th>
                      <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Voto</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => {
                      const fecha = formatFecha(log.created_at)
                      const abierto = expandido === log.id
                      const categoria = log.valoracion_ia ? BADGE_IA[log.valoracion_ia] : null
                      const voto = etiquetaVoto(log.voto_usuario)
                      return (
                        <Fragment key={log.id}>
                          <tr
                            onClick={() => setExpandido(abierto ? null : log.id)}
                            className={`cursor-pointer hover:bg-gray-50 ${abierto ? 'bg-sky-50/60' : ''} ${log.revisado ? 'bg-green-50/40' : ''}`}
                          >
                            <td className="px-2.5 py-2 align-top overflow-hidden">
                              <div className="text-sm font-medium text-gray-900">{fecha.dia}</div>
                              <div className="text-xs text-gray-500">{fecha.hora}</div>
                            </td>
                            <td className="px-2.5 py-2 align-top overflow-hidden">
                              <div className="text-sm font-medium text-gray-900 truncate" title={nombreUsuario(log)}>
                                {nombreUsuario(log)}
                              </div>
                              {log.usuario?.email && (
                                <div className="text-xs text-gray-500 truncate" title={log.usuario.email}>
                                  {log.usuario.email}
                                </div>
                              )}
                            </td>
                            <td className="px-2.5 py-2 align-top overflow-hidden">
                              <p
                                className={`text-sm truncate ${textoUbicacion(log) === 'Ubicación desconocida' ? 'text-gray-400' : 'text-gray-800'}`}
                                title={textoUbicacion(log)}
                              >
                                {textoUbicacion(log)}
                              </p>
                            </td>
                            <td className="px-2.5 py-2 align-top overflow-hidden">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                log.user_id ? 'bg-sky-50 text-sky-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {log.user_id ? 'Registrado' : 'Anónimo'}
                              </span>
                            </td>
                            <td className="px-2.5 py-2 align-top overflow-hidden">
                              <p className="text-sm text-gray-900 line-clamp-2" title={log.pregunta || ''}>
                                {log.pregunta || '—'}
                              </p>
                            </td>
                            <td className="px-2.5 py-2 align-top overflow-hidden">
                              <p className="text-sm text-gray-600 line-clamp-2" title={log.respuesta || ''}>
                                {log.respuesta || '—'}
                              </p>
                            </td>
                            <td className="px-2.5 py-2 align-top overflow-hidden">
                              {categoria ? (
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${categoria.clase}`}>
                                  {categoria.label}
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                  Sin evaluar
                                </span>
                              )}
                            </td>
                            <td className="px-2.5 py-2 align-top overflow-hidden">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${voto.clase}`}>
                                {voto.label}
                              </span>
                            </td>
                          </tr>
                          {abierto && (
                            <tr className="bg-gray-50">
                              <td colSpan={8} className="px-4 py-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Mensaje del usuario</p>
                                    <p className="text-sm text-gray-900 whitespace-pre-wrap bg-white rounded-lg border border-gray-200 p-3">
                                      {log.pregunta || '—'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Respuesta</p>
                                    <p className="text-sm text-gray-900 whitespace-pre-wrap bg-white rounded-lg border border-gray-200 p-3">
                                      {log.respuesta || '—'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                                  {log.conversacion_id && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); abrirHilo(log.conversacion_id!) }}
                                      className="text-sky-700 font-medium hover:underline"
                                    >
                                      Ver hilo
                                    </button>
                                  )}
                                  <span className={textoUbicacion(log) === 'Ubicación desconocida' ? 'text-gray-400' : ''}>
                                    {textoUbicacion(log)}
                                  </span>
                                  {log.locale && <span className="uppercase font-semibold">{log.locale}</span>}
                                  {log.funciones && log.funciones.filter((f) => !f.name.startsWith('_')).length > 0 && (
                                    <span>{log.funciones.filter((f) => !f.name.startsWith('_')).map((f) => f.name).join(', ')}</span>
                                  )}
                                  <span>{log.tokens ?? '—'} tokens</span>
                                  <span>{log.duracion_ms ? `${(log.duracion_ms / 1000).toFixed(1)} s` : '—'}</span>
                                  {log.revisado && <span className="text-green-700 font-medium">Revisada</span>}
                                </div>

                                {log.funciones && log.funciones.length > 0 && (
                                  <pre className="mt-3 text-xs bg-gray-900 text-green-300 rounded-lg p-3 overflow-x-auto">
                                    {JSON.stringify(log.funciones, null, 2)}
                                  </pre>
                                )}

                                {log.valoracion_ia && (
                                  <div className={`mt-3 rounded-lg p-3 border ${
                                    log.valoracion_ia === 'correcta' ? 'bg-green-50 border-green-200'
                                      : log.valoracion_ia === 'mejorable' ? 'bg-amber-50 border-amber-200'
                                      : 'bg-red-50 border-red-200'
                                  }`}>
                                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                                      Revisor IA: {BADGE_IA[log.valoracion_ia].label}
                                    </p>
                                    {log.motivo_ia && <p className="text-sm text-gray-800"><strong>Motivo:</strong> {log.motivo_ia}</p>}
                                    {log.sugerencia_ia && <p className="text-sm text-gray-800 mt-1"><strong>Sugerencia:</strong> {log.sugerencia_ia}</p>}
                                    {log.voto_usuario && (
                                      <p className="text-sm text-gray-800 mt-1">
                                        <strong>Voto usuario:</strong>{' '}
                                        {log.voto_usuario === 'up' ? '👍 le gustó' : '👎 no le gustó'}
                                        {log.valoracion_ia && log.valoracion_ia === 'incorrecta' && log.voto_usuario === 'up' && ' · gustó aunque la IA la marca incorrecta'}
                                        {log.valoracion_ia && log.valoracion_ia === 'correcta' && log.voto_usuario === 'down' && ' · no gustó aunque la IA la marca correcta'}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {!log.valoracion_ia && log.voto_usuario && (
                                  <p className="mt-3 text-sm text-gray-700">
                                    Voto del usuario: {log.voto_usuario === 'up' ? '👍 le gustó' : '👎 no le gustó'}
                                  </p>
                                )}

                                <div className="flex items-end gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Nota de revisión</label>
                                    <input
                                      type="text"
                                      value={notas[log.id] ?? log.nota_revision ?? ''}
                                      onChange={(e) => setNotas((prev) => ({ ...prev, [log.id]: e.target.value }))}
                                      placeholder="p.ej. respuesta inventada, faltó buscar, OK..."
                                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                  </div>
                                  {log.revisado ? (
                                    <button
                                      onClick={() => marcarRevisado(log.id, false)}
                                      className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
                                    >
                                      Desmarcar
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => marcarRevisado(log.id, true)}
                                      className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors whitespace-nowrap"
                                    >
                                      Marcar revisada
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => { setPagina((p) => Math.max(0, p - 1)); setExpandido(null) }}
                  disabled={pagina === 0}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-200 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">Página {pagina + 1} de {totalPaginas}</span>
                <button
                  onClick={() => { setPagina((p) => Math.min(totalPaginas - 1, p + 1)); setExpandido(null) }}
                  disabled={pagina >= totalPaginas - 1}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-200 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}

        {hiloId && (
          <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={() => { setHiloId(null); setHilo(null); setHiloMeta(null) }}>
            <div
              className="w-full max-w-xl h-full bg-white shadow-xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Interacción</h3>
                  <p className="text-xs text-gray-500">
                    {hiloMeta
                      ? `${hiloMeta.respuestas || hilo?.filter((m) => m.role === 'assistant').length || 0} preguntas · ${
                          hiloMeta.quality_score == null
                            ? 'sin valorar'
                            : `${hiloMeta.quality_score.toFixed(1)}/10 · ${etiquetaInteraccion(hiloMeta).label}`
                        }`
                      : 'Hilo del mismo usuario en el mismo rato'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setHiloId(null); setHilo(null); setHiloMeta(null) }}
                  className="text-sm text-gray-500 hover:text-gray-800"
                >
                  Cerrar
                </button>
              </div>
              <div className="p-4 space-y-3">
                {hilo == null ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-sky-200 border-t-sky-600" />
                  </div>
                ) : hilo.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-10">Este hilo no tiene mensajes guardados.</p>
                ) : (
                  hilo.map((m, i) => {
                    const esUser = m.role === 'user'
                    const categoria = m.log?.valoracion_ia ? BADGE_IA[m.log.valoracion_ia] : null
                    return (
                      <div key={`${m.role}-${i}-${m.created_at}`} className={`flex ${esUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[88%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                          esUser ? 'bg-sky-50 text-gray-900' : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                            {esUser ? 'Usuario' : 'Tío Viajero'}
                          </p>
                          {m.content || '—'}
                          {!esUser && categoria && (
                            <div className="mt-2">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${categoria.clase}`}>
                                {categoria.label}
                              </span>
                            </div>
                          )}
                          {!esUser && m.log?.motivo_ia && (
                            <p className="mt-1 text-xs text-gray-500">{m.log.motivo_ia}</p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
