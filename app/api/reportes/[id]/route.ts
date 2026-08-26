// ===================================================================
// API: GESTIÓN DE REPORTE INDIVIDUAL
// ===================================================================
// Endpoints para actualizar estado de un reporte específico
// ===================================================================

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH: Actualizar estado de un reporte (marcar como leído, cerrado, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id: reporte_id } = await params
    const body = await request.json()
    const { leido, cerrado, notas_propietario } = body

    // Verificar que el reporte pertenece a un vehículo del usuario
    const { data: reporte, error: checkError } = await (supabase as any)
      .from('reportes_accidentes')
      .select(`
        id,
        vehiculo_afectado_id,
        vehiculos_registrados!inner(user_id)
      `)
      .eq('id', reporte_id)
      .single()

    if (checkError || !reporte) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos
    const vehiculoUserId = (reporte.vehiculos_registrados as any).user_id
    if (vehiculoUserId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar este reporte' },
        { status: 403 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {}
    if (typeof leido === 'boolean') updateData.leido = leido
    if (typeof cerrado === 'boolean') updateData.cerrado = cerrado
    if (notas_propietario !== undefined) updateData.notas_propietario = notas_propietario

    // Actualizar reporte
    console.log('Intentando actualizar reporte:', reporte_id, 'con datos:', updateData);
    const { data: reporteActualizado, error: updateError } = await (supabase as any)
      .from('reportes_accidentes')
      .update(updateData)
      .eq('id', reporte_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando reporte:', updateError)
      return NextResponse.json(
        {
          error: 'Error al actualizar reporte',
          details: updateError.message,
          code: updateError.code
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reporte: reporteActualizado,
      message: 'Reporte actualizado correctamente'
    })

  } catch (error) {
    console.error('Error en PATCH /api/reportes/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
