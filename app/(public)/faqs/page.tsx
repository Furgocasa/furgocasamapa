"use client"

import { useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BackToTop } from '@/components/area/BackToTop'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface FAQ {
  pregunta: string
  respuesta: string
  categoria: 'general' | 'areas' | 'rutas' | 'vehiculos' | 'cuenta' | 'tecnico'
}

const faqs: FAQ[] = [
  // General
  {
    categoria: 'general',
    pregunta: '¿Qué es Mapa Furgocasa?',
    respuesta: 'Mapa Furgocasa es una plataforma completa para viajeros en autocaravana, camper o furgoneta camperizada. Ofrecemos un mapa interactivo con más de 9.000 áreas de estacionamiento en Europa y Latinoamérica, planificador de rutas, gestión de vehículos y una comunidad activa de viajeros.'
  },
  {
    categoria: 'general',
    pregunta: '¿Es gratis usar Mapa Furgocasa?',
    respuesta: 'Sí, Mapa Furgocasa es completamente gratuito. Puedes acceder al mapa de áreas, planificar rutas, registrar tu vehículo y usar todas las funcionalidades sin coste alguno.'
  },
  {
    categoria: 'general',
    pregunta: '¿Necesito registrarme para usar la aplicación?',
    respuesta: 'Sí, necesitas crear una cuenta gratuita para acceder a todas las funcionalidades de Mapa Furgocasa: mapa de áreas, planificador de rutas, gestión de vehículos, valoraciones con IA y todas las herramientas avanzadas.'
  },
  {
    categoria: 'general',
    pregunta: '¿Qué países están cubiertos?',
    respuesta: 'Cubrimos más de 25 países en Europa (España, Francia, Italia, Alemania, Portugal, Reino Unido, Países Bajos, Noruega…) y Latinoamérica (México, Argentina, Chile, Uruguay, Costa Rica…). Seguimos expandiendo la cobertura.'
  },
  {
    categoria: 'general',
    pregunta: '¿Cómo puedo reportar un error o sugerir una mejora?',
    respuesta: 'Puedes contactarnos a través del formulario de contacto en la página web o enviarnos un email. Valoramos mucho el feedback de nuestros usuarios y revisamos todas las sugerencias para mejorar continuamente la plataforma.'
  },
  {
    categoria: 'general',
    pregunta: '¿Hay límite de uso o restricciones?',
    respuesta: 'No, Mapa Furgocasa es completamente gratuito y sin límites de uso. Puedes usar todas las funcionalidades las veces que quieras: consultar áreas, crear rutas ilimitadas, registrar múltiples vehículos y generar valoraciones sin restricciones.'
  },
  {
    categoria: 'general',
    pregunta: '¿Qué diferencia a Mapa Furgocasa de otras aplicaciones?',
    respuesta: 'Mapa Furgocasa es la única plataforma que combina mapa de áreas, planificador de rutas, gestión completa de vehículos con valoración IA, control de gastos y sistema QR de protección. Todo en una sola plataforma, 100% gratis.'
  },
  {
    categoria: 'general',
    pregunta: '¿Ofrecen soporte técnico?',
    respuesta: 'Sí, ofrecemos soporte técnico gratuito a través de nuestro formulario de contacto. Respondemos todas las consultas en un plazo máximo de 48 horas. También puedes consultar esta sección de FAQs para respuestas rápidas.'
  },
  {
    categoria: 'general',
    pregunta: '¿Es seguro usar Mapa Furgocasa?',
    respuesta: 'Absolutamente. Utilizamos tecnología de encriptación para proteger todos tus datos. Nunca compartimos información personal con terceros. Tus documentos, fotos y datos de vehículos están completamente seguros y solo accesibles por ti.'
  },

  // Áreas
  {
    categoria: 'areas',
    pregunta: '¿Cuántas áreas tenéis en el mapa?',
    respuesta: 'Actualmente tenemos más de 9.000 áreas de estacionamiento para autocaravanas en Europa y Latinoamérica. Actualizamos constantemente nuestra base de datos con nuevas áreas y verificamos la información existente.'
  },
  {
    categoria: 'areas',
    pregunta: '¿Cómo puedo añadir un área que no está en el mapa?',
    respuesta: 'Si conoces un área que no está en nuestro mapa, puedes reportarla desde la sección "Añadir Área". Solo necesitas proporcionar la ubicación, nombre y algunos detalles básicos. Nuestro equipo verificará la información antes de publicarla.'
  },
  {
    categoria: 'areas',
    pregunta: '¿Cómo sé si un área está actualizada?',
    respuesta: 'Cada área muestra la fecha de última actualización. Además, nuestra comunidad de usuarios puede reportar cambios o problemas en tiempo real. Recomendamos verificar los comentarios recientes antes de visitar un área.'
  },
  {
    categoria: 'areas',
    pregunta: '¿Puedo filtrar áreas por servicios?',
    respuesta: 'Sí, el mapa incluye filtros avanzados para buscar áreas según servicios disponibles: agua, electricidad, vaciado de aguas grises/negras, WiFi, seguridad, y más. Puedes combinar múltiples filtros para encontrar el área perfecta para tus necesidades.'
  },
  {
    categoria: 'areas',
    pregunta: '¿Cómo funciona el sistema de favoritos?',
    respuesta: 'Puedes guardar tus áreas favoritas haciendo clic en el icono de estrella en cualquier área del mapa. Luego accede a "Mis Favoritos" desde tu perfil para ver todas las áreas guardadas y organizarlas según tus preferencias.'
  },
  {
    categoria: 'areas',
    pregunta: '¿Las áreas tienen información de precios?',
    respuesta: 'Sí, cuando está disponible, mostramos información sobre precios y métodos de pago de cada área. Esta información se actualiza regularmente gracias a los reportes de nuestra comunidad de usuarios.'
  },
  {
    categoria: 'areas',
    pregunta: '¿Puedo ver fotos de las áreas?',
    respuesta: 'Sí, muchas áreas incluyen fotos proporcionadas por nuestra comunidad y por Google Places. Puedes ver múltiples imágenes de cada área para tener una mejor idea de cómo es antes de visitarla.'
  },
  {
    categoria: 'areas',
    pregunta: '¿Cómo sé si un área acepta autocaravanas grandes?',
    respuesta: 'Cada área muestra información sobre el tamaño máximo permitido y número de plazas. También puedes leer los comentarios de otros usuarios que han visitado el área para conocer experiencias reales con vehículos de diferentes tamaños.'
  },
  {
    categoria: 'areas',
    pregunta: '¿Puedo reportar que un área está cerrada o ha cambiado?',
    respuesta: 'Sí, puedes reportar cualquier cambio en un área directamente desde su página de detalles. Nuestro equipo revisa todos los reportes y actualiza la información lo antes posible para mantener el mapa siempre actualizado.'
  },
  {
    categoria: 'areas',
    pregunta: '¿Hay áreas solo para autocaravanas o también para furgonetas?',
    respuesta: 'Nuestro mapa incluye áreas para todo tipo de vehículos recreativos: autocaravanas, furgonetas camperizadas, campers y caravanas. Puedes filtrar según el tipo de vehículo que tengas para encontrar áreas adecuadas.'
  },
  {
    categoria: 'areas',
    pregunta: '¿Cómo funciona la integración con Google Maps?',
    respuesta: 'Cada área está integrada con Google Maps para que puedas ver su ubicación exacta, obtener direcciones, calcular rutas y usar la navegación GPS directamente desde nuestra plataforma.'
  },

  // Rutas
  {
    categoria: 'rutas',
    pregunta: '¿Cómo funciona el planificador de rutas?',
    respuesta: 'El planificador de rutas te permite crear itinerarios personalizados seleccionando múltiples áreas de estacionamiento. Puedes reordenar las paradas arrastrándolas, ver la distancia total, tiempo estimado y exportar tu ruta a GPX para usarla en tu GPS.'
  },
  {
    categoria: 'rutas',
    pregunta: '¿Puedo compartir mis rutas con otros usuarios?',
    respuesta: 'Actualmente las rutas son privadas y solo tú puedes verlas. Estamos trabajando en una función de rutas públicas donde podrás compartir tus mejores itinerarios con la comunidad.'
  },
  {
    categoria: 'rutas',
    pregunta: '¿Cómo exporto una ruta a mi GPS?',
    respuesta: 'Desde el planificador de rutas, haz clic en "Exportar GPX" para descargar un archivo compatible con la mayoría de dispositivos GPS (Garmin, TomTom, etc.) y aplicaciones de navegación.'
  },
  {
    categoria: 'rutas',
    pregunta: '¿Puedo guardar múltiples rutas?',
    respuesta: 'Sí, puedes crear y guardar tantas rutas como quieras. Cada ruta se guarda con un nombre personalizado y puedes acceder a ellas desde tu perfil para editarlas o reutilizarlas en el futuro.'
  },
  {
    categoria: 'rutas',
    pregunta: '¿El planificador calcula automáticamente las distancias?',
    respuesta: 'Sí, el planificador calcula automáticamente la distancia total entre todas las paradas, el tiempo estimado de viaje y muestra un mapa visual de tu ruta completa. Todo se actualiza en tiempo real cuando modificas las paradas.'
  },
  {
    categoria: 'rutas',
    pregunta: '¿Puedo añadir paradas intermedias que no sean áreas?',
    respuesta: 'Actualmente el planificador está optimizado para áreas de estacionamiento, pero puedes añadir cualquier punto de interés como parada intermedia. El sistema calculará la ruta completa incluyendo todas tus paradas.'
  },
  {
    categoria: 'rutas',
    pregunta: '¿Cómo encuentro áreas cercanas a mi ruta?',
    respuesta: 'El planificador muestra automáticamente áreas cercanas a cada tramo de tu ruta. Puedes hacer clic en cualquier área sugerida para añadirla como parada en tu itinerario.'
  },
  {
    categoria: 'rutas',
    pregunta: '¿Puedo imprimir o compartir mi ruta?',
    respuesta: 'Sí, puedes exportar tu ruta en formato GPX o imprimir un resumen con todas las paradas, distancias y tiempos. También puedes copiar el enlace de tu ruta para compartirlo con otros viajeros.'
  },
  {
    categoria: 'rutas',
    pregunta: '¿El planificador tiene en cuenta restricciones de altura o peso?',
    respuesta: 'Actualmente el planificador calcula rutas estándar. Para restricciones específicas de altura o peso, recomendamos verificar manualmente cada tramo de la ruta y consultar las áreas individuales que muestran información sobre accesos y limitaciones.'
  },

  // Vehículos
  {
    categoria: 'vehiculos',
    pregunta: '¿Para qué sirve registrar mi vehículo?',
    respuesta: 'Registrar tu vehículo te permite gestionar toda su información en un solo lugar: datos técnicos, mantenimientos, averías, mejoras, documentos y fotos. También puedes generar valoraciones con IA y llevar un control completo del historial de tu autocaravana.'
  },
  {
    categoria: 'vehiculos',
    pregunta: '¿Qué es la valoración con IA?',
    respuesta: 'La valoración con IA es un sistema que analiza tu vehículo utilizando inteligencia artificial y datos reales del mercado. Genera un informe profesional con tres precios recomendados (salida, objetivo y mínimo) basándose en marca, modelo, año, estado y comparables del mercado.'
  },
  {
    categoria: 'vehiculos',
    pregunta: '¿Puedo registrar varios vehículos?',
    respuesta: 'Sí, puedes registrar todos los vehículos que quieras. Cada uno tendrá su propia ficha con información independiente, mantenimientos, valoraciones y documentos.'
  },
  {
    categoria: 'vehiculos',
    pregunta: '¿Es seguro subir documentos de mi vehículo?',
    respuesta: 'Sí, todos los documentos se almacenan de forma segura y encriptada en servidores protegidos. Solo tú puedes acceder a tu información. Nunca compartimos datos personales con terceros.'
  },
  {
    categoria: 'vehiculos',
    pregunta: '¿Qué información necesito para registrar mi vehículo?',
    respuesta: 'Para registrar tu vehículo necesitas: marca, modelo, año, número de bastidor (VIN), kilometraje actual y tipo de combustible. Opcionalmente puedes añadir fotos, documentos (ITV, seguro, etc.) y detalles adicionales.'
  },
  {
    categoria: 'vehiculos',
    pregunta: '¿Cómo funciona el sistema QR de protección?',
    respuesta: 'Cada vehículo registrado recibe un código QR único que puedes imprimir y colocar en tu autocaravana. Si alguien encuentra daños o problemas, puede escanear el QR y reportarlos. Recibirás notificaciones instantáneas con fotos y ubicación GPS.'
  },
  {
    categoria: 'vehiculos',
    pregunta: '¿Puedo registrar mantenimientos y averías?',
    respuesta: 'Sí, puedes registrar todos los mantenimientos (cambios de aceite, filtros, neumáticos, etc.) y averías con fecha, coste, taller y fotos. Esto te ayuda a llevar un historial completo y calcular el coste real de propiedad de tu vehículo.'
  },
  {
    categoria: 'vehiculos',
    pregunta: '¿La valoración con IA es precisa?',
    respuesta: 'La valoración con IA utiliza GPT-5.6 Terra y datos reales del mercado para generar precios precisos. Analiza comparables de portales especializados, estado del vehículo, kilometraje y características para darte tres precios: salida rápida, objetivo y mínimo aceptable.'
  },
  {
    categoria: 'vehiculos',
    pregunta: '¿Puedo ver el historial de valoraciones?',
    respuesta: 'Sí, todas las valoraciones se guardan con fecha y puedes ver la evolución del valor de tu vehículo a lo largo del tiempo. Esto te ayuda a entender cómo se deprecia tu autocaravana y tomar decisiones informadas.'
  },
  {
    categoria: 'vehiculos',
    pregunta: '¿Puedo registrar gastos y calcular el ROI?',
    respuesta: 'Sí, puedes registrar todos los gastos relacionados con tu vehículo (compra, mejoras, mantenimientos, seguros, etc.) y el sistema calcula automáticamente el ROI (Retorno de Inversión) y el coste total de propiedad.'
  },
  {
    categoria: 'vehiculos',
    pregunta: '¿Qué pasa si vendo mi vehículo?',
    respuesta: 'Puedes marcar tu vehículo como "Vendido" y registrar el precio de venta. El historial completo se mantiene guardado para que puedas consultarlo en el futuro. Esto es útil para llevar un registro de todos los vehículos que has tenido.'
  },

  // Cuenta
  {
    categoria: 'cuenta',
    pregunta: '¿Cómo creo una cuenta?',
    respuesta: 'Haz clic en "Registrarse" en la parte superior de la página. Puedes crear una cuenta con tu email o usar tu cuenta de Google para un registro rápido. El proceso toma menos de 1 minuto.'
  },
  {
    categoria: 'cuenta',
    pregunta: '¿Olvidé mi contraseña, qué hago?',
    respuesta: 'En la página de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?". Te enviaremos un email con un enlace para restablecer tu contraseña de forma segura.'
  },
  {
    categoria: 'cuenta',
    pregunta: '¿Puedo cambiar mi email?',
    respuesta: 'Sí, desde tu perfil de usuario puedes actualizar tu email, nombre y otros datos personales en cualquier momento.'
  },
  {
    categoria: 'cuenta',
    pregunta: '¿Cómo elimino mi cuenta?',
    respuesta: 'Si deseas eliminar tu cuenta, contáctanos a través del formulario de contacto. Eliminaremos toda tu información de forma permanente en un plazo de 48 horas.'
  },
  {
    categoria: 'cuenta',
    pregunta: '¿Puedo usar mi cuenta de Google para registrarme?',
    respuesta: 'Sí, puedes registrarte usando tu cuenta de Google para un proceso más rápido y seguro. Solo necesitas hacer clic en "Iniciar sesión con Google" y autorizar el acceso.'
  },
  {
    categoria: 'cuenta',
    pregunta: '¿Qué datos personales se almacenan?',
    respuesta: 'Almacenamos solo la información necesaria para proporcionar el servicio: email, nombre (opcional), y datos de tus vehículos registrados. Nunca compartimos esta información con terceros ni la usamos para marketing sin tu consentimiento.'
  },
  {
    categoria: 'cuenta',
    pregunta: '¿Puedo cambiar mi contraseña?',
    respuesta: 'Sí, desde tu perfil de usuario puedes cambiar tu contraseña en cualquier momento. Solo necesitas tu contraseña actual y establecer una nueva contraseña segura.'
  },
  {
    categoria: 'cuenta',
    pregunta: '¿Recibiré emails de la plataforma?',
    respuesta: 'Solo recibirás emails importantes como confirmaciones de registro, restablecimiento de contraseña y notificaciones de reportes QR. Puedes gestionar tus preferencias de notificaciones desde tu perfil.'
  },
  {
    categoria: 'cuenta',
    pregunta: '¿Puedo tener múltiples cuentas?',
    respuesta: 'No es necesario tener múltiples cuentas. Una sola cuenta te permite registrar múltiples vehículos, crear múltiples rutas y gestionar toda tu información. Si necesitas ayuda con algo específico, contáctanos.'
  },
  {
    categoria: 'cuenta',
    pregunta: '¿Qué pasa si no uso mi cuenta durante mucho tiempo?',
    respuesta: 'Tu cuenta y toda tu información permanecen activas indefinidamente. No eliminamos cuentas por inactividad. Siempre puedes volver y acceder a todos tus datos guardados.'
  },

  // Técnico
  {
    categoria: 'tecnico',
    pregunta: '¿Funciona en móviles y tablets?',
    respuesta: 'Sí, Mapa Furgocasa está optimizado para funcionar perfectamente en cualquier dispositivo: ordenadores, tablets y smartphones. La interfaz se adapta automáticamente al tamaño de tu pantalla.'
  },
  {
    categoria: 'tecnico',
    pregunta: '¿Necesito conexión a internet para usar la app?',
    respuesta: 'Sí, necesitas conexión a internet para acceder al mapa y las funcionalidades en tiempo real. Sin embargo, puedes exportar rutas en GPX para usarlas offline en tu GPS.'
  },
  {
    categoria: 'tecnico',
    pregunta: '¿Qué navegadores son compatibles?',
    respuesta: 'Mapa Furgocasa funciona en todos los navegadores modernos: Chrome, Firefox, Safari, Edge y Opera. Recomendamos mantener tu navegador actualizado para la mejor experiencia.'
  },
  {
    categoria: 'tecnico',
    pregunta: '¿Tenéis aplicación móvil nativa?',
    respuesta: 'Actualmente Mapa Furgocasa es una aplicación web responsive que funciona perfectamente en móviles. Estamos considerando desarrollar aplicaciones nativas para iOS y Android en el futuro según la demanda de los usuarios.'
  },
  {
    categoria: 'tecnico',
    pregunta: '¿Puedo usar la app sin conexión a internet?',
    respuesta: 'La aplicación requiere conexión a internet para acceder al mapa y las funcionalidades en tiempo real. Sin embargo, puedes exportar rutas en formato GPX para usarlas offline en tu GPS o aplicación de navegación favorita.'
  },
  {
    categoria: 'tecnico',
    pregunta: '¿La aplicación consume mucha batería o datos?',
    respuesta: 'La aplicación está optimizada para un consumo eficiente de batería y datos. El mapa carga solo las áreas visibles en pantalla y puedes ajustar la calidad de las imágenes. El consumo es similar al de otras aplicaciones de mapas modernas.'
  },
  {
    categoria: 'tecnico',
    pregunta: '¿Funciona con todos los sistemas operativos?',
    respuesta: 'Sí, Mapa Furgocasa funciona en cualquier dispositivo con un navegador moderno: Windows, macOS, Linux, iOS, Android. No necesitas instalar nada, solo accede desde tu navegador web.'
  },
  {
    categoria: 'tecnico',
    pregunta: '¿Puedo añadir la app a la pantalla de inicio de mi móvil?',
    respuesta: 'Sí, desde tu navegador móvil puedes añadir Mapa Furgocasa a la pantalla de inicio como si fuera una app nativa. Busca la opción "Añadir a pantalla de inicio" en el menú de tu navegador.'
  },
  {
    categoria: 'tecnico',
    pregunta: '¿Qué hago si la página no carga correctamente?',
    respuesta: 'Primero intenta refrescar la página (F5 o Ctrl+R). Si el problema persiste, limpia la caché de tu navegador o prueba en modo incógnito. Si sigue sin funcionar, contáctanos con detalles del error y te ayudaremos.'
  },
  {
    categoria: 'tecnico',
    pregunta: '¿Los datos se sincronizan entre dispositivos?',
    respuesta: 'Sí, todos tus datos (vehículos, rutas, favoritos) se almacenan en la nube y se sincronizan automáticamente entre todos tus dispositivos. Solo necesitas iniciar sesión con la misma cuenta.'
  },
  {
    categoria: 'tecnico',
    pregunta: '¿Hay límite de almacenamiento para fotos y documentos?',
    respuesta: 'Ofrecemos generoso espacio de almacenamiento para fotos y documentos de tus vehículos. Si necesitas más espacio, contáctanos y podemos ampliarlo según tus necesidades.'
  }
]

