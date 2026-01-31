'use client'

import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BackToTop } from '@/components/area/BackToTop'

export default function CondicionesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0b3c74] to-[#0d4a8f] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Condiciones del Servicio
            </h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              Última actualización: Enero 2025
            </p>
          </div>
        </div>
      </section>

      {/* Contenido */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">

            <div className="bg-blue-50 border-l-4 border-[#0b3c74] p-6 rounded-r-xl mb-12">
              <p className="text-gray-700 leading-relaxed m-0">
                Al acceder y utilizar Mapa Furgocasa, aceptas estar sujeto a estos términos y condiciones. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestro servicio.
              </p>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">1. Aceptación de los Términos</h2>
            <p className="text-gray-600 leading-relaxed">
              Al registrarte y utilizar Mapa Furgocasa, confirmas que has leído, entendido y aceptado estos términos y condiciones, así como nuestra Política de Privacidad.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">2. Descripción del Servicio</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Mapa Furgocasa es una plataforma digital que ofrece:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Mapa interactivo con áreas de estacionamiento para autocaravanas</li>
              <li>Planificador de rutas</li>
              <li>Sistema de gestión de vehículos</li>
              <li>Valoraciones automáticas con Inteligencia Artificial (GPT-4)</li>
              <li>Sistema QR de protección para vehículos</li>
              <li>Comunidad de autocaravanistas</li>
            </ul>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">3. Registro y Cuenta de Usuario</h2>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">3.1. Requisitos</h3>
            <p className="text-gray-600 leading-relaxed">
              Para acceder a ciertas funcionalidades, debes registrarte y crear una cuenta. Debes proporcionar información precisa y actualizada durante el registro.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-6">3.2. Seguridad de la Cuenta</h3>
            <p className="text-gray-600 leading-relaxed">
              Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta. Debes notificarnos inmediatamente cualquier uso no autorizado.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">4. Uso del Servicio</h2>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">4.1. Uso Permitido</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Te comprometes a utilizar el servicio únicamente para fines legales y de acuerdo con estas condiciones. Está prohibido:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Utilizar el servicio de manera que pueda dañar, deshabilitar o sobrecargar nuestros servidores</li>
              <li>Acceder sin autorización a sistemas o datos no destinados a ti</li>
              <li>Publicar contenido ofensivo, ilegal o que viole derechos de terceros</li>
              <li>Utilizar robots, scrapers o cualquier medio automatizado sin autorización</li>
              <li>Suplantar la identidad de otra persona o entidad</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-6">4.2. Contenido del Usuario</h3>
            <p className="text-gray-600 leading-relaxed">
              Al publicar contenido (comentarios, valoraciones, fotos, etc.), nos otorgas una licencia no exclusiva, mundial y libre de regalías para usar, reproducir y distribuir dicho contenido en relación con el servicio.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">5. Valoraciones con Inteligencia Artificial</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nuestro servicio de valoración de vehículos mediante IA es una estimación basada en:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Datos proporcionados por el usuario</li>
              <li>Información de mercado disponible públicamente</li>
              <li>Algoritmos de Inteligencia Artificial (GPT-4)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              <strong>Importante:</strong> Las valoraciones son estimaciones orientativas y no constituyen una oferta de compra o venta. El valor real puede variar según múltiples factores.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">6. Sistema QR de Protección</h2>
            <p className="text-gray-600 leading-relaxed">
              El sistema QR permite a terceros reportar incidentes relacionados con tu vehículo. No nos hacemos responsables de la veracidad de los reportes realizados por terceros ni de los daños derivados de su uso.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">7. Información de Áreas</h2>
            <p className="text-gray-600 leading-relaxed">
              La información sobre áreas de estacionamiento se proporciona "tal cual". Aunque nos esforzamos por mantener la información actualizada y precisa, no garantizamos su exactitud completa. Los usuarios deben verificar la información localmente antes de utilizarla.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">8. Limitación de Responsabilidad</h2>
            <p className="text-gray-600 leading-relaxed">
              En la medida permitida por la ley, Mapa Furgocasa no será responsable de:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Daños directos, indirectos, incidentales o consecuentes</li>
              <li>Pérdida de datos, beneficios o uso del servicio</li>
              <li>Errores u omisiones en el contenido</li>
              <li>Acciones de terceros basadas en información del servicio</li>
            </ul>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">9. Modificaciones del Servicio</h2>
            <p className="text-gray-600 leading-relaxed">
              Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del servicio en cualquier momento, con o sin previo aviso.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">10. Propiedad Intelectual</h2>
            <p className="text-gray-600 leading-relaxed">
              Todo el contenido, diseño, logotipos, código y demás elementos del servicio son propiedad de Mapa Furgocasa o de sus licenciantes y están protegidos por leyes de propiedad intelectual.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">11. Enlaces a Terceros</h2>
            <p className="text-gray-600 leading-relaxed">
              Nuestro servicio puede contener enlaces a sitios web de terceros. No somos responsables del contenido o prácticas de privacidad de estos sitios.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">12. Terminación</h2>
            <p className="text-gray-600 leading-relaxed">
              Podemos suspender o terminar tu acceso al servicio en cualquier momento si incumples estos términos, sin previo aviso ni responsabilidad.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">13. Ley Aplicable</h2>
            <p className="text-gray-600 leading-relaxed">
              Estos términos se rigen por las leyes españolas. Cualquier disputa se resolverá en los tribunales de España.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">14. Modificaciones de los Términos</h2>
            <p className="text-gray-600 leading-relaxed">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor al ser publicados en esta página. El uso continuado del servicio después de los cambios constituye tu aceptación de los nuevos términos.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">15. Contacto</h2>
            <p className="text-gray-600 leading-relaxed">
              Si tienes preguntas sobre estos términos, puedes contactarnos en:
            </p>
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 mt-4">
              <p className="text-gray-900 font-semibold mb-2">Mapa Furgocasa</p>
              <p className="text-gray-600">Email: info@mapafurgocasa.com</p>
              <p className="text-gray-600">Web: www.mapafurgocasa.com</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-[#0b3c74] p-6 rounded-r-xl mt-12">
              <p className="text-gray-700 font-semibold mb-2">
                Última actualización: 15 de enero de 2025
              </p>
              <p className="text-gray-600 m-0">
                Al continuar usando nuestro servicio, aceptas estos términos y condiciones en su versión más reciente.
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
      <BackToTop />
    </div>
  )
}
