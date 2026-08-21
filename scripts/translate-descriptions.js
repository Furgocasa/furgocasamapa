/**
 * TRADUCCIÓN MASIVA DE TEXTOS DE ÁREAS (i18n)
 * ===========================================
 * Traduce nombre, descripción y ubicación a FR, DE, IT, EN y los guarda
 * en `areas_traducciones` (requiere migraciones 20260728_areas_traducciones*.sql).
 *
 * 1 llamada OpenAI por (área, idioma) → JSON con todos los campos.
 * Dry-run por defecto. Reanudable con checkpoint.
 *
 * USO (PowerShell):
 *   node scripts/translate-descriptions.js
 *   $env:TRAD_RUN="1"; node scripts/translate-descriptions.js
 *
 * Variables opcionales:
 *   TRAD_LANGS        (def "fr,de,it,en")
 *   TRAD_MODEL        (def "gpt-5.6-terra")
 *   TRAD_CONCURRENCY  (def 5)
 *   TRAD_LIMIT        (0 = todas)
 */
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY
const LANGS = (process.env.TRAD_LANGS || 'fr,de,it,en').split(',').map((l) => l.trim().toLowerCase())
const MODEL = process.env.TRAD_MODEL || 'gpt-5.6-terra'
const CONCURRENCY = parseInt(process.env.TRAD_CONCURRENCY || '5', 10)
const LIMIT = parseInt(process.env.TRAD_LIMIT || '0', 10)
const RUN = /^(1|true|yes)$/i.test(process.env.TRAD_RUN || '')
const PROVINCIA = (process.env.TRAD_PROVINCIA || '').trim()
const FORCE = /^(1|true|yes)$/i.test(process.env.TRAD_FORCE || '')
const IDS = new Set((process.env.TRAD_IDS || '').split(',').map((id) => id.trim()).filter(Boolean))
const CHECKPOINT = path.join(__dirname, 'translate-checkpoint.txt')

const IDIOMAS = {
  fr: 'francés', de: 'alemán', it: 'italiano', en: 'inglés', pt: 'portugués', nl: 'neerlandés'
}

const CAMPOS = ['nombre', 'descripcion', 'direccion', 'ciudad', 'provincia', 'comunidad', 'pais']

function loadCheckpoint() {
  try { return new Set(fs.readFileSync(CHECKPOINT, 'utf8').split(/\r?\n/).filter(Boolean)) } catch { return new Set() }
}
function appendCheckpoint(key) { try { fs.appendFileSync(CHECKPOINT, key + '\n') } catch {} }

function comunidadDe(area) {
  return area.comunidad || area.comunidad_autonoma || null
}

