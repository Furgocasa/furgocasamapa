/**
 * Alta de camperizadores que salen en Camperizando y no están en `talleres`.
 * Datos de ficha: Google Places. No copia textos de camperizando.es.
 *
 *   node scripts/import-talleres-camperizando.mjs
 *   node scripts/import-talleres-camperizando.mjs --apply
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const here = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(here, '..', '.env.local') })

const APPLY = process.argv.includes('--apply')
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } }
)
const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

const SKIP = /alquiler|alquicamper|rent\s*&?\s*drive|rent and drive|^camperizando\b/i
const REJECT_HIT = /furgocasa|camperizando\s*-|parking caravanas|pide presupuesto|\brental\b/i

const PROV_ALIAS = {
  coruna: 'A Coruña',
  'a coruna': 'A Coruña',
  alava: 'Álava',
  araba: 'Álava',
  alacant: 'Alicante',
  asturias: 'Asturias',
  baleares: 'Illes Balears',
  'illes balears': 'Illes Balears',
  mallorca: 'Illes Balears',
  menorca: 'Illes Balears',
  ibiza: 'Illes Balears',
  eivissa: 'Illes Balears',
  castellon: 'Castellón',
  castello: 'Castellón',
  gerona: 'Girona',
  guipuzcoa: 'Gipuzkoa',
  gipuzkoa: 'Gipuzkoa',
  vizcaya: 'Bizkaia',
  bizkaia: 'Bizkaia',
  lerida: 'Lleida',
  lleida: 'Lleida',
  orense: 'Ourense',
  ourense: 'Ourense',
  navarra: 'Navarra',
  nafarroa: 'Navarra',
  tenerife: 'Santa Cruz de Tenerife',
  'santa cruz de tenerife': 'Santa Cruz de Tenerife',
  valencia: 'Valencia',
  valencia: 'Valencia',
}

function decodeHtml(s) {
  return String(s || '')
    .replace(/&#038;|&amp;/g, '&')
    .replace(/&#8217;|&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, '')
    .trim()
}

function sinTildes(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(s) {
  return sinTildes(s)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 160)
}

function coreName(s) {
  return sinTildes(decodeHtml(s))
    .replace(
      /\b(taller|talleres|camperizacion|camperizaciones|camperitzar|de|del|la|el|los|las|furgonetas|furgoneta|autocaravanas|autocaravana|vehiculo|vehiculos|sl|slu|sll|sa|cb|y|en)\b/g,
      ' '
    )
    .replace(/[^a-z0-9]+/g, '')
}

function tokens(s) {
  return new Set(
    sinTildes(decodeHtml(s))
      .split(/[^a-z0-9]+/)
      .filter(
        (w) =>
          w.length >= 4 &&
          !['camper', 'campers', 'taller', 'vans', 'van', 'furgo', 'furgoneta', 'furgonetas', 'madrid', 'barcelona', 'espana', 'alquiler', 'venta', 'autocaravanas'].includes(w)
      )
  )
}

function sameWorkshop(a, b) {
  const ca = coreName(a)
  const cb = coreName(b)
  if (ca.length >= 5 && cb.length >= 5 && (ca === cb || ca.includes(cb) || cb.includes(ca))) return true
  const ta = tokens(a)
  const tb = tokens(b)
  if (!ta.size || !tb.size) return false
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter++
  return inter >= 1 && (ta.size === 1 || tb.size === 1 || inter >= 2)
}

function normalizaProvincia(raw) {
  if (!raw) return null
  const n = sinTildes(raw)
  if (PROV_ALIAS[n]) return PROV_ALIAS[n]
  const titled = raw.trim()
  return titled || null
}

function haversineM(aLat, aLng, bLat, bLng) {
  const R = 6371000
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchCamperizando() {
  const out = []
  for (let p = 1; p <= 5; p++) {
    const r = await fetch(
      `https://camperizando.es/wp-json/wp/v2/camperizador?per_page=100&page=${p}&_fields=id,slug,title,link`
    )
    if (!r.ok) break
    const rows = await r.json()
    if (!Array.isArray(rows) || !rows.length) break
    for (const row of rows) {
      out.push({
        slug: row.slug,
        title: decodeHtml(row.title?.rendered),
        link: row.link,
      })
    }
    if (rows.length < 100) break
  }
  return out
}

async function ciudadDeFicha(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'MapafurgoCasaBot/1.0' } })
    if (!r.ok) return null
    const html = await r.text()
    const lis = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((m) => decodeHtml(m[1]).replace(/\s+/g, ' ').replace(/,$/, '').trim())
      .filter((t) => t && t.length < 80 && !/estrella|valoraci|horario|lunes|especial/i.test(t))
    const clean = lis.filter((t) => !/pide presupuesto|contacto|cookies|privacidad/i.test(t))
    const withCity = clean.find((t) => /,\s*[A-ZÁÉÍÓÚÑ]/.test(t) || /^\d{5}/.test(t))
    if (withCity) {
      const city = withCity.replace(/^\d{5}\s*/, '').split(',')[0].trim()
      return city || null
    }
    return clean[0] || null
  } catch {
    return null
  }
}

