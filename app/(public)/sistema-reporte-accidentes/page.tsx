import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { InstallAppCTA } from "@/components/ui/InstallAppCTA";
import { BackToTop } from "@/components/area/BackToTop";
import Link from "next/link";
import {
  ExclamationTriangleIcon,
  MapPinIcon,
  ClockIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  GlobeAltIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "Sistema QR de Reporte de Daños | Furgocasa",
  description:
    "Protege tu autocaravana con nuestro sistema QR. Genera tu código QR único, recibe notificaciones instantáneas si alguien daña tu vehículo y facilita la resolución de incidentes con datos del testigo.",
  keywords:
    "QR autocaravana, reportar daño autocaravana, testigo accidente, protección vehículo QR, sistema alertas daños, notificación accidente autocaravana, seguro autocaravana",
  openGraph: {
    title: "Sistema QR de Reporte de Daños | Furgocasa",
    description:
      "Genera tu código QR único para tu autocaravana. Los testigos pueden reportar daños escaneando el código y recibirás una notificación instantánea.",
    type: "website",
    url: "https://www.mapafurgocasa.com/sistema-reporte-accidentes",
    images: [
      {
        url: "https://www.mapafurgocasa.com/og-reporte-accidentes.jpg",
        width: 1200,
        height: 630,
        alt: "Sistema QR de Reporte de Daños Furgocasa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistema QR de Reporte de Daños | Furgocasa",
    description:
      "Protege tu autocaravana con nuestro sistema QR. Recibe notificaciones si alguien reporta un daño.",
    images: ["https://www.mapafurgocasa.com/og-reporte-accidentes.jpg"],
  },
};

export default function ReporteAccidentesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <ShieldCheckIcon className="w-5 h-5" />
              <span className="text-sm font-semibold">Sistema QR Inteligente</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Protege tu Autocaravana con Código QR
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Genera tu código QR único. Si alguien presencia un daño o robo a tu vehículo, puede reportarlo escaneando el código y recibirás una notificación instantánea con todos los detalles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/perfil"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
              >
                <ShieldCheckIcon className="w-6 h-6" />
                Generar mi Código QR
              </Link>
              <Link
                href="/accidente"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-all"
              >
                ¿Eres Testigo? Reporta Aquí
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tipos de Daños que se pueden reportar */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Qué daños se pueden reportar?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Los testigos pueden reportar cualquier daño o robo a tu autocaravana registrada
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Tipo 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100 hover:shadow-lg transition-shadow">
              <div className="bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Rayones y Abolladura
              </h3>
              <p className="text-gray-700 text-sm">
                Daños por roces, golpes en parking, marcas en la carrocería, abolladuras en puertas o laterales.
              </p>
            </div>

            {/* Tipo 2 */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-100 hover:shadow-lg transition-shadow">
              <div className="bg-red-600 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <ShieldCheckIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Choques e Impactos
              </h3>
              <p className="text-gray-700 text-sm">
                Colisiones mientras está estacionada, golpes por otros vehículos, impactos traseros o laterales.
              </p>
            </div>

            {/* Tipo 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-100 hover:shadow-lg transition-shadow">
              <div className="bg-purple-600 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <BellAlertIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Roturas y Daños Graves
              </h3>
              <p className="text-gray-700 text-sm">
                Cristales rotos, espejos dañados, luces rotas, daños estructurales significativos.
              </p>
            </div>

            {/* Tipo 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-100 hover:shadow-lg transition-shadow">
              <div className="bg-orange-600 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <ShieldCheckIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Robos e Intentos
              </h3>
              <p className="text-gray-700 text-sm">
                Robos, intentos de robo, cerraduras forzadas, vandalismo o actividad sospechosa alrededor del vehículo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Cómo funciona el sistema QR?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tres pasos simples para proteger tu autocaravana
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Paso 1 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:shadow-lg transition-shadow">
                <div className="absolute -top-4 left-6 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mt-2">
                  <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Registra tu Autocaravana
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Regístrate gratis en Furgocasa y añade tu autocaravana con matrícula y datos del vehículo. El sistema genera automáticamente un código QR único.
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:shadow-lg transition-shadow">
                <div className="absolute -top-4 left-6 bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mt-2">
                  <DocumentTextIcon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Coloca el QR Visible
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Descarga tu código QR, imprímelo y pégalo en un lugar visible de tu autocaravana (parabrisas, ventanilla lateral, puerta).
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:shadow-lg transition-shadow">
                <div className="absolute -top-4 left-6 bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mt-2">
                  <BellAlertIcon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Recibe Notificaciones
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Si un testigo escanea tu QR y reporta un daño, recibirás una notificación instantánea con ubicación, fotos y datos del causante.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Características del Sistema */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                ¿Qué información recibe el propietario?
              </h2>
              <p className="text-xl text-gray-600">
                Todos los datos necesarios para resolver el incidente
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-100">
                <MapPinIcon className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Ubicación Exacta del Daño</h3>
                  <p className="text-gray-600">
                    GPS preciso de dónde ocurrió el incidente, con dirección legible y enlace a Google Maps.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-100">
                <ClockIcon className="w-8 h-8 text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Fecha y Hora Exacta</h3>
                  <p className="text-gray-600">
                    Registro preciso del momento del incidente para cruzar con tus registros o cámaras.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-100">
                <PhotoIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Fotos del Daño</h3>
                  <p className="text-gray-600">
                    El testigo puede adjuntar fotos del daño y del vehículo causante para documentar el incidente.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl border-2 border-yellow-100">
                <UserGroupIcon className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Datos del Testigo</h3>
                  <p className="text-gray-600">
                    Nombre, email y teléfono del testigo para que puedas contactarlo y obtener más información.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border-2 border-red-100">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Datos del Causante</h3>
                  <p className="text-gray-600">
                    Si el testigo vio el vehículo causante, recibirás matrícula, marca, color y descripción.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border-2 border-indigo-100">
                <ShieldCheckIcon className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Privacidad y Seguridad</h3>
                  <p className="text-gray-600">
                    Tus datos personales están protegidos. Solo se comparte tu matrícula con los testigos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios del Sistema QR */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                  <ShieldCheckIcon className="w-5 h-5" />
                  <span className="text-sm font-semibold">Protección Inteligente</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  No Viajes Solo, Viaja Protegido
                </h2>
                <p className="text-lg text-blue-100 mb-6">
                  Con el código QR de Furgocasa, nunca más te quedarás sin saber qué pasó con tu autocaravana. Recibe toda la información que necesitas para actuar.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-300 flex-shrink-0" />
                    <span>Datos del causante del daño (matrícula, fotos)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-300 flex-shrink-0" />
                    <span>Contacto directo con testigos del incidente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-300 flex-shrink-0" />
                    <span>Ubicación GPS exacta del lugar del daño</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-300 flex-shrink-0" />
                    <span>Documentación completa para tu seguro</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-300 flex-shrink-0" />
                    <span>Notificaciones instantáneas 24/7</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 border-white/30">
                  <div className="flex items-center gap-3 mb-4">
                    <ShieldCheckIcon className="w-8 h-8" />
                    <div>
                      <div className="font-bold">Ejemplo de Reporte</div>
                      <div className="text-sm text-blue-200">Recibido por QR</div>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                      <div className="flex items-center gap-2 mb-1">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        <div className="font-bold">Tipo: Abolladura lateral</div>
                      </div>
                      <div className="text-xs text-blue-100">Parking Centro Comercial</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                      <div className="flex items-center gap-2 mb-1">
                        <UserGroupIcon className="w-4 h-4" />
                        <div className="font-bold">Testigo: María G.</div>
                      </div>
                      <div className="text-xs text-blue-100">Tel: +34 666 123 456</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                      <div className="flex items-center gap-2 mb-1">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        <div className="font-bold">Causante: 1234-ABC</div>
                      </div>
                      <div className="text-xs text-blue-100">Furgón blanco + foto</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Panel de Control */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Gestiona tus Reportes desde tu Perfil
              </h2>
              <p className="text-xl text-gray-600">
                Visualiza todos los reportes de daños a tus autocaravanas registradas
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DocumentTextIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Historial de Reportes</h3>
                  <p className="text-sm text-gray-600">
                    Ve todos los reportes de daños recibidos con fecha, ubicación y fotos del incidente.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserGroupIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Contacto con Testigos</h3>
                  <p className="text-sm text-gray-600">
                    Accede a los datos de contacto de los testigos para obtener más información.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BellAlertIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Notificaciones Instantáneas</h3>
                  <p className="text-sm text-gray-600">
                    Recibe alertas inmediatas cuando alguien reporta un daño a tu vehículo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Protege tu Autocaravana Hoy Mismo
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Regístrate gratis, genera tu código QR y viaja con la tranquilidad de estar protegido
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-lg font-bold text-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                <ShieldCheckIcon className="w-6 h-6" />
                Registrarme Gratis
              </Link>
              <Link
                href="/accidente"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-blue-600 text-blue-600 px-10 py-5 rounded-lg font-bold text-xl hover:bg-blue-50 transition-all"
              >
                <ExclamationTriangleIcon className="w-6 h-6" />
                Reportar un Daño
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              ✅ 100% Gratis • 🔒 Datos Protegidos • 📱 Notificaciones Instantáneas • 🚐 Miles de usuarios
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

