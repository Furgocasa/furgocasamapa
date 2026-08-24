'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SparklesIcon, ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Area } from '@/types/database.types'

const PLACEHOLDER_TEXT = 'Área encontrada mediante búsqueda en Google Maps. Requiere verificación y enriquecimiento.'

const LOW_QUALITY_PATTERNS: RegExp[] = [
  /consult\w*\s+(antes|disponibilidad|directamente|con\s+el|la\s+disponibilidad)/i,
  /se\s+recomienda\s+(consultar|verificar|confirmar|comprobar)/i,
  /(verifica|verificar|comprobar|confirmar|confirma)\s+(los\s+)?(servicios|la\s+disponibilidad|antes)/i,
  /no\s+(se\s+)?(dispone|disponemos|tengo|tenemos|hay)\s+(de\s+)?(información|datos)/i,
  /no\s+(se\s+)?(especifica|indica|detalla|aclara|sabe|conoce)/i,
  /información\s+no\s+disponible/i,
  /se\s+desconoce/i,
  /(posiblemente|probablemente|puede\s+que|podría\s+(tener|disponer)|suele\s+tener)/i,
  /encantador (municipio|pueblo|localidad)/i,
  /en cuanto a las caracter/i,
  /en conclusi[oó]n/i,
  /destino ideal para/i,
  /impresi[oó]n duradera/i,
  /(por supuesto|aqu[ií] tienes)/i,
  /itinerario sugerido/i,
]

type FiltroTexto = 'todas' | 'con' | 'sin' | 'cortas' | 'flojas' | 'placeholder'

type EstadoTexto = 'vacia' | 'placeholder' | 'corta' | 'floja' | 'ok'

function textoDe(area: { descripcion?: string | null }) {
  return (area.descripcion || '').trim()
}

function estadoTexto(area: { descripcion?: string | null }): EstadoTexto {
  const desc = textoDe(area)
  if (!desc) return 'vacia'
  if (desc === PLACEHOLDER_TEXT || desc.includes('Requiere verificación y enriquecimiento')) return 'placeholder'
  if (desc.length < 200) return 'corta'
  if (LOW_QUALITY_PATTERNS.some((re) => re.test(desc))) return 'floja'
  return 'ok'
}

function badgeDe(estado: EstadoTexto, length: number) {
  if (estado === 'ok') return { label: `Con texto · ${length} c.`, className: 'bg-green-100 text-green-800' }
  if (estado === 'corta') return { label: `Corta · ${length} c.`, className: 'bg-yellow-100 text-yellow-800' }
  if (estado === 'floja') return { label: 'Baja calidad', className: 'bg-orange-100 text-orange-800' }
  if (estado === 'placeholder') return { label: 'Placeholder', className: 'bg-red-100 text-red-800' }
  return { label: 'Sin descripción', className: 'bg-gray-100 text-gray-700' }
}

