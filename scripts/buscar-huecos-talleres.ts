/**
 * Huecos de talleres: provincias con 0–2 activos. Places, no malla de sierras.
 *
 *   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"
 *   npx ts-node --project tsconfig.scripts.json scripts/buscar-huecos-talleres.ts
 *   npx ts-node --project tsconfig.scripts.json scripts/buscar-huecos-talleres.ts --apply
 *
 * Tope: HUECO_MAX=2  (provincias con como mucho N talleres)
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PROVINCIAS_ES, normalizarProvincia } from '../lib/areas/provincias'
import { admiteTallerCamper, tituloTaller } from '../lib/talleres/seo-snippet'

const APPLY = process.argv.includes('--apply')
const HUECO_MAX = Math.max(0, parseInt(process.env.HUECO_MAX || '2', 10) || 2)
const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

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

const SKIP_PROV = new Set(['Ceuta', 'Melilla'])

const QUERIES = (prov: string) => [
  `taller reparación autocaravanas ${prov}`,
  `taller camperización ${prov}`,
  `reparar camper ${prov}`,
]

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

async function placesTextSearch(query: string): Promise<any[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', query)
  url.searchParams.set('region', 'es')
  url.searchParams.set('language', 'es')
  url.searchParams.set('key', googleKey!)
  const r = await fetch(url)
  const data: any = await r.json()
  if (data.status === 'ZERO_RESULTS') return []
  if (data.status !== 'OK') {
    console.warn('  Places', data.status, data.error_message || query)
    return []
  }
  return data.results || []
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
  /\balquiler\b|área |area de |parking |aparkarea|camperizando|corte ingles|concesionario|venta de /i
const OFICIO =
  /taller|camperiz|reparac|fabricac|conversi[oó]n|officina|werkstatt/i

function mismoProv(a?: string | null, b?: string | null) {
  const ca = normalizarProvincia(a)?.nombre || a
  const cb = normalizarProvincia(b)?.nombre || b
  return !!ca && !!cb && sinTildes(ca) === sinTildes(cb)
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

  const activos = ours.filter((t) => t.activo)
  const porProv = new Map<string, number>()
  for (const p of PROVINCIAS_ES) porProv.set(p.nombre, 0)
  for (const t of activos) {
    const canon = normalizarProvincia(t.provincia)?.nombre || t.provincia || '(sin)'
    porProv.set(canon, (porProv.get(canon) || 0) + 1)
  }

  console.log('Cobertura activos por provincia:')
  const finas: string[] = []
  for (const p of PROVINCIAS_ES) {
    if (SKIP_PROV.has(p.nombre)) continue
    const n = porProv.get(p.nombre) || 0
    if (n <= HUECO_MAX) {
      finas.push(p.nombre)
      console.log(`  ${String(n).padStart(2)}  ${p.nombre}  ← hueco`)
    }
  }
  console.log(`Huecos (≤${HUECO_MAX}): ${finas.length}. Activos: ${activos.length}\n`)

  const placeIds = new Set(ours.map((o) => o.google_place_id).filter(Boolean) as string[])
  const slugs = new Set(ours.map((o) => o.slug))
  const coords = ours
    .filter((o) => Number.isFinite(Number(o.latitud)) && Number.isFinite(Number(o.longitud)))
    .map((o) => ({ lat: Number(o.latitud), lng: Number(o.longitud) }))

  const vistos = new Set<string>()
  const altas: Record<string, unknown>[] = []
  const rechazos: string[] = []

  for (const prov of finas) {
    console.log(`— ${prov}`)
    for (const q of QUERIES(prov)) {
      const hits = await placesTextSearch(q)
      await sleep(120)
      for (const h of hits) {
        const pid = h.place_id as string | undefined
        if (!pid || vistos.has(pid)) continue
        vistos.add(pid)
        if (placeIds.has(pid)) {
          rechazos.push(`ya place_id · ${h.name}`)
          continue
        }
        if (RUIDO_IMPORT.test(h.name || '') || !OFICIO.test(h.name || '')) {
          rechazos.push(`filtro nombre · ${h.name}`)
          continue
        }
        const d = await placeDetails(pid)
        await sleep(120)
        if (!d) {
          rechazos.push(`sin detalle · ${h.name}`)
          continue
        }
        if (d.country && d.country !== 'ES') {
          rechazos.push(`fuera ES · ${d.nombre}`)
          continue
        }
        if (d.business_status === 'CLOSED_PERMANENTLY') {
          rechazos.push(`cerrado · ${d.nombre}`)
          continue
        }
        if (d.latitud == null || d.longitud == null) {
          rechazos.push(`sin coords · ${d.nombre}`)
          continue
        }
        if (
          !admiteTallerCamper({ nombre: d.nombre, types: d.google_types }, { exigirSenal: true }) ||
          RUIDO_IMPORT.test(d.nombre) ||
          !OFICIO.test(d.nombre)
        ) {
          rechazos.push(`filtro · ${d.nombre}`)
          continue
        }
        const provinciaHit = provinciaDe(d)
        if (provinciaHit && !mismoProv(provinciaHit, prov)) {
          rechazos.push(`otra prov ${provinciaHit} · ${d.nombre}`)
          continue
        }
        const cerca = coords.find((x) => haversineM(d.latitud, d.longitud, x.lat, x.lng) < 150)
        if (cerca) {
          rechazos.push(`<150m · ${d.nombre}`)
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
        altas.push({
          nombre,
          slug: unique,
          descripcion: `${nombre} es un taller de camperizado y reparación de autocaravanas${sitio ? ` en ${sitio}` : ' en España'}.`,
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
        console.log(`  + ${nombre} · ${d.ciudad || ''} ${provincia}`)
      }
    }
  }

  console.log(`\nCandidatos: ${altas.length}`)
  for (const a of altas) {
    console.log(`  ${(a.nombre as string).padEnd(40)} ${(a.ciudad as string) || ''} / ${a.provincia}`)
  }
  const filtroN = rechazos.filter((r) => r.startsWith('filtro')).length
  console.log(`Rechazos: ${rechazos.length} (filtro ${filtroN}, resto ya/cerrado/fuera)`)

  if (!APPLY) {
    console.log('\nDry-run. Pasa --apply para escribir.')
    return
  }

  let ok = 0
  for (const row of altas) {
    const { error } = await sb.from('talleres').insert(row)
    if (error) {
      console.error('  FAIL', row.nombre, error.message)
      continue
    }
    ok++
  }
  const { count } = await sb.from('talleres').select('*', { count: 'exact', head: true }).eq('activo', true)
  console.log(`Insertadas ${ok}/${altas.length}. Activos ahora: ${count}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
