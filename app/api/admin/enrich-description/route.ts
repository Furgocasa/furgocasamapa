import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// La búsqueda web + razonamiento puede tardar; ampliamos el límite de la función.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Modelo por defecto: GPT-5.5 (soporta la herramienta web_search vía Responses API).
const DEFAULT_MODEL = 'gpt-5.5'

// Frases prohibidas: textos dubitativos / "consultar antes" que no queremos ver nunca.
const FORBIDDEN_PATTERNS: RegExp[] = [
  /consult\w*\s+(antes|disponibilidad|directamente|con\s+el\s+|la\s+disponibilidad)/i,
  /se\s+recomienda\s+(consultar|verificar|confirmar|comprobar)/i,
  /(verifica|verificar|comprobar|confirmar|confirma)\s+(los\s+)?(servicios|la\s+disponibilidad|antes)/i,
  /no\s+(se\s+)?(dispone|disponemos|tengo|tenemos|hay)\s+(de\s+)?(información|datos)/i,
  /no\s+(se\s+)?(especifica|indica|detalla|aclara|sabe|conoce)/i,
  /información\s+no\s+disponible/i,
  /se\s+desconoce/i,
  /(posiblemente|probablemente|puede\s+que|podría\s+(tener|disponer)|suele\s+tener)/i,
  /antes\s+de\s+(tu\s+)?(visita|viajar|llegar)\s+te\s+recomendamos/i
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

// Solo los modelos gpt-5.x / o-series soportan bien la herramienta web_search.
function modelSupportsWebSearch(model: string): boolean {
  const m = (model || '').toLowerCase()
  return m.startsWith('gpt-5') || m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4')
}

function isReasoningModel(model: string): boolean {
  const m = (model || '').toLowerCase()
  return m.startsWith('gpt-5') || m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4')
}

function hasForbiddenText(text: string): boolean {
  return FORBIDDEN_PATTERNS.some((re) => re.test(text))
}

/**
 * Limpia el texto generado por la búsqueda web: elimina citas markdown ([dominio](url)),
 * enlaces markdown, negritas y encabezados, para guardar texto plano limpio.
 */
function cleanGeneratedText(text: string): string {
  return text
    .replace(/\s*\(\[[^\]]*\]\([^)]*\)\)/g, '') // citas tipo ([dominio](url))
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [texto](url) -> texto
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **negrita** -> texto
    .replace(/(^|\n)\s*#+\s*/g, '$1') // encabezados markdown
    .replace(/[ \t]+\n/g, '\n') // espacios sobrantes al final de línea
    .replace(/\n{3,}/g, '\n\n') // máximo una línea en blanco entre párrafos
    .trim()
}

/**
 * Reúne contexto de refuerzo desde SerpAPI (opcional, best-effort).
 * Si falla o no hay clave, devolvemos cadena vacía: el modelo buscará por su cuenta.
 */
