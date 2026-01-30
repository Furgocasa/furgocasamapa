/**
 * Script para obtener lista de países únicos desde Supabase
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function getPaisesUnicos() {
  try {
    console.log('🔍 Consultando países únicos en Supabase...\n')

    // Obtener TODAS las áreas activas paginando
    let allAreas = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from('areas')
        .select('pais')
        .eq('activo', true)
        .not('pais', 'is', null)
        .neq('pais', '')
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        console.error('❌ Error:', error.message)
        process.exit(1)
      }

      if (data && data.length > 0) {
        allAreas.push(...data)
        console.log(`📦 Página ${page + 1}: ${data.length} áreas`)
        page++
        if (data.length < pageSize) hasMore = false
      } else {
        hasMore = false
      }
    }

    console.log(`\n✅ Total áreas procesadas: ${allAreas.length}\n`)

    // Extraer países únicos
    const paisesSet = new Set()
    allAreas.forEach(area => {
      if (area.pais) {
        paisesSet.add(area.pais.trim())
      }
    })

    const paisesArray = Array.from(paisesSet).sort()

    console.log('═══════════════════════════════════════════════════════')
    console.log(`📍 PAÍSES ÚNICOS: ${paisesArray.length}`)
    console.log('═══════════════════════════════════════════════════════\n')

    console.log('// Lista para copiar en el código:\n')
    console.log('const paisesDisponibles = [')
    paisesArray.forEach(pais => {
      console.log(`  '${pais}',`)
    })
    console.log(']\n')

    console.log('═══════════════════════════════════════════════════════')

  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

getPaisesUnicos()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error fatal:', error)
    process.exit(1)
  })
