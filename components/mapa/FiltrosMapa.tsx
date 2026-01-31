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

// Regiones para filtrar
const REGIONES = {
  EUROPA: {
    id: 'REGION_EUROPA',
    label: 'Europa',
    emoji: '🇪🇺',
    paises: [
      'España', 'Portugal', 'Francia', 'Italia', 'Alemania', 'Austria', 'Suiza',
      'Bélgica', 'Países Bajos', 'Holanda', 'Reino Unido', 'Irlanda', 'Dinamarca',
      'Noruega', 'Suecia', 'Finlandia', 'Polonia', 'Chequia', 'República Checa',
      'Eslovaquia', 'Hungría', 'Croacia', 'Eslovenia', 'Grecia', 'Rumanía',
      'Bulgaria', 'Serbia', 'Montenegro', 'Albania', 'Macedonia', 'Bosnia',
      'Luxemburgo', 'Mónaco', 'Andorra', 'Malta', 'Chipre', 'Estonia',
      'Letonia', 'Lituania', 'Islandia'
    ]
  },
  SUDAMERICA: {
    id: 'REGION_SUDAMERICA',
    label: 'Sudamérica',
    emoji: '🌎',
    paises: [
      'Argentina', 'Chile', 'Uruguay', 'Paraguay', 'Brasil', 'Bolivia',
      'Perú', 'Ecuador', 'Colombia', 'Venezuela', 'Guyana', 'Surinam'
    ]
  },
  CENTROAMERICA: {
    id: 'REGION_CENTROAMERICA',
    label: 'Centroamérica y Caribe',
    emoji: '🌴',
    paises: [
      'México', 'Guatemala', 'Belice', 'Honduras', 'El Salvador', 'Nicaragua',
      'Costa Rica', 'Panamá', 'Cuba', 'República Dominicana', 'Puerto Rico',
      'Jamaica', 'Haití'
    ]
  }
}

// ✅ MAPEO DE SINÓNIMOS - Normalizar variaciones de nombres de países
const SINONIMOS_PAISES: Record<string, string> = {
  // Países Bajos / Holanda
  'Holanda': 'Países Bajos',
  'Holland': 'Países Bajos',
  'Netherlands': 'Países Bajos',
  'The Netherlands': 'Países Bajos',
  
  // Chequia / República Checa
  'República Checa': 'Chequia',
  'Czech Republic': 'Chequia',
  'Czechia': 'Chequia',
  
  // Reino Unido
  'UK': 'Reino Unido',
  'United Kingdom': 'Reino Unido',
  'Gran Bretaña': 'Reino Unido',
  'Great Britain': 'Reino Unido',
  'Inglaterra': 'Reino Unido',
  'Escocia': 'Reino Unido',
  'Gales': 'Reino Unido',
  
  // Estados Unidos
  'USA': 'Estados Unidos',
  'United States': 'Estados Unidos',
  'US': 'Estados Unidos',
  'EEUU': 'Estados Unidos',
  'EE.UU.': 'Estados Unidos',
  
  // Brasil
  'Brazil': 'Brasil',
  
  // Perú
  'Peru': 'Perú',
  
  // Otros sinónimos comunes
  'Suiza': 'Suiza',
  'Switzerland': 'Suiza',
  'Bélgica': 'Bélgica',
  'Belgium': 'Bélgica'
}

// ✅ Normalizar nombre de país (aplicar sinónimos)
export function normalizarPais(pais: string): string {
  const paisTrimmed = pais.trim()
  return SINONIMOS_PAISES[paisTrimmed] || paisTrimmed
}

// Helper para obtener el nombre legible del filtro de país
export function getNombreFiltro(valor: string): string {
  if (!valor) return 'Todos los países'
  if (valor === REGIONES.EUROPA.id) return REGIONES.EUROPA.label
  if (valor === REGIONES.SUDAMERICA.id) return REGIONES.SUDAMERICA.label
  if (valor === REGIONES.CENTROAMERICA.id) return REGIONES.CENTROAMERICA.label
  return valor
}

