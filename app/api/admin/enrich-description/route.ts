import { NextRequest, NextResponse } from 'next/server'
import { REGLA_TRES_TIPOS_PROMPT, tipoAreaParaPrompt } from '@/lib/areas/tipo-area'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { DEFAULT_OPENAI_MODEL } from '@/lib/openai/model-validation'

// La búsqueda web + razonamiento puede tardar; ampliamos el límite de la función.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Modelo por defecto: GPT-5.6 Terra (soporta web_search vía Responses API).
const DEFAULT_MODEL = DEFAULT_OPENAI_MODEL

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
  /antes\s+de\s+(tu\s+)?(visita|viajar|llegar)\s+te\s+recomendamos/i,
  /encantador (municipio|pueblo|localidad)/i,
  /en conclusi[oó]n/i,
  /destino ideal para/i,
  /impresi[oó]n duradera/i,
  /(por supuesto|aqu[ií] tienes)/i,
  /itinerario sugerido/i
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

function buildContexto(area: any): string {
  let contexto = `ÁREA QUE DEBES DESCRIBIR (datos exactos de nuestra base de datos):
- Nombre del área: ${area.nombre}
- Ciudad: ${area.ciudad}
- Provincia: ${area.provincia}
- País: ${area.pais}
- Tipo: ${tipoAreaParaPrompt(area.tipo_area)}
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

    const contexto = buildContexto(area)

    const { data: configData } = await (supabase as any)
      .from('ia_config')
      .select('config_value')
      .eq('config_key', 'enrich_description')
      .single()

    const config = configData?.config_value || {}
    let model = (config.model || '').trim()
    if (!model || !modelSupportsWebSearch(model)) {
      model = DEFAULT_MODEL
    }

    const applyVars = (text: string) => text
      .replace(/\{\{contexto\}\}/g, contexto)
      .replace(/\{\{area_nombre\}\}/g, area.nombre || '')
      .replace(/\{\{area_ciudad\}\}/g, area.ciudad || '')
      .replace(/\{\{area_provincia\}\}/g, area.provincia || '')
      .replace(/\{\{area_pais\}\}/g, area.pais || '')

    const defaultSystem = `Eres un redactor profesional de fichas de área para autocaravanas, campers y caravanas en español.
Tienes web_search y DEBES usarla: busca el recinto por su nombre local y localidad (ayuntamiento, Park4night, Campercontact, web del camping, prensa local). No inventes un resumen turístico del país.
${REGLA_TRES_TIPOS_PROMPT}

REGLAS DE CALIDAD INNEGOCIABLES:
- Escribe con seguridad, como quien conoce el sitio. Cifras, topónimos, gestora, fiestas con fecha.
- Si el lugar no es un área de pernocta (guarda de caravanas, zona de tiendas, alquiler de furgos), dilo al principio.
- PROHIBIDO: "consulta antes", "se recomienda verificar", "no se especifica", "no hay información", "se desconoce", "posiblemente", "encantador municipio", "destino ideal", "en conclusión", "aquí tienes una guía", itinerarios de otro sitio.
- SERVICIOS: solo los de la base o verificados en internet. Si no hay ficha, no los menciones (ni para negarlos).
- No menciones la dirección postal. Nunca "esta área": di "el área de autocaravanas" o "el área de ${area.nombre}".
- Español en párrafos, sin listas ni viñetas ni pomposidad vacía.`

    let systemInstruction = defaultSystem
    if (Array.isArray(config.prompts) && config.prompts.length > 0) {
      const systemPrompts = config.prompts
        .filter((p: any) => p.role === 'system')
        .sort((a: any, b: any) => a.order - b.order)
        .map((p: any) => applyVars(p.content || ''))
        .filter(Boolean)
      if (systemPrompts.length > 0) systemInstruction = systemPrompts.join('\n\n')
    }

    let userPrompt = ''
    if (Array.isArray(config.prompts) && config.prompts.length > 0) {
      const userPrompts = config.prompts
        .filter((p: any) => p.role === 'user' || p.role === 'agent')
        .sort((a: any, b: any) => a.order - b.order)
      if (userPrompts.length > 0) {
        userPrompt = applyVars(userPrompts[userPrompts.length - 1].content)
      }
    }

    if (!userPrompt) {
      userPrompt = `${contexto}

TAREA:
Investiga el área "${area.nombre}" en ${area.ciudad} (${area.provincia}, ${area.pais}) y redacta 350-550 palabras en 4-5 párrafos separados por una línea en blanco:

1) Dónde está el recinto dentro de ${area.ciudad} y qué tipo de parada es.
2) Plazas, precio, horarios, gestora o app, estancia máxima y solo servicios confirmados.
3) Qué ver a pie o cerca: nombres reales.
4) Gastronomía, fiestas o naturaleza de ESA comarca (plato o producto concreto).
5) Acceso para vehículo vivienda, mejor época, un dato práctico real.

Devuelve solo el texto final, sin títulos ni viñetas.`
    }

    const effort = (config.reasoning_effort || 'medium').toLowerCase()
    const buildRequest = (extraReminder = '', forceSearch = true) => {
      const req: any = {
        model,
        tools: [{ type: 'web_search' }],
        input: [
          { role: 'system', content: systemInstruction + (extraReminder ? `\n\n${extraReminder}` : '') },
          { role: 'user', content: userPrompt }
        ],
        max_output_tokens: config.max_tokens && config.max_tokens > 600 ? config.max_tokens : 2500
      }
      if (forceSearch) req.tool_choice = 'required'
      if (isReasoningModel(model)) {
        req.reasoning = { effort }
      } else if (typeof config.temperature === 'number') {
        req.temperature = config.temperature
      }
      return req
    }

    console.log(`🤖 [ENRICH] Modelo: ${model} (web_search obligatoria, effort=${effort})`)

    let response
    try {
      response = await (openai as any).responses.create(buildRequest())
    } catch (e: any) {
      if (/tool_choice/i.test(e?.message || '')) {
        console.log('⚠️ [ENRICH] tool_choice rechazado, reintento sin forzar')
        response = await (openai as any).responses.create(buildRequest('', false))
      } else {
        console.error('❌ [ENRICH] Error OpenAI Responses:', e?.message)
        const status = e?.status || 500
        return NextResponse.json({
          error: status === 401 ? 'OpenAI API Key inválida' : 'Error de OpenAI',
          details: e?.message || 'Error desconocido',
          errorType: status === 429 ? 'RATE_LIMIT' : 'OPENAI_ERROR'
        }, { status })
      }
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
      fuente: `${model} web_search`
    })

  } catch (error: any) {
    console.error('❌ [ENRICH] ERROR CRÍTICO:', error)
    return NextResponse.json({
      error: error.message || 'Error procesando el área',
      errorType: 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
