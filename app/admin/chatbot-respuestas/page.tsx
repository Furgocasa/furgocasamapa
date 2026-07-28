'use client'

/**
 * ADMIN: REVISIÓN DE RESPUESTAS DEL TÍO VIAJERO
 * =============================================
 * Lista TODAS las respuestas del chatbot (incluidas las de usuarios
 * anónimos) registradas en chatbot_respuestas_log. Permite filtrar
 * pendientes/revisadas, ver el detalle y marcarlas como revisadas
 * con una nota opcional.
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'

interface RespuestaLog {
  id: string
  created_at: string
  conversacion_id: string | null
  user_id: string | null
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
  correcta: { label: '✅ Correcta', clase: 'bg-green-50 text-green-700' },
  mejorable: { label: '🟡 Mejorable', clase: 'bg-amber-50 text-amber-700' },
  incorrecta: { label: '❌ Incorrecta', clase: 'bg-red-50 text-red-700' },
}

const PAGE_SIZE = 25

export default function ChatbotRespuestasPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [logs, setLogs] = useState<RespuestaLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'pendientes' | 'revisadas' | 'todas'>('pendientes')
  const [filtroIA, setFiltroIA] = useState<'todas' | 'correcta' | 'mejorable' | 'incorrecta' | 'sin_evaluar'>('todas')
  const [pagina, setPagina] = useState(0)
  const [total, setTotal] = useState(0)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [notas, setNotas] = useState<Record<string, string>>({})

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
    try {
      const supabase = createClient()
      let query = (supabase as any)
        .from('chatbot_respuestas_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(pagina * PAGE_SIZE, (pagina + 1) * PAGE_SIZE - 1)

      if (filtro === 'pendientes') query = query.eq('revisado', false)
      if (filtro === 'revisadas') query = query.eq('revisado', true)

      if (filtroIA === 'sin_evaluar') query = query.is('evaluado_at', null)
      else if (filtroIA !== 'todas') query = query.eq('valoracion_ia', filtroIA)

      const { data, error, count } = await query
      if (error) throw error
      setLogs(data || [])
      setTotal(count || 0)
    } catch (e) {
      console.error('Error cargando respuestas:', e)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [authorized, filtro, filtroIA, pagina])

  useEffect(() => {
    cargar()
  }, [cargar])

  const marcarRevisado = async (id: string, revisado: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('chatbot_respuestas_log')
        .update({ revisado, nota_revision: notas[id]?.trim() || null })
        .eq('id', id)
      if (error) throw error
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, revisado, nota_revision: notas[id]?.trim() || null } : l)))
    } catch (e) {
      console.error('Error actualizando:', e)
      alert('No se pudo actualizar. ¿Has ejecutado la migración chatbot_respuestas_log y tienes permisos de admin?')
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
      <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🤖 Respuestas del Tío Viajero</h1>
        <p className="text-gray-500 text-sm mt-1">
          Registro completo de respuestas del chatbot (incluidas las de usuarios anónimos) para revisión de calidad.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-4">
        {(['pendientes', 'revisadas', 'todas'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFiltro(f); setPagina(0) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtro === f ? 'bg-sky-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-sky-300'
            }`}
          >
            {f === 'pendientes' ? '⏳ Pendientes' : f === 'revisadas' ? '✅ Revisadas' : 'Todas'}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">{total} respuestas</span>
      </div>

      {/* Filtro por veredicto del agente revisor IA */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 uppercase">Revisor IA:</span>
        {([
          ['todas', 'Todas'],
          ['correcta', '✅ Correctas'],
          ['mejorable', '🟡 Mejorables'],
          ['incorrecta', '❌ Incorrectas'],
          ['sin_evaluar', '⏳ Sin evaluar'],
        ] as const).map(([valor, etiqueta]) => (
          <button
            key={valor}
            onClick={() => { setFiltroIA(valor); setPagina(0) }}
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
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
          No hay respuestas {filtro === 'pendientes' ? 'pendientes de revisar' : filtro === 'revisadas' ? 'revisadas' : 'registradas'} todavía.
          <p className="text-xs mt-2">Recuerda ejecutar la migración <code>20260728_chatbot_respuestas_log.sql</code> en Supabase.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className={`bg-white rounded-xl border overflow-hidden ${log.revisado ? 'border-green-200' : 'border-gray-200'}`}>
              {/* Fila resumen */}
              <button
                onClick={() => setExpandido(expandido === log.id ? null : log.id)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                  <span>{new Date(log.created_at).toLocaleString('es-ES')}</span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${log.user_id ? 'bg-sky-50 text-sky-700' : 'bg-gray-100 text-gray-600'}`}>
                    {log.user_id ? 'Registrado' : 'Anónimo'}
                  </span>
                  {log.locale && log.locale !== 'es' && <span className="uppercase font-bold">{log.locale}</span>}
                  {log.funciones && log.funciones.length > 0 && (
                    <span className="text-purple-600">🔧 {log.funciones.map((f) => f.name).join(', ')}</span>
                  )}
                  {log.valoracion_ia && (
                    <span className={`px-2 py-0.5 rounded-full font-medium ${BADGE_IA[log.valoracion_ia].clase}`}>
                      {BADGE_IA[log.valoracion_ia].label}
                    </span>
                  )}
                  {log.revisado && <span className="text-green-600 font-medium">👁 Revisada</span>}
                  <span className="ml-auto">{log.tokens ?? '—'} tokens · {log.duracion_ms ? `${(log.duracion_ms / 1000).toFixed(1)}s` : '—'}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">❓ {log.pregunta || '(sin pregunta)'}</p>
                <p className="text-sm text-gray-600 truncate mt-0.5">💬 {log.respuesta || '(sin respuesta)'}</p>
              </button>

              {/* Detalle expandido */}
              {expandido === log.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Pregunta</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{log.pregunta}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Respuesta completa</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{log.respuesta}</p>
                  </div>
                  {log.funciones && log.funciones.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Búsquedas ejecutadas</p>
                      <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-3 overflow-x-auto">{JSON.stringify(log.funciones, null, 2)}</pre>
                    </div>
                  )}
                  {log.valoracion_ia && (
                    <div className={`rounded-lg p-3 border ${
                      log.valoracion_ia === 'correcta' ? 'bg-green-50 border-green-200'
                        : log.valoracion_ia === 'mejorable' ? 'bg-amber-50 border-amber-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                        🧑‍⚖️ Veredicto del revisor IA: {BADGE_IA[log.valoracion_ia].label}
                      </p>
                      {log.motivo_ia && <p className="text-sm text-gray-800"><strong>Motivo:</strong> {log.motivo_ia}</p>}
                      {log.sugerencia_ia && <p className="text-sm text-gray-800 mt-1"><strong>Sugerencia:</strong> {log.sugerencia_ia}</p>}
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Nota de revisión (opcional)</label>
                      <input
                        type="text"
                        value={notas[log.id] ?? log.nota_revision ?? ''}
                        onChange={(e) => setNotas((prev) => ({ ...prev, [log.id]: e.target.value }))}
                        placeholder="p.ej. respuesta inventada, faltó buscar, OK..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    {log.revisado ? (
                      <button
                        onClick={() => marcarRevisado(log.id, false)}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors whitespace-nowrap"
                      >
                        Desmarcar
                      </button>
                    ) : (
                      <button
                        onClick={() => marcarRevisado(log.id, true)}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors whitespace-nowrap"
                      >
                        ✓ Marcar revisada
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                disabled={pagina === 0}
                className="px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-200 disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-500">Página {pagina + 1} de {totalPaginas}</span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                disabled={pagina >= totalPaginas - 1}
                className="px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-200 disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
