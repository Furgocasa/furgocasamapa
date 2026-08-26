import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: Consultar estado de un trabajo
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json(
        { error: 'job_id requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener estado del trabajo
    const { data: trabajo, error } = await (supabase as any)
      .from('valoracion_ia_trabajos')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .eq('vehiculo_id', id)
      .single()

    if (error || !trabajo) {
      console.error('❌ Trabajo no encontrado:', error)
      return NextResponse.json(
        { error: 'Trabajo no encontrado' },
        { status: 404 }
      )
    }

    // Si está completado, obtener también el informe
    let informe = null
    if (trabajo.estado === 'completado' && trabajo.informe_id) {
      const { data: informeData } = await (supabase as any)
        .from('valoracion_ia_informes')
        .select('*')
        .eq('id', trabajo.informe_id)
        .single()

      informe = informeData
    }

    return NextResponse.json({
      job_id: trabajo.id,
      estado: trabajo.estado,
      progreso: trabajo.progreso,
      mensaje_estado: trabajo.mensaje_estado,
      error_mensaje: trabajo.error_mensaje,
      error_detalle: trabajo.error_detalle,
      fecha_creacion: trabajo.fecha_creacion,
      fecha_inicio: trabajo.fecha_inicio,
      fecha_finalizacion: trabajo.fecha_finalizacion,
      tiempo_procesamiento_segundos: trabajo.tiempo_procesamiento_segundos,
      tokens_usados: trabajo.tokens_usados,
      informe_id: trabajo.informe_id,
      informe: informe
    })

  } catch (error: any) {
    console.error('❌ [GET STATUS] ERROR:', error)
    return NextResponse.json(
      {
        error: 'Error obteniendo estado del trabajo',
        detalle: error.message
      },
      { status: 500 }
    )
  }
}



















