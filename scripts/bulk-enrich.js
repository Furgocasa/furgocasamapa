/**
 * Runner de enriquecimiento masivo de DESCRIPCIONES (llamada DIRECTA a OpenAI).
 *
 * Llama a la API de OpenAI (Responses + web_search, GPT-5.6 Terra) sin pasar por el
 * servidor Next, para máxima fiabilidad y velocidad en lotes grandes.
 * Mantiene el MISMO prompt y limpieza que /api/admin/enrich-description.
 *
 * Uso (PowerShell):
 *   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"; node scripts/bulk-enrich.js
 * Variables opcionales:
 *   BULK_CONCURRENCY  (def 6)   BULK_LIMIT (0=todas)
 *   BULK_MODE         empty | critical | all | everything | serp   (def critical)
 *   BULK_PAIS         filtra por país (ej. España). Vacío = todos
 *   BULK_MODEL        (def gpt-5.6-terra)
 *   BULK_TIMEOUT_MS   (def 90000)
 *   BULK_CHECKPOINT   (def enrich-checkpoint.txt)
 *   BULK_DRYRUN       1|true => solo cuenta pendientes y sale (no gasta crédito)
 *
 * Reanudable: cada área completada se anota en el checkpoint y se salta en
 * ejecuciones posteriores, así que tras una parada (p.ej. crédito agotado)
 * basta con relanzar el script para continuar con las pendientes.
 */
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY
const CONCURRENCY = parseInt(process.env.BULK_CONCURRENCY || '6', 10)
const LIMIT = parseInt(process.env.BULK_LIMIT || '0', 10)
const MODE = (process.env.BULK_MODE || 'critical').toLowerCase()
const PAIS = (process.env.BULK_PAIS || '').trim()
const MODEL = process.env.BULK_MODEL || 'gpt-5.6-terra'
// 'medium' por defecto: con 'low' el modelo a veces se salta la búsqueda web
// y genera textos genéricos/incompletos. Con 'medium' investiga de verdad.
const EFFORT = process.env.BULK_EFFORT || 'medium'
// Forzar el uso de web_search (evita descripciones inventadas sin buscar).
// Desactivable con BULK_FORCE_SEARCH=0 si la API diese problemas.
const FORCE_SEARCH = !/^(0|false|no)$/i.test(process.env.BULK_FORCE_SEARCH || '1')
const REQ_TIMEOUT_MS = parseInt(process.env.BULK_TIMEOUT_MS || '90000', 10)
const CHECKPOINT = path.join(__dirname, process.env.BULK_CHECKPOINT || 'enrich-checkpoint.txt')

const PLACEHOLDER = 'Requiere verificación y enriquecimiento'
const LOW_QUALITY = [
  /consult/i, /verifica/i, /enriquecimiento/i, /no se ha confirmado/i,
  /no se especifica/i, /no hay informaci/i, /no dispone/i,
  /se desconoce/i, /posiblemente/i, /probablemente/i,
  /puede que/i, /suele tener/i, /se recomienda (consultar|verificar|confirmar)/i,
  /encantador (municipio|pueblo|localidad)/i, /en cuanto a las caracter/i,
  /en conclusi[oó]n/i, /destino ideal para/i, /impresi[oó]n duradera/i,
  /aqu[ií] tienes/i, /itinerario sugerido/i
]
const FORBIDDEN = [
  /consult\w*\s+(antes|disponibilidad|directamente|con\s+el|la\s+disponibilidad)/i,
  /se\s+recomienda\s+(consultar|verificar|confirmar|comprobar)/i,
  /(verifica|verificar|comprobar|confirmar|confirma)\s+(los\s+)?(servicios|la\s+disponibilidad|antes)/i,
  /no\s+(se\s+)?(dispone|disponemos|tengo|tenemos|hay)\s+(de\s+)?(información|datos)/i,
  /no\s+se\s+ha\s+confirmado/i,
  /no\s+(se\s+)?(especifica|indica|detalla|aclara|sabe|conoce)/i,
  /información\s+no\s+disponible/i, /se\s+desconoce/i,
  /(posiblemente|probablemente|puede\s+que|podría\s+(tener|disponer)|suele\s+tener)/i,
  /encantador (municipio|pueblo|localidad)/i, /en conclusi[oó]n/i,
  /destino ideal para/i, /impresi[oó]n duradera/i,
  /(por supuesto|aqu[ií] tienes)/i, /itinerario sugerido/i
]

function loadCheckpoint() {
  try { return new Set(fs.readFileSync(CHECKPOINT, 'utf8').split(/\r?\n/).filter(Boolean)) } catch { return new Set() }
}
function appendCheckpoint(id) { try { fs.appendFileSync(CHECKPOINT, id + '\n') } catch {} }

