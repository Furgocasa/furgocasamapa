import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scrapeFotosWebOficial } from '@/lib/areas/scrape-official-images'
import { generateAndStoreAreaImage } from '@/lib/areas/generate-area-image'
import {
  esFotoSeguraEnFicha,
  esWebDirectorio,
  uniqueUrlsOf,
} from '@/lib/areas/image-copyright'

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

async function urlsUsadasPorOtras(supabase: ReturnType<typeof createClient>, exceptId: string) {
  const used = new Set<string>()
  let page = 0
  while (true) {
    const { data, error } = await (supabase as any)
      .from('areas')
      .select('id,foto_principal,fotos_urls')
      .eq('activo', true)
      .range(page * 1000, page * 1000 + 999)
    if (error) throw error
    if (!data?.length) break
    for (const row of data) {
      if (row.id === exceptId) continue
      for (const url of uniqueUrlsOf(row)) used.add(url)
    }
    if (data.length < 1000) break
    page++
  }
  return used
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

    if (area.activo === false) {
      return NextResponse.json({ error: 'El área está inactiva' }, { status: 400 })
    }

    const propias = uniqueUrlsOf(area).filter((url) => esFotoSeguraEnFicha(url))
    if (propias.length > 0) {
      return NextResponse.json({
        success: true,
        fuente: 'Ya tenía fotos propias',
        skipped: true,
        foto_principal: propias[0],
        total_imagenes: propias.length,
        imagenes: propias.map((url) => ({ url, fuente: 'Ya en ficha' })),
      })
    }

    const ocupadas = await urlsUsadasPorOtras(supabase, areaId)
    let foto_principal: string | null = null
    let fotos_urls: string[] = []
    let fuente = 'Web Oficial'
    const web = area.website && !esWebDirectorio(area.website) ? area.website : null

    if (web) {
      const scrap = await scrapeFotosWebOficial(web, 7)
      fotos_urls = scrap.filter((url) => esFotoSeguraEnFicha(url) && !ocupadas.has(url))
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

    console.log('🛋️ [IMAGES] Sin foto oficial usable → colchón IA')
    const ia = await generateAndStoreAreaImage(supabase, {
      ...area,
      foto_principal: null,
      fotos_urls: [],
    })
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