async function placesTextSearch(query) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', query)
  url.searchParams.set('region', 'es')
  url.searchParams.set('language', 'es')
  url.searchParams.set('key', googleKey)
  const r = await fetch(url)
  const data = await r.json()
  if (data.status === 'ZERO_RESULTS') return []
  if (data.status !== 'OK') {
    console.warn('  Places', data.status, data.error_message || '')
    return []
  }
  return data.results || []
}

async function placeDetails(placeId) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('key', googleKey)
  url.searchParams.set(
    'fields',
    'name,formatted_address,address_component,website,formatted_phone_number,international_phone_number,rating,user_ratings_total,types,business_status,url,geometry'
  )
  url.searchParams.set('language', 'es')
  const r = await fetch(url)
  const data = await r.json()
  if (data.status !== 'OK' || !data.result) return null
  const res = data.result
  const comps = res.address_components || []
  const get = (type) => comps.find((c) => c.types.includes(type))?.long_name || null
  const country = comps.find((c) => c.types.includes('country'))
  return {
    nombre: res.name,
    direccion: res.formatted_address || null,
    website: res.website || null,
    telefono: res.formatted_phone_number || res.international_phone_number || null,
    google_rating: res.rating ?? null,
    google_ratings_total: res.user_ratings_total ?? null,
    google_types: res.types || null,
    business_status: res.business_status || null,
    google_maps_url: res.url || null,
    latitud: res.geometry?.location?.lat,
    longitud: res.geometry?.location?.lng,
    ciudad: get('locality') || get('postal_town') || null,
    provinciaRaw: get('administrative_area_level_2'),
    comunidad: get('administrative_area_level_1'),
    codigo_postal: get('postal_code'),
    country: country?.short_name || null,
  }
}

function pickHit(hits, title) {
  const want = tokens(title)
  const scored = []
  for (const h of hits) {
    if (REJECT_HIT.test(h.name)) continue
    if ((h.types || []).includes('car_rental')) continue
    if (/alquiler/i.test(h.name) && !/alquiler/i.test(title)) continue
    const got = tokens(h.name)
    let inter = 0
    for (const t of want) if (got.has(t)) inter++
    const same = sameWorkshop(title, h.name)
    if (!same && want.size && inter === 0) continue
    let score = inter * 3
    if (same) score += 5
    if (/camper|van|furgo|caravan|autocaravan/i.test(h.name)) score += 1
    scored.push({ h, score, inter, same })
  }
  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]
  if (!best || (!best.same && best.inter < 1)) return null
  return best.h
}

function descripcion(nombre, ciudad, provincia, rating, reviews) {
  const sitio = [ciudad, provincia].filter(Boolean).join(', ')
  const donde = sitio ? ` en ${sitio}` : ' en España'
  const stars =
    rating && reviews
      ? ` En Google tiene ${Number(rating).toFixed(1)}★ (${reviews} reseñas).`
      : rating
        ? ` En Google tiene ${Number(rating).toFixed(1)}★.`
        : ''
  return `${nombre} es un taller de camperizado y accesorios para furgonetas${donde}.${stars}`
}

