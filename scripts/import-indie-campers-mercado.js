/**
 * Importa el lote Indie Campers (precio NETO sin IVA) en datos_mercado_autocaravanas.
 *
 * Prerrequisito:
 *   python scripts/parse-indie-campers-pdf.py [ruta.pdf]
 *   → genera scripts/data/indie-campers-fleet.json
 *
 * Uso:
 *   node scripts/import-indie-campers-mercado.js          # dry-run
 *   node scripts/import-indie-campers-mercado.js --confirm # inserta en Supabase
 *
 * Si falla TLS en red corporativa (Windows):
 *   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"; node scripts/import-indie-campers-mercado.js --confirm
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const CONFIRM = process.argv.includes('--confirm')
const DATA_PATH = path.join(__dirname, 'data', 'indie-campers-fleet.json')
const BATCH = 50

if (!supabaseUrl || !supabaseKey) {
  console.error('[error] Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

if (!fs.existsSync(DATA_PATH)) {
  console.error('[error] No existe', DATA_PATH)
  console.error('        Ejecuta antes: python scripts/parse-indie-campers-pdf.py')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const fleet = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
const today = new Date().toISOString().split('T')[0]

function toRow(r) {
  if (!r.marca || !r.precio_neto || !r.año) return null
  const iva = r.iva_pct != null ? `${r.iva_pct}%` : '?'
  return {
    marca: r.marca,
    modelo: r.modelo || null,
    chasis: r.chasis || null,
    año: r.año,
    precio: r.precio_neto,
    kilometros: r.kilometros ?? null,
    fecha_transaccion: today,
    verificado: true,
    estado: 'Usado',
    origen: 'Indie Campers',
    tipo_dato: 'venta_anuncio',
    pais: r.pais || null,
    region: `IVA ${iva} | bruto ${r.precio_bruto}€ | VIN ${r.vin}`,
    tipo_combustible: null,
    tipo_calefaccion: null,
    homologacion: null,
  }
}

async function main() {
  console.log(`[indie] Registros en JSON: ${fleet.length}`)
  const rows = fleet.map(toRow).filter(Boolean)
  console.log(`[indie] Filas válidas a importar: ${rows.length}`)
  console.log(`[indie] Modo: ${CONFIRM ? 'CONFIRM (insert)' : 'DRY-RUN (sin escribir)'}`)

  // Deduplicar contra lote Indie previo (mismo VIN en region, o marca+modelo+año+km+precio+origen)
  const { data: existentes, error: errExist } = await supabase
    .from('datos_mercado_autocaravanas')
    .select('id, marca, modelo, año, precio, kilometros, region, origen')
    .eq('origen', 'Indie Campers')

  if (errExist) {
    console.error('[error] Leyendo existentes:', errExist.message)
    process.exit(1)
  }

  const vinsPrevios = new Set()
  for (const e of existentes || []) {
    const m = String(e.region || '').match(/VIN\s+([A-HJ-NPR-Z0-9]{17})/i)
    if (m) vinsPrevios.add(m[1].toUpperCase())
  }

  const keyPrevios = new Set(
    (existentes || []).map(
      (e) =>
        `${e.marca}|${e.modelo}|${e.año}|${e.kilometros}|${e.precio}`.toLowerCase()
    )
  )

  const nuevos = []
  let skipVin = 0
  let skipKey = 0
  for (const r of fleet) {
    const row = toRow(r)
    if (!row) continue
    const vin = String(r.vin || '').toUpperCase()
    if (vin && vinsPrevios.has(vin)) {
      skipVin++
      continue
    }
    const key = `${row.marca}|${row.modelo}|${row.año}|${row.kilometros}|${row.precio}`.toLowerCase()
    if (keyPrevios.has(key)) {
      skipKey++
      continue
    }
    keyPrevios.add(key)
    if (vin) vinsPrevios.add(vin)
    nuevos.push(row)
  }

  console.log(`[indie] Ya en BD (origen Indie Campers): ${(existentes || []).length}`)
  console.log(`[indie] Omitidos por VIN: ${skipVin}, por clave: ${skipKey}`)
  console.log(`[indie] Nuevos a insertar: ${nuevos.length}`)

  if (!nuevos.length) {
    console.log('[ok] Nada que insertar')
    return
  }

  // Resumen
  const byPais = {}
  const byMarca = {}
  let sumNeto = 0
  for (const n of nuevos) {
    byPais[n.pais || '?'] = (byPais[n.pais || '?'] || 0) + 1
    byMarca[n.marca] = (byMarca[n.marca] || 0) + 1
    sumNeto += n.precio
  }
  console.log('[indie] Por país:', byPais)
  console.log('[indie] Por marca:', byMarca)
  console.log('[indie] Precio neto medio:', Math.round(sumNeto / nuevos.length), 'EUR')
  console.log('[indie] Ejemplo:', nuevos[0])

  if (!CONFIRM) {
    console.log('\n[dry-run] No se ha escrito nada. Relanza con --confirm para insertar.')
    return
  }

  let inserted = 0
  for (let i = 0; i < nuevos.length; i += BATCH) {
    const batch = nuevos.slice(i, i + BATCH)
    const { error } = await supabase.from('datos_mercado_autocaravanas').insert(batch)
    if (error) {
      console.error(`[error] Batch ${i}-${i + batch.length}:`, error.message, error.details || '')
      process.exit(1)
    }
    inserted += batch.length
    console.log(`[ok] Insertados ${inserted}/${nuevos.length}`)
  }

  console.log(`[done] Importados ${inserted} registros Indie Campers (precio NETO sin IVA)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
