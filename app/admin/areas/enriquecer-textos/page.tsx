'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'
import { AdminTable, AdminTableColumn } from '@/components/admin/AdminTable'
import { SparklesIcon, MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import type { Area } from '@/types/database.types'

export default function EnriquecerTextosPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [areas, setAreas] = useState<Area[]>([])
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPais, setSelectedPais] = useState('Todos')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [soloSinTexto, setSoloSinTexto] = useState(true)
  const [processLog, setProcessLog] = useState<string[]>([])
  const [configStatus, setConfigStatus] = useState<{
    ready: boolean
    checks: any
  } | null>(null)

  // Extraer países únicos de las áreas cargadas
  const PAISES = ['Todos', ...Array.from(new Set(areas.map((a: any) => a.pais).filter(Boolean))).sort()]

  useEffect(() => {
    loadAreas()
    checkConfiguration()
  }, [])

  useEffect(() => {
    filterAreas()
  }, [areas, searchTerm, selectedPais, soloSinTexto])

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/check-config')
      const checks = await response.json()
      
      setConfigStatus({
        ready: checks.openaiKeyValid && checks.serpApiKeyValid,
        checks
      })
    } catch (error) {
      console.error('Error verificando configuración:', error)
    }
  }

  const loadAreas = async () => {
    try {
      setLoading(true)
      
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
      console.log('🌍 Países únicos encontrados:', [...new Set(allAreas.map((a: any) => a.pais).filter(Boolean))])
      console.log('📝 Áreas sin descripción:', allAreas.filter((a: any) => !a.descripcion || a.descripcion.trim().length < 50).length)
      setAreas(allAreas)
    } catch (error) {
      console.error('Error cargando áreas:', error)
      alert('Error al cargar las áreas')
    } finally {
      setLoading(false)
    }
  }

  const filterAreas = () => {
    let filtered = [...areas]
    
    console.log('🔍 Iniciando filtrado...')
    console.log('  📊 Total áreas:', areas.length)
    console.log('  🔎 Búsqueda:', searchTerm)
    console.log('  🌍 País:', selectedPais)
    console.log('  📝 Solo sin texto:', soloSinTexto)

    // Filtrar por búsqueda mejorada: buscar en nombre, ciudad, dirección, provincia y país
    if (searchTerm) {
      filtered = filtered.filter((area: any) =>
        area.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.ciudad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.provincia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.pais?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      console.log('  ✅ Después de búsqueda:', filtered.length)
    }

    // Filtrar por país
    if (selectedPais !== 'Todos') {
      const beforePais = filtered.length
      filtered = filtered.filter((area: any) => area.pais === selectedPais)
      console.log(`  ✅ Después de país (${selectedPais}):`, filtered.length, 'de', beforePais)
      if (filtered.length === 0 && beforePais > 0) {
        console.log('  ⚠️ Países únicos en las áreas filtradas:', [...new Set(areas.map((a: any) => a.pais))])
      }
    }

    // Filtrar solo sin texto (sin descripción = NULL, vacío, placeholder o < 200 caracteres)
    // Las descripciones de IA deben ser textos largos, no snippets cortos
    const PLACEHOLDER_TEXT = 'Área encontrada mediante búsqueda en Google Maps. Requiere verificación y enriquecimiento.'
    
    if (soloSinTexto) {
      const beforeSinTexto = filtered.length
      filtered = filtered.filter((area: any) => {
        if (!area.descripcion) return true // Sin descripción
        const desc = area.descripcion.trim()
        
        // Detectar texto placeholder por defecto
        if (desc === PLACEHOLDER_TEXT) return true
        if (desc.includes('Requiere verificación y enriquecimiento')) return true
        
        const length = desc.length
        return length < 200 // Menos de 200 caracteres = descripción corta/incompleta
      })
      console.log('  ✅ Después de sin texto (<200 chars o placeholder):', filtered.length, 'de', beforeSinTexto)
    }

    setFilteredAreas(filtered)
  }

  // Definir columnas para la tabla
  const columns: AdminTableColumn<Area>[] = [
    {
      key: 'seleccion',
      title: '',
      sortable: false,
      searchable: false,
      render: (area) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(area.id)}
          onChange={() => toggleSelection(area.id)}
          disabled={processing}
          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
        />
      ),
      exportValue: () => ''
    },
    {
      key: 'nombre',
      title: 'Área',
      sortable: true,
      render: (area) => (
        <div className="text-sm font-medium text-gray-900">{area.nombre}</div>
      )
    },
    {
      key: 'ciudad',
      title: 'Ubicación',
      sortable: true,
      render: (area) => (
        <div className="text-sm text-gray-600">
          {area.ciudad}, {area.provincia} • {area.pais}
        </div>
      ),
      exportValue: (area) => `${area.ciudad}, ${area.provincia} • ${area.pais}`
    },
    {
      key: 'descripcion',
      title: 'Estado',
      sortable: true,
      render: (area) => {
        const desc = area.descripcion?.trim() || ''
        const isPlaceholder = desc.includes('Requiere verificación y enriquecimiento')
        const length = desc.length
        
        if (isPlaceholder) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              ✗ Placeholder Google Maps
            </span>
          )
        }
        
        if (length >= 200) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Con descripción ({length} chars)
            </span>
          )
        }
        
        if (length > 0) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              ⚠ Descripción corta ({length} chars)
            </span>
          )
        }
        
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            ✗ Sin descripción
          </span>
        )
      },
      exportValue: (area) => {
        const desc = area.descripcion?.trim() || ''
        const length = desc.length
        if (length >= 200) return 'Con descripción'
        if (length > 0) return 'Descripción corta'
        return 'Sin descripción'
      }
    }
  ]

  const handleSelectAll = () => {
    const idsVisibles = filteredAreas.map((a: any) => a.id)
    setSelectedIds(idsVisibles)
  }

  const handleDeselectAll = () => {
    setSelectedIds([])
  }

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid: any) => sid !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const enrichArea = async (areaId: string, forceProcess: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🚀 [ENRICH] Iniciando enriquecimiento de área:', areaId)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // Obtener datos frescos de Supabase
      const { data: area, error: areaError } = await (supabase as any)
        .from('areas')
        .select('*')
        .eq('id', areaId)
        .single()

      if (areaError || !area) {
        console.error('❌ [ENRICH] Error: Área no encontrada', areaError)
        return { success: false, error: 'Área no encontrada en la base de datos' }
      }

      console.log('✅ [ENRICH] Área encontrada:', area.nombre, '-', area.ciudad)
      console.log('  📍 ID:', area.id)
      
      // Si viene del filtro "Solo sin descripción", procesamos directamente
      if (forceProcess) {
        console.log('  ⚡ Modo forzado: Se procesará sin verificar (viene del filtro)')
      } else {
        console.log('  📝 Descripción actual:', area.descripcion ? `"${area.descripcion.trim()}" (${area.descripcion.trim().length} caracteres)` : 'NULL o vacío')
        
        // Solo verificamos si NO viene del filtro (sin descripción = < 200 caracteres)
        const PLACEHOLDER_TEXT = 'Área encontrada mediante búsqueda en Google Maps. Requiere verificación y enriquecimiento.'
        const desc = area.descripcion?.trim() || ''
        const isPlaceholder = desc.includes('Requiere verificación y enriquecimiento')
        
        // Si ya tiene descripción válida (≥200 caracteres y no es placeholder), no sobreescribir
        if (area.descripcion && !isPlaceholder && desc.length >= 200) {
          console.log('⚠️ [ENRICH] El área ya tiene descripción válida (≥200 caracteres). No se sobrescribe.')
          return { success: false, error: 'Ya tiene descripción válida (≥200 caracteres)' }
        }
      }

      // 1. Buscar información con SerpAPI (a través del proxy del servidor)
      const query = `"${area.ciudad}" ${area.provincia} turismo autocaravanas qué ver`

      console.log('🔎 [ENRICH] Llamando a SerpAPI (vía proxy)...')
      const serpResponse = await fetch('/api/admin/serpapi-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, engine: 'google' })
      })

      if (!serpResponse.ok) {
        const errorData = await serpResponse.json().catch(() => ({}))
        console.error('❌ [ENRICH] Error del proxy de SerpAPI:', serpResponse.status, errorData)
        return { success: false, error: `Error de SerpAPI (${serpResponse.status}): ${errorData.error || errorData.details || 'Error desconocido'}` }
      }

      const serpResult = await serpResponse.json()
      
      if (!serpResult.success) {
        console.error('❌ [ENRICH] Error de SerpAPI:', serpResult.error, serpResult.details)
        const errorMsg = serpResult.details || serpResult.error || 'Error desconocido'
        // Detectar error de créditos excedidos
        if (errorMsg.includes('credit') || errorMsg.includes('limit') || errorMsg.includes('exceeded')) {
          return { success: false, error: '⚠️ CRÉDITOS DE SERPAPI EXCEDIDOS - Recarga tu cuenta en serpapi.com' }
        }
        return { success: false, error: `Error de SerpAPI: ${errorMsg}` }
      }

      const serpData = serpResult.data
      console.log('✅ [ENRICH] SerpAPI respondió correctamente (vía proxy)')

      // Filtrar resultados por ciudad
      if (serpData.organic_results && serpData.organic_results.length > 0) {
        const ciudadLower = (area.ciudad || '').toLowerCase()
        if (ciudadLower) {
          serpData.organic_results = serpData.organic_results.filter((result: any) => {
            const snippet = (result.snippet || '').toLowerCase()
            const title = (result.title || '').toLowerCase()
            return snippet.includes(ciudadLower) || title.includes(ciudadLower)
          })
        }
      }

      // 2. Construir contexto para OpenAI
      let contexto = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ ÁREA ESPECÍFICA QUE DEBES DESCRIBIR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre del área: ${area.nombre}
