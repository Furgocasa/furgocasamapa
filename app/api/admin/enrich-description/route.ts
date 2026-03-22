import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
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

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
  })
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient()
  const openai = getOpenAIClient()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🚀 [ENRICH] Iniciando enriquecimiento de área')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    // Validar API keys al inicio
    console.log('🔑 [ENRICH] Validando API keys...')
    console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ NO configurada')
    console.log('  - SERPAPI_KEY:', process.env.SERPAPI_KEY ? '✅ Configurada' : '❌ NO configurada')
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ [ENRICH] Error: OPENAI_API_KEY no configurada')
      return NextResponse.json({
        error: 'OPENAI_API_KEY no configurada',
        details: 'Añade OPENAI_API_KEY al archivo .env.local',
        errorType: 'CONFIG_ERROR'
      }, { status: 500 })
    }

    if (!process.env.SERPAPI_KEY) {
      console.error('❌ [ENRICH] Error: SERPAPI_KEY no configurada')
      return NextResponse.json({
        error: 'SERPAPI_KEY no configurada',
        details: 'Añade SERPAPI_KEY al archivo .env.local',
        errorType: 'CONFIG_ERROR'
      }, { status: 500 })
    }

    const { areaId } = await request.json()
    console.log('📝 [ENRICH] Area ID recibido:', areaId)

    if (!areaId) {
      return NextResponse.json({ error: 'Area ID es requerido' }, { status: 400 })
    }

    // Obtener el área de la base de datos
    console.log('🔍 [ENRICH] Buscando área en base de datos...')
    const { data: area, error: areaError } = await (supabase as any)
      .from('areas')
      .select('*')
      .eq('id', areaId)
      .single()

    if (areaError || !area) {
      console.error('❌ [ENRICH] Error: Área no encontrada', areaError)
      return NextResponse.json({ error: 'Área no encontrada' }, { status: 404 })
    }

    console.log('✅ [ENRICH] Área encontrada:', area.nombre, '-', area.ciudad)
    console.log('  - Descripción actual:', area.descripcion ? `${area.descripcion.substring(0, 50)}...` : 'Sin descripción')

    // Si ya tiene descripción, no sobrescribir (a menos que se fuerce)
    if (area.descripcion && area.descripcion.length > 100) {
      console.log('⚠️ [ENRICH] El área ya tiene descripción (>100 caracteres). No se sobrescribe.')
      return NextResponse.json({
        success: false,
        message: 'El área ya tiene una descripción. No se sobrescribe.'
      })
    }

    console.log('✅ [ENRICH] Área válida para enriquecer. Continuando...')

    // Buscar información del área y la localidad con SerpAPI
    // Usar comillas para búsqueda exacta de ciudad
    const query = `"${area.ciudad}" ${area.provincia} turismo autocaravanas qué ver`
    const serpApiUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}&location=Spain&hl=es&gl=es&num=10`

    console.log('🔎 [ENRICH] Llamando a SerpAPI...')
    console.log('  - Área:', area.nombre, '-', area.ciudad, area.provincia)
    console.log('  - Query:', query)

    let serpResponse
    try {
      serpResponse = await fetch(serpApiUrl)
      console.log('  - SerpAPI HTTP Status:', serpResponse.status)
    } catch (fetchError: any) {
      console.error('❌ [ENRICH] Error de red con SerpAPI:', fetchError.message)
      return NextResponse.json({
        error: 'Error conectando con SerpAPI',
        details: fetchError.message,
        errorType: 'NETWORK_ERROR'
      }, { status: 500 })
    }

    const serpData = await serpResponse.json()

    // Verificar si SerpAPI devolvió error
    if (serpData.error) {
      console.error('❌ [ENRICH] Error de SerpAPI:', serpData.error)
      return NextResponse.json({
        error: 'Error de SerpAPI',
        details: serpData.error,
        errorType: 'SERPAPI_ERROR'
      }, { status: 500 })
    }

    console.log('✅ [ENRICH] SerpAPI respondió correctamente')
    console.log('  - Resultados orgánicos:', serpData.organic_results?.length || 0)

    // FILTRAR resultados que NO sean de la ciudad correcta
    if (serpData.organic_results && serpData.organic_results.length > 0) {
      const ciudadLower = (area.ciudad || '').toLowerCase()
      const resultadosOriginales = serpData.organic_results.length
      
      if (ciudadLower) {
        serpData.organic_results = serpData.organic_results.filter((result: any) => {
          const snippet = (result.snippet || '').toLowerCase()
          const title = (result.title || '').toLowerCase()
          
          // Mantener solo resultados que mencionen la ciudad correcta
          return snippet.includes(ciudadLower) || title.includes(ciudadLower)
        })
        
        console.log(`  - Filtrado por ciudad "${area.ciudad}": ${resultadosOriginales} → ${serpData.organic_results.length} resultados`)
      }
    }

    // Extraer información relevante
    let contexto = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ ÁREA ESPECÍFICA QUE DEBES DESCRIBIR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre del área: ${area.nombre}
Ciudad: ${area.ciudad}
Provincia: ${area.provincia}
País: ${area.pais}
Tipo: ${area.tipo_area}
`
    
    if (area.precio_por_noche) {
      contexto += `Precio: ${area.precio_por_noche}€/noche\n`
    } else {
      contexto += `Precio: Gratis o desconocido\n`
    }

    if (area.plazas_disponibles) {
      contexto += `Plazas disponibles: ${area.plazas_disponibles}\n`
    }

    if (area.servicios && typeof area.servicios === 'object') {
      const serviciosDisponibles = Object.entries(area.servicios)
        .filter(([_, value]) => value === true)
        .map(([key]) => key)
      
      if (serviciosDisponibles.length > 0) {
        contexto += `\n✅ Servicios confirmados: ${serviciosDisponibles.join(', ')}\n`
      } else {
        contexto += `\n⚠️ No hay servicios confirmados para esta área.\n`
      }
    }

    contexto += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFORMACIÓN TURÍSTICA DE ${(area.ciudad || '').toUpperCase()}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(Esta información es solo sobre ${area.ciudad}, NO sobre otras ciudades)

`

    if (serpData.organic_results) {
      serpData.organic_results.forEach((result: any) => {
        contexto += `${result.title}\n${result.snippet}\n\n`
      })
    }

    if (serpData.answer_box) {
      contexto += `${serpData.answer_box.snippet || serpData.answer_box.answer}\n\n`
    }

    // Obtener configuración del agente desde la BD
    const { data: configData } = await (supabase as any)
      .from('ia_config')
      .select('config_value')
      .eq('config_key', 'enrich_description')
      .single()

    const config = configData?.config_value || {
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
        }
      ]
    }

    const modelValidation = await validateOpenAIModel(config.model)
    if (!modelValidation.valid) {
      return NextResponse.json({
        error: 'Modelo OpenAI no válido en configuración de "Enriquecer Textos"',
        details: modelValidation.reason,
        errorType: 'MODEL_NOT_AVAILABLE'
      }, { status: 400 })
    }

    // Construir mensajes para OpenAI desde los prompts configurados
    const messages = config.prompts
      .sort((a: any, b: any) => a.order - b.order)
      .map((prompt: any) => {
        // Reemplazar variables en el contenido del prompt
        let content = prompt.content
          .replace(/\{\{contexto\}\}/g, contexto)
          .replace(/\{\{area_nombre\}\}/g, area.nombre)
          .replace(/\{\{area_ciudad\}\}/g, area.ciudad)
          .replace(/\{\{area_provincia\}\}/g, area.provincia)
        
        return {
          role: prompt.role === 'agent' ? 'user' : prompt.role,
          content: content
        }
      })

    // Prompt para generar el texto descriptivo (fallback si no hay prompts configurados)
    const prompt = messages.length > 1 ? messages[messages.length - 1].content : `Eres un redactor especializado en autocaravanas, campers y viajes. 
Tu misión es crear contenido detallado para un Mapa de Áreas de Autocaravanas dirigido a viajeros en autocaravanas, caravanas y campers.

INFORMACIÓN QUE TIENES:
${contexto}

TU TAREA:
Crear un texto extenso y detallado (400-600 palabras) que combine:
1. Información específica del área de autocaravanas
2. Guía turística de la localidad y zona próxima
3. Información práctica para el viajero

REGLAS ESTRICTAS:
✓ Información veraz y contrastada basada en el contexto proporcionado.
✓ Sobre SERVICIOS: Solo menciona los servicios que aparecen en "Servicios confirmados disponibles". Si no hay servicios confirmados, NO hables de servicios específicos.
✓ Si no tienes información sobre servicios, céntrate en el entorno, la localidad, atractivos turísticos, gastronomía, historia, etc.
✓ Siempre di "el área de autocaravanas" (nunca "esta área").
✓ Tono informativo y útil, sin ser excesivamente pomposo.
✓ Escribe en español de forma natural y fluida.

NUNCA, BAJO NINGÚN CONCEPTO:
✗ Mencionar la dirección del área (ya está en el mapa).
✗ Usar frases como "no dispongo de información", "no he encontrado información", "no existe información".
✗ Usar frases como "Aunque la información sobre la disponibilidad de servicios no está claramente especificada".
✗ Recomendar "verificar los servicios en el momento de la visita".
✗ Inventar o suponer servicios con expresiones como "posiblemente", "probablemente", "suele tener".
✗ Decir constantemente "destino ideal", "maravilloso", etc.
✗ Mencionar servicios que NO están en la lista de "Servicios confirmados disponibles".

ESTRUCTURA SUGERIDA:
1. Introducción al área y su ubicación
2. Información del área (plazas, precio solo si está confirmado, servicios solo si están confirmados)
3. Entorno y localidad cercana
4. Atractivos turísticos de la zona
5. Información práctica (acceso, mejor época, recomendaciones)

Escribe un texto completo, bien redactado y natural. NO uses listas de puntos, escribe en párrafos.`

    // Llamar a OpenAI con manejo de errores mejorado
    console.log('🤖 [ENRICH] Llamando a OpenAI...')
    console.log('  - Modelo:', config.model)
    console.log('  - Temperature:', config.temperature)
    console.log('  - Max tokens:', config.max_tokens)
    console.log('  - Número de mensajes:', messages.length)
    
    let completion
    try {
      completion = await openai.chat.completions.create({
        model: config.model,
        messages: messages,
        temperature: config.temperature,
        max_tokens: config.max_tokens
      })
      console.log('✅ [ENRICH] OpenAI respondió correctamente')
      console.log('  - Tokens usados:', completion.usage?.total_tokens || '?')
    } catch (openaiError: any) {
      console.error('❌ [ENRICH] Error de OpenAI:', openaiError.message)
      if (openaiError.status === 401) {
        return NextResponse.json({
          error: 'OpenAI API Key inválida',
          details: 'La API key de OpenAI no es válida. Verifica OPENAI_API_KEY en .env.local',
          errorType: 'AUTH_ERROR'
        }, { status: 401 })
      }
      
      if (openaiError.status === 429) {
        return NextResponse.json({
          error: 'Límite de OpenAI alcanzado',
          details: 'Has superado tu cuota o límite de peticiones. Espera unos minutos o aumenta tu límite en OpenAI.',
          errorType: 'RATE_LIMIT'
        }, { status: 429 })
      }

      if (openaiError.status === 400) {
        return NextResponse.json({
          error: 'Petición inválida a OpenAI',
          details: openaiError.message || 'Verifica la configuración del prompt',
          errorType: 'VALIDATION_ERROR'
        }, { status: 400 })
      }

      return NextResponse.json({
        error: 'Error de OpenAI',
        details: openaiError.message || 'Error desconocido',
        errorType: 'OPENAI_ERROR'
      }, { status: 500 })
    }

    const descripcionGenerada = completion.choices[0].message.content || ''

    console.log('📝 [ENRICH] Descripción generada (' + descripcionGenerada.length + ' caracteres)')
    console.log('  - Primeros 100 caracteres:', descripcionGenerada.substring(0, 100) + '...')

    // Actualizar en la base de datos
    console.log('💾 [ENRICH] Guardando en base de datos...')
    const { error: updateError } = await (supabase as any)
      .from('areas')
      .update({
        descripcion: descripcionGenerada,
        updated_at: new Date().toISOString()
      })
      .eq('id', areaId)

    if (updateError) {
      console.error('❌ [ENRICH] Error al guardar en BD:', updateError)
      throw updateError
    }

    console.log('✅ [ENRICH] ¡Descripción guardada exitosamente!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return NextResponse.json({
      success: true,
      descripcion: descripcionGenerada,
      fuente: 'SerpAPI + OpenAI'
    })

  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ [ENRICH] ERROR CRÍTICO:', error)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return NextResponse.json(
      { 
        error: error.message || 'Error procesando el área',
        details: error.stack?.split('\n')[0] || 'Sin detalles adicionales',
        errorType: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    )
  }
}

