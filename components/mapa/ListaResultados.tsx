'use client'

import { Area } from '@/types/database.types'
import { MapPinIcon, PhoneIcon, StarIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { useLanguage, getServicioLabel, SERVICIO_ICONS } from '@/lib/i18n'
import { colorPin, esPinTaller, etiquetaDePin, fichaBaseDePin, iconPathDePin } from '@/lib/talleres/map-pin'

interface ListaResultadosProps {
  areas: Area[]
  onAreaClick: (area: Area) => void
  onClose?: () => void
  userLocation?: { lat: number; lng: number } | null
  gpsActive?: boolean
  emptyTitle?: string
  emptyHint?: string
  modo?: 'areas' | 'talleres'
}

type SortOption = 'relevancia' | 'valoracion' | 'precio' | 'proximidad' | 'nombre'
type SortDirection = 'asc' | 'desc'

// Límite de 50 resultados en la lista (el mapa muestra todos los marcadores)
const MAX_RESULTS = 50

export function ListaResultados({
  areas,
  onAreaClick,
  onClose,
  userLocation,
  gpsActive,
  emptyTitle,
  emptyHint,
  modo = 'areas',
}: ListaResultadosProps) {
  const { locale, t } = useLanguage()
  const [sortBy, setSortBy] = useState<SortOption>('nombre')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const getServicioIcon = (servicio: string): string => SERVICIO_ICONS[servicio] || '✓'

  // Calcular distancia entre dos puntos (Haversine formula)
  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Ordenar áreas según la opción seleccionada
  const areasSorted = useMemo(() => {
    const areasCopy = [...areas]
    const direction = sortDirection === 'asc' ? 1 : -1

    switch (sortBy) {
      case 'nombre':
        return areasCopy.sort((a: any, b: any) => {
          const nombreA = (a.nombre || '').toLowerCase()
          const nombreB = (b.nombre || '').toLowerCase()
          return nombreA.localeCompare(nombreB) * direction
        })
      
      case 'valoracion':
        return areasCopy.sort((a: any, b: any) => {
          return ((b.google_rating || 0) - (a.google_rating || 0)) * direction
        })
      
      case 'precio':
        return areasCopy.sort((a: any, b: any) => {
          const precioA = a.precio_noche === null ? 0 : a.precio_noche
          const precioB = b.precio_noche === null ? 0 : b.precio_noche
          return (precioA - precioB) * direction
        })
      
      case 'proximidad':
        if (!userLocation) return areasCopy
        return areasCopy.sort((a: any, b: any) => {
          if (!a.latitud || !a.longitud) return 1
          if (!b.latitud || !b.longitud) return -1
          const distA = calcularDistancia(userLocation.lat, userLocation.lng, Number(a.latitud), Number(a.longitud))
          const distB = calcularDistancia(userLocation.lat, userLocation.lng, Number(b.latitud), Number(b.longitud))
          return (distA - distB) * direction
        })
      
      case 'relevancia':
      default:
        return areasCopy // Mantener orden original (filtros)
    }
  }, [areas, sortBy, sortDirection, userLocation])

  const totalResults = areasSorted.length
  const visibleResults = Math.min(totalResults, MAX_RESULTS)
  const visibleAreas = areasSorted.slice(0, MAX_RESULTS)
  const hasMoreResults = totalResults > MAX_RESULTS

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header Azulado */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border-b border-primary-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-lg font-bold text-primary-900">{t('places')}</h2>
            <p className="text-sm text-primary-700">
              {totalResults} {t('results')}
              {hasMoreResults && (
                <span className="block text-xs text-primary-600 mt-1 leading-relaxed">
                  📍 {visibleResults} {t('of')} {totalResults}
                </span>
              )}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-primary-100 rounded-full transition-colors"
              aria-label="Cerrar lista"
            >
              <XMarkIcon className="w-6 h-6 text-primary-700" />
            </button>
          )}
        </div>
        
        {/* Selector de Ordenación */}
        <div className="px-4 pb-3">
          <label className="flex items-center gap-1 text-xs font-semibold text-primary-700 mb-1.5">
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            Ordenar por
          </label>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="flex-1 px-3 py-2 bg-white border border-primary-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="nombre">🔤 {t('sort_name')}</option>
              <option value="valoracion">⭐ {t('sort_rating')}</option>
              <option value="precio">💰 {t('sort_price')}</option>
              <option value="proximidad" disabled={!gpsActive || !userLocation}>
                📍 {t('sort_proximity')} {!gpsActive ? '(GPS off)' : ''}
              </option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-white border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center min-w-[44px]"
              title={sortDirection === 'asc' ? 'Ascendente (A-Z)' : 'Descendente (Z-A)'}
            >
              <span className="text-sm font-bold text-primary-700">
                {sortDirection === 'asc' ? 'A→Z' : 'Z→A'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista con scroll */}
      <div className="flex-1 overflow-y-auto p-4">
        {areas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MapPinIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {emptyTitle || (modo === 'talleres' ? t('empty_talleres') : 'No se encontraron áreas')}
            </h3>
            <p className="text-gray-500 text-sm">
              {emptyHint || 'Intenta ajustar los filtros para ver más resultados'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleAreas.map((area) => {
              // Servicios disponibles
              const serviciosValidos = [
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
              const serviciosDisponibles = area.servicios && typeof area.servicios === 'object' 
                ? Object.entries(area.servicios)
                    .filter(([key, value]) => value === true && serviciosValidos.includes(key))
                    .map(([key]) => key)
                : []

              const distancia =
                userLocation && area.latitud && area.longitud
                  ? calcularDistancia(
                      userLocation.lat,
                      userLocation.lng,
                      Number(area.latitud),
                      Number(area.longitud)
                    )
                  : null
              const distanciaTexto =
                distancia === null
                  ? null
                  : distancia < 1
                    ? `${Math.round(distancia * 1000)} m`
                    : `${distancia.toFixed(1)} km`
              const mapsUrl =
                area.google_maps_url ||
                `https://www.google.com/maps/search/?api=1&query=${area.latitud},${area.longitud}`

              return (
                <div
                  key={area.id}
                  onClick={() => onAreaClick(area)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-400 hover:shadow-md transition cursor-pointer bg-white"
                >
                  {/* Foto a sangre, con la distancia encima */}
                  {area.foto_principal && (
                    <div className="mb-3 -mx-4 -mt-4 relative">
                      <img
                        src={area.foto_principal}
                        alt={area.nombre}
                        className="w-full h-32 object-cover rounded-t-lg"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                      {distanciaTexto && (
                        <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                          <MapPinIcon className="w-3 h-3" />
                          {distanciaTexto}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Nombre, valoración y tipo */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base text-gray-900 leading-tight mb-1 line-clamp-2">
                        {area.nombre}
                      </h3>
                      {area.google_rating && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <StarIcon className="w-4 h-4 text-yellow-400" />
                            <span className="font-bold text-sm text-gray-900">
                              {area.google_rating}
                            </span>
                          </div>
                          {(area.google_ratings_total ?? 0) > 0 && (
                            <span className="text-xs text-gray-500 font-normal">
                              {(area.google_ratings_total ?? 0).toLocaleString(locale)} {t('reviews')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span
                      className="w-8 h-8 shrink-0 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: colorPin(area) }}
                      title={etiquetaDePin(area, locale)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden>
                        <path d={iconPathDePin(area)} />
                      </svg>
                    </span>
                  </div>

                  {/* Ubicación, con la distancia aquí si la tarjeta no tiene foto */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs text-gray-600 line-clamp-1 flex-1">
                      {[area.ciudad, area.provincia].filter(Boolean).join(', ')}
                    </p>
                    {distanciaTexto && !area.foto_principal && (
                      <span className="text-xs font-semibold text-primary-600 flex items-center gap-1 shrink-0">
                        <MapPinIcon className="w-3 h-3" />
                        {distanciaTexto}
                      </span>
                    )}
                  </div>

                  {/* Tipo, precio y verificado */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${colorPin(area)}20`,
                        color: colorPin(area),
                      }}
                    >
                      {etiquetaDePin(area, locale)}
                    </span>
                    {!esPinTaller(area) && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      area.precio_noche === 0
                        ? 'bg-green-100 text-green-800'
                        : area.precio_noche === null || area.precio_noche === undefined
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {area.precio_noche === 0
                        ? `✨ ${t('free')}`
                        : area.precio_noche === null || area.precio_noche === undefined
                        ? `❓ ${t('price_unknown')}`
                        : `💰 ${area.precio_noche}€${t('per_night')}`
                      }
                    </span>
                    )}
                    {area.verificado && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ✓ {t('verified')}
                      </span>
                    )}
                  </div>

                  {/* Servicios en tira compacta: el dato sigue, sin alargar la tarjeta */}
                  {serviciosDisponibles.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mb-3">
                      {serviciosDisponibles.slice(0, 6).map((servicio: any) => (
                        <span
                          key={servicio}
                          className="w-6 h-6 rounded bg-gray-50 border border-gray-200 flex items-center justify-center text-xs"
                          title={getServicioLabel(servicio, locale)}
                        >
                          {getServicioIcon(servicio)}
                        </span>
                      ))}
                      {serviciosDisponibles.length > 6 && (
                        <span className="text-[11px] font-medium text-gray-500">
                          +{serviciosDisponibles.length - 6}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Link
                      href={`${fichaBaseDePin(area)}/${area.slug}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-center text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg px-3 py-2 transition-colors"
                    >
                      {t('view_details')}
                    </Link>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-center text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
                    >
                      {t('how_to_get')}
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
