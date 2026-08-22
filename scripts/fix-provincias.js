/**
 * Normaliza `areas.provincia` en España (GUIA_MAPA_ALQUILER.md §15).
 *
 * - Variantes conocidas («Lérida», «Vizcaya») → nombre canónico.
 * - Valores sucios (códigos postales, calles, pueblos) → reverse geocoding
 *   con Nominatim (1 req/seg) y solo se acepta si devuelve una provincia
 *   canónica. Si el área no tiene ciudad, se rellena también.
 *
 * Uso:
 *   node scripts/fix-provincias.js            → dry-run (no escribe)
 *   APPLY=1 node scripts/fix-provincias.js    → aplica cambios
 *
 * Genera scripts/fix-provincias-report.json con todo lo propuesto/aplicado.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const APPLY = process.env.APPLY === '1'

// Lista canónica (espejo de lib/areas/provincias.ts)
const PROVINCIAS = [
  ['A Coruña', 'La Coruña', 'Coruña'],
  ['Álava', 'Araba', 'Araba/Álava'],
  ['Albacete'],
  ['Alicante', 'Alacant', 'Alicante/Alacant'],
  ['Almería'],
  ['Asturias', 'Principado de Asturias'],
  ['Ávila'],
  ['Badajoz'],
  ['Barcelona'],
  ['Bizkaia', 'Vizcaya'],
  ['Burgos'],
  ['Cáceres'],
  ['Cádiz'],
  ['Cantabria'],
  ['Castellón', 'Castelló', 'Castellón/Castelló', 'Castelló de la Plana'],
  ['Ciudad Real'],
  ['Córdoba'],
  ['Cuenca'],
  ['Girona', 'Gerona'],
  ['Gipuzkoa', 'Guipúzcoa'],
  ['Granada'],
  ['Guadalajara'],
  ['Huelva'],
  ['Huesca'],
  ['Illes Balears', 'Islas Baleares', 'Baleares', 'Mallorca', 'Menorca', 'Ibiza', 'Eivissa'],
  ['Jaén'],
  ['La Rioja'],
  ['Las Palmas'],
  ['León'],
  ['Lleida', 'Lérida'],
  ['Lugo'],
  ['Madrid', 'Comunidad de Madrid'],
  ['Málaga'],
  ['Murcia', 'Región de Murcia'],
  ['Navarra', 'Nafarroa'],
  ['Ourense', 'Orense'],
  ['Palencia'],
  ['Pontevedra'],
  ['Salamanca'],
  ['Santa Cruz de Tenerife', 'Tenerife'],
  ['Segovia'],
  ['Sevilla'],
  ['Soria'],
  ['Tarragona'],
  ['Teruel'],
  ['Toledo'],
  ['Valencia', 'València', 'Valencia/València'],
  ['Valladolid'],
  ['Zamora'],
  ['Zaragoza'],
]

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const canonicaPorNorm = new Map()
for (const [nombre, ...aliases] of PROVINCIAS) {
  canonicaPorNorm.set(norm(nombre), nombre)
  for (const a of aliases) canonicaPorNorm.set(norm(a), nombre)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function geocodeProvincia(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1&zoom=10&accept-language=es`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MapaFurgocasa/1.0 (https://www.mapafurgocasa.com)' },
  })
  if (!res.ok) return null
  const json = await res.json()
  const a = json.address || {}
  const candidatos = [a.province, a.state_district, a.county, a.state]
  for (const c of candidatos) {
    const canon = canonicaPorNorm.get(norm(c))
    if (canon) return { provincia: canon, ciudad: a.city || a.town || a.village || a.municipality || null }
  }
  // Nominatim a veces devuelve "Provincia de X"
  for (const c of candidatos) {
    const m = norm(c).replace(/^(provincia|provincia de|province of)\s+/, '')
    const canon = canonicaPorNorm.get(m)
    if (canon) return { provincia: canon, ciudad: a.city || a.town || a.village || a.municipality || null }
  }
  return null
}

async function main() {
  const rows = []
  const pageSize = 1000
  for (let page = 0; ; page++) {
    const { data, error } = await supabase
      .from('areas')
      .select('id, nombre, ciudad, provincia, latitud, longitud')
      .eq('activo', true)
      .eq('pais', 'España')
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < pageSize) break
  }
  console.log(`Áreas activas España: ${rows.length} | modo: ${APPLY ? 'APPLY' : 'DRY-RUN'}`)

  const renombrar = [] // alias → canónico (sin geocoding)
  const geocodificar = [] // provincia sucia
  const limpiarCiudad = [] // ciudad con código postal pegado («17230 Palamós»)
  for (const r of rows) {
    const canon = canonicaPorNorm.get(norm(r.provincia))
    if (canon) {
      if ((r.provincia || '').trim() !== canon) {
        renombrar.push({ id: r.id, nombre: r.nombre, de: r.provincia, a: canon })
      }
    } else {
      geocodificar.push(r)
    }
    const ciudad = (r.ciudad || '').trim()
    const m = ciudad.match(/^\d{4,5}[\s,–-]+(.+)$/)
    if (m && m[1].trim().length >= 2) {
      limpiarCiudad.push({ id: r.id, nombre: r.nombre, de: r.ciudad, a: m[1].trim() })
    }
  }
  console.log(`Renombrar alias→canónico: ${renombrar.length}`)
  console.log(`Ciudades con CP pegado: ${limpiarCiudad.length}`)
  console.log(`Necesitan geocoding: ${geocodificar.length}`)

  const report = { modo: APPLY ? 'apply' : 'dry-run', renombrar, limpiar_ciudad: limpiarCiudad, geo_ok: [], geo_fail: [] }

  for (let i = 0; i < geocodificar.length; i++) {
    const r = geocodificar[i]
    if (!r.latitud || !r.longitud) {
      report.geo_fail.push({ id: r.id, nombre: r.nombre, provincia: r.provincia, motivo: 'sin coordenadas' })
      continue
    }
    try {
      const geo = await geocodeProvincia(r.latitud, r.longitud)
      if (geo) {
        report.geo_ok.push({
          id: r.id,
          nombre: r.nombre,
          de: r.provincia,
          a: geo.provincia,
          ciudad_actual: r.ciudad,
          ciudad_geo: geo.ciudad,
        })
      } else {
        report.geo_fail.push({ id: r.id, nombre: r.nombre, provincia: r.provincia, motivo: 'sin provincia canónica en respuesta' })
      }
    } catch (e) {
      report.geo_fail.push({ id: r.id, nombre: r.nombre, provincia: r.provincia, motivo: String(e.message || e) })
    }
    if ((i + 1) % 25 === 0) console.log(`  geocoding ${i + 1}/${geocodificar.length}…`)
    await sleep(1100)
  }

  console.log(`Geo OK: ${report.geo_ok.length} | Geo sin resolver: ${report.geo_fail.length}`)

  if (APPLY) {
    let aplicados = 0
    for (const u of renombrar) {
      const { error } = await supabase.from('areas').update({ provincia: u.a }).eq('id', u.id)
      if (error) console.error(`Error ${u.id}:`, error.message)
      else aplicados++
    }
    for (const u of limpiarCiudad) {
      const { error } = await supabase.from('areas').update({ ciudad: u.a }).eq('id', u.id)
      if (error) console.error(`Error ${u.id}:`, error.message)
      else aplicados++
    }
    for (const u of report.geo_ok) {
      const patch = { provincia: u.a }
      if (!u.ciudad_actual && u.ciudad_geo) patch.ciudad = u.ciudad_geo
      const { error } = await supabase.from('areas').update(patch).eq('id', u.id)
      if (error) console.error(`Error ${u.id}:`, error.message)
      else aplicados++
    }
    console.log(`Actualizaciones aplicadas: ${aplicados}`)
  } else {
    console.log('Dry-run: no se ha escrito nada. Revisar scripts/fix-provincias-report.json y relanzar con APPLY=1')
  }

  fs.writeFileSync('scripts/fix-provincias-report.json', JSON.stringify(report, null, 2))
  console.log('Informe: scripts/fix-provincias-report.json')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
