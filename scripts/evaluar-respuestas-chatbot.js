/**
 * AGENTE REVISOR DE RESPUESTAS DEL TÍO VIAJERO
 * ============================================
 * Portado del auditor de Furgocasa (`review-chatbot-messages.ts`):
 * evalúa cada respuesta contra los DATOS REALES de las áreas y el
 * contexto de la conversación, no solo contra el texto suelto.
 *
 * Clasifica:
 *   - correcta:   responde bien, coherente con los datos, sin inventos
 *   - mejorable:  responde pero incompleta, genérica, o no buscó cuando debía
 *   - incorrecta: inventa datos, contradice resultados, idioma equivocado
 *
 * Guarda valoracion_ia / motivo_ia / sugerencia_ia / evaluado_at
 * en chatbot_respuestas_log (admin: /admin/chatbot-respuestas).
 *
 * USO (PowerShell; en Windows no uses `npm run` si hay flags):
 *   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"
 *   node scripts/evaluar-respuestas-chatbot.js
 *   node scripts/evaluar-respuestas-chatbot.js --dry-run
 *   node scripts/evaluar-respuestas-chatbot.js --limit=50
 *   node scripts/evaluar-respuestas-chatbot.js --all
 *   node scripts/evaluar-respuestas-chatbot.js --id=<uuid>
 *
 * Compat: EVAL_RUN=0 o EVAL_DRY=1 = dry-run. EVAL_LIMIT / EVAL_MODEL / EVAL_CONCURRENCY.
 */
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const { mkdirSync, writeFileSync } = require('fs')
const { resolve } = require('path')

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY
const MODEL = process.env.EVAL_MODEL || 'gpt-5.6-terra'
const VALORACIONES = ['correcta', 'mejorable', 'incorrecta']
const DATA_GAPS = ['none', 'missing', 'not_retrieved', 'ignored']
const CAUSAS = ['precio', 'geo', 'gps', 'filtros', 'idioma', 'tipo', 'invento', 'ruta', 'servicios', 'prompt', 'datos', 'ninguna']
const REPORT_PATH = resolve(process.cwd(), 'scripts/INFORME-REVISION-MENSAJES.md')

function parseArgs() {
  const args = process.argv.slice(2)
  const envDry = /^(0|false|no)$/i.test(process.env.EVAL_RUN || '')
    || /^(1|true|yes)$/i.test(process.env.EVAL_DRY || '')
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const envLimit = process.env.EVAL_LIMIT
  let limit = 200
  if (limitArg) limit = parseInt(limitArg.split('=')[1] || '0', 10)
  else if (envLimit != null && envLimit !== '') limit = parseInt(envLimit, 10)
  return {
    dryRun: args.includes('--dry-run') || envDry,
    all: args.includes('--all'),
    limit: Number.isFinite(limit) ? limit : 200,
    id: args.find((a) => a.startsWith('--id='))?.split('=')[1]?.trim() || undefined,
    concurrency: parseInt(
      args.find((a) => a.startsWith('--concurrency='))?.split('=')[1]
        || process.env.EVAL_CONCURRENCY
        || '4',
      10
    ) || 4,
  }
}

function extractJson(text) {
  const raw = (text || '').trim()
  if (!raw) return null
  try { return JSON.parse(raw) } catch {}
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return null
  try { return JSON.parse(m[0]) } catch { return null }
}

function serviciosConfirmados(servicios) {
  if (!servicios || typeof servicios !== 'object') return []
  return Object.entries(servicios)
    .filter(([, v]) => v === true)
    .map(([k]) => k)
}

async function fetchAreasContexto(supa, areasIds) {
  if (!Array.isArray(areasIds) || areasIds.length === 0) return []
  const { data, error } = await supa
    .from('areas')
    .select('id,nombre,slug,ciudad,provincia,pais,precio_noche,plazas_totales,servicios,tipo_area,google_rating,google_ratings_total')
    .in('id', areasIds.slice(0, 12))
  if (error) return []
  return data || []
}

/**
 * Mensajes previos al turno evaluado (como los ve el Tío Viajero).
 * Si no hay conversacion_id o falla la tabla, se evalúa solo pregunta/respuesta.
 */
