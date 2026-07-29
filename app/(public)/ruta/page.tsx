'use client'

import { Suspense, useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
  const supabase = createClientComponentClient()
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
    // Cambiar a vista mapa en móvil cuando se calcula una ruta
    if (window.innerWidth < 768) {
      setVistaActual('mapa')
    }
  }

  // Mostrar loading mientras comprobamos autenticación
  if (loading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
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
    <div className="h-screen flex flex-col overflow-hidden relative">
      {/* Navbar - siempre visible */}
      <Navbar />
      
      {/* Planificador - difuminado si no hay usuario */}
      <main className={`flex-1 overflow-hidden min-h-0 ${!user ? 'blur-sm pointer-events-none select-none' : ''}`}>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('ruta_loading_planner')}</p>
            </div>
          </div>
        }>
          <PlanificadorRuta 
            vistaMovil={vistaActual} 
            onRutaCalculada={handleRutaCalculada}
          />
        </Suspense>
      </main>

      {/* Modal de bloqueo si no hay usuario */}
      {!user && <LoginWall />}

      {/* Bottom Bar (solo móvil) - Ruta, Mapa, Lista */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-40">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Ruta */}
          <button
            onClick={() => setVistaActual('ruta')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              vistaActual === 'ruta' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <MapPinIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{t('ruta_tab_route')}</span>
          </button>

          {/* Mapa */}
          <button
            onClick={() => setVistaActual('mapa')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              vistaActual === 'mapa' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <MapIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{t('ruta_tab_map')}</span>
          </button>

          {/* Lista */}
          <button
            onClick={() => setVistaActual('lista')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              vistaActual === 'lista' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <ListBulletIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{t('ruta_tab_list')}</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
