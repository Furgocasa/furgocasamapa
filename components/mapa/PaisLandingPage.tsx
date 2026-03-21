'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PaisSEO } from '@/config/paises-seo'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { 
  MapPinIcon,
  MapIcon,
  ArrowPathIcon,
  SparklesIcon,
  GlobeAltIcon,
  TruckIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface PaisLandingPageProps {
  pais: PaisSEO
}

export function PaisLandingPage({ pais }: PaisLandingPageProps) {
  const [totalAreas, setTotalAreas] = useState(3600) // fallback hasta cargar conteo real

  useEffect(() => {
    cargarTotalAreas()
  }, [])

  const cargarTotalAreas = async () => {
    try {
      const supabase = createClient()
      
      // Cargar total de TODAS las áreas de la app (igual que home)
      const { count, error } = await (supabase as any)
        .from('areas')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true)

      if (!error && typeof count === 'number') {
        setTotalAreas(count)
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO - Azul corporativo específico del país */}
      <section className="relative bg-gradient-to-br from-[#0b3c74] via-[#0d4a8f] to-[#0b3c74] text-white overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge superior con emoji del país */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-white/30">
              <span className="text-2xl">{pais.emoji}</span>
              <span className="font-semibold">{pais.nombre} - {pais.terminologia === 'autocaravanas' ? 'Autocaravanas' : 'Casas Rodantes'}</span>
            </div>

            {/* Tres iconos principales */}
            <div className="flex justify-center items-center gap-6 md:gap-12 mb-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 mb-2">
                  <MapIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <span className="text-sm md:text-base font-semibold text-white/90">Mapa</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 mb-2">
                  <ArrowPathIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <span className="text-sm md:text-base font-semibold text-white/90">Rutas</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 mb-2">
                  <SparklesIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <span className="text-sm md:text-base font-semibold text-white/90">IA</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              {pais.titulo}
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed max-w-3xl mx-auto">
              {pais.descripcion}
            </p>

            {/* CTAs principales */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#0b3c74] rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                Empezar Gratis
              </Link>
              <Link
                href={`/mapa?pais=${encodeURIComponent(pais.nombre)}`}
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white rounded-xl font-bold text-lg border-2 border-white hover:bg-white/10 transition-all"
              >
                Ver Mapa de Áreas
              </Link>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl py-6 border border-white/20">
                <div className="text-4xl md:text-5xl font-bold text-white mb-1">+{totalAreas}</div>
                <div className="text-sm text-white/80">Áreas Verificadas</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl py-6 border border-white/20">
                <div className="text-4xl md:text-5xl font-bold text-white mb-1">100%</div>
                <div className="text-sm text-white/80">Gratis Siempre</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl py-6 border border-white/20">
                <div className="text-4xl md:text-5xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-white/80">Actualizado</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES PRINCIPALES - Adaptado al país */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Todo para tu viaje en {pais.terminologia === 'autocaravanas' ? 'autocaravana' : 'casa rodante'} por {pais.nombre}
            </h2>
            <p className="text-xl text-gray-600">
              Planifica, descubre y disfruta con toda la información que necesitas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 - Áreas */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:border-[#0b3c74]/30 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-[#0b3c74] rounded-xl flex items-center justify-center mb-6">
                <MapPinIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                +{totalAreas} Áreas Actualizadas
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Base de datos completa con áreas públicas, privadas, campings y parkings en {pais.nombre} y más países. Información verificada de servicios, precios y ubicaciones exactas.
              </p>
            </div>

            {/* Feature 2 - Planificador */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:border-[#0b3c74]/30 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-[#0b3c74] rounded-xl flex items-center justify-center mb-6">
                <ArrowPathIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Planificador de Rutas
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Crea rutas personalizadas por {pais.nombre} y descubre automáticamente áreas de pernocta cercanas. Optimiza distancias y tiempos de viaje.
              </p>
            </div>

            {/* Feature 3 - Gestión */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:border-[#0b3c74]/30 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-[#0b3c74] rounded-xl flex items-center justify-center mb-6">
                <TruckIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Gestión Inteligente
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Valoración IA de tu vehículo, control de gastos y mantenimientos. Todo en una sola plataforma durante tu viaje.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONSEJOS ESPECÍFICOS DEL PAÍS */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Consejos para viajar en {pais.terminologia === 'autocaravanas' ? 'autocaravana' : 'casa rodante'} por {pais.nombre}
              </h2>
              <p className="text-xl text-gray-600">
                Información práctica y regulaciones locales
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              {/* Consejos */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <SparklesIcon className="w-7 h-7 text-[#0b3c74]" />
                  Tips Esenciales
                </h3>
                <ul className="space-y-4">
                  {pais.consejos.map((consejo, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#0b3c74] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm mt-1">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 leading-relaxed">{consejo}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Regulaciones */}
              {pais.regulaciones && (
                <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <ShieldCheckIcon className="w-7 h-7 text-[#0b3c74]" />
                    Regulaciones Locales
                  </h3>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <p className="text-gray-800 leading-relaxed font-medium">
                      {pais.regulaciones}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 bg-gradient-to-br from-[#0b3c74] to-[#0d4a8f] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para tu aventura en {pais.nombre}?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Regístrate gratis y accede a funciones premium: guarda favoritos, crea rutas y valora áreas en {pais.nombre}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#0b3c74] rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl"
            >
              Crear Cuenta Gratis
            </Link>
            <Link
              href={`/mapa?pais=${encodeURIComponent(pais.nombre)}`}
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white rounded-xl font-bold text-lg border-2 border-white hover:bg-white/10 transition-all"
            >
              Ver Mapa de {pais.nombre}
            </Link>
          </div>
        </div>
      </section>

      {/* Keywords ocultos para SEO */}
      <div className="hidden">
        {pais.keywords.map(keyword => (
          <span key={keyword}>{keyword}</span>
        ))}
      </div>

      <Footer />
    </div>
  )
}

