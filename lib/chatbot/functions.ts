/**
 * FUNCIONES DE CONSULTA PARA EL CHATBOT
 * =====================================
 * Funciones que el chatbot puede llamar mediante Function Calling
 * para consultar la base de datos de áreas
 */

import { createClient } from '@supabase/supabase-js'
import { esPreguntaAreaConcreta } from '@/lib/chatbot/intencion'

// Cliente de Supabase con service role para acceso completo
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Configuración de Supabase incompleta en el servidor')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

// ============================================
// TIPOS
// ============================================

export interface BusquedaAreasParams {
  ubicacion?: {
    lat?: number
    lng?: number
    nombre?: string
    radio_km?: number
    /** Origen de distancia_km: "desde tu ubicación" o "desde el centro de Cuenca". */
    etiqueta_distancia?: string
  }
  servicios?: string[]
  precio_max?: number
  solo_gratuitas?: boolean
  tipo_area?: 'publica' | 'privada' | 'camping'
  /** Si el usuario dice "camping no" / "sin camping". */
  excluir_camping?: boolean
  pais?: string
  valoracion_minima?: number
}

export interface AreaResumen {
  id: string
  nombre: string
  slug: string
  ciudad: string
  provincia: string
  pais: string
  latitud: number
  longitud: number
  distancia_km?: number
  /** Texto de la distancia: "desde tu ubicación" / "desde el centro de Cuenca". */
  distancia_desde?: string
  precio_noche: number | null
  servicios: Record<string, boolean>
  tipo_area: string
  google_rating: number | null
  /** Nº de valoraciones Google (user_ratings_total). Null = desconocido. */
  google_ratings_total?: number | null
  plazas_totales: number | null
  google_maps_url: string | null
  fotos_urls: string[]
  foto_principal?: string | null
}

/** Media global aproximada de la plataforma (priors bayesianos). */
const RATING_PRIOR_MEAN = 4.2
/** Cuántas reseñas “imaginarias” aporta el prior (más = más exigente con volumen). */
const RATING_PRIOR_WEIGHT = 15

/** Mínimo de reseñas para considerar un área en rankings "mejores/top". */
const MIN_REVIEWS_TOP = 10
/** Fallback si no hay suficientes candidatas con MIN_REVIEWS_TOP. */
const MIN_REVIEWS_FALLBACK = 3

/** Nombres que no son áreas de pernocta (alquileres, talleres, camperización…). */
const NOMBRE_BASURA_RE =
  /\b(rent|rental|alquiler|hire|vermietung|location de|autovermietung|car hire|campervan rent|rent a|noleggio|verhuur|camperizaci[oó]n|taller de|workshop|go caravan|survan camper|autocaravana rent)\b/i

const SERVICIOS_NOMBRES: Record<string, string> = {
  agua: 'Agua',
  electricidad: 'Electricidad',
  wifi: 'WiFi',
  duchas: 'Duchas',
  wc: 'WC',
  zona_mascotas: 'Mascotas',
  vaciado_aguas_grises: 'Vaciado grises',
  vaciado_aguas_negras: 'Vaciado negras',
  lavanderia: 'Lavandería',
  restaurante: 'Restaurante',
  supermercado: 'Supermercado',
}

/**
 * Score bayesiano: combina nota y nº de reseñas.
 * Sin reseñas conocidas (null/0) cae hacia la media → un ★5 con 2 votos
 * no gana a un ★4.6 con 80.
 */
export function scoreValoracionPonderada(
  rating: number | null | undefined,
  reviews: number | null | undefined
): number {
  if (rating == null || rating <= 0) return 0
  const n = Math.max(0, Number(reviews) || 0)
  return (RATING_PRIOR_WEIGHT * RATING_PRIOR_MEAN + n * rating) / (RATING_PRIOR_WEIGHT + n)
}

function contarServicios(servicios: Record<string, boolean> | null | undefined): number {
  if (!servicios || typeof servicios !== 'object') return 0
  return Object.values(servicios).filter((v) => v === true).length
}

/** Idiomas de ficha. Misma heurística que Andrea (Furgocasa) + palabras de viaje. */
export type ChatLocale = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt'

/**
 * Detección por palabras frecuentes. Portada de
 * furgocasa-app/src/lib/chatbot/server.ts (`detectLanguage`).
 * Si no hay señales, devuelve null (no fuerza español).
 */
export function detectLanguage(text: string): ChatLocale | null {
  const t = ` ${text.toLowerCase()} `
  const score: Record<ChatLocale, number> = { es: 0, en: 0, fr: 0, de: 0, it: 0, pt: 0 }
  const dict: Record<ChatLocale, string[]> = {
    es: [' el ', ' la ', ' que ', ' de ', ' hola ', ' gracias ', ' como ', ' donde ', ' cuanto ', ' precio ', ' areas ', ' cerca ', ' voy ', ' mejores '],
    en: [' the ', ' and ', ' what ', ' how ', ' hello ', ' thanks ', ' where ', ' price ', ' is ', ' you ', ' best ', ' areas ', ' area ', ' with ', ' stop ', ' near ', ' free '],
    fr: [' le ', ' la ', ' bonjour ', ' merci ', ' comment ', ' ou ', ' prix ', ' est ', ' vous ', ' je ', ' aires ', ' pres '],
    de: [' der ', ' die ', ' das ', ' hallo ', ' danke ', ' wie ', ' wo ', ' preis ', ' ich ', ' und ', ' stellplatz ', ' zwischen '],
    it: [' il ', ' la ', ' ciao ', ' grazie ', ' come ', ' dove ', ' prezzo ', ' che ', ' sono ', ' per ', ' sosta '],
    pt: [' o ', ' a ', ' ola ', ' obrigado ', ' como ', ' onde ', ' preco ', ' que ', ' voce ', ' sim '],
  }
  for (const [lang, words] of Object.entries(dict) as [ChatLocale, string[]][]) {
    for (const w of words) {
      if (t.includes(w)) score[lang]++
    }
  }
  let best: ChatLocale | null = null
  let bestScore = 0
  for (const [lang, s] of Object.entries(score) as [ChatLocale, number][]) {
    if (s > bestScore) {
      best = lang
      bestScore = s
    }
  }
  return bestScore > 0 ? best : null
}

/** Último mensaje del cliente; si es corto, el hilo; si no, el idioma de la web. */
export function resolveChatLocale(opts: {
  pageLocale?: string | null
  lastUserText?: string | null
  previousUserTexts?: string[]
}): ChatLocale {
  const page = String(opts.pageLocale || '').toLowerCase().split(/[-_]/)[0]
  const pageOk = (['es', 'en', 'fr', 'de', 'it', 'pt'] as const).includes(page as ChatLocale)
    ? (page as ChatLocale)
    : null

  const last = (opts.lastUserText || '').trim()
  if (last.length > 12) {
    const detected = detectLanguage(last)
    if (detected) return detected
  }
  const previos = (opts.previousUserTexts || [])
    .map((s) => String(s || '').trim())
    .filter((s) => s.length > 12)
  for (let i = previos.length - 1; i >= 0; i--) {
    const detected = detectLanguage(previos[i])
    if (detected) return detected
  }
  return pageOk || 'es'
}

