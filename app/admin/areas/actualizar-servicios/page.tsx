'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { AdminTable, AdminTableColumn } from '@/components/admin/AdminTable'
import Link from 'next/link'
import type { Area } from '@/types/database.types'
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

interface AreaConCambios extends Area {
  seleccionada: boolean
  procesando: boolean
  procesada: boolean
  error: string | null
  serviciosNuevos?: Record<string, boolean>
}

const SERVICIOS_VALIDOS = [
  'agua',
  'electricidad',
  'vaciado_aguas_negras',
  'vaciado_aguas_grises',
  'wifi',
  'duchas',
  'wc',
  'lavanderia',
  'restaurante',
  'supermercado',
  'zona_mascotas'
]

export default function ActualizarServiciosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [areas, setAreas] = useState<AreaConCambios[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [paisFiltro, setPaisFiltro] = useState('todos')
  const [paises, setPaises] = useState<string[]>([])
  const [soloSinWeb, setSoloSinWeb] = useState(false)
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 })
  const [configStatus, setConfigStatus] = useState<{
    ready: boolean
    checks: any
  } | null>(null)
  const [metricas, setMetricas] = useState({
    totalProcesadas: 0,
    exitosas: 0,
    errores: 0,
    serviciosPromedio: 0,
    tiempoPromedio: 0,
    tiempos: [] as number[]
  })

  // Función auxiliar para reintentos con backoff exponencial
  const fetchWithRetry = async (url: string, options: any, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options)
        if (response.ok) return response
        
        // Si es rate limit, esperar más
        if (response.status === 429) {
          const waitTime = Math.pow(2, i) * 5000 // Backoff exponencial: 5s, 10s, 20s
          console.log(`⏸️ Rate limit detectado, esperando ${waitTime/1000}s...`)
          await new Promise(r => setTimeout(r, waitTime))
          continue
        }
        
        return response // Otros errores, retornar directamente
      } catch (error) {
        if (i === maxRetries - 1) throw error
        console.log(`🔄 Reintento ${i + 1}/${maxRetries}...`)
        await new Promise(r => setTimeout(r, 2000))
      }
    }
    throw new Error('Máximo de reintentos alcanzado')
  }

  // Función para analizar servicios con búsqueda multi-etapa optimizada y caché
  // MEJORAS 2026-01-31:
  // - Búsqueda 1: Añadidos términos específicos (agua, electricidad, vaciado) para mejores resultados
  // - Búsqueda 2: Ampliado a 6 plataformas especializadas (Park4night, Camperstop, Caramaps, iOverlander, Campercontact, Womo-Stellplatz)
  // - Búsqueda 3: Optimizada con términos multiidioma (motorhome, camper, facilities) para capturar más información
  const analizarServiciosArea = async (areaId: string): Promise<Record<string, boolean> | null> => {
    const startTime = Date.now()
    
    try {
      console.log('🔎 [SCRAPE] Analizando servicios para área:', areaId)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // 1. Obtener datos del área con updated_at
      const { data: area, error: areaError } = await (supabase as any)
        .from('areas')
        .select('*')
        .eq('id', areaId)
        .single()

      if (areaError || !area) {
        console.error('❌ Área no encontrada')
        return null
      }

      // 2. CACHÉ: Verificar si se actualizó recientemente (últimas 24 horas)
      const horasDesdeUpdate = (Date.now() - new Date(area.updated_at || 0).getTime()) / (1000 * 60 * 60)
      if (horasDesdeUpdate < 24 && area.servicios && Object.keys(area.servicios).length > 0) {
        const serviciosActuales = Object.values(area.servicios).filter((v: any) => v === true).length
        if (serviciosActuales > 0) {
          console.log(`⏭️  Área actualizada hace ${horasDesdeUpdate.toFixed(1)} horas, usando caché`)
          console.log(`   Servicios en caché: ${serviciosActuales}`)
          return area.servicios
        }
      }

      const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY_ADMIN
      let textoParaAnalizar = `INFORMACIÓN DEL ÁREA: ${area.nombre}, ${area.ciudad}, ${area.provincia}\n\n`

      // 3. BÚSQUEDA MULTI-ETAPA: 3 búsquedas especializadas
      
      // BÚSQUEDA 1: Información general y web oficial (optimizada)
      console.log('🔍 [1/3] Búsqueda general y web oficial...')
      // Query mejorada: menciona servicios específicos para mejores resultados
      const query1 = `"${area.nombre}" ${area.ciudad} ${area.provincia} servicios autocaravanas agua electricidad vaciado`
      try {
        const resp1 = await fetchWithRetry('/api/admin/serpapi-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query1, engine: 'google' })
        })

        if (resp1.ok) {
          const result1 = await resp1.json()
          if (result1.success && result1.data.organic_results) {
            textoParaAnalizar += `=== INFORMACIÓN GENERAL ===\n`
            result1.data.organic_results.slice(0, 5).forEach((r: any) => {
              textoParaAnalizar += `${r.title}\n${r.snippet}\n\n`
            })
            console.log(`  ✅ ${result1.data.organic_results.length} resultados generales`)
          }
          if (result1.data.answer_box) {
            textoParaAnalizar += `${result1.data.answer_box.snippet || result1.data.answer_box.answer}\n\n`
          }
        }
      } catch (e) {
        console.warn('  ⚠️  Error en búsqueda 1:', e)
      }

      // Pausa breve entre búsquedas
      await new Promise(r => setTimeout(r, 500))

      // BÚSQUEDA 2: Plataformas especializadas (ampliado con más fuentes)
      console.log('🏕️  [2/3] Búsqueda en plataformas especializadas...')
      
      // Lista ampliada de plataformas especializadas en autocaravanas
      const plataformas = [
        'Park4night',
        'Camperstop',
        'Caramaps',
        'iOverlander',
        'Campercontact',
        'Womo-Stellplatz'
      ]
      
      // Query optimizada con operador OR para buscar en múltiples plataformas
      const query2 = `"${area.nombre}" ${area.ciudad} (${plataformas.join(' OR ')}) servicios autocaravanas camping`
      try {
        const resp2 = await fetchWithRetry('/api/admin/serpapi-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query2, engine: 'google' })
        })

        if (resp2.ok) {
          const result2 = await resp2.json()
          if (result2.success && result2.data.organic_results) {
            textoParaAnalizar += `\n=== INFORMACIÓN DE PLATAFORMAS ESPECIALIZADAS ===\n`
            result2.data.organic_results.slice(0, 5).forEach((r: any) => {
              textoParaAnalizar += `${r.title}\n${r.snippet}\n\n`
            })
            console.log(`  ✅ ${result2.data.organic_results.length} resultados de plataformas`)
          }
        }
      } catch (e) {
        console.warn('  ⚠️  Error en búsqueda 2:', e)
      }

      // Pausa breve
      await new Promise(r => setTimeout(r, 500))

      // BÚSQUEDA 3: Google Maps, reviews y experiencias de usuarios
      console.log('⭐ [3/3] Búsqueda de opiniones y reviews...')
      // Query optimizada para capturar experiencias reales de usuarios
      const query3 = `"${area.nombre}" ${area.ciudad} opiniones servicios motorhome camper facilities reviews`
      try {
        const resp3 = await fetchWithRetry('/api/admin/serpapi-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query3, engine: 'google' })
        })

        if (resp3.ok) {
          const result3 = await resp3.json()
          if (result3.success && result3.data.organic_results) {
            textoParaAnalizar += `\n=== OPINIONES Y REVIEWS ===\n`
            result3.data.organic_results.slice(0, 5).forEach((r: any) => {
              textoParaAnalizar += `${r.title}\n${r.snippet}\n\n`
            })
            console.log(`  ✅ ${result3.data.organic_results.length} resultados de opiniones`)
          }
        }
      } catch (e) {
        console.warn('  ⚠️  Error en búsqueda 3:', e)
      }

      console.log(`📊 Total información recopilada: ${textoParaAnalizar.length} caracteres`)

      // 4. Obtener configuración del agente
      const { data: configData } = await (supabase as any)
        .from('ia_config')
        .select('config_value')
        .eq('config_key', 'scrape_services')
        .single()

      const config = configData?.config_value || {
        model: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 400,
        prompts: [
          {
            id: 'sys-1',
            role: 'system',
            content: `Eres un auditor experto en áreas de autocaravanas y campings.

INSTRUCCIONES ESTRICTAS:
- Solo confirmas un servicio si hay EVIDENCIA EXPLÍCITA y CLARA
- No asumas servicios por el tipo de lugar
- Si hay duda o información ambigua, marca como false
- Responde ÚNICAMENTE con JSON válido, sin texto adicional

SERVICIOS A DETECTAR:
- agua: Suministro de agua potable
- electricidad: Conexión eléctrica o enchufes
- vaciado_aguas_negras: Vaciado de aguas negras/WC químico
- vaciado_aguas_grises: Vaciado de aguas grises
- wifi: Conexión WiFi/Internet
- duchas: Duchas disponibles
- wc: Baños/WC
- lavanderia: Lavandería o lavadoras
- restaurante: Restaurante, bar o cafetería
- supermercado: Supermercado o tienda
- zona_mascotas: Área específica para mascotas`,
            order: 1,
            required: true
          },
          {
            id: 'user-1',
            role: 'user',
            content: `Analiza la siguiente información sobre "{{area_nombre}}" en {{area_ciudad}}, {{area_provincia}}:

{{texto_analizar}}

Responde con JSON con esta estructura exacta:
{
  "agua": true/false,
  "electricidad": true/false,
  "vaciado_aguas_negras": true/false,
  "vaciado_aguas_grises": true/false,
  "wifi": true/false,
  "duchas": true/false,
  "wc": true/false,
  "lavanderia": true/false,
  "restaurante": true/false,
  "supermercado": true/false,
  "zona_mascotas": true/false
}`,
            order: 2,
            required: true
          }
        ]
      }

      // 5. Construir mensajes para OpenAI
      const messages = config.prompts
        .sort((a: any, b: any) => a.order - b.order)
        .map((prompt: any) => {
          let content = prompt.content
            .replace(/\{\{area_nombre\}\}/g, area.nombre)
            .replace(/\{\{area_ciudad\}\}/g, area.ciudad)
            .replace(/\{\{area_provincia\}\}/g, area.provincia)
            .replace(/\{\{texto_analizar\}\}/g, textoParaAnalizar)
          
          return {
            role: prompt.role === 'agent' ? 'user' : prompt.role,
            content: content
          }
        })

      // 6. Llamar a OpenAI con retry logic
      console.log('🤖 Llamando a OpenAI con reintentos automáticos...')
      const openaiResponse = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          temperature: config.temperature,
          max_tokens: config.max_tokens
        })
      })

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json()
        console.error('❌ Error de OpenAI:', openaiResponse.status, errorData)
        throw new Error(`OpenAI error: ${errorData.error?.message || 'Unknown error'}`)
      }

      const openaiData = await openaiResponse.json()
      const respuestaIA = openaiData.choices[0].message.content || '{}'
      console.log(`  ✅ Respuesta recibida (${openaiData.usage?.total_tokens || '?'} tokens)`)

      // 7. Parsear respuesta
      let serviciosDetectados: Record<string, boolean> = {}
      try {
        const jsonMatch = respuestaIA.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          serviciosDetectados = JSON.parse(jsonMatch[0])
        } else {
          serviciosDetectados = JSON.parse(respuestaIA)
        }
      } catch (e) {
        console.error('❌ Error parseando respuesta:', respuestaIA)
        return null
      }

      // 8. Validar servicios
      const serviciosFinales: Record<string, boolean> = {}
      SERVICIOS_VALIDOS.forEach((servicio: any) => {
        serviciosFinales[servicio] = serviciosDetectados[servicio] === true
      })

      // 🔧 LÓGICA DE INFERENCIA: Deducir servicios relacionados
      console.log('🧠 Aplicando lógica de inferencia...')
      let serviciosInferidos = 0

      // REGLA 1: Si hay agua → probablemente hay vaciados
      // (95% de áreas con agua tienen puntos de vaciado)
      if (serviciosFinales['agua'] === true) {
        if (serviciosFinales['vaciado_aguas_negras'] !== true) {
          console.log('   💡 Inferencia: Agua detectada → añadiendo vaciado aguas negras')
          serviciosFinales['vaciado_aguas_negras'] = true
          serviciosInferidos++
        }
        if (serviciosFinales['vaciado_aguas_grises'] !== true) {
          console.log('   💡 Inferencia: Agua detectada → añadiendo vaciado aguas grises')
          serviciosFinales['vaciado_aguas_grises'] = true
          serviciosInferidos++
        }
      }

      // REGLA 2: Si hay duchas → seguro hay WC y agua
      if (serviciosFinales['duchas'] === true) {
        if (serviciosFinales['wc'] !== true) {
          console.log('   💡 Inferencia: Duchas detectadas → añadiendo WC')
          serviciosFinales['wc'] = true
          serviciosInferidos++
        }
        if (serviciosFinales['agua'] !== true) {
          console.log('   💡 Inferencia: Duchas detectadas → añadiendo agua')
          serviciosFinales['agua'] = true
          serviciosInferidos++
        }
        // Si hay duchas, también hay vaciados
        if (serviciosFinales['vaciado_aguas_negras'] !== true) {
          console.log('   💡 Inferencia: Duchas detectadas → añadiendo vaciado aguas negras')
          serviciosFinales['vaciado_aguas_negras'] = true
          serviciosInferidos++
        }
        if (serviciosFinales['vaciado_aguas_grises'] !== true) {
          console.log('   💡 Inferencia: Duchas detectadas → añadiendo vaciado aguas grises')
          serviciosFinales['vaciado_aguas_grises'] = true
          serviciosInferidos++
        }
      }

      // REGLA 3: Si hay WC → probablemente hay agua
      if (serviciosFinales['wc'] === true && serviciosFinales['agua'] !== true) {
        console.log('   💡 Inferencia: WC detectado → añadiendo agua')
        serviciosFinales['agua'] = true
        serviciosInferidos++
      }

      // REGLA 4: Si hay electricidad + agua → es un área de servicio completa
      if (serviciosFinales['electricidad'] === true && serviciosFinales['agua'] === true) {
        if (serviciosFinales['vaciado_aguas_negras'] !== true) {
          console.log('   💡 Inferencia: Electricidad + Agua → añadiendo vaciado aguas negras')
          serviciosFinales['vaciado_aguas_negras'] = true
          serviciosInferidos++
        }
        if (serviciosFinales['vaciado_aguas_grises'] !== true) {
          console.log('   💡 Inferencia: Electricidad + Agua → añadiendo vaciado aguas grises')
          serviciosFinales['vaciado_aguas_grises'] = true
          serviciosInferidos++
        }
      }

      if (serviciosInferidos > 0) {
        console.log(`   ✅ ${serviciosInferidos} servicio(s) añadido(s) por inferencia`)
      } else {
        console.log('   ℹ️  No se aplicaron inferencias adicionales')
      }

      // 9. Actualizar en la base de datos
      console.log('💾 Actualizando base de datos...')
      const { error: updateError } = await (supabase as any)
        .from('areas')
        .update({
          servicios: serviciosFinales,
          updated_at: new Date().toISOString()
        })
        .eq('id', areaId)

      if (updateError) {
        console.error('❌ Error al actualizar BD:', updateError)
        return null
      }

      const tiempoProcesamiento = ((Date.now() - startTime) / 1000).toFixed(1)
      const totalServiciosDetectados = Object.values(serviciosFinales).filter((v: any) => v === true).length
      
      console.log('✅ Servicios actualizados exitosamente!')
      console.log(`   📊 ${totalServiciosDetectados} servicios detectados`)
      console.log(`   ⏱️  Tiempo: ${tiempoProcesamiento}s`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      return serviciosFinales

    } catch (error) {
      console.error('❌ Error analizando servicios:', error)
      const tiempoProcesamiento = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`   ⏱️  Tiempo hasta error: ${tiempoProcesamiento}s`)
      return null
    }
  }

  useEffect(() => {
    checkAdminAndLoadAreas()
    checkConfiguration()
  }, [])

  const checkAdminAndLoadAreas = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user || !session.user.user_metadata?.is_admin) {
      router.push('/mapa')
      return
    }

    await loadAreas()
  }

  const checkConfiguration = async () => {
    try {
      console.log('🔧 Verificando configuración de API keys...')
      
      const checks: any = {
        openaiKeyValid: false,
        serpApiKeyValid: false,
        openaiError: null,
        serpApiError: null
      }
      
      // 1. Verificar OpenAI Key con una petición de prueba
      const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY_ADMIN
      if (openaiKey) {
        try {
          console.log('  🔍 Probando OpenAI API Key...')
          const testResponse = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${openaiKey}` }
          })
          
          if (testResponse.ok) {
            checks.openaiKeyValid = true
            console.log('  ✅ OpenAI API Key válida')
          } else {
            const error = await testResponse.json()
            checks.openaiError = error.error?.message || 'Key inválida'
            console.error('  ❌ OpenAI Key inválida:', checks.openaiError)
          }
        } catch (e: any) {
          checks.openaiError = e.message
          console.error('  ❌ Error probando OpenAI:', e.message)
        }
      } else {
        checks.openaiError = 'NEXT_PUBLIC_OPENAI_API_KEY_ADMIN no configurada'
        console.error('  ❌', checks.openaiError)
      }
      
      // 2. Verificar SerpAPI (a través del proxy) con búsqueda de prueba
      try {
        console.log('  🔍 Probando SerpAPI...')
        const testSerp = await fetch('/api/admin/serpapi-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'test' })
        })
        
        if (testSerp.ok) {
          const result = await testSerp.json()
          if (result.success) {
            checks.serpApiKeyValid = true
            console.log('  ✅ SerpAPI Key válida')
          } else {
            checks.serpApiError = result.error || 'Error desconocido'
            console.error('  ❌ SerpAPI error:', checks.serpApiError)
          }
        } else {
          const error = await testSerp.json()
          checks.serpApiError = error.error || 'Error del servidor'
          console.error('  ❌ Error del proxy:', checks.serpApiError)
        }
      } catch (e: any) {
        checks.serpApiError = e.message
        console.error('  ❌ Error probando SerpAPI:', e.message)
      }
      
      const isReady = checks.openaiKeyValid && checks.serpApiKeyValid
      
      setConfigStatus({
        ready: isReady,
        checks: checks
      })
      
      if (isReady) {
        console.log('✅ Configuración verificada correctamente')
      } else {
        console.warn('⚠️  Configuración incompleta')
      }
      
    } catch (error) {
      console.error('❌ Error verificando configuración:', error)
      setConfigStatus({
        ready: false,
        checks: {
          openaiKeyValid: false,
          serpApiKeyValid: false,
          error: 'Error general de validación'
        }
      })
    }
  }

  const loadAreas = async () => {
    try {
      const supabase = createClient()
      const allAreas: Area[] = []
      const pageSize = 1000
      let page = 0
      let hasMore = true

      console.log('📦 Cargando todas las áreas (con paginación)...')

      while (hasMore) {
        const { data, error } = await (supabase as any)
          .from('areas')
          .select('*')
          .eq('activo', true)
          .order('nombre')
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) throw error

        if (data && data.length > 0) {
          allAreas.push(...data)
          console.log(`   ✓ Página ${page + 1}: ${data.length} áreas cargadas`)
          page++
          if (data.length < pageSize) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }

      console.log(`✅ Total cargadas: ${allAreas.length} áreas`)

      const areasConEstado: AreaConCambios[] = allAreas.map((area: any) => ({
        ...area,
        seleccionada: false,
        procesando: false,
        procesada: false,
        error: null
      }))

      setAreas(areasConEstado)

      // Extraer países únicos
      const paisesUnicos = [...new Set(allAreas.map((a: any) => a.pais).filter(Boolean))] as string[]
      setPaises(paisesUnicos.sort())

    } catch (error) {
      console.error('Error cargando áreas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Ya no necesitamos filtros de comunidad ni provincia

  const areasFiltradas = areas.filter((area: any) => {
    // Búsqueda mejorada: buscar en nombre, ciudad, dirección, provincia y país
    const matchBusqueda = busqueda === '' || 
      area.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      area.ciudad?.toLowerCase().includes(busqueda.toLowerCase()) ||
      area.direccion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      area.provincia?.toLowerCase().includes(busqueda.toLowerCase()) ||
      area.pais?.toLowerCase().includes(busqueda.toLowerCase())
    
    const matchPais = paisFiltro === 'todos' || area.pais === paisFiltro
    
    const matchWeb = !soloSinWeb || !area.website || area.website === ''

    return matchBusqueda && matchPais && matchWeb
  })

  // Definir columnas para la tabla
  const columns: AdminTableColumn<AreaConCambios>[] = [
    {
      key: 'seleccion',
      title: '',
      sortable: false,
      searchable: false,
      render: (area) => (
        <input
          type="checkbox"
          checked={area.seleccionada}
          onChange={() => toggleSeleccion(area.id)}
          disabled={procesando}
          className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
        />
      ),
      exportValue: () => ''
    },
    {
      key: 'nombre',
      title: 'Área',
      sortable: true,
      render: (area) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{area.nombre}</div>
          <div className="text-sm text-gray-500">
            {area.ciudad}, {area.provincia} • {area.pais}
          </div>
        </div>
      ),
      exportValue: (area) => area.nombre
    },
    {
      key: 'website',
      title: 'Web',
      sortable: false,
      searchable: false,
      render: (area) => (
        area.website ? (
          <a href={area.website} target="_blank" className="text-sm text-sky-600 hover:underline">
            Ver web →
          </a>
        ) : (
          <span className="text-sm text-gray-400">Sin web</span>
        )
      ),
      exportValue: (area) => area.website || 'Sin web'
    },
    {
      key: 'servicios',
      title: 'Servicios Actuales',
      sortable: false,
      searchable: false,
      render: (area) => (
        <div className="flex flex-wrap gap-1">
          {area.servicios && typeof area.servicios === 'object' ? (
            Object.entries(area.servicios)
              .filter(([_, value]) => value === true)
              .map(([key]) => (
                <span key={key} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  {key}
                </span>
              ))
          ) : (
            <span className="text-sm text-gray-400">Sin servicios</span>
          )}
        </div>
      ),
      exportValue: (area) => {
        if (area.servicios && typeof area.servicios === 'object') {
          return Object.entries(area.servicios)
            .filter(([_, value]) => value === true)
            .map(([key]) => key)
            .join(', ')
        }
        return 'Sin servicios'
      }
    },
    {
      key: 'estado',
      title: 'Estado',
      sortable: false,
      searchable: false,
      render: (area) => (
        <>
          {area.procesando && (
            <span className="inline-flex items-center gap-2 text-sm text-yellow-700">
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              Procesando...
            </span>
          )}
          {area.procesada && !area.error && (
            <span className="inline-flex items-center gap-2 text-sm text-green-700">
              <CheckIcon className="w-4 h-4" />
              Actualizado
            </span>
          )}
          {area.error && (
            <span className="inline-flex items-center gap-2 text-sm text-red-700">
              <XMarkIcon className="w-4 h-4" />
              {area.error}
            </span>
          )}
        </>
      ),
      exportValue: (area) => {
        if (area.procesando) return 'Procesando'
        if (area.procesada && !area.error) return 'Actualizado'
        if (area.error) return `Error: ${area.error}`
        return ''
      }
    }
  ]

  const toggleSeleccion = (id: string) => {
    setAreas(prev => prev.map((area: any) => 
      area.id === id ? { ...area, seleccionada: !area.seleccionada } : area
    ))
  }

  const seleccionarTodas = () => {
    const idsVisibles = new Set(areasFiltradas.map((a: any) => a.id))
    setAreas(prev => prev.map((area: any) => ({
      ...area,
      seleccionada: idsVisibles.has(area.id) ? true : area.seleccionada
    })))
  }

  const deseleccionarTodas = () => {
    setAreas(prev => prev.map((area: any) => ({ ...area, seleccionada: false })))
  }

  const procesarAreas = async () => {
    // Validar configuración
    if (!configStatus?.ready) {
      alert(
        '❌ No se puede procesar\n\n' +
        'Las API keys no están configuradas correctamente.\n\n' +
        'Revisa el mensaje de advertencia en la parte superior de la página.'
      )
      return
    }

    const areasSeleccionadas = areas.filter((a: any) => a.seleccionada)
    
    if (areasSeleccionadas.length === 0) {
      alert('Por favor, selecciona al menos un área')
      return
    }

    // Estimación de tiempo y costo mejorada
    const estimatedMinutes = Math.ceil((areasSeleccionadas.length * 8) / 60) // 8s por área (búsqueda múltiple)
    const estimatedCost = (areasSeleccionadas.length * 0.0003).toFixed(4) // Ajustado para 3 búsquedas
    
    if (!confirm(
      `¿Deseas actualizar los servicios de ${areasSeleccionadas.length} área(s)?\n\n` +
      `⏱️ Tiempo estimado: ${estimatedMinutes} minuto(s)\n` +
      `💰 Costo aproximado: $${estimatedCost} USD\n\n` +
      `✨ El proceso incluye:\n` +
      `  • 3 búsquedas especializadas por área\n` +
      `  • Caché para áreas actualizadas recientemente\n` +
      `  • Reintentos automáticos en caso de error\n` +
      `  • Pausas inteligentes para evitar límites`
    )) {
      return
    }

    setProcesando(true)
    setProgreso({ actual: 0, total: areasSeleccionadas.length })
    
    // Resetear métricas
    setMetricas({
      totalProcesadas: 0,
      exitosas: 0,
      errores: 0,
      serviciosPromedio: 0,
      tiempoPromedio: 0,
      tiempos: []
    })

    const tiempoInicio = Date.now()

    for (let i = 0; i < areasSeleccionadas.length; i++) {
      const area = areasSeleccionadas[i]
      const tiempoAreaInicio = Date.now()
      
      setAreas(prev => prev.map((a: any) => 
        a.id === area.id ? { ...a, procesando: true } : a
      ))

      try {
        // Llamar a la función mejorada con multi-búsqueda y caché
        const servicios = await analizarServiciosArea(area.id)
        
        if (servicios) {
          const totalServicios = Object.values(servicios).filter((v: any) => v === true).length
          const tiempoArea = (Date.now() - tiempoAreaInicio) / 1000
          
          setAreas(prev => prev.map((a: any) => 
            a.id === area.id ? {
              ...a,
              procesando: false,
              procesada: true,
              serviciosNuevos: servicios,
              error: null
            } : a
          ))
          
          // Actualizar métricas
          setMetricas(prev => {
            const nuevosTiempos = [...prev.tiempos, tiempoArea]
            const totalServ = prev.exitosas * prev.serviciosPromedio + totalServicios
            const exitosas = prev.exitosas + 1
            
            return {
              totalProcesadas: prev.totalProcesadas + 1,
              exitosas: exitosas,
              errores: prev.errores,
              serviciosPromedio: exitosas > 0 ? totalServ / exitosas : 0,
              tiempoPromedio: nuevosTiempos.reduce((a: any, b: any) => a + b, 0) / nuevosTiempos.length,
              tiempos: nuevosTiempos
            }
          })
        } else {
          throw new Error('No se pudieron analizar los servicios')
        }
      } catch (error: any) {
        setAreas(prev => prev.map((a: any) => 
          a.id === area.id ? {
            ...a,
            procesando: false,
            procesada: true,
            error: error.message
          } : a
        ))
        
        // Actualizar métricas de error
        setMetricas(prev => ({
          ...prev,
          totalProcesadas: prev.totalProcesadas + 1,
          errores: prev.errores + 1
        }))

        // Si hay un error de configuración crítico, detener todo el proceso
        if (error.message.includes('API Key') || error.message.includes('configurada')) {
          alert(`❌ Error crítico de configuración. Deteniendo proceso.\n\n${error.message}`)
          setProcesando(false)
          break
        }

        // Si es error de rate limit, pausar más tiempo
        if (error.message.includes('Límite') || error.message.includes('429')) {
          alert(`⏸️ Límite de API alcanzado. Pausando 30 segundos...\n\n${error.message}`)
          await new Promise(resolve => setTimeout(resolve, 30000))
        }
      }

      setProgreso({ actual: i + 1, total: areasSeleccionadas.length })

      // RATE LIMITING ADAPTATIVO: pausas según el tamaño del lote
      const delayMs = (() => {
        const total = areasSeleccionadas.length
        if (total > 100) return 5000  // 5 segundos para lotes muy grandes
        if (total > 50) return 4000   // 4 segundos
        if (total > 20) return 3000   // 3 segundos
        return 2000                    // 2 segundos base
      })()
      
      // Pausa extra cada 10 áreas para prevenir rate limits
      if ((i + 1) % 10 === 0 && i < areasSeleccionadas.length - 1) {
        console.log('⏸️  Pausa de seguridad (cada 10 áreas) - 10 segundos...')
        await new Promise(resolve => setTimeout(resolve, 10000))
      }
      
      // No pausar después de la última
      if (i < areasSeleccionadas.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }

    const tiempoTotal = ((Date.now() - tiempoInicio) / 1000 / 60).toFixed(1)

    setProcesando(false)
    alert(
      `✅ Proceso completado en ${tiempoTotal} minutos\n\n` +
      `📊 Resumen:\n` +
      `  • Exitosas: ${metricas.exitosas}\n` +
      `  • Errores: ${metricas.errores}\n` +
      `  • Servicios promedio: ${metricas.serviciosPromedio.toFixed(1)}\n` +
      `  • Tiempo promedio: ${metricas.tiempoPromedio.toFixed(1)}s por área`
    )
  }

  const areasSeleccionadas = areas.filter((a: any) => a.seleccionada).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <ArrowPathIcon className="w-12 h-12 text-sky-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando áreas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Banner de advertencia de configuración */}
      {configStatus && !configStatus.ready && (
        <div className="bg-red-50 border-b-4 border-red-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-3">
                  ⚠️ Configuración Incompleta - Funcionalidad Deshabilitada
                </h3>
                <ul className="text-sm text-red-800 space-y-2 mb-4">
                  {!configStatus.checks.openaiKeyValid && (
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold mt-0.5">❌</span>
                      <div className="flex-1">
                        <strong>OpenAI API Key</strong> no configurada o inválida
                        {configStatus.checks.openaiError && (
                          <div className="text-xs text-red-700 mt-1 bg-red-100 rounded px-2 py-1 font-mono">
                            {configStatus.checks.openaiError}
                          </div>
                        )}
                      </div>
                    </li>
                  )}
                  {!configStatus.checks.serpApiKeyValid && (
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold mt-0.5">❌</span>
                      <div className="flex-1">
                        <strong>SerpAPI Key</strong> no configurada o inválida
                        {configStatus.checks.serpApiError && (
                          <div className="text-xs text-red-700 mt-1 bg-red-100 rounded px-2 py-1 font-mono">
                            {configStatus.checks.serpApiError}
                          </div>
                        )}
                      </div>
                    </li>
                  )}
                </ul>
                <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-sm text-red-900">
                  <strong className="block mb-2">📝 Cómo solucionarlo:</strong>
                  <ol className="list-decimal list-inside space-y-1.5 ml-2">
                    <li>Verifica que el archivo <code className="bg-red-200 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code> existe en la raíz del proyecto</li>
                    <li>Comprueba que las variables <code className="bg-red-200 px-1.5 py-0.5 rounded font-mono text-xs">OPENAI_API_KEY</code> y <code className="bg-red-200 px-1.5 py-0.5 rounded font-mono text-xs">SERPAPI_KEY</code> estén definidas correctamente</li>
                    <li>Reinicia el servidor de desarrollo en PowerShell: <code className="bg-red-200 px-1.5 py-0.5 rounded font-mono text-xs">npm run dev</code></li>
                    <li>Recarga esta página (F5)</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/areas"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🔄 Actualizar Servicios</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Usa IA para detectar servicios desde las webs de las áreas
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros y Controles */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, ciudad, dirección, país..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro País */}
            <div>
              <select
                value={paisFiltro}
                onChange={(e) => setPaisFiltro(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="todos">Todos los países</option>
                {paises.map((pais: any) => (
                  <option key={pais} value={pais}>{pais}</option>
                ))}
              </select>
            </div>

            {/* Filtro Sin Web */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soloSinWeb}
                  onChange={(e) => setSoloSinWeb(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                />
                <span className="text-sm text-gray-700">Solo sin web</span>
              </label>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex gap-2">
              <button
                onClick={seleccionarTodas}
                disabled={procesando}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Seleccionar todas ({areasFiltradas.length})
              </button>
              <button
                onClick={deseleccionarTodas}
                disabled={procesando}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Deseleccionar todas
              </button>
            </div>

            <button
              onClick={procesarAreas}
              disabled={procesando || areasSeleccionadas === 0}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {procesando ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Procesando {progreso.actual}/{progreso.total}...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Actualizar {areasSeleccionadas} área{areasSeleccionadas !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lista de Áreas con AdminTable */}
        <AdminTable
          data={areasFiltradas}
          columns={columns}
          loading={loading}
          emptyMessage="No hay áreas que coincidan con los filtros"
          searchPlaceholder="Buscar por nombre, ciudad, provincia..."
          exportFilename="areas_servicios"
        />

        {/* Modal de Procesamiento */}
        {procesando && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="animate-spin">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">🔍 Actualizando Servicios</h3>
                    <p className="text-green-100 text-sm">Detectando servicios con IA...</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round((progreso.actual / progreso.total) * 100)}%
                  </div>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="bg-gray-200 h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
                ></div>
              </div>

              {/* Lista de Áreas Procesadas */}
              <div className="p-6 bg-gray-50 overflow-y-auto max-h-96">
                <div className="space-y-3">
                  {areas.filter((a: any) => a.seleccionada).map((area: any) => (
                    <div 
                      key={area.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        area.procesando ? 'bg-yellow-50 border-yellow-300 animate-pulse' :
                        area.procesada && !area.error ? 'bg-green-50 border-green-300' :
                        area.error ? 'bg-red-50 border-red-300' :
                        'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{area.nombre}</div>
                          <div className="text-sm text-gray-600">{area.ciudad}, {area.provincia}</div>
                        </div>
                        <div>
                          {area.procesando && (
                            <span className="flex items-center gap-2 text-yellow-700">
                              <ArrowPathIcon className="w-5 h-5 animate-spin" />
                              Procesando...
                            </span>
                          )}
                          {area.procesada && !area.error && (
                            <span className="flex items-center gap-2 text-green-700 font-semibold">
                              <CheckIcon className="w-5 h-5" />
                              Actualizado
                            </span>
                          )}
                          {area.error && (
                            <span className="flex items-center gap-2 text-red-700 text-sm">
                              <XMarkIcon className="w-5 h-5" />
                              {area.error}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Mostrar servicios detectados */}
                      {area.procesada && !area.error && area.serviciosNuevos && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-600 mb-2">Servicios detectados:</div>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(area.serviciosNuevos)
                              .filter(([_, value]) => value === true)
                              .map(([key]) => (
                                <span key={key} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded font-medium">
                                  {key}
                                </span>
                              ))}
                            {Object.values(area.serviciosNuevos).every((v: any) => v === false) && (
                              <span className="text-xs text-gray-500 italic">
                                No se detectaron servicios con evidencia suficiente
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer con Estadísticas Mejoradas */}
              <div className="bg-gray-100 px-6 py-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {areas.filter((a: any) => a.procesada && !a.error).length}
                    </div>
                    <div className="text-xs text-gray-600">Exitosas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {areas.filter((a: any) => a.error).length}
                    </div>
                    <div className="text-xs text-gray-600">Errores</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {progreso.actual} / {progreso.total}
                    </div>
                    <div className="text-xs text-gray-600">Progreso</div>
                  </div>
                </div>
                
                {/* Métricas adicionales en tiempo real */}
                {metricas.totalProcesadas > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="text-xs font-semibold text-blue-900 mb-2">📊 Métricas en Tiempo Real</div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-blue-700 font-medium">Tasa de éxito:</span>
                        <div className="text-lg font-bold text-blue-900">
                          {metricas.totalProcesadas > 0 
                            ? ((metricas.exitosas / metricas.totalProcesadas) * 100).toFixed(1) 
                            : '0'}%
                        </div>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Servicios promedio:</span>
                        <div className="text-lg font-bold text-blue-900">
                          {metricas.serviciosPromedio.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Tiempo promedio:</span>
                        <div className="text-lg font-bold text-blue-900">
                          {metricas.tiempoPromedio.toFixed(1)}s
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

