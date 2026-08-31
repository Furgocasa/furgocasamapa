/**
 * Malla de talleres: TODAS las provincias, igual que se buscaron los campings.
 * Puntos urbanos (capital + ciudades grandes) + Nearby Search por keyword.
 * Así entran los que no llevan «taller» en el nombre (Caravanas Sangar).
 *
 *   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"
 *   npx tsx scripts/buscar-huecos-talleres.ts                     # dry-run todas
 *   npx tsx scripts/buscar-huecos-talleres.ts --provincia=murcia  # una provincia
 *   npx tsx scripts/buscar-huecos-talleres.ts --apply             # escribe (por provincia, reanudable)
 *   npx tsx scripts/buscar-huecos-talleres.ts --desde=Lugo        # reanudar desde una provincia
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { normalizarProvincia } from '../lib/areas/provincias'
import {
  admiteTallerCamper,
  tieneSenalCamper,
  tipoTaller,
  tituloTaller,
  webConfirmaOficio,
  webEsSoloFlota,
} from '../lib/talleres/seo-snippet'

const APPLY = process.argv.includes('--apply')
const ARG_PROV = (process.argv.find((a) => a.startsWith('--provincia=')) || '').split('=')[1] || ''
const ARG_DESDE = (process.argv.find((a) => a.startsWith('--desde=')) || '').split('=')[1] || ''
const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

/** Lo que la gente busca. El keyword de Nearby matcha el negocio, no solo el rótulo. */
const KEYWORDS = ['taller autocaravanas', 'camperizacion furgonetas', 'taller camper', 'accesorios camper']

const RADIO_DEFECTO = 30000 // 30 km; tope de la API 50 km

type Punto = { lat: number; lng: number; r?: number }

