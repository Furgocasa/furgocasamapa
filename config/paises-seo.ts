// Configuración de países para landing pages SEO
// 16 Europa + 3 Sudamérica + 1 Norteamérica (México)

export interface PaisSEO {
  nombre: string
  slug: string
  terminologia: 'autocaravanas' | 'casas rodantes' | 'motorhome'
  urlSlug: string // URL completa: /mapa-autocaravanas-espana
  titulo: string // H1 de la página
  metaTitle: string // Meta title (max 60 chars)
  metaDescription: string // Meta description (max 160 chars)
  descripcion: string // Párrafo principal único
  keywords: string[] // Keywords principales
  region: 'europa' | 'sudamerica' | 'norteamerica'
  emoji: string
  lat: number
  lng: number
  consejos: string[] // 3-5 consejos específicos del país
  regulaciones?: string // Info sobre regulaciones locales
}

export const PAISES_SEO_CONFIG: Record<string, PaisSEO> = {
  // ============================================================================
  // 🇪🇺 EUROPA (16 países) - Usar "autocaravanas"
  // ============================================================================
  
  'espana': {
    nombre: 'España',
    slug: 'espana',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-espana',
    titulo: 'Mapa de Áreas de Autocaravanas en España',
    metaTitle: 'Mapa Áreas Autocaravanas España 2024 | +3000 Ubicaciones',
    metaDescription: 'Descubre más de 3.000 áreas de autocaravanas en España. Mapa interactivo con ubicaciones, servicios, precios y valoraciones reales.',
    descripcion: 'España es el destino líder en Europa para el turismo en autocaravana, con una red extensa de más de 3.000 áreas habilitadas. Desde las playas del Mediterráneo hasta los Pirineos, pasando por Andalucía y la costa atlántica, encontrarás infraestructura moderna con servicios completos: vaciado de aguas grises y negras, llenado de agua potable, electricidad y WiFi. La legislación española permite la pernocta en áreas designadas, aunque varía por comunidades autónomas.',
    keywords: ['mapa áreas autocaravanas españa', 'pernocta autocaravana españa', 'camping autocaravanas españa', 'rutas autocaravana españa'],
    region: 'europa',
    emoji: '🇪🇸',
    lat: 40.4168,
    lng: -3.7038,
    consejos: [
      'La pernocta es legal en áreas designadas, pero regulada por cada comunidad autónoma',
      'Mejor época: primavera (abril-mayo) y otoño (septiembre-octubre) para evitar el calor',
      'Costa mediterránea y norte de España tienen la mayor concentración de áreas',
      'Muchas áreas ofrecen descuentos con la tarjeta ACSI o tarjeta de camping',
      'Respeta las señales de prohibición de pernocta en zonas naturales protegidas'
    ],
    regulaciones: 'La pernocta está permitida en áreas habilitadas. Consulta las ordenanzas municipales ya que varían por región.'
  },

  'francia': {
    nombre: 'Francia',
    slug: 'francia',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-francia',
    titulo: 'Mapa de Áreas de Autocaravanas en Francia',
    metaTitle: 'Mapa Áreas Autocaravanas Francia 2024 | +1800 Aires',
    metaDescription: 'Más de 1.800 aires de camping-car en Francia. Mapa con ubicaciones verificadas, servicios completos y valoraciones de usuarios.',
    descripcion: 'Francia cuenta con una de las infraestructuras más desarrolladas de Europa para autocaravanas, con más de 1.800 "aires de camping-car" distribuidas por todo el país. Desde la Costa Azul hasta Bretaña, los Alpes y la Provenza, encontrarás áreas municipales gratuitas o de bajo coste con excelentes servicios. La cultura francesa es muy receptiva al caravaning y la mayoría de pueblos tienen al menos un área habilitada con servicios básicos.',
    keywords: ['aires camping-car francia', 'mapa autocaravanas francia', 'pernocta francia autocaravana', 'costa azul autocaravana'],
    region: 'europa',
    emoji: '🇫🇷',
    lat: 46.2276,
    lng: 2.2137,
    consejos: [
      'Los "aires de camping-car" son muy accesibles y económicos (2-10€/noche)',
      'Descarga la app Park4Night para encontrar áreas gratuitas',
      'La Costa Azul es muy popular pero cara en temporada alta (junio-agosto)',
      'Bretaña y Normandía ofrecen paisajes espectaculares y áreas menos concurridas',
      'Muchos supermercados Carrefour y Leclerc tienen parking gratuito para autocaravanas'
    ],
    regulaciones: 'Pernocta permitida en aires designadas. Prohibida la acampada libre en muchas zonas costeras y parques naturales.'
  },

  'portugal': {
    nombre: 'Portugal',
    slug: 'portugal',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-portugal',
    titulo: 'Mapa de Áreas de Autocaravanas en Portugal',
    metaTitle: 'Mapa Áreas Autocaravanas Portugal 2024 | Costa y Algarve',
    metaDescription: 'Descubre áreas de autocaravanas en Portugal. Algarve, Lisboa, Porto y costa atlántica con servicios completos y ubicaciones privilegiadas.',
    descripcion: 'Portugal se ha convertido en un destino top para autocaravanas gracias a su clima templado, playas espectaculares y gente hospitalaria. El Algarve cuenta con numerosas áreas cerca de la costa, mientras que Lisboa y Porto tienen opciones urbanas. La Rota Vicentina y la costa de Peniche son ideales para surfistas. Portugal es más económico que España y Francia, con áreas que oscilan entre gratuitas y 15€/noche con servicios completos.',
    keywords: ['áreas autocaravanas portugal', 'algarve autocaravana', 'pernocta portugal', 'camping portugal autocaravana'],
    region: 'europa',
    emoji: '🇵🇹',
    lat: 39.3999,
    lng: -8.2245,
    consejos: [
      'El Algarve es perfecto en invierno (octubre-marzo) con clima templado',
      'Lagos, Sagres y Costa Vicentina tienen áreas con vistas al mar',
      'Lisboa y Porto tienen áreas urbanas bien conectadas con transporte público',
      'Évita agosto en la costa, está muy saturado de turistas',
      'La gasolina es más cara que en España, llena el tanque en la frontera'
    ],
    regulaciones: 'Pernocta tolerada en áreas habilitadas. Evita acampar en playas y reservas naturales donde está expresamente prohibido.'
  },

  'italia': {
    nombre: 'Italia',
    slug: 'italia',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-italia',
    titulo: 'Mapa de Áreas de Autocaravanas en Italia',
    metaTitle: 'Mapa Áreas Autocaravanas Italia 2024 | Costa y Lagos',
    metaDescription: 'Áreas de autocaravanas en Italia: Toscana, Costa Amalfitana, Lagos del Norte y más. Ubicaciones verificadas con servicios completos.',
    descripcion: 'Italia ofrece una experiencia única para autocaravanas, combinando historia, gastronomía y paisajes increíbles. La Toscana, los Lagos del Norte (Como, Garda, Maggiore), la Costa Amalfitana y Sicilia son destinos imperdibles. Las áreas italianas suelen ser campings o "sosta camper" municipales. Los precios varían de 10-25€ dependiendo de la zona y servicios. La infraestructura ha mejorado mucho en los últimos años.',
    keywords: ['aree sosta camper italia', 'autocaravanas italia', 'toscana autocaravana', 'lagos norte italia camper'],
    region: 'europa',
    emoji: '🇮🇹',
    lat: 41.8719,
    lng: 12.5674,
    consejos: [
      'Reserva con antelación en Toscana y Lagos del Norte en verano',
      'Las ZTL (zonas de tráfico limitado) en ciudades son estrictas, evita multas',
      'El norte es más caro pero con mejor infraestructura que el sur',
      'Sicilia es increíble en primavera, evita julio-agosto por el calor extremo',
      'Prueba los "agriturismos" que a veces permiten pernocta con compra de productos'
    ],
    regulaciones: 'Pernocta permitida en áreas designadas. Respeta las señales locales y las ZTL en centros históricos.'
  },

  'alemania': {
    nombre: 'Alemania',
    slug: 'alemania',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-alemania',
    titulo: 'Mapa de Áreas de Autocaravanas en Alemania',
    metaTitle: 'Mapa Áreas Autocaravanas Alemania 2024 | Stellplatz',
    metaDescription: 'Más de 4.000 Stellplatz en Alemania. Descubre áreas de autocaravanas con servicios premium en Baviera, Selva Negra y más.',
    descripcion: 'Alemania es el país más desarrollado de Europa para autocaravanas, con más de 4.000 "Stellplatz" (áreas de pernocta) distribuidas por todo el territorio. Desde los Alpes Bávaros hasta la costa del Mar del Norte, pasando por la Selva Negra y la Ruta Romántica, encontrarás infraestructura impecable con servicios de primera calidad. Los alemanes son pioneros en el caravaning y las áreas suelen incluir electricidad, WiFi, duchas y hasta restaurantes.',
    keywords: ['stellplatz alemania', 'áreas autocaravanas alemania', 'baviera autocaravana', 'selva negra camper'],
    region: 'europa',
    emoji: '🇩🇪',
    lat: 51.1657,
    lng: 10.4515,
    consejos: [
      'Los Stellplatz son muy organizados y limpios, respeta las normas',
      'Descarga la app "Stellplatz-Radar" para encontrar las mejores áreas',
      'Baviera y la Ruta Romántica son imprescindibles en otoño',
      'La costa del Báltico es perfecta en verano (junio-agosto)',
      'Muchas bodegas en el valle del Rin ofrecen pernocta con cata de vinos'
    ],
    regulaciones: 'Sistema de Stellplatz muy regulado. Pernocta permitida solo en áreas designadas. Prohibido acampar fuera de ellas.'
  },

  'paises-bajos': {
    nombre: 'Países Bajos',
    slug: 'paises-bajos',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-paises-bajos',
    titulo: 'Mapa de Áreas de Autocaravanas en Países Bajos',
    metaTitle: 'Mapa Áreas Autocaravanas Países Bajos 2024 | Holanda',
    metaDescription: 'Áreas de autocaravanas en Holanda: Ámsterdam, Rotterdam, tulipanes y molinos. Ubicaciones con servicios completos.',
    descripcion: 'Los Países Bajos ofrecen una experiencia única para autocaravanas con sus paisajes de molinos, campos de tulipanes y canales. Aunque es un país pequeño, cuenta con numerosas áreas bien equipadas cerca de ciudades como Ámsterdam, Rotterdam y Utrecht. La infraestructura ciclista es perfecta para moverse desde tu autocaravana. Las áreas suelen ser limpias y modernas, con precios de 15-25€/noche.',
    keywords: ['camperplaats nederland', 'áreas autocaravanas holanda', 'amsterdam autocaravana', 'tulipanes holanda camper'],
    region: 'europa',
    emoji: '🇳🇱',
    lat: 52.1326,
    lng: 5.2913,
    consejos: [
      'Visita los campos de tulipanes en abril-mayo, espectáculo único',
      'Ámsterdam es cara, mejor pernoctar en las afueras y usar transporte público',
      'Alquila bicicletas para moverte, el país es totalmente plano',
      'Las áreas cerca de la playa (Zelanda) son populares en verano',
      'Prueba los mercados de quesos en Edam y Gouda'
    ],
    regulaciones: 'Pernocta permitida solo en camperplaats designados. Prohibido el estacionamiento nocturno en ciudades.'
  },

  'belgica': {
    nombre: 'Bélgica',
    slug: 'belgica',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-belgica',
    titulo: 'Mapa de Áreas de Autocaravanas en Bélgica',
    metaTitle: 'Mapa Áreas Autocaravanas Bélgica 2024 | Bruselas',
    metaDescription: 'Áreas de autocaravanas en Bélgica: Bruselas, Brujas, costa flamenca. Servicios completos y ubicaciones estratégicas.',
    descripcion: 'Bélgica es un destino compacto perfecto para autocaravanas, con ciudades históricas como Brujas, Gante y Bruselas, además de la costa flamenca. Las áreas belgas son funcionales y bien ubicadas, con precios moderados (10-20€). El país es ideal como punto de conexión entre Francia, Países Bajos y Alemania. No te pierdas las cervecerías trapenses y el chocolate belga.',
    keywords: ['camperplaatsen belgië', 'áreas autocaravanas bélgica', 'brujas autocaravana', 'bruselas camper'],
    region: 'europa',
    emoji: '🇧🇪',
    lat: 50.5039,
    lng: 4.4699,
    consejos: [
      'Brujas es imprescindible, pero muy turística en verano',
      'Bruselas tiene áreas urbanas cerca del centro europeo',
      'La costa flamenca (De Panne, Ostende) es agradable fuera de temporada alta',
      'Prueba las cervezas trapenses en abadías como Chimay y Orval',
      'Las áreas suelen tener límite de 48-72h de estancia'
    ],
    regulaciones: 'Pernocta permitida en áreas designadas con límite de tiempo. Prohibido acampar en calles y parkings públicos.'
  },

  'suiza': {
    nombre: 'Suiza',
    slug: 'suiza',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-suiza',
    titulo: 'Mapa de Áreas de Autocaravanas en Suiza',
    metaTitle: 'Mapa Áreas Autocaravanas Suiza 2024 | Alpes Suizos',
    metaDescription: 'Áreas de autocaravanas en Suiza: Alpes, lagos alpinos, Interlaken. Paisajes de montaña con servicios premium.',
    descripcion: 'Suiza ofrece algunos de los paisajes más espectaculares de Europa para viajar en autocaravana. Los Alpes Suizos, lagos como el Lemán, Lucerna y Ginebra, y pueblos alpinos como Interlaken y Zermatt son destinos de ensueño. Las áreas suizas son caras (20-40€/noche) pero impecables, con servicios premium. La viñeta anual obligatoria cuesta 40 CHF para circular por autopistas.',
    keywords: ['stellplatz schweiz', 'áreas autocaravanas suiza', 'alpes suizos camper', 'interlaken autocaravana'],
    region: 'europa',
    emoji: '🇨🇭',
    lat: 46.8182,
    lng: 8.2275,
    consejos: [
      'Compra la viñeta de autopistas (40 CHF) nada más entrar al país',
      'Interlaken y Lauterbrunnen son imprescindibles para montaña',
      'Los lagos alpinos son perfectos en verano (julio-agosto)',
      'Suiza es muy cara, lleva provisiones desde otros países',
      'Muchos puertos de montaña cierran en invierno (noviembre-abril)'
    ],
    regulaciones: 'Pernocta permitida solo en áreas habilitadas. Acampada libre prohibida. Necesaria viñeta para autopistas.'
  },

  'austria': {
    nombre: 'Austria',
    slug: 'austria',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-austria',
    titulo: 'Mapa de Áreas de Autocaravanas en Austria',
    metaTitle: 'Mapa Áreas Autocaravanas Austria 2024 | Tirol y Lagos',
    metaDescription: 'Áreas de autocaravanas en Austria: Tirol, Salzburgo, lagos alpinos. Paisajes de montaña con servicios completos.',
    descripcion: 'Austria combina cultura imperial, Alpes espectaculares y lagos cristalinos. Viena, Salzburgo, Innsbruck y el Tirol son destinos imperdibles. Las áreas austriacas son limpias y bien equipadas (15-30€/noche). La ruta de los lagos en Salzkammergut y la carretera alpina del Grossglockner son experiencias únicas. También necesitarás viñeta para autopistas (9,60€ para 10 días).',
    keywords: ['stellplatz österreich', 'áreas autocaravanas austria', 'tirol autocaravana', 'salzburgo camper'],
    region: 'europa',
    emoji: '🇦🇹',
    lat: 47.5162,
    lng: 14.5501,
    consejos: [
      'Compra la viñeta digital de autopistas online antes de llegar',
      'La Grossglockner Hochalpenstrasse es impresionante (peaje 38€)',
      'Salzkammergut (región de lagos) es perfecta en verano',
      'Innsbruck y Tirol son ideales para deportes de invierno',
      'Viena tiene áreas urbanas bien conectadas con transporte público'
    ],
    regulaciones: 'Pernocta permitida en áreas designadas. Obligatoria viñeta para autopistas. Acampada libre prohibida.'
  },

  'noruega': {
    nombre: 'Noruega',
    slug: 'noruega',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-noruega',
    titulo: 'Mapa de Áreas de Autocaravanas en Noruega',
    metaTitle: 'Mapa Áreas Autocaravanas Noruega 2024 | Fiordos',
    metaDescription: 'Áreas de autocaravanas en Noruega: fiordos, Lofoten, aurora boreal. Paisajes naturales únicos en Europa.',
    descripcion: 'Noruega es un destino épico para autocaravanas, con fiordos impresionantes, montañas escarpadas, glaciares y las Islas Lofoten. La ruta del Atlántico, Trollstigen y Geirangerfjord son imprescindibles. Noruega es muy cara (gasolina, comida, peajes) pero permite acampada libre con el "derecho de acceso" (allemannsretten). Las áreas oficiales son escasas pero bien equipadas (20-35€).',
    keywords: ['bobil norge', 'áreas autocaravanas noruega', 'fiordos noruega camper', 'lofoten autocaravana'],
    region: 'europa',
    emoji: '🇳🇴',
    lat: 60.4720,
    lng: 8.4689,
    consejos: [
      'Mejor época: junio-agosto (sol de medianoche) o febrero-marzo (aurora boreal)',
      'La gasolina es carísima, calcula bien tu presupuesto',
      'Allemannsretten permite acampar gratis en naturaleza (lejos de casas)',
      'Los fiordos Geiranger y Nærøyfjord son Patrimonio de la UNESCO',
      'Las Islas Lofoten son mágicas pero remotas, lleva provisiones'
    ],
    regulaciones: 'Allemannsretten permite acampada libre en naturaleza. Respeta el medio ambiente y mantén distancia de viviendas.'
  },

  'suecia': {
    nombre: 'Suecia',
    slug: 'suecia',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-suecia',
    titulo: 'Mapa de Áreas de Autocaravanas en Suecia',
    metaTitle: 'Mapa Áreas Autocaravanas Suecia 2024 | Laponia',
    metaDescription: 'Áreas de autocaravanas en Suecia: Estocolmo, Laponia, costa oeste. Naturaleza virgen y aurora boreal.',
    descripcion: 'Suecia ofrece naturaleza virgen, miles de lagos, bosques infinitos y la mágica Laponia. Estocolmo, Gotemburgo y la costa oeste son perfectas en verano. El "Allemansrätten" (derecho de acceso) permite acampar libremente en naturaleza. Las áreas oficiales son funcionales (15-30€). La ruta hasta el Cabo Norte atravesando Laponia es una aventura inolvidable.',
    keywords: ['husbilsplatser sverige', 'áreas autocaravanas suecia', 'laponia autocaravana', 'estocolmo camper'],
    region: 'europa',
    emoji: '🇸🇪',
    lat: 60.1282,
    lng: 18.6435,
    consejos: [
      'Mejor época: junio-agosto (días largos) o invierno para aurora boreal',
      'Allemansrätten permite acampada libre responsable en naturaleza',
      'Estocolmo tiene áreas bien conectadas con transporte público',
      'Laponia en invierno requiere preparación para frío extremo (-20°C)',
      'Los mosquitos en verano (julio-agosto) en el norte son intensos'
    ],
    regulaciones: 'Allemansrätten permite acampada libre en naturaleza. Prohibido acampar en propiedades privadas o áreas protegidas.'
  },

  'dinamarca': {
    nombre: 'Dinamarca',
    slug: 'dinamarca',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-dinamarca',
    titulo: 'Mapa de Áreas de Autocaravanas en Dinamarca',
    metaTitle: 'Mapa Áreas Autocaravanas Dinamarca 2024 | Copenhague',
    metaDescription: 'Áreas de autocaravanas en Dinamarca: Copenhague, costa oeste, Legoland. País compacto ideal para autocaravanas.',
    descripcion: 'Dinamarca es un país pequeño y plano, perfecto para viajar en autocaravana. Copenhague, las playas de la costa oeste de Jutlandia, Legoland en Billund y el puente de Øresund hacia Suecia son destacados. Las áreas danesas son limpias y organizadas (15-25€). El país es ciclista-friendly, ideal para moverse desde tu autocaravana.',
    keywords: ['campingpladser danmark', 'áreas autocaravanas dinamarca', 'copenhague autocaravana', 'jutlandia camper'],
    region: 'europa',
    emoji: '🇩🇰',
    lat: 56.2639,
    lng: 9.5018,
    consejos: [
      'Copenhague tiene áreas urbanas cerca del centro',
      'La costa oeste de Jutlandia tiene playas vírgenes y menos turistas',
      'Legoland es imprescindible si viajas con niños',
      'Alquila bicicletas, el país es totalmente plano',
      'El puente de Øresund hacia Suecia tiene peaje (54€ ida y vuelta)'
    ],
    regulaciones: 'Pernocta permitida solo en áreas oficiales. Acampada libre prohibida excepto en campings autorizados.'
  },

  'luxemburgo': {
    nombre: 'Luxemburgo',
    slug: 'luxemburgo',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-luxemburgo',
    titulo: 'Mapa de Áreas de Autocaravanas en Luxemburgo',
    metaTitle: 'Mapa Áreas Autocaravanas Luxemburgo 2024 | Ciudad',
    metaDescription: 'Áreas de autocaravanas en Luxemburgo: capital europea, valle del Mosela, castillos medievales.',
    descripcion: 'Luxemburgo es un país pequeño pero encantador, con una capital Patrimonio de la UNESCO, el valle del Mosela con sus viñedos y castillos medievales. Las áreas son escasas pero funcionales (10-20€). Perfecto como parada entre Francia, Alemania y Bélgica. El transporte público es gratuito en todo el país.',
    keywords: ['aires camping-car luxembourg', 'áreas autocaravanas luxemburgo', 'ciudad luxemburgo camper'],
    region: 'europa',
    emoji: '🇱🇺',
    lat: 49.8153,
    lng: 6.1296,
    consejos: [
      'La ciudad de Luxemburgo es pequeña pero hermosa, dedícale 1-2 días',
      'El valle del Mosela tiene bodegas que ofrecen catas de vino',
      'El transporte público es 100% gratuito en todo el país',
      'Mejor como parada de paso entre otros destinos',
      'Los castillos de Vianden y Beaufort son imprescindibles'
    ],
    regulaciones: 'Pernocta permitida en áreas designadas. Acampada libre prohibida.'
  },

  'andorra': {
    nombre: 'Andorra',
    slug: 'andorra',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-andorra',
    titulo: 'Mapa de Áreas de Autocaravanas en Andorra',
    metaTitle: 'Mapa Áreas Autocaravanas Andorra 2024 | Pirineos',
    metaDescription: 'Áreas de autocaravanas en Andorra: Pirineos, estaciones de esquí, compras libres de impuestos.',
    descripcion: 'Andorra es un pequeño principado en los Pirineos, famoso por sus estaciones de esquí (Grandvalira, Vallnord), compras libres de impuestos y paisajes de montaña. Las áreas son limitadas (5-10) pero estratégicas cerca de las estaciones. Los precios son moderados (15-25€). Perfecto para esquiar en invierno o hacer senderismo en verano.',
    keywords: ['àrees autocaravanes andorra', 'autocaravanas andorra', 'esquí andorra camper', 'pirineos autocaravana'],
    region: 'europa',
    emoji: '🇦🇩',
    lat: 42.5063,
    lng: 1.5218,
    consejos: [
      'Ideal para esquiar en Grandvalira o Vallnord (diciembre-marzo)',
      'Compras libres de impuestos en tabaco, alcohol y electrónica',
      'El país es muy montañoso, usa marchas cortas y frenos',
      'En verano hay excelentes rutas de senderismo',
      'Las áreas se saturan en temporada de esquí, llega temprano'
    ],
    regulaciones: 'Pernocta permitida solo en áreas habilitadas. Acampada libre prohibida en todo el territorio.'
  },

  'eslovenia': {
    nombre: 'Eslovenia',
    slug: 'eslovenia',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-eslovenia',
    titulo: 'Mapa de Áreas de Autocaravanas en Eslovenia',
    metaTitle: 'Mapa Áreas Autocaravanas Eslovenia 2024 | Bled',
    metaDescription: 'Áreas de autocaravanas en Eslovenia: Lago Bled, Ljubljana, cuevas de Postojna. Alpes Julianos.',
    descripcion: 'Eslovenia es una joya escondida de Europa, con el icónico Lago Bled, la capital Ljubljana, las cuevas de Postojna y los Alpes Julianos. Las áreas son económicas (10-20€) y bien distribuidas. El país es compacto, puedes recorrerlo en una semana. La viñeta de autopistas es obligatoria (15€ semanal).',
    keywords: ['kamping mesta slovenija', 'áreas autocaravanas eslovenia', 'lago bled autocaravana', 'ljubljana camper'],
    region: 'europa',
    emoji: '🇸🇮',
    lat: 46.1512,
    lng: 14.9955,
    consejos: [
      'El Lago Bled es el lugar más fotogénico de Europa',
      'Ljubljana es una capital pequeña y encantadora',
      'Las cuevas de Postojna y el castillo de Predjama son impresionantes',
      'Compra la viñeta de autopistas online (15€ semanal)',
      'El país es muy verde y montañoso, perfecto para naturaleza'
    ],
    regulaciones: 'Obligatoria viñeta para autopistas. Pernocta permitida en áreas designadas. Acampada libre prohibida.'
  },

  'chequia': {
    nombre: 'Chequia',
    slug: 'chequia',
    terminologia: 'autocaravanas',
    urlSlug: '/mapa-autocaravanas-chequia',
    titulo: 'Mapa de Áreas de Autocaravanas en Chequia (República Checa)',
    metaTitle: 'Mapa Áreas Autocaravanas Chequia 2024 | Praga',
    metaDescription: 'Áreas de autocaravanas en República Checa: Praga, Český Krumlov, cervecerías, castillos medievales.',
    descripcion: 'Chequia (República Checa) ofrece Praga, una de las ciudades más hermosas de Europa, junto con pueblos medievales como Český Krumlov, castillos impresionantes y la mejor cerveza del mundo. Las áreas son económicas (8-18€) comparadas con Europa Occidental. La viñeta de autopistas es necesaria (14€ para 10 días).',
    keywords: ['kempy česko', 'áreas autocaravanas chequia', 'praga autocaravana', 'český krumlov camper'],
    region: 'europa',
    emoji: '🇨🇿',
    lat: 49.8175,
    lng: 15.4730,
    consejos: [
      'Praga tiene áreas cerca del centro, evita el coche en la ciudad',
      'Český Krumlov es Patrimonio de la UNESCO, imprescindible',
      'Visita cervecerías como Pilsner Urquell en Plzeň',
      'Los castillos de Karlštejn y Hluboká son espectaculares',
      'El país es muy económico comparado con Europa Occidental'
    ],
    regulaciones: 'Obligatoria viñeta para autopistas. Pernocta en áreas designadas. Respeta señales locales.'
  },

  // ============================================================================
  // 🌎 SUDAMÉRICA (3 países) - Usar "casas rodantes"
  // ============================================================================

  'argentina': {
    nombre: 'Argentina',
    slug: 'argentina',
    terminologia: 'casas rodantes',
    urlSlug: '/mapa-casas-rodantes-argentina',
    titulo: 'Mapa de Áreas para Casas Rodantes en Argentina',
    metaTitle: 'Mapa Áreas Casas Rodantes Argentina 2024 | Patagonia',
    metaDescription: 'Descubre áreas para casas rodantes en Argentina: Patagonia, Ruta 40, Bariloche, Mendoza. Aventura en Sudamérica.',
    descripcion: 'Argentina es el destino más desarrollado de Sudamérica para casas rodantes, con la legendaria Ruta 40 que atraviesa el país de norte a sur. Desde la Patagonia con glaciares y lagos hasta Mendoza con viñedos, Bariloche, Ushuaia y las Cataratas del Iguazú. Las áreas varían de gratuitas a 15 USD/noche. La cultura del caravaning está en crecimiento con infraestructura cada vez mejor.',
    keywords: ['áreas casas rodantes argentina', 'ruta 40 motorhome', 'patagonia casa rodante', 'bariloche camping'],
    region: 'sudamerica',
    emoji: '🇦🇷',
    lat: -38.4161,
    lng: -63.6167,
    consejos: [
      'La Ruta 40 es épica, planifica bien las distancias (hay tramos sin servicios)',
      'Patagonia es mejor entre noviembre y marzo (primavera-verano)',
      'Bariloche y Villa La Angostura tienen excelente infraestructura',
      'El viento en la Patagonia es muy fuerte, asegura bien todo',
      'Ushuaia es el fin del mundo, experiencia única pero remota'
    ],
    regulaciones: 'Pernocta permitida en campings y algunas áreas municipales. La acampada libre es tolerada en zonas rurales alejadas.'
  },

  'chile': {
    nombre: 'Chile',
    slug: 'chile',
    terminologia: 'casas rodantes',
    urlSlug: '/mapa-casas-rodantes-chile',
    titulo: 'Mapa de Áreas para Casas Rodantes en Chile',
    metaTitle: 'Mapa Áreas Casas Rodantes Chile 2024 | Carretera Austral',
    metaDescription: 'Áreas para casas rodantes en Chile: Carretera Austral, Atacama, Lagos, Torres del Paine. Aventura extrema.',
    descripcion: 'Chile ofrece contrastes increíbles desde el desierto de Atacama hasta la Patagonia chilena. La Carretera Austral es una de las rutas más espectaculares del mundo, con glaciares, fiordos y bosques vírgenes. Santiago, Valparaíso, la región de los Lagos y el Parque Torres del Paine son imperdibles. Las áreas varían de gratuitas a 20 USD/noche.',
    keywords: ['áreas casas rodantes chile', 'carretera austral motorhome', 'torres del paine casa rodante', 'atacama camping'],
    region: 'sudamerica',
    emoji: '🇨🇱',
    lat: -35.6751,
    lng: -71.5430,
    consejos: [
      'La Carretera Austral requiere preparación, hay tramos sin servicios',
      'Torres del Paine es espectacular pero reserva campings con antelación',
      'El desierto de Atacama tiene temperaturas extremas (día 30°C, noche 0°C)',
      'Los lagos del sur (Pucón, Villarrica) son hermosos en verano',
      'Valparaíso es único pero complicado para vehículos grandes'
    ],
    regulaciones: 'Pernocta en campings oficiales y áreas municipales. Acampada libre tolerada en zonas rurales con permisos.'
  },

  'uruguay': {
    nombre: 'Uruguay',
    slug: 'uruguay',
    terminologia: 'casas rodantes',
    urlSlug: '/mapa-casas-rodantes-uruguay',
    titulo: 'Mapa de Áreas para Casas Rodantes en Uruguay',
    metaTitle: 'Mapa Áreas Casas Rodantes Uruguay 2024 | Punta del Este',
    metaDescription: 'Áreas para casas rodantes en Uruguay: Punta del Este, Colonia, Rocha, Cabo Polonio. Costa atlántica.',
    descripcion: 'Uruguay es un país pequeño y tranquilo, perfecto para iniciarse en el caravaning sudamericano. Punta del Este, Colonia del Sacramento (Patrimonio UNESCO), Cabo Polonio y las playas de Rocha son destinos destacados. Las áreas son económicas (5-15 USD) y el país es muy seguro. La Ruta del Vino en Carmelo ofrece bodegas y paisajes rurales.',
    keywords: ['áreas casas rodantes uruguay', 'punta del este motorhome', 'cabo polonio casa rodante', 'colonia camping'],
    region: 'sudamerica',
    emoji: '🇺🇾',
    lat: -32.5228,
    lng: -55.7658,
    consejos: [
      'Uruguay es el país más seguro y tranquilo de Sudamérica',
      'Punta del Este es cara en verano (enero-febrero), visita fuera de temporada',
      'Cabo Polonio no tiene electricidad, experiencia única off-grid',
      'Colonia del Sacramento es hermosa y muy cerca de Buenos Aires',
      'La Ruta del Vino en Carmelo tiene bodegas con pernocta'
    ],
    regulaciones: 'Pernocta permitida en campings y áreas habilitadas. País muy organizado y con buena infraestructura turística.'
  },

  // ============================================================================
  // 🌎 NORTEAMÉRICA — Usar "casas rodantes" / trailer / RV park
  // ============================================================================

  'mexico': {
    nombre: 'México',
    slug: 'mexico',
    terminologia: 'casas rodantes',
    urlSlug: '/mapa-casas-rodantes-mexico',
    titulo: 'Mapa de Áreas para Casas Rodantes en México',
    metaTitle: 'Mapa Trailer Parks y RV Parks México | Baja y Pacífico',
    metaDescription: 'Descubre trailer parks y RV parks en México: Baja California, Jalisco, Sonora, Nayarit, Yucatán. Mapa con cientos de ubicaciones.',
    descripcion: 'México es el gran destino de casas rodantes y RV de Latinoamérica, impulsado por snowbirds de EE.UU. y Canadá y por el auge del vanlife. En lugar de «áreas de autocaravana» europeas, el país habla de trailer parks, RV parks y parques de casas rodantes. La península de Baja California, la costa del Pacífico (Sonora, Sinaloa, Nayarit, Jalisco) y la península de Yucatán concentran la mayor oferta, con hookups, dump stations y campos de playa. Temporada alta de noviembre a abril.',
    keywords: [
      'trailer park méxico',
      'rv park méxico',
      'casas rodantes méxico',
      'camping baja california',
      'mapa rv mexico'
    ],
    region: 'norteamerica',
    emoji: '🇲🇽',
    lat: 23.6345,
    lng: -102.5528,
    consejos: [
      'En México se buscan «trailer park» o «RV park», no «área de autocaravana»',
      'Baja California es el corredor RV más maduro; temporada nov–abr',
      'Contrata seguro de auto mexicano: las pólizas de EE.UU. no valen',
      'Muchos parques prefieren efectivo o WhatsApp; pocos tienen web',
      'Puerto Peñasco, Mazatlán, Vallarta, Melaque y San Felipe son clásicos snowbird'
    ],
    regulaciones: 'Pernocta habitual en trailer/RV parks y campamentos privados. La acampada libre (wild) es frecuente en playas de Baja pero no siempre está regulada: verifica normas locales y seguridad.'
  }
}

// Lista de todos los slugs para generación de rutas
export const PAISES_SLUGS = Object.keys(PAISES_SEO_CONFIG)

// Función helper para obtener país por slug
export function getPaisBySLug(slug: string): PaisSEO | undefined {
  return PAISES_SEO_CONFIG[slug]
}

// Exportar lista ordenada por región
export const PAISES_EUROPA = Object.values(PAISES_SEO_CONFIG).filter(p => p.region === 'europa')
export const PAISES_SUDAMERICA = Object.values(PAISES_SEO_CONFIG).filter(p => p.region === 'sudamerica')
export const PAISES_NORTEAMERICA = Object.values(PAISES_SEO_CONFIG).filter(p => p.region === 'norteamerica')



