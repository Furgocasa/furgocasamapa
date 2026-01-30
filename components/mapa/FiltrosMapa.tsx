'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, ChevronRightIcon, CheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

export interface Filtros {
  busqueda: string
  pais: string
  servicios: string[]
  precio: string
  caracteristicas: string[]
}

interface FiltrosMapaProps {
  filtros: Filtros
  onFiltrosChange: (filtros: Filtros) => void
  onPaisChange?: (pais: string) => void
  onClose?: () => void
  totalResultados: number
  paisesDisponibles: string[]
}

const SERVICIOS = [
  { id: 'agua', label: '💧 Agua' },
  { id: 'electricidad', label: '⚡ Electricidad' },
  { id: 'vaciado_aguas_negras', label: '♻️ Vaciado Químico' },
  { id: 'vaciado_aguas_grises', label: '🚰 Vaciado Aguas Grises' },
  { id: 'wifi', label: '📶 WiFi' },
  { id: 'duchas', label: '🚿 Duchas' },
  { id: 'wc', label: '🚻 WC' },
  { id: 'lavanderia', label: '🧺 Lavandería' },
  { id: 'restaurante', label: '🍽️ Restaurante' },
  { id: 'supermercado', label: '🛒 Supermercado' },
  { id: 'zona_mascotas', label: '🐕 Zona Mascotas' }
]

const PRECIOS = [
  { value: '', label: 'Todos los precios' },
  { value: 'gratis', label: 'Gratis' },
  { value: 'de-pago', label: 'De pago' },
  { value: 'desconocido', label: 'Precio desconocido' }
]

const CARACTERISTICAS = [
  { id: 'con_descuento_furgocasa', label: '🎫 Con descuento FURGOCASA' },
  { id: 'verificado', label: '✓ Verificado oficialmente' }
]