async function getConversationForReview(supa, log) {
  if (!log.conversacion_id) {
    return { lastUserQuestion: log.pregunta || '', priorContext: '' }
  }
  try {
    const { data, error } = await supa
      .from('chatbot_mensajes')
      .select('id, rol, contenido, created_at')
      .eq('conversacion_id', log.conversacion_id)
      .order('created_at', { ascending: true })
    if (error || !data) {
      return { lastUserQuestion: log.pregunta || '', priorContext: '' }
    }

    const priorLines = []
    let lastUser = log.pregunta || ''
    const respuesta = (log.respuesta || '').trim()

    for (const m of data) {
      const content = (m.contenido || '').trim()
      if (!content) continue
      if (respuesta && content === respuesta && (m.rol === 'assistant' || m.rol === 'asistente')) {
        break
      }
      const label = m.rol === 'user' || m.rol === 'usuario' ? 'Usuario' : 'TioViajero'
      priorLines.push(`${label}: ${content}`)
      if (m.rol === 'user' || m.rol === 'usuario') lastUser = content
    }

    const priorContext =
      priorLines.length > 1
        ? priorLines.slice(0, -1).join('\n')
        : priorLines.length === 1 && priorLines[0].startsWith('TioViajero:')
          ? priorLines[0]
          : ''

    return { lastUserQuestion: lastUser || log.pregunta || '', priorContext }
  } catch {
    return { lastUserQuestion: log.pregunta || '', priorContext: '' }
  }
}

async function fetchSystemPrompt(supa) {
  const { data } = await supa
    .from('chatbot_config')
    .select('system_prompt')
    .eq('nombre', 'asistente_principal')
    .eq('activo', true)
    .maybeSingle()
  return (data?.system_prompt || '').slice(0, 4000)
}

function buildEvaluationUserContent({ priorContext, userQuestion, assistantAnswer, funciones, locale, votoUsuario }) {
  return `${
    priorContext
      ? `CONTEXTO PREVIO DE LA CONVERSACION (memoria que tuvo el Tio Viajero al responder):
${priorContext}

`
      : ''
  }ULTIMO MENSAJE DEL USUARIO (turno evaluado):
${userQuestion || '(sin pregunta previa clara)'}

IDIOMA DE LA INTERFAZ: ${locale || 'es'}

VOTO DEL USUARIO: ${votoUsuario || '(sin voto)'}

BUSQUEDAS EJECUTADAS (function calling):
${JSON.stringify(funciones || [], null, 2)}

RESPUESTA DEL ASISTENTE:
${assistantAnswer || '(vacia)'}`
}