const SERP_MOLD = [
  /no se ha confirmado/i, /no se dispone de informaci/i,
  /no hay informaci[oó]n espec[ií]fica/i, /no se detalla/i,
  /se recomienda (verificar|consultar|informar)/i,
  /encantador (municipio|pueblo|localidad)/i,
  /en cuanto a las caracter[ií]sticas/i, /en conclusi[oó]n/i,
  /destino ideal para/i, /impresi[oó]n duradera/i,
  /podr[ií]a indicar que/i, /no se especifica/i
]

function needsWork(desc) {
  if (MODE === 'everything') return true
  if (!desc || !desc.trim()) return true
  const t = desc.trim()
  if (t.includes(PLACEHOLDER)) return true
  if (MODE === 'empty') return false
  if (MODE === 'serp') return SERP_MOLD.filter((re) => re.test(t)).length >= 2
  if (LOW_QUALITY.some((re) => re.test(t))) return true
  if (MODE === 'all' && t.length < 200) return true
  return false
}

function hasForbidden(t) { return FORBIDDEN.some((re) => re.test(t)) }

function cleanText(text) {
  return (text || '')
    .replace(/\s*\(\[[^\]]*\]\([^)]*\)\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|\n)\s*#+\s*/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function buildContexto(area) {
  let c = `ÁREA QUE DEBES DESCRIBIR (datos exactos de nuestra base de datos):
- Nombre del área: ${area.nombre}
- Ciudad: ${area.ciudad}
- Provincia: ${area.provincia}
- País: ${area.pais}
- Tipo: ${area.tipo_area === 'camping' ? 'camping (recinto con parcela)' : area.tipo_area === 'privada' ? 'área privada (empresa o particular)' : area.tipo_area === 'publica' ? 'área pública (ayuntamiento u organismo)' : 'área de autocaravanas'}
`
  const precio = area.precio_noche
  if (precio != null) c += `- Precio: ${precio === 0 ? 'Gratuita' : `${precio}€/noche`}\n`
  if (area.plazas_totales || area.plazas_camper) c += `- Plazas: ${area.plazas_totales || area.plazas_camper}\n`
  if (area.servicios && typeof area.servicios === 'object') {
    const conf = Object.entries(area.servicios).filter(([, v]) => v === true).map(([k]) => k)
    c += conf.length
      ? `- Servicios CONFIRMADOS por nuestra base de datos: ${conf.join(', ')}\n`
      : `- Servicios: no confirmados en nuestra base de datos (NO menciones servicios concretos que no verifiques en internet).\n`
  }
  return c
}

