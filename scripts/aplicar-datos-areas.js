/**
 * Aplica correcciones de datos a fichas de áreas (oleada 1, GUIA §16).
 *
 * Lee un JSON con una lista de correcciones investigadas a mano:
 *   [{ "slug": "...", "precio_noche": 12, "plazas_totales": 50,
 *      "plazas_camper": 24, "tipo_area": "privada",
 *      "telefono": "...", "website": "...",
 *      "servicios_true": ["agua", "electricidad"],
 *      "verificado": true, "fuente": "web oficial ..." }]
 *
 * - `servicios_true` se FUSIONA con el objeto servicios actual (solo pone a
 *   true las claves listadas; no borra las existentes).
 * - Solo toca los campos presentes en cada entrada.
 *
 * Uso:
 *   node scripts/aplicar-datos-areas.js <fichero.json>          → dry-run
 *   APPLY=1 node scripts/aplicar-datos-areas.js <fichero.json>  → aplica
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const APPLY = process.env.APPLY === '1'
const fichero = process.argv[2]
if (!fichero) {
  console.error('Uso: node scripts/aplicar-datos-areas.js <fichero.json>')
  process.exit(1)
}
const correcciones = JSON.parse(fs.readFileSync(fichero, 'utf8'))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CAMPOS = ['precio_noche', 'plazas_totales', 'plazas_camper', 'tipo_area', 'telefono', 'website']

async function main() {
  console.log(`${correcciones.length} correcciones | modo: ${APPLY ? 'APPLY' : 'DRY-RUN'}`)
  let ok = 0
  for (const c of correcciones) {
    const { data: area, error } = await supabase
      .from('areas')
      .select('id, nombre, slug, servicios, precio_noche, plazas_totales, tipo_area, telefono, website, verificado')
      .eq('slug', c.slug)
      .single()
    if (error || !area) {
      console.error(`✗ No encontrada: ${c.slug}`)
      continue
    }

    const patch = {}
    for (const campo of CAMPOS) {
      if (c[campo] !== undefined && c[campo] !== area[campo]) patch[campo] = c[campo]
    }
    if (Array.isArray(c.servicios_true) && c.servicios_true.length) {
      const servicios = { ...(area.servicios || {}) }
      let cambia = false
      for (const k of c.servicios_true) {
        if (!servicios[k]) { servicios[k] = true; cambia = true }
      }
      if (cambia) patch.servicios = servicios
    }
    if (c.verificado !== undefined && c.verificado !== area.verificado) patch.verificado = c.verificado

    if (!Object.keys(patch).length) {
      console.log(`= Sin cambios: ${area.nombre}`)
      continue
    }
    console.log(`→ ${area.nombre} (${c.slug})`)
    console.log(`  fuente: ${c.fuente || '—'}`)
    console.log(`  patch: ${JSON.stringify(patch)}`)

    if (APPLY) {
      const { error: upErr } = await supabase.from('areas').update(patch).eq('id', area.id)
      if (upErr) console.error(`  ✗ Error: ${upErr.message}`)
      else { ok++; console.log('  ✓ aplicado') }
    }
  }
  if (APPLY) console.log(`\nAplicadas: ${ok}/${correcciones.length}`)
  else console.log('\nDry-run: nada escrito. Relanzar con APPLY=1')
}

main().catch((e) => { console.error(e); process.exit(1) })
