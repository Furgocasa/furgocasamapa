import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// API específica para búsqueda en mapa con bounds
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user || !session.user.user_metadata?.is_admin) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador.' },
        { status: 403 }
      )
    }

    const { query, bounds } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere un término de búsqueda' },
        { status: 400 }
      )
    }

    if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
      return NextResponse.json(
        { error: 'Se requieren los límites del mapa (bounds)' },
        { status: 400 }
      )
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY

    if (!apiKey) {
      console.error('❌ Google Maps API Key no configurada')
      return NextResponse.json(
        { error: 'Google Maps API Key no configurada en el servidor.' },
        { status: 500 }
      )
    }

    console.log('🗺️ Buscando en mapa:', query)
    console.log('📐 Bounds:', bounds)

    // Calcular el centro y radio del área visible
    const centerLat = (bounds.north + bounds.south) / 2
    const centerLng = (bounds.east + bounds.west) / 2

    // Calcular radio aproximado (distancia desde el centro a una esquina)
    const latDiff = bounds.north - bounds.south
    const lngDiff = bounds.east - bounds.west
    const radiusKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111 / 2 // ~111km por grado
    const radiusMeters = Math.min(radiusKm * 1000, 50000) // Máximo 50km (límite de Google)

    console.log('📍 Centro:', { lat: centerLat, lng: centerLng })
    console.log('📏 Radio:', `${radiusKm.toFixed(2)}km (limitado a ${(radiusMeters/1000).toFixed(2)}km)`)

    // Usar Nearby Search en lugar de Text Search para búsqueda por área
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
    searchUrl.searchParams.append('location', `${centerLat},${centerLng}`)
    searchUrl.searchParams.append('radius', radiusMeters.toString())
    searchUrl.searchParams.append('keyword', query)
    searchUrl.searchParams.append('key', apiKey)
    searchUrl.searchParams.append('language', 'es')
    // No restringir por tipo para incluir campings, áreas de autocaravanas y todo tipo de lugares relevantes
    // tanto en Europa como en Sudamérica

    console.log('📡 URL de búsqueda en mapa:', searchUrl.toString().replace(apiKey, 'API_KEY_HIDDEN'))

    const response = await fetch(searchUrl.toString())

    if (!response.ok) {
      console.error('❌ Error HTTP de Google Places API:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('❌ Error body:', errorText)
      return NextResponse.json(
        { error: `Error en la API de Google: ${response.status} ${response.statusText}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log('📦 Respuesta de Google Places API:', data.status)

    if (data.status === 'ZERO_RESULTS') {
      console.log('ℹ️ No se encontraron resultados en esta área')
      return NextResponse.json({
        results: [],
        status: 'ZERO_RESULTS'
      })
    }

    if (data.status === 'REQUEST_DENIED') {
      console.error('❌ REQUEST_DENIED:', data.error_message)
      return NextResponse.json(
        {
          error: `Error de Google Places API: ${data.error_message || 'Solicitud denegada'}`,
          details: data.error_message
        },
        { status: 500 }
      )
    }

    if (data.status !== 'OK') {
      console.error('❌ Error de Google Places API:', data.status, data.error_message)
      return NextResponse.json(
        {
          error: data.error_message || `Error al buscar en Google Places (${data.status})`,
          status: data.status
        },
        { status: 500 }
      )
    }

    console.log(`✅ Encontrados ${data.results?.length || 0} resultados iniciales`)

    // Recopilar todos los resultados (hasta 60)
    let allResults = data.results || []
    let nextPageToken = data.next_page_token

    // Google Places devuelve máximo 20 resultados por página, hasta 3 páginas (60 total)
    let pagesProcessed = 1
    while (nextPageToken && pagesProcessed < 3) {
      // Google requiere un pequeño delay antes de usar el next_page_token
      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log(`📄 Obteniendo página ${pagesProcessed + 1}...`)

      const nextPageUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
      nextPageUrl.searchParams.append('key', apiKey)
      nextPageUrl.searchParams.append('pagetoken', nextPageToken)

      const nextResponse = await fetch(nextPageUrl.toString())

      if (nextResponse.ok) {
        const nextData = await nextResponse.json()

        if (nextData.status === 'OK' && nextData.results) {
          allResults = [...allResults, ...nextData.results]
          nextPageToken = nextData.next_page_token
          pagesProcessed++
          console.log(`✅ Página ${pagesProcessed}: ${nextData.results.length} resultados más`)
        } else {
          console.log(`⚠️ No hay más resultados disponibles`)
          break
        }
      } else {
        console.error(`❌ Error obteniendo página ${pagesProcessed + 1}`)
        break
      }
    }

    console.log(`🎉 Total de resultados obtenidos: ${allResults.length}`)

    // Enriquecer resultados con Place Details
    console.log('📞 Obteniendo detalles adicionales de cada lugar...')
    const resultsWithDetails = await Promise.all(
      allResults.map(async (place: any) => {
        try {
          const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json')
          detailsUrl.searchParams.append('place_id', place.place_id)
          detailsUrl.searchParams.append('key', apiKey)
          // AHORRO: solo pedimos los campos que realmente usamos (website y teléfono).
          // Antes se pedían reviews/opening_hours/etc. (SKU caro) sin usarse.
          detailsUrl.searchParams.append('fields', 'website,formatted_phone_number,international_phone_number')
          detailsUrl.searchParams.append('language', 'es')

          const detailsResponse = await fetch(detailsUrl.toString())

          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json()

            if (detailsData.status === 'OK' && detailsData.result) {
              return {
                place_id: place.place_id,
                name: place.name,
                formatted_address: place.vicinity || place.formatted_address || '',
                geometry: {
                  location: {
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng
                  }
                },
                types: place.types,
                rating: place.rating,
                user_ratings_total: place.user_ratings_total,
                business_status: place.business_status,
                website: detailsData.result.website || null,
                phone: detailsData.result.formatted_phone_number || detailsData.result.international_phone_number || null,
                photos: place.photos?.map((photo: any) => ({
                  photo_reference: photo.photo_reference,
                  height: photo.height,
                  width: photo.width
                }))
              }
            }
          }

          // Si falla, devolver sin detalles adicionales
          return {
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.vicinity || place.formatted_address || '',
            geometry: {
              location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
              }
            },
            types: place.types,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            business_status: place.business_status,
            website: null,
            phone: null,
            photos: place.photos?.map((photo: any) => ({
              photo_reference: photo.photo_reference,
              height: photo.height,
              width: photo.width
            }))
          }
        } catch (error) {
          console.error(`Error obteniendo detalles para ${place.name}:`, error)
          return {
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.vicinity || place.formatted_address || '',
            geometry: {
              location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
              }
            },
            types: place.types,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            business_status: place.business_status,
            website: null,
            phone: null,
            photos: []
          }
        }
      })
    )

    console.log(`✅ Detalles obtenidos para ${resultsWithDetails.length} lugares`)
    const withWebsite = resultsWithDetails.filter((r: any) => r.website).length
    console.log(`🌐 ${withWebsite} lugares tienen website`)

    return NextResponse.json({
      results: resultsWithDetails,
      status: 'OK',
      total: resultsWithDetails.length,
      bounds: bounds
    })
  } catch (error: any) {
    console.error('❌ Error en búsqueda de lugares en mapa:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
