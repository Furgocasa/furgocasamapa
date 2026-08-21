/**
 * AGENTE REVISOR DE RESPUESTAS DEL TÍO VIAJERO
 * ============================================
 * Evalúa CADA respuesta individual del chatbot (tabla chatbot_respuestas_log)
 * y la clasifica como:
 *   - correcta:   responde bien, coherente con los datos, sin inventos
 *   - mejorable:  responde pero incompleta, genérica, o no buscó cuando debía
 *   - incorrecta: inventa datos, contradice los resultados, no responde,
 *                 o responde en el idioma equivocado
 *
 * Para verificar los hechos, el revisor recibe también los datos REALES de
 * las áreas que el chatbot mencionó (desde la BD), así detecta inventos.
 *
 * El veredicto (valoracion_ia, motivo_ia, sugerencia_ia) se guarda en la
 * misma fila y se revisa en /admin/chatbot-respuestas.
 *
 * USO (PowerShell):
 *   node scripts/evaluar-respuestas-chatbot.js               # dry-run: cuenta pendientes
 *   $env:EVAL_RUN="1"; node scripts/evaluar-respuestas-chatbot.js   # evaluar de verdad
 *
 * Variables opcionales:
 *   EVAL_MODEL        (def "gpt-5.6-terra")
 *   EVAL_CONCURRENCY  (def 4)
 *   EVAL_LIMIT        (def 200 por ejecución; 0 = todas)
 *
 * Reanudable: usa evaluado_at IS NULL como cola, no necesita checkpoint.
 * Se puede programar (p.ej. tarea diaria) sin riesgo de duplicados.
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY
const MODEL = process.env.EVAL_MODEL || 'gpt-5.6-terra'
const CONCURRENCY = parseInt(process.env.EVAL_CONCURRENCY || '4', 10)
const LIMIT = parseInt(process.env.EVAL_LIMIT || '200', 10)
const RUN = /^(1|true|yes)$/i.test(process.env.EVAL_RUN || '')

const VALORACIONES = ['correcta', 'mejorable', 'incorrecta']

function extractJson(text) {
  const raw = (text || '').trim()
  if (!raw) return null
  try { return JSON.parse(raw) } catch {}
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return null
  try { return JSON.parse(m[0]) } catch { return null }
}

/**
 * Carga los datos reales de las áreas mencionadas para que el revisor
 * pueda verificar hechos (precio, servicios, ciudad...).
 */
async function fetchAreasContexto(supa, areasIds) {
  if (!Array.isArray(areasIds) || areasIds.length === 0) return []
  const { data, error } = await supa
    .from('areas')
    .select('id,nombre,ciudad,provincia,pais,precio_noche,plazas_totales,servicios,tipo_area,google_rating')
    .in('id', areasIds.slice(0, 10))
  if (error) return []
  return data || []
}

async function evaluar(openai, log, areasReales) {
  const contexto = {
    pregunta_usuario: log.pregunta,
    respuesta_chatbot: log.respuesta,
    idioma_esperado: log.locale || 'es',
    busquedas_ejecutadas: log.funciones || [],
    datos_reales_de_las_areas_mencionadas: areasReales.map((a) => ({
      nombre: a.nombre,
      ciudad: a.ciudad,
      provincia: a.provincia,
      pais: a.pais,
      precio_noche: a.precio_noche,
      plazas: a.plazas_totales,
      valoracion_google: a.google_rating,
      servicios_confirmados: Object.entries(a.servicios || {}).filter(([, v]) => v === true).map(([k]) => k)
    }))
  }

  const system = `Eres el REVISOR DE CALIDAD del chatbot "Tío Viajero" de Mapa Furgocasa (plataforma de áreas para autocaravanas).
Evalúas UNA respuesta individual del chatbot comparándola con la pregunta del usuario y con los DATOS REALES de la base de datos.

CRITERIOS:
- "correcta": responde a lo que se preguntó, es coherente con los datos reales, no inventa servicios/precios, idioma correcto, tono útil.
- "mejorable": responde pero de forma incompleta, genérica o poco útil; o no ejecutó búsquedas cuando la pregunta lo pedía; o formato pobre.
- "incorrecta": contradice los datos reales, inventa áreas/servicios/precios, no responde a la pregunta, responde en idioma equivocado, o es confusa/errónea.

REGLAS:
- Si la pregunta era conversacional (saludo, agradecimiento) y la respuesta es adecuada sin búsquedas, es "correcta".
- Sé exigente con los inventos: cualquier dato concreto (precio, servicio) que no esté en los datos reales ni sea conocimiento general prudente → penaliza.
- El "motivo" debe ser concreto y breve (1-2 frases). La "sugerencia" debe ser accionable para mejorar el prompt o las funciones del chatbot.

Devuelve SOLO un JSON válido: {"valoracion":"correcta|mejorable|incorrecta","motivo":"...","sugerencia":"..."}`

  const resp = await openai.responses.create(
    {
      model: MODEL,
      max_output_tokens: 800,
      reasoning: { effort: 'low' },
      input: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(contexto) }
      ]
    },
    { timeout: 60000 }
  )

  const parsed = extractJson(resp.output_text || '')
  if (!parsed || !VALORACIONES.includes(parsed.valoracion)) {
    throw new Error('Veredicto inválido del revisor')
  }
  return {
    valoracion: parsed.valoracion,
    motivo: String(parsed.motivo || '').slice(0, 1000),
    sugerencia: String(parsed.sugerencia || '').slice(0, 1000)
  }
}

