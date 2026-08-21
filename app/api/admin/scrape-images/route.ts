import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isProhibidaParaEnriquecer } from '@/lib/areas/image-copyright'
import { scrapeFotosWebOficial } from '@/lib/areas/scrape-official-images'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    })
    throw new Error('Supabase credentials not configured')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🖼️ [IMAGES] Iniciando búsqueda de imágenes')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    const { areaId } = await request.json()
    console.log('📝 [IMAGES] Area ID recibido:', areaId)

    if (!areaId) {
      return NextResponse.json({ error: 'Area ID es requerido' }, { status: 400 })
    }

    // Obtener el área de la base de datos
    console.log('🔍 [IMAGES] Buscando área en base de datos...')
    const { data: area, error: areaError } = await (supabase as any)
      .from('areas')
      .select('*')
      .eq('id', areaId)
      .single()

    if (areaError || !area) {
      console.error('❌ [IMAGES] Error: Área no encontrada', areaError)
      return NextResponse.json({ error: 'Área no encontrada' }, { status: 404 })
    }

    console.log('✅ [IMAGES] Área encontrada:', area.nombre, '-', area.ciudad)

    const imagenesEncontradas: Array<{
      url: string
      fuente: string
      titulo?: string
      prioridad: number
    }> = []

    if (area.website) {
      console.log('🌐 [IMAGES] Etapa 0: Web oficial...')
      const oficiales = await scrapeFotosWebOficial(area.website, 7)
      oficiales.forEach((url) => {
        imagenesEncontradas.push({ url, fuente: 'Web Oficial', prioridad: 0 })
      })
      console.log(`  ✅ ${oficiales.length} fotos de la web oficial`)
    }

    const usarSerp = imagenesEncontradas.length < 2 && !!process.env.SERPAPI_KEY
    if (imagenesEncontradas.length >= 2) {
      console.log('✅ [IMAGES] Bastantes fotos oficiales; se omite Google/Park4night')
    }

    // ETAPA 1: Google Images solo si la web oficial no dio fotos
    if (usarSerp) {
    console.log('🔎 [IMAGES] Etapa 1: Buscando en Google Images...')
    const queryImages = `"${area.nombre}" ${area.ciudad} autocaravanas`
    
    try {
      const serpImagesUrl = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(queryImages)}&api_key=${process.env.SERPAPI_KEY}&location=Spain&hl=es&gl=es&num=20`
      const respImages = await fetch(serpImagesUrl)
      const dataImages = await respImages.json()

      if (!dataImages.error && dataImages.images_results) {
        console.log(`  ✅ Encontradas ${dataImages.images_results.length} imágenes en Google Images`)
        
        dataImages.images_results.slice(0, 10).forEach((img: any) => {
          if (img.original && esImagenValida(img.original)) {
            imagenesEncontradas.push({
              url: img.original,
              fuente: 'Google Images',
              titulo: img.title,
              prioridad: 2
            })
          }
        })
      }
    } catch (e) {
      console.log('  ⚠️ Error buscando imágenes:', e)
    }

    // ETAPA 2: Park4night
    } else if (imagenesEncontradas.length < 2) {
      console.log('⚠️ [IMAGES] Sin fotos oficiales y sin SERPAPI_KEY')
    }

    if (usarSerp) {
    console.log('🏕️ [IMAGES] Etapa 2: Buscando en Park4night...')
    const queryPark4night = `"${area.nombre}" ${area.ciudad} site:park4night.com`
    
    try {
      const serpPark4nightUrl = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(queryPark4night)}&api_key=${process.env.SERPAPI_KEY}&num=10`
      const respPark = await fetch(serpPark4nightUrl)
      const dataPark = await respPark.json()

      if (!dataPark.error && dataPark.images_results) {
        console.log(`  ✅ Encontradas ${dataPark.images_results.length} imágenes en Park4night`)
        
        dataPark.images_results.forEach((img: any) => {
          if (img.original && esImagenValida(img.original)) {
            imagenesEncontradas.push({
              url: img.original,
              fuente: 'Park4night',
              titulo: img.title,
              prioridad: 1 // Alta prioridad
            })
          }
        })
      }
    } catch (e) {
      console.log('  ⚠️ Error buscando Park4night:', e)
    }
    }

    // Filtrar imágenes duplicadas
    const imagenesUnicas = eliminarDuplicados(imagenesEncontradas)
    
    // Ordenar por prioridad (1 = máxima)
    imagenesUnicas.sort((a: any, b: any) => a.prioridad - b.prioridad)

    console.log(`📊 [IMAGES] Total imágenes encontradas: ${imagenesUnicas.length}`)
    console.log(`  - Web oficial: ${imagenesUnicas.filter((i: any) => i.fuente === 'Web Oficial').length}`)
    console.log(`  - Park4night: ${imagenesUnicas.filter((i: any) => i.fuente === 'Park4night').length}`)
    console.log(`  - Google Images: ${imagenesUnicas.filter((i: any) => i.fuente === 'Google Images').length}`)

    if (imagenesUnicas.length === 0) {
      console.log('⚠️ [IMAGES] No se encontraron imágenes')
      return NextResponse.json({
        success: false,
        message: 'No se encontraron imágenes para esta área',
        imagenes: []
      })
    }

    // Guardar las mejores 7 imágenes en la BD
    const foto_principal = imagenesUnicas[0]?.url || null
    const fotos_urls = imagenesUnicas.slice(0, 7).map((img: any) => img.url)

    console.log('💾 [IMAGES] Actualizando base de datos...')
    const { error: updateError } = await (supabase as any)
      .from('areas')
      .update({
        foto_principal: foto_principal,
        fotos_urls: fotos_urls,
        updated_at: new Date().toISOString()
      })
      .eq('id', areaId)

    if (updateError) {
      console.error('❌ [IMAGES] Error al guardar:', updateError)
      throw updateError
    }

    console.log('✅ [IMAGES] ¡Imágenes guardadas exitosamente!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return NextResponse.json({
      success: true,
      foto_principal: foto_principal,
      total_imagenes: fotos_urls.length,
      imagenes: imagenesUnicas.slice(0, 7)
    })

  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ [IMAGES] ERROR CRÍTICO:', error)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return NextResponse.json(
      {
        error: error.message || 'Error procesando imágenes',
        details: error.stack?.split('\n')[0] || 'Sin detalles adicionales',
        errorType: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    )
  }
}