/** Capital + ciudades con polígono. No sierras: un taller no vive en el monte. */
const PUNTOS: Record<string, Punto[]> = {
  'A Coruña': [
    { lat: 43.36, lng: -8.41 },
    { lat: 42.88, lng: -8.54 },
    { lat: 43.48, lng: -8.23 },
    { lat: 43.21, lng: -8.69 },
  ],
  'Álava': [
    { lat: 42.85, lng: -2.67 },
    { lat: 43.14, lng: -2.96 },
  ],
  'Albacete': [
    { lat: 38.99, lng: -1.86 },
    { lat: 39.27, lng: -2.6 },
    { lat: 38.51, lng: -1.7 },
    { lat: 38.87, lng: -1.1 },
  ],
  'Alicante': [
    { lat: 38.35, lng: -0.48 },
    { lat: 38.27, lng: -0.7 },
    { lat: 38.54, lng: -0.13 },
    { lat: 38.7, lng: -0.47 },
    { lat: 37.98, lng: -0.68 },
    { lat: 38.84, lng: 0.11 },
  ],
  'Almería': [
    { lat: 36.84, lng: -2.46 },
    { lat: 36.78, lng: -2.81 },
    { lat: 37.39, lng: -1.94 },
    { lat: 36.97, lng: -2.2 },
  ],
  'Asturias': [
    { lat: 43.36, lng: -5.85 },
    { lat: 43.54, lng: -5.66 },
    { lat: 43.56, lng: -5.92 },
    { lat: 43.42, lng: -4.75 },
    { lat: 43.18, lng: -6.55 },
  ],
  'Ávila': [
    { lat: 40.66, lng: -4.7 },
    { lat: 41.06, lng: -4.72 },
    { lat: 40.21, lng: -5.08 },
  ],
  'Badajoz': [
    { lat: 38.88, lng: -6.97 },
    { lat: 38.92, lng: -6.34 },
    { lat: 38.96, lng: -5.86 },
    { lat: 38.42, lng: -6.42 },
    { lat: 38.68, lng: -6.41 },
  ],
  'Illes Balears': [
    { lat: 39.57, lng: 2.65 },
    { lat: 39.72, lng: 2.91 },
    { lat: 39.57, lng: 3.21 },
    { lat: 38.91, lng: 1.43 },
    { lat: 39.89, lng: 4.26 },
  ],
  'Barcelona': [
    { lat: 41.39, lng: 2.17, r: 20000 },
    { lat: 41.55, lng: 2.05, r: 20000 },
    { lat: 41.61, lng: 2.29, r: 20000 },
    { lat: 41.73, lng: 1.83 },
    { lat: 41.35, lng: 1.7 },
    { lat: 41.54, lng: 2.44, r: 20000 },
  ],
  'Bizkaia': [
    { lat: 43.26, lng: -2.93 },
    { lat: 43.17, lng: -2.63 },
    { lat: 43.32, lng: -2.68 },
  ],
  'Burgos': [
    { lat: 42.34, lng: -3.7 },
    { lat: 42.69, lng: -2.94 },
    { lat: 41.67, lng: -3.69 },
  ],
  'Cáceres': [
    { lat: 39.48, lng: -6.37 },
    { lat: 40.03, lng: -6.09 },
    { lat: 39.89, lng: -5.54 },
    { lat: 39.46, lng: -5.88 },
  ],
  'Cádiz': [
    { lat: 36.53, lng: -6.19 },
    { lat: 36.69, lng: -6.12 },
    { lat: 36.13, lng: -5.45 },
    { lat: 36.42, lng: -6.15 },
    { lat: 36.75, lng: -5.81 },
  ],
  'Cantabria': [
    { lat: 43.46, lng: -3.8 },
    { lat: 43.35, lng: -4.05 },
    { lat: 43.38, lng: -3.22 },
    { lat: 43.0, lng: -4.14 },
  ],
  'Castellón': [
    { lat: 39.99, lng: -0.04 },
    { lat: 40.47, lng: 0.47 },
    { lat: 39.96, lng: -0.26 },
  ],
  'Ciudad Real': [
    { lat: 38.99, lng: -3.93 },
    { lat: 38.69, lng: -4.11 },
    { lat: 38.76, lng: -3.38 },
    { lat: 39.39, lng: -3.21 },
    { lat: 39.16, lng: -3.02 },
  ],
  'Córdoba': [
    { lat: 37.89, lng: -4.78 },
    { lat: 37.41, lng: -4.49 },
    { lat: 37.39, lng: -4.77 },
    { lat: 38.38, lng: -4.85 },
  ],
  'Cuenca': [
    { lat: 40.07, lng: -2.14 },
    { lat: 40.01, lng: -3.01 },
    { lat: 39.56, lng: -1.89 },
  ],
  'Girona': [
    { lat: 41.98, lng: 2.82 },
    { lat: 42.27, lng: 2.96 },
    { lat: 42.18, lng: 2.49 },
    { lat: 41.67, lng: 2.79 },
  ],
  'Granada': [
    { lat: 37.18, lng: -3.6 },
    { lat: 36.75, lng: -3.52 },
    { lat: 37.49, lng: -2.77 },
    { lat: 37.3, lng: -3.14 },
    { lat: 37.17, lng: -4.15 },
  ],
  'Guadalajara': [
    { lat: 40.63, lng: -3.17 },
    { lat: 40.57, lng: -3.27 },
    { lat: 41.07, lng: -2.64 },
  ],
  'Gipuzkoa': [
    { lat: 43.31, lng: -1.98 },
    { lat: 43.34, lng: -1.79 },
    { lat: 43.18, lng: -2.47 },
    { lat: 43.13, lng: -2.08 },
  ],
  'Huelva': [
    { lat: 37.26, lng: -6.94 },
    { lat: 37.25, lng: -7.2 },
    { lat: 37.26, lng: -6.52 },
    { lat: 37.89, lng: -6.56 },
  ],
  'Huesca': [
    { lat: 42.14, lng: -0.41 },
    { lat: 42.04, lng: 0.13 },
    { lat: 41.91, lng: 0.19 },
    { lat: 42.57, lng: -0.55 },
    { lat: 41.52, lng: 0.35 },
  ],
  'Jaén': [
    { lat: 37.77, lng: -3.79 },
    { lat: 38.1, lng: -3.63 },
    { lat: 38.01, lng: -3.37 },
    { lat: 38.04, lng: -4.05 },
  ],
  'La Rioja': [
    { lat: 42.47, lng: -2.44 },
    { lat: 42.3, lng: -1.97 },
    { lat: 42.58, lng: -2.85 },
  ],
  'Las Palmas': [
    { lat: 28.12, lng: -15.43 },
    { lat: 28.0, lng: -15.42 },
    { lat: 27.76, lng: -15.59 },
    { lat: 28.5, lng: -13.86 },
    { lat: 28.96, lng: -13.55 },
  ],
  'León': [
    { lat: 42.6, lng: -5.57 },
    { lat: 42.55, lng: -6.6 },
    { lat: 42.46, lng: -6.05 },
  ],
  'Lleida': [
    { lat: 41.62, lng: 0.62 },
    { lat: 41.65, lng: 1.14 },
    { lat: 42.36, lng: 1.46 },
  ],
  'Lugo': [
    { lat: 43.01, lng: -7.56 },
    { lat: 42.52, lng: -7.51 },
    { lat: 43.66, lng: -7.59 },
  ],
  'Madrid': [
    { lat: 40.42, lng: -3.7, r: 20000 },
    { lat: 40.48, lng: -3.36, r: 20000 },
    { lat: 40.29, lng: -3.83, r: 20000 },
    { lat: 40.63, lng: -4.01 },
    { lat: 40.3, lng: -3.44 },
    { lat: 40.66, lng: -3.77 },
  ],
  'Málaga': [
    { lat: 36.72, lng: -4.42 },
    { lat: 36.51, lng: -4.89 },
    { lat: 36.78, lng: -4.1 },
    { lat: 37.02, lng: -4.56 },
    { lat: 36.74, lng: -5.17 },
  ],
  'Murcia': [
    { lat: 37.99, lng: -1.13 },
    { lat: 37.63, lng: -0.98 },
    { lat: 37.67, lng: -1.7 },
    { lat: 38.05, lng: -1.21 },
    { lat: 38.61, lng: -1.11 },
    { lat: 37.8, lng: -0.84 },
  ],
  'Navarra': [
    { lat: 42.82, lng: -1.65 },
    { lat: 42.07, lng: -1.6 },
    { lat: 42.67, lng: -2.03 },
  ],
  'Ourense': [
    { lat: 42.34, lng: -7.86 },
    { lat: 42.42, lng: -6.98 },
    { lat: 42.06, lng: -7.72 },
  ],
  'Palencia': [
    { lat: 42.01, lng: -4.53 },
    { lat: 42.79, lng: -4.26 },
  ],
  'Pontevedra': [
    { lat: 42.23, lng: -8.71 },
    { lat: 42.43, lng: -8.65 },
    { lat: 42.59, lng: -8.76 },
    { lat: 42.66, lng: -8.11 },
  ],
  'Salamanca': [
    { lat: 40.97, lng: -5.66 },
    { lat: 40.39, lng: -5.77 },
    { lat: 40.6, lng: -6.53 },
  ],
  'Santa Cruz de Tenerife': [
    { lat: 28.46, lng: -16.25 },
    { lat: 28.12, lng: -16.73 },
    { lat: 28.41, lng: -16.55 },
    { lat: 28.68, lng: -17.76 },
  ],
  'Segovia': [
    { lat: 40.95, lng: -4.12 },
    { lat: 41.4, lng: -4.31 },
  ],
  'Sevilla': [
    { lat: 37.39, lng: -5.98 },
    { lat: 37.34, lng: -5.84 },
    { lat: 37.54, lng: -5.08 },
    { lat: 37.19, lng: -5.78 },
    { lat: 37.39, lng: -6.2 },
  ],
  'Soria': [
    { lat: 41.77, lng: -2.46 },
    { lat: 41.48, lng: -2.53 },
  ],
  'Tarragona': [
    { lat: 41.12, lng: 1.25 },
    { lat: 41.22, lng: 1.53 },
    { lat: 40.81, lng: 0.52 },
    { lat: 41.29, lng: 1.25 },
  ],
  'Teruel': [
    { lat: 40.34, lng: -1.11 },
    { lat: 41.05, lng: -0.13 },
  ],
  'Toledo': [
    { lat: 39.86, lng: -4.02 },
    { lat: 39.96, lng: -4.83 },
    { lat: 40.12, lng: -3.85 },
  ],
  'Valencia': [
    { lat: 39.47, lng: -0.38, r: 20000 },
    { lat: 38.97, lng: -0.18 },
    { lat: 38.99, lng: -0.52 },
    { lat: 39.68, lng: -0.28 },
    { lat: 39.49, lng: -1.1 },
    { lat: 39.15, lng: -0.44 },
  ],
  'Valladolid': [
    { lat: 41.65, lng: -4.72 },
    { lat: 41.31, lng: -4.91 },
  ],
  'Zamora': [
    { lat: 41.5, lng: -5.75 },
    { lat: 42.0, lng: -5.68 },
  ],
  'Zaragoza': [
    { lat: 41.65, lng: -0.88 },
    { lat: 41.35, lng: -1.64 },
    { lat: 42.13, lng: -1.14 },
  ],
}

