'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeftIcon, HeartIcon, ShareIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import type { Area } from '@/types/database.types'
import { useLanguage, getTipoAreaLabel } from '@/lib/i18n'
import { getTipoAreaBadgeClass } from '@/lib/areas/tipo-area'
import { isImagenIA } from '@/lib/areas/image-copyright'
import AuthModal from '@/components/ui/AuthModal'
import {
  hasLocalFavorite,
  addLocalFavorite,
  removeLocalFavorite,
  getLocalFavorites,
  syncLocalFavoritesToAccount,
} from '@/lib/favoritos/local'
import { track } from '@/lib/analytics/track'

interface Props {
  area: Area
}

export function DetalleAreaHeader({ area }: Props) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [localFavCount, setLocalFavCount] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()
  const { toast, showToast, hideToast } = useToast()
  const { locale, t } = useLanguage()

  useEffect(() => {
    checkFavoriteStatus()
  }, [])

  const checkFavoriteStatus = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        // Usuario anónimo: los favoritos viven en este dispositivo
        setIsFavorite(hasLocalFavorite(area.id))
        setLocalFavCount(getLocalFavorites().length)
        return
      }
      setUser(session.user)

      const { data } = await (supabase as any)
          .from('favoritos')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('area_id', area.id)
        .single()

      if (data) setIsFavorite(true)
    } catch (error) {
      console.error('Error checking favorite:', error)
    }
  }

  const handleFavorite = async () => {
    // Sin cuenta: el corazón funciona igualmente (favorito local)
    if (!user) {
      if (isFavorite) {
        const n = removeLocalFavorite(area.id)
        setIsFavorite(false)
        setLocalFavCount(n)
        track('area_unfavorite', { area_id: area.id, event_data: { modo: 'local' } })
        showToast('Quitada de tus sitios', 'info')
      } else {
        const n = addLocalFavorite(area.id)
        setIsFavorite(true)
        setLocalFavCount(n)
        track('area_favorite', { area_id: area.id, event_data: { modo: 'local' } })
        showToast('❤️ Guardada en tus sitios', 'success')
      }
      return
    }

    try {
      const supabase = createClient()

      if (isFavorite) {
        const { error } = await (supabase as any)
          .from('favoritos')
          .delete()
          .eq('user_id', user.id)
          .eq('area_id', area.id)

        if (error) throw error
        setIsFavorite(false)
        track('area_unfavorite', { area_id: area.id })
        showToast('❌ Quitado de favoritos', 'info')
      } else {
        const { error } = await (supabase as any)
          .from('favoritos')
          .insert({ user_id: user.id, area_id: area.id })

        if (error && error.code !== '23505') throw error
        setIsFavorite(true)
        track('area_favorite', { area_id: area.id })
        showToast('❤️ Añadido a favoritos', 'success')
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error)
      showToast(error.message || 'Error al actualizar favorito', 'error')
    }
  }

  const handleAuthSuccess = async (loggedUser: any) => {
    setShowAuthModal(false)
    setUser(loggedUser)
    try {
      const supabase = createClient()
      const n = await syncLocalFavoritesToAccount(supabase, loggedUser.id)
      setLocalFavCount(0)
      if (n > 0) {
        showToast(
          n === 1
            ? '❤️ Tu área guardada ya está en tu cuenta'
            : `❤️ Tus ${n} áreas guardadas ya están en tu cuenta`,
          'success'
        )
      }
    } catch {
      /* la sincronización global lo reintentará */
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: area.nombre,
          text: area.descripcion || `Área para autocaravanas en ${area.ciudad}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error compartiendo:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      showToast('🔗 Enlace copiado al portapapeles', 'success')
    }
  }

  const getTipoAreaColor = (tipo: string) => getTipoAreaBadgeClass(tipo)

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      <div className="relative w-full max-w-[1600px] mx-auto bg-gray-50">
        {/* Contenedor principal con bordes redondeados en desktop */}
        <div className="relative h-[280px] sm:h-[340px] md:h-[450px] md:rounded-b-3xl overflow-hidden bg-slate-200 shadow-sm max-w-[1600px] mx-auto">
          {area.foto_principal ? (
            <Image
              src={area.foto_principal}
              alt={area.nombre}
              fill
              className="object-cover"
              priority
              quality={90}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200">
              <MapPinIcon className="w-24 h-24 text-slate-400" />
            </div>
          )}
          
          {/* Overlay gradient más sutil y elegante */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-slate-900/10 mix-blend-multiply" />
          {isImagenIA(area.foto_principal) && (
            <div className="absolute bottom-4 left-4 z-20 group">
              <button
                type="button"
                className="flex items-center gap-2 bg-[#0b3c74]/85 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow hover:bg-[#0b3c74] transition-colors"
                aria-describedby="ai-image-help"
              >
                <span aria-hidden>💧</span>
                AI Generated Image
              </button>
              <div
                id="ai-image-help"
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-0 mb-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg bg-white text-slate-700 text-xs leading-relaxed p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-opacity"
              >
                Esta imagen es una imagen generada con inteligencia artificial, que ha sido generada al no disponer de imágenes originales del área. Si eres el propietario del lugar o un usuario, estaremos encantados de recibir una foto real y sustituirla.
              </div>
            </div>
          )}
        </div>

        {/* Botones flotantes (Navegación) */}
        <div className="absolute top-3 sm:top-6 left-0 right-0 px-3 sm:px-4 md:px-8 flex justify-between items-center max-w-[1600px] mx-auto z-10">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 bg-white/90 backdrop-blur-md flex items-center justify-center rounded-full shadow-sm hover:bg-white transition-all text-slate-700 border border-white/20"
            aria-label="Volver"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="w-11 h-11 bg-white/90 backdrop-blur-md flex items-center justify-center rounded-full shadow-sm hover:bg-white transition-all text-slate-700 border border-white/20"
              aria-label="Compartir"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleFavorite}
              className="relative w-11 h-11 bg-white/90 backdrop-blur-md flex items-center justify-center rounded-full shadow-sm hover:bg-white transition-all border border-white/20"
              aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              {isFavorite ? (
                <HeartIconSolid className="w-6 h-6 text-red-500" />
              ) : (
                <HeartIcon className="w-6 h-6 text-slate-700" />
              )}
              {!user && localFavCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow">
                  {localFavCount}
                </span>
              )}
            </button>
          </div>
        </div>


        {/* Información superpuesta (Glassmorphism) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-12 max-w-[1200px] mx-auto z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-4">
                {/* Badge tipo de área */}
                <span className={`${getTipoAreaColor(area.tipo_area)} px-4 py-1.5 rounded-full text-xs font-bold tracking-wider shadow-sm`}>
                  {getTipoAreaLabel(area.tipo_area, locale)}
                </span>
                
                {area.verificado && (
                  <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                    <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('verified')}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-white mb-2 md:mb-3 tracking-tight drop-shadow-md break-words">
                {area.nombre}
              </h1>
              
              <div className="flex items-start gap-2 text-slate-200 text-xs sm:text-sm md:text-base font-medium drop-shadow-sm">
                <MapPinIcon className="w-4 h-4 md:w-5 md:h-5 text-slate-300 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{area.direccion || `${area.ciudad}, ${area.provincia}`}</span>
              </div>
            </div>

            {/* Panel lateral derecho en hero (Rating y Precio) */}
            {(area.google_rating || (area.precio_noche !== null && area.precio_noche !== undefined)) && (
              <div className="flex items-center self-start bg-black/40 backdrop-blur-lg border border-white/20 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl">
                {area.google_rating && (
                  <div className={`flex flex-col items-center justify-center px-3 sm:px-5 ${(area.precio_noche !== null && area.precio_noche !== undefined) ? 'border-r border-white/20' : ''}`}>
                    <div className="flex items-center gap-1 text-white font-bold text-xl sm:text-2xl">
                      <span className="text-amber-400 text-lg sm:text-xl">★</span>
                      {area.google_rating.toFixed(1)}
                    </div>
                    <span className="text-[10px] sm:text-xs text-slate-300 font-medium tracking-wider uppercase mt-1">
                      {(area.google_ratings_total ?? 0) > 0
                        ? `${area.google_ratings_total} valoraciones`
                        : 'Rating'}
                    </span>
                  </div>
                )}
                
                {area.precio_noche !== null && area.precio_noche !== undefined && (
                  <div className="flex flex-col items-center justify-center px-3 sm:px-5">
                    <div className="text-white font-bold text-xl sm:text-2xl">
                      {area.precio_noche === 0 ? t('free') : `${area.precio_noche}€`}
                    </div>
                    <span className="text-xs text-slate-300 font-medium tracking-wider uppercase mt-1">
                      {area.precio_24h ? '/24h' : t('per_night')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banner suave: favoritos guardados sin cuenta */}
      {!user && localFavCount > 0 && (
        <div className="w-full max-w-[1600px] mx-auto">
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-sky-50 hover:bg-sky-100 border-b border-sky-200 text-sky-900 text-sm font-medium py-2.5 px-4 transition-colors text-center"
          >
            <span>
              ❤️ {localFavCount === 1
                ? 'Tienes 1 área guardada en este dispositivo.'
                : `Tienes ${localFavCount} áreas guardadas en este dispositivo.`}
            </span>
            <span className="underline font-semibold">Crea una cuenta gratis para no perderlas</span>
          </button>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          title="No pierdas tus sitios guardados"
          subtitle="Crea una cuenta gratis y tus favoritos se sincronizan en todos tus dispositivos."
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </>
  )
}
