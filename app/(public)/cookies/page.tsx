'use client'

import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BackToTop } from '@/components/area/BackToTop'
import { useLanguage } from '@/lib/i18n'
import { openCookieSettings } from '@/components/CookieConsentBar'

export default function CookiesPage() {
  const { t, locale } = useLanguage()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-gradient-to-br from-[#0b3c74] to-[#0d4a8f] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">{t('footer_cookies')}</h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              Última actualización: Agosto 2026
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            {locale !== 'es' && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl mb-8 not-prose">
                <p className="text-amber-900 text-sm m-0">{t('legal_es_only')}</p>
              </div>
            )}

            <div className="bg-blue-50 border-l-4 border-[#0b3c74] p-6 rounded-r-xl mb-12">
              <p className="text-gray-700 leading-relaxed m-0">
                En Mapa Furgocasa usamos cookies propias y de terceros para que el sitio funcione,
                recordar tus preferencias, medir el uso y, si lo aceptas, situarte en el mapa y
                personalizar el chat del Tío Viajero.
              </p>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">1. ¿Qué son las cookies?</h2>
            <p className="text-gray-600 leading-relaxed">
              Las cookies son pequeños archivos de texto que los sitios web colocan en tu dispositivo
              cuando los visitas. Se utilizan para hacer que el sitio funcione de manera más eficiente
              y para proporcionar información a los propietarios del sitio.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">2. ¿Qué tipos de cookies utilizamos?</h2>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">2.1 Cookies estrictamente necesarias</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Son esenciales para navegar por el sitio y usar sus funciones básicas. No se pueden desactivar.
            </p>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Cookie</th>
                    <th>Duración</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>mapafc_cookie_consent</td>
                    <td>1 año</td>
                    <td>Guarda si has dado consentimiento</td>
                  </tr>
                  <tr>
                    <td>mapafc_cookie_preferences</td>
                    <td>1 año</td>
                    <td>Guarda tus preferencias de cookies</td>
                  </tr>
                  <tr>
                    <td>fc_lang</td>
                    <td>1 año</td>
                    <td>Recuerda el idioma de la interfaz</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">2.2 Cookies analíticas</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nos permiten contar las visitas y fuentes de tráfico para medir y mejorar el rendimiento
              del sitio.
            </p>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Cookie</th>
                    <th>Proveedor</th>
                    <th>Duración</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>_ga</td>
                    <td>Google Analytics</td>
                    <td>2 años</td>
                    <td>Distingue usuarios</td>
                  </tr>
                  <tr>
                    <td>_ga_*</td>
                    <td>Google Analytics</td>
                    <td>2 años</td>
                    <td>Mantiene el estado de sesión</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">2.3 Cookies funcionales</h3>
            <p className="text-gray-600 leading-relaxed">
              Recuerdan tus preferencias, la última ubicación en el mapa y permiten que el Tío Viajero
              te sitúe cerca de ti. Si rechazas las cookies opcionales, no hay ubicación ni chat
              personalizado.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">2.4 Cookies de marketing</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Se usan para medir campañas y, si las hay, mostrarte anuncios relevantes.
            </p>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Cookie</th>
                    <th>Proveedor</th>
                    <th>Duración</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>_fbp</td>
                    <td>Meta (Facebook)</td>
                    <td>3 meses</td>
                    <td>Seguimiento de conversiones</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">3. Gestión de cookies</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Puedes cambiar tus preferencias en cualquier momento con el botón de abajo o desde
              «Configurar cookies» en el pie de página.
            </p>

            <p className="not-prose">
              <button
                type="button"
                onClick={openCookieSettings}
                className="bg-[#0b3c74] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#093261] transition-colors"
              >
                {t('footer_cookies_config')}
              </button>
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">4. Contacto</h2>
            <p className="text-gray-600 leading-relaxed">
              Si tienes preguntas sobre esta política de cookies, puedes contactarnos:
            </p>
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 mt-4">
              <p className="text-gray-900 font-semibold mb-2">Mapa Furgocasa / Furgocasa</p>
              <p className="text-gray-600">Email: info@mapafurgocasa.com</p>
              <p className="text-gray-600">Web: www.mapafurgocasa.com</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <BackToTop />
    </div>
  )
}
