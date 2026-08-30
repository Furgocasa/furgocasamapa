/**
 * Copia talleres camper desde Supabase de Furgocasa a MapafurgoCasa.
 * Solo category=taller_camper. Concesionarios no viajan.
 *
 * Uso (desde webmapafurgocasa):
 *   node scripts/import-talleres-desde-furgocasa.mjs
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const here = dirname(fileURLToPath(import.meta.url))
const mapaRoot = resolve(here, '..')
const furgocasaRoot = resolve(mapaRoot, '..', 'webfurgocasa')

config({ path: resolve(furgocasaRoot, '.env.local') })
const srcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const srcKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

config({ path: resolve(mapaRoot, '.env.local'), override: true })
const dstUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const dstKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

if (!srcUrl || !srcKey || !dstUrl || !dstKey) {
  console.error('Faltan credenciales. Origen: webfurgocasa/.env.local · Destino: webmapafurgocasa/.env.local')
  process.exit(1)
}
if (srcUrl === dstUrl) {
  console.error('Origen y destino son el mismo proyecto. Abortado.')
  process.exit(1)
}

const src = createClient(srcUrl, srcKey, { auth: { persistSession: false } })
const dst = createClient(dstUrl, dstKey, { auth: { persistSession: false } })

const PROVINCIAS = [
  ['A Coruña', ['La Coruña', 'Coruña']],
  ['Álava', ['Araba', 'Araba/Álava']],
  ['Albacete', []],
  ['Alicante', ['Alacant', 'Alicante/Alacant']],
  ['Almería', []],
  ['Asturias', ['Principado de Asturias']],
  ['Ávila', []],
  ['Badajoz', []],
  ['Barcelona', []],
  ['Bizkaia', ['Vizcaya']],
  ['Burgos', []],
  ['Cáceres', []],
  ['Cádiz', []],
  ['Cantabria', []],
  ['Castellón', ['Castelló', 'Castellón/Castelló']],
  ['Ciudad Real', []],
  ['Córdoba', []],
  ['Cuenca', []],
  ['Girona', ['Gerona']],
  ['Gipuzkoa', ['Guipúzcoa']],
  ['Granada', []],
  ['Guadalajara', []],
  ['Huelva', []],
  ['Huesca', []],
  ['Illes Balears', ['Islas Baleares', 'Baleares', 'Mallorca', 'Menorca', 'Ibiza']],
  ['Jaén', []],
  ['La Rioja', []],
  ['Las Palmas', []],
  ['León', []],
  ['Lleida', ['Lérida']],
  ['Lugo', []],
  ['Madrid', ['Comunidad de Madrid']],
  ['Málaga', []],
  ['Murcia', ['Región de Murcia']],
  ['Navarra', ['Nafarroa']],
  ['Ourense', ['Orense']],
  ['Palencia', []],
  ['Pontevedra', []],
  ['Salamanca', []],
  ['Santa Cruz de Tenerife', ['Tenerife']],
  ['Segovia', []],
  ['Sevilla', []],
  ['Soria', []],
  ['Tarragona', []],
  ['Teruel', []],
  ['Toledo', []],
  ['Valencia', ['València', 'Valencia/València']],
  ['Valladolid', []],
  ['Zamora', []],
  ['Zaragoza', []],
]

function sinTildes(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const porNombre = new Map()
for (const [nombre, aliases] of PROVINCIAS) {
  porNombre.set(sinTildes(nombre), nombre)
  for (const a of aliases) porNombre.set(sinTildes(a), nombre)
}

function provinciaDeTexto(...textos) {
  const blob = sinTildes(textos.filter(Boolean).join(' | '))
  if (!blob) return null
  const hits = []
  for (const [key, nombre] of porNombre) {
    if (key.length < 3) continue
    if (blob.includes(key)) hits.push({ nombre, len: key.length })
  }
  hits.sort((a, b) => b.len - a.len)
  return hits[0]?.nombre || null
}

function ciudadDeDireccion(address, provincia) {
  if (!address) return null
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  const skip = new Set(['spain', 'espana', 'españa', sinTildes(provincia || '')])
  for (let i = parts.length - 1; i >= 0; i--) {
    const raw = parts[i].replace(/^\d{5}\s+/, '').trim()
    const n = sinTildes(raw)
    if (!n || skip.has(n) || porNombre.has(n)) continue
    if (/^\d+$/.test(n)) continue
    return raw
  }
  return null
}

function codigoPostal(address) {
  const m = String(address || '').match(/\b(\d{5})\b/)
  return m ? m[1] : null
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180)
}

function descripcionInicial(row, ciudad, provincia) {
  const sitio = [ciudad, provincia].filter(Boolean).join(', ')
  const donde = sitio ? ` en ${sitio}` : ' en España'
  const rating =
    row.rating && row.review_count
      ? ` En Google tiene ${Number(row.rating).toFixed(1)}★ (${row.review_count} reseñas).`
      : row.rating
        ? ` En Google tiene ${Number(row.rating).toFixed(1)}★.`
        : ''
  return `${row.name} es un taller de campers y autocaravanas${donde}.${rating}`
}

async function fetchAll() {
  const all = []
  let from = 0
  for (;;) {
    const { data, error } = await src
      .from('motorhome_services')
      .select('*')
      .eq('category', 'taller_camper')
      .range(from, from + 999)
    if (error) throw error
    all.push(...(data || []))
    if (!data || data.length < 1000) break
    from += 1000
  }
  return all
}

async function main() {
  const rows = await fetchAll()
  const slugs = new Set()
  const payload = []
  let galiciaFixed = 0
  let sinProv = 0

  for (const row of rows) {
    if (!row.latitude || !row.longitude) continue
    const rawProv = row.province === 'Galicia' ? null : row.province
    const provincia =
      provinciaDeTexto(rawProv) ||
      provinciaDeTexto(row.address, row.region, row.province) ||
      null
    if (row.province === 'Galicia' && provincia) galiciaFixed++
    if (!provincia) sinProv++
    const ciudad = ciudadDeDireccion(row.address, provincia)
    let slug = slugify(row.slug || `${row.name} ${provincia || ''}`)
    if (!slug) slug = slugify(row.id)
    let unique = slug
    let n = 2
    while (slugs.has(unique)) {
      unique = `${slug}-${n++}`
    }
    slugs.add(unique)

    const operativo = row.status === 'active' && row.operational_status === 'OPERATIONAL'
    payload.push({
      origen_id: row.id,
      nombre: row.name,
      slug: unique,
      descripcion: descripcionInicial(row, ciudad, provincia),
      latitud: row.latitude,
      longitud: row.longitude,
      direccion: row.address,
      codigo_postal: codigoPostal(row.address),
      ciudad,
      provincia,
      comunidad: row.region,
      pais: 'España',
      telefono: row.phone,
      email: row.email,
      website: row.website,
      google_maps_url: row.google_maps_url,
      google_place_id: row.place_id || null,
      google_rating: row.rating,
      google_ratings_total: row.review_count,
      google_types: row.google_types,
      opening_hours: row.opening_hours,
      quality_score: row.quality_score || 0,
      verificado: false,
      activo: operativo,
    })
  }

  console.log(`Origen: ${rows.length} talleres. A upsert: ${payload.length}. Galicia corregidas: ${galiciaFixed}. Sin provincia: ${sinProv}`)

  let ok = 0
  for (let i = 0; i < payload.length; i += 100) {
    const chunk = payload.slice(i, i + 100)
    const { error } = await dst.from('talleres').upsert(chunk, { onConflict: 'google_place_id' })
    if (error) {
      const { error: e2 } = await dst.from('talleres').upsert(chunk, { onConflict: 'slug' })
      if (e2) {
        console.error('Chunk', i, e2.message)
        continue
      }
    }
    ok += chunk.length
    console.log(`  ${ok}/${payload.length}`)
  }

  const { count: activos } = await dst.from('talleres').select('*', { count: 'exact', head: true }).eq('activo', true)
  const { count: total } = await dst.from('talleres').select('*', { count: 'exact', head: true })
  console.log(`Destino: ${total} filas, ${activos} activas`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
