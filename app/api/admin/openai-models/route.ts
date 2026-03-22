import { NextResponse } from 'next/server'
import { listAvailableOpenAIModels } from '@/lib/openai/model-validation'

export async function GET() {
  try {
    const models = await listAvailableOpenAIModels()
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
