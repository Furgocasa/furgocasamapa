import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY_ADMIN

  if (!apiKey) {
    return NextResponse.json(
      { models: [], error: 'OPENAI_API_KEY no configurada' },
      { status: 200 }
    )
  }

  try {
    const openai = new OpenAI({ apiKey })
    const response = await openai.models.list()

    // Nos quedamos con familias de modelos útiles para chat/generación.
    const allowedPrefixes = ['gpt-', 'o1', 'o3', 'o4']
    const models = (response.data || [])
      .map((model: any) => model.id)
      .filter((id: string) => allowedPrefixes.some((prefix) => id.startsWith(prefix)))
      .sort((a: string, b: string) => a.localeCompare(b))

    return NextResponse.json({ models })
  } catch (error: any) {
    return NextResponse.json(
      {
        models: [],
        error: error?.message || 'No se pudieron cargar modelos de OpenAI'
      },
      { status: 200 }
    )
  }
}
