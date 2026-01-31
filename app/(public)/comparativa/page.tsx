import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BackToTop } from '@/components/area/BackToTop'
import Link from 'next/link'
import { Metadata } from 'next'
import { SparklesIcon } from '@heroicons/react/24/outline'

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
                <span className="font-semibold">Mucho más que Park4Night</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="text-yellow-400">La alternativa completa</span> a Park4Night
              </h1>

              <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed max-w-3xl mx-auto">
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

        {/* 10 Unique Features */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              🏆 10 Razones para Elegir Mapa Furgocasa
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: '🤖', title: 'Valoración con IA', desc: 'GPT-4 analiza el mercado y te dice cuánto vale tu autocaravana. Nadie más lo tiene.' },
                { icon: '🚨', title: 'Alertas de Accidentes', desc: 'QR único en tu vehículo. Los testigos escanean y te avisan al instante. Innovación mundial.' },
                { icon: '🔧', title: 'Gestión Completa', desc: 'Mantenimientos, averías, mejoras, kilometraje. Todo tu historial en un solo lugar.' },
                { icon: '💰', title: 'Control Financiero', desc: 'Gastos, inversión total, coste por km, rentabilidad. Sabes exactamente cuánto te cuesta.' },
                { icon: '📥', title: 'Exportar a GPS', desc: 'Descarga tus rutas en GPX para Garmin, TomTom y otros GPS. Compatible con todo.' },
                { icon: '🔄', title: 'Drag-and-Drop', desc: 'Reordena paradas arrastrando. Interfaz moderna e intuitiva como debe ser.' },
                { icon: '📊', title: 'Dashboard Completo', desc: 'Visitas, rutas, favoritos, vehículo, reportes. Todo en un perfil centralizado.' },
                { icon: '🗺️', title: 'Clusters Inteligentes', desc: 'El mapa agrupa áreas automáticamente. Navegación fluida sin saturar.' },
                { icon: '🎨', title: 'Marcadores con Colores', desc: 'Identifica el tipo de área al instante: azul (pública), naranja (privada), verde (camping).' },
                { icon: '💚', title: '100% Gratis Siempre', desc: 'Sin suscripciones, sin premium, sin trucos. TODO gratis para TODOS. Así debe ser.' },
              ].map((feature: any, index: any) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-[#0ea5e9] rounded-xl p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-[#0b3c74] mb-3">{feature.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What Park4Night doesn't have */}
        <section className="py-16 bg-gray-100">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              💎 Lo que Park4Night NO tiene
            </h2>

            <div className="space-y-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl">
                <h3 className="text-2xl font-bold text-red-900 mb-3">❌ Park4Night es SOLO un mapa</h3>
                <p className="text-red-800 text-lg leading-relaxed">
                  Te dice dónde ir, pero no te ayuda a gestionar tu vehículo, valorarlo, protegerlo o controlar tus gastos.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-xl">
                <h3 className="text-2xl font-bold text-green-900 mb-3">✅ Mapa Furgocasa es una PLATAFORMA COMPLETA</h3>
                <ul className="text-green-800 text-lg space-y-2 ml-5 list-disc">
                  <li><strong>Mapa de áreas</strong> (como ellos, pero mejor)</li>
                  <li><strong>+ Gestión del vehículo</strong> (mantenimientos, averías, mejoras)</li>
                  <li><strong>+ Valoración con IA</strong> (¿cuánto vale tu autocaravana?)</li>
                  <li><strong>+ Alertas de accidentes</strong> (QR único de seguridad)</li>
                  <li><strong>+ Control financiero</strong> (gastos, coste/km, rentabilidad)</li>
                  <li><strong>+ Exportar a GPS</strong> (rutas en formato GPX)</li>
                  <li><strong>+ Todo 100% gratis</strong> (ellos cobran premium)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              ❓ Preguntas Frecuentes
            </h2>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  ¿Es Mapa Furgocasa mejor que Park4Night?
                </h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Depende de lo que busques. Si solo necesitas un <strong>mapa de áreas para autocaravanas</strong>, ambas apps funcionan bien. Pero si quieres <strong>gestionar tu vehículo completo</strong>, saber <strong>cuánto vale tu autocaravana</strong>, tener <strong>alertas de accidentes</strong>, <strong>exportar rutas a tu GPS</strong>, y <strong>controlar todos tus gastos</strong>, entonces Mapa Furgocasa es muy superior. Y además, es <strong>100% gratis</strong> (Park4Night cobra 4.99€/mes por premium).
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  ¿Qué NO tiene Park4Night que sí tiene Mapa Furgocasa?
                </h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Park4Night NO tiene: <strong>gestión de vehículos</strong>, <strong>registro de mantenimientos y averías</strong>, <strong>valoración automática con IA</strong>, <strong>alertas de accidentes por QR</strong>, <strong>control de gastos y coste por kilómetro</strong>, <strong>exportación de rutas a GPS</strong>, ni <strong>drag-and-drop para reordenar paradas</strong>. Mapa Furgocasa tiene TODAS estas funcionalidades y más.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  ¿Por qué cambiar de Park4Night a Mapa Furgocasa?
                </h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Porque tendrás <strong>TODO en una sola app</strong>: el mapa de áreas que ya conoces (con 4,900+ ubicaciones verificadas) PLUS gestión completa de tu autocaravana, valoración profesional con IA, sistema de seguridad con QR, análisis económico completo, y exportación de rutas. Todo <strong>gratis</strong>. Es como tener Park4Night + 6 apps más en una sola plataforma.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="relative bg-gradient-to-br from-[#0b3c74] via-[#0d4a8f] to-[#0b3c74] text-white overflow-hidden">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                ¿Listo para la mejor experiencia?
              </h2>
              <p className="text-xl md:text-2xl text-white/90 mb-10">
                Únete a los cientos de caravanistas que ya disfrutan de Mapa Furgocasa
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
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#0b3c74] rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
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
                Si buscas <strong>alternativas a Park4Night en español</strong>, has encontrado la mejor opción. Mapa Furgocasa nace en España para ofrecer mucho más que un simple mapa de áreas para autocaravanas, campers y furgonetas camperizadas. Somos la <strong>primera plataforma integral</strong> que combina: mapa interactivo con más de 4,900 áreas verificadas en Europa y Latinoamérica, planificador de rutas con exportación a GPS (Garmin, TomTom), gestión completa de tu vehículo (mantenimientos, averías, mejoras, kilometraje), valoración automática con inteligencia artificial (GPT-4 + búsqueda de mercado real), sistema único de alertas de accidentes mediante código QR, control financiero total (gastos, coste por kilómetro, rentabilidad), y chatbot inteligente 24/7. Todo esto <strong>completamente gratis</strong>, sin suscripciones premium ni funciones bloqueadas. Mientras Park4Night cobra 4.99€/mes por funciones avanzadas, nosotros ofrecemos TODO sin coste. Únete a cientos de caravanistas que ya disfrutan de la experiencia completa.
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
              }
            ]
          })
        }}
      />
    </div>
  )
}