const FICHA_I18N: Record<ChatLocale, {
  priceUnknown: string
  free: string
  perNight: string
  services: string
  reviews: string
  spots: string
  fromYou: string
  fromCenter: (city: string) => string
  away: string
  detour: string
  locationUnknown: string
  typePublica: string
  typePrivada: string
  typeCamping: string
}> = {
  es: {
    priceUnknown: 'Precio no disponible',
    free: 'Gratis',
    perNight: '€/noche',
    services: 'Servicios',
    reviews: 'valoraciones',
    spots: 'plazas',
    fromYou: 'desde tu ubicación',
    fromCenter: (c) => `desde el centro de ${c}`,
    away: 'de distancia',
    detour: 'km de desvío',
    locationUnknown: 'Ubicación no disponible',
    typePublica: 'Área pública',
    typePrivada: 'Área privada',
    typeCamping: 'Camping',
  },
  en: {
    priceUnknown: 'Price not available',
    free: 'Free',
    perNight: '€/night',
    services: 'Services',
    reviews: 'reviews',
    spots: 'pitches',
    fromYou: 'from your location',
    fromCenter: (c) => `from the centre of ${c}`,
    away: 'away',
    detour: 'km detour',
    locationUnknown: 'Location not available',
    typePublica: 'Public area',
    typePrivada: 'Private area',
    typeCamping: 'Campsite',
  },
  fr: {
    priceUnknown: 'Prix non disponible',
    free: 'Gratuit',
    perNight: '€/nuit',
    services: 'Services',
    reviews: 'avis',
    spots: 'emplacements',
    fromYou: 'depuis votre position',
    fromCenter: (c) => `depuis le centre de ${c}`,
    away: 'de distance',
    detour: 'km de détour',
    locationUnknown: 'Lieu non disponible',
    typePublica: 'Aire publique',
    typePrivada: 'Aire privée',
    typeCamping: 'Camping',
  },
  de: {
    priceUnknown: 'Preis nicht verfügbar',
    free: 'Kostenlos',
    perNight: '€/Nacht',
    services: 'Services',
    reviews: 'Bewertungen',
    spots: 'Stellplätze',
    fromYou: 'von deinem Standort',
    fromCenter: (c) => `vom Zentrum von ${c}`,
    away: 'entfernt',
    detour: 'km Umweg',
    locationUnknown: 'Ort nicht verfügbar',
    typePublica: 'Öffentlicher Platz',
    typePrivada: 'Privater Platz',
    typeCamping: 'Campingplatz',
  },
  it: {
    priceUnknown: 'Prezzo non disponibile',
    free: 'Gratis',
    perNight: '€/notte',
    services: 'Servizi',
    reviews: 'recensioni',
    spots: 'posti',
    fromYou: 'dalla tua posizione',
    fromCenter: (c) => `dal centro di ${c}`,
    away: 'di distanza',
    detour: 'km di deviazione',
    locationUnknown: 'Posizione non disponibile',
    typePublica: 'Area pubblica',
    typePrivada: 'Area privata',
    typeCamping: 'Campeggio',
  },
  pt: {
    priceUnknown: 'Preço não disponível',
    free: 'Grátis',
    perNight: '€/noite',
    services: 'Serviços',
    reviews: 'avaliações',
    spots: 'lugares',
    fromYou: 'da tua localização',
    fromCenter: (c) => `do centro de ${c}`,
    away: 'de distância',
    detour: 'km de desvio',
    locationUnknown: 'Localização não disponível',
    typePublica: 'Área pública',
    typePrivada: 'Área privada',
    typeCamping: 'Camping',
  },
}

function etiquetaTipoArea(tipo: string | undefined, locale: ChatLocale): string | null {
  const L = FICHA_I18N[locale] || FICHA_I18N.es
  if (tipo === 'publica') return L.typePublica
  if (tipo === 'privada') return L.typePrivada
  if (tipo === 'camping') return L.typeCamping
  return null
}

const SERVICIOS_I18N: Record<ChatLocale, Record<string, string>> = {
  es: SERVICIOS_NOMBRES,
  en: {
    agua: 'Water', electricidad: 'Electricity', wifi: 'WiFi', duchas: 'Showers', wc: 'WC',
    zona_mascotas: 'Pets', vaciado_aguas_grises: 'Grey water dump', vaciado_aguas_negras: 'Black water dump',
    lavanderia: 'Laundry', restaurante: 'Restaurant', supermercado: 'Supermarket',
  },
  fr: {
    agua: 'Eau', electricidad: 'Électricité', wifi: 'WiFi', duchas: 'Douches', wc: 'WC',
    zona_mascotas: 'Animaux', vaciado_aguas_grises: 'Eaux grises', vaciado_aguas_negras: 'Eaux noires',
    lavanderia: 'Buanderie', restaurante: 'Restaurant', supermercado: 'Supermarché',
  },
  de: {
    agua: 'Wasser', electricidad: 'Strom', wifi: 'WLAN', duchas: 'Duschen', wc: 'WC',
    zona_mascotas: 'Haustiere', vaciado_aguas_grises: 'Grauwasser', vaciado_aguas_negras: 'Schwarzwasser',
    lavanderia: 'Wäsche', restaurante: 'Restaurant', supermercado: 'Supermarkt',
  },
  it: {
    agua: 'Acqua', electricidad: 'Elettricità', wifi: 'WiFi', duchas: 'Docce', wc: 'WC',
    zona_mascotas: 'Animali', vaciado_aguas_grises: 'Acque grigie', vaciado_aguas_negras: 'Acque nere',
    lavanderia: 'Lavanderia', restaurante: 'Ristorante', supermercado: 'Supermercato',
  },
  pt: {
    agua: 'Água', electricidad: 'Eletricidade', wifi: 'WiFi', duchas: 'Duches', wc: 'WC',
    zona_mascotas: 'Animais', vaciado_aguas_grises: 'Águas cinzentas', vaciado_aguas_negras: 'Águas negras',
    lavanderia: 'Lavandaria', restaurante: 'Restaurante', supermercado: 'Supermercado',
  },
}

const PAIS_I18N: Record<string, Record<ChatLocale, string>> = {
  españa: { es: 'España', en: 'Spain', fr: 'Espagne', de: 'Spanien', it: 'Spagna', pt: 'Espanha' },
  spain: { es: 'España', en: 'Spain', fr: 'Espagne', de: 'Spanien', it: 'Spagna', pt: 'Espanha' },
  francia: { es: 'Francia', en: 'France', fr: 'France', de: 'Frankreich', it: 'Francia', pt: 'França' },
  france: { es: 'Francia', en: 'France', fr: 'France', de: 'Frankreich', it: 'Francia', pt: 'França' },
  portugal: { es: 'Portugal', en: 'Portugal', fr: 'Portugal', de: 'Portugal', it: 'Portogallo', pt: 'Portugal' },
  italia: { es: 'Italia', en: 'Italy', fr: 'Italie', de: 'Italien', it: 'Italia', pt: 'Itália' },
  italy: { es: 'Italia', en: 'Italy', fr: 'Italie', de: 'Italien', it: 'Italia', pt: 'Itália' },
  alemania: { es: 'Alemania', en: 'Germany', fr: 'Allemagne', de: 'Deutschland', it: 'Germania', pt: 'Alemanha' },
  germany: { es: 'Alemania', en: 'Germany', fr: 'Allemagne', de: 'Deutschland', it: 'Germania', pt: 'Alemanha' },
  méxico: { es: 'México', en: 'Mexico', fr: 'Mexique', de: 'Mexiko', it: 'Messico', pt: 'México' },
  mexico: { es: 'México', en: 'Mexico', fr: 'Mexique', de: 'Mexiko', it: 'Messico', pt: 'México' },
  'países bajos': { es: 'Países Bajos', en: 'Netherlands', fr: 'Pays-Bas', de: 'Niederlande', it: 'Paesi Bassi', pt: 'Países Baixos' },
  'paises bajos': { es: 'Países Bajos', en: 'Netherlands', fr: 'Pays-Bas', de: 'Niederlande', it: 'Paesi Bassi', pt: 'Países Baixos' },
  netherlands: { es: 'Países Bajos', en: 'Netherlands', fr: 'Pays-Bas', de: 'Niederlande', it: 'Paesi Bassi', pt: 'Países Baixos' },
}