export function FiltrosMapa({ filtros, onFiltrosChange, onPaisChange, onClose, totalResultados, paisesDisponibles }: FiltrosMapaProps) {
  const [busquedaLocal, setBusquedaLocal] = useState(filtros.busqueda)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Estado para el MODAL de países
  const [modalPaisesOpen, setModalPaisesOpen] = useState(false)
  const [paisSearch, setPaisSearch] = useState('')
  const [paisSeleccionadoTemp, setPaisSeleccionadoTemp] = useState(filtros.pais)

  useEffect(() => {
    setBusquedaLocal(filtros.busqueda)
  }, [filtros.busqueda])

  // Sincronizar país seleccionado cuando cambia desde fuera
  useEffect(() => {
    setPaisSeleccionadoTemp(filtros.pais)
  }, [filtros.pais])

  const handleBusquedaChange = (valor: string) => {
    setBusquedaLocal(valor)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      onFiltrosChange({ ...filtros, busqueda: valor })
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Abrir modal de países
  const abrirModalPaises = () => {
    setPaisSeleccionadoTemp(filtros.pais)
    setPaisSearch('')
    setModalPaisesOpen(true)
  }

  // Aplicar selección de país
  const aplicarPais = () => {
    onFiltrosChange({ ...filtros, pais: paisSeleccionadoTemp })
    onPaisChange?.(paisSeleccionadoTemp)
    setModalPaisesOpen(false)
  }

  const handlePrecioChange = (valor: string) => {
    onFiltrosChange({ ...filtros, precio: valor })
  }

  const handleServicioToggle = (servicio: string) => {
    const nuevos = filtros.servicios.includes(servicio)
      ? filtros.servicios.filter((s: string) => s !== servicio)
      : [...filtros.servicios, servicio]
    onFiltrosChange({ ...filtros, servicios: nuevos })
  }

  const handleCaracteristicaToggle = (caracteristica: string) => {
    const nuevas = filtros.caracteristicas.includes(caracteristica)
      ? filtros.caracteristicas.filter((c: string) => c !== caracteristica)
      : [...filtros.caracteristicas, caracteristica]
    onFiltrosChange({ ...filtros, caracteristicas: nuevas })
  }

  const limpiarFiltros = () => {
    onFiltrosChange({
      busqueda: '',
      pais: '',
      servicios: [],
      precio: '',
      caracteristicas: []
    })
  }

  // Filtrar países por búsqueda
  const paisesFiltrados = useMemo(() => {
    const term = paisSearch.trim().toLowerCase()
    if (!term) return paisesDisponibles
    return paisesDisponibles.filter((pais) => pais.toLowerCase().includes(term))
  }, [paisesDisponibles, paisSearch])

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-primary-200">
        <h2 className="text-lg font-bold text-primary-900">Filtros de Búsqueda</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-primary-100 rounded-full transition-colors"
            aria-label="Cerrar filtros"
          >
            <XMarkIcon className="w-6 h-6 text-primary-700" />
          </button>
        )}
      </div>

      {/* Contenido con scroll */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* Búsqueda */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Buscar dirección o lugar
          </label>
          <div className="relative">
            <input
              type="text"
              value={busquedaLocal}
              onChange={(e) => handleBusquedaChange(e.target.value)}
              placeholder="Nombre, ciudad, dirección..."
              className="w-full pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            {busquedaLocal && (
              <button
                onClick={() => handleBusquedaChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* PAÍS - BOTÓN QUE ABRE MODAL */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            País ({paisesDisponibles.length} disponibles)
          </label>
          <button
            type="button"
            onClick={abrirModalPaises}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer text-left flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <GlobeAltIcon className="w-4 h-4 text-gray-400" />
              <span className={filtros.pais ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                {filtros.pais || 'Todos los países'}
              </span>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Servicios */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Servicios
          </label>
          <div className="space-y-1 bg-gray-50 rounded-lg p-2">
            {SERVICIOS.map((servicio) => (
              <label key={servicio.id} className="flex items-center cursor-pointer hover:bg-white py-1.5 px-2 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={filtros.servicios.includes(servicio.id)}
                  onChange={() => handleServicioToggle(servicio.id)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{servicio.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Precio */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Precio
          </label>
          <div className="space-y-1 bg-gray-50 rounded-lg p-2">
            {PRECIOS.map((precio) => (
              <label key={precio.value} className="flex items-center cursor-pointer hover:bg-white py-1.5 px-2 rounded transition-colors">
                <input
                  type="radio"
                  name="precio"
                  value={precio.value}
                  checked={filtros.precio === precio.value}
                  onChange={(e) => handlePrecioChange(e.target.value)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{precio.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Características */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Características
          </label>
          <div className="space-y-1 bg-gray-50 rounded-lg p-2">
            {CARACTERISTICAS.map((caracteristica) => (
              <label key={caracteristica.id} className="flex items-center cursor-pointer hover:bg-white py-1.5 px-2 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={filtros.caracteristicas.includes(caracteristica.id)}
                  onChange={() => handleCaracteristicaToggle(caracteristica.id)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{caracteristica.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-3 py-3 space-y-2 bg-gray-50">
        <div className="text-sm text-gray-600 text-center">
          <span className="font-bold text-gray-900">{totalResultados}</span> {totalResultados === 1 ? 'área encontrada' : 'áreas encontradas'}
        </div>
        <button
          onClick={limpiarFiltros}
          className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors font-medium"
        >
          Restablecer Filtros
        </button>
      </div>

      {/* ========== MODAL DE PAÍSES ========== */}
      {modalPaisesOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Seleccionar País</h3>
              <button
                onClick={() => setModalPaisesOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Buscador */}
            <div className="p-3 border-b">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={paisSearch}
                  onChange={(e) => setPaisSearch(e.target.value)}
                  placeholder="Buscar país..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de Países - CON SCROLL */}
            <div className="flex-1 overflow-y-auto">
              {/* Opción: Todos los países */}
              <button
                type="button"
                onClick={() => setPaisSeleccionadoTemp('')}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b ${
                  paisSeleccionadoTemp === '' ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <GlobeAltIcon className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-gray-900">Todos los países</span>
                </div>
                {paisSeleccionadoTemp === '' && (
                  <CheckIcon className="w-5 h-5 text-primary-600" />
                )}
              </button>

              {/* Lista de países */}
              {paisesFiltrados.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No se encontraron países con "{paisSearch}"
                </div>
              ) : (
                paisesFiltrados.map((pais, index) => (
                  <button
                    key={pais}
                    type="button"
                    onClick={() => setPaisSeleccionadoTemp(pais)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      index < paisesFiltrados.length - 1 ? 'border-b border-gray-100' : ''
                    } ${paisSeleccionadoTemp === pais ? 'bg-primary-50' : ''}`}
                  >
                    <span className="text-gray-900">{pais}</span>
                    {paisSeleccionadoTemp === pais && (
                      <CheckIcon className="w-5 h-5 text-primary-600" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setModalPaisesOpen(false)}
                className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={aplicarPais}
                className="flex-1 py-2.5 px-4 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
