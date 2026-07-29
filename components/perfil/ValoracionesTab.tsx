'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Valoracion, Area } from '@/types/database.types'
import { StarIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/solid'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/lib/i18n'

interface ValoracionConArea extends Valoracion {
  area: Area
}

interface Props {
  userId: string
}

export function ValoracionesTab({ userId }: Props) {
  const { t, locale } = useLanguage()
  const [valoraciones, setValoraciones] = useState<ValoracionConArea[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadValoraciones()
  }, [userId])

  const loadValoraciones = async () => {
    try {
      const supabase = createClient()
      
      // Primero obtener las valoraciones
      const { data: valoracionesData, error: valoracionesError } = await (supabase as any)
          .from('valoraciones')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (valoracionesError) {
        console.error('Error obteniendo valoraciones:', valoracionesError)
        throw valoracionesError
      }

      if (!valoracionesData || valoracionesData.length === 0) {
        setValoraciones([])
        setLoading(false)
        return
      }

      // Obtener las áreas relacionadas
      const areaIds = valoracionesData.map((v: any) => v.area_id)
      const { data: areasData, error: areasError } = await (supabase as any)
          .from('areas')
        .select('*')
        .in('id', areaIds)

      if (areasError) {
        console.error('Error obteniendo áreas:', areasError)
        throw areasError
      }

      // Combinar valoraciones con sus áreas
      const valoracionesConAreas = valoracionesData.map((valoracion: any) => {
        const area = areasData?.find((a: any) => a.id === valoracion.area_id)
        return {
          ...valoracion,
          area: area || null
        }
      }).filter((v: any) => v.area !== null) as ValoracionConArea[]

      setValoraciones(valoracionesConAreas)
    } catch (error) {
      console.error('Error cargando valoraciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (valoracionId: string) => {
    if (!confirm(t('tab_val_del_q'))) return

    setDeleting(valoracionId)
    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
          .from('valoraciones')
        .delete()
        .eq('id', valoracionId)

      if (error) throw error
      setValoraciones(valoraciones.filter((v: any) => v.id !== valoracionId))
    } catch (error) {
      console.error('Error eliminando valoración:', error)
      alert(t('tab_val_err'))
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">{t('tab_val_loading')}</p>
        </div>
      </div>
    )
  }

  if (valoraciones.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <StarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">{t('tab_val_empty')}</p>
        <p className="text-sm text-gray-500">
          {t('tab_val_empty_hint')}
        </p>
      </div>
    )
  }

  const promedioRating = valoraciones.reduce((sum: any, v: any) => sum + v.rating, 0) / valoraciones.length

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('tab_val_avg')}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-3xl font-bold text-gray-900">
                {promedioRating.toFixed(1)}
              </span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`w-6 h-6 ${
                      star <= Math.round(promedioRating)
                        ? 'text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">{t('tab_val_total')}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {valoraciones.length}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de valoraciones */}
      <div className="space-y-4">
        {valoraciones.map((valoracion) => (
          <div
            key={valoracion.id}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Link
                      href={`/area/${valoracion.area.slug}`}
                      className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      {valoracion.area.nombre}
                    </Link>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <MapPinIcon className="w-4 h-4" />
                      {valoracion.area.ciudad}, {valoracion.area.provincia}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`w-5 h-5 ${
                          star <= valoracion.rating
                            ? 'text-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Comentario */}
                {valoracion.comentario && (
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg mb-3">
                    {valoracion.comentario}
                  </p>
                )}

                {/* Fecha */}
                <p className="text-xs text-gray-500">
                  {new Date(valoracion.created_at).toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 ml-4">
                <Link
                  href={`/area/${valoracion.area.slug}`}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title={t('tab_val_edit')}
                >
                  <PencilIcon className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => handleDelete(valoracion.id)}
                  disabled={deleting === valoracion.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title={t('tab_val_del')}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
