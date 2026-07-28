/**
 * API ROUTE: ESTADO DE CLAVES DE API (solo servidor)
 * ==================================================
 * Verifica desde el servidor si las claves de OpenAI y SerpAPI están
 * configuradas y son válidas, sin exponer nunca las claves al navegador.
 *
 * GET /api/admin/api-status          -> { openai, serpapi } (solo existencia)
 * GET /api/admin/api-status?deep=1   -> además valida contra las APIs reales
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const deep = request.nextUrl.searchParams.get('deep') === '1'

  const openaiKey = process.env.OPENAI_API_KEY
  const serpApiKey = process.env.SERPAPI_KEY

  const result: {
    openai: boolean
    serpapi: boolean
    openaiValid?: boolean
    serpApiValid?: boolean
    openaiError?: string
    serpApiError?: string
  } = {
    openai: !!openaiKey,
    serpapi: !!serpApiKey,
  }

  if (deep) {
    // Validar OpenAI con una petición ligera
    if (openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${openaiKey}` },
          cache: 'no-store',
        })
        result.openaiValid = res.ok
        if (!res.ok) {
          result.openaiError = `OpenAI respondió ${res.status}`
        }
      } catch (e: any) {
        result.openaiValid = false
        result.openaiError = 'No se pudo conectar con OpenAI'
      }
    } else {
      result.openaiValid = false
      result.openaiError = 'OPENAI_API_KEY no configurada en el servidor'
    }

    // Validar SerpAPI con una consulta mínima de cuenta
    if (serpApiKey) {
      try {
        const res = await fetch(
          `https://serpapi.com/account.json?api_key=${serpApiKey}`,
          { cache: 'no-store' }
        )
        result.serpApiValid = res.ok
        if (!res.ok) {
          result.serpApiError = `SerpAPI respondió ${res.status}`
        }
      } catch {
        result.serpApiValid = false
        result.serpApiError = 'No se pudo conectar con SerpAPI'
      }
    } else {
      result.serpApiValid = false
      result.serpApiError = 'SERPAPI_KEY no configurada en el servidor'
    }
  }

  return NextResponse.json(result)
}
