import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BackToTop } from '@/components/area/BackToTop'
import { FAQAccordion } from '@/components/comparativa/FAQAccordion'
import Link from 'next/link'
import { Metadata } from 'next'
import { SparklesIcon, TruckIcon, MapIcon, ShieldCheckIcon, ChartBarIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'Mapa Furgocasa vs Park4Night | Alternativa GRATUITA con Valoración IA',
  description: '¿Buscas alternativa a Park4Night? Mapa Furgocasa tiene TODO: 4,900+ áreas + gestión vehículo + valoración IA + alertas accidentes + exportar GPX. 100% GRATIS. Park4Night solo es un mapa, nosotros somos una plataforma completa.',
  keywords: 'park4night, park4night alternativa, park4night gratis, mapa autocaravanas, areas autocaravanas españa, park 4 night español, alternativa park4night, mejor que park4night, app autocaravanas gratis',
  openGraph: {
    title: 'Mapa Furgocasa vs Park4Night - La Alternativa COMPLETA y GRATUITA',
    description: 'Park4Night solo es un mapa. Mapa Furgocasa es una plataforma COMPLETA: áreas + gestión vehículo + valoración IA + alertas accidentes. Todo 100% GRATIS.',
    url: 'https://www.mapafurgocasa.com/comparativa',
    siteName: 'Mapa Furgocasa',
    images: [
      {
        url: 'https://www.mapafurgocasa.com/og-comparativa.jpg',
        width: 1200,
        height: 630,
        alt: 'Mapa Furgocasa vs Park4Night - Comparativa completa',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mapa Furgocasa vs Park4Night - Alternativa Completa GRATIS',
    description: 'Park4Night solo es mapa. Nosotros: áreas + gestión vehículo + IA + alertas + GPS. 100% GRATIS.',
    images: ['https://www.mapafurgocasa.com/og-comparativa.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ComparativaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#0b3c74] via-[#0d4a8f] to-[#0b3c74] text-white overflow-hidden">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge superior */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-white/30">
                <SparklesIcon className="w-5 h-5" />
                <span className="font-semibold">Hecha por caravanistas, para caravanistas</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="text-yellow-400">La alternativa definitiva</span> a Park4Night
              </h1>

              <p className="text-xl md:text-2xl text-white/90 mb-6 leading-relaxed max-w-3xl mx-auto">
                Después de miles de kilómetros, incontables rutas y un contacto directo con viajeros como tú, creamos lo que ninguna app de áreas ofrecía de verdad.
              </p>
              
              <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
                No somos solo otro mapa. Somos la primera plataforma integral que gestiona TODO: tu vehículo, tus rutas, tus gastos y tu seguridad.
              </p>

              {/* CTAs principales */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#0b3c74] rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  ✨ Crear Cuenta Gratis
                </Link>
                <Link
                  href="/mapa"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
                >
                  🗺️ Ver Mapa de Áreas
                </Link>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl md:text-4xl font-bold mb-2">4,900+</div>
                  <div className="text-sm text-white/80">Áreas Verificadas</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl md:text-4xl font-bold mb-2">25+</div>
                  <div className="text-sm text-white/80">Países</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl md:text-4xl font-bold mb-2">9</div>
                  <div className="text-sm text-white/80">Features Únicas</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl md:text-4xl font-bold mb-2 text-yellow-400">0€</div>
                  <div className="text-sm text-white/80">100% Gratis</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Por qué nace Mapa Furgocasa - NUEVA SECCIÓN */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                🚐 Pensada por gente que vive el caravaning a diario
              </h2>
              <p className="text-xl text-gray-600">
                Aquí está la gran diferencia con Park4Night
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-8 md:p-10 border-2 border-[#0b3c74]/20">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                En <strong>Furgocasa</strong> llevamos años dedicados al alquiler de campers y autocaravanas. Después de <strong>miles de kilómetros recorridos</strong>, incontables rutas planificadas y un contacto muy directo con las necesidades reales de viajeros como tú, había algo que siempre nos rondaba por la cabeza:
              </p>
              
              <blockquote className="text-2xl font-bold text-[#0b3c74] border-l-4 border-[#0b3c74] pl-6 my-8">
                "Ninguna app de áreas y rutas cumplía de verdad con todo lo que un usuario de camper necesita"
              </blockquote>

              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Park4Night ha sido durante mucho tiempo una referencia, y nosotros mismos la hemos usado cientos de veces. Pero, con el tiempo, vimos que los viajeros buscaban más: <strong>planificar mejor, gestionar su vehículo, controlar gastos, tener seguridad adicional</strong> y, sobre todo, disponer de una herramienta fiable <strong>sin limitaciones ni suscripciones premium</strong>.
              </p>

              <p className="text-lg text-gray-700 leading-relaxed">
                Por eso creamos <strong>Mapa Furgocasa</strong>, una app pensada desde cero para cubrir lo que echábamos en falta. <strong>Hecha por caravanistas y para caravanistas</strong>. Sabemos exactamente qué hace falta en un viaje porque lo vivimos constantemente.
              </p>
            </div>
          </div>
        </section>

        {/* Mucho más que un mapa - NUEVA SECCIÓN */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                💎 Mucho más que un mapa: una herramienta integral
              </h2>
              <p className="text-xl text-gray-600">
                Park4Night es útil para encontrar áreas, sí, pero ahí termina todo
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#0b3c74]">
                <MapIcon className="w-10 h-10 text-[#0b3c74] mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">4,900+ áreas verificadas</h3>
                <p className="text-gray-600">En más de 25 países de Europa y Latinoamérica</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#0b3c74]">
                <div className="text-3xl mb-4">🛣️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Planificador profesional</h3>
                <p className="text-gray-600">Con exportación a GPS en formato GPX (Garmin, TomTom)</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#0b3c74]">
                <TruckIcon className="w-10 h-10 text-[#0b3c74] mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Gestión del vehículo</h3>
                <p className="text-gray-600">Mantenimientos, averías, revisiones, kilometraje</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#0b3c74]">
                <ChartBarIcon className="w-10 h-10 text-[#0b3c74] mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Control financiero</h3>
                <p className="text-gray-600">Gastos, coste por kilómetro, rentabilidad</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500">
                <SparklesIcon className="w-10 h-10 text-yellow-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Valoración con IA (GPT-4)</h3>
                <p className="text-gray-600">Sabe cuánto vale tu autocaravana en el mercado real</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
                <ShieldCheckIcon className="w-10 h-10 text-red-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Alertas QR de emergencia</h3>
                <p className="text-gray-600">Identificación rápida y asistencia en incidentes</p>
              </div>
            </div>

            <div className="text-center mt-10">
              <p className="text-xl text-gray-700 font-medium">
                Es decir: <strong>Mapa Furgocasa unifica lo que normalmente harías con tres o cuatro apps distintas.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Antes, Durante y Después - NUEVA SECCIÓN */}
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                🗓️ Antes, durante y después del viaje
              </h2>
              <p className="text-xl text-gray-600">
                Mientras Park4Night solo te permite "ver sitios", Mapa Furgocasa te acompaña en todo el proceso
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Antes */}
              <div className="bg-gradient-to-b from-blue-50 to-white rounded-2xl p-8 border-2 border-blue-200">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4">1</div>
                  <h3 className="text-2xl font-bold text-blue-900">ANTES</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    Planifica todas tus paradas
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    Reordénalas con drag-and-drop
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    Exporta al GPS con un clic
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    Guarda rutas favoritas
                  </li>
                </ul>
              </div>

              {/* Durante */}
              <div className="bg-gradient-to-b from-green-50 to-white rounded-2xl p-8 border-2 border-green-200">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full text-2xl font-bold mb-4">2</div>
                  <h3 className="text-2xl font-bold text-green-900">DURANTE</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    Encuentra áreas con filtros avanzados
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    Chatbot IA para recomendaciones
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    Sistema QR si ocurre algo
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    Registra visitas y notas
                  </li>
                </ul>
              </div>

              {/* Después */}
              <div className="bg-gradient-to-b from-purple-50 to-white rounded-2xl p-8 border-2 border-purple-200">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 text-white rounded-full text-2xl font-bold mb-4">3</div>
                  <h3 className="text-2xl font-bold text-purple-900">DESPUÉS</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">✓</span>
                    Revisa gastos y kilometraje
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">✓</span>
                    Registra mantenimientos
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">✓</span>
                    Valora tu vehículo con IA
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">✓</span>
                    Analiza coste por km y ROI
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center mt-10 bg-yellow-50 rounded-xl p-6 border border-yellow-200">
              <p className="text-lg text-yellow-900">
                <strong>Ideal para viajes largos, escapadas improvisadas</strong> o incluso para quienes alquilan por primera vez y agradecen una herramienta que les guía de principio a fin.
              </p>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              📊 Comparativa Detallada
            </h2>

            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#0b3c74] to-[#0d4a8f] text-white">
                      <th className="px-6 py-4 text-left font-semibold">Funcionalidad</th>
                      <th className="px-6 py-4 text-center font-semibold">🔵 Mapa Furgocasa</th>
                      <th className="px-6 py-4 text-center font-semibold">Park4Night</th>
                      <th className="px-6 py-4 text-center font-semibold">Otros</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">🗺️ Mapa de Áreas</td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">✓ 4,900+</td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">✓</td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">✓</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">🔍 Filtros Avanzados</td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">✓</td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">✓</td>
                      <td className="px-6 py-4 text-center text-yellow-600 font-bold">~</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">🛣️ Planificador de Rutas</td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">✓ Paradas ilimitadas</td>
                      <td className="px-6 py-4 text-center text-yellow-600 font-bold">~ Básico</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">📥 Exportar a GPS (GPX)</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="ml-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">NUEVO</span>
                      </td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">🔄 Drag-and-Drop Paradas</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="ml-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">NUEVO</span>
                      </td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                    </tr>

                    {/* Features ÚNICOS */}
                    <tr className="bg-yellow-50">
                      <td className="px-6 py-4 font-bold">
                        🚐 Registro de Vehículo
                        <span className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">ÚNICO</span>
                      </td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">✓ Completo</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                    </tr>
                    <tr className="bg-yellow-50">
                      <td className="px-6 py-4 font-bold">
                        🔧 Mantenimientos e Historial
                        <span className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">ÚNICO</span>
                      </td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">✓</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                    </tr>
                    <tr className="bg-yellow-50">
                      <td className="px-6 py-4 font-bold">
                        ⚠️ Averías y Reparaciones
                        <span className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">ÚNICO</span>
                      </td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">✓ Con costes</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                    </tr>
                    <tr className="bg-yellow-50">
                      <td className="px-6 py-4 font-bold">
                        💸 Control de Gastos
                        <span className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">ÚNICO</span>
                      </td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">✓ Completo</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                    </tr>

                    {/* Features ÚNICOS EN EL MUNDO */}
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-bold">
                        🤖 Valoración con IA (GPT-4)
                        <span className="ml-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">ÚNICO EN EL MUNDO</span>
                      </td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">✓ SerpAPI + GPT-4</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-bold">
                        📊 Análisis Económico
                        <span className="ml-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">ÚNICO EN EL MUNDO</span>
                      </td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">✓ Coste/km, ROI</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-bold">
                        🚨 Alertas de Accidentes QR
                        <span className="ml-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">ÚNICO EN EL MUNDO</span>
                      </td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">✓ Con notificaciones</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                    </tr>

                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">🤖 Chatbot IA 24/7</td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">✓ Con geolocalización</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">✗</td>
                    </tr>
                    <tr className="hover:bg-gray-50 bg-blue-50">
                      <td className="px-6 py-4 font-bold">💰 Precio</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-green-600 font-extrabold text-lg">100% GRATIS</span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">Freemium (4.99€/mes)</td>
                      <td className="px-6 py-4 text-center text-gray-700">Variable</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Control Financiero y Valor del Vehículo - NUEVA SECCIÓN */}
        <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                💰 Control financiero y valor del vehículo
              </h2>
              <p className="text-xl text-gray-600">
                Perfecto tanto para particulares como empresas de alquiler
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border-2 border-blue-200">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-900 px-4 py-2 rounded-full font-bold mb-6">
                  <SparklesIcon className="w-5 h-5" />
                  CARACTERÍSTICA TOTALMENTE DIFERENCIAL
                </div>
                
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Esta es una característica <strong>totalmente diferencial</strong> frente a Park4Night que ninguna otra app del sector ofrece.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Para Particulares */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-300">
                  <h3 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <span>👤</span>
                    Para Particulares
                  </h3>
                  <p className="text-gray-700 mb-4">Los usuarios pueden ver:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">✓</span>
                      <span className="text-gray-700"><strong>Gastos reales del viaje</strong> - Todo lo que gastas durante tus rutas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">✓</span>
                      <span className="text-gray-700"><strong>Coste por kilómetro</strong> - Saber exactamente cuánto te cuesta viajar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">✓</span>
                      <span className="text-gray-700"><strong>Estado económico del vehículo</strong> - Inversión vs gastos acumulados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">✓</span>
                      <span className="text-gray-700"><strong>Valor estimado actualizado</strong> gracias a un modelo de IA (GPT-4 + SerpAPI)</span>
                    </li>
                  </ul>
                  <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200">
                    <p className="text-gray-800 font-medium">
                      Para quienes tienen su propia autocaravana <span className="text-blue-600 font-bold">es oro</span>.
                    </p>
                  </div>
                </div>

                {/* Para Empresas */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border-2 border-emerald-300">
                  <h3 className="text-2xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <span>🏢</span>
                    Para Empresas de Alquiler
                  </h3>
                  <p className="text-gray-700 mb-4">Gestión profesional de flota:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold mt-1">✓</span>
                      <span className="text-gray-700"><strong>Control total de cada vehículo</strong> - Mantenimientos, averías, gastos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold mt-1">✓</span>
                      <span className="text-gray-700"><strong>ROI (retorno de inversión)</strong> - Rentabilidad real de tu flota</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold mt-1">✓</span>
                      <span className="text-gray-700"><strong>Análisis económico completo</strong> - Toma decisiones basadas en datos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold mt-1">✓</span>
                      <span className="text-gray-700"><strong>Valoración automática</strong> - Conoce el valor de mercado de cada vehículo</span>
                    </li>
                  </ul>
                  <div className="mt-6 bg-white rounded-lg p-4 border border-emerald-200">
                    <p className="text-gray-800 font-medium">
                      Para quienes gestionan una flota de alquiler como Furgocasa, <span className="text-emerald-600 font-bold">es directamente esencial</span>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-300">
                <p className="text-lg text-gray-800 font-bold text-center">
                  Park4Night NO ofrece NINGUNA de estas funcionalidades. Mapa Furgocasa es la ÚNICA plataforma del mercado con control financiero completo y valoración con IA.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seguridad Extra - NUEVA SECCIÓN */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                🛡️ Seguridad extra que Park4Night no ofrece
              </h2>
              <p className="text-xl text-gray-600">
                Sistema QR de emergencia: tu protección en carretera
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 md:p-10 shadow-xl border-2 border-red-200">
              <div className="flex items-center justify-center mb-8">
                <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="w-16 h-16 text-white" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">
                El sistema QR de emergencia permite:
              </h3>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-4xl mb-4 text-center">🆔</div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 text-center">Identificación rápida</h4>
                  <p className="text-gray-700 text-center">
                    Identifica el vehículo inmediatamente en caso de emergencia
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-4xl mb-4 text-center">🚑</div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 text-center">Asistencia facilitada</h4>
                  <p className="text-gray-700 text-center">
                    Facilita la asistencia médica o mecánica cuando más lo necesitas
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-4xl mb-4 text-center">📋</div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 text-center">Protocolo claro</h4>
                  <p className="text-gray-700 text-center">
                    Un protocolo básico si ocurre algo inesperado en tu viaje
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border-l-4 border-red-600">
                <p className="text-lg text-gray-800 font-medium mb-4">
                  <strong>Pequeños detalles que, en carretera, se agradecen mucho.</strong>
                </p>
                <p className="text-gray-700">
                  Cuando viajas en autocaravana, especialmente por rutas remotas o países extranjeros, contar con un sistema de identificación y alertas puede marcar la diferencia entre una situación controlada y un problema mayor. Park4Night no ofrece ninguna funcionalidad de seguridad o emergencias.
                </p>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/reportar"
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <ShieldCheckIcon className="w-6 h-6" />
                  Activar Sistema de Alertas
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ¿Sigue siendo útil Park4Night? - NUEVA SECCIÓN */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              🤔 ¿Sigue siendo útil Park4Night?
            </h2>

            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-lg">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                <strong>Claro que sí.</strong> Su comunidad es enorme y su base de áreas es potente. Para consultar rápido dónde parar sigue siendo una herramienta conocida y práctica.
              </p>
              
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Pero si lo que buscas es algo <strong>más evolucionado</strong>, completo y adaptado al caravaning actual, entonces la diferencia es clara.
              </p>

              <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-[#0b3c74] mb-6">
                <p className="text-lg text-gray-800 font-medium">
                  En Furgocasa llevamos años escuchando lo mismo: <strong>"Hay muchas apps, pero ninguna lo tiene todo"</strong>.
                </p>
                <p className="text-lg text-gray-700 mt-4">
                  Por eso desarrollamos Mapa Furgocasa. Porque creemos que quienes viajan en camper merecen una herramienta que:
                </p>
                <ul className="mt-4 space-y-2 text-gray-700">
                  <li>✔ Te ayude a <strong>planificar</strong></li>
                  <li>✔ Te acompañe <strong>durante el viaje</strong></li>
                  <li>✔ Te <strong>ahorre tiempo</strong></li>
                  <li>✔ Te dé <strong>seguridad</strong></li>
                  <li>✔ Y te permita <strong>gestionar y valorar tu vehículo</strong> con datos reales</li>
                </ul>
              </div>

              <p className="text-xl font-bold text-[#0b3c74] text-center">
                No es solo un mapa. Es una solución completa.
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
              ❓ Preguntas Frecuentes
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Resolvemos todas tus dudas sobre Mapa Furgocasa
            </p>

            <FAQAccordion 
              items={[
                {
                  question: '¿Es Mapa Furgocasa mejor que Park4Night?',
                  answer: 'Depende de lo que busques. Si solo necesitas un mapa de áreas para autocaravanas, ambas apps funcionan bien. Pero si quieres gestionar tu vehículo completo, saber cuánto vale tu autocaravana, tener alertas de accidentes, exportar rutas a tu GPS, y controlar todos tus gastos, entonces Mapa Furgocasa es muy superior. Y además, es 100% gratis (Park4Night cobra 4.99€/mes por premium).'
                },
                {
                  question: '¿Qué NO tiene Park4Night que sí tiene Mapa Furgocasa?',
                  answer: 'Park4Night NO tiene: gestión de vehículos, registro de mantenimientos y averías, valoración automática con IA, alertas de accidentes por QR, control de gastos y coste por kilómetro, exportación de rutas a GPS, ni drag-and-drop para reordenar paradas. Mapa Furgocasa tiene TODAS estas funcionalidades y más.'
                },
                {
                  question: '¿Por qué cambiar de Park4Night a Mapa Furgocasa?',
                  answer: 'Porque tendrás TODO en una sola app: el mapa de áreas que ya conoces (con 4,900+ ubicaciones verificadas) PLUS gestión completa de tu autocaravana, valoración profesional con IA, sistema de seguridad con QR, análisis económico completo, y exportación de rutas. Todo gratis. Es como tener Park4Night + 6 apps más en una sola plataforma.'
                },
                {
                  question: '¿Sirve para particulares y para empresas de alquiler?',
                  answer: 'Sí, para ambos. Los usuarios particulares pueden ver gastos reales del viaje, coste por kilómetro, estado económico del vehículo y valor estimado actualizado gracias a un modelo de IA. Para quienes gestionan una flota de alquiler, estas funciones son directamente esenciales para el control de su negocio.'
                },
                {
                  question: '¿Cómo funciona la valoración con IA de mi autocaravana?',
                  answer: 'Utilizamos GPT-4 combinado con SerpAPI para buscar en tiempo real vehículos similares al tuyo en el mercado actual. El sistema analiza marca, modelo, año, kilometraje, estado y características para darte una valoración precisa y actualizada de cuánto vale tu autocaravana en este momento. Es como tener un tasador profesional disponible 24/7.'
                },
                {
                  question: '¿Puedo exportar mis rutas al GPS de mi vehículo?',
                  answer: '¡Sí! Mapa Furgocasa te permite exportar tus rutas en formato GPX, compatible con dispositivos Garmin, TomTom y la mayoría de navegadores GPS. Planifica tu ruta con todas las paradas en nuestra app, exporta el archivo GPX y cárgalo directamente en tu navegador. Park4Night NO tiene esta funcionalidad.'
                },
                {
                  question: '¿Qué ventajas tiene Mapa Furgocasa siendo de España?',
                  answer: 'Al ser una empresa española (Furgocasa con base en Murcia), conocemos perfectamente las necesidades del mercado español y europeo. Nuestro soporte es en español, entendemos la idiosincrasia del caravaning en España, y constantemente añadimos áreas verificadas en la península y baleares. Además, al estar en el sector del alquiler de campers desde hace años, sabemos exactamente qué funcionalidades son realmente útiles.'
                },
                {
                  question: '¿Tiene Mapa Furgocasa app móvil?',
                  answer: 'Actualmente Mapa Furgocasa funciona como Progressive Web App (PWA), lo que significa que puedes acceder desde cualquier navegador móvil y añadirla a tu pantalla de inicio para usarla como una app nativa. Funciona perfectamente en iPhone y Android, con todas las funcionalidades disponibles sin necesidad de descargar nada desde las tiendas de apps.'
                }
              ]}
            />
          </div>
        </section>

        {/* CTA Final */}
        <section className="relative bg-gradient-to-br from-[#0b3c74] via-[#0d4a8f] to-[#0b3c74] text-white overflow-hidden">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                ¿Listo para la mejor experiencia?
              </h2>
              <p className="text-xl md:text-2xl text-white/90 mb-4">
                Únete a miles de caravanistas que ya disfrutan de Mapa Furgocasa
              </p>
              <p className="text-lg text-white/70 mb-10">
                Si te gusta viajar en autocaravana, pruébala. Estamos convencidos de que te será tremendamente útil.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl md:text-4xl font-bold mb-2">4,900+</div>
                  <div className="text-sm text-white/80">Áreas Verificadas</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl md:text-4xl font-bold mb-2">25+</div>
                  <div className="text-sm text-white/80">Países</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl md:text-4xl font-bold mb-2">9</div>
                  <div className="text-sm text-white/80">Features Únicas</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl md:text-4xl font-bold mb-2 text-yellow-400">0€</div>
                  <div className="text-sm text-white/80">100% Gratis</div>
                </div>
              </div>

              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-10 py-5 bg-white text-[#0b3c74] rounded-xl font-bold text-xl hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                ✨ Crear Cuenta Gratis
              </Link>

              <p className="mt-6 text-sm text-white/70">
                Sin tarjeta, sin suscripciones, sin trucos
              </p>
            </div>
          </div>
        </section>

        {/* SEO Footer Content */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Mapa Furgocasa - La alternativa española a Park4Night
              </h3>
              <p className="text-gray-700 leading-relaxed text-base">
                Si buscas <strong>alternativas a Park4Night en español</strong>, has encontrado la mejor opción. Mapa Furgocasa nace de la experiencia real de <strong>Furgocasa</strong>, empresa especializada en el sector del caravaning desde hace años. Con miles de kilómetros recorridos y el feedback constante de viajeros reales, hemos creado una plataforma que va mucho más allá de un simple mapa de áreas. Somos la <strong>primera plataforma integral</strong> que combina: mapa interactivo con más de 4,900 áreas verificadas en Europa y Latinoamérica, planificador de rutas con exportación a GPS (Garmin, TomTom), gestión completa de tu vehículo (mantenimientos, averías, mejoras, kilometraje), valoración automática con inteligencia artificial (GPT-4 + búsqueda de mercado real), sistema único de alertas de accidentes mediante código QR, control financiero total (gastos, coste por kilómetro, rentabilidad), y chatbot inteligente 24/7. Todo esto <strong>completamente gratis</strong>, sin suscripciones premium ni funciones bloqueadas. Mientras Park4Night cobra 4.99€/mes por funciones avanzadas, nosotros ofrecemos TODO sin coste. Únete a miles de caravanistas que ya disfrutan de la experiencia completa.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "¿Qué diferencia hay entre Mapa Furgocasa y Park4Night?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Park4Night es solo un mapa de áreas. Mapa Furgocasa es una plataforma completa que incluye: mapa de 4,900+ áreas, gestión completa del vehículo, valoración automática con IA (GPT-4), sistema de alertas de accidentes con QR, control financiero total, exportación de rutas a GPS, y mucho más. Todo 100% gratis."
                }
              },
              {
                "@type": "Question",
                "name": "¿Es gratis Mapa Furgocasa?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Sí, 100% gratis siempre. A diferencia de Park4Night que cobra 4.99€/mes por funciones premium, en Mapa Furgocasa TODO es gratuito para TODOS los usuarios."
                }
              },
              {
                "@type": "Question",
                "name": "¿Por qué cambiar de Park4Night a Mapa Furgocasa?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Porque tendrás TODO en una sola app: el mapa de áreas que ya conoces (con 4,900+ ubicaciones verificadas) más gestión completa de tu autocaravana, valoración profesional con IA, sistema de seguridad con QR, análisis económico completo, y exportación de rutas. Todo gratis."
                }
              }
            ]
          })
        }}
      />
    </div>
  )
}