async function main() {
  if (!googleKey) {
    console.error('Falta GOOGLE_MAPS_API_KEY en .env.local')
    process.exit(1)
  }

  const { data: ours, error } = await sb
    .from('talleres')
    .select('id, nombre, slug, activo, google_place_id, latitud, longitud')
  if (error) throw error

  const placeIds = new Set(ours.map((o) => o.google_place_id).filter(Boolean))
  const slugs = new Set(ours.map((o) => o.slug))
  const coords = ours
    .filter((o) => o.latitud != null && o.longitud != null)
    .map((o) => ({ lat: Number(o.latitud), lng: Number(o.longitud), id: o.id, activo: o.activo }))

  const theirs = await fetchCamperizando()
  const faltan = []
  const ya = []
  const reactivar = []

  for (const c of theirs) {
    if (SKIP.test(sinTildes(c.title))) continue
    const hit = ours.find((o) => sameWorkshop(c.title, o.nombre))
    if (hit?.activo) ya.push(c.title)
    else if (hit && !hit.activo) reactivar.push(hit)
    else faltan.push(c)
  }

  console.log(
    `Camperizando ${theirs.length}. Ya activos ${ya.length}. Inactivos a revisar ${reactivar.length}. A buscar ${faltan.length}.`
  )
  if (reactivar.length) {
    console.log(
      'Inactivos que ellos tienen:',
      reactivar.map((r) => r.nombre).join(' · ')
    )
  }

  const altas = []
  const sinPlace = []

  for (const c of faltan) {
    const ciudadHint = await ciudadDeFicha(c.link)
    await sleep(80)
    const ciudadOk =
      ciudadHint && !/pide presupuesto|contacto|^blog$/i.test(ciudadHint) ? ciudadHint : null
    const queries = [
      [c.title, 'camperización', ciudadOk, 'España'].filter(Boolean).join(' '),
      `${c.title} camper España`,
    ]
    let picked = null
    for (const q of queries) {
      const hits = await placesTextSearch(q)
      await sleep(120)
      picked = pickHit(hits, c.title)
      if (picked) break
    }
    if (!picked?.place_id) {
      sinPlace.push(`${c.title} (${ciudadOk || 'sin ciudad'})`)
      continue
    }
    if (placeIds.has(picked.place_id)) {
      console.log('  ya en BD', c.title, '→', picked.name)
      continue
    }
    const d = await placeDetails(picked.place_id)
    await sleep(120)
    if (!d || d.country && d.country !== 'ES') {
      sinPlace.push(`${c.title} (fuera ES o sin detalle)`)
      continue
    }
    if (d.business_status === 'CLOSED_PERMANENTLY') {
      sinPlace.push(`${c.title} (cerrado)`)
      continue
    }
    if (d.latitud == null || d.longitud == null) {
      sinPlace.push(`${c.title} (sin coords)`)
      continue
    }
    const cerca = coords.find((x) => haversineM(d.latitud, d.longitud, x.lat, x.lng) < 120)
    if (cerca) {
      console.log('  cerca de existente', c.title, '→ skip')
      continue
    }

    const provincia = normalizaProvincia(d.provinciaRaw)
    if (
      REJECT_HIT.test(d.nombre || '') ||
      (/alquiler/i.test(d.nombre || '') && !/alquiler/i.test(c.title))
    ) {
      sinPlace.push(`${c.title} (hit alquiler/ruido: ${d.nombre})`)
      continue
    }
    const nombre = d.nombre || c.title
    let slug = slugify(`${nombre} ${provincia || d.ciudad || ''}`)
    if (!slug) slug = slugify(picked.place_id)
    let unique = slug
    let n = 2
    while (slugs.has(unique)) unique = `${slug}-${n++}`

    altas.push({
      nombre,
      slug: unique,
      descripcion: descripcion(nombre, d.ciudad, provincia, d.google_rating, d.google_ratings_total),
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
      google_place_id: picked.place_id,
      google_rating: d.google_rating,
      google_ratings_total: d.google_ratings_total,
      google_types: d.google_types,
      quality_score: 0,
      verificado: false,
      activo: d.business_status !== 'CLOSED_TEMPORARILY',
    })
    slugs.add(unique)
    placeIds.add(picked.place_id)
    coords.push({ lat: d.latitud, lng: d.longitud, id: unique, activo: true })
    console.log(`  + ${nombre} · ${d.ciudad || ''} ${provincia || ''}`)
  }

  console.log(`\nAltas: ${altas.length}. Sin Place: ${sinPlace.length}`)
  if (sinPlace.length) console.log(sinPlace.join('\n'))

  if (!APPLY) {
    console.log('\nDry-run. Pasa --apply para escribir.')
    return
  }

  const idsReactivar = reactivar
    .filter((r) => !/buenas ruedas/i.test(r.nombre))
    .map((r) => r.id)
  if (idsReactivar.length) {
    const { error: eR } = await sb.from('talleres').update({ activo: true, updated_at: new Date().toISOString() }).in('id', idsReactivar)
    if (eR) console.error('Reactivar', eR.message)
    else console.log('Reactivados', idsReactivar.length)
  }

  let ok = 0
  for (let i = 0; i < altas.length; i += 40) {
    const chunk = altas.slice(i, i + 40)
    const { error: eI } = await sb.from('talleres').insert(chunk)
    if (eI) {
      console.error('Insert', eI.message)
      for (const row of chunk) {
        const { error: e1 } = await sb.from('talleres').insert(row)
        if (e1) console.error('  ', row.nombre, e1.message)
        else ok++
      }
    } else ok += chunk.length
  }
  const { count } = await sb.from('talleres').select('*', { count: 'exact', head: true }).eq('activo', true)
  console.log(`Insertadas ${ok}. Activos ahora: ${count}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
