'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { InstallAppCTA } from '@/components/ui/InstallAppCTA'
import { BackToTop } from '@/components/area/BackToTop'
import {
  MapIcon,
  MapPinIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  TruckIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon,
  SparklesIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

export default function HomePage() {
  const [totalAreas, setTotalAreas] = useState(1000)

  useEffect(() => {
    // Cargar contador dinámico de áreas
    const loadTotalAreas = async () => {
      try {
        const supabase = createClient()
        const { count, error } = await (supabase as any)
          .from('areas')
          .select('*', { count: 'exact', head: true })
          .eq('activo', true)

        if (!error && count) {
          setTotalAreas(count)
        }
      } catch (err) {
        console.error('Error loading total areas:', err)
      }
    }

    loadTotalAreas()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO - Azul corporativo con stats */}
      <section className="relative bg-gradient-to-br from-[#0b3c74] via-[#0d4a8f] to-[#0b3c74] text-white overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge superior */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-white/30">
              <SparklesIcon className="w-5 h-5" />
              <span className="font-semibold">Ahora con Inteligencia Artificial GPT-4</span>
            </div>

            {/* Tres iconos principales */}
            <div className="flex justify-center items-center gap-6 md:gap-12 mb-8">
              {/* Icono Mapa */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 mb-2">
                  <MapIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <span className="text-sm md:text-base font-semibold text-white/90">Mapa</span>
              </div>

              {/* Icono Rutas */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 mb-2">
                  <ArrowPathIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <span className="text-sm md:text-base font-semibold text-white/90">Rutas</span>
              </div>

              {/* Icono IA */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 mb-2">
                  <SparklesIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <span className="text-sm md:text-base font-semibold text-white/90">IA</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Mucho más que una <span className="text-yellow-400">app</span> de áreas de autocaravanas
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed max-w-3xl mx-auto">
              Tu plataforma completa para gestionar tu autocaravana con IA. Valoraciones automáticas, rutas inteligentes y protección 24/7.
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
                href="/mapa"
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

      {/* FEATURES PRINCIPALES - Blanco con tarjetas */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas en una sola plataforma
            </h2>
            <p className="text-xl text-gray-600">
              Gestión completa de tu autocaravana con tecnología de última generación
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
                Base de datos completa con áreas públicas, privadas, campings y parkings. Información verificada de servicios, precios y ubicaciones exactas.
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
                Crea rutas personalizadas y descubre automáticamente áreas de pernocta cercanas. Optimiza distancias y tiempos de viaje.
              </p>
            </div>

            {/* Feature 3 - Cobertura */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:border-[#0b3c74]/30 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-[#0b3c74] rounded-xl flex items-center justify-center mb-6">
                <GlobeAltIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Cobertura Mundial
              </h3>
              <p className="text-gray-600 leading-relaxed">
                España, Portugal, Francia, Andorra, Argentina y más países. Expandimos constantemente nuestra red global de áreas.
              </p>
            </div>
          </div>

          {/* CTA después de features */}
          <div className="text-center mt-12">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#0b3c74] text-white rounded-xl font-bold text-lg hover:bg-[#0d4a8f] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Únete Gratis y Descubre Todo
            </Link>
            <p className="text-gray-500 mt-3 text-sm">Sin tarjeta de crédito · Acceso inmediato</p>
          </div>
        </div>
      </section>

      {/* GESTIÓN IA - Destacado con fondo gris claro */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Badge superior */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-[#0b3c74] text-white px-6 py-3 rounded-full font-bold shadow-lg">
                <SparklesIcon className="w-5 h-5" />
                POWERED BY GPT-4
              </div>
            </div>

            <div className="bg-white rounded-3xl p-10 md:p-12 shadow-xl border-2 border-[#0b3c74]/20">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-20 h-20 bg-[#0b3c74] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <TruckIcon className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Gestión Inteligente de tu Autocaravana
                  </h2>
                  <p className="text-xl text-gray-600 leading-relaxed">
                    Valoración automática con GPT-4 en segundos. Control total con comparación de precios de mercado en tiempo real.
                  </p>
                </div>
              </div>

              {/* Grid de características */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="text-3xl mb-3">🤖</div>
                  <p className="font-bold text-gray-900 mb-1">Valoración IA</p>
                  <p className="text-sm text-gray-600">GPT-4 en segundos</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="text-3xl mb-3">📊</div>
                  <p className="font-bold text-gray-900 mb-1">Precios Mercado</p>
                  <p className="text-sm text-gray-600">Comparación real</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="text-3xl mb-3">🔧</div>
                  <p className="font-bold text-gray-900 mb-1">Mantenimientos</p>
                  <p className="text-sm text-gray-600">Historial completo</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="text-3xl mb-3">💰</div>
                  <p className="font-bold text-gray-900 mb-1">Control Gastos</p>
                  <p className="text-sm text-gray-600">ROI automático</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="text-3xl mb-3">📈</div>
                  <p className="font-bold text-gray-900 mb-1">Histórico Valor</p>
                  <p className="text-sm text-gray-600">Evolución precio</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="text-3xl mb-3">📸</div>
                  <p className="font-bold text-gray-900 mb-1">Gestión Fotos</p>
                  <p className="text-sm text-gray-600">Galería completa</p>
                </div>
              </div>

              {/* CTA para más información */}
              <div className="text-center">
                <Link
                  href="/valoracion-ia-vehiculos"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#0b3c74] text-white rounded-xl font-bold text-lg hover:bg-[#0d4a8f] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Conoce más sobre Valoración IA
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SISTEMA QR - Destacado similar a Gestión IA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Badge superior */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg">
                <ShieldCheckIcon className="w-5 h-5" />
                SISTEMA ANTI DAÑOS
              </div>
            </div>

            <div className="bg-white rounded-3xl p-10 md:p-12 shadow-xl border-2 border-red-600/20">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheckIcon className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Sistema QR Inteligente: Protección 24/7
                  </h2>
                  <p className="text-xl text-gray-600 leading-relaxed">
                    Código QR único para tu vehículo. Los testigos pueden reportar incidentes o daños escaneándolo. Recibe notificaciones instantáneas con fotos, GPS y datos.
                  </p>
                </div>
              </div>

              {/* Grid de características */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">🚨</div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">Alertas de accidentes</p>
                      <p className="text-sm text-gray-600">Con fotos y ubicación GPS</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">🔔</div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">Notificación de daños</p>
                      <p className="text-sm text-gray-600">Si ven daños en tu vehículo</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">📞</div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">Contacto emergencia</p>
                      <p className="text-sm text-gray-600">Para autoridades y aseguradoras</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">📋</div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">Historial completo</p>
                      <p className="text-sm text-gray-600">Todos los reportes guardados</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA para más información */}
              <div className="text-center">
                <Link
                  href="/sistema-reporte-accidentes"
                  className="inline-flex items-center justify-center px-8 py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <ShieldCheckIcon className="w-5 h-5 mr-2" />
                  Descubre el Sistema de Alertas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECNOLOGÍA IA - 3 características principales */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#0b3c74] text-white px-6 py-3 rounded-full font-bold mb-6">
              <SparklesIcon className="w-5 h-5" />
              INTELIGENCIA ARTIFICIAL
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tecnología que entiende tu autocaravana
            </h2>
            <p className="text-xl text-gray-600">
              GPT-4 analiza, valora y te asesora en tiempo real
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* IA Feature 1 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
              <div className="text-5xl mb-6 text-center">🧠</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Valoración Inteligente
              </h3>
              <p className="text-gray-600 leading-relaxed text-center">
                GPT-4 analiza marca, modelo, año, kilometraje y mercado para darte una valoración precisa en segundos con informe PDF profesional.
              </p>
            </div>

            {/* IA Feature 2 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
              <div className="text-5xl mb-6 text-center">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Comparación de Mercado
              </h3>
              <p className="text-gray-600 leading-relaxed text-center">
                Comparamos con miles de anuncios reales de portales especializados para determinar el precio justo de tu vehículo.
              </p>
            </div>

            {/* IA Feature 3 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
              <div className="text-5xl mb-6 text-center">💬</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Chatbot Experto
              </h3>
              <p className="text-gray-600 leading-relaxed text-center">
                Asistente IA disponible 24/7 para responder preguntas sobre áreas, rutas y recomendaciones personalizadas.
              </p>
            </div>
          </div>

          {/* CTA después de IA */}
          <div className="text-center mt-12">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#0b3c74] text-white rounded-xl font-bold text-lg hover:bg-[#0d4a8f] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              Prueba la IA Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA - 3 pasos */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Empieza en 3 simples pasos
            </h2>
            <p className="text-xl text-gray-600">
              Desde el registro hasta tu primera valoración IA en menos de 5 minutos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Paso 1 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#0b3c74] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                  1
                </div>
                <div className="text-5xl mb-6 text-center">📝</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  Regístrate Gratis
                </h3>
                <p className="text-gray-600 leading-relaxed text-center">
                  Crea tu cuenta en 30 segundos. Sin tarjeta de crédito. Acceso inmediato a todas las funciones.
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#0b3c74] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                  2
                </div>
                <div className="text-5xl mb-6 text-center">🚐</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  Registra tu Vehículo
                </h3>
                <p className="text-gray-600 leading-relaxed text-center">
                  Añade marca, modelo, año y kilometraje. Sube fotos y obtén tu código QR de protección.
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#0b3c74] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                  3
                </div>
                <div className="text-5xl mb-6 text-center">🤖</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  Valoración IA Instantánea
                </h3>
                <p className="text-gray-600 leading-relaxed text-center">
                  Clic en "Valorar con IA" y recibe un informe profesional en 30 segundos con precio real de mercado.
                </p>
              </div>
            </div>
          </div>

          {/* CTA tras los pasos */}
          <div className="text-center mt-12">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-10 py-5 bg-[#0b3c74] text-white rounded-xl font-bold text-xl hover:bg-[#0d4a8f] transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              Crear Cuenta Gratuita →
            </Link>
          </div>
        </div>
      </section>

      {/* POR QUÉ CONFIAR - Azul corporativo con credenciales técnicas */}
      <section className="py-20 bg-gradient-to-br from-[#0b3c74] to-[#0d4a8f] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                ¿Por qué deberías confiar en nosotros?
              </h2>
              <p className="text-xl text-white/80">
                Tecnología de primera línea para darte la información más precisa y confiable
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Razón 1 - Google Maps */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Integración Google Maps API</h3>
                    <p className="text-white/80">
                      Datos verificados directamente de Google Maps. Ubicaciones precisas con GPS, fotos reales, horarios actualizados y valoraciones de usuarios. La información más confiable del mundo en tus manos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Razón 2 - OpenAI GPT-4 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Valoración con OpenAI GPT-4</h3>
                    <p className="text-white/80">
                      Inteligencia artificial de última generación analiza miles de datos del mercado real. Comparación con portales especializados, análisis de deprecación y precios justos basados en datos reales, no estimaciones.
                    </p>
                  </div>
                </div>
              </div>

              {/* Razón 3 - Historial Completo */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ChartBarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Historial y Trazabilidad Total</h3>
                    <p className="text-white/80">
                      Registra cada mantenimiento, gasto y valoración con fecha exacta. Base de datos segura que guarda toda la vida de tu vehículo. Acceso a tu información desde cualquier dispositivo, sincronización automática en la nube.
                    </p>
                  </div>
                </div>
              </div>

              {/* Razón 4 - Seguridad */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShieldCheckIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Seguridad y Privacidad</h3>
                    <p className="text-white/80">
                      Encriptación de extremo a extremo para todos tus datos. Servidores seguros en Europa. Nunca compartimos tu información con terceros. Cumplimiento total con RGPD. Tus datos son solo tuyos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Razón 5 - Datos Verificados */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Actualizaciones en Tiempo Real</h3>
                    <p className="text-white/80">
                      Sistema de sincronización automática con fuentes oficiales. Los precios de mercado se actualizan diariamente. Nuevas áreas verificadas cada semana. Información siempre fresca y precisa.
                    </p>
                  </div>
                </div>
              </div>

              {/* Razón 6 - Sin Publicidad */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">100% Independiente</h3>
                    <p className="text-white/80">
                      Sin conflictos de interés. No vendemos tus datos. Sin publicidad que influya en resultados. Información objetiva y neutral. Nuestro único compromiso es contigo y con la calidad de nuestro servicio.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Badge Tecnología */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-10 border border-white/20 text-center">
              <div className="flex justify-center gap-8 mb-6 flex-wrap">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">Google Maps</div>
                  <div className="text-sm text-white/70">API Oficial</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">OpenAI GPT-4</div>
                  <div className="text-sm text-white/70">IA Avanzada</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">AWS Cloud</div>
                  <div className="text-sm text-white/70">Infraestructura Segura</div>
                </div>
              </div>
              <p className="text-lg text-white/90 mb-8">
                Tecnología empresarial de primer nivel al servicio de los autocaravanistas
              </p>

              {/* CTA final de confianza */}
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-10 py-5 bg-yellow-400 text-[#0b3c74] rounded-xl font-bold text-xl hover:bg-yellow-300 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                Crear Mi Cuenta Gratis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Instalar App Móvil */}
      <InstallAppCTA />

      <Footer />
      
      {/* Botón volver arriba */}
      <BackToTop />
    </div>
  )
}