Ciudad: ${area.ciudad}
Provincia: ${area.provincia}
País: ${area.pais}
Tipo: ${area.tipo_area}
`
      
      if (area.precio_por_noche) {
        contexto += `Precio: ${area.precio_por_noche}€/noche\n`
      } else {
        contexto += `Precio: Gratis o desconocido\n`
      }

      if (area.plazas_disponibles) {
        contexto += `Plazas disponibles: ${area.plazas_disponibles}\n`
      }

      if (area.servicios && typeof area.servicios === 'object') {
        const serviciosDisponibles = Object.entries(area.servicios)
          .filter(([_, value]) => value === true)
          .map(([key]) => key)
        
        if (serviciosDisponibles.length > 0) {
          contexto += `\n✅ Servicios confirmados: ${serviciosDisponibles.join(', ')}\n`
        } else {
          contexto += `\n⚠️ No hay servicios confirmados para esta área.\n`
        }
      }

      contexto += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFORMACIÓN TURÍSTICA DE ${(area.ciudad || '').toUpperCase()}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(Esta información es solo sobre ${area.ciudad}, NO sobre otras ciudades)

`

      if (serpData.organic_results) {
        serpData.organic_results.forEach((result: any) => {
          contexto += `${result.title}\n${result.snippet}\n\n`
        })
      }

      if (serpData.answer_box) {
        contexto += `${serpData.answer_box.snippet || serpData.answer_box.answer}\n\n`
      }

      // 3. Obtener configuración del agente desde la BD
      const { data: configData } = await (supabase as any)
        .from('ia_config')
        .select('config_value')
        .eq('config_key', 'enrich_description')
        .single()

      const config = configData?.config_value || {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 1500,
        prompts: [
          {
            id: 'sys-1',
            role: 'system',
            content: 'Eres un redactor experto en guías de viaje para autocaravanas. Escribes textos informativos, naturales y bien estructurados en español.',
            order: 1,
            required: true
          }
        ]
      }

      // Construir mensajes para OpenAI
      const messages = config.prompts
        .sort((a: any, b: any) => a.order - b.order)
        .map((prompt: any) => {
          let content = prompt.content
            .replace(/\{\{contexto\}\}/g, contexto)
            .replace(/\{\{area_nombre\}\}/g, area.nombre)
            .replace(/\{\{area_ciudad\}\}/g, area.ciudad)
            .replace(/\{\{area_provincia\}\}/g, area.provincia)
          
          return {
            role: prompt.role === 'agent' ? 'user' : prompt.role,
            content: content
          }
        })

      // 4. Llamar a OpenAI desde el cliente
      console.log('🤖 [ENRICH] Llamando a OpenAI...')
      const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY_ADMIN
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          temperature: config.temperature,
          max_completion_tokens: config.max_tokens
        })
      })

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}))
        console.error('❌ [ENRICH] Error de OpenAI:', openaiResponse.status, errorData)
        return { success: false, error: `Error de OpenAI (${openaiResponse.status}): ${errorData.error?.message || 'Error desconocido'}` }
      }

      const openaiData = await openaiResponse.json()
      const descripcionGenerada = openaiData.choices[0].message.content || ''

      console.log('📝 [ENRICH] Descripción generada (' + descripcionGenerada.length + ' caracteres)')

      // 5. Guardar en la base de datos
      console.log('💾 [ENRICH] Guardando en base de datos...')
      const { error: updateError } = await (supabase as any)
        .from('areas')
        .update({
          descripcion: descripcionGenerada,
          updated_at: new Date().toISOString()
        })
        .eq('id', areaId)

      if (updateError) {
        console.error('❌ [ENRICH] Error al guardar en BD:', updateError)
        return { success: false, error: `Error al guardar en base de datos: ${updateError.message}` }
      }

      console.log('✅ [ENRICH] ¡Descripción guardada exitosamente!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return { success: true }

    } catch (error: any) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ [ENRICH] Error enriqueciendo área:', error)
      console.error('  Detalles:', error?.message || 'Sin detalles')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return { success: false, error: `Error inesperado: ${error.message}` }
    }
  }

  const handleEnrichSelected = async () => {
    console.log('🔵 Botón presionado - iniciando enriquecimiento')
    console.log('📊 Config status:', configStatus)
    console.log('📝 IDs seleccionados:', selectedIds)
    
    // Validar configuración
    if (!configStatus?.ready) {
      console.error('❌ Configuración no lista')
      alert(
        '❌ No se puede procesar\n\n' +
        'Las API keys no están configuradas correctamente.\n\n' +
        'Revisa el mensaje de advertencia en la parte superior de la página.'
      )
      return
    }

    if (selectedIds.length === 0) {
      console.error('❌ No hay áreas seleccionadas')
      alert('❌ Selecciona al menos un área para enriquecer')
      return
    }
    
    console.log('✅ Validaciones pasadas, iniciando proceso...')

    // Estimación de tiempo y costo
    const estimatedMinutes = Math.ceil((selectedIds.length * 8) / 60)
    const estimatedCost = (selectedIds.length * 0.0006).toFixed(4)

    const userConfirmed = confirm(
      `¿Generar descripciones con IA para ${selectedIds.length} área(s)?\n\n` +
      `⏱️ Tiempo estimado: ${estimatedMinutes} minuto(s)\n` +
      `💰 Costo aproximado: $${estimatedCost} USD\n\n` +
      `El proceso incluye pausas entre peticiones para evitar límites de rate.`
    )
    
    console.log('❓ Usuario confirmó:', userConfirmed)
    
    if (!userConfirmed) {
      console.log('⏹️ Proceso cancelado por el usuario')
      return
    }

    console.log('🚀 Iniciando procesamiento...')
    setProcessing(true)
    setProcessLog(['🚀 Iniciando proceso de enriquecimiento con IA...', ''])

    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (let i = 0; i < selectedIds.length; i++) {
      const areaId = selectedIds[i]
      const area = areas.find((a: any) => a.id === areaId)
      
      if (!area) continue

      setProcessLog(prev => [...prev, `[${i + 1}/${selectedIds.length}] Procesando: ${area.nombre}...`])

      // Siempre forzar procesamiento (el usuario ya seleccionó las áreas que quiere procesar)
      const forceProcess = true
      const result = await enrichArea(areaId, forceProcess)

      if (result.success) {
        successCount++
        setProcessLog(prev => [...prev, `✓ ${area.nombre} - Descripción generada`])
      } else {
        failCount++
        const errorMsg = result.error || 'Error desconocido'
        setProcessLog(prev => [...prev, `✗ ${area.nombre} - ${errorMsg}`])
        
        // Si es error de créditos, detener el proceso
        if (errorMsg.includes('CRÉDITOS') || errorMsg.includes('EXCEDIDOS')) {
          setProcessLog(prev => [...prev, '', '🛑 PROCESO DETENIDO: Créditos de SerpAPI agotados', 'Recarga tu cuenta en https://serpapi.com/'])
          errors.push(errorMsg)
          break
        }
        
        if (!errors.includes(errorMsg)) {
          errors.push(errorMsg)
        }
      }

      // Pequeña pausa entre requests para no saturar
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setProcessLog(prev => [
      ...prev,
      '',
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `✓ Completado: ${successCount} éxitos, ${failCount} fallos`,
      ...(errors.length > 0 ? ['', '⚠️ Errores encontrados:', ...errors.map((e: any) => `  • ${e}`)] : []),
      '',
      'Recargando áreas...'
    ])

    // Recargar áreas
    await loadAreas()
    setSelectedIds([])
    setProcessing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Banner de advertencia de configuración */}
      {configStatus && !configStatus.ready && (
        <div className="bg-red-50 border-b-4 border-red-400">
          <div className="max-w-7xl mx-auto px-4 py-6">
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
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/areas')}
            className="flex items-center gap-2 text-sky-600 hover:text-sky-700 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver a Gestión de Áreas
          </button>
          
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-10 h-10 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enriquecer con IA</h1>
              <p className="text-gray-600 mt-1">
                Usa IA para generar descripciones completas de las áreas sin texto
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar área
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nombre, ciudad, dirección, país..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* País */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                País
              </label>
              <select
                value={selectedPais}
                onChange={(e) => setSelectedPais(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {PAISES.map((pais: any) => (
                  <option key={pais} value={pais}>{pais}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro Solo sin texto */}
          <div className="mb-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={soloSinTexto}
                onChange={(e) => setSoloSinTexto(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Solo áreas sin descripción completa (&lt;200 caracteres)</span>
            </label>
          </div>

          {/* Acciones de selección */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSelectAll}
              disabled={processing}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-50"
            >
              Seleccionar todas ({filteredAreas.length})
            </button>
            <button
              onClick={handleDeselectAll}
              disabled={processing}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-50"
            >
              Deseleccionar todas
            </button>
            <div className="flex-1" />
            <button
              onClick={handleEnrichSelected}
              disabled={processing || selectedIds.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SparklesIcon className="w-5 h-5" />
              Enriquecer {selectedIds.length} área(s)
            </button>
          </div>
        </div>

        {/* Tabla de áreas con AdminTable */}
        <AdminTable
          data={filteredAreas}
          columns={columns}
          loading={loading}
          emptyMessage="No se encontraron áreas"
          searchPlaceholder="Buscar por nombre, ciudad, provincia..."
          exportFilename="areas_sin_descripcion"
        />

        {/* Modal de Procesamiento */}
        {processing && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="animate-spin">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">🤖 Enriqueciendo con IA</h3>
                    <p className="text-purple-100 text-sm">Generando descripciones detalladas...</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round((selectedIds.findIndex((id: any) => areas.find((a: any) => a.id === id && !processLog.find((log: any) => log.includes(a.nombre)))) / selectedIds.length) * 100)}%
                  </div>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="bg-gray-200 h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                  style={{ 
                    width: `${(processLog.filter((l: any) => l.includes('✓') || l.includes('✗')).length / selectedIds.length) * 100}%` 
                  }}
                ></div>
              </div>

              {/* Contenido del Log */}
              <div className="p-6 bg-gray-900 overflow-y-auto max-h-96">
                <div className="font-mono text-sm space-y-2">
                  {processLog.map((line: any, idx: any) => (
                    <div 
                      key={idx}
                      className={`${
                        line.includes('✓') ? 'text-green-400' :
                        line.includes('✗') ? 'text-red-400' :
                        line.includes('Procesando') ? 'text-yellow-400 animate-pulse' :
                        line.includes('Completado') ? 'text-blue-400 font-bold' :
                        'text-gray-400'
                      }`}
                    >
                      {line}
                    </div>
                  ))}
                  {processLog.length === 0 && (
                    <div className="text-gray-500 text-center py-8">
                      <div className="animate-pulse">Iniciando proceso...</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer con Estadísticas */}
              <div className="bg-gray-100 px-6 py-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {processLog.filter((l: any) => l.includes('✓')).length}
                    </div>
                    <div className="text-xs text-gray-600">Exitosas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {processLog.filter((l: any) => l.includes('✗')).length}
                    </div>
                    <div className="text-xs text-gray-600">Errores</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedIds.length}
                    </div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Log de procesamiento (oculto cuando hay modal) */}
        {processLog.length > 0 && !processing && (
          <div className="mt-6 bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
            {processLog.map((line: any, idx: any) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

