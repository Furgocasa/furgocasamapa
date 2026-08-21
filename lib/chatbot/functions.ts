/**
 * FUNCIONES DE CONSULTA PARA EL CHATBOT
 * =====================================
 * Funciones que el chatbot puede llamar mediante Function Calling
 * para consultar la base de datos de áreas
 */

import { createClient } from '@supabase/supabase-js'

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
  }
  servicios?: string[]
  precio_max?: number
  solo_gratuitas?: boolean
  tipo_area?: 'publica' | 'privada' | 'camping' | 'parking'
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

/** Lista legible de servicios en true (nunca muestra false ni el objeto crudo). */
export function formatServiciosLegibles(servicios: Record<string, boolean> | null | undefined): string {
  if (!servicios || typeof servicios !== 'object') return ''
  return Object.entries(servicios)
    .filter(([, value]) => value === true)
    .map(([key]) => SERVICIOS_NOMBRES[key] || key.replace(/_/g, ' '))
    .join(', ')
}

function esNombreBasura(nombre: string | null | undefined): boolean {
  return !nombre || NOMBRE_BASURA_RE.test(nombre)
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
}

function resolverAliasUbicacion(nombre: string): string {
  return ALIAS_UBICACION[normalizarClave(nombre)] || nombre.trim()
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
export function serializeToolResultForModel(result: any): string {
  if (result == null) return JSON.stringify({ error: 'Sin resultado' })
  if (result.error) return JSON.stringify(result)

  const mapArea = (a: any) => ({
    id: a.id,
    slug: a.slug,
    nombre: a.nombre,
    resumen: formatAreaParaChat(a),
    google_rating: a.google_rating ?? null,
    google_ratings_total: a.google_ratings_total ?? null,
    precio_noche: a.precio_noche ?? null,
    distancia_km: a.distancia_km,
    desvio_km: a.desvio_km,
  })

  if (Array.isArray(result)) {
    return JSON.stringify({
      total: result.length,
      instrucciones:
        'Usa el campo "resumen" de cada área tal cual (servicios solo en true, rating y enlace /area/{slug}). Si precio_noche es null el resumen dice "Precio no disponible": NUNCA lo conviertas en Gratis. No inventes servicios ni pegues Google Maps / imágenes.',
      areas: result.map(mapArea),
    })
  }

  if (Array.isArray(result.areas)) {
    return JSON.stringify({
      total: result.areas.length,
      instrucciones:
        'Usa el campo "resumen" de cada área tal cual. Menciona desvío_km si existe. Tras listar paradas puedes mencionar /ruta como complemento, nunca como única respuesta. Enlace interno: /area/{slug}.',
      areas: result.areas.map(mapArea),
    })
  }

  // Detalle de un área concreto
  if (result.id && result.nombre) {
    return JSON.stringify({
      ...result,
      servicios_legibles: formatServiciosLegibles(result.servicios),
      resumen: formatAreaParaChat(result),
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
          !area.precio_noche || area.precio_noche <= params.precio_max!
        )
      }
      
      // Filtro por tipo
      if (params.tipo_area) {
        console.log('🏷️ Filtrando por tipo:', params.tipo_area)
        filtered = filtered.filter((area: any) =>
          area.tipo_area === params.tipo_area
        )
      }

      // Filtro por valoración mínima
      if (params.valoracion_minima) {
        filtered = filtered.filter((area: any) =>
          area.google_rating != null && area.google_rating >= params.valoracion_minima!
        )
      }

      console.log(`✅ Resultado final: ${filtered.length} áreas después de filtros`)
      return filtered.slice(0, 10)
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
        return searchAreas({
          ...params,
          ubicacion: {
            lat: geo.lat,
            lng: geo.lng,
            radio_km: params.ubicacion?.radio_km || radioGeo,
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
export async function buscarAreasPorNombre(nombre: string, limit: number = 5): Promise<AreaResumen[]> {
  const supabase = getSupabaseClient()
  
  console.log('🔎 [buscarAreasPorNombre] Buscando:', nombre)
  
  try {
    const { data, error } = await queryAreasResumen((select) =>
      (supabase as any).from('areas')
        .select(select)
        .eq('activo', true)
        .ilike('nombre', `%${nombre}%`)
        .order('google_rating', { ascending: false, nullsFirst: false })
        .limit(Math.max(20, limit * 3))
    )
    
    if (error) {
      console.error('❌ Error buscando por nombre:', error)
      throw error
    }
    
    const ranked = rankMejoresAreas(data || [], limit)
    console.log(`✅ Encontradas ${data?.length || 0} → top ${ranked.length} por nombre`)
    if (ranked.length > 0) return ranked

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
export async function searchAreasAlongRoute(
  origen: string,
  destino: string,
  corredorKm: number = 15
): Promise<{ error?: string; areas?: (AreaResumen & { desvio_km: number })[] }> {
  console.log(`🛣️ [searchAreasAlongRoute] ${origen} → ${destino} (corredor ${corredorKm}km)`)

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

  const enCorredor = (data || [])
    .map((area: any) => {
      const { distKm, t } = distanciaAlSegmentoKm(
        { lat: area.latitud, lng: area.longitud },
        coordsOrigen,
        coordsDestino
      )
      return { ...area, desvio_km: Math.round(distKm * 10) / 10, _t: t }
    })
    .filter((a: any) => a.desvio_km <= corredorKm)
    .sort((a: any, b: any) => a._t - b._t) // orden origen → destino
    .slice(0, 15)
    .map(({ _t, ...rest }: any) => rest)

  console.log(`✅ ${enCorredor.length} áreas en el corredor`)
  return { areas: enCorredor }
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Formatea un área para mostrar en el chat
 */
export function formatAreaParaChat(area: AreaResumen): string {
  let texto = `🚐 **${area.nombre}**\n`
  texto += `📍 ${area.ciudad}, ${area.provincia}, ${area.pais}\n`
  
  if (area.distancia_km !== undefined) {
    texto += `📏 ${area.distancia_km.toFixed(1)} km de distancia\n`
  }
  if ((area as any).desvio_km !== undefined) {
    texto += `↔ ${(area as any).desvio_km} km de desvío\n`
  }
  
  const precio = area.precio_noche
  if (typeof precio === 'number' && precio > 0) {
    texto += `💰 ${precio}€/noche\n`
  } else if (esPrecioGratis(precio)) {
    texto += `💰 Gratis\n`
  } else {
    texto += `💰 Precio no disponible\n`
  }
  
  const serviciosDisponibles = formatServiciosLegibles(area.servicios)
  if (serviciosDisponibles) {
    texto += `✨ Servicios: ${serviciosDisponibles}\n`
  }
  
  if (area.google_rating && area.google_rating > 0) {
    const n = area.google_ratings_total
    texto += n != null && n > 0
      ? `⭐ ${area.google_rating.toFixed(1)}/5 (${n} valoraciones)\n`
      : `⭐ ${area.google_rating.toFixed(1)}/5 (Google)\n`
  }
  
  if (area.plazas_totales) {
    texto += `🅿️ ${area.plazas_totales} plazas\n`
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