function auditorSystemPrompt(areasReales, systemPromptAsistente) {
  const datos = areasReales.map((a) => ({
    nombre: a.nombre,
    slug: a.slug,
    ciudad: a.ciudad,
    provincia: a.provincia,
    pais: a.pais,
    tipo_area: a.tipo_area,
    precio_noche: a.precio_noche,
    plazas: a.plazas_totales,
    valoracion_google: a.google_rating,
    valoraciones_total: a.google_ratings_total,
    servicios_confirmados: serviciosConfirmados(a.servicios),
  }))

  return `Eres un auditor de calidad ESCRUPULOSO del chatbot "Tio Viajero" de Mapa Furgocasa (areas para autocaravanas).
Evaluas UNA respuesta concreta comparandola con los DATOS REALES de abajo y las reglas. NO inventes areas ni precios para "completar" la evaluacion.

Solo hay tres tipos: area publica, area privada y camping. Si el chatbot presenta "stopover" como un cuarto tipo, es INCORRECTA. El nombre local (aire, sosta, Stellplatz, camperplaats, CL, Brit Stop) no es un tipo.

=== DATOS REALES DE LAS AREAS MENCIONADAS (FUENTE DE VERDAD, PRIORIDAD MAXIMA) ===
Si la respuesta contradice estos datos, es INCORRECTA aunque suene bien.
${JSON.stringify(datos, null, 2)}
=== FIN DATOS REALES ===

=== REGLAS DEL ASISTENTE (extracto del system prompt en produccion) ===
${systemPromptAsistente || '(no disponible)'}
=== FIN REGLAS ===

Verificaciones obligatorias antes de puntuar:
1. Precio: "Gratis" SOLO si precio_noche === 0. Si precio_noche es null y dice Gratis / free / gratuit, es INCORRECTA. "Precio no disponible" es lo correcto cuando es null.
2. Tipos: publica = ayuntamiento/organismo; privada = empresa/particular (camper park, granja, Weingut, CL); camping = recinto. Un parking de autocaravanas del pueblo es publica o privada, no un cuarto tipo.
3. GPS: buscar "cerca de mi" con coordenadas 0,0 / Null Island, o inventar una ubicacion sin GPS ni ciudad, es INCORRECTA. Sin GPS debe pedir la ciudad.
4. Filtros: si el usuario SOLO nombra una ciudad o pais ("Murcia", "Viseu", "En Tecolutla") y la busqueda hereda servicios, tipo_area o solo_gratuitas del turno anterior, es INCORRECTA o MEJORABLE segun gravedad.
5. Idioma: debe responder en el idioma del ULTIMO mensaje del usuario. Mezclar idiomas o responder en el de la UI cuando el usuario escribio en otro es INCORRECTA.
6. Inventos: areas, servicios, precios, plazas, URLs (example.com, maps.google, imagenes markdown) que no estan en DATOS REALES → INCORRECTA.
   Distancias (km) y desvios que vengan de search_areas / search_areas_along_route SON validos aunque no esten en la ficha estatica. No penalices por eso.
   El slug correcto es el de DATOS REALES (campo slug), no uno inventado por ti.
7. Rutas: "voy de A a B" / "where to stop" debe listar paradas concretas (search_areas_along_route). Solo redirigir a /ruta sin listar es MEJORABLE o INCORRECTA.
8. Servicios: solo los que estan en true. Formato "[agua: no, electricidad: si]" o listar servicios en false es MEJORABLE.
9. Fuera de catalogo: gasolineras, talleres, restaurantes, hoteles NO estan en el mapa. Si los inventa como areas, es INCORRECTA. Explicar que solo hay areas de autocaravanas es CORRECTA.
10. Contexto conversacional: el asistente ve el hilo. Un follow-up corto ("y en Granada?", "gratis?") se interpreta en el tema abierto. NO marques incorrecta por "asumir el tema" si el follow-up encaja.
11. Saludo / agradecimiento sin busqueda: si la respuesta es adecuada, es CORRECTA.
12. Enlaces: solo /area/{slug}. Google Maps o URLs inventadas → INCORRECTA.
13. Valoracion: no digas "5 estrellas" sin volumen. Si hay google_ratings_total, debe mencionarse. Omitirlo es MEJORABLE, no incorrecta.
14. POI turisticos (grutas, catedrales, playas): debe buscar areas CERCA de esa ciudad, no un area con ese nombre. Si busca el nombre del monumento como si fuera un area y no hay, es MEJORABLE.
15. Voto del usuario (up/down): es una senal extra, NO sustituye los datos. Incorrecta + up sigue siendo INCORRECTA (gusto != verdad). Correcta + down puede ser MEJORABLE si el tono, el orden o la utilidad fallaron. Cita el voto en notes solo si discrepa de la calidad factual.

Criterios:
- correcta: responde a lo preguntado, coherente con DATOS REALES y reglas, sin errores. No falta info obligatoria del tema concreto.
- mejorable: la idea es correcta pero falta precision, busqueda, formato o claridad SOBRE EL MISMO TEMA (sin errores de datos). NO uses mejorable por "podria haber anadido X" si X es otro tema.
- incorrecta: contradice DATOS REALES o las reglas, inventa, no responde a la pregunta, o dime Gratis cuando el precio es null.

Ademas, diagnostica el hueco de datos (data_gap):
- none: el dato estaba disponible o no hacia falta un hecho de ficha.
- missing: el hecho estable (precio, servicio, tipo) NO esta en DATOS REALES ni se busco un area que lo tuviera.
- not_retrieved: debia haber ejecutado una busqueda (search_areas / get_area_by_name / search_areas_along_route) y no lo hizo, o busco mal.
- ignored: el dato SI esta en DATOS REALES o en el resultado de la funcion y el asistente lo ignoro o lo contradijo.

Campo "causa" (UNA, la raiz principal): precio | geo | gps | filtros | idioma | tipo | invento | ruta | servicios | prompt | datos | ninguna.

Responde SOLO JSON valido:
{
  "quality": "correcta" | "mejorable" | "incorrecta",
  "notes": "breve explicacion en espanol (1-3 frases), citando el dato real si hubo error",
  "suggested_fix": "si es mejorable o incorrecta, que deberia haber dicho o que cambiar en prompt/funciones",
  "data_gap": "none" | "missing" | "not_retrieved" | "ignored",
  "causa": "precio" | "geo" | "gps" | "filtros" | "idioma" | "tipo" | "invento" | "ruta" | "servicios" | "prompt" | "datos" | "ninguna"
}`
}

