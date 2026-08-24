/**
 * AUDITORÍA DE IMÁGENES CON RIESGO DE COPYRIGHT
 * =============================================
 * Recorre foto_principal + fotos_urls de todas las áreas activas y clasifica
 * cada URL. Distingue fotos DEL ÁREA (Park4night, web oficial, directorios)
 * de fotos GENÉRICAS / de stock que están generando reclamaciones.
 *
 * COSTE: CERO (solo lectura de Supabase).
 *
 * USO (PowerShell):
 *   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"; node scripts/audit-copyright-images.js
 *
 * SALIDA:
 *   - Resumen en consola
 *   - scripts/audit-copyright-images.csv  (una fila por imagen de riesgo)
 *   - scripts/audit-copyright-areas.csv   (áreas que perderían fotos)
 */
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Bancos de stock: reclamación casi segura
const STOCK_HOSTS = [
  'shutterstock.com', 'gettyimages.com', 'istockphoto.com', 'istock.com',
  'dreamstime.com', '123rf.com', 'depositphotos.com', 'alamy.com',
  'stock.adobe.com', 'adobe.com', 'fotolia.com', 'canstockphoto.com',
  'bigstockphoto.com', 'stocksy.com', 'pond5.com', 'superstock.com',
  'agefotostock.com', 'imagebroker.com', 'robertharding.com',
  'freepik.com', 'elements.envato.com'
]

// El archivo se llama AdobeStock_ / GettyImages- aunque esté en otro dominio
const STOCK_FILENAME = [
  /adobestock[_-]/i,
  /gettyimages[-_]/i,
  /shutterstock/i,
  /istock[_-]?photo/i,
  /dreamstime/i,
  /depositphotos/i,
  /alamy/i,
  /123rf/i,
  /stock[_-]?photo/i,
  /c_shutterstock/i
]

// Catálogo de marcas: foto de furgoneta de fábrica, no del área
const CATALOG_HOSTS = [
  'hymer.com', 'burstner.com', 'knaus.com', 'fendt.com', 'dethleffs.com',
  'hobby-caravan.de', 'tabbert.com', 'adria-mobil.com', 'lmc-caravan.com',
  'weinsberg.com', 'carado.com', 'sunlight-caravan.com', 'eura-mobil.de',
  'frankia.de', 'concorde.eu', 'laika.it', 'swiftgroup.co.uk',
  'chausson-motorhomes.com', 'rapido.com', 'pilote.fr', 'winnebago.com',
  'motor1.com', 'mundoautocaravanas.com', 'mundovan.com', 'onroadmagazine.com',
  'carwow.com', 'carwow-es-wp-0.imgix.net'
]

// Miniaturas / basura que no es foto del área
const JUNK_HOSTS = [
  'i.ytimg.com', 'ytimg.com', 'youtube.com', 'tiktok.com',
  'scribdassets.com', 'scribd.com'
]
const MAP_URL = [
  'img_cache/streets',
  'streets-v2',
  'staticmap',
]
const JUNK_URL = [
  'x-raw-image://',
  'registrationmodal',
  'placeholder',
  '1x1',
  'data:image'
]

// Redes sociales: foto de tercero, copyright frecuente
const SOCIAL_HOSTS = [
  'lookaside.fbsbx.com', 'lookaside.instagram.com',
  'scontent.cdninstagram.com', 'instagram.com',
  'scontent.xx.fbcdn.net', 'fbcdn.net'
]

// Del sitio real / directorios del área: las áreas no reclaman
const AREA_HOSTS = [
  'park4night.com', 'stellplatz.info', 'areascamper.com', 'areasac.es',
  'pitchup.com', 'searchforsites.co.uk', 'camping.info', 'acsi.eu',
  'geniuscamping.com', 'aireparkreservation.com', 'caramaps.com',
  'meinwomo.net', 'reseauaireservices.com', 'campcation-prod-images',
  'idylcar.fr', 'pleinairclub.it', 'where-e.com'
]
const GOOGLE_HOSTS = [
  'maps.googleapis.com', 'lh3.googleusercontent.com',
  'lh4.googleusercontent.com', 'lh5.googleusercontent.com',
  'lh6.googleusercontent.com', 'streetviewpixels-pa.googleapis.com',
  'ggpht.com'
]

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

