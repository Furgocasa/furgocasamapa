import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET: Obtener datos de valoración y venta
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

    if (error) {
      console.error('Error obteniendo datos:', error)
      return NextResponse.json(
        { error: 'Error obteniendo datos de venta' },
        { status: 500 }
      )
    }

    // Si no existe registro, devolver valores por defecto
    if (!data) {
      return NextResponse.json({
        vendido: false,
        en_venta: false,
        precio_venta_deseado: null,
        precio_venta_final: null,
        fecha_venta: null,
        fecha_compra: null,
        comprador_tipo: null,
        kilometros_venta: null,
        estado_venta: null,
        notas_venta: null,
        inversion_total: 0
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST: Registrar venta final
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: vehiculoId } = await params
    const body = await request.json()

    console.log('📤 [Venta API] Recibida solicitud POST para vehículo:', vehiculoId)
    console.log('📤 [Venta API] Body recibido:', JSON.stringify(body, null, 2))

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [Venta API] Error de autenticación:', authError)
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
      console.error('❌ [Venta API] Error verificando vehículo:', vehiculoError)
      return NextResponse.json(
        { error: 'Vehículo no encontrado o acceso denegado' },
        { status: 403 }
      )
    }

    const {
      precio_venta_final,
      fecha_venta,
      comprador_tipo,
      kilometros_venta,
      estado_venta,
      notas_venta
    } = body

    // Validar campos requeridos
    if (!precio_venta_final || precio_venta_final === '' || precio_venta_final === null || precio_venta_final === undefined) {
      console.error('❌ [Venta API] precio_venta_final faltante o inválido:', precio_venta_final)
      return NextResponse.json(
        { error: 'Precio de venta es obligatorio' },
        { status: 400 }
      )
    }

    if (!fecha_venta || fecha_venta === '' || fecha_venta === null || fecha_venta === undefined) {
      console.error('❌ [Venta API] fecha_venta faltante o inválida:', fecha_venta)
      return NextResponse.json(
        { error: 'Fecha de venta es obligatoria' },
        { status: 400 }
      )
    }

    // Validar tipos de datos y convertir a entero (sin decimales)
    // Usar Math.round para evitar problemas de precisión de punto flotante
    const precioNumero = Math.round(parseFloat(precio_venta_final))
    if (isNaN(precioNumero) || precioNumero < 0) {
      console.error('❌ [Venta API] precio_venta_final inválido:', precio_venta_final)
      return NextResponse.json(
        { error: 'Precio de venta debe ser un número válido mayor o igual a 0' },
        { status: 400 }
      )
    }

    // Validar formato de fecha (debe ser YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!fechaRegex.test(fecha_venta)) {
      console.error('❌ [Venta API] fecha_venta formato inválido:', fecha_venta)
      return NextResponse.json(
        { error: 'Fecha de venta debe estar en formato YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Obtener datos existentes de valoración económica para calcular rentabilidad
    const { data: existingData, error: fetchError } = await (supabase as any)
      .from('vehiculo_valoracion_economica')
      .select('*')
      .eq('vehiculo_id', vehiculoId)
      .maybeSingle()

    if (fetchError) {
      console.error('❌ [Venta API] Error obteniendo datos existentes:', fetchError)
      return NextResponse.json(
        { error: 'Error obteniendo datos del vehículo', details: fetchError.message },
        { status: 500 }
      )
    }

    // Calcular rentabilidad y coste anual si tenemos datos de compra
    let rentabilidad = null
    let coste_anual = null

    if (existingData?.fecha_compra && existingData?.inversion_total) {
      const fechaCompra = new Date(existingData.fecha_compra)
      const fechaVenta = new Date(fecha_venta)
      const diffTime = Math.abs(fechaVenta.getTime() - fechaCompra.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const años = diffDays / 365.25

      if (años > 0) {
        // Usar precioNumero (ya redondeado) en lugar de precio_venta_final para consistencia
        rentabilidad = precioNumero - existingData.inversion_total
        coste_anual = Math.abs(rentabilidad / años)
      }
    }

    console.log('📊 [Venta API] Cálculos:', {
      rentabilidad,
      coste_anual,
      inversion_total: existingData?.inversion_total,
      precio_venta_final: precioNumero,
      precio_venta_final_original: precio_venta_final
    })

    // Preparar datos para guardar (solo campos que existen en BD)
    // NO incluimos updated_at porque hay un trigger que lo maneja automáticamente
    const dataToSave: any = {
      vendido: true,
      precio_venta_final: precioNumero,
      fecha_venta: fecha_venta.trim(),
      en_venta: false
    }

    // Añadir campos opcionales solo si tienen valor
    if (comprador_tipo && comprador_tipo.trim() !== '') {
      dataToSave.comprador_tipo = comprador_tipo.trim()
    }

    if (kilometros_venta && kilometros_venta !== '' && !isNaN(parseInt(kilometros_venta))) {
      dataToSave.kilometros_venta = parseInt(kilometros_venta)
    }

    if (estado_venta && estado_venta.trim() !== '') {
      dataToSave.estado_venta = estado_venta.trim()
    }

    if (notas_venta && notas_venta.trim() !== '') {
      dataToSave.notas_venta = notas_venta.trim()
    }

    console.log('💾 [Venta API] Datos a guardar:', JSON.stringify(dataToSave, null, 2))

    let result

    if (existingData) {
      // Actualizar registro existente
      // IMPORTANTE: Usar el ID del registro, NO vehiculo_id (igual que DatosCompraTab)
      console.log('🔄 [Venta API] Actualizando registro existente:', existingData.id)
      const { data: updatedData, error: updateError } = await (supabase as any)
        .from('vehiculo_valoracion_economica')
        .update(dataToSave)
        .eq('id', existingData.id)
        .select()
        .single()

      result = { data: updatedData, error: updateError }
    } else {
      // Crear nuevo registro
      console.log('➕ [Venta API] Creando nuevo registro')
      const { data: insertedData, error: insertError } = await (supabase as any)
        .from('vehiculo_valoracion_economica')
        .insert({
          vehiculo_id: vehiculoId,
          user_id: user.id,
          ...dataToSave
        })
        .select()
        .single()

      result = { data: insertedData, error: insertError }
    }

    if (result.error) {
      console.error('❌ [Venta API] Error en operación BD:', result.error)
      console.error('❌ [Venta API] Detalles del error:', JSON.stringify(result.error, null, 2))
      return NextResponse.json(
        {
          error: 'Error registrando venta',
          details: result.error.message,
          code: result.error.code,
          hint: result.error.hint
        },
        { status: 500 }
      )
    }

    console.log('✅ [Venta API] Venta registrada exitosamente:', result.data)

    // 💾 Guardar en datos_mercado_autocaravanas para alimentar comparables futuros
    try {
      const { data: vehiculoData } = await (supabase as any)
        .from('vehiculos_registrados')
        .select('marca, modelo, año, chasis')
        .eq('id', vehiculoId)
        .single()

      if (vehiculoData) {
        const { error: errorMercado } = await (supabase as any)
          .from('datos_mercado_autocaravanas')
          .insert({
            marca: vehiculoData.marca,
            modelo: vehiculoData.modelo,
            chasis: vehiculoData.chasis,
            año: vehiculoData.año,
            precio: precioNumero,
            kilometros: dataToSave.kilometros_venta || null,
            fecha_transaccion: fecha_venta.trim(),
            verificado: true,
            estado: dataToSave.estado_venta || 'Vendido',
            origen: 'Venta Real Usuario',
            tipo_dato: 'Venta Real Usuario',
            pais: 'España',
            tipo_combustible: null,
            tipo_calefaccion: null,
            homologacion: null,
            region: null
          })

        if (errorMercado) {
          console.warn('⚠️ [Venta API] No se pudo guardar en datos_mercado (no crítico):', errorMercado.message)
        } else {
          console.log('✅ [Venta API] Venta guardada en datos_mercado_autocaravanas con precio:', precioNumero)
        }
      }
    } catch (mercadoError: any) {
      console.warn('⚠️ [Venta API] Error guardando en datos_mercado:', mercadoError.message)
      // No bloqueamos la respuesta por error en datos_mercado
    }

    // 🚗 Guardar kilometros_venta en vehiculo_kilometraje para historial
    if (dataToSave.kilometros_venta) {
      try {
        const { error: kmError } = await (supabase as any)
          .from('vehiculo_kilometraje')
          .insert({
            vehiculo_id: vehiculoId,
            user_id: user.id,
            kilometros: dataToSave.kilometros_venta,
            fecha: fecha_venta.trim()
          })

        if (kmError) {
          console.warn('⚠️ [Venta API] No se pudo guardar kilometraje (no crítico):', kmError.message)
        } else {
          console.log('✅ [Venta API] Kilometraje de venta guardado en vehiculo_kilometraje')
        }
      } catch (kmSaveError: any) {
        console.warn('⚠️ [Venta API] Error guardando kilometraje:', kmSaveError.message)
        // No bloqueamos la respuesta
      }
    }

    // Añadir cálculos a la respuesta (aunque no se guarden en BD)
    const responseData = {
      ...result.data,
      rentabilidad: rentabilidad !== null ? rentabilidad : undefined,
      coste_anual: coste_anual !== null ? coste_anual : undefined
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      mensaje: '¡Venta registrada exitosamente!'
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ [Venta API] Error catch:', error)
    console.error('❌ [Venta API] Stack:', error.stack)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// PUT: Poner vehículo en venta o actualizar precio
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: vehiculoId } = await params
    const body = await request.json()

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

    const { en_venta, precio_venta_deseado } = body

    // Verificar si existe el registro
    const { data: existingData } = await (supabase as any)
      .from('vehiculo_valoracion_economica')
      .select('id')
      .eq('vehiculo_id', vehiculoId)
      .maybeSingle()

    let result

    if (existingData) {
      // Actualizar registro existente
      result = await (supabase as any)
        .from('vehiculo_valoracion_economica')
        .update({
          en_venta,
          precio_venta_deseado,
          fecha_puesta_venta: en_venta ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('vehiculo_id', vehiculoId)
        .select()
        .single()
    } else {
      // Crear nuevo registro
      result = await (supabase as any)
        .from('vehiculo_valoracion_economica')
        .insert({
          vehiculo_id: vehiculoId,
          user_id: user.id,
          en_venta,
          precio_venta_deseado,
          fecha_puesta_venta: en_venta ? new Date().toISOString() : null
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error actualizando estado de venta:', result.error)
      return NextResponse.json(
        { error: 'Error actualizando estado de venta' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
