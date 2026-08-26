'use client'

import { Suspense, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'
import PlanificadorRuta from '@/components/ruta/PlanificadorRuta'
import LoginWall from '@/components/ui/LoginWall'
import { MapPinIcon, MapIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/lib/i18n'

type VistaRuta = 'ruta' | 'mapa' | 'lista'

export default function RutaPage() {
  const [vistaActual, setVistaActual] = useState<VistaRuta>('ruta')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    
    getUser()

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleRutaCalculada = () => {
    setVistaActual('mapa')
  }

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden relative">
      <Navbar />

      <main className={`flex-1 overflow-hidden min-h-0 ${!user ? 'blur-sm pointer-events-none select-none' : ''}`}>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('ruta_loading_planner')}</p>
            </div>
          </div>
        }>
          <div className="h-full w-full min-h-0">
            <PlanificadorRuta
              vistaMovil={vistaActual}
              onRutaCalculada={handleRutaCalculada}
              onAbrirPlanificador={() => setVistaActual('ruta')}
            />
          </div>
        </Suspense>
      </main>

      {!user && <LoginWall />}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-40 overflow-visible pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14 px-3">
          <button
            onClick={() => setVistaActual('mapa')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 active:scale-95 ${
              vistaActual === 'mapa' ? 'text-accent-600' : 'text-gray-500'
            }`}
          >
            <span className={`px-4 py-1 rounded-full transition-colors duration-200 ${
              vistaActual === 'mapa' ? 'bg-accent-50' : 'bg-transparent'
            }`}>
              <MapIcon className="w-6 h-6" />
            </span>
            <span className={`text-[11px] ${vistaActual === 'mapa' ? 'font-semibold' : 'font-medium'}`}>{t('nav_mapa')}</span>
          </button>

          <button
            onClick={() => setVistaActual('ruta')}
            className={`relative flex flex-col items-center justify-end flex-1 h-full pb-1 transition-all duration-200 active:scale-95 ${
              vistaActual === 'ruta' ? 'text-accent-600' : 'text-gray-500'
            }`}
          >
            <span className={`absolute -top-5 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors duration-200 ${
              vistaActual === 'ruta' ? 'bg-accent-600 text-white' : 'bg-accent-500 text-white'
            }`}>
              <MapPinIcon className="w-7 h-7" />
            </span>
            <span className={`text-[11px] ${vistaActual === 'ruta' ? 'font-semibold' : 'font-medium'}`}>{t('ruta_tab_route')}</span>
          </button>

          <button
            onClick={() => setVistaActual('lista')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 active:scale-95 relative ${
              vistaActual === 'lista' ? 'text-accent-600' : 'text-gray-500'
            }`}
          >
            <span className={`px-4 py-1 rounded-full transition-colors duration-200 relative ${
              vistaActual === 'lista' ? 'bg-accent-50' : 'bg-transparent'
            }`}>
              <ListBulletIcon className="w-6 h-6" />
            </span>
            <span className={`text-[11px] ${vistaActual === 'lista' ? 'font-semibold' : 'font-medium'}`}>{t('places')}</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