const categorias = [
  { id: 'general', nombre: 'General', icono: '❓' },
  { id: 'areas', nombre: 'Áreas y Mapa', icono: '🗺️' },
  { id: 'rutas', nombre: 'Rutas', icono: '🚗' },
  { id: 'vehiculos', nombre: 'Vehículos', icono: '🚐' },
  { id: 'cuenta', nombre: 'Mi Cuenta', icono: '👤' },
  { id: 'tecnico', nombre: 'Técnico', icono: '⚙️' }
]

export default function FAQsPage() {
  const [categoriaActiva, setCategoriaActiva] = useState<string>('general')
  const [preguntaAbierta, setPreguntaAbierta] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const faqsFiltrados = faqs.filter((faq: any) => {
    const matchCategoria = faq.categoria === categoriaActiva
    const matchBusqueda = busqueda === '' ||
      faq.pregunta.toLowerCase().includes(busqueda.toLowerCase()) ||
      faq.respuesta.toLowerCase().includes(busqueda.toLowerCase())
    return matchCategoria && matchBusqueda
  })

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#0b3c74] to-[#0d4a8f] text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Preguntas Frecuentes
              </h1>
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
                Encuentra respuestas rápidas a las preguntas más comunes
              </p>
            </div>
          </div>
        </section>

        {/* Buscador */}
        <div className="max-w-4xl mx-auto px-4 -mt-6">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <input
              type="text"
              placeholder="🔍 Buscar en preguntas frecuentes..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Categorías */}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categorias.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoriaActiva(cat.id)
                  setPreguntaAbierta(null)
                  setBusqueda('')
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  categoriaActiva === cat.id
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.icono} {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de FAQs */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-3">
            {faqsFiltrados.length > 0 ? (
              faqsFiltrados.map((faq: any, index: any) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setPreguntaAbierta(preguntaAbierta === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 pr-4">
                      {faq.pregunta}
                    </span>
                    {preguntaAbierta === index ? (
                      <ChevronUpIcon className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {preguntaAbierta === index && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-700 leading-relaxed">
                        {faq.respuesta}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500 text-lg">
                  No se encontraron resultados para "{busqueda}"
                </p>
                <button
                  onClick={() => setBusqueda('')}
                  className="mt-4 text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Limpiar búsqueda
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CTA de Contacto */}
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-lg p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-2">
              ¿No encuentras lo que buscas?
            </h2>
            <p className="text-primary-100 mb-6">
              Nuestro equipo está aquí para ayudarte. Contáctanos y te responderemos lo antes posible.
            </p>
            <a
              href="/contacto"
              className="inline-block px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              📧 Contactar con Soporte
            </a>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}