// Funciones auxiliares
function esImagenValida(url: string): boolean {
  if (isProhibidaParaEnriquecer(url)) return false

  const urlLower = url.toLowerCase()
  
  // RECHAZAR: Miniaturas de YouTube/Vimeo
  if (urlLower.includes('ytimg.com') || 
      urlLower.includes('youtube.com') || 
      urlLower.includes('vimeo.com')) {
    return false
  }
  
  // RECHAZAR: Iconos, logos, avatares, banners
  if (urlLower.includes('icon') || 
      urlLower.includes('logo') || 
      urlLower.includes('avatar') ||
      urlLower.includes('banner') ||
      urlLower.includes('sprite') ||
      urlLower.includes('placeholder') ||
      urlLower.includes('default') ||
      urlLower.includes('thumb')) {
    return false
  }

  // RECHAZAR: Palabras que indican marcas de agua o imágenes de stock
  if (urlLower.includes('watermark') || 
      urlLower.includes('marca-agua') ||
      urlLower.includes('marca_agua') ||
      urlLower.includes('stock') ||
      urlLower.includes('preview') ||
      urlLower.includes('sample') ||
      urlLower.includes('demo') ||
      urlLower.includes('shutterstock') ||
      urlLower.includes('gettyimages') ||
      urlLower.includes('istockphoto') ||
      urlLower.includes('dreamstime') ||
      urlLower.includes('123rf') ||
      urlLower.includes('depositphotos') ||
      urlLower.includes('alamy')) {
    return false
  }

  // RECHAZAR: URLs con parámetros que indican miniaturas o previews
  if (urlLower.includes('thumbnail') ||
      urlLower.includes('_thumb') ||
      urlLower.includes('-thumb') ||
      urlLower.includes('_preview') ||
      urlLower.includes('-preview') ||
      urlLower.includes('_small') ||
      urlLower.includes('-small')) {
    return false
  }

  // RECHAZAR: Imágenes muy pequeñas (menos de 400px)
  const sizeMatch = urlLower.match(/(\d+)x(\d+)/)
  if (sizeMatch) {
    const width = parseInt(sizeMatch[1])
    const height = parseInt(sizeMatch[2])
    if (width < 400 || height < 300) {
      return false
    }
  }

  // RECHAZAR: SVG y GIF (no son fotos reales)
  if (urlLower.includes('.svg') || urlLower.includes('.gif')) {
    return false
  }

  // ACEPTAR: Solo extensiones de fotos reales
  const extensionesValidas = ['.jpg', '.jpeg', '.png', '.webp']
  return extensionesValidas.some((ext: any) => urlLower.includes(ext))
}

function eliminarDuplicados(imagenes: Array<any>): Array<any> {
  const urlsVistas = new Set<string>()
  return imagenes.filter((img: any) => {
    if (urlsVistas.has(img.url)) {
      return false
    }
    urlsVistas.add(img.url)
    return true
  })
}

