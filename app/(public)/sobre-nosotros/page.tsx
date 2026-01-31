'use client'

import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { InstallAppCTA } from '@/components/ui/InstallAppCTA'
import { BackToTop } from '@/components/area/BackToTop'
import Link from 'next/link'
import {
  SparklesIcon,
  UserGroupIcon,
  MapIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0b3c74] to-[#0d4a8f] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Sobre Mapa Furgocasa
            </h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              La plataforma más completa para autocaravanistas, potenciada por Inteligencia Artificial
            </p>
          </div>
        </div>
      </section>

      {/* Nuestra Historia */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Nuestra Historia
              </h2>
              <div className="w-24 h-1 bg-[#0b3c74] mx-auto"></div>
            </div>

            <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed space-y-6">
              <p className="text-xl">
                <strong className="text-[#0b3c74]">Mapa Furgocasa</strong> nació de la pasión por el mundo del caravaning y la necesidad de una herramienta completa que facilitara la vida a los autocaravanistas.
              </p>

              <p>
                Somos parte de <strong>Furgocasa</strong>, empresa especializada en el sector del caravaning desde hace años. Con nuestra experiencia en el sector y el feedback constante de miles de usuarios, hemos creado una plataforma que va mucho más allá de un simple mapa de áreas.
              </p>

              <p>
                En 2024 dimos un paso revolucionario: <strong>integramos Inteligencia Artificial GPT-4</strong> para ofrecer valoraciones automáticas de vehículos, asesoramiento personalizado y un sistema de protección mediante códigos QR. Somos pioneros en aplicar IA al mundo del caravaning.
              </p>

              <p>
                Hoy, miles de autocaravanistas confían en nosotros para planificar sus rutas, gestionar sus vehículos y conectar con una comunidad activa y apasionada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Qué Ofrecemos */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Qué Ofrecemos
              </h2>
              <p className="text-xl text-gray-600">
                Una plataforma completa con tecnología de vanguardia
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-[#0b3c74] rounded-xl flex items-center justify-center mb-6">
                  <MapIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Mapa de Áreas
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Más de 4.900 áreas verificadas en España, Portugal, Francia, Andorra, Argentina y más países. Información actualizada constantemente.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-[#0b3c74] rounded-xl flex items-center justify-center mb-6">
                  <SparklesIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Inteligencia Artificial
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Valoraciones automáticas con GPT-4, comparación de precios de mercado y chatbot experto disponible 24/7.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-[#0b3c74] rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheckIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Sistema QR
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Protección 24/7 con códigos QR. Los testigos pueden reportar daños o accidentes con fotos, GPS y datos en tiempo real.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-[#0b3c74] rounded-xl flex items-center justify-center mb-6">
                  <ChartBarIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Gestión de Vehículos
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Control completo de mantenimientos, gastos, histórico de valor y galería de fotos de tu autocaravana.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-[#0b3c74] rounded-xl flex items-center justify-center mb-6">
                  <UserGroupIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Comunidad Activa
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Miles de autocaravanistas compartiendo experiencias, consejos y recomendaciones. La comunidad más grande de España.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-[#0b3c74] rounded-xl flex items-center justify-center mb-6">
                  <GlobeAltIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  100% Gratis
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Todas las funciones disponibles sin coste. Sin anuncios intrusivos. Sin límites de uso. Gratis para siempre.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestros Valores */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Nuestros Valores
              </h2>
              <div className="w-24 h-1 bg-[#0b3c74] mx-auto"></div>
            </div>

            <div className="space-y-8">
              <div className="bg-gray-50 rounded-2xl p-8 border-l-4 border-[#0b3c74]">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  🎯 Transparencia
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Información clara, veraz y actualizada. Sin costes ocultos ni sorpresas. Lo que ves es lo que obtienes.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-8 border-l-4 border-[#0b3c74]">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  🚀 Innovación
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Pioneros en aplicar IA al caravaning. Siempre buscamos nuevas formas de mejorar la experiencia de nuestros usuarios.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-8 border-l-4 border-[#0b3c74]">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  🤝 Comunidad
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Escuchamos a nuestros usuarios. Cada funcionalidad nueva nace de vuestro feedback y necesidades reales.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-8 border-l-4 border-[#0b3c74]">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  🌍 Accesibilidad
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Gratis para siempre. Queremos que todos los autocaravanistas tengan acceso a las mejores herramientas sin barreras económicas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-[#0b3c74] to-[#0d4a8f] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Únete a nuestra comunidad
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Miles de autocaravanistas ya confían en nosotros. ¿A qué esperas?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#0b3c74] rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl"
              >
                Crear Cuenta Gratis
              </Link>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white rounded-xl font-bold text-lg border-2 border-white hover:bg-white/10 transition-all"
              >
                Contáctanos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Instalar App */}
      <InstallAppCTA />

      <Footer />
      <BackToTop />
    </div>
  )
}