async function fetchAllAreas(supa) {
  const all = []
  const pageSize = 1000
  let page = 0
  while (true) {
    const { data, error } = await supa
      .from('areas')
      .select('id,nombre,descripcion,direccion,ciudad,provincia,comunidad,comunidad_autonoma,pais')
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

async function fetchExistingTranslations(supa) {
  // key -> true si ya tiene nombre + descripcion (traducción completa)
  const complete = new Set()
  const pageSize = 1000
  let page = 0
  while (true) {
    const { data, error } = await supa
      .from('areas_traducciones')
      .select('area_id,idioma,nombre,descripcion')
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) {
      console.warn('⚠️ No se pudo leer areas_traducciones (¿migración ejecutada?):', error.message)
      return complete
    }
    if (!data || data.length === 0) break
    data.forEach((t) => {
      if (t.nombre && t.descripcion && String(t.descripcion).trim().length >= 100) {
        complete.add(`${t.area_id}:${t.idioma}`)
      }
    })
    if (data.length < pageSize) break
    page++
  }
  return complete
}

function extractJson(text) {
  const raw = (text || '').trim()
  if (!raw) return null
  try { return JSON.parse(raw) } catch {}
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return null
  try { return JSON.parse(m[0]) } catch { return null }
}

async function translateArea(openai, area, lang) {
  const fuente = {
    nombre: area.nombre || '',
    descripcion: area.descripcion || '',
    direccion: area.direccion || '',
    ciudad: area.ciudad || '',
    provincia: area.provincia || '',
    comunidad: comunidadDe(area) || '',
    pais: area.pais || '',
  }

  const resp = await openai.responses.create(
    {
      model: MODEL,
      max_output_tokens: 3500,
      input: [
        {
          role: 'system',
          content: `Eres un traductor profesional de turismo y autocaravanas. Traduce al ${IDIOMAS[lang]} TODOS los campos del JSON que te dé el usuario.
Reglas:
- Devuelve SOLO un JSON válido con exactamente estas claves: ${CAMPOS.join(', ')}.
- Mantén nombres propios de lugares cuando sea natural; adapta términos genéricos (área, camping, parking, autocaravana…).
- Conserva el tono y los párrafos de la descripción.
- Si un campo viene vacío, devuélvelo como cadena vacía "".
- Sin comentarios ni markdown.`
        },
        { role: 'user', content: JSON.stringify(fuente) }
      ]
    },
    { timeout: 90000 }
  )

  const parsed = extractJson(resp.output_text || '')
  if (!parsed || typeof parsed !== 'object') throw new Error('JSON inválido')

  const out = {}
  for (const k of CAMPOS) {
    const v = parsed[k]
    out[k] = v == null ? '' : String(v).trim()
  }
  if (!out.descripcion || out.descripcion.length < 100) throw new Error('Descripción vacía/corta')
  if (!out.nombre) out.nombre = area.nombre
  return out
}

async function main() {
  if (!SUPA_URL || !SUPA_KEY || !OPENAI_KEY) {
    console.error('Faltan credenciales (.env.local): Supabase (service role) u OpenAI')
    process.exit(1)
  }
  console.log(`🌍 Idiomas: ${LANGS.join(', ')} | Modelo: ${MODEL} | Modo: ${RUN ? '✍️ TRADUCIR' : '👀 DRY-RUN (solo contar)'}${PROVINCIA ? ` | Provincia: ${PROVINCIA}` : ''}${IDS.size ? ` | ${IDS.size} áreas seleccionadas` : ''}${FORCE ? ' | Forzar actualización' : ''}`)

  const supa = createClient(SUPA_URL, SUPA_KEY)
  const openai = new OpenAI({ apiKey: OPENAI_KEY, maxRetries: 2 })
  const checkpoint = loadCheckpoint()

  console.log('📦 Cargando áreas y traducciones existentes...')
  const [allAreas, existing] = await Promise.all([fetchAllAreas(supa), fetchExistingTranslations(supa)])
  const areas = allAreas.filter((a) =>
    (!PROVINCIA || a.provincia === PROVINCIA) &&
    (!IDS.size || IDS.has(a.id))
  )

  let pares = []
  for (const a of areas) {
    if (!a.descripcion || a.descripcion.trim().length < 200) continue
    for (const lang of LANGS) {
      const key = `${a.id}:${lang}`
      if ((!FORCE && existing.has(key)) || (!FORCE && checkpoint.has(key))) continue
      pares.push({ area: a, lang, key })
    }
  }
  if (LIMIT > 0) pares = pares.slice(0, LIMIT)

  console.log(`🎯 Traducciones pendientes: ${pares.length} (de ${areas.length} áreas activas)`)
  if (!RUN || pares.length === 0) {
    if (!RUN) console.log('   Ejecuta con TRAD_RUN=1 para traducir de verdad.')
    return
  }

  let done = 0, ok = 0, fail = 0
  let index = 0
  const startedAt = Date.now()

  async function worker() {
    while (index < pares.length) {
      const { area, lang, key } = pares[index++]
      try {
        const t = await translateArea(openai, area, lang)
        const { error } = await supa.from('areas_traducciones').upsert(
          {
            area_id: area.id,
            idioma: lang,
            nombre: t.nombre || null,
            descripcion: t.descripcion,
            direccion: t.direccion || null,
            ciudad: t.ciudad || null,
            provincia: t.provincia || null,
            comunidad: t.comunidad || null,
            pais: t.pais || null,
            modelo: MODEL,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'area_id,idioma' }
        )
        if (error) throw new Error('DB: ' + error.message)

        ok++; appendCheckpoint(key)
        console.log(`✓ [${++done}/${pares.length}] ${area.nombre} → ${lang}`)
      } catch (e) {
        fail++; done++
        const msg = (e && e.message) || String(e)
        console.log(`✗ [${done}/${pares.length}] ${area.nombre} → ${lang}: ${msg}`)
        if (/rate|limit|429|quota|timeout|ECONN/i.test(msg)) await new Promise((r) => setTimeout(r, 5000))
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pares.length) }, () => worker()))

  const mins = ((Date.now() - startedAt) / 60000).toFixed(1)
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nRESUMEN: ${ok} OK, ${fail} fallos en ${mins} min`)
}

main().catch((e) => { console.error('ERROR FATAL:', e); process.exit(1) })