async function main() {
  if (!SUPA_URL || !SUPA_KEY || !OPENAI_KEY) {
    console.error('Faltan credenciales (.env.local): Supabase (service role) u OpenAI')
    process.exit(1)
  }

  const supa = createClient(SUPA_URL, SUPA_KEY)
  const openai = new OpenAI({ apiKey: OPENAI_KEY, maxRetries: 2 })

  // Cola: respuestas sin evaluar (más recientes primero)
  let query = supa
    .from('chatbot_respuestas_log')
    .select('id,pregunta,respuesta,locale,funciones,areas_ids,created_at')
    .is('evaluado_at', null)
    .not('respuesta', 'is', null)
    .order('created_at', { ascending: false })
  if (LIMIT > 0) query = query.limit(LIMIT)

  const { data: pendientes, error } = await query
  if (error) {
    console.error('❌ Error leyendo chatbot_respuestas_log (¿migración de evaluación ejecutada?):', error.message)
    process.exit(1)
  }

  console.log(`🧑‍⚖️ Agente revisor | Modelo: ${MODEL} | Pendientes: ${pendientes.length}${LIMIT > 0 ? ` (límite ${LIMIT})` : ''}`)
  if (!RUN) {
    console.log('👀 DRY-RUN. Ejecuta con EVAL_RUN=1 para evaluar de verdad.')
    return
  }
  if (pendientes.length === 0) { console.log('✅ Nada que evaluar.'); return }

  const stats = { correcta: 0, mejorable: 0, incorrecta: 0, fallos: 0 }
  let index = 0
  let done = 0
  const startedAt = Date.now()

  async function worker() {
    while (index < pendientes.length) {
      const log = pendientes[index++]
      try {
        const areasReales = await fetchAreasContexto(supa, log.areas_ids)
        const veredicto = await evaluar(openai, log, areasReales)

        const { error: upError } = await supa
          .from('chatbot_respuestas_log')
          .update({
            valoracion_ia: veredicto.valoracion,
            motivo_ia: veredicto.motivo,
            sugerencia_ia: veredicto.sugerencia,
            evaluado_at: new Date().toISOString()
          })
          .eq('id', log.id)
        if (upError) throw new Error('DB: ' + upError.message)

        stats[veredicto.valoracion]++
        const icono = veredicto.valoracion === 'correcta' ? '✅' : veredicto.valoracion === 'mejorable' ? '🟡' : '❌'
        console.log(`${icono} [${++done}/${pendientes.length}] ${(log.pregunta || '').slice(0, 60)}`)
      } catch (e) {
        stats.fallos++; done++
        const msg = (e && e.message) || String(e)
        console.log(`✗ [${done}/${pendientes.length}] ${msg}`)
        if (/rate|limit|429|quota|timeout|ECONN/i.test(msg)) await new Promise((r) => setTimeout(r, 5000))
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pendientes.length) }, () => worker()))

  const mins = ((Date.now() - startedAt) / 60000).toFixed(1)
  const evaluadas = stats.correcta + stats.mejorable + stats.incorrecta
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`RESUMEN (${evaluadas} evaluadas en ${mins} min):`)
  console.log(`  ✅ Correctas:   ${stats.correcta} (${evaluadas ? Math.round(stats.correcta / evaluadas * 100) : 0}%)`)
  console.log(`  🟡 Mejorables:  ${stats.mejorable} (${evaluadas ? Math.round(stats.mejorable / evaluadas * 100) : 0}%)`)
  console.log(`  ❌ Incorrectas: ${stats.incorrecta} (${evaluadas ? Math.round(stats.incorrecta / evaluadas * 100) : 0}%)`)
  if (stats.fallos) console.log(`  ⚠️ Fallos de evaluación: ${stats.fallos}`)
  console.log('\n💡 Revisa las "incorrectas" y "mejorables" en /admin/chatbot-respuestas y ajusta el system prompt del chatbot en /admin según las sugerencias.')
}

main().catch((e) => { console.error('ERROR FATAL:', e); process.exit(1) })
