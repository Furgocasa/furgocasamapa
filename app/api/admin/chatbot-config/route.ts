import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateOpenAIModel } from '@/lib/openai/model-validation'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function PUT(request: NextRequest) {
  const supabase = getSupabaseClient()

  try {
    const { id, updateData } = await request.json()

    if (!id || !updateData) {
      return NextResponse.json(
        { error: 'id y updateData son requeridos' },
        { status: 400 }
      )
    }

    const model = (updateData?.modelo || '').trim()
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
      .from('chatbot_config')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error actualizando configuración de chatbot' },
      { status: 500 }
    )
  }
}
