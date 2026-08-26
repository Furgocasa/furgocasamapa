import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper: Normalizar valores numéricos (DECIMAL de PostgreSQL viene como string en JSON)
function normalizeNumericFields(data: any): any {
  if (Array.isArray(data)) {
    return data.map((item: any) => normalizeNumericFields(item))
  }
  
  if (data && typeof data === 'object') {
    const normalized: any = { ...data }
    
    // Campos numéricos conocidos en mejoras
    const numericFields = ['coste_materiales', 'coste_mano_obra', 'coste_total']
    
    numericFields.forEach((field: any) => {
      if (normalized[field] !== null && normalized[field] !== undefined) {
        const parsed = typeof normalized[field] === 'string' 
          ? parseFloat(normalized[field]) 
          : normalized[field]
        normalized[field] = isNaN(parsed) ? null : parsed
      }
    })
    
    return normalized
  }
  
  return data
}

// GET: Obtener todas las mejoras de un vehículo
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

    const { data: mejoras, error } = await (supabase as any)
      .from('vehiculo_mejoras')
      .select('*')
      .eq('vehiculo_id', vehiculoId)
      .order('fecha', { ascending: false })

    if (error) {
      console.error('Error obteniendo mejoras:', error)
      return NextResponse.json({ error: 'Error obteniendo mejoras' }, { status: 500 })
    }

    // Normalizar campos numéricos antes de devolver
    const normalized = normalizeNumericFields(mejoras || [])
    return NextResponse.json(normalized)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST: Crear una nueva mejora
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

    const { data: mejora, error } = await (supabase as any)
      .from('vehiculo_mejoras')
      .insert({
        vehiculo_id: vehiculoId,
        user_id: user.id,
        ...body
      })
      .select()
      .single()

    if (error) {
      console.error('Error creando mejora:', error)
      return NextResponse.json({ error: 'Error creando mejora' }, { status: 500 })
    }

    return NextResponse.json(mejora, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