function traducirPais(pais: string, locale: ChatLocale): string {
  const key = pais.trim().toLowerCase()
  return PAIS_I18N[key]?.[locale] || pais
}

function formatDistanciaDesde(raw: string | undefined, locale: ChatLocale): string {
  const L = FICHA_I18N[locale]
  if (!raw || raw === 'de distancia') return L.away
  if (/desde tu ubicaci[oó]n|from your location|depuis votre position|von deinem standort|dalla tua posizione|da tua localiza/i.test(raw)) {
    return L.fromYou
  }
  const m = raw.match(/desde el centro de (.+)/i)
    || raw.match(/from the centre of (.+)/i)
    || raw.match(/depuis le centre de (.+)/i)
    || raw.match(/vom zentrum von (.+)/i)
    || raw.match(/dal centro di (.+)/i)
    || raw.match(/do centro de (.+)/i)
  if (m) return L.fromCenter(m[1].trim())
  return raw
}

/** Lista legible de servicios en true (nunca muestra false ni el objeto crudo). */
export function formatServiciosLegibles(
  servicios: Record<string, boolean> | null | undefined,
  locale: ChatLocale = 'es'
): string {
  if (!servicios || typeof servicios !== 'object') return ''
  const nombres = SERVICIOS_I18N[locale] || SERVICIOS_NOMBRES
  return Object.entries(servicios)
    .filter(([, value]) => value === true)
    .map(([key]) => nombres[key] || SERVICIOS_NOMBRES[key] || key.replace(/_/g, ' '))
    .join(', ')
}

export function esNombreBasura(nombre: string | null | undefined): boolean {
  return !nombre || NOMBRE_BASURA_RE.test(nombre)
}

function limpiarAreasBasura<T extends { nombre?: string | null }>(areas: T[]): T[] {
  return areas.filter((a) => !esNombreBasura(a.nombre))
}

/** Null Island / GPS basura: no buscar “cerca de mí” en (0,0). */
export function esGpsValido(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  if (Math.abs(lat) < 0.5 && Math.abs(lng) < 0.5) return false
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false
  return true
}

function normalizarClave(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const ALIAS_UBICACION: Record<string, string> = {
  'gruta de massabielle': 'Lourdes, Francia',
  'grotte de massabielle': 'Lourdes, Francia',
  'massabielle': 'Lourdes, Francia',
  'santuario de lourdes': 'Lourdes, Francia',
  'bolemdam': 'Volendam, Países Bajos',
  'ajo': 'Ajo, Cantabria, España',
  'ajo cantabria': 'Ajo, Cantabria, España',
  'ajo, cantabria': 'Ajo, Cantabria, España',
}

function resolverAliasUbicacion(nombre: string): string {
  const clave = normalizarClave(nombre)
  if (ALIAS_UBICACION[clave]) return ALIAS_UBICACION[clave]

  const tokens = clave.split(/[^a-z0-9]+/).filter(Boolean)
  const hits = Object.keys(ALIAS_UBICACION)
    .filter((k) => {
      const partes = k.split(/[^a-z0-9]+/).filter(Boolean)
      if (partes.length === 1) return tokens.includes(partes[0])
      return clave.includes(k)
    })
    .sort((a, b) => b.length - a.length)

  return hits.length ? ALIAS_UBICACION[hits[0]] : nombre.trim()
}

const PAISES_NOMBRE_RE =
  /^(espana|spain|francia|france|portugal|italia|italy|alemania|germany|paises bajos|netherlands|holanda|reino unido|united kingdom|uk|mexico|argentina|chile|peru|marruecos|andorra|belgica|suiza|austria)$/i

function esNombrePais(nombre: string): boolean {
  return PAISES_NOMBRE_RE.test(normalizarClave(nombre))
}

function esPrecioGratis(precio: number | null | undefined): boolean {
  return precio === 0
}

/**
 * Ordena áreas para respuestas "mejores / top":
 * 1) score bayesiano (rating × volumen)
 * 2) nº de servicios
 * 3) tiene foto
 * Filtra alquileres / nombres basura y prioriza volumen mínimo de reseñas.
 */
export function rankMejoresAreas<T extends AreaResumen>(areas: T[], limit: number): T[] {
  const limpias = [...areas].filter((a) => !esNombreBasura(a.nombre))
  const conVolumen = limpias.filter((a) => (a.google_ratings_total || 0) >= MIN_REVIEWS_TOP)
  const conVolumenMin = limpias.filter((a) => (a.google_ratings_total || 0) >= MIN_REVIEWS_FALLBACK)
  const pool =
    conVolumen.length >= Math.min(limit, 5)
      ? conVolumen
      : conVolumenMin.length >= Math.min(3, limit)
        ? conVolumenMin
        : limpias

  return pool
    .map((a) => {
      const bayes = scoreValoracionPonderada(a.google_rating, a.google_ratings_total)
      const serv = contarServicios(a.servicios)
      const foto = a.foto_principal || (Array.isArray(a.fotos_urls) && a.fotos_urls[0]) ? 1 : 0
      // Empuje suave si hay volumen real de reseñas
      const volumenBonus = Math.min(0.25, Math.log10(1 + (a.google_ratings_total || 0)) * 0.08)
      return { area: a, score: bayes + serv * 0.03 + foto * 0.08 + volumenBonus }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ area }) => area)
}

/**
 * Serializa el resultado de una tool para el modelo:
 * texto ya formateado (servicios legibles, slug interno) + campos clave.
 * Evita que el LLM invente formatos tipo "[agua: no, electricidad: sí]".
 */
export function serializeToolResultForModel(result: any, locale: ChatLocale = 'es', maxAreas = 3): string {
  if (result == null) return JSON.stringify({ error: 'Sin resultado' })
  if (result.error) return JSON.stringify(result)

  const mapArea = (a: any) => ({
    id: a.id,
    slug: a.slug,
    nombre: a.nombre,
    resumen: formatAreaParaChat(a, locale),
    google_rating: a.google_rating ?? null,
    google_ratings_total: a.google_ratings_total ?? null,
    precio_noche: a.precio_noche ?? null,
    tipo_area: a.tipo_area || null,
    distancia_km: a.distancia_km,
    desvio_km: a.desvio_km,
  })

  if (Array.isArray(result)) {
    const mostradas = result.slice(0, maxAreas)
    return JSON.stringify({
      total: mostradas.length,
      instrucciones:
        `Muestra SOLO estas ${mostradas.length} (no digas un número mayor). El campo "resumen" YA está en el idioma de respuesta: pégalo TAL CUAL (tipo, servicios, rating, /area/{slug}). El tipo_area es el único válido: no llames pública a una privada ni al revés, ni presentes un camping si el usuario lo rechazó. Si el precio es desconocido el resumen lo dice: NUNCA lo conviertas en Gratis. No inventes tarifas semanales/mensuales ni servicios ni pegues Google Maps / imágenes.`,
      areas: mostradas.map(mapArea),
    })
  }

  if (Array.isArray(result.areas)) {
    const mostradas = result.areas.slice(0, maxAreas)
    return JSON.stringify({
      total: mostradas.length,
      aviso: result.aviso || undefined,
      instrucciones:
        `El "resumen" YA está en el idioma de respuesta: pégalo TAL CUAL. Si aviso pide derivar a /ruta, NO listes áreas: da el enlace del planificador. Si hay paradas, muestra SOLO estas ${mostradas.length} (no digas un número mayor). Enlace interno: /area/{slug}.`,
      areas: mostradas.map(mapArea),
    })
  }

  // Detalle de un área concreto
  if (result.id && result.nombre) {
    return JSON.stringify({
      ...result,
      servicios_legibles: formatServiciosLegibles(result.servicios, locale),
      resumen: formatAreaParaChat(result, locale),
    })
  }

  return JSON.stringify(result)
}

