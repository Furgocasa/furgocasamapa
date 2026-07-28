import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy para SerpAPI - Evita problemas de CORS
 * Solo hace la búsqueda y devuelve los resultados
 */
export async function POST(request: NextRequest) {
  try {
    const { query, engine = 'google' } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query es requerido' }, { status: 400 })
    }

    // Validar API key (solo variable de servidor, nunca NEXT_PUBLIC_)
    const serpApiKey = process.env.SERPAPI_KEY

    if (!serpApiKey) {
      console.error('❌ SERPAPI_KEY no configurada en el servidor')
      return NextResponse.json({
        error: 'SERPAPI_KEY no configurada',
        details: 'Configura SERPAPI_KEY en las variables de entorno del servidor'
      }, { status: 500 })
    }
    
    console.log('✅ [SERPAPI-PROXY] API key encontrada')

    // Construir URL de SerpAPI
    let serpUrl = ''
    
    if (engine === 'google_images') {
      serpUrl = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&location=Spain&hl=es&gl=es&num=20`
    } else {
      serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&location=Spain&hl=es&gl=es&num=15`
    }

    console.log('🔎 [SERPAPI-PROXY] Llamando a SerpAPI...')
    console.log('  - Query:', query)
    console.log('  - Engine:', engine)

    const response = await fetch(serpUrl)
    const data = await response.json()

    if (data.error) {
      console.error('❌ [SERPAPI-PROXY] Error de SerpAPI:', data.error)
      
      // Detectar errores específicos
      let userFriendlyMessage = data.error
      if (data.error.toLowerCase().includes('credit') || 
          data.error.toLowerCase().includes('limit exceeded') ||
          data.error.toLowerCase().includes('search limit reached')) {
        userFriendlyMessage = '⚠️ CRÉDITOS DE SERPAPI AGOTADOS. Recarga tu cuenta en https://serpapi.com/manage-api-key'
      }
      
      return NextResponse.json({
        success: false,
        error: 'Error de SerpAPI',
        details: userFriendlyMessage
      }, { status: 500 })
    }

    console.log('✅ [SERPAPI-PROXY] SerpAPI respondió correctamente')
    
    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error: any) {
    console.error('❌ [SERPAPI-PROXY] Error:', error)
    return NextResponse.json({
      error: error.message || 'Error procesando la petición'
    }, { status: 500 })
  }
}