async function buildSerpReinforcement(area: any): Promise<string> {
  const serpApiKey = process.env.SERPAPI_KEY || process.env.NEXT_PUBLIC_SERPAPI_KEY_ADMIN
  if (!serpApiKey) return ''

  try {
    const query = `"${area.ciudad}" ${area.provincia} ${area.pais} área autocaravanas servicios qué ver`
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&hl=es&gl=es&num=10`
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) return ''

    let out = ''
    const ciudadLower = (area.ciudad || '').toLowerCase()

    if (Array.isArray(data.organic_results)) {
      data.organic_results
        .filter((r: any) => {
          if (!ciudadLower) return true
          const t = `${r.title || ''} ${r.snippet || ''}`.toLowerCase()
          return t.includes(ciudadLower)
        })
        .slice(0, 8)
        .forEach((r: any) => {
          if (r.title || r.snippet) out += `- ${r.title || ''}: ${r.snippet || ''}\n`
        })
    }

    if (data.answer_box) {
      out += `- ${data.answer_box.snippet || data.answer_box.answer || ''}\n`
    }

    return out.trim()
  } catch {
    return ''
  }
}

function buildContexto(area: any, serpReinforcement: string): string {
  let contexto = `ÁREA QUE DEBES DESCRIBIR (datos exactos de nuestra base de datos):
- Nombre del área: ${area.nombre}
- Ciudad: ${area.ciudad}
- Provincia: ${area.provincia}
- País: ${area.pais}
- Tipo: ${area.tipo_area || 'área para autocaravanas'}
`

  if (area.precio_por_noche || area.precio_noche != null) {
    const precio = area.precio_por_noche ?? area.precio_noche
    contexto += `- Precio: ${precio === 0 ? 'Gratuita' : `${precio}€/noche`}\n`
  }

  if (area.plazas_disponibles || area.plazas_totales) {
    contexto += `- Plazas: ${area.plazas_disponibles || area.plazas_totales}\n`
  }

  if (area.servicios && typeof area.servicios === 'object') {
    const confirmados = Object.entries(area.servicios)
      .filter(([, v]) => v === true)
      .map(([k]) => k)

    if (confirmados.length > 0) {
      contexto += `- Servicios CONFIRMADOS por nuestra base de datos: ${confirmados.join(', ')}\n`
    } else {
      contexto += `- Servicios: no confirmados en nuestra base de datos (NO menciones servicios concretos que no hayas verificado en internet).\n`
    }
  }

  if (serpReinforcement) {
    contexto += `\nINFORMACIÓN DE REFUERZO (resultados de búsqueda sobre ${area.ciudad}, úsala como apoyo y contrástala con tu propia búsqueda):\n${serpReinforcement}\n`
  }

  return contexto
}

export async function POST(request: NextRequest) {
  console.log('🚀 [ENRICH] Iniciando enriquecimiento (Responses API + web_search)')

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OPENAI_API_KEY no configurada',
        errorType: 'CONFIG_ERROR'
      }, { status: 500 })
    }

    const { areaId, force } = await request.json()
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

    // Si NO se fuerza, no sobrescribir descripciones largas Y de buena calidad.
    if (!force) {
      const desc = (area.descripcion || '').trim()
      if (desc.length > 200 && !hasForbiddenText(desc)) {
        return NextResponse.json({
          success: false,
          message: 'El área ya tiene una descripción de calidad. Usa force=true para regenerarla.'
        })
      }
    }

    console.log(`✅ [ENRICH] Área: ${area.nombre} (${area.ciudad}, ${area.provincia})`)

    // 1) Refuerzo con SerpAPI (best-effort)
    const serpReinforcement = await buildSerpReinforcement(area)
    console.log(`🔎 [ENRICH] SerpAPI refuerzo: ${serpReinforcement ? 'sí' : 'no disponible'}`)

    const contexto = buildContexto(area, serpReinforcement)

    // 2) Cargar configuración (modelo + prompts) desde la BD
    const { data: configData } = await (supabase as any)
      .from('ia_config')
      .select('config_value')
      .eq('config_key', 'enrich_description')
      .single()

    const config = configData?.config_value || {}
    let model = (config.model || '').trim()
    // Si el modelo configurado no soporta web_search, forzamos GPT-5.5.
    if (!model || !modelSupportsWebSearch(model)) {
      model = DEFAULT_MODEL
    }

    // Instrucciones de sistema (no negociables) + prompt de usuario configurable.
    const systemInstruction = `Eres un redactor profesional especializado en guías de viaje para autocaravanas, campers y caravanas en español.
Tienes acceso a búsqueda web: ÚSALA para encontrar información real y actual sobre el área y su localidad (servicios, accesos, entorno, atractivos turísticos, gastronomía).

REGLAS DE CALIDAD INNEGOCIABLES:
- Escribe con seguridad y precisión, como un experto que conoce el sitio. JAMÁS muestres dudas.
- PROHIBIDO usar frases dubitativas o de descargo como: "consulta antes", "se recomienda verificar", "conviene confirmar", "no se especifica", "no hay información", "no disponemos de datos", "se desconoce", "posiblemente", "probablemente", "puede que", "suele tener", "verifica los servicios al llegar".
- Sobre SERVICIOS: menciona únicamente los que estén confirmados en la base de datos o que verifiques claramente en internet. Si no puedes confirmar un servicio, NO lo menciones (ni para decir que no lo tiene). Nunca inventes.
- Si no hay servicios confirmables, céntrate en el entorno, la localidad, qué ver y hacer, gastronomía e historia: el texto debe ser igual de útil y atractivo.
- No menciones la dirección postal (ya aparece en el mapa).
- Refiérete siempre a "el área de autocaravanas" o "el área de ${area.nombre}", nunca "esta área".
- Tono informativo, cercano y útil; nada de pomposidad vacía ("destino ideal", "maravilloso", "joya escondida").
- Español natural y fluido, sin listas ni viñetas.`

    // Prompt de usuario: si hay prompts configurados de tipo user/agent, usamos el último; si no, uno por defecto.
    let userPrompt = ''
    if (Array.isArray(config.prompts) && config.prompts.length > 0) {
      const userPrompts = config.prompts
        .filter((p: any) => p.role === 'user' || p.role === 'agent')
        .sort((a: any, b: any) => a.order - b.order)
      if (userPrompts.length > 0) {
        userPrompt = userPrompts[userPrompts.length - 1].content
          .replace(/\{\{contexto\}\}/g, contexto)
          .replace(/\{\{area_nombre\}\}/g, area.nombre || '')
          .replace(/\{\{area_ciudad\}\}/g, area.ciudad || '')
          .replace(/\{\{area_provincia\}\}/g, area.provincia || '')
      }
    }

    if (!userPrompt) {
      userPrompt = `${contexto}

TAREA:
Investiga en internet el área "${area.nombre}" y la localidad de ${area.ciudad} (${area.provincia}, ${area.pais}) y redacta una descripción de 350-550 palabras en 4-5 párrafos separados por una línea en blanco:

1) Presentación del área de autocaravanas y su ubicación dentro de ${area.ciudad}.
2) Características del área: plazas, precio y servicios (solo los confirmados o verificados).
3) Qué ver y hacer en ${area.ciudad} y su entorno cercano.
4) Gastronomía, cultura, fiestas o naturaleza de la zona.
5) Cierre práctico y útil para el viajero en autocaravana (accesos, mejor época, recomendaciones reales).

