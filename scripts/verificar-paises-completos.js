/**
 * Script para verificar cuántos países únicos hay en Supabase
 * y si el código del mapa los está cargando todos correctamente
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.log('   Asegúrate de tener .env.local con:')
  console.log('   - NEXT_PUBLIC_SUPABASE_URL')
  console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verificarPaises() {
  try {
    console.log('🔍 Verificando países únicos en Supabase...\n')

    // Obtener TODAS las áreas activas con paginación
    const allPaises = new Set()
    const pageSize = 1000
    let page = 0
    let hasMore = true
    let totalAreas = 0

    console.log('📥 Cargando áreas (paginación)...\n')

    while (hasMore) {
      const { data, error, count } = await supabase
        .from('areas')
        .select('pais', { count: 'exact' })
        .eq('activo', true)
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        console.error('❌ Error:', error)
        break
      }

      if (data && data.length > 0) {
        data.forEach(area => {
          if (area.pais) {
            allPaises.add(area.pais.trim())
          }
        })
        totalAreas += data.length
        console.log(`   Página ${page + 1}: ${data.length} áreas cargadas (Total: ${totalAreas})`)
        page++

        if (data.length < pageSize) {
          hasMore = false
        }
      } else {
        hasMore = false
      }
    }

    // Obtener países únicos ordenados
    const paisesUnicos = Array.from(allPaises).sort()

    console.log('\n' + '='.repeat(60))
    console.log('📊 RESULTADOS')
    console.log('='.repeat(60))
    console.log(`✅ Total áreas activas: ${totalAreas}`)
    console.log(`✅ Total países únicos: ${paisesUnicos.length}`)
    console.log('\n📋 Lista completa de países:')
    console.log('─'.repeat(60))
    
    paisesUnicos.forEach((pais, index) => {
      console.log(`${(index + 1).toString().padStart(3)}. ${pais}`)
    })

    console.log('\n' + '='.repeat(60))
    console.log('🔍 VERIFICACIÓN DEL CÓDIGO ACTUAL')
    console.log('='.repeat(60))
    
    // Simular la query actual del código (sin paginación)
    const { data: dataSinPaginacion, error: errorSinPaginacion } = await supabase
      .from('areas')
      .select('pais')
      .eq('activo', true)

    if (errorSinPaginacion) {
      console.error('❌ Error en query sin paginación:', errorSinPaginacion)
    } else {
      const paisesSinPaginacion = new Set()
      dataSinPaginacion?.forEach(area => {
        if (area.pais) {
          paisesSinPaginacion.add(area.pais.trim())
        }
      })
      const paisesSinPaginacionArray = Array.from(paisesSinPaginacion).sort()

      console.log(`\n⚠️  Query SIN paginación (código actual):`)
      console.log(`   Áreas cargadas: ${dataSinPaginacion?.length || 0}`)
      console.log(`   Países encontrados: ${paisesSinPaginacionArray.length}`)
      
      if (paisesSinPaginacionArray.length < paisesUnicos.length) {
        console.log(`\n❌ PROBLEMA DETECTADO:`)
        console.log(`   Faltan ${paisesUnicos.length - paisesSinPaginacionArray.length} países`)
        console.log(`\n   Países que faltan:`)
        const paisesFaltantes = paisesUnicos.filter(p => !paisesSinPaginacionArray.includes(p))
        paisesFaltantes.forEach(pais => {
          console.log(`     - ${pais}`)
        })
      } else {
        console.log(`\n✅ Todos los países están siendo cargados correctamente`)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('💡 RECOMENDACIÓN')
    console.log('='.repeat(60))
    if (totalAreas > 1000) {
      console.log('⚠️  Hay más de 1000 áreas. El código actual NO usa paginación.')
      console.log('   Esto significa que algunos países pueden no cargarse.')
      console.log('\n   SOLUCIÓN: Usar paginación en la query de países.')
    } else {
      console.log('✅ Menos de 1000 áreas. El código actual debería funcionar.')
    }

  } catch (err) {
    console.error('❌ Error:', err)
    process.exit(1)
  }
}

verificarPaises()
