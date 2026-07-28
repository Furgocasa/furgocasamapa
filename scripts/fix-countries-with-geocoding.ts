/**
 * Script para corregir países de áreas usando Google Geocoding API
 * =================================================================
 * 
 * Este script:
 * 1. Lee todas las áreas con coordenadas GPS de Supabase
 * 2. Usa Google Geocoding API para obtener el país real desde lat/lng
 * 3. Compara con el país actual en la base de datos
 * 4. Aplica las correcciones (solo si se pasa --apply)
 * 
 * USO:
 *   npm run db:fix:countries           # Modo dry-run (solo muestra cambios)
 *   npm run db:fix:countries -- --apply # Aplica los cambios
 * 
 * REQUISITOS:
 *   - Variable de entorno NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 *   - Variables de Supabase configuradas
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

// Configurar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Geocoding con Nominatim (OpenStreetMap): GRATIS, no requiere API key

interface Area {
  id: string
  nombre: string
  pais: string | null
  provincia: string | null
  ciudad: string | null
  latitud: number
  longitud: number
}

interface GeocodeResult {
  country: string
  province: string
  city: string
}

/**
 * Función para obtener país desde coordenadas GPS usando Nominatim (OpenStreetMap)
 * GRATIS - sin coste por petición (antes: Google Geocoding, $5/1000).
 * Límite de uso: 1 petición/segundo (respetado con el delay del bucle principal).
 */
