import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    const { data: vehiculo, error: vehiculoError } = await (supabase as any)
      .from('vehiculos_registrados')
      .select('id, marca, modelo, año')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (vehiculoError || !vehiculo) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
    }

    const { data, error } = await (supabase as any)
      .rpc('calcular_valoracion_automatica', {
        p_vehiculo_id: id
      })

    if (error) {
      console.error('Error en función SQL:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        error: 'No se pudo calcular la valoración',
        mensaje: 'No hay suficientes datos para este vehículo'
      }, { status: 404 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error al calcular valoración:', error)
    return NextResponse.json(
      { error: 'Error al calcular valoración' },
      { status: 500 }
    )
  }
}
