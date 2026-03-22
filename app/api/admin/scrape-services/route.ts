import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { validateOpenAIModel, buildTokensParam } from '@/lib/openai/model-validation'

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

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient()
  const openai = getOpenAIClient()
  
  try {
    // Validar API keys al inicio
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OPENAI_API_KEY no configurada',
        details: 'Añade OPENAI_API_KEY al archivo .env.local',
        errorType: 'CONFIG_ERROR'
      }, { status: 500 })
    }

    if (!process.env.SERPAPI_KEY) {
      return NextResponse.json({
        error: 'SERPAPI_KEY no configurada',
        details: 'Añade SERPAPI_KEY al archivo .env.local',
        errorType: 'CONFIG_ERROR'
      }, { status: 500 })
    }

    const { areaId } = await request.json()

    if (!areaId) {
      return NextResponse.json({ error: 'Area ID es requerido' }, { status: 400 })
    }

    // Obtener el área de la base de datos
    const { data: area, error: areaError } = await (supabase as any)
      .from('areas')
      .select('*')
      .eq('id', areaId)
      .single()

    if (areaError || !area) {
      return NextResponse.json({ error: 'Área no encontrada' }, { status: 404 })
    }

    console.log('🔎 [SCRAPE] Iniciando búsqueda multi-etapa...')
    
    // ETAPA 1: Buscar web oficial del área
    console.log('📍 [SCRAPE] Etapa 1: Buscando web oficial...')
    const queryWebOficial = `"${area.nombre}" ${area.ciudad} web oficial sitio`
    let webOficialUrl = area.website || null
    let webOficialContent = ''
    
    try {
      const serpUrl1 = `https://serpapi.com/search.json?q=${encodeURIComponent(queryWebOficial)}&api_key=${process.env.SERPAPI_KEY}&location=Spain&hl=es&gl=es&num=5`
      const resp1 = await fetch(serpUrl1)
      const data1 = await resp1.json()
      
      if (!data1.error && data1.organic_results && data1.organic_results.length > 0) {
        console.log(`  ✅ Encontrados ${data1.organic_results.length} resultados para web oficial`)
        
        // Intentar encontrar la URL de la web oficial
        for (const result of data1.organic_results.slice(0, 3)) {
          if (result.link && !webOficialUrl) {
            // Verificar si parece web oficial (no es Park4night, Google Maps, etc.)
            const url = result.link.toLowerCase()
            if (!url.includes('park4night') && 
                !url.includes('google.com/maps') && 
                !url.includes('tripadvisor') &&
                !url.includes('booking.com')) {
              webOficialUrl = result.link
              console.log(`  🌐 Web oficial detectada: ${webOficialUrl}`)
              break
            }
          }
        }
      }
    } catch (e) {
      console.log('  ⚠️ Error buscando web oficial:', e)
    }

    // Intentar scrape de web oficial si existe
    if (webOficialUrl) {
      console.log('🌐 [SCRAPE] Intentando scrape de web oficial...')
      try {
        const webResp = await fetch(webOficialUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(5000) // 5 segundos timeout
        })
        
        if (webResp.ok) {
          const html = await webResp.text()
          // Extraer texto visible (muy básico, solo lo importante)
          const cleanText = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .substring(0, 5000) // Primeros 5000 caracteres
          
          webOficialContent = `WEB OFICIAL DEL ÁREA (PRIORIDAD MÁXIMA):\n${cleanText}\n\n`
          console.log(`  ✅ Web scrapeada (${cleanText.length} caracteres)`)
        }
      } catch (e) {
        console.log('  ⚠️ No se pudo scrapear la web:', e)
      }
    }

    // ETAPA 2: Buscar en plataformas especializadas (Park4night, etc.)
    console.log('🏕️ [SCRAPE] Etapa 2: Buscando en plataformas especializadas...')
    const queryPlataformas = `"${area.nombre}" ${area.ciudad} Park4night servicios camping`
    let textoPlataformas = ''
    
    try {
      const serpUrl2 = `https://serpapi.com/search.json?q=${encodeURIComponent(queryPlataformas)}&api_key=${process.env.SERPAPI_KEY}&location=Spain&hl=es&gl=es&num=10`
      const resp2 = await fetch(serpUrl2)
      const data2 = await resp2.json()
      
      if (!data2.error && data2.organic_results) {
        console.log(`  ✅ ${data2.organic_results.length} resultados de plataformas`)
        data2.organic_results.forEach((result: any) => {
          textoPlataformas += `${result.title}\n${result.snippet}\n\n`
        })
      }
    } catch (e) {
      console.log('  ⚠️ Error buscando plataformas:', e)
    }

    // ETAPA 3: Buscar Google Maps reviews
    console.log('⭐ [SCRAPE] Etapa 3: Buscando reviews de Google Maps...')
    const queryMaps = `"${area.nombre}" ${area.ciudad} Google Maps opiniones reseñas`
    let textoMaps = ''
    
    try {
      const serpUrl3 = `https://serpapi.com/search.json?q=${encodeURIComponent(queryMaps)}&api_key=${process.env.SERPAPI_KEY}&location=Spain&hl=es&gl=es&num=10`
      const resp3 = await fetch(serpUrl3)
      const data3 = await resp3.json()
      
      if (!data3.error && data3.organic_results) {
        console.log(`  ✅ ${data3.organic_results.length} resultados de Maps`)
        data3.organic_results.forEach((result: any) => {
          textoMaps += `${result.title}\n${result.snippet}\n\n`
        })
      }
    } catch (e) {
      console.log('  ⚠️ Error buscando Maps:', e)
    }

    // ETAPA 4: Búsqueda general
    console.log('🔍 [SCRAPE] Etapa 4: Búsqueda general...')
    const queryGeneral = `"${area.nombre}" ${area.ciudad} ${area.provincia} autocaravanas servicios agua electricidad`
    let textoGeneral = ''
    
    try {
      const serpUrl4 = `https://serpapi.com/search.json?q=${encodeURIComponent(queryGeneral)}&api_key=${process.env.SERPAPI_KEY}&location=Spain&hl=es&gl=es&num=15`
      const resp4 = await fetch(serpUrl4)
      const data4 = await resp4.json()
      
      if (!data4.error) {
        if (data4.organic_results) {
          console.log(`  ✅ ${data4.organic_results.length} resultados generales`)
          data4.organic_results.forEach((result: any) => {
            textoGeneral += `${result.title}\n${result.snippet}\n\n`
          })
        }
        
        if (data4.answer_box) {
          textoGeneral += `${data4.answer_box.snippet || data4.answer_box.answer}\n\n`
        }
      }
    } catch (e) {
      console.log('  ⚠️ Error en búsqueda general:', e)
    }

    // COMBINAR TODA LA INFORMACIÓN (prioridad: web oficial > plataformas > maps > general)
    let textoParaAnalizar = ''
    
    if (webOficialContent) {
      textoParaAnalizar += webOficialContent
    }
    
    if (textoPlataformas) {
      textoParaAnalizar += `INFORMACIÓN DE PLATAFORMAS ESPECIALIZADAS:\n${textoPlataformas}\n`
    }
    
    if (textoMaps) {
      textoParaAnalizar += `INFORMACIÓN DE GOOGLE MAPS:\n${textoMaps}\n`
    }
    
    if (textoGeneral) {
      textoParaAnalizar += `INFORMACIÓN GENERAL:\n${textoGeneral}\n`
    }

    console.log(`📊 [SCRAPE] Total información recopilada: ${textoParaAnalizar.length} caracteres`)

    // Si no hay información suficiente, devolver servicios vacíos
    if (textoParaAnalizar.length < 100) {
      console.log('⚠️ [SCRAPE] Información insuficiente para análisis')
      return NextResponse.json({
        servicios: {},
        fuente: 'Sin información suficiente'
      })
    }

    // Obtener configuración del agente desde la BD
    const { data: configData } = await (supabase as any)
      .from('ia_config')
      .select('config_value')
      .eq('config_key', 'scrape_services')
      .single()

    const config = configData?.config_value || {
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
        }
      ]
    }

    const modelValidation = await validateOpenAIModel(config.model)
    if (!modelValidation.valid) {
      return NextResponse.json({
        error: 'Modelo OpenAI no válido en configuración de "Actualizar Servicios"',
        details: modelValidation.reason,
        errorType: 'MODEL_NOT_AVAILABLE'
      }, { status: 400 })
    }

    // Construir mensajes para OpenAI desde los prompts configurados
    console.log('🤖 [SCRAPE] Construyendo prompts para OpenAI...')
    const messages = config.prompts
      .sort((a: any, b: any) => a.order - b.order)
      .map((prompt: any) => {
        // Reemplazar variables en el contenido del prompt
        let content = prompt.content
          .replace(/\{\{area_nombre\}\}/g, area.nombre)
          .replace(/\{\{area_ciudad\}\}/g, area.ciudad)
          .replace(/\{\{area_provincia\}\}/g, area.provincia)
          .replace(/\{\{texto_analizar\}\}/g, textoParaAnalizar)
        
        return {
          role: prompt.role === 'agent' ? 'user' : prompt.role,
          content: content
        }
      })

    console.log(`  📝 ${messages.length} mensajes preparados para OpenAI`)
    console.log(`  📊 Contexto total: ${textoParaAnalizar.length} caracteres`)

    // Fallback si no hay configuración (no debería pasar)
    if (messages.length === 0) {
      console.error('❌ [SCRAPE] No hay prompts configurados')
      return NextResponse.json({
        error: 'No hay configuración de prompts',
        errorType: 'CONFIG_ERROR'
      }, { status: 500 })
    }

    // Eliminar el viejo prompt de fallback innecesario
    const prompt = messages.length > 1 ? messages[messages.length - 1].content : `Analiza los servicios disponibles.`
    
    // Ya no necesitamos este prompt largo porque usamos los prompts de la BD
    const textoAnalizar = textoParaAnalizar.substring(0, 100) // Solo para logging
    console.log(`  🔍 Analizando: "${textoAnalizar}..."`)

    // Llamar a OpenAI con manejo de errores mejorado
    let completion
    try {
      completion = await openai.chat.completions.create({
        model: config.model,
        messages: messages,
        temperature: config.temperature,
        ...buildTokensParam(config.max_tokens)
      })
      console.log('✅ [SCRAPE] OpenAI respondió correctamente')
      console.log(`  🎯 Tokens usados: ${completion.usage?.total_tokens || '?'}`)
    } catch (openaiError: any) {
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

    const respuestaIA = completion.choices[0].message.content || '{}'
    console.log('📝 [SCRAPE] Procesando respuesta de OpenAI...')
    
    // Extraer JSON de la respuesta
    let serviciosDetectados: Record<string, boolean> = {}
    try {
      // Buscar JSON en la respuesta (puede venir con texto adicional)
      const jsonMatch = respuestaIA.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        serviciosDetectados = JSON.parse(jsonMatch[0])
      } else {
        serviciosDetectados = JSON.parse(respuestaIA)
      }
    } catch (e) {
      console.error('❌ [SCRAPE] Error parseando respuesta:', respuestaIA)
      serviciosDetectados = {}
    }

    // Validar que solo tenga servicios válidos
    const serviciosFinales: Record<string, boolean> = {}
    SERVICIOS_VALIDOS.forEach((servicio: any) => {
      serviciosFinales[servicio] = serviciosDetectados[servicio] === true
    })

    // 🔧 LÓGICA DE INFERENCIA: Deducir servicios relacionados
    console.log('🧠 [SCRAPE] Aplicando lógica de inferencia...')
    let serviciosInferidos = 0

    // REGLA 1: Si hay agua → probablemente hay vaciados
    if (serviciosFinales['agua'] === true) {
      if (serviciosFinales['vaciado_aguas_negras'] !== true) {
        console.log('   💡 [SCRAPE] Inferencia: Agua → vaciado aguas negras')
        serviciosFinales['vaciado_aguas_negras'] = true
        serviciosInferidos++
      }
      if (serviciosFinales['vaciado_aguas_grises'] !== true) {
        console.log('   💡 [SCRAPE] Inferencia: Agua → vaciado aguas grises')
        serviciosFinales['vaciado_aguas_grises'] = true
        serviciosInferidos++
      }
    }

    // REGLA 2: Si hay duchas → seguro hay WC y agua
    if (serviciosFinales['duchas'] === true) {
      if (serviciosFinales['wc'] !== true) {
        console.log('   💡 [SCRAPE] Inferencia: Duchas → WC')
        serviciosFinales['wc'] = true
        serviciosInferidos++
      }
      if (serviciosFinales['agua'] !== true) {
        console.log('   💡 [SCRAPE] Inferencia: Duchas → agua')
        serviciosFinales['agua'] = true
        serviciosInferidos++
      }
      if (serviciosFinales['vaciado_aguas_negras'] !== true) {
        console.log('   💡 [SCRAPE] Inferencia: Duchas → vaciado aguas negras')
        serviciosFinales['vaciado_aguas_negras'] = true
        serviciosInferidos++
      }
      if (serviciosFinales['vaciado_aguas_grises'] !== true) {
        console.log('   💡 [SCRAPE] Inferencia: Duchas → vaciado aguas grises')
        serviciosFinales['vaciado_aguas_grises'] = true
        serviciosInferidos++
      }
    }

    // REGLA 3: Si hay WC → probablemente hay agua
    if (serviciosFinales['wc'] === true && serviciosFinales['agua'] !== true) {
      console.log('   💡 [SCRAPE] Inferencia: WC → agua')
      serviciosFinales['agua'] = true
      serviciosInferidos++
    }

    // REGLA 4: Si hay electricidad + agua → área de servicio completa
    if (serviciosFinales['electricidad'] === true && serviciosFinales['agua'] === true) {
      if (serviciosFinales['vaciado_aguas_negras'] !== true) {
        console.log('   💡 [SCRAPE] Inferencia: Electricidad + Agua → vaciado aguas negras')
        serviciosFinales['vaciado_aguas_negras'] = true
        serviciosInferidos++
      }
      if (serviciosFinales['vaciado_aguas_grises'] !== true) {
        console.log('   💡 [SCRAPE] Inferencia: Electricidad + Agua → vaciado aguas grises')
        serviciosFinales['vaciado_aguas_grises'] = true
        serviciosInferidos++
      }
    }

    if (serviciosInferidos > 0) {
      console.log(`   ✅ [SCRAPE] ${serviciosInferidos} servicio(s) añadido(s) por inferencia`)
    }

    // Contar servicios detectados
    const totalServicios = Object.values(serviciosFinales).filter((v: any) => v === true).length
    const serviciosEncontrados = Object.entries(serviciosFinales)
      .filter(([_, value]) => value === true)
      .map(([key]) => key)
      .join(', ')

    console.log(`📊 [SCRAPE] Servicios detectados: ${totalServicios}`)
    if (totalServicios > 0) {
      console.log(`  ✅ ${serviciosEncontrados}`)
    } else {
      console.log('  ⚠️ No se detectaron servicios')
    }

    // Actualizar en la base de datos
    console.log('💾 [SCRAPE] Actualizando base de datos...')
    const { error: updateError } = await (supabase as any)
      .from('areas')
      .update({
        servicios: serviciosFinales,
        updated_at: new Date().toISOString()
      })
      .eq('id', areaId)

    if (updateError) {
      console.error('❌ [SCRAPE] Error al actualizar BD:', updateError)
      throw updateError
    }

    console.log('✅ [SCRAPE] ¡Servicios actualizados exitosamente!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return NextResponse.json({
      success: true,
      servicios: serviciosFinales,
      total_detectados: totalServicios,
      fuente: 'SerpAPI + OpenAI + Multi-Stage Search'
    })

  } catch (error: any) {
    console.error('Error en scrape-services:', error)
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