async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es&zoom=10`

    const response = await fetch(url, {
      headers: {
        // Nominatim exige identificarse con un User-Agent propio
        'User-Agent': 'MapaFurgocasa/1.0 (contacto@acttax.es)'
      }
    })
    const data: any = await response.json()

    if (!data || data.error || !data.address) {
      return null
    }

    const addr = data.address
    const country = addr.country || ''
    // Equivalencias aproximadas: provincia (admin level 2 Google) ≈ province/county/state_district
    const province = addr.province || addr.county || addr.state_district || addr.state || ''
    const city = addr.city || addr.town || addr.village || addr.municipality || ''

    return { country: country || 'Desconocido', province, city }

  } catch (error) {
    console.error('Error en reverse geocoding:', error)
    return null
  }
}

/**
 * Delay para evitar saturar la API
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Función principal
 */
async function fixCountries() {
  const applyChanges = process.argv.includes('--apply')
  
  console.log('\n' + '='.repeat(70))
  console.log('🔧 CORRECCIÓN DE PAÍSES CON GOOGLE GEOCODING API')
  console.log('='.repeat(70))
  console.log(`Modo: ${applyChanges ? '✅ APLICAR CAMBIOS' : '👀 DRY RUN (solo mostrar)'}`)
  console.log('='.repeat(70) + '\n')

  // 1. Obtener TODAS las áreas con coordenadas GPS (en lotes)
  console.log('📊 Cargando áreas desde Supabase...')
  
  const allAreas: Area[] = []
  const pageSize = 1000
  let page = 0
  let hasMore = true

  while (hasMore) {
    const { data: areas, error } = await (supabase as any).from('areas')
      .select('id, nombre, pais, provincia, ciudad, latitud, longitud')
      .not('latitud', 'is', null)
      .not('longitud', 'is', null)
      .eq('activo', true)
      .order('nombre')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('❌ Error cargando áreas:', error.message)
      process.exit(1)
    }

    if (!areas || areas.length === 0) {
      hasMore = false
    } else {
      allAreas.push(...(areas as Area[]))
      console.log(`   Cargadas ${allAreas.length} áreas...`)
      page++
      
      if (areas.length < pageSize) {
        hasMore = false
      }
    }
  }

  if (allAreas.length === 0) {
    console.log('⚠️  No se encontraron áreas con coordenadas GPS')
    process.exit(0)
  }

  console.log(`✅ Total: ${allAreas.length} áreas con coordenadas GPS\n`)
  
  const areas = allAreas

  // 2. Analizar y corregir
  const changes: Array<{
    area: Area
    oldCountry: string
    newCountry: string
    newProvince?: string
    newCity?: string
  }> = []

  let processed = 0
  let errors = 0
  let apiCalls = 0

  console.log('🔍 Analizando países...\n')

  for (const area of areas as Area[]) {
    try {
      // Llamar a Google Geocoding API
      const location = await reverseGeocode(area.latitud, area.longitud)
      apiCalls++
      
      if (!location) {
        errors++
        console.log(`⚠️  ${area.nombre}: No se pudo obtener ubicación`)
        continue
      }

      // Comparar país actual vs país real
      const oldCountry = area.pais?.trim() || 'NULL'
      const newCountry = location.country.trim()

      if (oldCountry !== newCountry) {
        changes.push({
          area,
          oldCountry,
          newCountry,
          newProvince: location.province || undefined,
          newCity: location.city || undefined
        })
        
        console.log(`🔄 ${area.nombre}`)
        console.log(`   ${oldCountry} → ${newCountry}`)
      }

      processed++

      // Mostrar progreso cada 50 áreas
      if (processed % 50 === 0) {
        console.log(`\n📈 Progreso: ${processed}/${areas.length} (${Math.round(processed/areas.length*100)}%)\n`)
      }

      // Delay para no saturar la API (25 requests/segundo = 40ms)
      await delay(1100) // Nominatim exige máximo 1 petición/segundo

    } catch (error: any) {
      errors++
      console.error(`❌ Error procesando ${area.nombre}:`, error.message)
    }
  }

  // 3. Mostrar resumen
  console.log('\n' + '='.repeat(70))
  console.log('📊 RESUMEN')
  console.log('='.repeat(70))
  console.log(`Áreas procesadas:     ${processed}`)
  console.log(`Cambios necesarios:   ${changes.length}`)
  console.log(`Errores:              ${errors}`)
  console.log(`Llamadas API:         ${apiCalls}`)
  console.log('='.repeat(70) + '\n')

  if (changes.length === 0) {
    console.log('✅ ¡No hay cambios necesarios! Todos los países están correctos.\n')
    return
  }

  // 4. Mostrar cambios por país
  const changesByCountry: Record<string, number> = {}
  changes.forEach((change: any) => {
    const key = `${change.oldCountry} → ${change.newCountry}`
    changesByCountry[key] = (changesByCountry[key] || 0) + 1
  })

  console.log('📋 CAMBIOS POR PAÍS:')
  Object.entries(changesByCountry)
    .sort((a: any, b: any) => b[1] - a[1])
    .forEach(([change, count]) => {
      console.log(`   ${change}: ${count} áreas`)
    })
  console.log('')

  // 5. Aplicar cambios si se especificó --apply
  if (applyChanges) {
    console.log('💾 Aplicando cambios a la base de datos...\n')
    
    let applied = 0
    let failed = 0

    for (const change of changes) {
      try {
        const updateData: any = {
          pais: change.newCountry
        }

        // Solo actualizar provincia y ciudad si están vacías o son NULL
        if (change.newProvince && (!change.area.provincia || change.area.provincia.trim() === '')) {
          updateData.provincia = change.newProvince
        }
        if (change.newCity && (!change.area.ciudad || change.area.ciudad.trim() === '')) {
          updateData.ciudad = change.newCity
        }

        const { error: updateError } = await (supabase as any).from('areas')
          .update(updateData)
          .eq('id', change.area.id)

        if (updateError) {
          console.error(`❌ Error actualizando ${change.area.nombre}:`, updateError.message)
          failed++
        } else {
          applied++
          console.log(`✅ ${change.area.nombre}: ${change.oldCountry} → ${change.newCountry}`)
        }

      } catch (error: any) {
        console.error(`❌ Error actualizando ${change.area.nombre}:`, error.message)
        failed++
      }
    }

    console.log('\n' + '='.repeat(70))
    console.log('✅ CAMBIOS APLICADOS')
    console.log('='.repeat(70))
    console.log(`Actualizadas correctamente: ${applied}`)
    console.log(`Errores:                    ${failed}`)
    console.log('='.repeat(70) + '\n')

  } else {
    console.log('👀 Modo DRY RUN - No se aplicaron cambios')
    console.log('   Para aplicar los cambios, ejecuta:')
    console.log('   npm run db:fix:countries -- --apply\n')
  }
}

// Ejecutar
fixCountries()
  .then(() => {
    console.log('✅ Script completado\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })

