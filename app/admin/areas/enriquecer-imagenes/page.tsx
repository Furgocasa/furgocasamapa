'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import type { Area } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { esFotoMostrable, uniqueUrlsOf } from '@/lib/areas/image-copyright'

type FiltroFotos = 'todas' | 'con' | 'sin' | 'una' | 'varias' | 'rotas'

function fotosMostrables(area: { foto_principal?: string | null; fotos_urls?: string[] | null }) {
  return uniqueUrlsOf(area).filter((url) => esFotoMostrable(url))
}

function Thumb({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center text-gray-400 ${className || ''}`}>
        <PhotoIcon className="w-8 h-8" />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

export default function GestionImagenesPage() {
  const supabase = createClient()
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [processLog, setProcessLog] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPais, setFilterPais] = useState('')
  const [filtroFotos, setFiltroFotos] = useState<FiltroFotos>('todas')
  const [page, setPage] = useState(0)
  const [detalle, setDetalle] = useState<Area | null>(null)
  const pageSize = 24

  useEffect(() => {
    fetchAreas()
  }, [])

  const fetchAreas = async () => {
    try {
      setLoading(true)
      const allAreas: Area[] = []
      const size = 1000
      let p = 0
      while (true) {
        const { data, error } = await (supabase as any)
          .from('areas')
          .select('id,nombre,slug,ciudad,provincia,pais,website,foto_principal,fotos_urls,activo')
          .eq('activo', true)
          .order('nombre')
          .range(p * size, (p + 1) * size - 1)
        if (error) throw error
        if (!data || data.length === 0) break
        allAreas.push(...data)
        if (data.length < size) break
        p++
      }
      setAreas(allAreas)
    } catch (error) {
      console.error(error)
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
      const n = fotosMostrables(area).length
      const total = uniqueUrlsOf(area).length
      if (filtroFotos === 'con') return n >= 1
      if (filtroFotos === 'sin') return n === 0
      if (filtroFotos === 'una') return n === 1
      if (filtroFotos === 'varias') return n >= 2
      if (filtroFotos === 'rotas') return total > 0 && n === 0
      return true
    })
  }, [areas, searchTerm, filterPais, filtroFotos])

  const counts = useMemo(() => {
    let total = 0
    let con = 0
    let sin = 0
    let una = 0
    let varias = 0
    let rotas = 0
    for (const area of areas) {
      if (filterPais && area.pais !== filterPais) continue
      total++
      const n = fotosMostrables(area).length
      const raw = uniqueUrlsOf(area).length
      if (n === 0) sin++
      if (n >= 1) con++
      if (n === 1) una++
      if (n >= 2) varias++
      if (raw > 0 && n === 0) rotas++
    }
    return { con, sin, una, varias, rotas, total }
  }, [areas, filterPais])

  const pageCount = Math.max(1, Math.ceil(visibles.length / pageSize))
  const pageItems = visibles.slice(page * pageSize, (page + 1) * pageSize)

  useEffect(() => {
    setPage(0)
    setSelectedIds(new Set())
  }, [filtroFotos, filterPais, searchTerm])

  const paises = useMemo(
    () => Array.from(new Set(areas.map((a) => a.pais).filter((p): p is string => !!p))).sort(),
    [areas]
  )

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const enrichImages = async (areaId: string): Promise<boolean> => {
    const resp = await fetch('/api/admin/scrape-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ areaId }),
    })
    const data = await resp.json()
    if (!resp.ok || !data.success) {
      setProcessLog((prev) => [...prev, `  ✗ ${data.message || data.error || 'Sin imágenes'}`])
      return false
    }
    if (data.skipped) {
      setProcessLog((prev) => [...prev, `  ↷ Ya tenía fotos propias (${data.total_imagenes})`])
      return true
    }
    setProcessLog((prev) => [...prev, `  ✓ ${data.total_imagenes} fotos (${data.fuente || 'web'})`])
    return true
  }

  const handleEnrich = async (ids: string[]) => {
    if (!ids.length) return
    if (!confirm(
      `¿Enriquecer imágenes de ${ids.length} área(s)?\n\n` +
      `Web oficial del recinto. Si no hay foto propia, IA.\n` +
      `Ni Google, ni Park4Night, ni mapas, ni la misma URL en dos fichas.`
    )) return

    setProcessing(true)
    setProcessLog([])
    let ok = 0
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      const area = areas.find((a) => a.id === id)
      setProcessLog((prev) => [...prev, `\n🖼️ ${i + 1}/${ids.length} ${area?.nombre || id}`])
      try {
        if (await enrichImages(id)) ok++
      } catch (e: any) {
        setProcessLog((prev) => [...prev, `  ❌ ${e.message}`])
      }
      if (i < ids.length - 1) await new Promise((r) => setTimeout(r, 2000))
    }
    setProcessLog((prev) => [...prev, `\n✅ Terminado: ${ok}/${ids.length}`])
    await fetchAreas()
    setSelectedIds(new Set())
    setProcessing(false)
  }

  const FILTROS: { id: FiltroFotos; label: string; value: number }[] = [
    { id: 'todas', label: 'Todas', value: counts.total },
    { id: 'con', label: 'Con foto', value: counts.con },
    { id: 'sin', label: 'Sin foto', value: counts.sin },
    { id: 'una', label: 'Una foto', value: counts.una },
    { id: 'varias', label: 'Varias fotos', value: counts.varias },
    { id: 'rotas', label: 'Rotas / no usables', value: counts.rotas },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-4 sm:px-6 py-6">
        <Link href="/admin/areas" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Volver a Áreas
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
            <PhotoIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de imágenes</h1>
            <p className="text-gray-600 mt-1">
              Mira las fotos de cada área, filtra y enriquece las que falten. Web oficial; si no hay, IA.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Stat label="Áreas activas" value={counts.total} />
          <Stat label="Con foto" value={counts.con} />
          <Stat label="Sin foto" value={counts.sin} />
          <Stat label="Una / varias" value={`${counts.una} / ${counts.varias}`} />
          <Stat label="Rotas" value={counts.rotas} warn={counts.rotas > 0} />
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltroFotos(f.id)}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  filtroFotos === f.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              onClick={() => setSelectedIds(new Set(visibles.filter((a) => fotosMostrables(a).length === 0).map((a) => a.id)))}
              className="px-3 py-2 bg-gray-100 rounded-lg text-sm"
            >
              Seleccionar sin foto
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
              Quitar selección
            </button>
            <button
              onClick={() => handleEnrich([...selectedIds])}
              disabled={processing || selectedIds.size === 0}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50 inline-flex items-center gap-1"
            >
              <PhotoIcon className="w-4 h-4" />
              Enriquecer seleccionadas ({selectedIds.size})
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando áreas e imágenes...</p>
        ) : visibles.length === 0 ? (
          <p className="text-gray-500">No hay áreas con este filtro.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pageItems.map((area) => {
                const fotos = fotosMostrables(area)
                const checked = selectedIds.has(area.id)
                return (
                  <article
                    key={area.id}
                    className={`bg-white rounded-lg shadow overflow-hidden border-2 ${
                      checked ? 'border-violet-500' : 'border-transparent'
                    }`}
                  >
                    <div className="relative h-40 bg-gray-100 cursor-pointer" onClick={() => setDetalle(area)}>
                      {fotos[0] ? (
                        <Thumb src={fotos[0]} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <PhotoIcon className="w-10 h-10" />
                        </div>
                      )}
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(area.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 left-2 w-5 h-5"
                      />
                      <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white">
                        {fotos.length} foto{fotos.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    {fotos.length > 1 && (
                      <div className="flex gap-1 p-1 bg-gray-50">
                        {fotos.slice(0, 5).map((url) => (
                          <Thumb key={url} src={url} className="w-10 h-10 object-cover rounded" />
                        ))}
                        {fotos.length > 5 && (
                          <div className="w-10 h-10 rounded bg-gray-200 text-[10px] flex items-center justify-center text-gray-600">
                            +{fotos.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-3">
                      <div className="font-medium text-sm text-gray-900 line-clamp-2">{area.nombre}</div>
                      <div className="text-xs text-gray-500">{area.ciudad} · {area.pais}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setDetalle(area)}
                          className="text-xs text-sky-600 hover:underline"
                        >
                          Ver fotos
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
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between p-4 border-b">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{detalle.nombre}</h2>
                  <p className="text-sm text-gray-500">{detalle.ciudad} · {detalle.pais}</p>
                </div>
                <button type="button" onClick={() => setDetalle(null)} className="p-1 text-gray-500 hover:text-gray-800">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fotosMostrables(detalle).length === 0 ? (
                  <p className="text-gray-500 col-span-2">Este área no tiene fotos usables.</p>
                ) : (
                  fotosMostrables(detalle).map((url, i) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="block">
                      <Thumb src={url} className="w-full h-56 object-cover rounded-lg" />
                      <div className="text-xs text-gray-400 mt-1 truncate">
                        {i === 0 ? 'Principal · ' : ''}{url}
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {processing && (
          <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
              <div className="bg-violet-600 px-6 py-4 text-white">
                <h3 className="text-xl font-bold">Buscando imágenes</h3>
                <p className="text-violet-100 text-sm">Web oficial; si no hay, IA propia</p>
              </div>
              <div className="p-6 bg-gray-900 overflow-y-auto max-h-96 font-mono text-sm">
                {processLog.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.includes('✅') ? 'text-green-400' :
                      line.includes('✗') || line.includes('❌') ? 'text-red-400' :
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

function Stat({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className={`text-2xl font-bold ${warn ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}
