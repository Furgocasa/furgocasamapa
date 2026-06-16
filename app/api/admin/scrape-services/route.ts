import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// La búsqueda web + razonamiento puede tardar; ampliamos el límite de la función.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Modelo por defecto: GPT-5.5 (soporta la herramienta web_search vía Responses API).
const DEFAULT_MODEL = 'gpt-5.5'

// Servicios que buscamos (deben coincidir EXACTAMENTE con la base de datos)
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
  'zona_mascotas'
]

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }
  return createClient(supabaseUrl, supabaseKey)
}

function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
}

function modelSupportsWebSearch(model: string): boolean {
  const m = (model || '').toLowerCase()
  return m.startsWith('gpt-5') || m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4')
}

function isReasoningModel(model: string): boolean {
  return modelSupportsWebSearch(model)
}

/**
 * Refuerzo con SerpAPI (best-effort). 1 búsqueda enfocada a plataformas y servicios.
 * Si no hay clave o falla, devolvemos cadena vacía: GPT-5.5 buscará por su cuenta.
 */
async function buildSerpReinforcement(area: any): Promise<string> {
  const serpApiKey = process.env.SERPAPI_KEY || process.env.NEXT_PUBLIC_SERPAPI_KEY_ADMIN
  if (!serpApiKey) return ''

  const queries = [
    `"${area.nombre}" ${area.ciudad} (Park4night OR Campercontact OR Caramaps) servicios autocaravanas agua electricidad vaciado`,
    `"${area.nombre}" ${area.ciudad} ${area.provincia} opiniones servicios área autocaravanas`
  ]

  let out = ''
  for (const q of queries) {
    try {
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&api_key=${serpApiKey}&hl=es&gl=es&num=8`
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) continue
      if (Array.isArray(data.organic_results)) {
        data.organic_results.slice(0, 6).forEach((r: any) => {
          if (r.title || r.snippet) out += `- ${r.title || ''}: ${r.snippet || ''}\n`
        })
      }
      if (data.answer_box) {
        out += `- ${data.answer_box.snippet || data.answer_box.answer || ''}\n`
      }
    } catch {
      // best-effort
    }
  }
  return out.trim()
}

function applyInferences(servicios: Record<string, boolean>): Record<string, boolean> {
  const s = { ...servicios }

  // Si hay agua → puntos de vaciado habituales
  if (s['agua'] === true) {
    if (s['vaciado_aguas_negras'] !== true) s['vaciado_aguas_negras'] = true
    if (s['vaciado_aguas_grises'] !== true) s['vaciado_aguas_grises'] = true
  }
  // Si hay duchas → WC, agua y vaciados
  if (s['duchas'] === true) {
    if (s['wc'] !== true) s['wc'] = true
    if (s['agua'] !== true) s['agua'] = true
    if (s['vaciado_aguas_negras'] !== true) s['vaciado_aguas_negras'] = true
    if (s['vaciado_aguas_grises'] !== true) s['vaciado_aguas_grises'] = true
  }
  // Si hay WC → agua
  if (s['wc'] === true && s['agua'] !== true) s['agua'] = true
  // Electricidad + agua → área de servicio completa
  if (s['electricidad'] === true && s['agua'] === true) {
    if (s['vaciado_aguas_negras'] !== true) s['vaciado_aguas_negras'] = true
    if (s['vaciado_aguas_grises'] !== true) s['vaciado_aguas_grises'] = true
  }
  return s
}

export async function POST(request: NextRequest) {
  console.log('🔎 [SCRAPE] Iniciando detección de servicios (Responses API + web_search)')

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OPENAI_API_KEY no configurada',
        errorType: 'CONFIG_ERROR'
      }, { status: 500 })
    }

    const { areaId } = await request.json()
    if (!areaId) {
      return NextResponse.json({ error: 'Area ID es requerido' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const openai = getOpenAIClient()

    const { data: area, error: areaError } = await (supabase as any)
      .from('areas')
      .select('*')
      .eq('id', areaId)
      .single()

    if (areaError || !area) {
      return NextResponse.json({ error: 'Área no encontrada' }, { status: 404 })
    }

    console.log(`✅ [SCRAPE] Área: ${area.nombre} (${area.ciudad}, ${area.provincia})`)

    // 1) Refuerzo con SerpAPI (best-effort)
    const serpReinforcement = await buildSerpReinforcement(area)
    console.log(`🔎 [SCRAPE] SerpAPI refuerzo: ${serpReinforcement ? 'sí' : 'no disponible'}`)

    // 2) Configuración (modelo + prompts)
    const { data: configData } = await (supabase as any)
      .from('ia_config')
      .select('config_value')
      .eq('config_key', 'scrape_services')
      .single()

    const config = configData?.config_value || {}
    let model = (config.model || '').trim()
    if (!model || !modelSupportsWebSearch(model)) {
      model = DEFAULT_MODEL
    }

    const systemInstruction = `Eres un auditor crítico de áreas de autocaravanas. Tienes acceso a búsqueda web: ÚSALA para verificar qué servicios ofrece realmente el área consultando su web oficial, plataformas especializadas (Park4night, Campercontact, Caramaps, iOverlander) y reseñas.

REGLAS:
- Confirma un servicio (true) SOLO si hay evidencia clara en fuentes fiables. Ante la duda, false.
- No asumas servicios por el tipo de lugar.
- Prioriza: web oficial > plataformas especializadas > reseñas de usuarios.
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown.

SERVICIOS A DETECTAR (claves exactas):
agua, electricidad, vaciado_aguas_negras, vaciado_aguas_grises, wifi, duchas, wc, lavanderia, restaurante, supermercado, zona_mascotas`

    const userPrompt = `ÁREA A ANALIZAR:
- Nombre: ${area.nombre}
- Ciudad: ${area.ciudad}
- Provincia: ${area.provincia}
- País: ${area.pais}
${area.website ? `- Web: ${area.website}\n` : ''}${serpReinforcement ? `\nINFORMACIÓN DE REFUERZO (resultados de búsqueda, contrástala con tu propia búsqueda web):\n${serpReinforcement}\n` : ''}
Busca en internet información actual sobre esta área concreta y devuelve SOLO este JSON (true/false en cada clave):
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

    const req: any = {
      model,
      tools: [{ type: 'web_search' }],
      input: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt }
      ],
      max_output_tokens: 2000
    }
    if (isReasoningModel(model)) {
      req.reasoning = { effort: config.reasoning_effort || 'low' }
    } else if (typeof config.temperature === 'number') {
      req.temperature = config.temperature
    }

    console.log(`🤖 [SCRAPE] Modelo: ${model} (web_search activado)`)

    let response
    try {
      response = await (openai as any).responses.create(req)
    } catch (e: any) {
      const status = e?.status || 500
      console.error('❌ [SCRAPE] Error OpenAI Responses:', e?.message)
      return NextResponse.json({
        error: status === 401 ? 'OpenAI API Key inválida' : 'Error de OpenAI',
        details: e?.message || 'Error desconocido',
        errorType: status === 429 ? 'RATE_LIMIT' : 'OPENAI_ERROR'
      }, { status })
    }

    const respuestaIA = (response.output_text || '').trim()

    // Parsear JSON de la respuesta
    let serviciosDetectados: Record<string, boolean> = {}
    try {
      const jsonMatch = respuestaIA.match(/\{[\s\S]*\}/)
      serviciosDetectados = JSON.parse(jsonMatch ? jsonMatch[0] : respuestaIA)
    } catch {
      console.error('❌ [SCRAPE] No se pudo parsear JSON:', respuestaIA.substring(0, 200))
      serviciosDetectados = {}
    }

    // Validar solo claves válidas
    let serviciosFinales: Record<string, boolean> = {}
    SERVICIOS_VALIDOS.forEach((s) => {
      serviciosFinales[s] = serviciosDetectados[s] === true
    })

    // Lógica de inferencia (servicios relacionados)
    serviciosFinales = applyInferences(serviciosFinales)

    const totalServicios = Object.values(serviciosFinales).filter((v) => v === true).length
    console.log(`📊 [SCRAPE] Servicios detectados: ${totalServicios}`)

    const { error: updateError } = await (supabase as any)
      .from('areas')
      .update({ servicios: serviciosFinales, updated_at: new Date().toISOString() })
      .eq('id', areaId)

    if (updateError) {
      return NextResponse.json({
        error: `Error al guardar en base de datos: ${updateError.message}`,
        errorType: 'DB_ERROR'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      servicios: serviciosFinales,
      total_detectados: totalServicios,
      modelo: model,
      fuente: serpReinforcement ? 'GPT-5.5 web_search + SerpAPI' : 'GPT-5.5 web_search'
    })

  } catch (error: any) {
    console.error('❌ [SCRAPE] ERROR CRÍTICO:', error)
    return NextResponse.json({
      error: error.message || 'Error procesando el área',
      errorType: 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
