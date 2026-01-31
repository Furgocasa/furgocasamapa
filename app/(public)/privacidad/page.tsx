'use client'

import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BackToTop } from '@/components/area/BackToTop'

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0b3c74] to-[#0d4a8f] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Política de Privacidad
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
                En Mapa Furgocasa, respetamos tu privacidad y estamos comprometidos con la protección de tus datos personales. Esta política explica qué información recopilamos, cómo la usamos y cuáles son tus derechos.
              </p>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">1. Información que Recopilamos</h2>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">1.1. Información que Proporcionas</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Registro:</strong> Email, nombre, contraseña</li>
              <li><strong>Perfil:</strong> Foto de perfil, información biográfica (opcional)</li>
              <li><strong>Vehículos:</strong> Marca, modelo, año, kilometraje, fotos, número de bastidor</li>
              <li><strong>Contenido:</strong> Comentarios, valoraciones, reportes de áreas</li>
              <li><strong>Comunicaciones:</strong> Mensajes enviados a través del formulario de contacto</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-6">1.2. Información Recopilada Automáticamente</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Datos de uso:</strong> Páginas visitadas, tiempo en el sitio, funciones utilizadas</li>
              <li><strong>Información del dispositivo:</strong> Tipo de dispositivo, sistema operativo, navegador</li>
              <li><strong>Datos de ubicación:</strong> Ubicación aproximada (con tu consentimiento)</li>
              <li><strong>Cookies:</strong> Datos almacenados en tu navegador para mejorar la experiencia</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-6">1.3. Información de Terceros</h3>
            <p className="text-gray-600 leading-relaxed">
              Podemos recibir información de servicios de terceros como Google Maps (para mapas) y OpenAI (para valoraciones con IA).
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">2. Cómo Usamos tu Información</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Utilizamos tu información para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Proporcionar y mantener nuestro servicio</li>
              <li>Procesar valoraciones de vehículos con IA (GPT-4)</li>
              <li>Gestionar el sistema QR de protección</li>
              <li>Enviar notificaciones sobre reportes y actualizaciones</li>
              <li>Mejorar la experiencia del usuario</li>
              <li>Analizar el uso del servicio para optimizarlo</li>
              <li>Detectar y prevenir fraudes o abusos</li>
              <li>Cumplir con obligaciones legales</li>
              <li>Comunicarnos contigo sobre el servicio</li>
            </ul>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">3. Compartir Información</h2>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">3.1. Información Pública</h3>
            <p className="text-gray-600 leading-relaxed">
              Algunos datos son públicos por naturaleza:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Comentarios y valoraciones de áreas</li>
              <li>Nombre de usuario visible en la comunidad</li>
              <li>Información de perfil si eliges hacerla pública</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-6">3.2. Proveedores de Servicios</h3>
            <p className="text-gray-600 leading-relaxed">
              Compartimos información con proveedores que nos ayudan a operar el servicio:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Supabase:</strong> Almacenamiento y gestión de base de datos</li>
              <li><strong>OpenAI (GPT-4):</strong> Procesamiento de valoraciones con IA</li>
              <li><strong>Google Maps:</strong> Servicios de mapas y geolocalización</li>
              <li><strong>Vercel/AWS:</strong> Hosting y entrega de contenido</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-6">3.3. Requisitos Legales</h3>
            <p className="text-gray-600 leading-relaxed">
              Podemos divulgar tu información si es requerido por ley o para proteger nuestros derechos legales.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-6">3.4. Sistema QR</h3>
            <p className="text-gray-600 leading-relaxed">
              Los testigos que escaneen tu código QR podrán enviar reportes con fotos y ubicación. Esta información te será notificada a ti.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">4. Seguridad de los Datos</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Implementamos medidas de seguridad para proteger tu información:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Cifrado SSL/TLS para todas las comunicaciones</li>
              <li>Contraseñas hasheadas con algoritmos seguros</li>
              <li>Acceso restringido a datos personales</li>
              <li>Auditorías de seguridad periódicas</li>
              <li>Backups encriptados</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Sin embargo, ningún sistema es 100% seguro. No podemos garantizar la seguridad absoluta de tus datos.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">5. Retención de Datos</h2>
            <p className="text-gray-600 leading-relaxed">
              Conservamos tu información mientras tu cuenta esté activa o mientras sea necesario para proporcionar el servicio. Puedes solicitar la eliminación de tu cuenta en cualquier momento.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">6. Tus Derechos</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Según el RGPD (Reglamento General de Protección de Datos), tienes derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Acceso:</strong> Solicitar una copia de tus datos personales</li>
              <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
              <li><strong>Eliminación:</strong> Solicitar la eliminación de tus datos ("derecho al olvido")</li>
              <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado</li>
              <li><strong>Oposición:</strong> Oponerte al procesamiento de tus datos</li>
              <li><strong>Limitación:</strong> Solicitar la limitación del procesamiento</li>
              <li><strong>Retirar consentimiento:</strong> En cualquier momento</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Para ejercer estos derechos, contáctanos en: <strong>info@mapafurgocasa.com</strong>
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">7. Cookies</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Utilizamos cookies para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Esenciales:</strong> Necesarias para el funcionamiento del servicio (autenticación, sesión)</li>
              <li><strong>Funcionales:</strong> Recordar preferencias (idioma, filtros)</li>
              <li><strong>Analíticas:</strong> Entender cómo se usa el servicio (Google Analytics)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Puedes gestionar las cookies desde la configuración de tu navegador.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">8. Menores de Edad</h2>
            <p className="text-gray-600 leading-relaxed">
              Nuestro servicio no está dirigido a menores de 16 años. Si descubrimos que hemos recopilado datos de un menor sin consentimiento parental, eliminaremos esa información inmediatamente.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">9. Transferencias Internacionales</h2>
            <p className="text-gray-600 leading-relaxed">
              Algunos de nuestros proveedores de servicios (como OpenAI) están ubicados fuera del Espacio Económico Europeo. Nos aseguramos de que estas transferencias cumplan con el RGPD y proporcionen un nivel adecuado de protección.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">10. Cambios en esta Política</h2>
            <p className="text-gray-600 leading-relaxed">
              Podemos actualizar esta política de privacidad periódicamente. Te notificaremos de cambios significativos publicando la nueva política en esta página y actualizando la fecha de "última actualización".
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">11. Contacto</h2>
            <p className="text-gray-600 leading-relaxed">
              Si tienes preguntas sobre esta política de privacidad o sobre cómo manejamos tus datos, puedes contactarnos:
            </p>
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 mt-4">
              <p className="text-gray-900 font-semibold mb-2">Responsable del Tratamiento:</p>
              <p className="text-gray-900 font-semibold mb-2">Mapa Furgocasa / Furgocasa</p>
              <p className="text-gray-600">Email: info@mapafurgocasa.com</p>
              <p className="text-gray-600">Web: www.mapafurgocasa.com</p>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">12. Autoridad de Control</h2>
            <p className="text-gray-600 leading-relaxed">
              Si consideras que tus derechos de protección de datos han sido vulnerados, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD):
            </p>
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 mt-4">
              <p className="text-gray-900 font-semibold mb-2">AEPD</p>
              <p className="text-gray-600">C/ Jorge Juan, 6</p>
              <p className="text-gray-600">28001 Madrid</p>
              <p className="text-gray-600">www.aepd.es</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-[#0b3c74] p-6 rounded-r-xl mt-12">
              <p className="text-gray-700 font-semibold mb-2">
                Última actualización: 15 de enero de 2025
              </p>
              <p className="text-gray-600 m-0">
                Esta política es efectiva a partir de la fecha indicada y se aplica a todos los usuarios de Mapa Furgocasa.
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
