'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { track } from '@/lib/analytics/track'
import type { Area } from '@/types/database.types'

interface BuscadorGeograficoProps {
  map: any
  onLocationFound: (location: { lat: number; lng: number; address: string; country: string; countryCode: string; viewport?: any }) => void
  currentCountry?: string
  /** Todas las áreas cargadas para buscar por nombre/ciudad */
  areas?: Area[]
  /** Al seleccionar un área de la base de datos */
  onAreaSelect?: (area: Area) => void
  /** Sincronizar el filtro de texto del panel lateral */
  onSearchQuery?: (query: string) => void
}

function filterAreas(areas: Area[], query: string): Area[] {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []

  return areas
    .filter(
      (area) =>
        area.nombre.toLowerCase().includes(q) ||
        area.ciudad?.toLowerCase().includes(q) ||
        area.provincia?.toLowerCase().includes(q) ||
        area.pais?.toLowerCase().includes(q)
    )
    .sort((a, b) => {
      const aName = a.nombre.toLowerCase()
      const bName = b.nombre.toLowerCase()
      const score = (name: string) => {
        if (name === q) return 0
        if (name.startsWith(q)) return 1
        return 2
      }
      const diff = score(aName) - score(bName)
      return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre)
    })
    .slice(0, 8)
}