Devuelve solo el texto final, en párrafos, sin títulos ni viñetas.`
    }

    // 3) Generar con Responses API + web_search
    const buildRequest = (extraReminder = '') => {
      const req: any = {
        model,
        tools: [{ type: 'web_search' }],
        input: [
          { role: 'system', content: systemInstruction + (extraReminder ? `\n\n${extraReminder}` : '') },
          { role: 'user', content: userPrompt }
        ],
        max_output_tokens: config.max_tokens && config.max_tokens > 600 ? config.max_tokens : 2500
      }
      if (isReasoningModel(model)) {
        req.reasoning = { effort: config.reasoning_effort || 'low' }
      } else if (typeof config.temperature === 'number') {
        req.temperature = config.temperature
      }
      return req
    }

    console.log(`🤖 [ENRICH] Modelo: ${model} (web_search activado)`)

    let response
    try {
      response = await (openai as any).responses.create(buildRequest())
    } catch (e: any) {
      console.error('❌ [ENRICH] Error OpenAI Responses:', e?.message)
      const status = e?.status || 500
      return NextResponse.json({
        error: status === 401 ? 'OpenAI API Key inválida' : 'Error de OpenAI',
        details: e?.message || 'Error desconocido',
        errorType: status === 429 ? 'RATE_LIMIT' : 'OPENAI_ERROR'
      }, { status })
    }

    let descripcion: string = cleanGeneratedText(response.output_text || '')

    // 4) Red de seguridad: si aún hay frases prohibidas, un reintento más estricto.
    if (descripcion && hasForbiddenText(descripcion)) {
      console.log('⚠️ [ENRICH] Texto con frases dubitativas. Reintentando más estricto...')
      try {
        const retry = await (openai as any).responses.create(
          buildRequest('IMPORTANTE: El borrador anterior contenía frases dubitativas prohibidas. Reescribe el texto eliminando por completo cualquier frase de duda, descargo o "consultar/verificar antes". Sé afirmativo y concreto.')
        )
        const retryText = cleanGeneratedText(retry.output_text || '')
        if (retryText && !hasForbiddenText(retryText)) {
          descripcion = retryText
        }
      } catch {
        // nos quedamos con el primer resultado si el reintento falla
      }
    }

    if (!descripcion || descripcion.length < 100) {
      return NextResponse.json({
        error: 'El modelo no devolvió una descripción válida',
        errorType: 'EMPTY_RESPONSE'
      }, { status: 500 })
    }

    console.log(`📝 [ENRICH] Descripción generada (${descripcion.length} caracteres)`)

    const { error: updateError } = await (supabase as any)
      .from('areas')
      .update({ descripcion, updated_at: new Date().toISOString() })
      .eq('id', areaId)

    if (updateError) {
      return NextResponse.json({
        error: `Error al guardar en base de datos: ${updateError.message}`,
        errorType: 'DB_ERROR'
      }, { status: 500 })
    }

    console.log('✅ [ENRICH] Guardada correctamente')

    return NextResponse.json({
      success: true,
      descripcion,
      modelo: model,
      fuente: serpReinforcement ? 'GPT-5.5 web_search + SerpAPI' : 'GPT-5.5 web_search'
    })

  } catch (error: any) {
    console.error('❌ [ENRICH] ERROR CRÍTICO:', error)
    return NextResponse.json({
      error: error.message || 'Error procesando el área',
      errorType: 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