const AREA_SELECT_RESUMEN = `
  id, nombre, slug, ciudad, provincia, pais,
  latitud, longitud, precio_noche,
  servicios, tipo_area, google_rating, google_ratings_total,
  plazas_totales, google_maps_url, fotos_urls, foto_principal
`

const AREA_SELECT_RESUMEN_LEGACY = `
  id, nombre, slug, ciudad, provincia, pais,
  latitud, longitud, precio_noche,
  servicios, tipo_area, google_rating,
  plazas_totales, google_maps_url, fotos_urls, foto_principal
`

/**
 * La función SQL `areas_cerca` no devuelve `foto_principal` ni
 * `google_ratings_total`. Sin esto, la tarjeta del chat cae al icono 🚐
 * aunque el área tenga foto. Rellenamos esas columnas por id.
 */
async function enriquecerFotosYReseñas(supabase: any, areas: any[]): Promise<void> {
  const faltan = areas.filter(
    (a) => a && a.id && (a.foto_principal === undefined || a.google_ratings_total === undefined)
  )
  if (!faltan.length) return
  const ids = [...new Set(faltan.map((a) => a.id))]
  try {
    let { data, error } = await (supabase as any)
      .from('areas')
      .select('id, foto_principal, google_ratings_total')
      .in('id', ids)
    if (error && /google_ratings_total/i.test(error.message || '')) {
      ;({ data } = await (supabase as any)
        .from('areas')
        .select('id, foto_principal')
        .in('id', ids))
    }
    const porId = new Map((data || []).map((r: any) => [r.id, r]))
    for (const a of areas) {
      const extra: any = porId.get(a.id)
      if (!extra) continue
      if (a.foto_principal === undefined) a.foto_principal = extra.foto_principal ?? null
      if (a.google_ratings_total === undefined) a.google_ratings_total = extra.google_ratings_total ?? null
    }
  } catch (e) {
    console.warn('⚠️ No se pudieron enriquecer fotos/reseñas de las áreas cercanas', e)
  }
}

/** Select con fallback si aún no se ha ejecutado la migración google_ratings_total. */
async function queryAreasResumen(build: (select: string) => any) {
  let result = await build(AREA_SELECT_RESUMEN)
  if (result.error && /google_ratings_total/i.test(result.error.message || '')) {
    console.warn('⚠️ Columna google_ratings_total ausente: usa ranking heurístico (ejecuta migración 20260728_google_ratings_total.sql)')
    result = await build(AREA_SELECT_RESUMEN_LEGACY)
  }
  return result
}

export interface AreaDetallada extends AreaResumen {
  descripcion: string
  direccion: string
  codigo_postal: string
  comunidad: string
  telefono: string
  email: string
  website: string
  google_place_id: string
  google_rating: number
  precio_24h: boolean
  plazas_camper: number
  acceso_24h: boolean
  barrera_altura: number
  activo: boolean
  destacado: boolean
  verificado: boolean
  created_at: string
  updated_at: string
}

// ============================================
// FUNCIÓN 1: searchAreas
// ============================================
/**
 * Busca áreas según múltiples criterios
 * - Por ubicación (coordenadas GPS o nombre)
 * - Por servicios requeridos
 * - Por precio
 * - Por tipo de área
 * - Por país
 */
