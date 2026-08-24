'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal'
import { useDragToScroll } from '@/hooks/useDragToScroll'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  ArrowPathIcon,
  SparklesIcon,
  PhotoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import {
  WifiIcon,
  BoltIcon,
  HomeIcon,
  FireIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/solid'
import type { Area } from '@/types/database.types'

// Helper para iconos de servicios
const getServicioIcon = (servicio: string) => {
  const iconos: { [key: string]: JSX.Element } = {
    'Agua': <span className="text-blue-500" title="Agua">💧</span>,
    'Electricidad': <BoltIcon className="w-4 h-4 text-yellow-500" title="Electricidad" />,
    'WC': <span className="text-gray-600" title="WC">🚻</span>,
    'Duchas': <span className="text-cyan-500" title="Duchas">🚿</span>,
    'Vaciado Químico': <span className="text-purple-500" title="Vaciado Químico">♻️</span>,
    'Vaciado Aguas Grises': <span className="text-slate-500" title="Vaciado Aguas Grises">🌊</span>,
    'Oferta de Restauración': <span className="text-orange-500" title="Oferta de Restauración">🍽️</span>,
  }
  return iconos[servicio] || null
}

// Helper para formatear tipos de Google
const formatGoogleType = (type: string): string => {
  const translations: { [key: string]: string } = {
    'rv_park': 'RV Park',
    'campground': 'Camping',
    'parking': 'Parking',
    'lodging': 'Alojamiento',
    'establishment': 'Establecimiento',
    'point_of_interest': 'Punto de Interés',
    'gas_station': 'Gasolinera',
    'restaurant': 'Restaurante',
    'store': 'Tienda',
    'car_repair': 'Taller',
    'car_dealer': 'Concesionario',
    'storage': 'Almacenamiento',
    'moving_company': 'Mudanzas',
  }
  return translations[type] || type.replace(/_/g, ' ')
}

// Helper para obtener el tipo principal de Google
const getPrimaryGoogleType = (types: string[] | null): string => {
  if (!types || types.length === 0) return 'N/A'
  
  // Priorizar tipos relevantes
  const priority = ['rv_park', 'campground', 'parking', 'lodging', 'gas_station']
  const primaryType = types.find((t: any) => priority.includes(t)) || types[0]
  
  return formatGoogleType(primaryType)
}

export default function AdminAreasPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroVerificado, setFiltroVerificado] = useState<'all' | 'verified' | 'unverified'>('all')
  const [filtroActivo, setFiltroActivo] = useState<'all' | 'active' | 'inactive'>('all')
  const [filtroPais, setFiltroPais] = useState<string>('all')
  const [filtroTipo, setFiltroTipo] = useState<string>('all')
  const [paginaActual, setPaginaActual] = useState(1)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'success' | 'error'
    title: string
    message: string
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  })
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    areaId: string
    areaNombre: string
  }>({
    isOpen: false,
    areaId: '',
    areaNombre: ''
  })
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)
  const [itemsPorPagina, setItemsPorPagina] = useState(10)
  const router = useRouter()
  
  // Hook para drag-to-scroll en tabla
  const { handlers, containerStyle } = useDragToScroll()

  useEffect(() => {
    checkAdminAndLoadAreas()
  }, [])

  const checkAdminAndLoadAreas = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user || !session.user.user_metadata?.is_admin) {
      router.push('/mapa')
      return
    }

    loadAreas()
  }

  const loadAreas = async () => {
    try {
      console.log('📥 Cargando áreas desde Supabase...')
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
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) {
          console.error('❌ Error de Supabase al cargar áreas:', error)
          throw error
        }

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
      setAreas(allAreas)
    } catch (error) {
      console.error('❌ Error cargando áreas:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleVerificado = async (id: string, currentValue: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('areas')
        .update({ verificado: !currentValue })
        .eq('id', id)

      if (error) throw error
      loadAreas()
    } catch (error) {
      console.error('Error actualizando área:', error)
    }
  }

  const toggleActivo = async (id: string, currentValue: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('areas')
        .update({ activo: !currentValue })
        .eq('id', id)

      if (error) throw error
      loadAreas()
    } catch (error) {
      console.error('Error actualizando área:', error)
    }
  }

  const handleDelete = (id: string, nombre: string) => {
    setDeleteModal({
      isOpen: true,
      areaId: id,
      areaNombre: nombre
    })
  }

  const confirmDelete = async () => {
    const { areaId, areaNombre } = deleteModal

    try {
      const supabase = createClient()

      console.log('🗑️ Intentando eliminar área:', {
        id: areaId,
        nombre: areaNombre
      })

      // Eliminar registros relacionados primero (pueden no existir, ignorar errores)
      console.log('  📝 Eliminando valoraciones...')
      const { error: errorVal } = await (supabase as any).from('valoraciones').delete().eq('area_id', areaId)
      if (errorVal) console.log('  ⚠️ Error eliminando valoraciones (puede ser que no existan):', errorVal.message)

      console.log('  ⭐ Eliminando favoritos...')
      const { error: errorFav } = await (supabase as any).from('favoritos').delete().eq('area_id', areaId)
      if (errorFav) console.log('  ⚠️ Error eliminando favoritos (puede ser que no existan):', errorFav.message)

      console.log('  👀 Eliminando visitas...')
      const { error: errorVis } = await (supabase as any).from('visitas').delete().eq('area_id', areaId)
      if (errorVis) console.log('  ⚠️ Error eliminando visitas (puede ser que no existan):', errorVis.message)

      // Eliminar el área
      console.log('  🗑️ Eliminando área principal...')
      const { data: deletedData, error } = await (supabase as any)
        .from('areas')
        .delete()
        .eq('id', areaId)
        .select()

      if (error) {
        console.error('❌ Error de Supabase eliminando área:', error)
        console.error('   Código:', error.code)
        console.error('   Mensaje:', error.message)
        console.error('   Detalles:', error.details)
        console.error('   Hint:', error.hint)
        throw error
      }

      console.log('✅ Área eliminada correctamente de Supabase')
      console.log('   Datos eliminados:', deletedData)

      // Verificar que realmente se eliminó algo
      if (!deletedData || deletedData.length === 0) {
        console.warn('⚠️ No se devolvieron datos de la eliminación')
      }

      // Cerrar modal de eliminación
      setDeleteModal({ isOpen: false, areaId: '', areaNombre: '' })

      // Mostrar mensaje de éxito
      setModalState({
        isOpen: true,
        type: 'success',
        title: '✅ Área Eliminada',
        message: `El área "${areaNombre}" ha sido eliminada correctamente.`,
      })

      // Recargar la lista completa desde Supabase inmediatamente
      console.log('🔄 Recargando lista completa desde Supabase...')
      await loadAreas()
    } catch (error: any) {
      console.error('❌ Error eliminando área:', error)

      // Cerrar modal de eliminación
      setDeleteModal({ isOpen: false, areaId: '', areaNombre: '' })

      // Mostrar mensaje de error
      setModalState({
        isOpen: true,
        type: 'error',
        title: '❌ Error',
        message: `No se pudo eliminar el área: ${error.message || 'Error desconocido'}\n\n¿Tienes permisos de administrador?`,
      })
    }
  }

  // ============================================================================
  // FUNCIONES DE SELECCIÓN MÚLTIPLE
  // ============================================================================

  const toggleSelectArea = (areaId: string) => {
    const newSelected = new Set(selectedAreas)
    if (newSelected.has(areaId)) {
      newSelected.delete(areaId)
    } else {
      newSelected.add(areaId)
    }
    setSelectedAreas(newSelected)
    setSelectAll(newSelected.size === areasEnPagina.length)
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedAreas(new Set())
      setSelectAll(false)
    } else {
      const allIds = new Set(areasEnPagina.map((a: any) => a.id))
      setSelectedAreas(allIds)
      setSelectAll(true)
    }
  }

  const selectAllFiltered = () => {
    const allIds = new Set(areasFiltradas.map((a: any) => a.id))
    setSelectedAreas(allIds)
    setSelectAll(true)
  }

  const deselectAll = () => {
    setSelectedAreas(new Set())
    setSelectAll(false)
  }

  // ============================================================================
  // ACCIONES MASIVAS
  // ============================================================================

  const bulkDelete = async () => {
    if (selectedAreas.size === 0) return

    try {
      const supabase = createClient()
      const areasToDelete = Array.from(selectedAreas)

      console.log(`🗑️ Eliminando ${areasToDelete.length} áreas...`)

      let deleted = 0
      let errors = 0

      for (const areaId of areasToDelete) {
        try {
          // Eliminar registros relacionados
          await (supabase as any).from('valoraciones').delete().eq('area_id', areaId)
          await (supabase as any).from('favoritos').delete().eq('area_id', areaId)
          await (supabase as any).from('visitas').delete().eq('area_id', areaId)

          // Eliminar área
          const { error } = await (supabase as any)
            .from('areas')
            .delete()
            .eq('id', areaId)

          if (error) throw error
          deleted++
        } catch (error) {
          console.error(`Error eliminando área ${areaId}:`, error)
          errors++
        }
      }

      setBulkDeleteModal(false)
      setSelectedAreas(new Set())
      setSelectAll(false)

      setModalState({
        isOpen: true,
        type: errors > 0 ? 'error' : 'success',
        title: errors > 0 ? '⚠️ Eliminación Parcial' : '✅ Áreas Eliminadas',
        message: `Se eliminaron ${deleted} área(s) correctamente.${errors > 0 ? ` ${errors} área(s) no pudieron ser eliminadas.` : ''}`,
      })

      await loadAreas()
    } catch (error: any) {
      console.error('Error en eliminación masiva:', error)
      setBulkDeleteModal(false)
      setModalState({
        isOpen: true,
        type: 'error',
        title: '❌ Error',
        message: `Error en eliminación masiva: ${error.message}`,
      })
    }
  }

  const bulkToggleActive = async (newState: boolean) => {
    if (selectedAreas.size === 0) return

    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('areas')
        .update({ activo: newState })
        .in('id', Array.from(selectedAreas))

      if (error) throw error

      setModalState({
        isOpen: true,
        type: 'success',
        title: '✅ Actualización Exitosa',
        message: `${selectedAreas.size} área(s) ${newState ? 'activada(s)' : 'desactivada(s)'} correctamente.`,
      })

      setSelectedAreas(new Set())
      setSelectAll(false)
      await loadAreas()
    } catch (error: any) {
      setModalState({
        isOpen: true,
        type: 'error',
        title: '❌ Error',
        message: `Error actualizando áreas: ${error.message}`,
      })
    }
  }

  const bulkToggleVerified = async (newState: boolean) => {
    if (selectedAreas.size === 0) return

    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('areas')
        .update({ verificado: newState })
        .in('id', Array.from(selectedAreas))

      if (error) throw error

      setModalState({
        isOpen: true,
        type: 'success',
        title: '✅ Actualización Exitosa',
        message: `${selectedAreas.size} área(s) ${newState ? 'verificada(s)' : 'marcada(s) como sin verificar'} correctamente.`,
      })

      setSelectedAreas(new Set())
      setSelectAll(false)
      await loadAreas()
    } catch (error: any) {
      setModalState({
        isOpen: true,
        type: 'error',
        title: '❌ Error',
        message: `Error actualizando áreas: ${error.message}`,
      })
    }
  }

  // Obtener lista única de países y tipos
  const paisesUnicos = Array.from(new Set(areas.map((a: any) => a.pais).filter(Boolean))).sort()
  const tiposUnicos = Array.from(new Set(areas.map((a: any) => a.tipo_area).filter(Boolean))).sort()

  // Filtrar y ordenar
  let areasFiltradas = areas.filter((area: any) => {
    const matchBusqueda = area.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                         area.ciudad?.toLowerCase().includes(busqueda.toLowerCase()) ||
                         area.provincia?.toLowerCase().includes(busqueda.toLowerCase()) ||
                         area.pais?.toLowerCase().includes(busqueda.toLowerCase())

    const matchVerificado = filtroVerificado === 'all' ||
                           (filtroVerificado === 'verified' && area.verificado) ||
                           (filtroVerificado === 'unverified' && !area.verificado)

    const matchActivo = filtroActivo === 'all' ||
                       (filtroActivo === 'active' && area.activo) ||
                       (filtroActivo === 'inactive' && !area.activo)

    const matchPais = filtroPais === 'all' || area.pais === filtroPais

    const matchTipo = filtroTipo === 'all' || area.tipo_area === filtroTipo

    return matchBusqueda && matchVerificado && matchActivo && matchPais && matchTipo
  })

  // Aplicar ordenación si hay columna seleccionada
  if (sortColumn) {
    areasFiltradas = [...areasFiltradas].sort((a: any, b: any) => {
      let aValue: any = a[sortColumn as keyof Area]
      let bValue: any = b[sortColumn as keyof Area]

      // Manejo especial para google_types (array)
      if (sortColumn === 'google_types') {
        aValue = getPrimaryGoogleType(aValue as string[] | null)
        bValue = getPrimaryGoogleType(bValue as string[] | null)
      }

      if (aValue == null) return 1
      if (bValue == null) return -1

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  // Función para manejar ordenación
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setPaginaActual(1)
  }

  // Paginación
  const totalPaginas = Math.ceil(areasFiltradas.length / itemsPorPagina)
  const indiceInicio = (paginaActual - 1) * itemsPorPagina
  const indiceFin = indiceInicio + itemsPorPagina
  const areasEnPagina = areasFiltradas.slice(indiceInicio, indiceFin)

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1)
    setSelectedAreas(new Set())
    setSelectAll(false)
  }, [busqueda, filtroVerificado, filtroActivo, filtroPais, filtroTipo])

  // Función para exportar a CSV
  const exportToCSV = () => {
    const headers = ['Nombre', 'Ciudad', 'Provincia', 'País', 'Tipo', 'Precio', 'Verificado', 'Activo', 'Servicios']
    const rows = areasFiltradas.map((area: any) => {
      const servicios = area.servicios && typeof area.servicios === 'object'
        ? Object.entries(area.servicios)
            .filter(([_, value]) => value === true)
            .map(([key]) => key)
            .join('; ')
        : ''

      return [
        area.nombre,
        area.ciudad || '',
        area.provincia || '',
        area.pais || '',
        area.tipo_area || '',
        area.precio_noche !== null ? (area.precio_noche === 0 ? 'Gratis' : `${area.precio_noche}€`) : 'N/A',
        area.verificado ? 'Sí' : 'No',
        area.activo ? 'Sí' : 'No',
        servicios
      ]
    })

    const csvContent = [
      headers.map((h: any) => `"${h}"`).join(','),
      ...rows.map((row: any) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `areas_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Función para exportar a Excel (formato XLSX real)
  const exportToExcel = () => {
    const headers = ['Nombre', 'Ciudad', 'Provincia', 'País', 'Tipo', 'Precio', 'Verificado', 'Activo', 'Servicios']
    const rows = areasFiltradas.map((area: any) => {
      const servicios = area.servicios && typeof area.servicios === 'object'
        ? Object.entries(area.servicios)
            .filter(([_, value]) => value === true)
            .map(([key]) => key)
            .join('; ')
        : ''

      return [
        area.nombre,
        area.ciudad || '',
        area.provincia || '',
        area.pais || '',
        area.tipo_area || '',
        area.precio_noche !== null ? (area.precio_noche === 0 ? 'Gratis' : `${area.precio_noche}€`) : 'N/A',
        area.verificado ? 'Sí' : 'No',
        area.activo ? 'Sí' : 'No',
        servicios
      ]
    })

    // Combinar cabecera y filas
    const data = [headers, ...rows]

    // Crear libro de trabajo y hoja
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Áreas')

    // Ajustar ancho de columnas automáticamente
    const colWidths = headers.map((_: any, colIndex: any) => {
      const maxLength = Math.max(
        headers[colIndex].length,
        ...rows.map((row: any) => String(row[colIndex] ?? '').length)
      )
      return { wch: Math.min(maxLength + 2, 50) } // Máximo 50 caracteres de ancho
    })
    worksheet['!cols'] = colWidths

    // Generar archivo y descargar
    XLSX.writeFile(workbook, `areas_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="spinner mb-4"></div>
            <p className="text-gray-600">Cargando áreas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="px-4 sm:px-6 py-5">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver al Panel
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Áreas</h1>
              <p className="mt-1 text-sm text-gray-500">
                {areasFiltradas.length} de {areas.length} áreas
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/admin/areas/busqueda-masiva"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                Búsqueda Masiva
              </Link>
              <Link
                href="/admin/areas/actualizar-servicios"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Actualizar Servicios
              </Link>
              <Link
                href="/admin/areas/enriquecer-textos"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                <SparklesIcon className="w-5 h-5" />
                Enriquecer Textos
              </Link>
              <Link
                href="/admin/areas/enriquecer-imagenes"
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-semibold"
              >
                <PhotoIcon className="w-5 h-5" />
                Enriquecer Imágenes
              </Link>
              <Link
                href="/admin/areas/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-semibold"
              >
                <PlusIcon className="w-5 h-5" />
                Nueva Área
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, ciudad, provincia o país..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro País */}
            <div>
              <select
                value={filtroPais}
                onChange={(e) => setFiltroPais(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="all">Todos los países</option>
                {paisesUnicos.map((pais: any) => (
                  <option key={pais} value={pais}>{pais}</option>
                ))}
              </select>
            </div>

            {/* Filtro Tipo */}
            <div>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="all">Todos los tipos</option>
                {tiposUnicos.map((tipo: any) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            {/* Filtro Verificado */}
            <div>
              <select
                value={filtroVerificado}
                onChange={(e) => setFiltroVerificado(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="all">Todas las áreas</option>
                <option value="verified">Solo verificadas</option>
                <option value="unverified">Sin verificar</option>
              </select>
            </div>

            {/* Filtro Activo */}
            <div>
              <select
                value={filtroActivo}
                onChange={(e) => setFiltroActivo(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="all">Activas e inactivas</option>
                <option value="active">Solo activas</option>
                <option value="inactive">Solo inactivas</option>
              </select>
            </div>
          </div>

          {/* Botones de exportación */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              title="Exportar a CSV"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Exportar CSV
            </button>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              title="Exportar a Excel"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Exportar Excel
            </button>
            <div className="flex-1" />
            <span className="text-sm text-gray-600 self-center">
              Exportando {areasFiltradas.length} área(s)
            </span>
          </div>
        </div>

        {/* Barra de acciones masivas */}
        {selectedAreas.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-900">
                  {selectedAreas.size} área(s) seleccionada(s)
                </span>
                <button
                  onClick={selectAllFiltered}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Seleccionar todas ({areasFiltradas.length})
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Deseleccionar todas
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => bulkToggleActive(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Activar
                </button>
                <button
                  onClick={() => bulkToggleActive(false)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Desactivar
                </button>
                <button
                  onClick={() => bulkToggleVerified(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Verificar
                </button>
                <button
                  onClick={() => bulkToggleVerified(false)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Sin Verificar
                </button>
                <button
                  onClick={() => setBulkDeleteModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                >
                  <TrashIcon className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabla mejorada de áreas */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto" style={containerStyle} {...handlers}>
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2.5 py-2.5 text-left w-[3%]">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 cursor-pointer"
                    />
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%] cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('nombre')}
                  >
                    <div className="flex items-center gap-2">
                      Área
                      {sortColumn === 'nombre' && (
                        sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%] cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('ciudad')}
                  >
                    <div className="flex items-center gap-2">
                      Ubicación
                      {sortColumn === 'ciudad' && (
                        sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%] cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('pais')}
                  >
                    <div className="flex items-center gap-2">
                      País
                      {sortColumn === 'pais' && (
                        sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%] cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('tipo_area')}
                  >
                    <div className="flex items-center gap-2">
                      Categoría
                      {sortColumn === 'tipo_area' && (
                        sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('google_types')}
                  >
                    <div className="flex items-center gap-2">
                      Tipo Google
                      {sortColumn === 'google_types' && (
                        sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2.5 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[7%] cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('precio_noche')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Precio
                      {sortColumn === 'precio_noche' && (
                        sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                    Servicios
                  </th>
                  <th className="px-2.5 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[11%]">
                    Estado
                  </th>
                  <th className="px-2.5 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[11%]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {areasEnPagina.map((area: any) => {
                  const serviciosActivos = area.servicios && typeof area.servicios === 'object'
                    ? Object.entries(area.servicios)
                        .filter(([_, value]) => value === true)
                        .map(([key]) => key)
                        .filter((s: any) => ['Agua', 'Electricidad', 'WC', 'Duchas', 'Vaciado Químico', 'Vaciado Aguas Grises', 'Oferta de Restauración'].includes(s))
                    : []

                  return (
                    <tr key={area.id} className={`hover:bg-gray-50 ${selectedAreas.has(area.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-2.5 py-2 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={selectedAreas.has(area.id)}
                          onChange={() => toggleSelectArea(area.id)}
                          className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-2.5 py-2 overflow-hidden">
                        <div className="flex items-center gap-3">
                          {area.foto_principal && (
                            <img
                              src={area.foto_principal}
                              alt={area.nombre}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">{area.nombre}</div>
                            <div className="text-xs text-gray-500 truncate">{area.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2.5 py-2 overflow-hidden">
                        <div className="text-sm text-gray-900">{area.ciudad}</div>
                        <div className="text-xs text-gray-500">{area.provincia}</div>
                      </td>
                      <td className="px-2.5 py-2 overflow-hidden">
                        <div className="text-sm font-medium text-gray-900">{area.pais || 'N/A'}</div>
                      </td>
                      <td className="px-2.5 py-2 overflow-hidden">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-800">
                          {area.tipo_area}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 overflow-hidden">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-gray-900" title={area.google_types?.join(', ') || 'Sin tipos'}>
                            {getPrimaryGoogleType(area.google_types)}
                          </span>
                          {area.google_types && area.google_types.length > 1 && (
                            <span className="text-xs text-gray-500">
                              +{area.google_types.length - 1} más
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2.5 py-2 overflow-hidden text-sm text-gray-900 text-center">
                        {area.precio_noche !== null && area.precio_noche !== undefined
                          ? area.precio_noche === 0
                            ? <span className="text-green-600 font-semibold">Gratis</span>
                            : <span className="font-semibold">{area.precio_noche}€</span>
                          : 'N/A'}
                      </td>
                      <td className="px-2.5 py-2 overflow-hidden">
                        <div className="flex flex-wrap gap-1">
                          {serviciosActivos.length > 0 ? (
                            serviciosActivos.map((servicio: any, idx: any) => (
                              <div key={idx} className="inline-flex items-center">
                                {getServicioIcon(servicio)}
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">Sin servicios</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2.5 py-2 overflow-hidden">
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            onClick={() => toggleVerificado(area.id, area.verificado || false)}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full w-28 justify-center ${
                              area.verificado
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }`}
                          >
                            {area.verificado ? (
                              <>
                                <CheckCircleIcon className="w-3 h-3" />
                                Verificada
                              </>
                            ) : (
                              <>
                                <XCircleIcon className="w-3 h-3" />
                                Sin verificar
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => toggleActivo(area.id, area.activo || false)}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full w-28 justify-center ${
                              area.activo
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {area.activo ? 'Activa' : 'Inactiva'}
                          </button>
                        </div>
                      </td>
                      <td className="px-2.5 py-2 overflow-hidden">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/area/${area.slug}`}
                            target="_blank"
                            className="text-sky-600 hover:text-sky-900 p-1"
                            title="Ver en el mapa"
                          >
                            <MapPinIcon className="w-5 h-5" />
                          </Link>
                          <Link
                            href={`/admin/areas/edit/${area.id}`}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Editar área"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(area.id, area.nombre)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Eliminar área"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {areasFiltradas.length === 0 && (
            <div className="text-center py-12">
              <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay áreas</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron áreas con los filtros aplicados.
              </p>
            </div>
          )}

          {/* Paginación */}
          {areasFiltradas.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Mostrar</span>
                <select
                  value={itemsPorPagina}
                  onChange={(e) => {
                    setItemsPorPagina(Number(e.target.value))
                    setPaginaActual(1)
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">
                  por página
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Página {paginaActual} de {totalPaginas} ({areasFiltradas.length} resultados)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="p-1 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="p-1 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Eliminación con Confirmación de Texto */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, areaId: '', areaNombre: '' })}
        onConfirm={confirmDelete}
        title="⚠️ Confirmar Eliminación"
        itemName={deleteModal.areaNombre}
        warningText="Esta acción NO se puede deshacer y eliminará el área, todas las valoraciones asociadas, todos los favoritos de usuarios y todas las visitas registradas."
      />

      {/* Modal de Eliminación Masiva */}
      <ConfirmModal
        isOpen={bulkDeleteModal}
        onClose={() => setBulkDeleteModal(false)}
        onConfirm={bulkDelete}
        title="⚠️ Eliminar Múltiples Áreas"
        message={`¿Estás seguro de que deseas eliminar ${selectedAreas.size} área(s)?\n\nEsta acción NO se puede deshacer y eliminará:\n- Las áreas seleccionadas\n- Todas sus valoraciones\n- Todos los favoritos asociados\n- Todas las visitas registradas`}
        type="error"
        confirmText={`Sí, eliminar ${selectedAreas.size} área(s)`}
        showCancel={true}
      />

      {/* Modal de Mensajes (Éxito/Error) */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText="Entendido"
        showCancel={false}
      />
    </div>
  )
}
