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

interface Props {
  area: Area
}

export function DetalleAreaHeader({ area }: Props) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const { toast, showToast, hideToast } = useToast()

  useEffect(() => {
    checkFavoriteStatus()
  }, [])

  const checkFavoriteStatus = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) return
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
    if (!user) {
      showToast('Debes iniciar sesión para añadir favoritos', 'info')
      setTimeout(() => router.push('/auth/login'), 1500)
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
        showToast('❌ Quitado de favoritos', 'info')
      } else {
        const { error } = await (supabase as any)
          .from('favoritos')
          .insert({ user_id: user.id, area_id: area.id })

        if (error) throw error
        setIsFavorite(true)
        showToast('❤️ Añadido a favoritos', 'success')
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error)
      showToast(error.message || 'Error al actualizar favorito', 'error')
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

  const getTipoAreaLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      publica: 'Pública',
      privada: 'Privada',
      camping: 'Camping',
      parking: 'Parking',
    }
    return labels[tipo] || tipo
  }

  const getTipoAreaColor = (tipo: string) => {
    const colors: Record<string, string> = {
      publica: 'bg-sky-500/90 text-white backdrop-blur-md border border-sky-400/30',
      privada: 'bg-orange-500/90 text-white backdrop-blur-md border border-orange-400/30',
      camping: 'bg-emerald-500/90 text-white backdrop-blur-md border border-emerald-400/30',
      parking: 'bg-slate-700/90 text-white backdrop-blur-md border border-slate-500/30',
    }
    return colors[tipo] || 'bg-slate-700/90 text-white backdrop-blur-md border border-slate-500/30'
  }

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
        <div className="relative h-[400px] md:h-[500px] md:rounded-b-3xl overflow-hidden bg-slate-200 shadow-sm">
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
        </div>

        {/* Botones flotantes (Navegación) */}
        <div className="absolute top-6 left-0 right-0 px-4 md:px-8 flex justify-between items-center safe-top max-w-[1600px] mx-auto z-10">
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
              className="w-11 h-11 bg-white/90 backdrop-blur-md flex items-center justify-center rounded-full shadow-sm hover:bg-white transition-all border border-white/20"
              aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              {isFavorite ? (
                <HeartIconSolid className="w-6 h-6 text-red-500" />
              ) : (
                <HeartIcon className="w-6 h-6 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Información superpuesta (Glassmorphism) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-[1200px] mx-auto z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Badge tipo de área */}
                <span className={`${getTipoAreaColor(area.tipo_area)} px-4 py-1.5 rounded-full text-xs font-bold tracking-wider shadow-sm`}>
                  {getTipoAreaLabel(area.tipo_area)}
                </span>
                
                {area.verificado && (
                  <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                    <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verificado
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight drop-shadow-md">
                {area.nombre}
              </h1>
              
              <div className="flex items-center gap-2 text-slate-200 text-sm md:text-base font-medium drop-shadow-sm">
                <MapPinIcon className="w-5 h-5 text-slate-300" />
                <span>{area.direccion || `${area.ciudad}, ${area.provincia}`}</span>
              </div>
            </div>

            {/* Panel lateral derecho en hero (Rating y Precio) */}
            <div className="flex items-center bg-black/40 backdrop-blur-lg border border-white/20 p-5 rounded-3xl shadow-xl">
              {area.google_rating && (
                <div className="flex flex-col items-center justify-center px-5 border-r border-white/20">
                  <div className="flex items-center gap-1 text-white font-bold text-2xl">
                    <span className="text-amber-400 text-xl">★</span>
                    {area.google_rating.toFixed(1)}
                  </div>
                  <span className="text-xs text-slate-300 font-medium tracking-wider uppercase mt-1">Rating</span>
                </div>
              )}
              
              <div className="flex flex-col items-center justify-center px-5">
                <div className="text-white font-bold text-2xl">
                  {area.precio_noche === 0 ? 'Gratis' : `${area.precio_noche}€`}
                </div>
                <span className="text-xs text-slate-300 font-medium tracking-wider uppercase mt-1">
                  /{area.precio_24h ? '24h' : 'noche'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
