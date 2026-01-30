'use client'

import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

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

export function FiltrosMapa({ filtros, onFiltrosChange, onClose, totalResultados, paisesDisponibles }: FiltrosMapaProps) {
  const [busquedaLocal, setBusquedaLocal] = useState(filtros.busqueda)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setBusquedaLocal(filtros.busqueda)
  }, [filtros.busqueda])

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

  const handlePaisChange = (valor: string) => {
    onFiltrosChange({ ...filtros, pais: valor })
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

        {/* PAÍS - SELECT NATIVO HTML - FUNCIONA PERFECTO */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            País ({paisesDisponibles.length} disponibles)
          </label>
          <select
            value={filtros.pais}
            onChange={(e) => handlePaisChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
          >
            <option value="">🌍 Todos los países</option>
            {paisesDisponibles.map((pais) => (
              <option key={pais} value={pais}>
                {pais}
              </option>
            ))}
          </select>
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
    </div>
  )
}
