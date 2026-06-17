/**
 * Runner de enriquecimiento masivo de DESCRIPCIONES (llamada DIRECTA a OpenAI).
 *
 * Llama a la API de OpenAI (Responses + web_search, GPT-5.5) sin pasar por el
 * servidor Next, para máxima fiabilidad y velocidad en lotes grandes.
 * Mantiene el MISMO prompt y limpieza que /api/admin/enrich-description.
 *
 * Uso (PowerShell):
 *   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"; node scripts/bulk-enrich.js
 * Variables opcionales:
 *   BULK_CONCURRENCY  (def 6)   BULK_LIMIT (0=todas)
 *   BULK_MODE         critical | all | everything   (def critical)
 *   BULK_MODEL        (def gpt-5.5)
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
const MODEL = process.env.BULK_MODEL || 'gpt-5.5'
const REQ_TIMEOUT_MS = parseInt(process.env.BULK_TIMEOUT_MS || '90000', 10)
const CHECKPOINT = path.join(__dirname, process.env.BULK_CHECKPOINT || 'enrich-checkpoint.txt')

const PLACEHOLDER = 'Requiere verificación y enriquecimiento'
const LOW_QUALITY = [
  /consult/i, /verifica/i, /enriquecimiento/i, /no se ha confirmado/i,
  /no se especifica/i, /no hay informaci/i, /no dispone/i,
  /se desconoce/i, /posiblemente/i, /probablemente/i,
  /puede que/i, /suele tener/i, /se recomienda (consultar|verificar|confirmar)/i
]
const FORBIDDEN = [
  /consult\w*\s+(antes|disponibilidad|directamente|con\s+el|la\s+disponibilidad)/i,
  /se\s+recomienda\s+(consultar|verificar|confirmar|comprobar)/i,
  /(verifica|verificar|comprobar|confirmar|confirma)\s+(los\s+)?(servicios|la\s+disponibilidad|antes)/i,
  /no\s+(se\s+)?(dispone|disponemos|tengo|tenemos|hay)\s+(de\s+)?(información|datos)/i,
  /no\s+se\s+ha\s+confirmado/i,
  /no\s+(se\s+)?(especifica|indica|detalla|aclara|sabe|conoce)/i,
  /información\s+no\s+disponible/i, /se\s+desconoce/i,
  /(posiblemente|probablemente|puede\s+que|podría\s+(tener|disponer)|suele\s+tener)/i
]

function loadCheckpoint() {
  try { return new Set(fs.readFileSync(CHECKPOINT, 'utf8').split(/\r?\n/).filter(Boolean)) } catch { return new Set() }
}
function appendCheckpoint(id) { try { fs.appendFileSync(CHECKPOINT, id + '\n') } catch {} }

function needsWork(desc) {
  if (MODE === 'everything') return true
  if (!desc) return true
  const t = desc.trim()
  if (t.includes(PLACEHOLDER)) return true
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
- Tipo: ${area.tipo_area || 'área para autocaravanas'}
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
  const system = `Eres un redactor profesional especializado en guías de viaje para autocaravanas, campers y caravanas en español.
Tienes acceso a búsqueda web: ÚSALA para encontrar información real y actual sobre el área y su localidad (servicios, accesos, entorno, atractivos turísticos, gastronomía).

REGLAS DE CALIDAD INNEGOCIABLES:
- Escribe con seguridad y precisión, como un experto que conoce el sitio. JAMÁS muestres dudas.
- PROHIBIDO usar frases dubitativas o de descargo como: "consulta antes", "se recomienda verificar", "conviene confirmar", "no se especifica", "no se ha confirmado", "no hay información", "no disponemos de datos", "se desconoce", "posiblemente", "probablemente", "puede que", "suele tener", "verifica los servicios al llegar".
- Sobre SERVICIOS: menciona únicamente los confirmados en la base de datos o que verifiques claramente en internet. Si no puedes confirmar un servicio, NO lo menciones (ni para decir que no lo tiene). Nunca inventes.
- Si no hay servicios confirmables, céntrate en el entorno, la localidad, qué ver y hacer, gastronomía e historia.
- No menciones la dirección postal (ya aparece en el mapa).
- Refiérete siempre a "el área de autocaravanas" o "el área de ${area.nombre}", nunca "esta área".
- Tono informativo, cercano y útil; nada de pomposidad vacía ("destino ideal", "maravilloso", "joya escondida").
- Español natural y fluido, sin listas ni viñetas.${extraReminder ? `\n\n${extraReminder}` : ''}`

  const user = `${contexto}

TAREA:
Investiga en internet el área "${area.nombre}" y la localidad de ${area.ciudad} (${area.provincia}, ${area.pais}) y redacta una descripción de 350-550 palabras en 4-5 párrafos separados por una línea en blanco:

1) Presentación del área de autocaravanas y su ubicación dentro de ${area.ciudad}.
2) Características del área: plazas, precio y servicios (solo los confirmados o verificados).
3) Qué ver y hacer en ${area.ciudad} y su entorno cercano.
4) Gastronomía, cultura, fiestas o naturaleza de la zona.
5) Cierre práctico y útil para el viajero en autocaravana (accesos, mejor época, recomendaciones reales).

Devuelve solo el texto final, en párrafos, sin títulos ni viñetas.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ]
}

async function generate(openai, area, extraReminder) {
  const resp = await openai.responses.create(
    {
      model: MODEL,
      tools: [{ type: 'web_search' }],
      reasoning: { effort: 'low' },
      max_output_tokens: 2500,
      input: buildMessages(area, extraReminder)
    },
    { timeout: REQ_TIMEOUT_MS }
  )
  return cleanText(resp.output_text || '')
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
  console.log(`🧭 Modo: ${MODE} | Modelo: ${MODEL} | Concurrencia: ${CONCURRENCY}`)
  const openai = new OpenAI({ apiKey: OPENAI_KEY, maxRetries: 2 })
  const supa = createClient(SUPA_URL, SUPA_KEY)

  const checkpoint = loadCheckpoint()
  console.log(`💾 Checkpoint: ${checkpoint.size} áreas ya procesadas (se saltarán)`)
  console.log('📦 Cargando áreas...')
  const areas = await fetchAllAreas(supa)
  console.log(`   Total activas: ${areas.length}`)

  let targets = areas.filter((a) => !checkpoint.has(a.id) && needsWork(a.descripcion))
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
