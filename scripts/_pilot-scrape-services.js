/**
 * Piloto dry-run: analiza N áreas de España sin servicios sin guardar en BD.
 * Uso: node scripts/_pilot-scrape-services.js [n] [--write]
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

const LIMIT = Number(process.argv[2] || 5)
const DO_WRITE = process.argv.includes('--write')

const SERVICIOS_VALIDOS = [
  'agua',
  'electricidad',
  'vaciado_aguas_negras',
  'vaciado_aguas_grises',
  'wifi',
  'duchas',
  'wc',
  'lavanderia',
  'restaurante',
  'supermercado',
  'zona_mascotas',
]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function sinServicios(servicios) {
  if (!servicios || typeof servicios !== 'object') return true
  return !Object.values(servicios).some((v) => v === true)
}

function applyInferences(servicios) {
  const s = { ...servicios }
  if (s.agua === true) {
    s.vaciado_aguas_negras = true
    s.vaciado_aguas_grises = true
  }
  if (s.duchas === true) {
    s.wc = true
    s.agua = true
    s.vaciado_aguas_negras = true
    s.vaciado_aguas_grises = true
  }
  if (s.wc === true) s.agua = true
  if (s.electricidad === true && s.agua === true) {
    s.vaciado_aguas_negras = true
    s.vaciado_aguas_grises = true
  }
  return s
}

async function buildSerpReinforcement(area) {
  const key = process.env.SERPAPI_KEY
  if (!key) return ''

  const queries = [
    `"${area.nombre}" ${area.ciudad || ''} (Park4night OR Campercontact OR Caramaps) agua electricidad vaciado duchas`,
    `"${area.nombre}" ${area.ciudad || ''} ${area.provincia || ''} área autocaravanas (agua OR electricidad OR vaciado OR ducha OR WC)`,
  ]

  let out = ''
  for (const q of queries) {
    try {
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&api_key=${key}&hl=es&gl=es&num=8`
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) continue
      ;(data.organic_results || []).slice(0, 6).forEach((r) => {
        if (r.title || r.snippet) out += `- ${r.title || ''}: ${r.snippet || ''}\n`
      })
    } catch {
      // best-effort
    }
  }
  return out.trim()
}

async function analyze(area) {
  const serp = await buildSerpReinforcement(area)

  const systemInstruction = `Eres un auditor crítico de áreas de autocaravanas/campers. Tienes búsqueda web: ÚSALA para verificar los servicios REALES del área (web oficial, Park4night, Campercontact, Caramaps, iOverlander, reseñas).

PRIORIDAD (lo más importante; invierte aquí el esfuerzo de búsqueda):
1) agua — toma/llenado de agua potable en el área
2) electricidad — tomas eléctricas / enganche en parcela o punto común
3) vaciado_aguas_negras — vaciado de WC químico / cassette / aguas negras
4) vaciado_aguas_grises — desagüe / vaciado de aguas grises
5) duchas y wc — instalaciones sanitarias EN el área

SECUNDARIOS (solo true con evidencia explícita en el propio recinto):
wifi, lavanderia, restaurante, supermercado, zona_mascotas

REGLAS DE EVIDENCIA:
- true SOLO con evidencia clara de que el servicio está EN ESTA área concreta. Ante la duda → false.
- Prioriza fuentes: web oficial > Park4night/Campercontact/Caramaps > reseñas coherentes entre sí.
- NO copies servicios de otra área cercana ni del pueblo “cerca”.
- restaurante/supermercado: true solo si están DENTRO o forman parte del área/camping; "a 200 m / en el pueblo" → false.
- zona_mascotas: true SOLO si hay zona/área específica para mascotas. "Se admiten perros" / pet-friendly ≠ zona_mascotas.
- Sinónimos útiles: "cambio de aguas", "punto de servicio", "borne", "vidange", "chemical toilet dump", "fresh water", "hook-up".
- Si fuentes fiables dicen "área de servicio" / "cambio de aguas" / "servicios básicos para autocaravanas" → suele implicar agua + vaciados (negras y grises); confirma solo si encaja con esta área.
- Electricidad: no la asumas; muchas áreas públicas tienen agua/vaciado sin luz.
- Responde ÚNICAMENTE con un objeto JSON válido (claves exactas abajo), sin markdown ni texto extra.

CLAVES EXACTAS:
agua, electricidad, vaciado_aguas_negras, vaciado_aguas_grises, wifi, duchas, wc, lavanderia, restaurante, supermercado, zona_mascotas`

  const userPrompt = `ÁREA A ANALIZAR:
- Nombre: ${area.nombre}
- Ciudad: ${area.ciudad || ''}
- Provincia: ${area.provincia || ''}
- País: ${area.pais || ''}
- Tipo: ${area.tipo_area || 'desconocido'}
${area.website ? `- Web: ${area.website}\n` : ''}${serp ? `\nINFORMACIÓN DE REFUERZO (contrástala con tu propia búsqueda web; no la tomes como verdad absoluta):\n${serp}\n` : ''}
Busca información actual de ESTA área y prioriza confirmar/rechazar: agua, electricidad, vaciado_aguas_negras, vaciado_aguas_grises, duchas, wc.
Devuelve SOLO este JSON (true/false en cada clave):
{
  "agua": false,
  "electricidad": false,
  "vaciado_aguas_negras": false,
  "vaciado_aguas_grises": false,
  "wifi": false,
  "duchas": false,
  "wc": false,
  "lavanderia": false,
  "restaurante": false,
  "supermercado": false,
  "zona_mascotas": false
}`

  const t0 = Date.now()
  const response = await openai.responses.create({
    model: 'gpt-5.5',
    tools: [{ type: 'web_search' }],
    input: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt },
    ],
    max_output_tokens: 2000,
    reasoning: { effort: 'low' },
  })

  const text = (response.output_text || '').trim()
  let detected = {}
  try {
    const m = text.match(/\{[\s\S]*\}/)
    detected = JSON.parse(m ? m[0] : text)
  } catch {
    return {
      ok: false,
      error: 'JSON parse fail',
      raw: text.slice(0, 300),
      ms: Date.now() - t0,
      serp: !!serp,
    }
  }

  let finales = {}
  SERVICIOS_VALIDOS.forEach((s) => {
    finales[s] = detected[s] === true
  })
  finales = applyInferences(finales)
  const trues = SERVICIOS_VALIDOS.filter((k) => finales[k])

  if (DO_WRITE) {
    const { error } = await supabase
      .from('areas')
      .update({ servicios: finales, updated_at: new Date().toISOString() })
      .eq('id', area.id)
    if (error) {
      return { ok: false, error: 'DB: ' + error.message, ms: Date.now() - t0, serp: !!serp }
    }
  }

  return {
    ok: true,
    total: trues.length,
    trues,
    servicios: finales,
    ms: Date.now() - t0,
    serp: !!serp,
  }
}

async function main() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing')

  console.log(`Piloto: ${LIMIT} áreas | modo: ${DO_WRITE ? 'WRITE' : 'DRY-RUN'}`)

  const candidates = []
  let from = 0
  while (candidates.length < LIMIT) {
    const { data, error } = await supabase
      .from('areas')
      .select('id,nombre,ciudad,provincia,pais,website,servicios,tipo_area')
      .eq('pais', 'España')
      .eq('activo', true)
      .range(from, from + 999)
    if (error) throw error
    if (!data || !data.length) break
    for (const a of data) {
      if (sinServicios(a.servicios)) candidates.push(a)
      if (candidates.length >= LIMIT) break
    }
    if (data.length < 1000) break
    from += 1000
  }

  console.log(`Candidatas encontradas: ${candidates.length}\n`)

  const results = []
  for (let i = 0; i < candidates.length; i++) {
    const a = candidates[i]
    process.stdout.write(`[${i + 1}/${candidates.length}] ${a.nombre} (${a.ciudad || '-'}) ... `)
    try {
      const r = await analyze(a)
      if (!r.ok) {
        console.log(`FAIL ${r.error} (${Math.round(r.ms / 1000)}s)`)
        results.push({ nombre: a.nombre, ciudad: a.ciudad, website: !!a.website, ...r })
      } else {
        console.log(
          `OK total=${r.total} [${r.trues.join(', ') || 'ninguno'}] serp=${r.serp} ${Math.round(r.ms / 1000)}s`
        )
        results.push({
          nombre: a.nombre,
          ciudad: a.ciudad,
          website: !!a.website,
          tipo: a.tipo_area,
          total: r.total,
          trues: r.trues,
          ms: r.ms,
          serp: r.serp,
          ok: true,
        })
      }
    } catch (e) {
      console.log(`ERROR ${e.message}`)
      results.push({ nombre: a.nombre, ok: false, error: e.message })
    }
    if (i < candidates.length - 1) await new Promise((r) => setTimeout(r, 2000))
  }

  const ok = results.filter((r) => r.ok)
  const withServices = ok.filter((r) => r.total > 0)
  console.log('\n=== SUMMARY ===')
  console.log(
    JSON.stringify(
      {
        mode: DO_WRITE ? 'WRITE' : 'DRY-RUN',
        processed: results.length,
        ok: ok.length,
        failed: results.length - ok.length,
        withAtLeastOneService: withServices.length,
        stillZero: ok.filter((r) => r.total === 0).length,
        avgSeconds: ok.length
          ? Math.round(ok.reduce((s, r) => s + r.ms, 0) / ok.length / 1000)
          : null,
        results,
      },
      null,
      2
    )
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
