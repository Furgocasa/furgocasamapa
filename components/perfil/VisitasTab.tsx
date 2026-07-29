'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Visita, Area } from '@/types/database.types'
import { MapPinIcon, CalendarIcon, TrashIcon } from '@heroicons/react/24/outline'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/lib/i18n'

const MapaVisitas = dynamic(() => import('./MapaVisitas'), { ssr: false })

interface VisitaConArea extends Visita {
  area: Area
}

interface Props {
  userId: string
}

export function VisitasTab({ userId }: Props) {
  const { t, locale } = useLanguage()
  const [visitas, setVisitas] = useState<VisitaConArea[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [vistaActual, setVistaActual] = useState<'lista' | 'mapa'>('lista')

  useEffect(() => {
    loadVisitas()
  }, [userId])

  const loadVisitas = async () => {
    try {
      const supabase = createClient()
      
      // Primero obtener las visitas
      const { data: visitasData, error: visitasError } = await (supabase as any)
          .from('visitas')
        .select('*')
        .eq('user_id', userId)
        .order('fecha_visita', { ascending: false })

      if (visitasError) {
        console.error('Error obteniendo visitas:', visitasError)
        throw visitasError
      }

      if (!visitasData || visitasData.length === 0) {
        setVisitas([])
        setLoading(false)
        return
      }

      // Obtener las áreas relacionadas
      const areaIds = visitasData.map((v: any) => v.area_id)
      const { data: areasData, error: areasError } = await (supabase as any)
          .from('areas')
        .select('*')
        .in('id', areaIds)

      if (areasError) {
        console.error('Error obteniendo áreas:', areasError)
        throw areasError
      }

      // Combinar visitas con sus áreas
      const visitasConAreas = visitasData.map((visita: any) => {
        const area = areasData?.find((a: any) => a.id === visita.area_id)
        return {
          ...visita,
          area: area || null
        }
      }).filter((v: any) => v.area !== null) as VisitaConArea[]

      setVisitas(visitasConAreas)
    } catch (error) {
      console.error('Error cargando visitas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (visitaId: string) => {
    if (!confirm(t('tab_vis_del_q'))) return

    setDeleting(visitaId)
    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
          .from('visitas')
        .delete()
        .eq('id', visitaId)

      if (error) throw error
      setVisitas(visitas.filter((v: any) => v.id !== visitaId))
    } catch (error) {
      console.error('Error eliminando visita:', error)
      alert(t('tab_vis_err'))
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">{t('tab_vis_loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controles de vista */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('tab_vis_title', { n: visitas.length })}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setVistaActual('lista')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              vistaActual === 'lista'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('tab_vis_list')}
          </button>
          <button
            onClick={() => setVistaActual('mapa')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              vistaActual === 'mapa'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('tab_vis_map')}
          </button>
        </div>
      </div>

      {visitas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">{t('tab_vis_empty')}</p>
          <p className="text-sm text-gray-500">
            {t('tab_vis_empty_hint')}
          </p>
        </div>
      ) : vistaActual === 'mapa' ? (
        <MapaVisitas visitas={visitas} />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visitas.map((visita) => (
            <div
              key={visita.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link
                    href={`/area/${visita.area.slug}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    {visita.area.nombre}
                  </Link>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      {new Date(visita.fecha_visita).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      {visita.area.ciudad}, {visita.area.provincia}
                    </span>
                  </div>
                  {visita.notas && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {visita.notas}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(visita.id)}
                  disabled={deleting === visita.id}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title={t('tab_vis_del')}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