const CP_PROV: Record<string, string> = {
  '01': 'Álava',
  '02': 'Albacete',
  '03': 'Alicante',
  '04': 'Almería',
  '05': 'Ávila',
  '06': 'Badajoz',
  '07': 'Illes Balears',
  '08': 'Barcelona',
  '09': 'Burgos',
  '10': 'Cáceres',
  '11': 'Cádiz',
  '12': 'Castellón',
  '13': 'Ciudad Real',
  '14': 'Córdoba',
  '15': 'A Coruña',
  '16': 'Cuenca',
  '17': 'Girona',
  '18': 'Granada',
  '19': 'Guadalajara',
  '20': 'Gipuzkoa',
  '21': 'Huelva',
  '22': 'Huesca',
  '23': 'Jaén',
  '24': 'León',
  '25': 'Lleida',
  '26': 'La Rioja',
  '27': 'Lugo',
  '28': 'Madrid',
  '29': 'Málaga',
  '30': 'Murcia',
  '31': 'Navarra',
  '32': 'Ourense',
  '33': 'Asturias',
  '34': 'Palencia',
  '35': 'Las Palmas',
  '36': 'Pontevedra',
  '37': 'Salamanca',
  '38': 'Santa Cruz de Tenerife',
  '39': 'Cantabria',
  '40': 'Segovia',
  '41': 'Sevilla',
  '42': 'Soria',
  '43': 'Tarragona',
  '44': 'Teruel',
  '45': 'Toledo',
  '46': 'Valencia',
  '47': 'Valladolid',
  '48': 'Bizkaia',
  '49': 'Zamora',
  '50': 'Zaragoza',
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function sinTildes(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(s: string) {
  return sinTildes(s)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 160)
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const toR = (d: number) => (d * Math.PI) / 180
  const dLat = toR(lat2 - lat1)
  const dLng = toR(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

function fromCp(cp?: string | null) {
  const digits = String(cp || '').replace(/\D/g, '')
  if (digits.length < 2) return null
  return CP_PROV[digits.slice(0, 2)] || null
}

function fromAddress(dir?: string | null) {
  if (!dir) return null
  const cleaned = dir.replace(/\b(spain|españa|es)\b/gi, ' ')
  for (const nombre of Object.values(CP_PROV)) {
    if (new RegExp(`\\b${nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(cleaned)) {
      return nombre
    }
  }
  return null
}

async function nearby(p: Punto, keyword: string): Promise<any[]> {
  const out: any[] = []
  let pageToken: string | null = null
  for (let page = 0; page < 3; page++) {
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
    if (pageToken) {
      url.searchParams.set('pagetoken', pageToken)
    } else {
      url.searchParams.set('location', `${p.lat},${p.lng}`)
      url.searchParams.set('radius', String(Math.min(p.r || RADIO_DEFECTO, 50000)))
      url.searchParams.set('keyword', keyword)
    }
    url.searchParams.set('language', 'es')
    url.searchParams.set('key', googleKey!)
    const r = await fetch(url)
    const data: any = await r.json()
    if (data.status === 'ZERO_RESULTS') break
    if (data.status !== 'OK') {
      if (data.status !== 'INVALID_REQUEST') {
        console.warn('  Places', data.status, data.error_message || keyword)
      }
      break
    }
    out.push(...(data.results || []))
    pageToken = data.next_page_token || null
    if (!pageToken) break
    await sleep(2000) // el token tarda en activarse
  }
  return out
}

async function placeDetails(placeId: string) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('key', googleKey!)
  url.searchParams.set(
    'fields',
    'name,formatted_address,address_component,website,formatted_phone_number,international_phone_number,rating,user_ratings_total,types,business_status,url,geometry'
  )
  url.searchParams.set('language', 'es')
  const r = await fetch(url)
  const data: any = await r.json()
  if (data.status !== 'OK' || !data.result) return null
  const res = data.result
  const comps = res.address_components || []
  const get = (type: string) => comps.find((c: any) => c.types.includes(type))?.long_name || null
  const country = comps.find((c: any) => c.types.includes('country'))
  return {
    nombre: res.name as string,
    direccion: (res.formatted_address as string) || null,
    website: (res.website as string) || null,
    telefono: res.formatted_phone_number || res.international_phone_number || null,
    google_rating: res.rating ?? null,
    google_ratings_total: res.user_ratings_total ?? null,
    google_types: (res.types || null) as string[] | null,
    business_status: res.business_status || null,
    google_maps_url: res.url || null,
    latitud: res.geometry?.location?.lat as number,
    longitud: res.geometry?.location?.lng as number,
    ciudad: get('locality') || get('postal_town'),
    provinciaRaw: get('administrative_area_level_2'),
    comunidad: get('administrative_area_level_1'),
    codigo_postal: get('postal_code'),
    country: country?.short_name || null,
  }
}

const RUIDO_IMPORT =
  /área |area de |parking |aparkarea|camperizando|corte ingl[eé]s|^alquiler\b|alquiler\s+(de\s+)?(autocaravanas?|campers?|caravanas?|furgonetas?)|vacaciones en (autocaravana|camper)/i

/** Rótulos que ya dicen el oficio. Si no lo dicen, la web oficial tiene que decirlo. */
const NOMBRE_OFICIO = /taller|camperiz|reparac|fabricac|accesor|servicio|recambio/i

/**
 * true = web confirma oficio; false = flota / sin oficio (Caravan La Mancha);
 * null = sin web o no se pudo leer.
 */
async function leerWebOficial(website?: string | null): Promise<string | null> {
  if (!website) return null
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 10000)
    const r = await fetch(website, {
      signal: ctl.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; MapafurgoCasa)' },
    })
    clearTimeout(timer)
    if (!r.ok) return null
    return (await r.text()).slice(0, 400000)
  } catch {
    return null
  }
}

function provinciaDe(d: {
  codigo_postal?: string | null
  direccion?: string | null
  provinciaRaw?: string | null
}) {
  return (
    fromCp(d.codigo_postal) ||
    fromAddress(d.direccion) ||
    normalizarProvincia(d.provinciaRaw)?.nombre ||
    null
  )
}

function descripcionAlta(nombre: string, tipo: string, sitio: string): string {
  const donde = sitio ? ` en ${sitio}` : ' en España'
  if (tipo === 'autocaravanas') {
    return `${nombre} es un taller de reparación y mantenimiento de autocaravanas y caravanas${donde}.`
  }
  if (tipo === 'especialista') {
    return `${nombre} es un taller especialista en accesorios y equipamiento camper${donde}.`
  }
  return `${nombre} es un taller de camperización de furgonetas${donde}.`
}

type Existente = {
  id: string
  nombre: string
  slug: string
  activo: boolean
  google_place_id: string | null
  latitud: number
  longitud: number
  provincia: string | null
}

async function main() {
  if (!googleKey) {
    console.error('Falta GOOGLE_MAPS_API_KEY en .env.local')
    process.exit(1)
  }
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
  )

  const ours: Existente[] = []
  for (let p = 0; ; p++) {
    const { data, error } = await sb
      .from('talleres')
      .select('id,nombre,slug,activo,google_place_id,latitud,longitud,provincia')
      .range(p * 1000, (p + 1) * 1000 - 1)
    if (error) throw error
    if (!data?.length) break
    ours.push(...(data as Existente[]))
    if (data.length < 1000) break
  }

  const placeIds = new Set(ours.map((o) => o.google_place_id).filter(Boolean) as string[])
  const slugs = new Set(ours.map((o) => o.slug))
  const coords = ours
    .filter((o) => Number.isFinite(Number(o.latitud)) && Number.isFinite(Number(o.longitud)))
    .map((o) => ({ lat: Number(o.latitud), lng: Number(o.longitud) }))

  let provincias = Object.keys(PUNTOS)
  if (ARG_PROV) {
    provincias = provincias.filter((p) => sinTildes(p).includes(sinTildes(ARG_PROV)))
  }
  if (ARG_DESDE) {
    const i = provincias.findIndex((p) => sinTildes(p) === sinTildes(ARG_DESDE))
    if (i > 0) provincias = provincias.slice(i)
  }
  console.log(
    `Malla: ${provincias.length} provincias, ${KEYWORDS.length} keywords. Existentes: ${ours.length}. ${APPLY ? 'APPLY' : 'dry-run'}\n`
  )

  const vistos = new Set<string>()
  let totalAltas = 0
  const rechazos: string[] = []

  for (const prov of provincias) {
    const altas: Record<string, unknown>[] = []
    for (const punto of PUNTOS[prov]) {
      for (const kw of KEYWORDS) {
        const hits = await nearby(punto, kw)
        await sleep(120)
        for (const h of hits) {
          const pid = h.place_id as string | undefined
          if (!pid || vistos.has(pid)) continue
          vistos.add(pid)
          if (placeIds.has(pid)) continue
          const nombreHit = h.name || ''
          if (RUIDO_IMPORT.test(nombreHit)) {
            rechazos.push(`ruido · ${nombreHit}`)
            continue
          }
          // Sin señal camper en nombre o types no gastamos detalle: fuera Talleres López.
          if (!tieneSenalCamper(nombreHit, h.types || null)) {
            rechazos.push(`sin señal · ${nombreHit}`)
            continue
          }
          const d = await placeDetails(pid)
          await sleep(120)
          if (!d) continue
          if (d.country && d.country !== 'ES') {
            rechazos.push(`fuera ES · ${d.nombre}`)
            continue
          }
          if (d.business_status === 'CLOSED_PERMANENTLY') {
            rechazos.push(`cerrado · ${d.nombre}`)
            continue
          }
          if (d.latitud == null || d.longitud == null) continue
          if (
            !admiteTallerCamper(
              { nombre: d.nombre, types: d.google_types, website: d.website },
              { exigirSenal: true }
            ) ||
            RUIDO_IMPORT.test(d.nombre)
          ) {
            rechazos.push(`filtro · ${d.nombre}`)
            continue
          }
          const cerca = coords.find((x) => haversineM(d.latitud, d.longitud, x.lat, x.lng) < 150)
          if (cerca) {
            rechazos.push(`<150m · ${d.nombre}`)
            continue
          }
          const html = await leerWebOficial(d.website)
          if (html && webEsSoloFlota(html)) {
            rechazos.push(`web flota · ${d.nombre}`)
            continue
          }
          if (!NOMBRE_OFICIO.test(d.nombre) && html && !webConfirmaOficio(html)) {
            rechazos.push(`web sin oficio · ${d.nombre}`)
            continue
          }
          const provincia = provinciaDe(d) || prov
          const nombre = tituloTaller(d.nombre)
          let slug = slugify(`${nombre} ${provincia}`)
          if (!slug) slug = slugify(pid)
          let unique = slug
          let n = 2
          while (slugs.has(unique)) unique = `${slug}-${n++}`
          const sitio = [d.ciudad, provincia].filter(Boolean).join(', ')
          const tipo = tipoTaller({ nombre: d.nombre, google_types: d.google_types })
          altas.push({
            nombre,
            slug: unique,
            descripcion: descripcionAlta(nombre, tipo, sitio),
            latitud: d.latitud,
            longitud: d.longitud,
            direccion: d.direccion,
            codigo_postal: d.codigo_postal,
            ciudad: d.ciudad,
            provincia,
            comunidad: d.comunidad,
            pais: 'España',
            telefono: d.telefono,
            website: d.website,
            google_maps_url: d.google_maps_url,
            google_place_id: pid,
            google_rating: d.google_rating,
            google_ratings_total: d.google_ratings_total,
            google_types: d.google_types,
            quality_score: 0,
            verificado: false,
            activo: d.business_status !== 'CLOSED_TEMPORARILY',
          })
          slugs.add(unique)
          placeIds.add(pid)
          coords.push({ lat: d.latitud, lng: d.longitud })
          console.log(`  + [${tipo}] ${nombre} · ${d.ciudad || ''} ${provincia}`)
        }
      }
    }
    if (APPLY && altas.length) {
      let ok = 0
      for (const row of altas) {
        const { error } = await sb.from('talleres').insert(row)
        if (error) console.error('  FAIL', row.nombre, error.message)
        else ok++
      }
      console.log(`— ${prov}: insertadas ${ok}/${altas.length}`)
    } else {
      console.log(`— ${prov}: ${altas.length} candidatos`)
    }
    totalAltas += altas.length
  }

  console.log(`\nTotal candidatos: ${totalAltas}. Rechazos: ${rechazos.length}`)
  const sinSenal = rechazos.filter((r) => r.startsWith('sin señal')).length
  console.log(`  (sin señal ${sinSenal}, filtro/ruido/otros ${rechazos.length - sinSenal})`)
  if (!APPLY) console.log('Dry-run. Pasa --apply para escribir.')
  else {
    const { count } = await sb
      .from('talleres')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true)
    console.log(`Activos ahora: ${count}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
