import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Obtener todos los registros de kilometraje de un vehículo
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: vehiculoId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: vehiculo, error: vehiculoError } = await (supabase as any)
      .from('vehiculos_registrados')
      .select('user_id')
      .eq('id', vehiculoId)
      .single()

    if (vehiculoError || !vehiculo || vehiculo.user_id !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { data: kilometraje, error } = await (supabase as any)
      .from('vehiculo_kilometraje')
      .select('*')
      .eq('vehiculo_id', vehiculoId)
      .order('fecha_registro', { ascending: false })

    if (error) {
      console.error('Error obteniendo kilometraje:', error)
      return NextResponse.json({ error: 'Error obteniendo kilometraje' }, { status: 500 })
    }

    return NextResponse.json(kilometraje || [])
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST: Crear un nuevo registro de kilometraje
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: vehiculoId } = await params
    const body = await request.json()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: vehiculo, error: vehiculoError } = await (supabase as any)
      .from('vehiculos_registrados')
      .select('user_id')
      .eq('id', vehiculoId)
      .single()

    if (vehiculoError || !vehiculo || vehiculo.user_id !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { data: kilometrajeData, error } = await (supabase as any)
      .from('vehiculo_kilometraje')
      .insert({
        vehiculo_id: vehiculoId,
        user_id: user.id,
        ...body
      })
      .select()
      .single()

    if (error) {
      console.error('Error creando registro de kilometraje:', error)
      return NextResponse.json({ error: 'Error creando registro' }, { status: 500 })
    }

    return NextResponse.json(kilometrajeData, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