// Helper para verificar si un país pertenece al filtro
export function paisPerteneceAFiltro(pais: string, filtro: string): boolean {
  if (!filtro) return true // Todos
  
  // ✅ Normalizar el nombre del país antes de comparar
  const paisNormalizado = normalizarPais(pais)
  
  if (filtro === REGIONES.EUROPA.id) return REGIONES.EUROPA.paises.includes(paisNormalizado)
  if (filtro === REGIONES.SUDAMERICA.id) return REGIONES.SUDAMERICA.paises.includes(paisNormalizado)
  if (filtro === REGIONES.CENTROAMERICA.id) return REGIONES.CENTROAMERICA.paises.includes(paisNormalizado)
  return paisNormalizado === filtro // País específico
}

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

        {/* PAÍS/REGIÓN - BOTÓN QUE ABRE MODAL */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            País / Región ({paisesDisponibles.length} países)
          </label>
          <button
            type="button"
            onClick={abrirModalPaises}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer text-left flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <GlobeAltIcon className="w-4 h-4 text-gray-400" />
              <span className={filtros.pais ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                {getNombreFiltro(filtros.pais)}
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

      {/* ========== MODAL DE PAÍSES Y REGIONES ========== */}
      {modalPaisesOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Seleccionar País o Región</h3>
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
                  placeholder="Buscar país o región..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de Países y Regiones - CON SCROLL */}
            <div className="flex-1 overflow-y-auto">
              
              {/* ===== OPCIONES GENERALES ===== */}
              {!paisSearch && (
                <>
                  {/* Todos los países */}
                  <button
                    type="button"
                    onClick={() => setPaisSeleccionadoTemp('')}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b ${
                      paisSeleccionadoTemp === '' ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🌍</span>
                      <span className="font-medium text-gray-900">Todos los países</span>
                    </div>
                    {paisSeleccionadoTemp === '' && (
                      <CheckIcon className="w-5 h-5 text-primary-600" />
                    )}
                  </button>

                  {/* Separador - Regiones */}
                  <div className="px-4 py-2 bg-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Regiones
                  </div>

                  {/* Europa */}
                  <button
                    type="button"
                    onClick={() => setPaisSeleccionadoTemp(REGIONES.EUROPA.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b ${
                      paisSeleccionadoTemp === REGIONES.EUROPA.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{REGIONES.EUROPA.emoji}</span>
                      <div>
                        <span className="font-medium text-gray-900">{REGIONES.EUROPA.label}</span>
                        <p className="text-xs text-gray-500">{REGIONES.EUROPA.paises.length} países</p>
                      </div>
                    </div>
                    {paisSeleccionadoTemp === REGIONES.EUROPA.id && (
                      <CheckIcon className="w-5 h-5 text-primary-600" />
                    )}
                  </button>

                  {/* Sudamérica */}
                  <button
                    type="button"
                    onClick={() => setPaisSeleccionadoTemp(REGIONES.SUDAMERICA.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b ${
                      paisSeleccionadoTemp === REGIONES.SUDAMERICA.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{REGIONES.SUDAMERICA.emoji}</span>
                      <div>
                        <span className="font-medium text-gray-900">{REGIONES.SUDAMERICA.label}</span>
                        <p className="text-xs text-gray-500">{REGIONES.SUDAMERICA.paises.length} países</p>
                      </div>
                    </div>
                    {paisSeleccionadoTemp === REGIONES.SUDAMERICA.id && (
                      <CheckIcon className="w-5 h-5 text-primary-600" />
                    )}
                  </button>

                  {/* Centroamérica */}
                  <button
                    type="button"
                    onClick={() => setPaisSeleccionadoTemp(REGIONES.CENTROAMERICA.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b ${
                      paisSeleccionadoTemp === REGIONES.CENTROAMERICA.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{REGIONES.CENTROAMERICA.emoji}</span>
                      <div>
                        <span className="font-medium text-gray-900">{REGIONES.CENTROAMERICA.label}</span>
                        <p className="text-xs text-gray-500">{REGIONES.CENTROAMERICA.paises.length} países</p>
                      </div>
                    </div>
                    {paisSeleccionadoTemp === REGIONES.CENTROAMERICA.id && (
                      <CheckIcon className="w-5 h-5 text-primary-600" />
                    )}
                  </button>

                  {/* Separador - Países */}
                  <div className="px-4 py-2 bg-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Países ({paisesDisponibles.length})
                  </div>
                </>
              )}

              {/* Lista de países */}
              {paisesFiltrados.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No se encontraron resultados para "{paisSearch}"
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