export async function searchAreas(params: BusquedaAreasParams): Promise<AreaResumen[]> {
  const supabase = getSupabaseClient()
  
  console.log('🔍 [searchAreas] Parámetros recibidos:', JSON.stringify(params, null, 2))
  
  try {
    // Sin ubicación real: no volcar el ranking mundial (evita Argentina con GPS 0,0)
    if (
      !esGpsValido(params.ubicacion?.lat, params.ubicacion?.lng) &&
      !params.ubicacion?.nombre &&
      !params.pais
    ) {
      console.warn('⚠️ [searchAreas] Sin ubicación válida; no se busca en todo el mundo')
      return []
    }

    // CASO 1: Búsqueda por coordenadas GPS (geolocalización)
    const ubiGps = params.ubicacion
    if (esGpsValido(ubiGps?.lat, ubiGps?.lng) && ubiGps) {
      console.log('📍 Búsqueda por coordenadas GPS')
      
      const radio = ubiGps.radio_km || 50
      
      // Llamar a la función PostgreSQL areas_cerca
      const { data: areasGeo, error: errorGeo } = await (supabase as any).rpc('areas_cerca', {
          lat_usuario: ubiGps.lat,
          lng_usuario: ubiGps.lng,
          radio_km: radio
        })
      
      if (errorGeo) {
        console.error('❌ Error en areas_cerca:', errorGeo)
        throw errorGeo
      }
      
      console.log(`✅ Encontradas ${areasGeo?.length || 0} áreas en radio de ${radio}km`)
      
      // Aplicar filtros adicionales
      let filtered = areasGeo || []
      
      // Filtro por servicios
      if (params.servicios && params.servicios.length > 0) {
        console.log('🔧 Filtrando por servicios:', params.servicios)
        filtered = filtered.filter((area: any) => 
          params.servicios!.every((servicio: any) => 
            area.servicios && area.servicios[servicio] === true
          )
        )
      }
      
      // Filtro por precio
      if (params.solo_gratuitas) {
        console.log('💰 Filtrando solo gratuitas (precio_noche === 0)')
        filtered = filtered.filter((area: any) => esPrecioGratis(area.precio_noche))
      } else if (params.precio_max) {
        console.log(`💰 Filtrando precio máximo: ${params.precio_max}€`)
        filtered = filtered.filter((area: any) =>
          area.precio_noche != null && area.precio_noche <= params.precio_max!
        )
      }
      
      // Filtro por tipo
      if (params.tipo_area) {
        console.log('🏷️ Filtrando por tipo:', params.tipo_area)
        filtered = filtered.filter((area: any) =>
          area.tipo_area === params.tipo_area
        )
      }
      if (params.excluir_camping) {
        filtered = filtered.filter((area: any) => area.tipo_area !== 'camping')
      }

      // Filtro por valoración mínima
      if (params.valoracion_minima) {
        filtered = filtered.filter((area: any) =>
          area.google_rating != null && area.google_rating >= params.valoracion_minima!
        )
      }

      const limpias = limpiarAreasBasura(filtered)
      const etiqueta = ubiGps.etiqueta_distancia || 'desde tu ubicación'
      const conOrigen = limpias.slice(0, 10).map((a: any) =>
        a.distancia_km != null ? { ...a, distancia_desde: a.distancia_desde || etiqueta } : a
      )
      await enriquecerFotosYReseñas(supabase, conOrigen)
      console.log(`✅ Resultado final: ${conOrigen.length} áreas después de filtros`)
      return conOrigen
    }
    
    // CASO 2: Búsqueda por nombre de ciudad/provincia/país
    console.log('📍 Búsqueda por nombre de ubicación')

    const nombreUbicacion = params.ubicacion?.nombre
      ? resolverAliasUbicacion(params.ubicacion.nombre)
      : ''

    if (nombreUbicacion && !esNombrePais(nombreUbicacion)) {
      const geo = await geocodeCity(nombreUbicacion)
      const radioGeo = radioParaTipo(geo?.tipo)
      if (geo && esGpsValido(geo.lat, geo.lng) && radioGeo != null) {
        console.log(`📍 Nombre "${nombreUbicacion}" geocodificado → radio ${radioGeo}km`)
        const ciudadCorta = nombreUbicacion.split(',')[0].trim()
        return searchAreas({
          ...params,
          ubicacion: {
            lat: geo.lat,
            lng: geo.lng,
            radio_km: params.ubicacion?.radio_km || radioGeo,
            etiqueta_distancia: `desde el centro de ${ciudadCorta}`,
          },
        })
      }
    }

    const { data, error } = await queryAreasResumen((select) => {
      let query = (supabase as any).from('areas')
        .select(select)
        .eq('activo', true)

      if (nombreUbicacion) {
        const principal = nombreUbicacion.split(',')[0].trim()
        const nombreLike = `%${principal}%`
        console.log('🔎 Buscando en:', nombreLike)
        query = query.or(
          `ciudad.ilike.${nombreLike},` +
          `provincia.ilike.${nombreLike},` +
          `pais.ilike.${nombreLike},` +
          `nombre.ilike.${nombreLike}`
        )
      }

      if (params.pais) {
        console.log('🌍 Filtrando por país:', params.pais)
        query = query.ilike('pais', `%${params.pais}%`)
      }

      if (params.servicios && params.servicios.length > 0) {
        console.log('🔧 Filtrando por servicios:', params.servicios)
        params.servicios.forEach((servicio: any) => {
          query = query.eq(`servicios->>${servicio}`, true)
        })
      }

      if (params.solo_gratuitas) {
        console.log('💰 Filtrando solo gratuitas (precio_noche === 0)')
        query = query.eq('precio_noche', 0)
      } else if (params.precio_max) {
        console.log(`💰 Filtrando precio máximo: ${params.precio_max}€`)
        query = query.lte('precio_noche', params.precio_max)
      }

      if (params.tipo_area) {
        console.log('🏷️ Filtrando por tipo:', params.tipo_area)
        query = query.eq('tipo_area', params.tipo_area)
      }
      if (params.excluir_camping) {
        query = query.neq('tipo_area', 'camping')
      }

      if (params.valoracion_minima) {
        query = query.gte('google_rating', params.valoracion_minima)
      }

      return query
        .order('google_rating', { ascending: false, nullsFirst: false })
        .limit(40)
    })
    
    if (error) {
      console.error('❌ Error en búsqueda:', error)
      throw error
    }
    
    const ranked = rankMejoresAreas(data || [], 10)
    console.log(`✅ Encontradas ${data?.length || 0} → top ${ranked.length} ponderadas`)
    return ranked
    
  } catch (error) {
    console.error('❌ [searchAreas] Error:', error)
    throw error
  }
}

// ============================================
// FUNCIÓN 2: getAreaDetails
// ============================================
/**
 * Obtiene información COMPLETA de un área específica
 * Incluye todos los datos disponibles
 */
export async function getAreaDetails(areaId: string): Promise<AreaDetallada | null> {
  const supabase = getSupabaseClient()
  
  console.log('📋 [getAreaDetails] Consultando área:', areaId)
  
  try {
    const { data, error } = await (supabase as any).from('areas')
      .select('*')
      .eq('id', areaId)
      .single()
    
    if (error) {
      console.error('❌ Error obteniendo detalles:', error)
      throw error
    }
    
    if (!data) {
      console.log('⚠️ Área no encontrada')
      return null
    }
    
    console.log('✅ Detalles obtenidos:', data.nombre)
    return data as AreaDetallada
    
  } catch (error) {
    console.error('❌ [getAreaDetails] Error:', error)
    throw error
  }
}

// ============================================
// FUNCIÓN 3: getAreasByCountry
// ============================================
/**
 * Lista las mejores áreas de un país específico
 * Ordenadas por score bayesiano (rating × nº de reseñas) + señales de calidad
 */
export async function getAreasByCountry(pais: string, limit: number = 10): Promise<AreaResumen[]> {
  const supabase = getSupabaseClient()
  
  console.log('🌍 [getAreasByCountry] Buscando en:', pais, `(límite: ${limit})`)
  
  try {
    let { data, error } = await queryAreasResumen((select) =>
      (supabase as any).from('areas')
        .select(select)
        .eq('activo', true)
        .ilike('pais', `%${pais}%`)
        .not('google_rating', 'is', null)
        .gte('google_rating', 3.5)
        .gte('google_ratings_total', MIN_REVIEWS_FALLBACK)
        .order('google_ratings_total', { ascending: false, nullsFirst: false })
        .limit(Math.max(120, limit * 12))
    )

    // Fallback si la columna/filtro de reseñas no está disponible
    if (error && /google_ratings_total/i.test(error.message || '')) {
      ;({ data, error } = await queryAreasResumen((select) =>
        (supabase as any).from('areas')
          .select(select)
          .eq('activo', true)
          .ilike('pais', `%${pais}%`)
          .not('google_rating', 'is', null)
          .gte('google_rating', 3.5)
          .order('google_rating', { ascending: false, nullsFirst: false })
          .limit(Math.max(120, limit * 12))
      ))
    }
    
    if (error) {
      console.error('❌ Error buscando por país:', error)
      throw error
    }
    
    const ranked = rankMejoresAreas(data || [], limit)
    console.log(`✅ ${data?.length || 0} candidatas en ${pais} → top ${ranked.length} ponderadas`)
    return ranked
    
  } catch (error) {
    console.error('❌ [getAreasByCountry] Error:', error)
    throw error
  }
}

// ============================================
// FUNCIÓN 4: getAreasPopulares
// ============================================
/**
 * Obtiene las áreas más populares (mejor valoradas)
 * Útil para recomendaciones generales
 */
export async function getAreasPopulares(limit: number = 10): Promise<AreaResumen[]> {
  const supabase = getSupabaseClient()
  
  console.log('⭐ [getAreasPopulares] Obteniendo top', limit)
  
  try {
    const { data, error } = await queryAreasResumen((select) =>
      (supabase as any).from('areas')
        .select(select)
        .eq('activo', true)
        .not('google_rating', 'is', null)
        .gte('google_rating', 3.5)
        .gte('google_ratings_total', MIN_REVIEWS_FALLBACK)
        .order('google_ratings_total', { ascending: false, nullsFirst: false })
        .limit(Math.max(120, limit * 12))
    )
    
    if (error) {
      console.error('❌ Error obteniendo populares:', error)
      throw error
    }
    
    const ranked = rankMejoresAreas(data || [], limit)
    console.log(`✅ ${data?.length || 0} candidatas → top ${ranked.length} ponderadas`)
    return ranked
    
  } catch (error) {
    console.error('❌ [getAreasPopulares] Error:', error)
    throw error
  }
}

