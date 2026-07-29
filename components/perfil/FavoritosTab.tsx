'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Favorito, Area } from '@/types/database.types'
import { HeartIcon, MapPinIcon, StarIcon } from '@heroicons/react/24/solid'
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/lib/i18n'

interface FavoritoConArea extends Favorito {
  area: Area
}

interface Props {
  userId: string
}

export function FavoritosTab({ userId }: Props) {
  const { t } = useLanguage()
  const [favoritos, setFavoritos] = useState<FavoritoConArea[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    loadFavoritos()
  }, [userId])

  const loadFavoritos = async () => {
    try {
      const supabase = createClient()
      
      // Primero obtener los favoritos
      const { data: favoritosData, error: favoritosError } = await (supabase as any)
          .from('favoritos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (favoritosError) {
        console.error('Error obteniendo favoritos:', favoritosError)
        throw favoritosError
      }

      if (!favoritosData || favoritosData.length === 0) {
        setFavoritos([])
        setLoading(false)
        return
      }

      // Obtener las áreas relacionadas
      const areaIds = favoritosData.map((f: any) => f.area_id)
      const { data: areasData, error: areasError } = await (supabase as any)
          .from('areas')
        .select('*')
        .in('id', areaIds)

      if (areasError) {
        console.error('Error obteniendo áreas:', areasError)
        throw areasError
      }

      // Combinar favoritos con sus áreas
      const favoritosConAreas = favoritosData.map((favorito: any) => {
        const area = areasData?.find((a: any) => a.id === favorito.area_id)
        return {
          ...favorito,
          area: area || null
        }
      }).filter((f: any) => f.area !== null) as FavoritoConArea[]

      setFavoritos(favoritosConAreas)
    } catch (error) {
      console.error('Error cargando favoritos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (favoritoId: string) => {
    if (!confirm(t('tab_fav_remove_q'))) return

    setRemoving(favoritoId)
    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
          .from('favoritos')
        .delete()
        .eq('id', favoritoId)

      if (error) throw error
      setFavoritos(favoritos.filter((f: any) => f.id !== favoritoId))
    } catch (error) {
      console.error('Error eliminando favorito:', error)
      alert(t('tab_fav_err'))
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">{t('tab_fav_loading')}</p>
        </div>
      </div>
    )
  }

  if (favoritos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <HeartOutlineIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">{t('tab_fav_empty')}</p>
        <p className="text-sm text-gray-500">
          {t('tab_fav_empty_hint')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {t('tab_fav_title', { n: favoritos.length })}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {favoritos.map((favorito) => (
          <div
            key={favorito.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
          >
            {/* Imagen */}
            <Link href={`/area/${favorito.area.slug}`} className="block relative">
              {favorito.area.foto_principal ? (
                <img
                  src={favorito.area.foto_principal}
                  alt={favorito.area.nombre}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center">
                  <MapPinIcon className="w-16 h-16 text-primary-300" />
                </div>
              )}
              
              {/* Botón de favorito */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleRemove(favorito.id)
                }}
                disabled={removing === favorito.id}
                className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
              >
                <HeartIcon className="w-6 h-6 text-red-500" />
              </button>
            </Link>

            {/* Contenido */}
            <div className="p-4">
              <Link href={`/area/${favorito.area.slug}`}>
                <h4 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors mb-2">
                  {favorito.area.nombre}
                </h4>
              </Link>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPinIcon className="w-4 h-4" />
                <span>{favorito.area.ciudad}, {favorito.area.provincia}</span>
              </div>

              {favorito.area.google_rating && (
                <div className="flex items-center gap-1 text-sm">
                  <StarIcon className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-gray-900">
                    {favorito.area.google_rating.toFixed(1)}
                  </span>
                </div>
              )}

              {favorito.area.precio_noche && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-lg font-bold text-primary-600">
                    {favorito.area.precio_noche}€
                  </span>
                  <span className="text-sm text-gray-600">
                    {favorito.area.precio_24h ? ' / 24h' : ' / noche'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
