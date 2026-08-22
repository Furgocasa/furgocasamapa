'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getServicioLabel, SERVICIO_ICONS } from '@/lib/i18n'
import {
  diffContribucion,
  mergeServicios,
  type DiffContribucion,
} from '@/lib/areas/contribuciones'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  HandThumbUpIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'

type Estado = 'pendiente' | 'aplicada' | 'rechazada'

type AreaJoin = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  pais: string | null
  activo: boolean | null
  servicios: Record<string, boolean> | null
  precio_noche: number | null
  plazas_totales: number | null
}

type Contribucion = {
  id: string
  area_id: string
  user_id: string
  servicios: Record<string, boolean> | null
  precio_noche: number | null
  plazas_totales: number | null
  comentario: string | null
  estado: Estado
  created_at: string
  areas: AreaJoin | AreaJoin[] | null
}

function areaDe(row: Contribucion): AreaJoin | null {
  if (!row.areas) return null
  return Array.isArray(row.areas) ? row.areas[0] || null : row.areas
}

function euro(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return `${n} €`
}

export default function AdminContribucionesPage() {
  const [filas, setFilas] = useState<Contribucion[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Estado | 'todas'>('pendiente')
  const [accionId, setAccionId] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('area_contribuciones')
      .select(
        'id, area_id, user_id, servicios, precio_noche, plazas_totales, comentario, estado, created_at, areas:area_id (id, nombre, slug, ciudad, pais, activo, servicios, precio_noche, plazas_totales)'
      )
      .order('created_at', { ascending: false })
      .limit(300)

    if (error) {
      console.error(error)
      setMensaje({ tipo: 'error', texto: error.message })
      setFilas([])
    } else {
      setFilas((data || []) as Contribucion[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visibles = useMemo(
    () => (filtro === 'todas' ? filas : filas.filter((f) => f.estado === filtro)),
    [filas, filtro]
  )

  const pendientes = filas.filter((f) => f.estado === 'pendiente').length
  const aplicadas = filas.filter((f) => f.estado === 'aplicada').length
  const rechazadas = filas.filter((f) => f.estado === 'rechazada').length
  const correccionesPendientes = filas.filter((f) => {
    if (f.estado !== 'pendiente') return false
    const area = areaDe(f)
    return diffContribucion(
      {
        servicios: area?.servicios,
        precio_noche: area?.precio_noche,
        plazas_totales: area?.plazas_totales,
      },
      {
        servicios: f.servicios,
        precio_noche: f.precio_noche,
        plazas_totales: f.plazas_totales,
      }
    ).esCorreccion
  }).length

  const aplicar = async (row: Contribucion) => {
    const area = areaDe(row)
    if (!area) {
      setMensaje({ tipo: 'error', texto: 'No se encontró el área de esta contribución.' })
      return
    }
    setAccionId(row.id)
    setMensaje(null)
    try {
      const supabase = createClient()
      const updateArea: Record<string, unknown> = {
        servicios: mergeServicios(area.servicios, row.servicios),
        updated_at: new Date().toISOString(),
      }
      if (row.precio_noche !== null && row.precio_noche !== undefined) {
        updateArea.precio_noche = row.precio_noche
      }
      if (row.plazas_totales !== null && row.plazas_totales !== undefined) {
        updateArea.plazas_totales = row.plazas_totales
      }

      const { error: errArea } = await (supabase as any).from('areas').update(updateArea).eq('id', row.area_id)
      if (errArea) throw errArea

      const { error: errEstado } = await (supabase as any)
        .from('area_contribuciones')
        .update({ estado: 'aplicada' })
        .eq('id', row.id)
      if (errEstado) throw errEstado

      setMensaje({ tipo: 'ok', texto: `Aplicada en ${area.nombre}.` })
      await load()
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e?.message || 'No se pudo aplicar.' })
    } finally {
      setAccionId(null)
    }
  }

  const rechazar = async (row: Contribucion) => {
    setAccionId(row.id)
    setMensaje(null)
    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('area_contribuciones')
        .update({ estado: 'rechazada' })
        .eq('id', row.id)
      if (error) throw error
      setMensaje({ tipo: 'ok', texto: 'Contribución rechazada.' })
      await load()
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e?.message || 'No se pudo rechazar.' })
    } finally {
      setAccionId(null)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ArrowLeftIcon className="w-4 h-4" />
        Panel
      </Link>

      <div className="flex items-start gap-3 mb-2">
        <HandThumbUpIcon className="w-8 h-8 text-sky-600 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Confirmaciones de viajeros</h1>
          <p className="text-gray-600">
            Lo que envían en «¿Has estado aquí?». Revisa el diff y aplícalo a la ficha o descártalo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
        <Kpi label="Pendientes" value={pendientes} tone="amber" />
        <Kpi label="Correcciones pendientes" value={correccionesPendientes} tone="sky" />
        <Kpi label="Aplicadas" value={aplicadas} tone="emerald" />
        <Kpi label="Rechazadas" value={rechazadas} tone="gray" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['pendiente', 'todas', 'aplicada', 'rechazada'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
              filtro === f
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
            }`}
          >
            {f === 'todas' ? 'Todas' : f === 'pendiente' ? 'Pendientes' : f === 'aplicada' ? 'Aplicadas' : 'Rechazadas'}
          </button>
        ))}
      </div>

      {mensaje && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando contribuciones…</p>
      ) : visibles.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
          No hay contribuciones en este filtro.
        </div>
      ) : (
        <div className="space-y-4">
          {visibles.map((row) => {
            const area = areaDe(row)
            const diff = diffContribucion(
              {
                servicios: area?.servicios,
                precio_noche: area?.precio_noche,
                plazas_totales: area?.plazas_totales,
              },
              {
                servicios: row.servicios,
                precio_noche: row.precio_noche,
                plazas_totales: row.plazas_totales,
              }
            )
            return (
              <ContribucionCard
                key={row.id}
                row={row}
                area={area}
                diff={diff}
                busy={accionId === row.id}
                onAplicar={() => aplicar(row)}
                onRechazar={() => rechazar(row)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'sky' | 'emerald' | 'gray' }) {
  const tones = {
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    sky: 'bg-sky-50 border-sky-200 text-sky-900',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-800',
  }
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm">{label}</p>
    </div>
  )
}

function ContribucionCard({
  row,
  area,
  diff,
  busy,
  onAplicar,
  onRechazar,
}: {
  row: Contribucion
  area: AreaJoin | null
  diff: DiffContribucion
  busy: boolean
  onAplicar: () => void
  onRechazar: () => void
}) {
  const fecha = new Date(row.created_at).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <article className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <EstadoBadge estado={row.estado} />
            {diff.esCorreccion ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                Corrección
              </span>
            ) : (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Confirmación
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-gray-900">{area?.nombre || 'Área eliminada'}</h2>
          <p className="text-sm text-gray-500">
            {[area?.ciudad, area?.pais].filter(Boolean).join(' · ') || '—'} · {fecha}
            {area && !area.activo ? ' · inactiva' : ''}
          </p>
        </div>
        {area && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/area/${area.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <MapPinIcon className="w-4 h-4" />
              Ficha
            </Link>
            <Link
              href={`/admin/areas/edit/${area.id}`}
              className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Editar
            </Link>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="font-semibold text-gray-700 mb-2">En la ficha ahora</p>
          <p>Precio: {euro(area?.precio_noche ?? null)}</p>
          <p>Plazas: {area?.plazas_totales ?? '—'}</p>
        </div>
        <div className="bg-sky-50 rounded-lg p-3">
          <p className="font-semibold text-sky-900 mb-2">Propone el viajero</p>
          <p>
            Precio:{' '}
            {row.precio_noche === null || row.precio_noche === undefined ? 'sin indicar' : euro(row.precio_noche)}
          </p>
          <p>
            Plazas:{' '}
            {row.plazas_totales === null || row.plazas_totales === undefined ? 'sin indicar' : row.plazas_totales}
          </p>
        </div>
      </div>

      {diff.precio && (
        <p className="text-sm mb-1">
          <span className="font-semibold">Precio:</span> {euro(diff.precio.de)} → {euro(diff.precio.a)}
        </p>
      )}
      {diff.plazas && (
        <p className="text-sm mb-1">
          <span className="font-semibold">Plazas:</span> {diff.plazas.de ?? '—'} → {diff.plazas.a}
        </p>
      )}

      {diff.servicios.length > 0 && (
        <div className="flex flex-wrap gap-2 my-3">
          {diff.servicios.map((s) => (
            <span
              key={s.id}
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                s.accion === 'anade' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {s.accion === 'anade' ? '+' : '−'} {SERVICIO_ICONS[s.id] || ''} {getServicioLabel(s.id, 'es')}
            </span>
          ))}
        </div>
      )}

      {!diff.esCorreccion && (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
          El viajero confirma los datos que ya figuran en la ficha. Aplicar no cambia precio ni plazas si no los
          rellenó; los servicios quedan alineados con lo que marcó.
        </p>
      )}

      {row.comentario && (
        <p className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
          <span className="font-semibold">Comentario: </span>
          {row.comentario}
        </p>
      )}

      <p className="text-xs text-gray-400 mb-4">Usuario {row.user_id.slice(0, 8)}…</p>

      {row.estado === 'pendiente' && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onAplicar}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircleIcon className="w-5 h-5" />
            Aplicar a la ficha
          </button>
          <button
            onClick={onRechazar}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            <XCircleIcon className="w-5 h-5" />
            Rechazar
          </button>
        </div>
      )}
    </article>
  )
}

function EstadoBadge({ estado }: { estado: Estado }) {
  const map = {
    pendiente: 'bg-amber-100 text-amber-800',
    aplicada: 'bg-emerald-100 text-emerald-800',
    rechazada: 'bg-gray-200 text-gray-700',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${map[estado]}`}>{estado}</span>
  )
}
