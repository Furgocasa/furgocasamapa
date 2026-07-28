/**
 * AUDITORÍA DE CALIDAD DE DATOS DE ÁREAS
 * ======================================
 * Analiza TODAS las áreas activas y detecta datos incompletos:
 *   - Descripción: vacía, placeholder, demasiado corta o con frases dubitativas
 *   - Servicios: sin ningún servicio confirmado
 *   - Precio: sin precio
 *   - Plazas: sin plazas
 *   - Foto: sin foto principal
 *
 * COSTE: CERO (solo lee de Supabase, no llama a ninguna API de pago).
 *
 * USO:
 *   node scripts/audit-data-quality.js
 *
 * SALIDA:
 *   - Resumen en consola
 *   - scripts/audit-report.csv (una fila por área con problemas, para revisar en Excel)
 */
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const PLACEHOLDER = 'Requiere verificación y enriquecimiento'
const LOW_QUALITY = [
  /consult/i, /verifica/i, /enriquecimiento/i, /no se ha confirmado/i,
  /no se especifica/i, /no hay informaci/i, /no dispone/i,
  /se desconoce/i, /posiblemente/i, /probablemente/i,
  /puede que/i, /suele tener/i, /se recomienda (consultar|verificar|confirmar)/i
]

function analizarDescripcion(desc) {
  if (!desc || !desc.trim()) return 'VACIA'
  const t = desc.trim()
  if (t.includes(PLACEHOLDER)) return 'PLACEHOLDER'
  if (t.length < 200) return 'MUY_CORTA'
  if (t.length < 350) return 'CORTA'
  if (LOW_QUALITY.some((re) => re.test(t))) return 'DUBITATIVA'
  return 'OK'
}

function serviciosConfirmados(servicios) {
  if (!servicios || typeof servicios !== 'object') return 0
  return Object.values(servicios).filter((v) => v === true).length
}

async function fetchAllAreas(supa) {
  const all = []
  const pageSize = 1000
  let page = 0
  while (true) {
    const { data, error } = await supa
      .from('areas')
      .select('id,nombre,slug,ciudad,provincia,pais,tipo_area,precio_noche,plazas_totales,plazas_camper,servicios,descripcion,foto_principal,google_rating')
      .eq('activo', true)
      .order('pais')
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
    page++
  }
  return all
}

function csvEscape(v) {
  const s = v == null ? '' : String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

async function main() {
  if (!SUPA_URL || !SUPA_KEY) {
    console.error('Faltan credenciales de Supabase en .env.local')
    process.exit(1)
  }
  const supa = createClient(SUPA_URL, SUPA_KEY)

  console.log('📦 Cargando áreas activas...')
  const areas = await fetchAllAreas(supa)
  console.log(`   Total: ${areas.length}\n`)

  const stats = {
    desc_vacia: 0, desc_placeholder: 0, desc_muy_corta: 0, desc_corta: 0,
    desc_dubitativa: 0, desc_ok: 0,
    sin_servicios: 0, sin_precio: 0, sin_plazas: 0, sin_foto: 0,
    foto_google_api: 0
  }
  const porPais = {}
  const filas = []

  for (const a of areas) {
    const estadoDesc = analizarDescripcion(a.descripcion)
    const nServicios = serviciosConfirmados(a.servicios)
    const sinPrecio = a.precio_noche == null
    const sinPlazas = !a.plazas_totales && !a.plazas_camper
    const sinFoto = !a.foto_principal
    // Fotos servidas desde la API de pago de Google (facturan por visualización)
    const fotoGoogleApi = !!(a.foto_principal && /maps\.googleapis\.com/.test(a.foto_principal))

    if (estadoDesc === 'VACIA') stats.desc_vacia++
    else if (estadoDesc === 'PLACEHOLDER') stats.desc_placeholder++
    else if (estadoDesc === 'MUY_CORTA') stats.desc_muy_corta++
    else if (estadoDesc === 'CORTA') stats.desc_corta++
    else if (estadoDesc === 'DUBITATIVA') stats.desc_dubitativa++
    else stats.desc_ok++

    if (nServicios === 0) stats.sin_servicios++
    if (sinPrecio) stats.sin_precio++
    if (sinPlazas) stats.sin_plazas++
    if (sinFoto) stats.sin_foto++
    if (fotoGoogleApi) stats.foto_google_api++

    const problemas = []
    if (estadoDesc !== 'OK') problemas.push(`descripcion_${estadoDesc.toLowerCase()}`)
    if (nServicios === 0) problemas.push('sin_servicios')
    if (sinPrecio) problemas.push('sin_precio')
    if (sinPlazas) problemas.push('sin_plazas')
    if (sinFoto) problemas.push('sin_foto')
    if (fotoGoogleApi) problemas.push('foto_google_api_pago')

    if (problemas.length > 0) {
      filas.push([a.id, a.nombre, a.ciudad, a.provincia, a.pais, estadoDesc, nServicios,
        a.precio_noche ?? '', a.plazas_totales ?? a.plazas_camper ?? '', sinFoto ? 'NO' : 'SI',
        problemas.join('|')])
      if (!porPais[a.pais]) porPais[a.pais] = 0
      porPais[a.pais]++
    }
  }

  // Resumen
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 RESUMEN DE CALIDAD DE DATOS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Áreas activas totales:         ${areas.length}`)
  console.log('')
  console.log('DESCRIPCIONES:')
  console.log(`  ✅ OK (completas):            ${stats.desc_ok}`)
  console.log(`  ❌ Vacías:                    ${stats.desc_vacia}`)
  console.log(`  ❌ Placeholder:               ${stats.desc_placeholder}`)
  console.log(`  ❌ Muy cortas (<200):         ${stats.desc_muy_corta}`)
  console.log(`  ⚠️ Cortas (<350):             ${stats.desc_corta}`)
  console.log(`  ⚠️ Con frases dubitativas:    ${stats.desc_dubitativa}`)
  console.log('')
  console.log('DATOS ESTRUCTURADOS:')
  console.log(`  Sin ningún servicio:          ${stats.sin_servicios}`)
  console.log(`  Sin precio:                   ${stats.sin_precio}`)
  console.log(`  Sin plazas:                   ${stats.sin_plazas}`)
  console.log(`  Sin foto principal:           ${stats.sin_foto}`)
  console.log(`  ⚠️ Foto vía API Google (pago): ${stats.foto_google_api}`)
  console.log('')
  console.log('ÁREAS CON PROBLEMAS POR PAÍS:')
  Object.entries(porPais).sort((a, b) => b[1] - a[1]).forEach(([pais, n]) => {
    console.log(`  ${pais || '(sin país)'}: ${n}`)
  })

  // CSV
  const header = ['id', 'nombre', 'ciudad', 'provincia', 'pais', 'estado_descripcion',
    'num_servicios', 'precio_noche', 'plazas', 'tiene_foto', 'problemas']
  const csv = [header.join(';')]
    .concat(filas.map((f) => f.map(csvEscape).join(';')))
    .join('\n')
  const outPath = path.join(__dirname, 'audit-report.csv')
  fs.writeFileSync(outPath, '﻿' + csv, 'utf8') // BOM para que Excel abra bien las tildes
  console.log(`\n💾 Informe detallado: ${outPath} (${filas.length} áreas con problemas)`)
}

main().catch((e) => { console.error('ERROR FATAL:', e); process.exit(1) })
