/**
 * Backfill de google_ratings_total (nº de valoraciones Google)
 * ===========================================================
 * Solo pide fields Atmosphere: rating,user_ratings_total (Place Details de pago).
 * Por defecto DRY-RUN. Requiere --confirm para escribir.
 *
 * Uso (PowerShell):
 *   node scripts/backfill-google-ratings-total.js
 *   node scripts/backfill-google-ratings-total.js --confirm
 *   node scripts/backfill-google-ratings-total.js --confirm --recover
 *   $env:BACKFILL_LIMIT="200"; node scripts/backfill-google-ratings-total.js --confirm
 *
 * --recover: para los place_id NOT_FOUND, intenta Find Place From Text
 *            y si falla marca google_ratings_total=0 (cierra la cola).
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const CONFIRM = process.argv.includes('--confirm')
const RECOVER = process.argv.includes('--recover')
const LIMIT = parseInt(process.env.BACKFILL_LIMIT || '300', 10)
const DELAY_MS = parseInt(process.env.BACKFILL_DELAY_MS || '120', 10)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

if (!supabaseUrl || !supabaseKey || !googleApiKey) {
  console.error('Faltan credenciales: Supabase y/o Google Places API key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchRatings(placeId) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('key', googleApiKey)
  url.searchParams.set('fields', 'rating,user_ratings_total')
  const res = await fetch(url.toString())
  const data = await res.json()
  if (data.status !== 'OK' || !data.result) {
    return { error: data.status || 'NO_RESULT' }
  }
  return {
    google_rating: data.result.rating ?? null,
    // Sin reseñas Google omite el campo → 0 cierra la cola (null = aún desconocido)
    google_ratings_total: data.result.user_ratings_total ?? 0
  }
}

async function findPlaceId(nombre, ciudad, pais) {
  const query = [nombre, ciudad, pais].filter(Boolean).join(', ')
  const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json')
  url.searchParams.set('input', query)
  url.searchParams.set('inputtype', 'textquery')
  url.searchParams.set('fields', 'place_id,name,rating,user_ratings_total')
  url.searchParams.set('key', googleApiKey)
  const res = await fetch(url.toString())
  const data = await res.json()
  if (data.status !== 'OK' || !data.candidates?.[0]) {
    return { error: data.status || 'NO_CANDIDATE' }
  }
  const c = data.candidates[0]
  return {
    google_place_id: c.place_id,
    google_rating: c.rating ?? null,
    google_ratings_total: c.user_ratings_total ?? null
  }
}

async function main() {
  console.log(`⭐ Backfill google_ratings_total | limit=${LIMIT} | ${CONFIRM ? 'RUN' : 'DRY-RUN'}${RECOVER ? ' | RECOVER' : ''}`)
  if (!CONFIRM) {
    console.log('👀 Sin --confirm no se llama a Google ni se escribe. Añade --confirm para ejecutar.\n')
  }

  // Incluye residuales con rating NULL (tienen place_id pero nunca se rellenó el total)
  const { data: areas, error } = await supabase
    .from('areas')
    .select('id,nombre,ciudad,pais,google_place_id,google_rating,google_ratings_total')
    .eq('activo', true)
    .not('google_place_id', 'is', null)
    .is('google_ratings_total', null)
    .order('nombre', { ascending: true })
    .limit(LIMIT)

  if (error) {
    console.error('❌ Error leyendo áreas (¿migración google_ratings_total ejecutada?):', error.message)
    process.exit(1)
  }

  console.log(`📋 Pendientes en este lote: ${areas.length}`)
  if (!CONFIRM || areas.length === 0) {
    if (areas.length) {
      console.log('Ejemplos:')
      areas.slice(0, 5).forEach((a) => console.log(`  - ${a.nombre} ★${a.google_rating}`))
    }
    return
  }

  let ok = 0
  let fail = 0
  let recovered = 0
  let zeroed = 0

  for (let i = 0; i < areas.length; i++) {
    const area = areas[i]
    process.stdout.write(`[${i + 1}/${areas.length}] ${area.nombre.slice(0, 50)}... `)
    try {
      let det = await fetchRatings(area.google_place_id)

      if (det.error === 'NOT_FOUND' && RECOVER) {
        const found = await findPlaceId(area.nombre, area.ciudad, area.pais)
        await delay(DELAY_MS)
        if (!found.error && found.google_ratings_total != null) {
          const patchFull = {
            google_place_id: found.google_place_id,
            google_ratings_total: found.google_ratings_total
          }
          if (found.google_rating != null) patchFull.google_rating = found.google_rating
          let { error: upErr } = await supabase.from('areas').update(patchFull).eq('id', area.id)
          // Si el place_id nuevo ya existe en otra fila, guarda solo el nº de reseñas
          if (upErr && /duplicate|unique/i.test(upErr.message || '')) {
            const patchSoft = { google_ratings_total: found.google_ratings_total }
            if (found.google_rating != null) patchSoft.google_rating = found.google_rating
            ;({ error: upErr } = await supabase.from('areas').update(patchSoft).eq('id', area.id))
          }
          if (upErr) {
            console.log('✗ DB', upErr.message)
            fail++
          } else {
            console.log(`♻️ ★${found.google_rating} (${found.google_ratings_total})`)
            recovered++
            ok++
          }
          await delay(DELAY_MS)
          continue
        }
        // Cerrar cola: place muerto sin sustituto
        const { error: zErr } = await supabase
          .from('areas')
          .update({ google_ratings_total: 0 })
          .eq('id', area.id)
        if (zErr) {
          console.log('✗ zero', zErr.message)
          fail++
        } else {
          console.log('⌀ 0 (place_id muerto)')
          zeroed++
          ok++
        }
        await delay(DELAY_MS)
        continue
      }

      if (det.error) {
        console.log('✗', det.error)
        fail++
      } else {
        const patch = { google_ratings_total: det.google_ratings_total }
        if (det.google_rating != null && area.google_rating == null) {
          patch.google_rating = det.google_rating
        }
        const { error: upErr } = await supabase.from('areas').update(patch).eq('id', area.id)
        if (upErr) {
          console.log('✗ DB', upErr.message)
          fail++
        } else {
          console.log(`✅ ★${det.google_rating} (${det.google_ratings_total})`)
          ok++
        }
      }
    } catch (e) {
      console.log('✗', e.message)
      fail++
    }
    await delay(DELAY_MS)
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━')
  console.log(`OK: ${ok} | Fallos: ${fail} | Recuperados: ${recovered} | Marcados 0: ${zeroed}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
