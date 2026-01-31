import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { InstallAppCTA } from "@/components/ui/InstallAppCTA";
import { BackToTop } from "@/components/area/BackToTop";
import Link from "next/link";
import {
  SparklesIcon,
  TruckIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "Valoración IA de Autocaravanas y Campers | Furgocasa",
  description:
    "Sistema inteligente de valoración de vehículos recreativos con IA. Obtén el valor de mercado de tu autocaravana, furgoneta camper o motorhome en minutos con informes profesionales basados en datos reales.",
  keywords:
    "valoración autocaravanas, precio camper, tasación furgoneta camper, valor motorhome, inteligencia artificial, valoración IA, precio justo autocaravana",
  openGraph: {
    title: "Valoración IA de Autocaravanas y Campers | Furgocasa",
    description:
      "Descubre el valor real de tu autocaravana o camper con nuestro sistema de valoración por Inteligencia Artificial. Informes profesionales en minutos.",
    type: "website",
    url: "https://www.mapafurgocasa.com/valoracion-ia-vehiculos",
    images: [
      {
        url: "https://www.mapafurgocasa.com/og-valoracion-ia.jpg",
        width: 1200,
        height: 630,
        alt: "Valoración IA de Autocaravanas Furgocasa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Valoración IA de Autocaravanas y Campers | Furgocasa",
    description:
      "Sistema inteligente de valoración de vehículos recreativos con IA. Informes profesionales en minutos.",
    images: ["https://www.mapafurgocasa.com/og-valoracion-ia.jpg"],
  },
};

export default function ValoracionIAPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <SparklesIcon className="w-5 h-5" />
              <span className="text-sm font-semibold">Tecnología de Inteligencia Artificial</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Valoración Inteligente de tu Autocaravana
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Conoce el valor real de tu vehículo en minutos con nuestro sistema de IA basado en datos de mercado actualizados
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
              >
                <TruckIcon className="w-6 h-6" />
                Registrar mi Vehículo
              </Link>
              <Link
                href="/perfil"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-all"
              >
                Ver Mis Vehículos
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Características Principales */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Cómo funciona la Valoración IA?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nuestro sistema analiza múltiples factores para determinar el valor de mercado más preciso
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-100 hover:shadow-lg transition-shadow">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <TruckIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                1. Registra tu Vehículo
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Añade los datos de tu autocaravana o camper: marca, modelo, año, kilometraje, equipamiento y estado general. Cuanta más información, más precisa será la valoración.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-100 hover:shadow-lg transition-shadow">
              <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <CpuChipIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                2. IA Analiza el Mercado
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Nuestra inteligencia artificial compara tu vehículo con cientos de datos reales del mercado: ventas similares, precios actuales, tendencias y depreciación.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-100 hover:shadow-lg transition-shadow">
              <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                3. Informe Profesional
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Recibe un informe detallado con el valor de mercado, análisis de depreciación, comparables y recomendaciones para compra o venta.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Qué incluye el informe */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                ¿Qué incluye el Informe de Valoración?
              </h2>
              <p className="text-xl text-gray-600">
                Un análisis completo y profesional de tu vehículo
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <CheckCircleIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Valor de Mercado Estimado</h3>
                  <p className="text-gray-600">
                    Precio actual de mercado con rango mínimo y máximo basado en datos reales.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <CheckCircleIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Análisis de Depreciación</h3>
                  <p className="text-gray-600">
                    Evolución del valor desde la compra hasta hoy con proyección futura.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <CheckCircleIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Vehículos Comparables</h3>
                  <p className="text-gray-600">
                    Listado de vehículos similares vendidos o en venta con sus precios.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <CheckCircleIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Factores de Ajuste</h3>
                  <p className="text-gray-600">
                    Impacto del kilometraje, antigüedad, equipamiento y estado en el precio.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <CheckCircleIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Recomendaciones</h3>
                  <p className="text-gray-600">
                    Consejos para vender al mejor precio o negociar una compra.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <CheckCircleIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Descarga en PDF</h3>
                  <p className="text-gray-600">
                    Informe completo descargable para compartir o presentar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ventajas */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué usar nuestra Valoración IA?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ClockIcon className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Rápido y Fácil</h3>
              <p className="text-gray-600">
                Obtén tu valoración en menos de 5 minutos. Solo necesitas los datos básicos de tu vehículo.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChartBarIcon className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Basado en Datos Reales</h3>
              <p className="text-gray-600">
                Nuestra IA analiza cientos de transacciones reales del mercado europeo de autocaravanas.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheckIcon className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Confiable y Preciso</h3>
              <p className="text-gray-600">
                Valoraciones profesionales que puedes usar para negociaciones, seguros o financiación.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gestión de Vehículos */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Gestión Completa de tu Flota
                </h2>
                <p className="text-lg text-indigo-100 mb-6">
                  Además de valoraciones IA, gestiona todos tus vehículos en un solo lugar:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-300 flex-shrink-0" />
                    <span>Historial de mantenimientos y reparaciones</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-300 flex-shrink-0" />
                    <span>Registro de compras y ventas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-300 flex-shrink-0" />
                    <span>Control de gastos y financiación</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-300 flex-shrink-0" />
                    <span>Documentación organizada</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-300 flex-shrink-0" />
                    <span>Valoraciones ilimitadas</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 border-white/30">
                  <div className="flex items-center gap-3 mb-4">
                    <TruckIcon className="w-8 h-8" />
                    <div>
                      <div className="font-bold">Mis Vehículos</div>
                      <div className="text-sm text-indigo-200">Panel de control</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div className="text-sm">Weinsberg Carabus 600</div>
                        <div className="text-sm font-bold">72.500€</div>
                      </div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div className="text-sm">Adria Twin Plus 600</div>
                        <div className="text-sm font-bold">65.000€</div>
                      </div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div className="text-sm">Knaus Boxstar 600</div>
                        <div className="text-sm font-bold">78.900€</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              ¿Listo para conocer el valor de tu vehículo?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Regístrate gratis y obtén tu primera valoración con Inteligencia Artificial
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-lg font-bold text-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              <SparklesIcon className="w-6 h-6" />
              Empezar Ahora Gratis
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Sin tarjeta de crédito • Valoraciones ilimitadas • Cancela cuando quieras
            </p>
          </div>
        </div>
      </section>

      {/* CTA Instalar App */}
      <InstallAppCTA />

      <Footer />
      <BackToTop />
    </div>
  );
}

