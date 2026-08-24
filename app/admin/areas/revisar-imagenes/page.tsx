'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeftIcon,
  PhotoIcon,
  ShieldExclamationIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import type { Area } from '@/types/database.types'
import {
  CLASE_LABELS,
  flagImages,
  uniqueUrlsOf,
  type ClasificacionImagen,
  type ImagenFlagged,
} from '@/lib/areas/image-copyright'

type Filtro = 'alto' | 'medio' | ClasificacionImagen | 'todas'

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'alto', label: 'Riesgo alto' },
  { id: 'medio', label: 'Revisar (medio)' },
  { id: 'stock', label: 'Stock' },
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'revista', label: 'Revistas' },
  { id: 'social', label: 'Facebook/Instagram' },
  { id: 'basura', label: 'Basura' },
  { id: 'todas', label: 'Todas las sospechosas' },
]

export default function RevisarImagenesPage() {
  const supabase = createClient()
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('alto')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const pageSize = 48

  useEffect(() => {
    fetchAreas()
  }, [])

  const fetchAreas = async () => {
    try {
      setLoading(true)
      const all: Area[] = []
      const size = 1000
      let p = 0
      while (true) {
        const { data, error } = await (supabase as any)
          .from('areas')
          .select('id,nombre,slug,ciudad,provincia,pais,tipo_area,foto_principal,fotos_urls,activo')
          .eq('activo', true)
          .order('nombre')
          .range(p * size, (p + 1) * size - 1)
        if (error) throw error
        if (!data || data.length === 0) break
        all.push(...data)
        if (data.length < size) break
        p++
      }
      setAreas(all)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const flagged = useMemo(() => flagImages(areas as any), [areas])
  const areasSinFoto = useMemo(
    () => areas.filter((a) => uniqueUrlsOf(a).length === 0),
    [areas]
  )

  const visibles = useMemo(() => {
    const q = search.trim().toLowerCase()
    return flagged.filter((f) => {
      if (filtro === 'alto' && f.riesgo !== 'ALTO') return false
      if (filtro === 'medio' && f.riesgo !== 'MEDIO') return false
      if (filtro !== 'alto' && filtro !== 'medio' && filtro !== 'todas' && f.clasificacion !== filtro) return false
      if (!q) return true
      return (
        f.nombre.toLowerCase().includes(q) ||
        (f.ciudad || '').toLowerCase().includes(q) ||
        (f.pais || '').toLowerCase().includes(q) ||
        f.host.includes(q)
      )
    })
  }, [flagged, filtro, search])

  const pageCount = Math.max(1, Math.ceil(visibles.length / pageSize))
  const pageItems = visibles.slice(page * pageSize, (page + 1) * pageSize)

  useEffect(() => {
    setPage(0)
    setSelected(new Set())
  }, [filtro, search])

  const keyOf = (f: ImagenFlagged) => `${f.areaId}||${f.url}`

  const toggle = (f: ImagenFlagged) => {
    const k = keyOf(f)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  const selectPage = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      pageItems.forEach((f) => next.add(keyOf(f)))
      return next
    })
  }

  const appendLog = (line: string) => setLog((prev) => [...prev, line])

  const deleteRemovals = async (removals: Array<{ areaId: string; url: string }>, label: string) => {
    if (!removals.length) return
    setProcessing(true)
    appendLog(`🗑️ ${label}: ${removals.length} imagen(es)...`)
    try {
      const resp = await fetch('/api/admin/revisar-imagenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', removals }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Error al borrar')
      appendLog(`✅ Borradas ${data.imagesRemoved} fotos en ${data.areasUpdated} áreas (${data.leftEmpty} quedan vacías)`)
      setSelected(new Set())
      await fetchAreas()
    } catch (e: any) {
      appendLog(`❌ ${e.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteSelected = () => {
    const removals = [...selected].map((k) => {
      const [areaId, url] = k.split('||')
      return { areaId, url }
    })
    deleteRemovals(removals, 'Borrado selección')
  }

  const handlePurgeAlto = async () => {
    if (!confirm('¿Borrar TODAS las imágenes de riesgo alto (stock, catálogo, revistas, redes y basura)?')) return
    setProcessing(true)
    appendLog('🗑️ Purgando riesgo alto en todas las áreas...')
    try {
      const resp = await fetch('/api/admin/revisar-imagenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge_alto' }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Error al purgar')
      appendLog(`✅ Purga: ${data.imagesRemoved} fotos, ${data.areasUpdated} áreas, ${data.leftEmpty} vacías`)
      setSelected(new Set())
      await fetchAreas()
    } catch (e: any) {
      appendLog(`❌ ${e.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const generateForAreas = async (ids: string[]) => {
    if (!ids.length) return
    setProcessing(true)
    appendLog(`🎨 Generando ${ids.length} imagen(es) con IA...`)
    let ok = 0
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      const area = areas.find((a) => a.id === id)
      appendLog(`  ${i + 1}/${ids.length} ${area?.nombre || id}`)
      try {
        const resp = await fetch('/api/admin/revisar-imagenes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate', areaId: id }),
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.error || 'Error IA')
        ok++
        appendLog(`  ✅ ${area?.nombre}`)
      } catch (e: any) {
        appendLog(`  ❌ ${area?.nombre}: ${e.message}`)
      }
    }
    appendLog(`🎨 Terminado: ${ok}/${ids.length} generadas`)
    await fetchAreas()
    setProcessing(false)
  }

  const altoCount = flagged.filter((f) => f.riesgo === 'ALTO').length

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-4 sm:px-6 py-6">
        <Link href="/admin" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Volver al panel
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-amber-500 to-red-500 p-3 rounded-xl">
            <ShieldExclamationIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Revisar derechos de imagen</h1>
            <p className="text-gray-600 mt-1">
              Localiza fotos genéricas o de terceros, bórralas y genera una ilustración propia si el área se queda vacía.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat label="Áreas activas" value={areas.length} />
          <Stat label="Imágenes alto riesgo" value={altoCount} warn />
          <Stat label="Sospechosas (todas)" value={flagged.length} />
          <Stat label="Áreas sin foto" value={areasSinFoto.length} />
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
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar área, ciudad, país o dominio..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <div className="flex flex-wrap gap-2">
            <button onClick={selectPage} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
              Seleccionar página ({pageItems.length})
            </button>
            <button onClick={() => setSelected(new Set())} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
              Quitar selección
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={processing || selected.size === 0}
              className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50 inline-flex items-center gap-1"
            >
              <TrashIcon className="w-4 h-4" />
              Borrar seleccionadas ({selected.size})
            </button>
            <button
              onClick={handlePurgeAlto}
              disabled={processing || altoCount === 0}
              className="px-3 py-2 bg-red-800 text-white rounded-lg text-sm disabled:opacity-50"
            >
              Purgar todo el riesgo alto
            </button>
            <button
              onClick={() => {
                const lote = areasSinFoto.slice(0, 20)
                if (!confirm(`Hay ${areasSinFoto.length} áreas sin foto. Se generarán las primeras 20 (unas 20s y crédito OpenAI por imagen). El resto puedes seguirlo después.`)) return
                generateForAreas(lote.map((a) => a.id))
              }}
              disabled={processing || areasSinFoto.length === 0}
              className="px-3 py-2 bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50 inline-flex items-center gap-1"
            >
              <SparklesIcon className="w-4 h-4" />
              Generar IA (lote de 20 / {areasSinFoto.length} vacías)
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando áreas e imágenes...</p>
        ) : visibles.length === 0 ? (
          <p className="text-gray-500">No hay imágenes con este filtro.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pageItems.map((f) => {
                const k = keyOf(f)
                const checked = selected.has(k)
                return (
                  <article
                    key={k}
                    className={`bg-white rounded-lg shadow overflow-hidden border-2 ${
                      checked ? 'border-red-500' : 'border-transparent'
                    }`}
                  >
                    <label className="block cursor-pointer">
                      <div className="relative h-36 bg-gray-100">
                        {f.clasificacion === 'basura' || f.clasificacion === 'invalid' ? (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs p-3 text-center">
                            <PhotoIcon className="w-8 h-8 mb-1" />
                          </div>
                        ) : (
                          <img
                            src={f.url}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        )}
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(f)}
                          className="absolute top-2 left-2 w-5 h-5"
                        />
                        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          f.riesgo === 'ALTO' ? 'bg-red-600 text-white' : 'bg-amber-400 text-gray-900'
                        }`}>
                          {f.riesgo}
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="font-medium text-sm text-gray-900 line-clamp-2">{f.nombre}</div>
                        <div className="text-xs text-gray-500">{f.ciudad} · {f.pais}</div>
                        <div className="text-xs text-gray-400 truncate mt-1">{f.host}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                            {CLASE_LABELS[f.clasificacion]}
                          </span>
                          {f.areasDistintas > 1 && (
                            <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                              x{f.areasDistintas} áreas
                            </span>
                          )}
                          {f.esPrincipal && (
                            <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">principal</span>
                          )}
                        </div>
                      </div>
                    </label>
                    <div className="px-3 pb-3 flex gap-2">
                      <Link
                        href={`/area/${f.slug}`}
                        target="_blank"
                        className="text-xs text-sky-600 hover:underline"
                      >
                        Ver ficha
                      </Link>
                      <button
                        disabled={processing}
                        onClick={() => generateForAreas([f.areaId])}
                        className="text-xs text-violet-600 hover:underline disabled:opacity-50"
                      >
                        Generar IA
                      </button>
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
                Página {page + 1} / {pageCount} · {visibles.length} imágenes
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

        {log.length > 0 && (
          <div className="mt-6 bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm max-h-72 overflow-y-auto">
            {log.map((line, i) => (
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
