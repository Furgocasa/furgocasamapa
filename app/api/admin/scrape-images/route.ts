import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scrapeFotosWebOficial } from '@/lib/areas/scrape-official-images'
import { generateAndStoreAreaImage } from '@/lib/areas/generate-area-image'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }
  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient()
  console.log('🖼️ [IMAGES] Web oficial primero; IA solo si no hay foto propia')

  try {
    const { areaId } = await request.json()
    if (!areaId) {
      return NextResponse.json({ error: 'Area ID es requerido' }, { status: 400 })
    }

    const { data: area, error: areaError } = await (supabase as any)
      .from('areas')
      .select('*')
      .eq('id', areaId)
      .single()

    if (areaError || !area) {
      return NextResponse.json({ error: 'Área no encontrada' }, { status: 404 })
    }

    let foto_principal: string | null = null
    let fotos_urls: string[] = []
    let fuente = 'Web Oficial'

    if (area.website) {
      fotos_urls = await scrapeFotosWebOficial(area.website, 7)
      foto_principal = fotos_urls[0] || null
    }

    if (foto_principal) {
      const { error: updateError } = await (supabase as any)
        .from('areas')
        .update({
          foto_principal,
          fotos_urls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', areaId)
      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        fuente,
        foto_principal,
        total_imagenes: fotos_urls.length,
        imagenes: fotos_urls.map((url) => ({ url, fuente })),
      })
    }

    console.log('🛋️ [IMAGES] Sin foto oficial → colchón IA')
    const ia = await generateAndStoreAreaImage(supabase, area)
    return NextResponse.json({
      success: true,
      fuente: 'IA propia',
      foto_principal: ia.foto_principal,
      total_imagenes: ia.fotos_urls.length,
      imagenes: ia.fotos_urls.map((url) => ({ url, fuente: 'IA propia' })),
    })
  } catch (error: any) {
    console.error('❌ [IMAGES]', error)
    return NextResponse.json(
      {
        error: error.message || 'Error procesando imágenes',
        details: error.stack?.split('\n')[0] || 'Sin detalles adicionales',
        errorType: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    )
  }
}
