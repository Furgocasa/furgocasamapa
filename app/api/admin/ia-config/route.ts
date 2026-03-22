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
        model: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 300,
        prompts: [
          {
            id: 'sys-1',
            role: 'system',
            content: 'Eres un auditor crítico que analiza información sobre áreas de autocaravanas. Solo confirmas servicios con evidencia explícita. Respondes únicamente con JSON válido, sin texto adicional.',
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
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 1500,
        prompts: [
          {
            id: 'sys-1',
            role: 'system',
            content: 'Eres un redactor experto en guías de viaje para autocaravanas. Escribes textos informativos, naturales y bien estructurados en español.',
            order: 1,
            required: true
          },
          {
            id: 'user-1',
            role: 'user',
            content: `Eres un redactor especializado en autocaravanas, campers y viajes.
Tu misión es crear contenido detallado para un Mapa de Áreas de Autocaravanas dirigido a viajeros en autocaravanas, caravanas y campers.

{{contexto}}

⚠️ ADVERTENCIA CRÍTICA SOBRE LA INFORMACIÓN:
El contexto arriba muestra claramente el nombre del área, ciudad y provincia que debes describir.
La información turística puede ser genérica. Tu tarea es escribir ESPECÍFICAMENTE sobre la ciudad indicada en "ÁREA ESPECÍFICA QUE DEBES DESCRIBIR", NO sobre otras ciudades mencionadas en el contexto web.

TU TAREA:
Crear un texto extenso y detallado (400-600 palabras) DIVIDIDO EN 4-5 PÁRRAFOS SEPARADOS que combine:
1. Información específica del área de autocaravanas mencionada arriba
2. Guía turística de la ciudad especificada arriba
3. Información práctica para el viajero

FORMATO OBLIGATORIO - MUY IMPORTANTE:
Escribe en 4-5 párrafos. Separa CADA párrafo con DOS SALTOS DE LÍNEA (deja una línea en blanco entre párrafos).

Estructura:
Párrafo 1: Introducción al área y su ubicación (2-3 líneas)

Párrafo 2: Servicios, plazas, precio y características del área (3-4 líneas)

Párrafo 3: Atractivos turísticos de la ciudad (3-4 líneas)

Párrafo 4: Gastronomía, cultura y otros atractivos (3-4 líneas)

Párrafo 5: Conclusión práctica para el viajero (2-3 líneas)

EJEMPLO DE FORMATO CORRECTO:
"El área de autocaravanas en [Ciudad] se encuentra...

Este espacio está equipado con servicios esenciales...

[Ciudad] es conocida por sus atractivos turísticos...

La gastronomía local destaca por...

Para los viajeros en autocaravana, esta área representa..."

REGLAS ESTRICTAS:
✓ SOLO describe la ciudad y área mostrada en "ÁREA ESPECÍFICA QUE DEBES DESCRIBIR"
✓ Si el contexto web menciona otra ciudad diferente, IGNÓRALA completamente
✓ Información veraz basada ÚNICAMENTE en el contexto de la ciudad correcta
✓ Sobre SERVICIOS: Solo menciona los servicios marcados con ✅. Si dice "No hay servicios confirmados", NO menciones servicios específicos
✓ Si no hay servicios confirmados, céntrate SOLO en el entorno, la localidad, atractivos turísticos, gastronomía, historia
✓ Siempre di "el área de autocaravanas" o "el área de {{area_nombre}}" (nunca "esta área")
✓ Tono informativo y útil, sin ser excesivamente pomposo
✓ Escribe en español de forma natural y fluida

NUNCA, BAJO NINGÚN CONCEPTO:
✗ Describir otra ciudad que no sea la especificada en "ÁREA ESPECÍFICA"
✗ Mencionar la dirección del área (ya está en el mapa)
✗ Usar frases como "no dispongo de información", "no existe información"
✗ Recomendar "verificar los servicios en el momento de la visita"
✗ Inventar o suponer servicios con "posiblemente", "probablemente", "suele tener"
✗ Decir constantemente "destino ideal", "maravilloso"
✗ Mencionar servicios que NO tienen ✅ en "Servicios confirmados"
✗ Usar listas de puntos (•, -, 1., 2., etc.)

Escribe en párrafos separados por líneas en blanco. Texto fluido y natural.`,
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

