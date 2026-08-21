'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BackToTop } from '@/components/area/BackToTop'
import Link from 'next/link'
import {
  DevicePhoneMobileIcon,
  RocketLaunchIcon,
  BoltIcon,
  WifiIcon,
  BellIcon,
  CloudIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'

export default function InstalarAppPage() {
  const [dispositivo, setDispositivo] = useState<'ios' | 'android'>('ios')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="mb-6 md:mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Volver al inicio
            </Link>
          </div>
          
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl mb-6 shadow-lg">
            <DevicePhoneMobileIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">
            Instala Furgocasa en 3 pasos
          </h1>
          <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
            Disfruta de la mejor experiencia móvil con acceso instantáneo desde tu pantalla de inicio
          </p>
        </div>

        {/* Selector de Dispositivo */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8 md:mb-12">
          <button
            onClick={() => setDispositivo('ios')}
            className={`flex items-center justify-center gap-3 px-5 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all ${
              dispositivo === 'ios'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg sm:scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
            }`}
          >
            <span className="text-2xl">🍎</span>
            iPhone / iPad
          </button>
          
          <button
            onClick={() => setDispositivo('android')}
            className={`flex items-center justify-center gap-3 px-5 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all ${
              dispositivo === 'android'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg sm:scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300'
            }`}
          >
            <span className="text-2xl">🤖</span>
            Android
          </button>
        </div>

        {/* Instrucciones iOS */}
        {dispositivo === 'ios' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-blue-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🍎</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Instalación en iPhone</h2>
                <p className="text-gray-600">Sigue estos sencillos pasos</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Paso 1 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Abre Safari
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Importante: Debes usar el navegador Safari de Apple (no Chrome ni otros navegadores)
                  </p>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Consejo:</strong> Safari es el navegador azul con una brújula que viene pre-instalado en tu iPhone
                    </p>
                  </div>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Toca el botón Compartir
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Es el cuadrado con una flecha hacia arriba, ubicado en la parte inferior de Safari
                  </p>
                  <div className="bg-gray-100 rounded-xl p-6 flex justify-center">
                    <ShareIcon className="w-16 h-16 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Selecciona "Añadir a pantalla de inicio"
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Desplázate hacia abajo en el menú que apareció y busca esta opción con un icono de ➕
                  </p>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-800">
                      📱 Si no lo ves, desplázate más abajo en el menú de compartir
                    </p>
                  </div>
                </div>
              </div>

              {/* Paso 4 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Confirma "Añadir"
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Verás una vista previa del icono de Furgocasa. Puedes cambiar el nombre si quieres.
                    Luego toca "Añadir" en la esquina superior derecha.
                  </p>
                </div>
              </div>

              {/* Éxito */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-bold text-green-900 mb-1">
                      ¡Listo! 🎉
                    </h4>
                    <p className="text-green-800">
                      El icono de Furgocasa aparecerá en tu pantalla de inicio. Tócalo para abrir la app a pantalla completa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instrucciones Android */}
        {dispositivo === 'android' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-green-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Instalación en Android</h2>
                <p className="text-gray-600">Dos métodos: automático (más fácil) o manual</p>
              </div>
            </div>

            {/* Método Automático */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <RocketLaunchIcon className="w-8 h-8 text-green-600" />
                <h3 className="text-2xl font-bold text-gray-900">
                  Método Automático (Recomendado)
                </h3>
              </div>

              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      Abre Chrome en tu Android
                    </h4>
                    <p className="text-gray-600">
                      El navegador Google Chrome (icono con círculo de colores)
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      Visita mapafurgocasa.com
                    </h4>
                    <p className="text-gray-600">
                      Escribe la dirección en la barra de navegación
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      Aparecerá un banner de instalación
                    </h4>
                    <p className="text-gray-600 mb-3">
                      En la parte inferior verás: "¿Instalar Mapa Furgocasa?"
                    </p>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-sm text-green-800 font-medium">
                        💡 Si no aparece inmediatamente, espera unos segundos o usa el método manual a continuación
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      4
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      Toca "Instalar"
                    </h4>
                    <p className="text-gray-600">
                      Confirma en el diálogo que aparece
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                    <div>
                      <h5 className="text-lg font-bold text-green-900 mb-1">
                        ¡Instalada! 🎉
                      </h5>
                      <p className="text-green-800">
                        La app aparecerá en tu cajón de aplicaciones y pantalla de inicio.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Método Manual */}
            <div className="border-t-2 border-gray-200 pt-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⚙️</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Método Manual
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                Si el banner automático no aparece, usa estos pasos:
              </p>

              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Toca los 3 puntos verticales ⋮
                    </h4>
                    <p className="text-gray-600">
                      Están en la esquina superior derecha de Chrome
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Busca "Instalar aplicación" o "Añadir a pantalla de inicio"
                    </h4>
                    <p className="text-gray-600">
                      Puede variar según tu versión de Android
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Toca y confirma
                    </h4>
                    <p className="text-gray-600">
                      Acepta en el diálogo de confirmación
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Beneficios */}
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-8 mb-12 border border-primary-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            ✨ Beneficios de tener la app instalada
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4 bg-white rounded-xl p-5 shadow-sm">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <BoltIcon className="w-7 h-7 text-yellow-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Inicio instantáneo</h3>
                <p className="text-sm text-gray-600">
                  Se abre directamente sin esperar a que cargue el navegador
                </p>
              </div>
            </div>

            <div className="flex gap-4 bg-white rounded-xl p-5 shadow-sm">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <DevicePhoneMobileIcon className="w-7 h-7 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Pantalla completa</h3>
                <p className="text-sm text-gray-600">
                  Más espacio para el mapa, sin barras del navegador
                </p>
              </div>
            </div>

            <div className="flex gap-4 bg-white rounded-xl p-5 shadow-sm">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <WifiIcon className="w-7 h-7 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Funciona offline</h3>
                <p className="text-sm text-gray-600">
                  Accede a tus favoritos y rutas incluso sin internet
                </p>
              </div>
            </div>

            <div className="flex gap-4 bg-white rounded-xl p-5 shadow-sm">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <BellIcon className="w-7 h-7 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Notificaciones</h3>
                <p className="text-sm text-gray-600">
                  Recibe alertas de nuevas áreas y actualizaciones
                </p>
              </div>
            </div>

            <div className="flex gap-4 bg-white rounded-xl p-5 shadow-sm">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <CloudIcon className="w-7 h-7 text-pink-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Apenas ocupa espacio</h3>
                <p className="text-sm text-gray-600">
                  Solo unos MB de caché, no es una app pesada
                </p>
              </div>
            </div>

            <div className="flex gap-4 bg-white rounded-xl p-5 shadow-sm">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <CheckCircleIcon className="w-7 h-7 text-indigo-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">100% segura</h3>
                <p className="text-sm text-gray-600">
                  Es la misma web oficial, instalada desde tu navegador
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            ❓ Preguntas Frecuentes
          </h2>

          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Es gratis instalarla?
              </h3>
              <p className="text-gray-600">
                ✅ Sí, completamente gratis. No hay costes ocultos ni suscripciones.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Ocupa mucho espacio en mi móvil?
              </h3>
              <p className="text-gray-600">
                ✅ No, apenas unos pocos MB de caché. Es mucho más ligera que una app tradicional.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Es segura? ¿Puedo confiar?
              </h3>
              <p className="text-gray-600">
                ✅ Totalmente segura. Es la misma web oficial de Furgocasa, solo que instalada como app. No descargamos nada adicional.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Puedo desinstalarla si no me gusta?
              </h3>
              <p className="text-gray-600">
                ✅ Sí, se desinstala igual que cualquier otra app. Mantén presionado el icono y selecciona "Eliminar" o "Desinstalar".
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Funciona sin conexión a internet?
              </h3>
              <p className="text-gray-600">
                ✅ Sí, podrás acceder a tus áreas favoritas, rutas guardadas y parte del contenido sin necesidad de estar conectado.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Se actualiza automáticamente?
              </h3>
              <p className="text-gray-600">
                ✅ Sí, cada vez que la abres se actualiza automáticamente con las últimas mejoras y nuevas áreas.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white shadow-xl">
            <h2 className="text-3xl font-bold mb-4">
              ¿Listo para la mejor experiencia móvil?
            </h2>
            <p className="text-lg mb-6 text-primary-100">
              Únete a miles de autocaravanistas que ya disfrutan de Furgocasa como app
            </p>
            <Link
              href="/mapa"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all shadow-lg hover:scale-105"
            >
              <RocketLaunchIcon className="w-6 h-6" />
              Ir al Mapa
            </Link>
          </div>
        </div>
      </div>

      <Footer />
      <BackToTop />
    </div>
  )
}

