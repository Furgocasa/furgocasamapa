/**
 * ENRIQUECIMIENTO DE DATOS ESTRUCTURADOS (servicios, precio, plazas)
 * ==================================================================
 * Complementa a bulk-enrich.js (que solo mejora la DESCRIPCIÓN).
 * Este script investiga cada área con GPT + búsqueda web y propone valores
 * para los campos estructurados que estén vacíos:
 *   - servicios (agua, electricidad, vaciados, wifi, duchas, wc, etc.)
 *   - precio_noche
 *   - plazas_totales
 *
 * SEGURIDAD DE DATOS:
 *   - Por defecto NO escribe en la base de datos: genera
 *     scripts/enrich-datos-propuestas.csv para que revises las propuestas.
 *   - Con --apply escribe SOLO los campos que estaban vacíos (nunca
 *     sobreescribe datos existentes) y solo si la IA declara confianza alta.
 *
 * COSTE: solo OpenAI (web_search incluida). NADA de Google.
 *
 * USO (PowerShell):
 *   node scripts/enrich-datos-estructurados.js            # dry-run -> CSV de propuestas
 *   node scripts/enrich-datos-estructurados.js --apply    # aplica propuestas de confianza alta
 *
 * Variables opcionales:
 *   DATOS_CONCURRENCY (def 4)   DATOS_LIMIT (0 = todas)
 *   DATOS_MODEL (def gpt-5.5)   DATOS_TIMEOUT_MS (def 90000)
 *   DATOS_CHECKPOINT (def enrich-datos-checkpoint.txt)
 *
 * Reanudable: igual que bulk-enrich.js, con checkpoint propio.
 */
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY
const CONCURRENCY = parseInt(process.env.DATOS_CONCURRENCY || '4', 10)
const LIMIT = parseInt(process.env.DATOS_LIMIT || '0', 10)
const MODEL = process.env.DATOS_MODEL || 'gpt-5.5'
const REQ_TIMEOUT_MS = parseInt(process.env.DATOS_TIMEOUT_MS || '90000', 10)
const CHECKPOINT = path.join(__dirname, process.env.DATOS_CHECKPOINT || 'enrich-datos-checkpoint.txt')
const APPLY = process.argv.includes('--apply')
const CSV_PATH = path.join(__dirname, 'enrich-datos-propuestas.csv')

// Claves de servicios EXACTAS de la base de datos (ver FiltrosMapa.tsx)
const SERVICIOS_KEYS = [
  'agua', 'electricidad', 'vaciado_aguas_negras', 'vaciado_aguas_grises',
  'wifi', 'duchas', 'wc', 'lavanderia', 'restaurante', 'supermercado', 'zona_mascotas'
]

function loadCheckpoint() {
  try { return new Set(fs.readFileSync(CHECKPOINT, 'utf8').split(/\r?\n/).filter(Boolean)) } catch { return new Set() }
}
function appendCheckpoint(id) { try { fs.appendFileSync(CHECKPOINT, id + '\n') } catch {} }

function serviciosConfirmados(servicios) {
  if (!servicios || typeof servicios !== 'object') return 0
  return Object.values(servicios).filter((v) => v === true).length
}

// Un área necesita trabajo si le falta algún dato estructurado importante
function needsWork(a) {
  return serviciosConfirmados(a.servicios) === 0 || a.precio_noche == null || (!a.plazas_totales && !a.plazas_camper)
}