function hostMatches(host, list) {
  if (!host) return false
  return list.some((h) => host === h || host.endsWith('.' + h) || host.includes(h))
}

function classifyUrl(url) {
  const host = hostOf(url)
  const full = (url || '').toLowerCase()
  if (!url) return 'invalid'
  if (!host && full.startsWith('x-raw-image://')) return 'basura'
  if (!host) return 'invalid'
  if (MAP_URL.some((p) => full.includes(p))) return 'mapa'
  if (JUNK_URL.some((p) => full.includes(p))) return 'basura'
  if (hostMatches(host, JUNK_HOSTS)) return 'basura'
  if (STOCK_FILENAME.some((re) => re.test(url))) return 'stock'
  if (hostMatches(host, STOCK_HOSTS)) return 'stock'
  if (hostMatches(host, CATALOG_HOSTS)) return 'catalogo'
  if (hostMatches(host, SOCIAL_HOSTS)) return 'social'
  if (hostMatches(host, GOOGLE_HOSTS)) return 'google_places'
  if (hostMatches(host, AREA_HOSTS) || host.includes('park4night')) return 'directorio_area'
  return 'otro'
}

function csvEscape(v) {
  const s = v == null ? '' : String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

async function fetchAllAreas(supa) {
  const all = []
  const pageSize = 1000
  let page = 0
  while (true) {
    const { data, error } = await supa
      .from('areas')
      .select('id,nombre,slug,ciudad,provincia,pais,foto_principal,fotos_urls')
      .eq('activo', true)
      .order('id')
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
    page++
  }
  return all
}

function uniqueUrlsOf(area) {
  const set = new Set()
  if (area.foto_principal) set.add(area.foto_principal)
  const extras = Array.isArray(area.fotos_urls) ? area.fotos_urls : []
  extras.forEach((u) => { if (u) set.add(u) })
  return [...set]
}

function riskOf(clasificacion, areasDistintas) {
  if (clasificacion === 'stock') return 'ALTO'
  if (clasificacion === 'catalogo') return 'ALTO'
  if (clasificacion === 'basura') return 'ALTO'
  if (clasificacion === 'mapa') return 'ALTO'
  if (areasDistintas >= 3) return 'ALTO'
  if (clasificacion === 'social') return 'MEDIO'
  if (areasDistintas === 2) return 'MEDIO'
  return 'BAJO'
}

async function main() {
  if (!SUPA_URL || !SUPA_KEY) {
    console.error('Faltan credenciales de Supabase en .env.local')
    process.exit(1)
  }
  const supa = createClient(SUPA_URL, SUPA_KEY)

  console.log('📦 Cargando áreas activas...')
  const areas = await fetchAllAreas(supa)
  console.log(`   Total áreas: ${areas.length}`)

  const urlIndex = new Map()
  const domainCount = new Map()
  const classCount = {}
  let totalImagenes = 0
  let areasConFoto = 0

  for (const area of areas) {
    const urls = uniqueUrlsOf(area)
    if (urls.length === 0) continue
    areasConFoto++
    for (const url of urls) {
      totalImagenes++
      const clasificacion = classifyUrl(url)
      classCount[clasificacion] = (classCount[clasificacion] || 0) + 1
      const host = hostOf(url) || '(url-invalida)'
      domainCount.set(host, (domainCount.get(host) || 0) + 1)
      if (!urlIndex.has(url)) {
        urlIndex.set(url, { clasificacion, host, areas: new Map() })
      }
      urlIndex.get(url).areas.set(area.id, {
        id: area.id,
        nombre: area.nombre,
        ciudad: area.ciudad,
        pais: area.pais,
        slug: area.slug,
        esPrincipal: area.foto_principal === url
      })
    }
  }

  const rows = []
  const areasAfectadas = new Map()
  let urlsAlto = 0
  let urlsMedio = 0
  let urlsReused = 0

  for (const [url, info] of urlIndex.entries()) {
    const areaList = [...info.areas.values()]
    const n = areaList.length
    if (n >= 2) urlsReused++
    const riesgo = riskOf(info.clasificacion, n)
    if (riesgo === 'BAJO') continue
    if (riesgo === 'ALTO') urlsAlto++
    else urlsMedio++

    for (const a of areaList) {
      rows.push([
        riesgo,
        info.clasificacion,
        n,
        a.esPrincipal ? 'principal' : 'galeria',
        a.id,
        a.nombre,
        a.ciudad,
        a.pais,
        a.slug,
        info.host,
        url
      ])
      if (!areasAfectadas.has(a.id)) {
        areasAfectadas.set(a.id, {
          id: a.id,
          nombre: a.nombre,
          ciudad: a.ciudad,
          pais: a.pais,
          slug: a.slug,
          riesgos: new Set(),
          clases: new Set(),
          imagenesRiesgo: 0,
          totalImagenes: uniqueUrlsOf(areas.find((x) => x.id === a.id)).length
        })
      }
      const acc = areasAfectadas.get(a.id)
      acc.riesgos.add(riesgo)
      acc.clases.add(info.clasificacion)
      acc.imagenesRiesgo++
    }
  }

  // ¿Cuántas áreas se quedarían sin NINGUNA foto si borramos solo ALTO?
  let areasQuedanVaciasAlto = 0
  let areasQuedanVaciasAltoOMedio = 0
  const vaciasAlto = []
  for (const area of areas) {
    const urls = uniqueUrlsOf(area)
    if (urls.length === 0) continue
    const keepIfAlto = urls.filter((u) => {
      const info = urlIndex.get(u)
      const n = info.areas.size
      return riskOf(info.clasificacion, n) !== 'ALTO'
    })
    const keepIfBoth = urls.filter((u) => {
      const info = urlIndex.get(u)
      const n = info.areas.size
      return riskOf(info.clasificacion, n) === 'BAJO'
    })
    if (keepIfAlto.length === 0) {
      areasQuedanVaciasAlto++
      vaciasAlto.push(area)
    }
    if (keepIfBoth.length === 0) areasQuedanVaciasAltoOMedio++
  }

  const topDomains = [...domainCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)
  const reused = [...urlIndex.entries()]
    .filter(([, info]) => info.areas.size >= 3)
    .sort((a, b) => b[1].areas.size - a[1].areas.size)

  const stockSamples = [...urlIndex.entries()]
    .filter(([, info]) => info.clasificacion === 'stock')
    .slice(0, 12)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 RESUMEN')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Áreas activas:                      ${areas.length}`)
  console.log(`Áreas con alguna foto:              ${areasConFoto}`)
  console.log(`Áreas sin foto:                     ${areas.length - areasConFoto}`)
  console.log(`Imágenes (únicas por área):         ${totalImagenes}`)
  console.log(`URLs distintas en todo el mapa:     ${urlIndex.size}`)
  console.log('')
  console.log('CLASIFICACIÓN:')
  Object.entries(classCount).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(20)} ${v}`)
  })
  console.log('')
  console.log('RIESGO (URLs distintas):')
  console.log(`  ALTO  (borrar):                   ${urlsAlto}`)
  console.log(`  MEDIO (revisar):                  ${urlsMedio}`)
  console.log(`  Reutilizadas en ≥2 áreas:         ${urlsReused}`)
  console.log(`  Reutilizadas en ≥3 áreas:         ${reused.length}`)
  console.log('')
  console.log('SI BORRAMOS LAS DE RIESGO ALTO:')
  console.log(`  Áreas que se quedan sin foto:     ${areasQuedanVaciasAlto}  ← candidatas a imagen IA`)
  console.log(`  Si además quitamos MEDIO:         ${areasQuedanVaciasAltoOMedio}`)
  console.log(`  Áreas con ≥1 imagen de riesgo:    ${areasAfectadas.size}`)

  console.log('\nTOP DOMINIOS:')
  topDomains.forEach(([host, n]) => {
    console.log(`  ${String(n).padStart(5)}  ${host}`)
  })

  if (stockSamples.length) {
    console.log('\nEJEMPLOS STOCK / ADOBESTOCK / GETTY (los que más reclamaciones generan):')
    stockSamples.forEach(([url, info]) => {
      const nombres = [...info.areas.values()].slice(0, 2).map((a) => a.nombre).join(' | ')
      console.log(`  [${info.host}] ${nombres}`)
      console.log(`    ${url.slice(0, 140)}`)
    })
  }

  if (reused.length) {
    console.log('\nMISMA FOTO EN ≥3 ÁREAS DISTINTAS (casi seguro genérica / mal asignada):')
    reused.slice(0, 20).forEach(([url, info]) => {
      const nombres = [...info.areas.values()].slice(0, 3).map((a) => `${a.nombre} (${a.pais})`).join(' · ')
      console.log(`  x${info.areas.size}  [${info.clasificacion}] ${info.host}`)
      console.log(`       ${nombres}`)
      console.log(`       ${url.slice(0, 130)}`)
    })
  }

  const imgHeader = ['riesgo', 'clasificacion', 'areas_distintas', 'rol', 'area_id', 'nombre', 'ciudad', 'pais', 'slug', 'dominio', 'url']
  const imgCsv = [imgHeader.join(';')]
    .concat(rows.map((f) => f.map(csvEscape).join(';')))
    .join('\n')
  const imgPath = path.join(__dirname, 'audit-copyright-images.csv')
  fs.writeFileSync(imgPath, '\uFEFF' + imgCsv, 'utf8')

  const areaRows = [...areasAfectadas.values()]
    .sort((a, b) => b.imagenesRiesgo - a.imagenesRiesgo)
    .map((a) => [
      a.riesgos.has('ALTO') ? 'ALTO' : 'MEDIO',
      a.id,
      a.nombre,
      a.ciudad,
      a.pais,
      a.slug,
      a.imagenesRiesgo,
      a.totalImagenes,
      a.imagenesRiesgo >= a.totalImagenes ? 'SI' : 'NO',
      [...a.clases].join('|'),
      `https://www.mapafurgocasa.com/area/${a.slug}`
    ])
  const areaHeader = ['riesgo', 'area_id', 'nombre', 'ciudad', 'pais', 'slug', 'imagenes_riesgo', 'imagenes_totales', 'se_queda_vacia', 'clases', 'url_publica']
  const areaCsv = [areaHeader.join(';')]
    .concat(areaRows.map((f) => f.map(csvEscape).join(';')))
    .join('\n')
  const areaPath = path.join(__dirname, 'audit-copyright-areas.csv')
  fs.writeFileSync(areaPath, '\uFEFF' + areaCsv, 'utf8')

  const vaciasPath = path.join(__dirname, 'audit-copyright-vacias-ia.csv')
  const vaciasCsv = [['area_id', 'nombre', 'ciudad', 'pais', 'slug', 'url_publica'].join(';')]
    .concat(vaciasAlto.map((a) => [
      a.id, a.nombre, a.ciudad, a.pais, a.slug,
      `https://www.mapafurgocasa.com/area/${a.slug}`
    ].map(csvEscape).join(';')))
    .join('\n')
  fs.writeFileSync(vaciasPath, '\uFEFF' + vaciasCsv, 'utf8')

  console.log(`\n💾 Imágenes de riesgo:     ${imgPath} (${rows.length} filas)`)
  console.log(`💾 Áreas afectadas:        ${areaPath} (${areaRows.length} áreas)`)
  console.log(`💾 Áreas que quedarían vacías (candidatas IA): ${vaciasPath} (${vaciasAlto.length})`)
}

main().catch((e) => {
  console.error('ERROR FATAL:', e)
  process.exit(1)
})