export function BuscadorGeografico({
  map,
  onLocationFound,
  areas = [],
  onAreaSelect,
  onSearchQuery,
}: BuscadorGeograficoProps) {
  const [searchValue, setSearchValue] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [areaResults, setAreaResults] = useState<Area[]>([])
  const [placeResults, setPlaceResults] = useState<any[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const placesDivRef = useRef<HTMLDivElement>(null)
  const blurTimeoutRef = useRef<NodeJS.Timeout>()
  const debounceRef = useRef<NodeJS.Timeout>()
  const onLocationFoundRef = useRef(onLocationFound)
  const onAreaSelectRef = useRef(onAreaSelect)
  const onSearchQueryRef = useRef(onSearchQuery)
  const mapRef = useRef(map)
  const autocompleteServiceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)

  useEffect(() => {
    onLocationFoundRef.current = onLocationFound
    onAreaSelectRef.current = onAreaSelect
    onSearchQueryRef.current = onSearchQuery
    mapRef.current = map
  }, [onLocationFound, onAreaSelect, onSearchQuery, map])

  const centerMap = useCallback((lat: number, lng: number, zoom: number) => {
    const mapInstance = mapRef.current
    if (!mapInstance) return

    if (typeof mapInstance.setCenter === 'function' && typeof mapInstance.setZoom === 'function') {
      mapInstance.setCenter({ lat, lng })
      mapInstance.setZoom(zoom)
    } else if (typeof mapInstance.flyTo === 'function' && mapInstance.getCanvas) {
      mapInstance.flyTo({ center: [lng, lat], zoom, duration: 1500 })
    } else if (typeof mapInstance.flyTo === 'function') {
      mapInstance.flyTo([lat, lng], zoom, { duration: 1.5 })
    }
  }, [])

  const closeSearch = useCallback(() => {
    setSearchValue('')
    setAreaResults([])
    setPlaceResults([])
    setShowDropdown(false)
    setIsExpanded(false)
  }, [])

  const ensurePlacesServices = useCallback(() => {
    if (typeof window === 'undefined' || !window.google?.maps?.places) return false

    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
    }

    if (!placesServiceRef.current) {
      const target =
        mapRef.current?.setCenter && mapRef.current?.setZoom
          ? mapRef.current
          : placesDivRef.current
      if (target) {
        placesServiceRef.current = new window.google.maps.places.PlacesService(target)
      }
    }

    return !!(autocompleteServiceRef.current && placesServiceRef.current)
  }, [])

  const processPlace = useCallback(
    (place: any) => {
      if (!place?.geometry?.location) return

      const lat =
        typeof place.geometry.location.lat === 'function'
          ? place.geometry.location.lat()
          : place.geometry.location.lat
      const lng =
        typeof place.geometry.location.lng === 'function'
          ? place.geometry.location.lng()
          : place.geometry.location.lng
      const viewport = place.geometry.viewport
      const address = place.formatted_address || place.name || ''

      const countryComponent = place.address_components?.find((c: any) =>
        c.types.includes('country')
      )

      let calculatedZoom = 12
      if (viewport) {
        const ne = typeof viewport.getNorthEast === 'function' ? viewport.getNorthEast() : viewport
        const sw = typeof viewport.getSouthWest === 'function' ? viewport.getSouthWest() : viewport
        const neLat = typeof ne.lat === 'function' ? ne.lat() : ne.lat
        const swLat = typeof sw.lat === 'function' ? sw.lat() : sw.lat
        const neLng = typeof ne.lng === 'function' ? ne.lng() : ne.lng
        const swLng = typeof sw.lng === 'function' ? sw.lng() : sw.lng
        const maxDiff = Math.max(Math.abs(neLat - swLat), Math.abs(neLng - swLng))

        if (maxDiff > 30) calculatedZoom = 4
        else if (maxDiff > 15) calculatedZoom = 5
        else if (maxDiff > 7) calculatedZoom = 6
        else if (maxDiff > 3) calculatedZoom = 7
        else if (maxDiff > 1.5) calculatedZoom = 8
        else if (maxDiff > 0.7) calculatedZoom = 9
        else if (maxDiff > 0.3) calculatedZoom = 10
        else if (maxDiff > 0.1) calculatedZoom = 12
        else if (maxDiff > 0.05) calculatedZoom = 13
        else calculatedZoom = 14
      }

      centerMap(lat, lng, calculatedZoom)

      onLocationFoundRef.current({
        lat,
        lng,
        address,
        country: countryComponent?.long_name || '',
        countryCode: countryComponent?.short_name || '',
        viewport,
      })

      track('area_search', {
        event_data: {
          query: address,
          country: countryComponent?.long_name || '',
          country_code: countryComponent?.short_name || '',
          source: 'geographic',
        },
      })

      closeSearch()
    },
    [centerMap, closeSearch]
  )

  const processArea = useCallback(
    (area: Area, query: string) => {
      centerMap(area.latitud, area.longitud, 14)
      onAreaSelectRef.current?.(area)
      onSearchQueryRef.current?.(query)

      track('area_search', {
        event_data: {
          query,
          area_id: area.id,
          nombre: area.nombre,
          source: 'database',
        },
      })

      closeSearch()
    },
    [centerMap, closeSearch]
  )

  const fetchPlacePredictions = useCallback((query: string) => {
    if (!ensurePlacesServices()) {
      setPlaceResults([])
      return
    }

    autocompleteServiceRef.current.getPlacePredictions(
      { input: query, types: ['(regions)'] },
      (predictions: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions?.length) {
          setPlaceResults(predictions.slice(0, 6))
        } else {
          setPlaceResults([])
        }
      }
    )
  }, [ensurePlacesServices])

  const selectPlacePrediction = useCallback(
    (prediction: any) => {
      if (!ensurePlacesServices()) return

      placesServiceRef.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['address_components', 'geometry', 'name', 'formatted_address'],
        },
        (place: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            processPlace(place)
          }
        }
      )
    },
    [ensurePlacesServices, processPlace]
  )

  const searchFirstPlace = useCallback(
    (query: string) => {
      if (!ensurePlacesServices()) return

      autocompleteServiceRef.current.getPlacePredictions(
        { input: query, types: ['(regions)'] },
        (predictions: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions?.length) {
            selectPlacePrediction(predictions[0])
          }
        }
      )
    },
    [ensurePlacesServices, selectPlacePrediction]
  )

  // Búsqueda híbrida: áreas en BD + lugares geográficos
  useEffect(() => {
    const query = searchValue.trim()

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setAreaResults([])
      setPlaceResults([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      setAreaResults(filterAreas(areas, query))
      fetchPlacePredictions(query)
      setShowDropdown(true)
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchValue, areas, fetchPlacePredictions])

  const handleEnterSearch = (query: string) => {
    const localAreas = filterAreas(areas, query)
    if (localAreas.length > 0) {
      processArea(localAreas[0], query)
      return
    }

    if (placeResults.length > 0) {
      selectPlacePrediction(placeResults[0])
      return
    }

    searchFirstPlace(query)
  }

  const handleClear = () => {
    onSearchQueryRef.current?.('')
    closeSearch()
  }

  const handleBlur = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    blurTimeoutRef.current = setTimeout(() => {
      setShowDropdown(false)
      if (!searchValue) setIsExpanded(false)
    }, 200)
  }

  const handleFocus = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    setIsExpanded(true)
    if (searchValue.trim().length >= 2) setShowDropdown(true)
  }

  const hasResults = areaResults.length > 0 || placeResults.length > 0
  const showResults = isExpanded && showDropdown && searchValue.trim().length >= 2

  return (
    <div ref={containerRef} className="relative">
      {/* Div oculto para PlacesService en mapas no-Google */}
      <div ref={placesDivRef} className="hidden" aria-hidden="true" />

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <MagnifyingGlassIcon className={`h-5 w-5 ${isExpanded ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value)
            if (!isExpanded) setIsExpanded(true)
          }}
          onFocus={handleFocus}
          placeholder={isExpanded ? 'Área, ciudad o región...' : '¿A dónde ir?'}
          className={`w-full bg-white rounded-lg shadow-lg py-2.5 md:py-3 pl-10 text-sm transition-all
            ${
              isExpanded
                ? 'pr-10 border-2 border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400'
                : 'pr-4 border border-gray-200 hover:shadow-xl hover:border-gray-300 cursor-pointer'
            }`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchValue.trim()) {
              e.preventDefault()
              handleEnterSearch(searchValue.trim())
            }
          }}
          inputMode="text"
          enterKeyHint="search"
        />

        {isExpanded && searchValue && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 z-10"
            aria-label="Limpiar búsqueda"
            type="button"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dropdown híbrido: áreas + lugares */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-[10001] max-h-72 overflow-y-auto">
          {areaResults.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-sky-700 bg-sky-50 border-b border-sky-100">
                Áreas en Furgocasa
              </p>
              {areaResults.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => processArea(area, searchValue.trim())}
                  className="w-full text-left px-3 py-2.5 hover:bg-sky-50 border-b border-gray-50 flex items-start gap-2.5 transition-colors"
                >
                  <span className="text-base mt-0.5 shrink-0">🚐</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900 truncate">{area.nombre}</span>
                    <span className="block text-xs text-gray-500 truncate">
                      {[area.ciudad, area.provincia].filter(Boolean).join(', ')}
                      {area.precio_noche != null && (
                        <span className="ml-1 text-orange-600 font-medium">
                          · {area.precio_noche === 0 ? 'Gratis' : `${area.precio_noche}€/noche`}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {placeResults.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-100">
                Lugares geográficos
              </p>
              {placeResults.map((prediction) => (
                <button
                  key={prediction.place_id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectPlacePrediction(prediction)}
                  className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 flex items-center gap-2.5 transition-colors"
                >
                  <MapPinIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800 truncate">{prediction.description}</span>
                </button>
              ))}
            </div>
          )}

          {!hasResults && (
            <p className="px-3 py-4 text-sm text-gray-500 text-center">No se encontraron resultados</p>
          )}
        </div>
      )}

      {isExpanded && (
        <p className="hidden md:block text-[11px] text-gray-500 mt-1 px-2 bg-white/80 rounded py-0.5">
          Busca áreas de autocaravanas o ciudades y regiones
        </p>
      )}
    </div>
  )
}
