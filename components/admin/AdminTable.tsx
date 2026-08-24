'use client'

import { useState, useMemo } from 'react'
import { useDragToScroll } from '@/hooks/useDragToScroll'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'

export interface AdminTableColumn<T> {
  key: string
  title: string
  sortable?: boolean
  searchable?: boolean
  render?: (item: T) => React.ReactNode
  exportValue?: (item: T) => string | number
  /** Clases de celda (th + td), p. ej. anchos en layout fixed */
  className?: string
  headerClassName?: string
  /** false = el texto puede partir; por defecto no envuelve */
  nowrap?: boolean
}

interface AdminTableProps<T> {
  data: T[]
  columns: AdminTableColumn<T>[]
  loading?: boolean
  emptyMessage?: string
  searchPlaceholder?: string
  exportFilename?: string
  className?: string
  initialSortColumn?: string | null
  initialSortDirection?: 'asc' | 'desc'
  /** fixed (por defecto) reparte el 100% del contenedor y evita el scroll lateral */
  layout?: 'auto' | 'fixed'
  minWidth?: string
  pageSizeOptions?: number[]
  initialPageSize?: number
}

export function AdminTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  searchPlaceholder = 'Buscar en todos los campos...',
  exportFilename = 'datos',
  className = '',
  initialSortColumn,
  initialSortDirection = 'asc',
  layout = 'fixed',
  minWidth,
  pageSizeOptions = [20, 50, 100, 500, -1],
  initialPageSize = 20
}: AdminTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(initialSortColumn ?? null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(initialPageSize)
  
  // Hook para drag-to-scroll en tabla
  const { handlers, containerStyle } = useDragToScroll()

  // Filtrar datos según búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm) return data

    const searchLower = searchTerm.toLowerCase()
    return data.filter((item: any) => {
      return columns.some((col: any) => {
        if (col.searchable === false) return false
        const value = item[col.key]
        if (value == null) return false
        return String(value).toLowerCase().includes(searchLower)
      })
    })
  }, [data, searchTerm, columns])

  // Ordenar datos
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData

    const sorted = [...filteredData].sort((a: any, b: any) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      // Manejar valores null según la dirección de ordenación
      if (sortDirection === 'desc') {
        // En descendente, null va al final (después de los valores reales)
        if (aValue == null && bValue == null) return 0
        if (aValue == null) return 1
        if (bValue == null) return -1
      } else {
        // En ascendente, null va al final también
        if (aValue == null && bValue == null) return 0
        if (aValue == null) return 1
        if (bValue == null) return -1
      }

      // Comparar valores según tipo
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
        return sortDirection === 'desc' ? -comparison : comparison
      }

      // Para números y fechas
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sortDirection === 'desc' ? -comparison : comparison
    })

    return sorted
  }, [filteredData, sortColumn, sortDirection])

  // Paginación
  const totalPages = itemsPerPage === -1
    ? 1
    : Math.max(1, Math.ceil(sortedData.length / itemsPerPage))

  const renderPageSizeSelect = () => (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700">Mostrar</span>
      <select
        value={itemsPerPage}
        onChange={(e) => {
          setItemsPerPage(Number(e.target.value))
          setCurrentPage(1)
        }}
        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
      >
        {pageSizeOptions.map((size) => (
          <option key={size} value={size}>
            {size === -1 ? 'Todos' : size}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-700">por página</span>
    </div>
  )

  const pageNav = itemsPerPage !== -1 && (
    <div className="flex gap-1">
      <button
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="p-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Página anterior"
      >
        <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
      </button>
      <div className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg">
        Página {currentPage} de {totalPages}
      </div>
      <button
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Página siguiente"
      >
        <ChevronRightIcon className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  )
  const paginatedData = useMemo(() => {
    if (itemsPerPage === -1) return sortedData // Mostrar todos
    const start = (currentPage - 1) * itemsPerPage
    return sortedData.slice(start, start + itemsPerPage)
  }, [sortedData, currentPage, itemsPerPage])

  // Resetear a página 1 cuando cambian filtros u ordenación
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleSort = (columnKey: string) => {
    const column = columns.find((col: any) => col.key === columnKey)
    if (!column || column.sortable === false) return

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = columns.map((col: any) => col.title).join(',')
    const rows = sortedData.map((item: any) => {
      return columns
        .map((col: any) => {
          const value = col.exportValue
            ? col.exportValue(item)
            : item[col.key]
          
          // Escapar comillas y comas
          const stringValue = String(value ?? '')
          return `"${stringValue.replace(/"/g, '""')}"`
        })
        .join(',')
    })

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${exportFilename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Exportar a Excel (formato XLSX real)
  const exportToExcel = () => {
    // Crear la cabecera
    const headers = columns.map((col: any) => col.title)
    
    // Crear las filas de datos
    const rows = sortedData.map((item: any) => {
      return columns.map((col: any) => {
        const value = col.exportValue
          ? col.exportValue(item)
          : item[col.key]
        return value ?? ''
      })
    })

    // Combinar cabecera y filas
    const data = [headers, ...rows]

    // Crear libro de trabajo y hoja
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')

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
    XLSX.writeFile(workbook, `${exportFilename}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Barra de búsqueda y exportación */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {filteredData.length > 0 && renderPageSizeSelect()}
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              title="Exportar a CSV"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              title="Exportar a Excel"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto" style={containerStyle} {...handlers}>
        <table
          className={`w-full divide-y divide-gray-200 ${layout === 'fixed' ? 'table-fixed' : ''}`}
          style={minWidth ? { minWidth } : undefined}
        >
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column: any) => (
                <th
                  key={column.key}
                  className={`px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable !== false ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                  } ${column.headerClassName || ''} ${column.className || ''}`}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="truncate">{column.title}</span>
                    {column.sortable !== false && sortColumn === column.key && (
                      <span className="text-sky-600 shrink-0">
                        {sortDirection === 'asc' ? (
                          <ChevronUpIcon className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDownIcon className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item: any, index: any) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column: any) => (
                    <td
                      key={column.key}
                      className={`px-2.5 py-2 overflow-hidden ${
                        column.nowrap === false ? '' : 'whitespace-nowrap'
                      } ${column.className || ''}`}
                    >
                      {column.render ? column.render(item) : (
                        <span className="text-sm text-gray-900">{String(item[column.key] ?? '')}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {filteredData.length > 0 && (
        <div className="bg-gray-50 px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-4">
          {renderPageSizeSelect()}

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              {itemsPerPage === -1 ? (
                `Mostrando ${sortedData.length} de ${sortedData.length} resultados`
              ) : (
                `Mostrando ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, sortedData.length)} de ${sortedData.length} resultados`
              )}
            </span>
            {pageNav}
          </div>
        </div>
      )}
    </div>
  )
}