async function evaluateMessage(openai, log, areasReales, systemPromptAsistente, prior) {
  const completion = await openai.chat.completions.create(
    {
      model: MODEL,
      max_completion_tokens: 2000,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: auditorSystemPrompt(areasReales, systemPromptAsistente) },
        {
          role: 'user',
          content: buildEvaluationUserContent({
            priorContext: prior.priorContext,
            userQuestion: prior.lastUserQuestion,
            assistantAnswer: log.respuesta,
            funciones: log.funciones,
            locale: log.locale,
            votoUsuario: log.voto_usuario === 'up' ? 'up (le gusto)' : log.voto_usuario === 'down' ? 'down (no le gusto)' : '',
          }),
        },
      ],
    },
    { timeout: 60000 }
  )

  const raw = completion.choices[0]?.message?.content || ''
  const parsed = extractJson(raw)
  if (!parsed || !VALORACIONES.includes(parsed.quality || parsed.valoracion)) {
    throw new Error('Veredicto inválido del revisor')
  }

  const quality = VALORACIONES.includes(parsed.quality) ? parsed.quality : parsed.valoracion
  return {
    id: log.id,
    user_question: prior.lastUserQuestion || log.pregunta || '',
    assistant_answer: log.respuesta || '',
    quality,
    notes: String(parsed.notes || parsed.motivo || '').slice(0, 1000) || 'Sin notas.',
    suggested_fix: String(parsed.suggested_fix || parsed.sugerencia || '').slice(0, 1000) || undefined,
    data_gap: DATA_GAPS.includes(parsed.data_gap) ? parsed.data_gap : 'none',
    causa: CAUSAS.includes(parsed.causa) ? parsed.causa : 'ninguna',
  }
}