function buildMessages(area, extraReminder) {
  const contexto = buildContexto(area)
  const system = `Eres un redactor profesional de fichas de área para autocaravanas, campers y caravanas en español.
Tienes web_search y DEBES usarla: busca el recinto por su nombre local y localidad (ayuntamiento, Park4night, Campercontact, web del camping, prensa local). No inventes un resumen turístico del país.
En este mapa solo hay tres tipos: área pública, área privada y camping. El nombre local (aire, sosta, Stellplatz, CL, Weingut) es etiqueta. No existe la categoría stopover.

REGLAS DE CALIDAD INNEGOCIABLES:
- Escribe con seguridad, como quien conoce el sitio. Cifras, topónimos, gestora, fiestas con fecha.
- Si el lugar no es un área de pernocta (guarda de caravanas, zona de tiendas, alquiler de furgos), dilo al principio.
- PROHIBIDO: "consulta antes", "se recomienda verificar", "no se especifica", "no se ha confirmado", "no hay información", "se desconoce", "posiblemente", "encantador municipio", "destino ideal", "en conclusión", "aquí tienes una guía", itinerarios de otro sitio.
- SERVICIOS: solo los de la base o verificados en internet. Si no hay ficha, no los menciones (ni para negarlos).
- No menciones la dirección postal. Nunca "esta área": di "el área de autocaravanas" o "el área de ${area.nombre}".
- Español en párrafos, sin listas ni viñetas ni pomposidad vacía.${extraReminder ? `\n\n${extraReminder}` : ''}`

  const user = `${contexto}

TAREA:
Investiga el área "${area.nombre}" en ${area.ciudad} (${area.provincia}, ${area.pais}) y redacta 350-550 palabras en 4-5 párrafos separados por una línea en blanco:

1) Dónde está el recinto dentro de ${area.ciudad} y qué tipo de parada es.
2) Plazas, precio, horarios, gestora o app, estancia máxima y solo servicios confirmados.
3) Qué ver a pie o cerca: nombres reales.
4) Gastronomía, fiestas o naturaleza de ESA comarca (plato o producto concreto).
5) Acceso para vehículo vivienda, mejor época, un dato práctico real.

Devuelve solo el texto final, sin títulos ni viñetas.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ]
}

async function generate(openai, area, extraReminder) {
  const params = {
    model: MODEL,
    tools: [{ type: 'web_search' }],
    reasoning: { effort: EFFORT },
    max_output_tokens: 2500,
    input: buildMessages(area, extraReminder)
  }
  if (FORCE_SEARCH) params.tool_choice = 'required'

  try {
    const resp = await openai.responses.create(params, { timeout: REQ_TIMEOUT_MS })
    return cleanText(resp.output_text || '')
  } catch (e) {
    // Si la API rechaza tool_choice, reintentar sin forzar (no romper el lote)
    if (FORCE_SEARCH && /tool_choice/i.test((e && e.message) || '')) {
      delete params.tool_choice
      const resp = await openai.responses.create(params, { timeout: REQ_TIMEOUT_MS })
      return cleanText(resp.output_text || '')
    }
    throw e
  }
}

async function fetchAllAreas(supa) {
  const all = []
  const pageSize = 1000
  let page = 0
  while (true) {
    const { data, error } = await supa
      .from('areas')
      .select('id,nombre,ciudad,provincia,pais,tipo_area,precio_noche,plazas_totales,plazas_camper,servicios,descripcion')
      .eq('activo', true)
      .order('nombre')
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
    page++
  }
  return all
}

async function main() {
  if (!SUPA_URL || !SUPA_KEY || !OPENAI_KEY) {
    console.error('Faltan credenciales (.env.local): Supabase u OpenAI')
    process.exit(1)
  }
  console.log(`🧭 Modo: ${MODE} | País: ${PAIS || 'todos'} | Modelo: ${MODEL} | Concurrencia: ${CONCURRENCY}`)
  const openai = new OpenAI({ apiKey: OPENAI_KEY, maxRetries: 2 })
  const supa = createClient(SUPA_URL, SUPA_KEY)

  const checkpoint = loadCheckpoint()
  console.log(`💾 Checkpoint: ${checkpoint.size} áreas ya procesadas (se saltarán)`)
  console.log('📦 Cargando áreas...')
  const areas = await fetchAllAreas(supa)
  console.log(`   Total activas: ${areas.length}`)

  let targets = areas.filter((a) => {
    if (PAIS && a.pais !== PAIS) return false
    return !checkpoint.has(a.id) && needsWork(a.descripcion)
  })
  if (LIMIT > 0) targets = targets.slice(0, LIMIT)
  console.log(`🎯 Áreas a procesar: ${targets.length}`)

  // Dry-run: solo contar pendientes (no consume crédito de OpenAI)
  if (/^(1|true|yes)$/i.test(process.env.BULK_DRYRUN || '')) {
    console.log(`🔎 DRY-RUN (modo ${MODE}): ${targets.length} áreas pendientes de un total de ${areas.length} activas. Checkpoint: ${checkpoint.size}.`)
    return
  }

  if (targets.length === 0) { console.log('✅ Nada que hacer.'); return }

  let done = 0, ok = 0, fail = 0
  const errors = []
  const startedAt = Date.now()
  let index = 0

  async function processArea(area) {
    let desc = await generate(openai, area)
    if (desc && hasForbidden(desc)) {
      const retry = await generate(openai, area, 'IMPORTANTE: El borrador anterior contenía frases dubitativas prohibidas. Reescribe eliminando cualquier duda o "consultar/verificar antes". Sé afirmativo y concreto.')
      if (retry && !hasForbidden(retry)) desc = retry
    }
    if (!desc || desc.length < 100) throw new Error('Respuesta vacía/corta')
    const { error } = await supa.from('areas').update({ descripcion: desc, updated_at: new Date().toISOString() }).eq('id', area.id)
    if (error) throw new Error('DB: ' + error.message)
  }

  async function worker() {
    while (index < targets.length) {
      const area = targets[index++]
      try {
        await processArea(area)
        ok++; appendCheckpoint(area.id)
        console.log(`✓ [${++done}/${targets.length}] ${area.nombre} (${area.ciudad})`)
      } catch (e) {
        fail++; done++
        const msg = (e && e.message) || String(e)
        errors.push(`${area.nombre}: ${msg}`)
        console.log(`✗ [${done}/${targets.length}] ${area.nombre} -> ${msg}`)
        if (/rate|limit|429|quota|cuota|timeout|ECONN/i.test(msg)) await new Promise((r) => setTimeout(r, 5000))
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () => worker()))

  const mins = ((Date.now() - startedAt) / 60000).toFixed(1)
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nRESUMEN: ${ok} OK, ${fail} fallos en ${mins} min`)
  if (errors.length) { console.log('\nErrores (primeros 20):'); errors.slice(0, 20).forEach((e) => console.log('  - ' + e)) }
}

main().catch((e) => { console.error('ERROR FATAL:', e); process.exit(1) })
