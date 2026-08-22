'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, ChevronRightIcon, CheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { useLanguage, getServicioLabel, getTipoAreaLabel, SERVICIO_ICONS } from '@/lib/i18n'
import { TIPO_AREA_IDS, getTipoAreaColor, type TipoArea } from '@/lib/areas/tipo-area'
import { sinTildes } from '@/lib/areas/slug'

export interface Filtros {
  busqueda: string
  pais: string
  servicios: string[]
  tipos: string[]
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
  conteoPaisesRegion?: {
    europa: number
    sudamerica: number
    centroamerica: number
  }
}

const SERVICIO_IDS = [
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
  'zona_mascotas',
] as const

// Regiones para filtrar - EXPORTAR para uso en page.tsx
export const REGIONES = {
  EUROPA: {
    id: 'REGION_EUROPA',
    label: 'Europa',
    emoji: '🇪🇺',
    paises: [
      'España', 'Portugal', 'Francia', 'Italia', 'Alemania', 'Austria', 'Suiza',
      'Bélgica', 'Países Bajos', 'Holanda', 'Reino Unido', 'Gales', 'Irlanda', 'Dinamarca',
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
  // El filtro puede ser "Gales" y el área "Reino Unido" (o al revés)
  return paisNormalizado === filtro || paisNormalizado === normalizarPais(filtro)
}

export function FiltrosMapa({ filtros, onFiltrosChange, onPaisChange, onClose, totalResultados, paisesDisponibles, conteoPaisesRegion }: FiltrosMapaProps) {
  const { locale, t } = useLanguage()
  const [busquedaLocal, setBusquedaLocal] = useState(filtros.busqueda)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const serviciosOpts = useMemo(
    () =>
      SERVICIO_IDS.map((id) => ({
        id,
        icon: SERVICIO_ICONS[id] || '✓',
        label: getServicioLabel(id, locale),
      })),
    [locale]
  )
  const preciosOpts = useMemo(
    () => [
      { value: '', label: t('all_prices') },
      { value: 'gratis', label: t('free') },
      { value: 'de-pago', label: t('paid') },
      { value: 'desconocido', label: t('price_unknown') },
    ],
    [t, locale]
  )
  const caracteristicasOpts = useMemo(
    () => [
      { id: 'con_descuento_furgocasa', label: `🎫 ${t('discount_furgocasa')}` },
      { id: 'verificado', label: `✓ ${t('verified')}` },
    ],
    [t, locale]
  )
  
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

  const handleTipoToggle = (tipo: TipoArea) => {
    const actuales = filtros.tipos || []
    const nuevos = actuales.includes(tipo)
      ? actuales.filter((t) => t !== tipo)
      : [...actuales, tipo]
    onFiltrosChange({ ...filtros, tipos: nuevos })
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
      tipos: [],
      precio: '',
      caracteristicas: []
    })
  }

  // Filtrar países por búsqueda
  const paisesFiltrados = useMemo(() => {
    const term = sinTildes(paisSearch).trim()
    if (!term) return paisesDisponibles
    return paisesDisponibles.filter((pais) => sinTildes(pais).includes(term))
  }, [paisesDisponibles, paisSearch])

  const filtrosActivos =
    (filtros.busqueda ? 1 : 0) +
    (filtros.pais ? 1 : 0) +
    (filtros.tipos?.length || 0) +
    filtros.servicios.length +
    (filtros.precio ? 1 : 0) +
    filtros.caracteristicas.length

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header: solo en desktop/tablet. En móvil el BottomSheet ya trae título y cierre. */}
      <div className="hidden md:flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-primary-200">
        <h2 className="text-lg font-bold text-primary-900">{t('filters')}</h2>
        {filtrosActivos > 0 && (
          <span className="text-xs font-bold bg-accent-500 text-white rounded-full px-2 py-0.5">
            {filtrosActivos}
          </span>
        )}
      </div>

      {/* Contenido con scroll */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* Búsqueda */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t('search_placeholder')}
          </label>
          <div className="relative">
            <input
              type="text"
              value={busquedaLocal}
              onChange={(e) => handleBusquedaChange(e.target.value)}
              placeholder={t('search_placeholder')}
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
            {t('country_filter')} / {t('region')} ({paisesDisponibles.length})
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

        {/* Tipo de ubicación */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t('type_filter')}
          </label>
          <div className="space-y-2">
            {TIPO_AREA_IDS.map((tipo) => {
              const hintKey =
                tipo === 'publica'
                  ? 'type_public_hint'
                  : tipo === 'privada'
                    ? 'type_private_hint'
                    : 'type_camping_hint'
              const activo = (filtros.tipos || []).includes(tipo)
              const color = getTipoAreaColor(tipo)
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => handleTipoToggle(tipo)}
                  aria-pressed={activo}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all active:scale-[0.99] ${
                    activo ? 'shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  style={activo ? { borderColor: color, backgroundColor: `${color}14` } : undefined}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900">
                      {getTipoAreaLabel(tipo, locale)}
                    </span>
                    <span className="block text-[11px] text-gray-500 leading-tight">
                      {t(hintKey)}
                    </span>
                  </span>
                  {activo && <CheckIcon className="w-5 h-5 shrink-0" style={{ color }} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Servicios */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t('services')}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {serviciosOpts.map((servicio) => {
              const activo = filtros.servicios.includes(servicio.id)
              return (
                <button
                  key={servicio.id}
                  type="button"
                  onClick={() => handleServicioToggle(servicio.id)}
                  aria-pressed={activo}
                  className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left text-[13px] transition-all active:scale-[0.98] ${
                    activo
                      ? 'border-primary-600 bg-primary-50 text-primary-900 font-semibold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span aria-hidden>{servicio.icon}</span>
                  <span className="truncate">{servicio.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Precio */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t('price')}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {preciosOpts.map((precio) => {
              const activo = filtros.precio === precio.value
              return (
                <button
                  key={precio.value}
                  type="button"
                  onClick={() => handlePrecioChange(precio.value)}
                  aria-pressed={activo}
                  className={`rounded-xl border px-2.5 py-2 text-center text-[13px] transition-all active:scale-[0.98] ${
                    activo
                      ? 'border-primary-600 bg-primary-600 text-white font-semibold shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {precio.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Características */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t('characteristics')}
          </label>
          <div className="space-y-1.5">
            {caracteristicasOpts.map((caracteristica) => {
              const activo = filtros.caracteristicas.includes(caracteristica.id)
              return (
                <button
                  key={caracteristica.id}
                  type="button"
                  onClick={() => handleCaracteristicaToggle(caracteristica.id)}
                  aria-pressed={activo}
                  className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left text-[13px] transition-all active:scale-[0.99] ${
                    activo
                      ? 'border-accent-500 bg-accent-50 text-accent-700 font-semibold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{caracteristica.label}</span>
                  {activo && <CheckIcon className="w-4 h-4 shrink-0 text-accent-600" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-3 py-3 space-y-2 bg-white">
        <div className="hidden md:block text-sm text-gray-600 text-center">
          <span className="font-bold text-gray-900">{totalResultados.toLocaleString('es')}</span>{' '}
          {t('results')}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden w-full py-3 px-3 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary-700 active:scale-[0.99] transition-all"
          >
            {t('show_results')} ({totalResultados.toLocaleString('es')})
          </button>
        )}
        <button
          onClick={limpiarFiltros}
          disabled={filtrosActivos === 0}
          className="w-full py-2 px-3 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('clear_filters')}
          {filtrosActivos > 0 ? ` (${filtrosActivos})` : ''}
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
                        <span className="font-medium text-gray-900">{t('europe')}</span>
                        <p className="text-xs text-gray-500">{conteoPaisesRegion?.europa || 0} países con áreas</p>
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
                        <span className="font-medium text-gray-900">{t('south_america')}</span>
                        <p className="text-xs text-gray-500">{conteoPaisesRegion?.sudamerica || 0} países con áreas</p>
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
                        <span className="font-medium text-gray-900">{t('central_america')}</span>
                        <p className="text-xs text-gray-500">{conteoPaisesRegion?.centroamerica || 0} países con áreas</p>
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
