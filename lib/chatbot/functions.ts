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
  plazas_totales: number | null
  google_maps_url: string | null
  fotos_urls: string[]
  foto_principal?: string | null
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
    // CASO 1: Búsqueda por coordenadas GPS (geolocalización)
    if (params.ubicacion?.lat && params.ubicacion?.lng) {
      console.log('📍 Búsqueda por coordenadas GPS')
      
      const radio = params.ubicacion.radio_km || 50
      
      // Llamar a la función PostgreSQL areas_cerca
      const { data: areasGeo, error: errorGeo } = await (supabase as any).rpc('areas_cerca', {
          lat_usuario: params.ubicacion.lat,
          lng_usuario: params.ubicacion.lng,
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
        console.log('💰 Filtrando solo gratuitas')
        filtered = filtered.filter((area: any) => 
          !area.precio_noche || area.precio_noche === 0
        )
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
    
    let query = (supabase as any).from('areas')
      .select(`
        id, nombre, slug, ciudad, provincia, pais, 
        latitud, longitud, precio_noche, 
        servicios, tipo_area, google_rating,
        plazas_totales, google_maps_url, fotos_urls, foto_principal
      `)
      .eq('activo', true)
    
    // Filtro por ubicación (nombre)
    if (params.ubicacion?.nombre) {
      const nombreLike = `%${params.ubicacion.nombre}%`
      console.log('🔎 Buscando en:', nombreLike)
      
      query = query.or(
        `ciudad.ilike.${nombreLike},` +
        `provincia.ilike.${nombreLike},` +
        `pais.ilike.${nombreLike}`
      )
    }
    
    // Filtro por país específico
    if (params.pais) {
      console.log('🌍 Filtrando por país:', params.pais)
      query = query.ilike('pais', `%${params.pais}%`)
    }
    
    // Filtro por servicios
    if (params.servicios && params.servicios.length > 0) {
      console.log('🔧 Filtrando por servicios:', params.servicios)
      params.servicios.forEach((servicio: any) => {
        query = query.eq(`servicios->>${servicio}`, true)
      })
    }
    
    // Filtro por precio
    if (params.solo_gratuitas) {
      console.log('💰 Filtrando solo gratuitas')
      query = query.or('precio_noche.is.null,precio_noche.eq.0')
    } else if (params.precio_max) {
      console.log(`💰 Filtrando precio máximo: ${params.precio_max}€`)
      query = query.lte('precio_noche', params.precio_max)
    }
    
    // Filtro por tipo
    if (params.tipo_area) {
      console.log('🏷️ Filtrando por tipo:', params.tipo_area)
      query = query.eq('tipo_area', params.tipo_area)
    }

    // Filtro por valoración mínima
    if (params.valoracion_minima) {
      query = query.gte('google_rating', params.valoracion_minima)
    }

    // Ordenar por valoración (mejores primero)
    query = query
      .order('google_rating', { ascending: false, nullsFirst: false })
      .limit(10)
    
    const { data, error } = await query
    
    if (error) {
      console.error('❌ Error en búsqueda:', error)
      throw error
    }
    
    console.log(`✅ Encontradas ${data?.length || 0} áreas`)
    return data || []
    
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
 * Ordenadas por valoración
 */
export async function getAreasByCountry(pais: string, limit: number = 10): Promise<AreaResumen[]> {
  const supabase = getSupabaseClient()
  
  console.log('🌍 [getAreasByCountry] Buscando en:', pais, `(límite: ${limit})`)
  
  try {
    const { data, error } = await (supabase as any).from('areas')
      .select(`
        id, nombre, slug, ciudad, provincia, pais, 
        latitud, longitud, precio_noche, 
        servicios, tipo_area, google_rating,
        plazas_totales, google_maps_url, fotos_urls, foto_principal
      `)
      .eq('activo', true)
      .ilike('pais', `%${pais}%`)
      .order('google_rating', { ascending: false, nullsFirst: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ Error buscando por país:', error)
      throw error
    }
    
    console.log(`✅ Encontradas ${data?.length || 0} áreas en ${pais}`)
    return data || []
    
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
    const { data, error } = await (supabase as any).from('areas')
      .select(`
        id, nombre, slug, ciudad, provincia, pais, 
        latitud, longitud, precio_noche, 
        servicios, tipo_area, google_rating,
        plazas_totales, 
        google_maps_url, fotos_urls, foto_principal
      `)
      .eq('activo', true)
      .not('google_rating', 'is', null)
      .gte('google_rating', 3) // Al menos rating de 3
      .order('google_rating', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ Error obteniendo populares:', error)
      throw error
    }
    
    console.log(`✅ ${data?.length || 0} áreas populares obtenidas`)
    return data || []
    
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
    const { data, error } = await (supabase as any).from('areas')
      .select(`
        id, nombre, slug, ciudad, provincia, pais, 
        latitud, longitud, precio_noche, 
        servicios, tipo_area, google_rating,
        plazas_totales, 
        google_maps_url, fotos_urls, foto_principal
      `)
      .eq('activo', true)
      .ilike('nombre', `%${nombre}%`)
      .order('google_rating', { ascending: false, nullsFirst: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ Error buscando por nombre:', error)
      throw error
    }
    
    console.log(`✅ Encontradas ${data?.length || 0} áreas con nombre similar`)
    return data || []
    
  } catch (error) {
    console.error('❌ [buscarAreasPorNombre] Error:', error)
    throw error
  }
}

// ============================================
// FUNCIÓN 6: searchAreasAlongRoute
// ============================================

// Caché en memoria de geocodificación de ciudades (evita repetir peticiones)
const geocodeCityCache = new Map<string, { lat: number; lng: number } | null>()

/**
 * Geocodifica una ciudad con Nominatim (OpenStreetMap, GRATIS).
 */
async function geocodeCity(nombre: string): Promise<{ lat: number; lng: number } | null> {
  const key = nombre.trim().toLowerCase()
  if (geocodeCityCache.has(key)) return geocodeCityCache.get(key)!

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(nombre)}&limit=1&accept-language=es`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MapaFurgocasa/1.0 (contacto@acttax.es)' }
    })
    const data: any = await res.json()
    const result = Array.isArray(data) && data[0]
      ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
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

  const { data, error } = await (supabase as any).from('areas')
    .select(`
      id, nombre, slug, ciudad, provincia, pais,
      latitud, longitud, precio_noche,
      servicios, tipo_area, google_rating,
        plazas_totales, google_maps_url, fotos_urls, foto_principal
  `)
    .eq('activo', true)
    .gte('latitud', minLat).lte('latitud', maxLat)
    .gte('longitud', minLng).lte('longitud', maxLng)

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
  
  if (area.precio_noche !== null && area.precio_noche > 0) {
    texto += `💰 ${area.precio_noche}€/noche\n`
  } else {
    texto += `💰 Gratis\n`
  }
  
  // Servicios principales
  const serviciosDisponibles = Object.entries(area.servicios || {})
    .filter(([_, value]) => value === true)
    .map(([key, _]) => {
      const nombres: Record<string, string> = {
        agua: 'Agua',
        electricidad: 'Electricidad',
        wifi: 'WiFi',
        duchas: 'Duchas',
        wc: 'WC',
        zona_mascotas: 'Mascotas'
      }
      return nombres[key] || key
    })
  
  if (serviciosDisponibles.length > 0) {
    texto += `✨ Servicios: ${serviciosDisponibles.join(', ')}\n`
  }
  
  if (area.google_rating && area.google_rating > 0) {
    texto += `⭐ ${area.google_rating.toFixed(1)}/5 (Google)\n`
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

