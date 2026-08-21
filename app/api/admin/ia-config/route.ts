import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateOpenAIModel, DEFAULT_OPENAI_MODEL } from '@/lib/openai/model-validation'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    })
    throw new Error('Supabase credentials not configured')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

// GET - Obtener configuración
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const configKey = searchParams.get('key')

    const { data, error} = configKey
      ? await (supabase as any)
          .from('ia_config')
          .select('*')
          .eq('config_key', configKey)
          .single()
      : await (supabase as any)
          .from('ia_config')
          .select('*')

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error obteniendo configuración:', error)
    return NextResponse.json(
      { error: error.message || 'Error obteniendo configuración' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest) {
  const supabase = getSupabaseClient()
  
  try {
    const { configKey, configValue } = await request.json()

    if (!configKey || !configValue) {
      return NextResponse.json(
        { error: 'configKey y configValue son requeridos' },
        { status: 400 }
      )
    }

    const model = (configValue?.model || '').trim()
    const modelValidation = await validateOpenAIModel(model)

    if (!modelValidation.valid) {
      return NextResponse.json(
        {
          error: 'Modelo OpenAI no válido',
          details: modelValidation.reason,
          errorType: 'MODEL_NOT_AVAILABLE'
        },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase as any)
      .from('ia_config')
      .update({
        config_value: configValue,
        updated_at: new Date().toISOString()
      })
      .eq('config_key', configKey)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error actualizando configuración:', error)
    return NextResponse.json(
      { error: error.message || 'Error actualizando configuración' },
      { status: 500 }
    )
  }
}

// POST - Restablecer a valores por defecto
export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient()
  
  try {
    const { configKey } = await request.json()

    if (!configKey) {
      return NextResponse.json(
        { error: 'configKey es requerido' },
        { status: 400 }
      )
    }

    // Valores por defecto con nueva estructura de prompts
    const defaults: Record<string, any> = {
      scrape_services: {
        model: DEFAULT_OPENAI_MODEL,
        reasoning_effort: 'low',
        max_tokens: 2000,
        prompts: [
          {
            id: 'sys-1',
            role: 'system',
            content: 'Eres un auditor crítico de áreas de autocaravanas/campers con búsqueda web. PRIORIZA agua, electricidad, vaciado_aguas_negras, vaciado_aguas_grises, duchas y wc. Secundarios (wifi, lavandería, restaurante, supermercado, zona_mascotas) solo con evidencia en el propio recinto. zona_mascotas ≠ admiten perros. No copies servicios de áreas cercanas. Ante la duda, false. Responde solo JSON válido.',
            order: 1,
            required: true
          },
          {
            id: 'user-1',
            role: 'user',
            content: `Eres un analista experto de áreas de autocaravanas. Tu trabajo es identificar servicios disponibles basándote en la información recopilada de múltiples fuentes.

CONTEXTO SOBRE LAS FUENTES:
La información puede venir de:
1. WEB OFICIAL DEL ÁREA (máxima prioridad y fiabilidad)
2. PLATAFORMAS ESPECIALIZADAS (Park4night, Caramaps - alta fiabilidad)
3. GOOGLE MAPS (opiniones de usuarios - fiabilidad media)
4. INFORMACIÓN GENERAL (buscadores - baja fiabilidad)

REGLAS DE ANÁLISIS:
✓ Si la WEB OFICIAL menciona un servicio → marca true (máxima confianza)
✓ Si Park4night o plataformas especializadas lo confirman → marca true (alta confianza)
✓ Si múltiples reviews de Google Maps lo mencionan → marca true (confianza media)
✓ Si dice "área equipada", "servicios completos", "todos los servicios" → marca true para: agua, electricidad, vaciado_aguas_negras, vaciado_aguas_grises, wc
✓ Si dice "área de servicios para autocaravanas" → marca true para: agua, vaciado_aguas_negras, vaciado_aguas_grises
✓ Si menciona "camping" con el nombre del área → marca true para: agua, electricidad, wc, duchas (los campings siempre tienen esto)

IMPORTANTE:
- NO marques servicios de OTRAS áreas diferentes
- Si el texto menciona "cerca hay un bar/supermercado" pero NO está en el área → marca false
- Sé razonablemente flexible: si hay evidencia sólida de fuentes fiables, confirma el servicio

EJEMPLOS DE ANÁLISIS CORRECTO:

Ejemplo 1:
Texto: "WEB OFICIAL: Área de Sevilla Este con toma de agua potable y electricidad. Vaciado de aguas grises disponible."
Respuesta: {"agua": true, "electricidad": true, "vaciado_aguas_grises": true, "vaciado_aguas_negras": false, ...}

Ejemplo 2:
Texto: "Park4night: Área completamente equipada con todos los servicios básicos."
Respuesta: {"agua": true, "electricidad": true, "vaciado_aguas_negras": true, "vaciado_aguas_grises": true, "wc": true, ...}

Ejemplo 3:
Texto: "Google Maps: Buen área pero sin electricidad. Tiene agua y vaciado."
Respuesta: {"agua": true, "electricidad": false, "vaciado_aguas_negras": true, "vaciado_aguas_grises": true, ...}

ÁREA A ANALIZAR:
Nombre: {{area_nombre}}
Ciudad: {{area_ciudad}}
Provincia: {{area_provincia}}

INFORMACIÓN RECOPILADA:
{{texto_analizar}}

RESPONDE SOLO CON JSON (sin texto adicional):
{
  "agua": true/false,
  "electricidad": true/false,
  "vaciado_aguas_negras": true/false,
  "vaciado_aguas_grises": true/false,
  "wifi": true/false,
  "duchas": true/false,
  "wc": true/false,
  "lavanderia": true/false,
  "restaurante": true/false,
  "supermercado": true/false,
  "zona_mascotas": true/false
}`,
            order: 2,
            required: false
          }
        ]
      },
      enrich_description: {
        model: DEFAULT_OPENAI_MODEL,
        reasoning_effort: 'medium',
        max_tokens: 2500,
        prompts: [
          {
            id: 'sys-1',
            role: 'system',
            content: `Eres un redactor profesional de fichas de área para autocaravanas, campers y caravanas en español. Tienes web_search y DEBES usarla: busca el recinto por su nombre y localidad, no turismo genérico del país.

Escribes como quien conoce el sitio. Cifras, topónimos, gestora, fiestas con fecha. Si el lugar no es un área de pernocta (guarda de caravanas, zona de tiendas, alquiler de furgos), dilo al principio.

PROHIBIDO: dudas ("no hay información", "se recomienda verificar", "encantador municipio"), prefacios de asistente ("aquí tienes una guía"), itinerarios de otro sitio, pomposidad vacía.`,
            order: 1,
            required: true
          },
          {
            id: 'user-1',
            role: 'user',
            content: `{{contexto}}

TAREA:
Investiga en internet el área "{{area_nombre}}" en {{area_ciudad}} ({{area_provincia}}, {{area_pais}}) y redacta 350-550 palabras en 4-5 párrafos separados por una línea en blanco. Busca el ÁREA (ayuntamiento, Park4night, Campercontact, web del camping, prensa local), no un resumen turístico de la región.

1) Dónde está el recinto dentro de {{area_ciudad}} y qué tipo de parada es.
2) Plazas, precio, horarios, gestora o app, estancia máxima y solo servicios que hayas confirmado. Si no hay ficha de servicios, no los menciones y pasa al entorno.
3) Qué ver a pie o cerca: nombres reales (iglesia, playa, museo, mirador).
4) Gastronomía, fiestas o naturaleza de ESA comarca (plato o producto concreto, fecha si la hay).
5) Acceso para vehículo vivienda, mejor época, un dato práctico real.

Devuelve solo el texto final, sin títulos ni viñetas.`,
            order: 2,
            required: false
          }
        ]
      }
    }

    const defaultValue = defaults[configKey]
    if (!defaultValue) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      )
    }

    const { data, error } = await (supabase as any)
      .from('ia_config')
      .update({
        config_value: defaultValue,
        updated_at: new Date().toISOString()
      })
      .eq('config_key', configKey)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error restableciendo configuración:', error)
    return NextResponse.json(
      { error: error.message || 'Error restableciendo configuración' },
      { status: 500 }
    )
  }
}