function buildReport(results, dryRun) {
  const counts = { correcta: 0, mejorable: 0, incorrecta: 0 }
  const porCausa = {}
  for (const r of results) {
    counts[r.quality]++
    if (r.quality !== 'correcta') {
      const k = r.causa || 'ninguna'
      porCausa[k] = (porCausa[k] || 0) + 1
    }
  }

  const lines = [
    '# Informe de revision automatica de mensajes del Tio Viajero',
    '',
    `Generado: ${new Date().toISOString()}`,
    dryRun ? 'Modo: **dry-run** (sin escribir en Supabase)' : 'Modo: **aplicado** (clasificaciones guardadas)',
    '',
    '## Resumen',
    '',
    `- Correctas: ${counts.correcta}`,
    `- Mejorables: ${counts.mejorable}`,
    `- Incorrectas: ${counts.incorrecta}`,
    `- Total revisadas: ${results.length}`,
    '',
  ]

  if (Object.keys(porCausa).length) {
    lines.push('## Causas raiz (incorrectas + mejorables)', '')
    for (const [causa, n] of Object.entries(porCausa).sort((a, b) => b[1] - a[1])) {
      lines.push(`- ${causa}: ${n}`)
    }
    lines.push('')
  }

  const problematic = results.filter((r) => r.quality !== 'correcta')
  if (problematic.length) {
    lines.push('## Respuestas a mejorar o incorrectas', '')
    for (const r of problematic) {
      lines.push(`### ${r.quality.toUpperCase()} — ${String(r.id).slice(0, 8)}…`)
      lines.push('')
      lines.push(`**Pregunta:** ${r.user_question || '—'}`)
      lines.push('')
      const ans = r.assistant_answer || ''
      lines.push(`**Respuesta:** ${ans.slice(0, 500)}${ans.length > 500 ? '…' : ''}`)
      lines.push('')
      lines.push(`**Notas:** ${r.notes}`)
      if (r.suggested_fix) lines.push(`**Sugerencia:** ${r.suggested_fix}`)
      if (r.data_gap && r.data_gap !== 'none') {
        lines.push(`**Hueco:** ${r.data_gap}${r.causa && r.causa !== 'ninguna' ? ` · causa ${r.causa}` : ''}`)
      } else if (r.causa && r.causa !== 'ninguna') {
        lines.push(`**Causa:** ${r.causa}`)
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

async function main() {
  const { dryRun, all, limit, id, concurrency } = parseArgs()

  if (!SUPA_URL || !SUPA_KEY || !OPENAI_KEY) {
    console.error('Faltan credenciales (.env.local): Supabase (service role) u OpenAI')
    process.exit(1)
  }

  const supa = createClient(SUPA_URL, SUPA_KEY)
  const openai = new OpenAI({ apiKey: OPENAI_KEY, maxRetries: 2 })

  let query = supa
    .from('chatbot_respuestas_log')
    .select('id,pregunta,respuesta,locale,funciones,areas_ids,conversacion_id,created_at,valoracion_ia,evaluado_at,voto_usuario')
    .not('respuesta', 'is', null)
    .order('created_at', { ascending: false })

  if (id) query = query.eq('id', id)
  else if (!all) query = query.is('evaluado_at', null)
  if (!id && limit > 0) query = query.limit(limit)

  let { data: pendientes, error } = await query
  if (error && /voto_usuario/i.test(error.message || '')) {
    query = supa
      .from('chatbot_respuestas_log')
      .select('id,pregunta,respuesta,locale,funciones,areas_ids,conversacion_id,created_at,valoracion_ia,evaluado_at')
      .not('respuesta', 'is', null)
      .order('created_at', { ascending: false })
    if (id) query = query.eq('id', id)
    else if (!all) query = query.is('evaluado_at', null)
    if (!id && limit > 0) query = query.limit(limit)
    ;({ data: pendientes, error } = await query)
  }
  if (error) {
    console.error('❌ Error leyendo chatbot_respuestas_log (¿migración de evaluación ejecutada?):', error.message)
    process.exit(1)
  }

  const rows = pendientes || []
  console.log(`🧑‍⚖️ Agente revisor | Modelo: ${MODEL} | Mensajes: ${rows.length}${all ? ' (todos)' : ' (sin evaluar)'}${dryRun ? ' (dry-run)' : ''}${limit > 0 && !id ? ` · límite ${limit}` : ''}`)

  if (!rows.length) {
    console.log('✅ Nada que evaluar.')
    return
  }

  console.log('Cargando reglas del asistente y datos reales de areas...')
  const systemPromptAsistente = await fetchSystemPrompt(supa)

  const results = []
  const stats = { correcta: 0, mejorable: 0, incorrecta: 0, fallos: 0 }
  let index = 0
  let done = 0
  const startedAt = Date.now()

  async function worker() {
    while (index < rows.length) {
      const log = rows[index++]
      process.stdout.write(`[${Math.min(index, rows.length)}/${rows.length}] ${(log.pregunta || '').slice(0, 50)}… `)
      try {
        const [areasReales, prior] = await Promise.all([
          fetchAreasContexto(supa, log.areas_ids),
          getConversationForReview(supa, log),
        ])
        const review = await evaluateMessage(openai, log, areasReales, systemPromptAsistente, prior)
        results.push(review)
        stats[review.quality]++
        console.log(review.quality)

        if (!dryRun) {
          const { error: upError } = await supa
            .from('chatbot_respuestas_log')
            .update({
              valoracion_ia: review.quality,
              motivo_ia: review.notes,
              sugerencia_ia: review.suggested_fix || null,
              evaluado_at: new Date().toISOString(),
            })
            .eq('id', log.id)
          if (upError) throw new Error('DB: ' + upError.message)
        }
      } catch (e) {
        stats.fallos++
        const msg = (e && e.message) || String(e)
        console.log('error')
        console.log(`  ${msg}`)
        if (/rate|limit|429|quota|timeout|ECONN/i.test(msg)) {
          await new Promise((r) => setTimeout(r, 5000))
        }
      }
      done++
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, () => worker()))

  mkdirSync(resolve(process.cwd(), 'scripts'), { recursive: true })
  writeFileSync(REPORT_PATH, buildReport(results, dryRun), 'utf8')

  const mins = ((Date.now() - startedAt) / 60000).toFixed(1)
  const evaluadas = stats.correcta + stats.mejorable + stats.incorrecta
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`RESUMEN (${evaluadas} evaluadas en ${mins} min${dryRun ? ', dry-run' : ''}):`)
  console.log(`  ✅ Correctas:   ${stats.correcta} (${evaluadas ? Math.round(stats.correcta / evaluadas * 100) : 0}%)`)
  console.log(`  🟡 Mejorables:  ${stats.mejorable} (${evaluadas ? Math.round(stats.mejorable / evaluadas * 100) : 0}%)`)
  console.log(`  ❌ Incorrectas: ${stats.incorrecta} (${evaluadas ? Math.round(stats.incorrecta / evaluadas * 100) : 0}%)`)
  if (stats.fallos) console.log(`  ⚠️ Fallos de evaluación: ${stats.fallos}`)
  console.log(`\nInforme: ${REPORT_PATH}`)
  if (dryRun) console.log('👀 DRY-RUN. Quita --dry-run para guardar en chatbot_respuestas_log.')
}

main().catch((e) => {
  console.error('ERROR FATAL:', e)
  process.exit(1)
})
