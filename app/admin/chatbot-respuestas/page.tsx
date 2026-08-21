'use client'

/**
 * ADMIN: REVISIÓN DE RESPUESTAS DEL TÍO VIAJERO
 * =============================================
 * Tabla de todas las respuestas del chatbot (incluidas las de usuarios
 * anónimos) registradas en chatbot_respuestas_log.
 */

import { Fragment, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'

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
}

const BADGE_IA: Record<string, { label: string; clase: string }> = {
  correcta: { label: 'Correcta', clase: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200' },
  mejorable: { label: 'Mejorable', clase: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  incorrecta: { label: 'Incorrecta', clase: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
}

const PAGE_SIZE = 25

function formatFecha(iso: string) {
  const d = new Date(iso)
  return {
    dia: d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    hora: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  }
}

function nombreUsuario(log: RespuestaLog) {
  if (!log.user_id) return '—'
  const nombre = log.usuario?.nombre?.trim()
  if (nombre) return nombre
  if (log.usuario?.email) return log.usuario.email.split('@')[0]
  return 'Usuario'
}

export default function ChatbotRespuestasPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [logs, setLogs] = useState<RespuestaLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'pendientes' | 'revisadas' | 'todas'>('todas')
  const [filtroIA, setFiltroIA] = useState<'todas' | 'correcta' | 'mejorable' | 'incorrecta' | 'sin_evaluar'>('todas')
  const [pagina, setPagina] = useState(0)
  const [total, setTotal] = useState(0)
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
        filtro,
        filtroIA,
        pagina: String(pagina),
      })
      const res = await fetch(`/api/admin/chatbot-respuestas?${params}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.details || json.error || 'Error cargando respuestas')
      setLogs(json.data || [])
      setTotal(json.total || 0)
    } catch (e: any) {
      console.error('Error cargando respuestas:', e)
      setLogs([])
      setTotal(0)
      setErrorCarga(e?.message || 'Error cargando respuestas')
    } finally {
      setLoading(false)
    }
  }, [authorized, filtro, filtroIA, pagina])

  useEffect(() => {
    cargar()
  }, [cargar])

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

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-sky-200 border-t-sky-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 max-w-[1500px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Respuestas del Tío Viajero</h1>
          <p className="text-gray-500 text-sm mt-1">
            Registro de preguntas y respuestas para revisión de calidad, incluidos usuarios anónimos.
          </p>
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
          <span className="ml-auto text-sm text-gray-500">{total} respuestas</span>
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

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-sky-200 border-t-sky-600"></div>
          </div>
        ) : errorCarga ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-red-600">
            No se pudieron cargar las respuestas.
            <p className="text-xs mt-2 text-gray-500">{errorCarga}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            No hay respuestas {filtro === 'pendientes' ? 'pendientes de revisar' : filtro === 'revisadas' ? 'revisadas' : 'registradas'} todavía.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[220px]">Mensaje del usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[280px]">Respuesta</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Categorización</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => {
                      const fecha = formatFecha(log.created_at)
                      const abierto = expandido === log.id
                      const categoria = log.valoracion_ia ? BADGE_IA[log.valoracion_ia] : null
                      return (
                        <Fragment key={log.id}>
                          <tr
                            onClick={() => setExpandido(abierto ? null : log.id)}
                            className={`cursor-pointer hover:bg-gray-50 ${abierto ? 'bg-sky-50/60' : ''} ${log.revisado ? 'bg-green-50/40' : ''}`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap align-top">
                              <div className="text-sm font-medium text-gray-900">{fecha.dia}</div>
                              <div className="text-xs text-gray-500">{fecha.hora}</div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]" title={nombreUsuario(log)}>
                                {nombreUsuario(log)}
                              </div>
                              {log.usuario?.email && (
                                <div className="text-xs text-gray-500 truncate max-w-[180px]" title={log.usuario.email}>
                                  {log.usuario.email}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap align-top">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                log.user_id ? 'bg-sky-50 text-sky-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {log.user_id ? 'Registrado' : 'Anónimo'}
                              </span>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <p className="text-sm text-gray-900 line-clamp-2" title={log.pregunta || ''}>
                                {log.pregunta || '—'}
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <p className="text-sm text-gray-600 line-clamp-2" title={log.respuesta || ''}>
                                {log.respuesta || '—'}
                              </p>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap align-top">
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
                          </tr>
                          {abierto && (
                            <tr className="bg-gray-50">
                              <td colSpan={6} className="px-4 py-4">
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
                                  {log.locale && <span className="uppercase font-semibold">{log.locale}</span>}
                                  {log.funciones && log.funciones.length > 0 && (
                                    <span>{log.funciones.map((f) => f.name).join(', ')}</span>
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
                                  </div>
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
      </div>
    </div>
  )
}