function buildInput(area) {
  const faltan = []
  if (serviciosConfirmados(area.servicios) === 0) faltan.push('servicios')
  if (area.precio_noche == null) faltan.push('precio_noche')
  if (!area.plazas_totales && !area.plazas_camper) faltan.push('plazas_totales')

  const system = `Eres un investigador de datos de áreas para autocaravanas. Tienes búsqueda web: ÚSALA SIEMPRE.
Busca el área en fuentes fiables (web oficial del ayuntamiento o del área, Park4night, Campercontact, CaraMaps, áreasAC, furgovw...).

REGLAS:
- SOLO devuelve un dato si lo has VERIFICADO en al menos una fuente. Si no lo encuentras, devuelve null.
- NUNCA inventes. Es mil veces mejor un null que un dato falso.
- Para cada servicio: true solo si una fuente lo confirma; null si no hay información (NUNCA false salvo que una fuente diga explícitamente que no lo tiene).
- precio_noche: número en euros (0 si es gratuita y está confirmado). null si no está claro.
- plazas_totales: número entero. null si no está claro.
- confianza: "alta" solo si has encontrado el área exacta en 1+ fuentes fiables; "media" si la fuente es dudosa; "baja" si apenas hay información.
- fuentes: lista de URLs consultadas donde encontraste los datos.

Devuelve EXCLUSIVAMENTE un JSON válido con esta forma exacta (sin markdown, sin texto extra):
{"confianza":"alta|media|baja","fuentes":["url1"],"precio_noche":null,"plazas_totales":null,"servicios":{${SERVICIOS_KEYS.map((k) => `"${k}":null`).join(',')}}}`

  const user = `ÁREA A INVESTIGAR:
- Nombre: ${area.nombre}
- Ciudad: ${area.ciudad}
- Provincia: ${area.provincia}
- País: ${area.pais}
- Tipo: ${area.tipo_area || 'área de autocaravanas'}
- Coordenadas: ${area.latitud}, ${area.longitud}

DATOS QUE FALTAN Y DEBES BUSCAR: ${faltan.join(', ')}

Investiga en internet y devuelve el JSON.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ]
}

function parseJson(text) {
  if (!text) return null
  // tolerar ```json ... ``` u otro texto alrededor
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch { return null }
}

async function investigate(openai, area) {
  const params = {
    model: MODEL,
    tools: [{ type: 'web_search' }],
    tool_choice: 'required',
    reasoning: { effort: 'medium' },
    max_output_tokens: 2000,
    input: buildInput(area)
  }
  let resp
  try {
    resp = await openai.responses.create(params, { timeout: REQ_TIMEOUT_MS })
  } catch (e) {
    if (/tool_choice/i.test((e && e.message) || '')) {
      delete params.tool_choice
      resp = await openai.responses.create(params, { timeout: REQ_TIMEOUT_MS })
    } else {
      throw e
    }
  }
  return parseJson(resp.output_text || '')
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
      .select('id,nombre,ciudad,provincia,pais,tipo_area,latitud,longitud,precio_noche,plazas_totales,plazas_camper,servicios')
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
    console.error('Faltan credenciales (.env.local): Supabase (service role) u OpenAI')
    process.exit(1)
  }
  console.log(`🧭 Modelo: ${MODEL} | Concurrencia: ${CONCURRENCY} | Modo: ${APPLY ? '✍️ APLICAR (solo confianza alta)' : '👀 DRY-RUN (solo CSV de propuestas)'}`)
  const openai = new OpenAI({ apiKey: OPENAI_KEY, maxRetries: 2 })
  const supa = createClient(SUPA_URL, SUPA_KEY)

  const checkpoint = loadCheckpoint()
  console.log(`💾 Checkpoint: ${checkpoint.size} áreas ya procesadas`)
  console.log('📦 Cargando áreas...')
  const areas = await fetchAllAreas(supa)

  let targets = areas.filter((a) => !checkpoint.has(a.id) && needsWork(a))
  if (LIMIT > 0) targets = targets.slice(0, LIMIT)
  console.log(`🎯 Áreas con datos incompletos a investigar: ${targets.length} (de ${areas.length} activas)`)
  if (targets.length === 0) { console.log('✅ Nada que hacer.'); return }

  // CSV de propuestas (append para no perder trabajo entre ejecuciones)
  if (!fs.existsSync(CSV_PATH)) {
    const header = ['id', 'nombre', 'ciudad', 'pais', 'confianza', 'precio_noche_propuesto',
      'plazas_propuestas', 'servicios_propuestos', 'fuentes', 'aplicado']
    fs.writeFileSync(CSV_PATH, '﻿' + header.join(';') + '\n', 'utf8')
  }

  let done = 0, ok = 0, fail = 0, aplicadas = 0
  let index = 0
  const startedAt = Date.now()

  async function processArea(area) {
    const r = await investigate(openai, area)
    if (!r || typeof r !== 'object') throw new Error('JSON inválido')

    // Servicios propuestos: solo los confirmados como true
    const serviciosTrue = {}
    if (r.servicios && typeof r.servicios === 'object') {
      for (const k of SERVICIOS_KEYS) {
        if (r.servicios[k] === true) serviciosTrue[k] = true
      }
    }

    const propuesta = {
      precio: (serviciosConfirmados(area.servicios) >= 0 && area.precio_noche == null && typeof r.precio_noche === 'number') ? r.precio_noche : null,
      plazas: ((!area.plazas_totales && !area.plazas_camper) && Number.isInteger(r.plazas_totales) && r.plazas_totales > 0) ? r.plazas_totales : null,
      servicios: (serviciosConfirmados(area.servicios) === 0 && Object.keys(serviciosTrue).length > 0) ? serviciosTrue : null
    }
    const hayPropuesta = propuesta.precio != null || propuesta.plazas != null || propuesta.servicios != null

    let aplicado = 'NO'
    if (APPLY && hayPropuesta && r.confianza === 'alta') {
      const update = { updated_at: new Date().toISOString() }
      if (propuesta.precio != null) update.precio_noche = propuesta.precio
      if (propuesta.plazas != null) update.plazas_totales = propuesta.plazas
      if (propuesta.servicios != null) {
        // Fusionar con lo existente, nunca borrar claves previas
        update.servicios = Object.assign({}, area.servicios || {}, propuesta.servicios)
      }
      const { error } = await supa.from('areas').update(update).eq('id', area.id)
      if (error) throw new Error('DB: ' + error.message)
      aplicado = 'SI'
      aplicadas++
    }

    const fila = [
      area.id, area.nombre, area.ciudad, area.pais,
      r.confianza || '', propuesta.precio ?? '', propuesta.plazas ?? '',
      propuesta.servicios ? Object.keys(propuesta.servicios).join(',') : '',
      Array.isArray(r.fuentes) ? r.fuentes.slice(0, 3).join(' ') : '',
      aplicado
    ]
    fs.appendFileSync(CSV_PATH, fila.map(csvEscape).join(';') + '\n', 'utf8')
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
        console.log(`✗ [${done}/${targets.length}] ${area.nombre} -> ${msg}`)
        if (/rate|limit|429|quota|cuota|timeout|ECONN/i.test(msg)) await new Promise((r) => setTimeout(r, 5000))
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () => worker()))

  const mins = ((Date.now() - startedAt) / 60000).toFixed(1)
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`RESUMEN: ${ok} investigadas, ${fail} fallos en ${mins} min`)
  if (APPLY) console.log(`✍️ Aplicadas en BD (confianza alta): ${aplicadas}`)
  console.log(`💾 Propuestas: ${CSV_PATH}`)
}

main().catch((e) => { console.error('ERROR FATAL:', e); process.exit(1) })
