/**
 * AGENTE REVISOR DE RESPUESTAS DEL TÍO VIAJERO
 * ============================================
 * Portado del auditor de Furgocasa (`review-chatbot-messages.ts`):
 * evalúa cada respuesta contra los DATOS REALES de las áreas y el
 * contexto de la conversación, no solo contra el texto suelto.
 *
 * Clasifica (el listón es el dueño del producto, no "no está mal"):
 *   - correcta:   la respuesta que querríamos en el chat del mapa
 *   - mejorable:  datos OK pero no es la respuesta perfecta de este widget
 *   - incorrecta: inventa, dispara a ciegas, o no sirve para lo que se preguntó
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
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs')
const { resolve } = require('path')

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY
const MODEL = process.env.EVAL_MODEL || 'gpt-5.6-terra'
const VALORACIONES = ['correcta', 'mejorable', 'incorrecta']
const DATA_GAPS = ['none', 'missing', 'not_retrieved', 'ignored']
const CAUSAS = ['precio', 'geo', 'gps', 'filtros', 'idioma', 'tipo', 'invento', 'ruta', 'servicios', 'prompt', 'datos', 'ninguna']
const REPORT_PATH = resolve(process.cwd(), 'scripts/INFORME-REVISION-MENSAJES.md')
const PENDIENTES_PATH = resolve(process.cwd(), 'scripts/INCIDENCIAS-PENDIENTES.csv')

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

function extractCitedAreaSlugs(respuesta) {
  const slugs = new Set()
  const re = /\/area\/([^/\s)"'?#]+)/gi
  let m
  while ((m = re.exec(respuesta || ''))) {
    if (m[1]) slugs.add(decodeURIComponent(m[1]))
  }
  return [...slugs]
}

async function fetchAreasContexto(supa, areasIds, slugsExtra) {
  const byId = new Map()
  if (Array.isArray(areasIds) && areasIds.length > 0) {
    const { data } = await supa
      .from('areas')
      .select('id,nombre,slug,ciudad,provincia,pais,precio_noche,plazas_totales,servicios,tipo_area,google_rating,google_ratings_total')
      .in('id', areasIds.slice(0, 12))
    for (const a of data || []) byId.set(a.id, a)
  }
  const slugs = (slugsExtra || []).filter(Boolean).slice(0, 12)
  if (slugs.length) {
    const { data } = await supa
      .from('areas')
      .select('id,nombre,slug,ciudad,provincia,pais,precio_noche,plazas_totales,servicios,tipo_area,google_rating,google_ratings_total')
      .in('slug', slugs)
    for (const a of data || []) byId.set(a.id, a)
  }
  const foundSlugs = new Set([...byId.values()].map((a) => a.slug))
  const citedMissing = slugs.filter((s) => !foundSlugs.has(s))
  return { areas: [...byId.values()], citedMissing }
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
  return (data?.system_prompt || '').slice(0, 7000)
}

function buildEvaluationUserContent({ priorContext, userQuestion, assistantAnswer, funciones, locale, votoUsuario, citedMissing }) {
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
${
  citedMissing && citedMissing.length
    ? `
SLUGS CITADOS EN LA RESPUESTA SIN FICHA EN BD: ${citedMissing.join(', ')}
`
    : ''
}
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

  return `Eres el revisor de producto del Tio Viajero, el chat PEQUEÑO embebido en https://www.mapafurgocasa.com/mapa (no un chatbot de viajes suelto).
Tu liston es el del dueño: no basta con que "no este mal". Preguntate: ¿dejaria esta respuesta publicada en ese widget? ¿Ayuda a decidir donde dormir o parar, o dispara como una metralleta?

NO inventes areas ni precios para completar la evaluacion. Solo tres tipos: publica, privada, camping. "Stopover" como cuarto tipo = INCORRECTA.

=== DATOS REALES DE LAS AREAS MENCIONADAS (FUENTE DE VERDAD) ===
Si contradice estos datos, es INCORRECTA aunque suene bien.
${JSON.stringify(datos, null, 2)}
=== FIN DATOS REALES ===

=== REGLAS DEL ASISTENTE (produccion) ===
${systemPromptAsistente || '(no disponible)'}
=== FIN REGLAS ===

QUE ES UNA RESPUESTA PERFECTA EN ESTE CHAT
- El widget es estrecho, encima del mapa. Maximo 3-4 fichas utiles, no 6-8 del mismo sitio.
- Si falta un dato para acertar (donde, pernocta vs tecnica, camping vs area, tramo de ruta), PREGUNTA eso y no listes. Preguntar bien es CORRECTA.
- "cerca de mi" + GPS: lista corta cerca, con distancias. Sin GPS: pide la ciudad.
- Filtro sin sitio ("areas con agua y electricidad", "gratis" a secas): pregunta si cerca de la ubicacion, una localidad o un punto del mapa. Listar el mundo o un saco al azar = INCORRECTA.
- Ruta A→B, "paradas en una ruta", "donde paro en el camino": CORRECTA si deriva a /ruta o /ruta?origen=A&destino=B y NO lista areas. El chat no ve el trazado real. Listar 3-4 areas del corredor a ojo = INCORRECTA. No pidas que el chat sustituya al planificador.
- Follow-up de grupo/familia ("vamos 2 adultos y dos niñas", "niña de 8") DESPUES de hablar de un area: es QUIEN viaja a ESA area, no un trayecto. CORRECTA si sigue en esa ficha con frases humanas. Derivar a /ruta = INCORRECTA.
- Responder SOLO con la ficha, sin hablar como persona del hilo = MEJORABLE.
- Ciudad suelta ("Huesca"): pregunta que necesita, no lances guia ni listado por si acaso.
- Turismo / que ver: no es guia. Enlaza el blog de rutas Furgocasa. Inventar pueblos o planes = INCORRECTA.
- Precio Gratis SOLO si precio_noche === 0. null → "Precio no disponible".
- Enlaces solo /area/{slug}. Maps, example.com, imagenes markdown = INCORRECTA.
- Idioma = ultimo mensaje del usuario.
- No heredar filtros del turno anterior si solo nombran otra ciudad.
- Gasolinera/taller: no son fichas /area/. Si los inventa como area = INCORRECTA.
- Valoracion: si hay google_ratings_total, mencionarlo. Omitirlo = MEJORABLE.
- El usuario tiene 2 preguntas gratis. Una respuesta inútil (racimo, disparo a ciegas) es un fallo grave, no un "casi bien".

HECHOS (siguen siendo INCORRECTA si fallan):
1. Precio inventado / Gratis con null.
2. Tipo inventado o stopover como tipo.
3. GPS 0,0 o "cerca de mi" sin sitio.
4. Invento de area, servicio, plazas, URL o slug.
5. Idioma equivocado.
Distancias/desvios de las tools son validos. El slug es el de DATOS REALES.

Voto 👍/👎: señal extra. Incorrecta + 👍 sigue INCORRECTA. Correcta + 👎 puede bajar a MEJORABLE si no era util en el widget.

Criterios (severos):
- correcta: la publicarias en el chat del mapa. Completa el trabajo O pregunta justo lo que faltaba. Datos fieles. 3-4 fichas o ninguna.
- mejorable: datos bien, pero no es la respuesta perfecta de ESTE chat (demasiadas fichas, no pregunta el donde, omite reseñas, tono de listado).
- incorrecta: datos malos, O responde a una pregunta incompleta como si ya estuviera resuelta (metralleta de origen, listado sin sitio, guia turistica).

NO marques correcta solo porque "no invento precios". Un listado inutil y factual sigue siendo incorrecta o mejorable.

NO mezcles temas no preguntados: si la respuesta responde BIEN a lo que el usuario pregunta, NO la bajes porque el prompt o las tools contienen info relacionada pero DISTINTA.
Contexto conversacional: si hay CONTEXTO PREVIO y el ultimo mensaje es un follow-up corto ("y con agua?", "cerca de Murcia?", "gratis?"), interpretalo en ese hilo. NO marques incorrecta por "asumir el tema".
Un /area/{slug} citado que aparece en SLUGS SIN FICHA = INCORRECTA (enlace inventado). Precio, tipo y plazas deben coincidir con DATOS REALES.

data_gap: none | missing | not_retrieved | ignored
  missing = el area/hecho no esta en BD. not_retrieved = existe pero las tools no lo trajeron. ignored = si estaba en DATOS REALES y el bot lo ignoro o contradijo.
causa (UNA): precio | geo | gps | filtros | idioma | tipo | invento | ruta | servicios | prompt | datos | ninguna
  prompt = fallo de utilidad/conversacion del widget (disparar, no preguntar, racimo).
Si data_gap es missing o not_retrieved, propone UN hecho estable en data_title + data_body (no tono, no precios vivos).

Responde SOLO JSON:
{
  "quality": "correcta" | "mejorable" | "incorrecta",
  "notes": "1-3 frases en espanol, como el dueño: por que sirve o no en el chat del mapa",
  "suggested_fix": "que debio preguntar o listar (3-4) si no es correcta",
  "data_gap": "none" | "missing" | "not_retrieved" | "ignored",
  "data_title": "titulo corto si hay hueco (opcional)",
  "data_body": "hecho estable 3-8 frases si hay hueco (opcional)",
  "causa": "precio" | "geo" | "gps" | "filtros" | "idioma" | "tipo" | "invento" | "ruta" | "servicios" | "prompt" | "datos" | "ninguna"
}`
}

async function evaluateMessage(openai, log, areasReales, systemPromptAsistente, prior, citedMissing) {
  const completion = await openai.chat.completions.create(
    {
      model: MODEL,
      max_completion_tokens: 2000,
      reasoning_effort: 'medium',
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
            citedMissing,
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
    data_title: String(parsed.data_title || '').trim() || undefined,
    data_body: String(parsed.data_body || '').trim() || undefined,
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
        lines.push(`**Hueco:** ${r.data_gap}${r.data_title ? ` · ${r.data_title}` : ''}${r.causa && r.causa !== 'ninguna' ? ` · causa ${r.causa}` : ''}`)
      } else if (r.causa && r.causa !== 'ninguna') {
        lines.push(`**Causa:** ${r.causa}`)
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

function csvCell(s) {
  return `"${String(s).replace(/"/g, '""')}"`
}

function writePendientes(results) {
  const existing = []
  if (existsSync(PENDIENTES_PATH)) {
    for (const line of readFileSync(PENDIENTES_PATH, 'utf8').split(/\r?\n/).slice(1)) {
      if (!line.trim()) continue
      const m = line.match(/^"((?:[^"]|"")*)","((?:[^"]|"")*)"$/)
      if (!m) continue
      const title = m[1].replace(/""/g, '"').trim()
      const body = m[2].replace(/""/g, '"').trim()
      if (title && body) existing.push([title, body])
    }
  }
  const seen = new Set(
    existing.map(([t]) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase())
  )
  let added = 0
  for (const r of results) {
    if ((r.data_gap !== 'missing' && r.data_gap !== 'not_retrieved') || !r.data_title || !r.data_body) continue
    const key = r.data_title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    if (seen.has(key)) continue
    existing.push([r.data_title, r.data_body])
    seen.add(key)
    added += 1
  }
  writeFileSync(
    PENDIENTES_PATH,
    `${['titulo,contenido', ...existing.map(([t, b]) => `${csvCell(t)},${csvCell(b)}`)].join('\n')}\n`,
    'utf8'
  )
  if (added) console.log(`Huecos: ${added} propuestas en scripts/INCIDENCIAS-PENDIENTES.csv`)
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
        const citedSlugs = extractCitedAreaSlugs(log.respuesta)
        const [areaPack, prior] = await Promise.all([
          fetchAreasContexto(supa, log.areas_ids, citedSlugs),
          getConversationForReview(supa, log),
        ])
        const review = await evaluateMessage(
          openai,
          log,
          areaPack.areas,
          systemPromptAsistente,
          prior,
          areaPack.citedMissing
        )
        results.push(review)
        stats[review.quality]++
        console.log(review.quality)

        if (!dryRun) {
          const { error: upError } = await supa
            .from('chatbot_respuestas_log')
            .update({
              valoracion_ia: review.quality,
              motivo_ia: `[auto] ${review.notes}${review.data_gap && review.data_gap !== 'none' ? ` | hueco: ${review.data_gap}` : ''}${review.causa && review.causa !== 'ninguna' ? ` | causa: ${review.causa}` : ''}`,
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
  if (!dryRun) writePendientes(results)

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