export default function GestionDescripcionesPage() {
  const supabase = createClient()
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPais, setFilterPais] = useState('')
  const [filtro, setFiltro] = useState<FiltroTexto>('todas')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [processLog, setProcessLog] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [detalle, setDetalle] = useState<Area | null>(null)
  const [configReady, setConfigReady] = useState<boolean | null>(null)
  const [configError, setConfigError] = useState<string>('')
  const pageSize = 24

  useEffect(() => {
    loadAreas()
    fetch('/api/admin/check-config')
      .then((r) => r.json())
      .then((checks) => {
        setConfigReady(!!checks.openaiKeyValid)
        setConfigError(checks.openaiError || '')
      })
      .catch(() => setConfigReady(false))
  }, [])

  const loadAreas = async () => {
    try {
      setLoading(true)
      const all: Area[] = []
      let p = 0
      while (true) {
        const { data, error } = await (supabase as any)
          .from('areas')
          .select('id,nombre,slug,ciudad,provincia,pais,descripcion,activo')
          .eq('activo', true)
          .order('nombre')
          .range(p * 1000, p * 1000 + 999)
        if (error) throw error
        if (!data || data.length === 0) break
        all.push(...data)
        if (data.length < 1000) break
        p++
      }
      setAreas(all)
    } catch (e) {
      console.error(e)
      alert('Error al cargar las áreas')
    } finally {
      setLoading(false)
    }
  }

  const visibles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return areas.filter((area) => {
      if (filterPais && area.pais !== filterPais) return false
      if (q) {
        const blob = `${area.nombre} ${area.ciudad || ''} ${area.provincia || ''} ${area.pais || ''}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      const estado = estadoTexto(area)
      if (filtro === 'con') return estado === 'ok'
      if (filtro === 'sin') return estado === 'vacia'
      if (filtro === 'cortas') return estado === 'corta'
      if (filtro === 'flojas') return estado === 'floja'
      if (filtro === 'placeholder') return estado === 'placeholder'
      return true
    })
  }, [areas, searchTerm, filterPais, filtro])

  const counts = useMemo(() => {
    let total = 0
    let con = 0
    let sin = 0
    let cortas = 0
    let flojas = 0
    let placeholder = 0
    for (const area of areas) {
      if (filterPais && area.pais !== filterPais) continue
      total++
      const estado = estadoTexto(area)
      if (estado === 'ok') con++
      if (estado === 'vacia') sin++
      if (estado === 'corta') cortas++
      if (estado === 'floja') flojas++
      if (estado === 'placeholder') placeholder++
    }
    return { total, con, sin, cortas, flojas, placeholder }
  }, [areas, filterPais])

  const pageCount = Math.max(1, Math.ceil(visibles.length / pageSize))
  const pageItems = visibles.slice(page * pageSize, (page + 1) * pageSize)
  const paises = useMemo(
    () => Array.from(new Set(areas.map((a) => a.pais).filter((p): p is string => !!p))).sort(),
    [areas]
  )

  useEffect(() => {
    setPage(0)
    setSelectedIds(new Set())
  }, [filtro, filterPais, searchTerm])

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const enrichArea = async (areaId: string): Promise<{ success: boolean; error?: string }> => {
    const response = await fetch('/api/admin/enrich-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ areaId, force: true }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      const errorMsg = result.details || result.error || `Error ${response.status}`
      if (/credit|limit|exceeded|cuota/i.test(errorMsg) || result.errorType === 'RATE_LIMIT') {
        return { success: false, error: `⚠️ LÍMITE/CRÉDITOS EXCEDIDOS - ${errorMsg}` }
      }
      return { success: false, error: errorMsg }
    }
    if (!result.success) return { success: false, error: result.message || result.error || 'No se generó descripción' }
    return { success: true }
  }

  const handleEnrich = async (ids: string[]) => {
    if (!ids.length) return
    if (configReady === false) {
      alert('OpenAI no está configurada. Revisa OPENAI_API_KEY en Vercel.')
      return
    }
    const minutos = Math.ceil((ids.length * 25) / 60)
    const coste = (ids.length * 0.04).toFixed(2)
    if (!confirm(
      `¿Generar descripciones con gpt-5.6-terra para ${ids.length} área(s)?\n\n` +
      `Tiempo: ~${minutos} min · coste ~$${coste}\n` +
      `Investiga el recinto en internet. No usa SerpAPI.`
    )) return

    setProcessing(true)
    setProcessLog(['Iniciando...'])
    let ok = 0
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      const area = areas.find((a) => a.id === id)
      setProcessLog((prev) => [...prev, `[${i + 1}/${ids.length}] ${area?.nombre || id}`])
      const result = await enrichArea(id)
      if (result.success) {
        ok++
        setProcessLog((prev) => [...prev, `✓ ${area?.nombre}`])
      } else {
        setProcessLog((prev) => [...prev, `✗ ${area?.nombre} - ${result.error}`])
        if (result.error?.includes('CRÉDITOS') || result.error?.includes('EXCEDIDOS') || result.error?.includes('RATE_LIMIT')) {
          setProcessLog((prev) => [...prev, 'PROCESO DETENIDO: crédito o límite de OpenAI.'])
          break
        }
      }
      await new Promise((r) => setTimeout(r, 1000))
    }
    setProcessLog((prev) => [...prev, '', `Terminado: ${ok}/${ids.length}`])
    await loadAreas()
    setSelectedIds(new Set())
    setProcessing(false)
  }

  const FILTROS: { id: FiltroTexto; label: string; value: number }[] = [
    { id: 'todas', label: 'Todas', value: counts.total },
    { id: 'con', label: 'Con descripción', value: counts.con },
    { id: 'sin', label: 'Sin descripción', value: counts.sin },
    { id: 'cortas', label: 'Cortas', value: counts.cortas },
    { id: 'flojas', label: 'Baja calidad', value: counts.flojas },
    { id: 'placeholder', label: 'Placeholder', value: counts.placeholder },
  ]

  const pendientes = visibles.filter((a) => estadoTexto(a) !== 'ok')

  return (
    <div className="min-h-screen bg-gray-50">
      {configReady === false && (
        <div className="bg-red-50 border-b-4 border-red-400 px-4 sm:px-6 py-4 text-sm text-red-800">
          OpenAI no está lista. {configError}
        </div>
      )}

      <main className="px-4 sm:px-6 py-6">
        <Link href="/admin/areas" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Volver a Áreas
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-violet-600 p-3 rounded-xl">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de descripciones</h1>
            <p className="text-gray-600 mt-1">
              Lee y filtra los textos. El enriquecimiento investiga el recinto con gpt-5.6-terra.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Stat label="Áreas activas" value={counts.total} />
          <Stat label="Con descripción" value={counts.con} />
          <Stat label="Sin descripción" value={counts.sin} />
          <Stat label="Cortas" value={counts.cortas} />
          <Stat label="Flojas / placeholder" value={counts.flojas + counts.placeholder} warn={counts.flojas + counts.placeholder > 0} />
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  filtro === f.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label} ({f.value})
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar área, ciudad, provincia o país..."
              className="md:col-span-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={filterPais}
              onChange={(e) => setFilterPais(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Todos los países</option>
              {paises.map((pais) => (
                <option key={pais} value={pais}>{pais}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedIds(new Set(pageItems.map((a) => a.id)))}
              className="px-3 py-2 bg-gray-100 rounded-lg text-sm"
            >
              Seleccionar página ({pageItems.length})
            </button>
            <button
              onClick={() => setSelectedIds(new Set(pendientes.map((a) => a.id)))}
              className="px-3 py-2 bg-gray-100 rounded-lg text-sm"
            >
              Seleccionar pendientes ({pendientes.length})
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
              Quitar selección
            </button>
            <button
              onClick={() => handleEnrich([...selectedIds])}
              disabled={processing || selectedIds.size === 0}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50 inline-flex items-center gap-1"
            >
              <SparklesIcon className="w-4 h-4" />
              Enriquecer seleccionadas ({selectedIds.size})
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando descripciones...</p>
        ) : visibles.length === 0 ? (
          <p className="text-gray-500">No hay áreas con este filtro.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pageItems.map((area) => {
                const desc = textoDe(area)
                const estado = estadoTexto(area)
                const badge = badgeDe(estado, desc.length)
                const checked = selectedIds.has(area.id)
                return (
                  <article
                    key={area.id}
                    className={`bg-white rounded-lg shadow p-4 border-2 ${
                      checked ? 'border-violet-500' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(area.id)}
                        className="mt-1 w-5 h-5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 line-clamp-2">{area.nombre}</div>
                        <div className="text-xs text-gray-500">{area.ciudad} · {area.pais}</div>
                        <span className={`inline-flex mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-4 min-h-[5.5rem]">
                          {desc || 'Sin descripción.'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" onClick={() => setDetalle(area)} className="text-xs text-sky-600 hover:underline">
                            Leer completa
                          </button>
                          <Link href={`/area/${area.slug}`} target="_blank" className="text-xs text-sky-600 hover:underline">
                            Ver ficha
                          </Link>
                          <button
                            type="button"
                            disabled={processing}
                            onClick={() => handleEnrich([area.id])}
                            className="text-xs text-violet-600 hover:underline disabled:opacity-50"
                          >
                            Enriquecer
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-2 bg-white rounded-lg shadow disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {page + 1} / {pageCount} · {visibles.length} áreas
              </span>
              <button
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-2 bg-white rounded-lg shadow disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </>
        )}

        {detalle && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setDetalle(null)}>
            <div
              className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between p-4 border-b">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{detalle.nombre}</h2>
                  <p className="text-sm text-gray-500">{detalle.ciudad} · {detalle.pais} · {textoDe(detalle).length} caracteres</p>
                </div>
                <button type="button" onClick={() => setDetalle(null)} className="p-1 text-gray-500 hover:text-gray-800">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-5 text-gray-800 whitespace-pre-wrap leading-relaxed">
                {textoDe(detalle) || 'Sin descripción.'}
              </div>
            </div>
          </div>
        )}

        {processing && (
          <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
              <div className="bg-violet-600 px-6 py-4 text-white">
                <h3 className="text-xl font-bold">Generando descripciones</h3>
                <p className="text-violet-100 text-sm">gpt-5.6-terra + búsqueda web</p>
              </div>
              <div className="p-6 bg-gray-900 overflow-y-auto max-h-96 font-mono text-sm">
                {processLog.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.includes('✓') ? 'text-green-400' :
                      line.includes('✗') ? 'text-red-400' :
                      'text-gray-300'
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {processLog.length > 0 && !processing && (
          <div className="mt-6 bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm max-h-72 overflow-y-auto">
            {processLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className={`text-2xl font-bold ${warn ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}