// ============================================
// FUNCIÓN 5: buscarAreasPorNombre
// ============================================
/**
 * Búsqueda textual por nombre de área
 * Para cuando el usuario menciona un área específica
 */
function variantesNombreArea(nombre: string): string[] {
  const raw = String(nombre || '').trim()
  if (!raw || /^(esta|esa|esto|eso|aqui|aquí|la|el)$/i.test(raw)) return []
  const n = raw.normalize('NFD').replace(/\p{M}/gu, '')
  const out = new Set<string>([raw, n])
  out.add(n.replace(/\s+/g, ''))
  out.add(n.replace(/garcia\s*munoz/ig, 'Garcimunoz'))
  out.add(n.replace(/^.*\bcastillo de\s+/i, ''))
  out.add(n.replace(/^(el|la|los|las|area|área|camping)\s+/i, ''))
  return [...out].map((s) => s.trim()).filter((s) => s.length >= 3)
}

const STOP_NOMBRE_AREA = new Set([
  'camping', 'area', 'areas', 'autocaravana', 'autocaravanas', 'camper', 'park',
  'puerto', 'santa', 'maria', 'de', 'del', 'la', 'el', 'los', 'las', 'y',
])

function normalizarTokenNombre(s: string): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function tokensNombreDistintivos(nombre: string): string[] {
  return String(nombre || '')
    .split(/\s+/)
    .map(normalizarTokenNombre)
    .filter((w) => w.length >= 4 && !STOP_NOMBRE_AREA.has(w))
}

function distanciaLevenshtein(a: string, b: string): number {
  const s = normalizarTokenNombre(a)
  const t = normalizarTokenNombre(b)
  if (s === t) return 0
  const rows = s.length + 1
  const cols = t.length + 1
  const d: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0))
  for (let i = 0; i < rows; i++) d[i][0] = i
  for (let j = 0; j < cols; j++) d[0][j] = j
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1)
      )
    }
  }
  return d[s.length][t.length]
}

function coincideNombreFuzzy(consulta: string, candidato: string): boolean {
  const q = tokensNombreDistintivos(consulta)
  const c = tokensNombreDistintivos(candidato)
  if (!q.length || !c.length) return false
  return q.some((qt) =>
    c.some((ct) => {
      if (qt === ct) return true
      const maxLen = Math.max(qt.length, ct.length)
      if (maxLen < 4) return false
      return distanciaLevenshtein(qt, ct) <= 1
    })
  )
}

export async function buscarAreasPorNombre(
  nombre: string,
  limit: number = 3,
  cerca?: { lat?: number; lng?: number } | null
): Promise<AreaResumen[]> {
  const supabase = getSupabaseClient()
  const variantes = variantesNombreArea(nombre)
  const termino = variantes[0] || String(nombre || '').trim()
  
  console.log('🔎 [buscarAreasPorNombre] Buscando:', nombre, variantes)
  if (!termino || termino.length < 3) return []
  
  try {
    const { data, error } = await queryAreasResumen((select) =>
      (supabase as any).from('areas')
        .select(select)
        .eq('activo', true)
        .or(variantes.slice(0, 4).map((v) => `nombre.ilike.%${v.replace(/,/g, '')}%`).join(','))
        .order('google_rating', { ascending: false, nullsFirst: false })
        .limit(Math.max(20, limit * 3))
    )
    
    if (error) {
      console.error('❌ Error buscando por nombre:', error)
      throw error
    }

    const palabra = new RegExp(
      `(^|[^A-Za-zÀ-ÿ])${termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-zÀ-ÿ]|$)`,
      'i'
    )
    const ajustadas = (data || []).filter(
      (a: any) => palabra.test(a.nombre || '') || palabra.test(a.ciudad || '')
    )
    
    const ranked = rankMejoresAreas(ajustadas, limit)
    console.log(`✅ Encontradas ${data?.length || 0} → top ${ranked.length} por nombre`)
    if (ranked.length > 0) return ranked

    if (esGpsValido(cerca?.lat, cerca?.lng)) {
      const cercanas = await searchAreas({
        ubicacion: { lat: cerca!.lat, lng: cerca!.lng, radio_km: 15 },
      })
      const fuzzy = (cercanas || []).filter((a) => coincideNombreFuzzy(nombre, a.nombre || ''))
      if (fuzzy.length) {
        console.log(`🔎 Sin exacto "${nombre}"; fuzzy cerca GPS → ${fuzzy[0].nombre}`)
        return rankMejoresAreas(fuzzy, limit)
      }
    }

    const alias = resolverAliasUbicacion(nombre)
    if (alias !== nombre.trim()) {
      console.log(`🔎 Sin área "${nombre}"; reintento como ubicación "${alias}"`)
      return searchAreas({ ubicacion: { nombre: alias } })
    }
    return ranked
    
  } catch (error) {
    console.error('❌ [buscarAreasPorNombre] Error:', error)
    throw error
  }
}

// ============================================
// FUNCIÓN 6: searchAreasAlongRoute
// ============================================

// Caché en memoria de geocodificación de ciudades (evita repetir peticiones)
const geocodeCityCache = new Map<string, { lat: number; lng: number; tipo?: string } | null>()

function radioParaTipo(tipo?: string): number | null {
  const t = (tipo || '').toLowerCase()
  if (t === 'country') return null
  if (['state', 'region', 'province', 'county', 'state_district', 'iso'].includes(t)) return 80
  return 40
}

/**
 * Geocodifica una ciudad con Nominatim (OpenStreetMap, GRATIS).
 */
