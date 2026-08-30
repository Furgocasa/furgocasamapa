/**
 * Texto propio al molde Petervan: 2-3 párrafos de lo que hace el taller,
 * a partir de SU web. No Camperizando. No inventar accesorios.
 *
 *   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"
 *   node scripts/enriquecer-textos-talleres.mjs
 *
 * TXT_LIMIT=15  TXT_DRYRUN=1  TXT_CONCURRENCY=3
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, appendFileSync, readFileSync, existsSync } from 'fs'

const here = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(here, '..', '.env.local') })

const DRY = /^(1|true|yes)$/i.test(process.env.TXT_DRYRUN || '')
const LIMIT = parseInt(process.env.TXT_LIMIT || '0', 10) || 0
const CONCURRENCY = Math.max(1, parseInt(process.env.TXT_CONCURRENCY || '3', 10) || 3)
const CHECKPOINT = resolve(here, 'talleres-textos-checkpoint.txt')
const PLANTILLA = /es un taller de (camperizado y accesorios|campers y autocaravanas)/i
const RED_SOCIAL =
  /instagram\.com|facebook\.com|fb\.com|tiktok\.com|twitter\.com|x\.com|youtube\.com/i

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function loadDone() {
  if (!existsSync(CHECKPOINT)) return new Set()
  return new Set(readFileSync(CHECKPOINT, 'utf8').split(/\r?\n/).filter(Boolean))
}

function markDone(id) {
  appendFileSync(CHECKPOINT, id + '\n')
}

async function textoWeb(url) {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MapafurgoCasa/1.0)', Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })
    if (!resp.ok) return ''
    const html = await resp.text()
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4500)
  } catch {
    return ''
  }
}

async function redactar(t, webText) {
  const sitio = [t.ciudad, t.provincia].filter(Boolean).join(', ')
  const prompt = `Eres redactor de fichas de talleres camper para MapafurgoCasa. Español de España. Molde Petervan: 2 o 3 párrafos, hechos, sin marketing vacío.

DATOS:
- Nombre: ${t.nombre}
- Sitio: ${sitio || 'España'}
- Dirección: ${t.direccion || 'no'}
- Web: ${t.website || 'no'}
- Google: ${t.google_rating || '—'}★ (${t.google_ratings_total || 0} reseñas)

TEXTO DE SU WEB (puede estar vacío o ser menú):
${webText || '(sin texto usable)'}

REGLAS:
- Solo lo que confirme la web o los datos de arriba. Si la web no dice que instalan placas, no lo digas.
- No copies directorios (Camperizando, Facebook). No inventes horarios ni precios.
- Prohibido: "consulta antes", "se recomienda", "posiblemente", "destino ideal".
- No pongas la URL. No uses listas.
- Si la web no sirve, usa la búsqueda web para hechos de ESE taller (dirección, qué hace, nota Google). No copies directorios.
- Prohibido el párrafo-cliché «X es un taller de camperizado y accesorios situado en… Cuenta con una valoración…». Eso es plantilla. Escribe 2 párrafos distintos, con datos reales.
- Si no hay nada más que nombre, sitio y nota: 2 párrafos cortos y distintos, sin inventar accesorios.
- Devuelve solo el texto, párrafos separados por línea en blanco.`

  const resp = await openai.responses.create({
    model: process.env.TXT_MODEL || 'gpt-5.6-terra',
    max_output_tokens: 700,
    tools: [{ type: 'web_search' }],
    input: [{ role: 'user', content: prompt }],
  })
  return (resp.output_text || '').replace(/\n{3,}/g, '\n\n').trim()
}

async function mapPool(items, n, fn) {
  const q = items.slice()
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (q.length) {
      const item = q.shift()
      await fn(item)
    }
  })
  await Promise.all(workers)
}

async function main() {
  const done = loadDone()
  const { data, error } = await sb
    .from('talleres')
    .select('id,nombre,slug,ciudad,provincia,direccion,website,descripcion,google_rating,google_ratings_total')
    .eq('activo', true)
    .order('nombre')
  if (error) throw error

  const pending = (data || []).filter((t) => {
    if (t.slug === 'petervan-camper-murcia') return false
    const desc = t.descripcion || ''
    return !desc || PLANTILLA.test(desc)
  })
  const lote = LIMIT ? pending.slice(0, LIMIT) : pending
  console.log(`🧭 ${pending.length} plantilla, lote ${lote.length}${DRY ? ' DRY' : ''}`)
  if (DRY) {
    lote.forEach((t) => console.log(' -', t.nombre, t.website || '(sin web)'))
    return
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('Falta OPENAI_API_KEY')
    process.exit(1)
  }

  let ok = 0
  let fail = 0
  await mapPool(lote, CONCURRENCY, async (t) => {
    try {
      const web = t.website && !RED_SOCIAL.test(t.website) ? await textoWeb(t.website) : ''
      const text = await redactar(t, web)
      if (!text || text.length < 120) throw new Error('texto corto')
      if (PLANTILLA.test(text) && text.length < 280) throw new Error('sigue siendo plantilla')
      const { error: up } = await sb
        .from('talleres')
        .update({ descripcion: text, updated_at: new Date().toISOString() })
        .eq('id', t.id)
      if (up) throw up
      markDone(t.id)
      ok++
      console.log(`✓ ${t.nombre} (${text.length}c${web ? ', web' : ''})`)
    } catch (e) {
      fail++
      console.log(`✗ ${t.nombre} ${e.message || e}`)
    }
  })
  console.log(`\nRESUMEN: ${ok} textos, ${fail} fallos, de ${lote.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
