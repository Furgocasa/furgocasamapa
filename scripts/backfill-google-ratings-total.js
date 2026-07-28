/**
 * Backfill de google_ratings_total (nº de valoraciones Google)
 * ===========================================================
 * Solo pide fields Atmosphere: rating,user_ratings_total (Place Details de pago).
 * Por defecto DRY-RUN. Requiere --confirm para escribir.
 *
 * Uso (PowerShell):
 *   node scripts/backfill-google-ratings-total.js
 *   node scripts/backfill-google-ratings-total.js --confirm
 *   $env:BACKFILL_LIMIT="200"; node scripts/backfill-google-ratings-total.js --confirm
 *
 * Prioriza áreas con google_rating (las que el chat usa en "mejores").
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const CONFIRM = process.argv.includes('--confirm')
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
    google_ratings_total: data.result.user_ratings_total ?? null
  }
}

async function main() {
  console.log(`⭐ Backfill google_ratings_total | limit=${LIMIT} | ${CONFIRM ? 'RUN' : 'DRY-RUN'}`)
  if (!CONFIRM) {
    console.log('👀 Sin --confirm no se llama a Google ni se escribe. Añade --confirm para ejecutar.\n')
  }

  const { data: areas, error } = await supabase
    .from('areas')
    .select('id,nombre,google_place_id,google_rating,google_ratings_total')
    .eq('activo', true)
    .not('google_place_id', 'is', null)
    .is('google_ratings_total', null)
    .not('google_rating', 'is', null)
    .order('google_rating', { ascending: false })
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
  for (let i = 0; i < areas.length; i++) {
    const area = areas[i]
    process.stdout.write(`[${i + 1}/${areas.length}] ${area.nombre.slice(0, 50)}... `)
    try {
      const det = await fetchRatings(area.google_place_id)
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
  console.log(`OK: ${ok} | Fallos: ${fail}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