async function geocodeCity(nombre: string): Promise<{ lat: number; lng: number; tipo?: string } | null> {
  const key = nombre.trim().toLowerCase()
  if (geocodeCityCache.has(key)) return geocodeCityCache.get(key)!

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(nombre)}&limit=1&accept-language=es`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MapaFurgocasa/1.0 (contacto@acttax.es)' }
    })
    const data: any = await res.json()
    const result = Array.isArray(data) && data[0]
      ? {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          tipo: String(data[0].addresstype || data[0].type || ''),
        }
      : null
    geocodeCityCache.set(key, result)
    return result
  } catch (e) {
    console.error('❌ [geocodeCity] Error geocodificando', nombre, e)
    return null
  }
}

/**
 * Distancia aproximada (km) de un punto a un segmento origen→destino
 * usando proyección equirectangular (suficiente para corredores de ruta).
 */
function distanciaAlSegmentoKm(
  p: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): { distKm: number; t: number } {
  const KM_LAT = 111.32
  const latMedia = ((a.lat + b.lat) / 2) * (Math.PI / 180)
  const kmLng = KM_LAT * Math.cos(latMedia)

  const ax = a.lng * kmLng, ay = a.lat * KM_LAT
  const bx = b.lng * kmLng, by = b.lat * KM_LAT
  const px = p.lng * kmLng, py = p.lat * KM_LAT

  const dx = bx - ax, dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx, cy = ay + t * dy
  return { distKm: Math.hypot(px - cx, py - cy), t }
}

/**
 * Busca áreas dentro de un corredor a lo largo de la ruta entre dos ciudades.
 * Devuelve las áreas ordenadas por su posición en la ruta (origen → destino).
 */
function kmEntre(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const KM_LAT = 111.32
  const latMedia = ((a.lat + b.lat) / 2) * (Math.PI / 180)
  const dx = (b.lng - a.lng) * KM_LAT * Math.cos(latMedia)
  const dy = (b.lat - a.lat) * KM_LAT
  return Math.hypot(dx, dy)
}

function mismaCiudad(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizarClave(a || '')
  const nb = normalizarClave(b || '')
  return Boolean(na && nb && (na === nb || na.includes(nb) || nb.includes(na)))
}

/** Reparto a lo largo de la ruta: como mucho 1 por ciudad, no un racimo al origen. */
function diversificarParadas<T extends { ciudad?: string; _t: number }>(areas: T[], limit: number): T[] {
  const picked: T[] = []
  const ciudades = new Set<string>()
  for (const a of areas) {
    const c = normalizarClave(a.ciudad || '')
    if (c && ciudades.has(c)) continue
    if (picked.length && Math.abs(a._t - picked[picked.length - 1]._t) < 0.06) continue
    picked.push(a)
    if (c) ciudades.add(c)
    if (picked.length >= limit) break
  }
  return picked.length ? picked : areas.slice(0, limit)
}

export type FiltrosRuta = {
  tramo?: 'mitad' | 'cerca_destino' | 'todo'
  tipo_area?: 'publica' | 'privada' | 'camping'
  servicios?: string[]
  incluir_origen?: boolean
}

export async function searchAreasAlongRoute(
  origen: string,
  destino: string,
  corredorKm: number = 15,
  filtros: FiltrosRuta = {}
): Promise<{ error?: string; areas?: (AreaResumen & { desvio_km: number })[]; aviso?: string }> {
  console.log(`🛣️ [searchAreasAlongRoute] ${origen} → ${destino} (corredor ${corredorKm}km)`, filtros)

  const [coordsOrigen, coordsDestino] = await Promise.all([
    geocodeCity(origen),
    geocodeCity(destino)
  ])

  if (!coordsOrigen) return { error: `No se pudo localizar "${origen}"` }
  if (!coordsDestino) return { error: `No se pudo localizar "${destino}"` }

  const supabase = getSupabaseClient()

  // Bounding box del corredor (con margen)
  const margenGrados = (corredorKm + 20) / 111
  const minLat = Math.min(coordsOrigen.lat, coordsDestino.lat) - margenGrados
  const maxLat = Math.max(coordsOrigen.lat, coordsDestino.lat) + margenGrados
  const minLng = Math.min(coordsOrigen.lng, coordsDestino.lng) - margenGrados
  const maxLng = Math.max(coordsOrigen.lng, coordsDestino.lng) + margenGrados

  const { data, error } = await queryAreasResumen((select) =>
    (supabase as any).from('areas')
      .select(select)
      .eq('activo', true)
      .gte('latitud', minLat).lte('latitud', maxLat)
      .gte('longitud', minLng).lte('longitud', maxLng)
  )

  if (error) {
    console.error('❌ [searchAreasAlongRoute] Error BD:', error)
    throw error
  }

  const excluirOrigenKm = filtros.incluir_origen ? 0 : 40
  const tramo = filtros.tramo
  let candidatas = limpiarAreasBasura(data || [])
    .map((area: any) => {
      const { distKm, t } = distanciaAlSegmentoKm(
        { lat: area.latitud, lng: area.longitud },
        coordsOrigen,
        coordsDestino
      )
      return {
        ...area,
        desvio_km: Math.round(distKm * 10) / 10,
        _t: t,
        _kmOrigen: kmEntre({ lat: area.latitud, lng: area.longitud }, coordsOrigen),
      }
    })
    .filter((a: any) => a.desvio_km <= corredorKm)

  if (filtros.tipo_area) {
    candidatas = candidatas.filter((a: any) => a.tipo_area === filtros.tipo_area)
  }

  if (filtros.servicios && filtros.servicios.length) {
    candidatas = candidatas.filter((a: any) =>
      filtros.servicios!.every((s) => a.servicios && a.servicios[s] === true)
    )
  }

  if (tramo === 'mitad') {
    candidatas = candidatas.filter((a: any) => a._t >= 0.28 && a._t <= 0.72)
  } else if (tramo === 'cerca_destino') {
    candidatas = candidatas.filter((a: any) => a._t >= 0.55 && a._t <= 0.95)
  }

  if (excluirOrigenKm > 0) {
    candidatas = candidatas.filter(
      (a: any) =>
        a._kmOrigen >= excluirOrigenKm &&
        a._t >= 0.16 &&
        !mismaCiudad(a.ciudad, origen)
    )
  }

  candidatas.sort((a: any, b: any) => a._t - b._t)
  const elegidas = diversificarParadas(candidatas, 5).map(({ _t, _kmOrigen, ...rest }: any) => rest)

  console.log(`✅ ${elegidas.length} áreas útiles en el corredor (de ${candidatas.length} tras filtros)`)
  return {
    areas: elegidas,
    aviso:
      'Estas NO son áreas del origen. Si el usuario no pidió salir de la ciudad de partida, no listes campings/áreas de esa ciudad. Máximo 4 fichas, repartidas por el trayecto.',
  }
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Formatea un área para mostrar en el chat
 */
function formatUbicacionArea(area: AreaResumen, locale: ChatLocale = 'es'): string {
  const parts = [area.ciudad, area.provincia, area.pais ? traducirPais(area.pais, locale) : '']
    .map((s) => String(s || '').trim())
    .filter((s) => s && !/^s\/n$/i.test(s) && s.toLowerCase() !== 'null')
  const uniq = parts.filter((p, i) => i === 0 || p.toLowerCase() !== parts[i - 1].toLowerCase())
  return uniq.join(', ') || FICHA_I18N[locale].locationUnknown
}

/**
 * Reescribe enlaces inventados (example.com, markdown externo) a `/area/{slug}`.
 * No toca el resto del texto.
 */
export function sanitizarRespuestaChat(texto: string, areas: AreaResumen[] = []): string {
  if (!texto) return texto

  const slugDeUrl = (url: string): string | null => {
    const m = String(url).match(/\/area\/([A-Za-z0-9-]+)/i)
    return m ? m[1] : null
  }

  const slugPorNombre = (label: string): string | null => {
    const key = normalizarClave(label)
    if (!key) return null
    const hit = areas.find((a) => a.slug && a.nombre && normalizarClave(a.nombre) === key)
    return hit?.slug || null
  }

  let out = texto
  out = out.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (_all, label: string, url: string) => {
    if (/furgocasa\.com/i.test(url)) return `[${label}](${url})`
    const slug = slugDeUrl(url) || slugPorNombre(label)
    return slug ? `/area/${slug}` : (label || '').trim()
  })
  out = out.replace(/https?:\/\/[^\s)]+/gi, (url) => {
    const slug = slugDeUrl(url)
    if (slug) return `/area/${slug}`
    if (/example\.com|autocaravanas\.com/i.test(url)) return ''
    return url
  })
  return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')
}

/**
 * El modelo no reescribe fichas: se queda la intro y se pegan los
 * resúmenes oficiales (precio, servicios, /area/{slug}, distancias).
 */
function normalizarClaveArea(s: string): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function areaMencionadaEnTexto(texto: string, area: AreaResumen): boolean {
  const t = normalizarClaveArea(texto)
  if (!t) return false
  const keys = [area.nombre, (area.slug || '').replace(/-/g, ' '), area.ciudad].filter(Boolean)
  return keys.some((k) => {
    const n = normalizarClaveArea(String(k))
    return n.length >= 4 && t.includes(n)
  })
}

/** Máximo 3 fichas, solo las que el texto nombra. Cero si está pidiendo aclaración. */
export function elegirAreasParaTarjetas(
  texto: string,
  areas: AreaResumen[] = [],
  pregunta = '',
  max = 3
): AreaResumen[] {
  if (!areas.length) return []
  if (/te refieres|te refer[ií]as|o a un [aá]rea concreta|dime si quieres que ampl[ií]e|qu[eé] parada buscas|d[oó]nde las buscas|no me queda claro/i.test(texto)) {
    return []
  }
  const blob = `${texto}\n${pregunta}`
  const mencionadas = areas.filter((a) => areaMencionadaEnTexto(blob, a))
  const pideGratis = /gratis|gratuit/i.test(pregunta) && !/de pago/i.test(pregunta)
  const sinCamping = /camping\s*no|sin campings?|no\s+(quiero\s+)?(un\s+|el\s+)?campings?|no campsite|pas de camping|kein camping|niente camping/i.test(blob)
  const base = sinCamping ? areas.filter((a) => a.tipo_area !== 'camping') : areas
  const mencionadasOk = sinCamping ? mencionadas.filter((a) => a.tipo_area !== 'camping') : mencionadas
  const candidatas = pideGratis
    ? (mencionadasOk.length ? mencionadasOk : base).filter((a) => a.precio_noche === 0)
    : mencionadasOk.length
      ? mencionadasOk
      : base
  if (pideGratis) return candidatas.slice(0, max)
  if (mencionadasOk.length) return mencionadasOk.slice(0, max)
  if (esPreguntaAreaConcreta(pregunta)) return base.slice(0, 1)
  return candidatas.slice(0, max)
}

export function componerRespuestaConFichas(
  textoModelo: string,
  areas: AreaResumen[] = [],
  locale: ChatLocale = 'es'
): string {
  const limpio = sanitizarRespuestaChat(textoModelo || '', areas)
  if (!areas.length) return limpio

  const keep: string[] = []
  let enFicha = false
  for (const linea of limpio.split('\n')) {
    const l = linea.trim()
    if (/^🚐/.test(l) || /^\d+\.\s+\*\*[^*]+\*\*\s*$/.test(l)) {
      enFicha = true
      continue
    }
    if (enFicha && (/^[📍🏷️💰✨⭐🅿️🔗📏↔]/.test(l) || /✨ Servicios:|✨ Services:|✨ Servizi:|✨ Serviços:|🔗 \/area\//.test(l))) {
      continue
    }
    if (enFicha && !l) {
      enFicha = false
      continue
    }
    enFicha = false
    if (/autocaravanas\.com|example\.com/i.test(l)) continue
    if (/💰|✨ Servicios:|✨ Services:|🔗 \/area\//.test(l)) continue
    keep.push(linea)
  }
  const intro = keep.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  const fichas = areas.slice(0, 3).map((a) => formatAreaParaChat(a, locale)).join('\n')
  return [intro, fichas].filter(Boolean).join('\n\n')
}

export function formatAreaParaChat(area: AreaResumen, locale: ChatLocale = 'es'): string {
  const L = FICHA_I18N[locale] || FICHA_I18N.es
  let texto = `🚐 **${area.nombre}**\n`
  texto += `📍 ${formatUbicacionArea(area, locale)}\n`
  const tipo = etiquetaTipoArea(area.tipo_area, locale)
  if (tipo) texto += `🏷️ ${tipo}\n`
  
  if (area.distancia_km !== undefined) {
    const desde = formatDistanciaDesde(area.distancia_desde, locale)
    texto += `📏 ${area.distancia_km.toFixed(1)} km ${desde}\n`
  }
  if ((area as any).desvio_km !== undefined) {
    texto += `↔ ${(area as any).desvio_km} ${L.detour}\n`
  }
  
  const precio = area.precio_noche
  if (typeof precio === 'number' && precio > 0) {
    texto += `💰 ${precio}${L.perNight}\n`
  } else if (esPrecioGratis(precio)) {
    texto += `💰 ${L.free}\n`
  } else {
    texto += `💰 ${L.priceUnknown}\n`
  }
  
  const serviciosDisponibles = formatServiciosLegibles(area.servicios, locale)
  if (serviciosDisponibles) {
    texto += `✨ ${L.services}: ${serviciosDisponibles}\n`
  }
  
  if (area.google_rating && area.google_rating > 0) {
    const n = area.google_ratings_total
    texto += n != null && n > 0
      ? `⭐ ${area.google_rating.toFixed(1)}/5 (${n} ${L.reviews})\n`
      : `⭐ ${area.google_rating.toFixed(1)}/5 (Google)\n`
  }
  
  if (area.plazas_totales) {
    texto += `🅿️ ${area.plazas_totales} ${L.spots}\n`
  }

  // Link interno (las tarjetas del chat también lo muestran; evita Google Maps / markdown de imagen)
  if (area.slug) {
    texto += `🔗 /area/${area.slug}\n`
  }
  
  return texto
}

/**
 * Cuenta cuántas áreas coinciden con ciertos criterios
 * Útil para estadísticas
 */
export async function contarAreas(params: BusquedaAreasParams): Promise<number> {
  const supabase = getSupabaseClient()
  
  let query = (supabase as any).from('areas')
    .select('id', { count: 'exact', head: true })
    .eq('activo', true)
  
  if (params.pais) {
    query = query.ilike('pais', `%${params.pais}%`)
  }
  
  if (params.servicios && params.servicios.length > 0) {
    params.servicios.forEach((servicio: any) => {
      query = query.eq(`servicios->>${servicio}`, true)
    })
  }
  
  const { count, error } = await query
  
  if (error) throw error
  return count || 0
}

export interface InfoViajeWebParams {
  pregunta: string
  lugar?: string
  origen?: string
  destino?: string
  idioma?: ChatLocale
}

/**
 * Web search de Terra SOLO para lo práctico del camino
 * (gasolineras, diésel, taller). Nunca para listar áreas ni para guías turísticas.
 */
export async function buscarInfoViajeWeb(params: InfoViajeWebParams): Promise<{
  texto: string
  aviso: string
}> {
  const pregunta = (params.pregunta || '').trim()
  if (!pregunta) return { texto: '', aviso: 'Falta la pregunta' }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { texto: '', aviso: 'Búsqueda web no configurada' }
  }

  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey })
  const detalle = [
    pregunta,
    params.lugar ? `Lugar: ${params.lugar}` : '',
    params.origen && params.destino ? `Entre ${params.origen} y ${params.destino}` : '',
  ]
    .filter(Boolean)
    .join('. ')

  const resp = await openai.responses.create({
    model: 'gpt-5.6-terra',
    tools: [{ type: 'web_search' }],
    max_output_tokens: 700,
    reasoning: { effort: 'low' },
    instructions:
      'Información práctica de camino: SOLO gasolineras, diésel o taller de emergencia. ' +
      `Responde ENTERA en el idioma del cliente (${params.idioma || 'el de la pregunta'}). ` +
      'Sitios reales, breve. Nada de qué ver, pueblos, restaurantes ni guía turística. ' +
      'NO inventes áreas de autocaravanas ni enlaces /area/. ' +
      'Si no hay dato fiable, dilo.',
    input: detalle,
  })

  return {
    texto: (resp as any).output_text || '',
    aviso:
      'Esto NO es el catálogo de áreas. No lo presentes como ficha /area/. ' +
      'Di que es información de la web, no verificada en Mapa Furgocasa.',
  }
}

