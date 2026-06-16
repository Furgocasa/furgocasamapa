import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateOpenAIModel } from '@/lib/openai/model-validation'

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
        model: 'gpt-5.5',
        reasoning_effort: 'low',
        max_tokens: 2000,
        prompts: [
          {
            id: 'sys-1',
            role: 'system',
            content: 'Eres un auditor crítico de áreas de autocaravanas con acceso a búsqueda web. Verificas los servicios consultando webs oficiales, plataformas (Park4night, Campercontact, Caramaps) y reseñas. Solo confirmas un servicio con evidencia clara; ante la duda, false. Respondes únicamente con JSON válido, sin texto adicional.',
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
        model: 'gpt-5.5',
        reasoning_effort: 'low',
        max_tokens: 2500,
        prompts: [
          {
            id: 'sys-1',
            role: 'system',
            content: 'Eres un redactor profesional de guías de viaje para autocaravanas en español. Tienes acceso a búsqueda web y la usas para encontrar información real y actual. Escribes con seguridad y precisión, nunca con frases dubitativas.',
            order: 1,
            required: true
          },
          {
            id: 'user-1',
            role: 'user',
            content: `{{contexto}}

TAREA:
Investiga en internet el área "{{area_nombre}}" y la localidad de {{area_ciudad}} ({{area_provincia}}) y redacta una descripción de 350-550 palabras en 4-5 párrafos separados por una línea en blanco.

Estructura:
Párrafo 1: Presentación del área de autocaravanas y su ubicación dentro de {{area_ciudad}}.
Párrafo 2: Características del área (plazas, precio y solo los servicios confirmados o verificados).
Párrafo 3: Qué ver y hacer en {{area_ciudad}} y su entorno cercano.
Párrafo 4: Gastronomía, cultura, fiestas o naturaleza de la zona.
Párrafo 5: Cierre práctico y útil (accesos, mejor época, recomendaciones reales).

REGLAS DE CALIDAD INNEGOCIABLES:
✓ Escribe con seguridad, como un experto que conoce el sitio.
✓ Sobre SERVICIOS: menciona solo los confirmados o verificados en internet. Si no puedes confirmar uno, NO lo menciones (tampoco para negarlo).
✓ Si no hay servicios confirmables, céntrate en el entorno, qué ver y hacer, gastronomía e historia.
✓ Refiérete a "el área de autocaravanas" o "el área de {{area_nombre}}" (nunca "esta área").
✓ Español natural y fluido, en párrafos, sin listas ni viñetas.

PROHIBIDO TERMINANTEMENTE:
✗ Frases dubitativas o de descargo: "consulta antes", "se recomienda verificar", "conviene confirmar", "no se especifica", "no hay información", "no disponemos de datos", "se desconoce", "posiblemente", "probablemente", "puede que", "suele tener", "verifica los servicios al llegar".
✗ Mencionar la dirección postal (ya está en el mapa).
✗ Inventar servicios o datos.
✗ Pomposidad vacía: "destino ideal", "maravilloso", "joya escondida".

Devuelve solo el texto final.`,
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

