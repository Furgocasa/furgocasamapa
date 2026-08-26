import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper: Normalizar valores numéricos (DECIMAL de PostgreSQL viene como string en JSON)
function normalizeNumericFields(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }

  const normalized: any = { ...data }

  // Todos los campos numéricos de la tabla vehiculo_valoracion_economica
  const numericFields = [
    'precio_compra',
    'inversion_total',
    'valor_estimado_actual',
    'total_mantenimientos',
    'total_averias',
    'total_mejoras',
    'ganancia_perdida',
    'depreciacion_anual_porcentaje',
    'precio_venta_final',
    'precio_venta_deseado',
    'kilometros_venta'
  ]

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

// GET: Obtener resumen económico del vehículo
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: vehiculoId } = await params

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el vehículo pertenece al usuario
    const { data: vehiculo, error: vehiculoError } = await (supabase as any)
      .from('vehiculos_registrados')
      .select('user_id')
      .eq('id', vehiculoId)
      .single()

    if (vehiculoError || !vehiculo || vehiculo.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado o acceso denegado' },
        { status: 403 }
      )
    }

    // Obtener datos de valoración económica
    const { data, error } = await (supabase as any)
      .from('vehiculo_valoracion_economica')
      .select('*')
      .eq('vehiculo_id', vehiculoId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error obteniendo resumen económico:', error)
      return NextResponse.json(
        { error: 'Error obteniendo resumen económico' },
        { status: 500 }
      )
    }

    // Si no hay datos, devolver valores por defecto
    if (!data) {
      return NextResponse.json({
        precio_compra: null,
        inversion_total: null,
        valor_estimado_actual: null,
        total_mantenimientos: null,
        total_averias: null,
        total_mejoras: null,
        ganancia_perdida: null,
        depreciacion_anual_porcentaje: null
      })
    }

    // Normalizar campos numéricos antes de devolver
    const normalized = normalizeNumericFields(data)
    return NextResponse.json(normalized)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

