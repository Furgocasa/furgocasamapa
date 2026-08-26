import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Obtener histórico de valoraciones
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el vehículo pertenece al usuario
    const { data: vehiculo, error: vehiculoError } = await (supabase as any)
      .from('vehiculos_registrados')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (vehiculoError || !vehiculo) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
    }

    // Obtener histórico de precios
    const { data, error } = await (supabase as any)
      .from('historico_precios_usuario')
      .select('*')
      .eq('vehiculo_id', id)
      .order('fecha_valoracion', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error al obtener histórico:', error)
    return NextResponse.json(
      { error: 'Error al obtener histórico de valoraciones' },
      { status: 500 }
    )
  }
}

// POST - Guardar nueva valoración en el histórico
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { valor_estimado, kilometros, fuente, notas } = body

    // Verificar que el vehículo pertenece al usuario
    const { data: vehiculo, error: vehiculoError } = await (supabase as any)
      .from('vehiculos_registrados')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (vehiculoError || !vehiculo) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
    }

    // Guardar en histórico
    const { data, error } = await (supabase as any)
      .from('historico_precios_usuario')
      .insert({
        vehiculo_id: id,
        fecha_valoracion: new Date().toISOString(),
        valor_estimado,
        kilometros,
        fuente: fuente || 'manual',
        notas
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error al guardar valoración:', error)
    return NextResponse.json(
      { error: 'Error al guardar valoración' },
      { status: 500 }
    )
  }
}

