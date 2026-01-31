'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer'
import Supercluster from 'supercluster'
import type { Area } from '@/types/database.types'
import { BuscadorGeografico } from './BuscadorGeografico'

interface MapLibreMapProps {
  areas: Area[]
  areaSeleccionada: Area | null
  onAreaClick: (area: Area) => void
  mapRef?: React.MutableRefObject<any>
  onCountryChange?: (country: string, previousCountry: string | null) => void
  currentCountry?: string
  estilo?: 'default' | 'waze' | 'satellite' | 'dark'
}

export function MapLibreMap({ 
  areas, 
  areaSeleccionada, 
  onAreaClick, 
  mapRef: externalMapRef,
  onCountryChange,
  currentCountry,
  estilo = 'default'
}: MapLibreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<maplibregl.Map | null>(null)
  const [error, setError] = useState<string | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const markerIdsRef = useRef<string[]>([])
  const popupRef = useRef<maplibregl.Popup | null>(null) // Popup singleton como InfoWindow
  const clusterMarkersRef = useRef<maplibregl.Marker[]>([])
  const clusterIndexRef = useRef<Supercluster | null>(null)
  const userMarkerRef = useRef<maplibregl.Marker | null>(null)
  const [gpsActive, setGpsActive] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const [showInfoTooltip, setShowInfoTooltip] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Handler para búsqueda geográfica
  const handleLocationFound = (location: { lat: number; lng: number; address: string; country: string; countryCode: string }) => {
    console.log('📍 Nueva ubicación seleccionada:', location)
    
    if (onCountryChange && location.country && currentCountry !== location.country) {
      onCountryChange(location.country, currentCountry || null)
    }
  }

  // Cargar estado del GPS desde localStorage
  useEffect(() => {
    const savedGpsState = localStorage.getItem('gpsActive') === 'true'
    if (savedGpsState) {
      setGpsActive(true)
    }
  }, [])

  // Obtener URL de estilo
  const getStyleUrl = () => {
    const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || 'get_your_own_key'
    switch (estilo) {
      case 'waze': return `https://api.maptiler.com/maps/bright-v2/style.json?key=${MAPTILER_KEY}`
      case 'satellite': return `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`
      case 'dark': return `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`
      default: return `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
    }
  }

  // Inicializar MapLibre
  useEffect(() => {
    if (!mapContainerRef.current) return

    console.log('🗺️ Inicializando MapLibre GL...')

    try {
      const mapInstance = new maplibregl.Map({
        container: mapContainerRef.current,
        style: getStyleUrl(),
        center: [-3.7038, 40.4168], // Madrid
        zoom: 6,
        attributionControl: false
      })

      // Añadir controles
      mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right')
      mapInstance.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

      // Crear popup singleton (como InfoWindow de Google)
      popupRef.current = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: true,
        maxWidth: '360px',
        className: 'maplibre-popup-custom'
      })

      mapInstance.on('load', () => {
        console.log('✅ MapLibre cargado')
        setMapLoaded(true)
      })

      setMap(mapInstance)

      if (externalMapRef) {
        externalMapRef.current = mapInstance
      }

      return () => {
        if (popupRef.current) popupRef.current.remove()
        mapInstance.remove()
      }
    } catch (err) {
      console.error('Error inicializando mapa:', err)
      setError('Error al cargar el mapa')
    }
  }, [estilo])

  // Añadir marcadores - IGUAL que Google Maps (incremental)
  useEffect(() => {
    if (!map || !mapLoaded) return

    // Si no hay áreas, limpiar markers
    if (areas.length === 0) {
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []
      markerIdsRef.current = []
      clusterMarkersRef.current.forEach(m => m.remove())
      clusterMarkersRef.current = []
      clusterIndexRef.current = null
      return
    }

    // Reset si cambiaron los filtros (ids diferentes)
    const nextIds = areas.map((area) => area.id)
    const prevIds = markerIdsRef.current
    const idsIguales = prevIds.length === nextIds.length && prevIds.every((id, index) => id === nextIds[index])

    if (!idsIguales) {
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []
      markerIdsRef.current = []
      clusterMarkersRef.current.forEach(m => m.remove())
      clusterMarkersRef.current = []
    }

    // Número de markers existentes
    const existingCount = markersRef.current.length

    // Si ya tenemos todos los markers, no hacer nada
    if (existingCount === areas.length) return

    // Solo crear markers para las áreas NUEVAS
    const newAreas = areas.slice(existingCount)
    console.log(`📍 Añadiendo ${newAreas.length} markers nuevos (total: ${areas.length}, existentes: ${existingCount})`)

    const newMarkers = newAreas.map((area) => {
      const el = document.createElement('div')
      el.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${getTipoAreaColor(area.tipo_area)};
        border: 2px solid white;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([Number(area.longitud), Number(area.latitud)])
        .addTo(map)

      // Evento click - IGUAL que Google Maps
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        
        // Notificar al componente padre
        onAreaClick(area)
        
        // Mostrar popup singleton
        if (popupRef.current) {
          const content = createInfoWindowContent(area)
          popupRef.current
            .setLngLat([Number(area.longitud), Number(area.latitud)])
            .setHTML(content)
            .addTo(map)
        }
        
        // Centrar mapa
        map.panTo([Number(area.longitud), Number(area.latitud)])
      })

      return marker
    })

    // Añadir los nuevos markers al array existente
    markersRef.current = [...markersRef.current, ...newMarkers]
    markerIdsRef.current = [...markerIdsRef.current, ...newAreas.map((area) => area.id)]

    console.log(`✅ Total markers en mapa: ${markersRef.current.length}`)

    // Cleanup
    return () => {
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []
      markerIdsRef.current = []
    }
  }, [map, mapLoaded, areas, onAreaClick])

  // Actualizar cuando se selecciona un área desde la lista - IGUAL que Google Maps
  useEffect(() => {
    if (!map || !areaSeleccionada || !popupRef.current) return

    // Buscar el marcador correspondiente
    const markerIndex = markerIdsRef.current.indexOf(areaSeleccionada.id)
    
    // Centrar mapa
    map.flyTo({
      center: [Number(areaSeleccionada.longitud), Number(areaSeleccionada.latitud)],
      zoom: 14,
      duration: 800
    })
    
    // Mostrar popup
    const content = createInfoWindowContent(areaSeleccionada)
    popupRef.current
      .setLngLat([Number(areaSeleccionada.longitud), Number(areaSeleccionada.latitud)])
      .setHTML(content)
      .addTo(map)
      
  }, [areaSeleccionada, map])

  // Auto-activar GPS
  useEffect(() => {
    if (map && gpsActive && !watchIdRef.current && navigator.geolocation) {
      console.log('🏃 Auto-activando GPS desde localStorage')
      
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude }
          setUserLocation(pos)
          
          if (!userMarkerRef.current) {
            const el = document.createElement('div')
            el.style.cssText = `
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background-color: #FF6B35;
              border: 3px solid white;
              box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.3);
            `
            userMarkerRef.current = new maplibregl.Marker({ element: el })
              .setLngLat([pos.lng, pos.lat])
              .addTo(map)
            console.log('✅ Marcador GPS creado')
          } else {
            userMarkerRef.current.setLngLat([pos.lng, pos.lat])
          }
        },
        (error) => {
          console.error('Error GPS:', error)
          setGpsActive(false)
          localStorage.setItem('gpsActive', 'false')
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      )
      watchIdRef.current = watchId
    }
  }, [map, gpsActive])

  // Limpiar GPS al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
      }
    }
  }, [])

  const getTipoAreaColor = (tipo: string): string => {
    const colors: Record<string, string> = {
      publica: '#0284c7',
      privada: '#FF6B35',
      camping: '#52B788',
      parking: '#F4A261',
    }
    return colors[tipo] || '#0284c7'
  }

  // Crear contenido HTML para popup - EXACTAMENTE IGUAL que Google Maps
  const createInfoWindowContent = (area: Area): string => {
    const tipoLabels: Record<string, string> = {
      publica: 'Pública',
      privada: 'Privada',
      camping: 'Camping',
      parking: 'Parking'
    }

    const serviciosIconos: Record<string, { icon: string; label: string }> = {
      agua: { icon: '💧', label: 'Agua' },
      electricidad: { icon: '⚡', label: 'Electricidad' },
      vaciado_aguas_negras: { icon: '♻️', label: 'Vaciado' },
      wifi: { icon: '📶', label: 'WiFi' },
      duchas: { icon: '🚿', label: 'Duchas' },
      wc: { icon: '🚻', label: 'WC' },
    }

    const serviciosDisponibles = area.servicios && typeof area.servicios === 'object' 
      ? Object.entries(area.servicios)
          .filter(([key, value]) => value === true)
          .map(([key]) => serviciosIconos[key])
          .filter(Boolean)
      : []

    const mostrarServicios = serviciosDisponibles.slice(0, 6)

    return `
      <div style="max-width: 340px; font-family: system-ui, -apple-system, sans-serif;">
        ${area.foto_principal ? `
          <div style="margin: -15px -15px 12px -15px; height: 160px; overflow: hidden;">
            <img src="${area.foto_principal}" alt="${area.nombre}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none'"/>
            ${area.google_rating ? `<div style="position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.95); padding: 4px 8px; border-radius: 12px; font-weight: 700; font-size: 13px;">⭐ ${area.google_rating}</div>` : ''}
          </div>
        ` : ''}
        
        <div style="padding: 0 4px;">
          <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #111827;">${area.nombre}</h3>
          
          ${area.ciudad || area.provincia ? `
            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 13px;">📍 ${[area.ciudad, area.provincia].filter(Boolean).join(', ')}</p>
          ` : ''}

          <div style="display: flex; gap: 6px; margin: 8px 0; flex-wrap: wrap;">
            <span style="background: ${getTipoAreaColor(area.tipo_area)}20; color: ${getTipoAreaColor(area.tipo_area)}; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">
              ${tipoLabels[area.tipo_area] || 'Pública'}
            </span>
            ${area.precio_noche !== null && area.precio_noche !== undefined ? `
              <span style="background: #F3F4F6; color: #374151; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                ${area.precio_noche === 0 ? '🎉 Gratis' : `💰 ${area.precio_noche}€/noche`}
              </span>
            ` : ''}
          </div>

          ${mostrarServicios.length > 0 ? `
            <div style="background: #F8FAFC; border-radius: 8px; padding: 8px; margin: 8px 0;">
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${mostrarServicios.map((s: any) => `<span style="font-size: 12px;">${s.icon} ${s.label}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 12px;">
            <a href="/area/${area.slug}" style="text-align: center; background: #0284c7; color: white; padding: 10px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">Ver Detalles</a>
            <a href="${area.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${area.latitud},${area.longitud}`}" target="_blank" style="text-align: center; background: #34A853; color: white; padding: 10px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">Google Maps</a>
          </div>
        </div>
      </div>
    `
  }

  // Función para activar/desactivar GPS
  const toggleGPS = () => {
    if (!gpsActive) {
      if (navigator.geolocation && map) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const pos = { lat: position.coords.latitude, lng: position.coords.longitude }
            setUserLocation(pos)
            
            if (!userMarkerRef.current) {
              const el = document.createElement('div')
              el.style.cssText = `
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background-color: #FF6B35;
                border: 3px solid white;
                box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.3);
              `
              userMarkerRef.current = new maplibregl.Marker({ element: el })
                .setLngLat([pos.lng, pos.lat])
                .addTo(map)
              
              // Centrar mapa
              map.flyTo({ center: [pos.lng, pos.lat], zoom: 12, duration: 1500 })
            } else {
              userMarkerRef.current.setLngLat([pos.lng, pos.lat])
            }
          },
          (error) => {
            console.error('Error GPS:', error)
            alert('No se pudo obtener tu ubicación')
            setGpsActive(false)
            localStorage.setItem('gpsActive', 'false')
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        )
        watchIdRef.current = watchId
        setGpsActive(true)
        localStorage.setItem('gpsActive', 'true')
      }
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
        userMarkerRef.current = null
      }
      setUserLocation(null)
      setGpsActive(false)
      localStorage.setItem('gpsActive', 'false')
    }
  }

  // Función para restablecer zoom
  const resetZoom = () => {
    if (map) {
      map.flyTo({ center: [-3.7038, 40.4168], zoom: 6, duration: 1500 })
    }
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-6">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Estilos para popup */}
      <style jsx global>{`
        .maplibregl-popup-content {
          padding: 15px !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
          overflow: hidden !important;
        }
        .maplibregl-popup-close-button {
          font-size: 20px !important;
          padding: 4px 8px !important;
          color: #666 !important;
        }
        .maplibregl-popup-close-button:hover {
          background: #f3f4f6 !important;
        }
        @media (max-width: 640px) {
          .maplibregl-popup-content {
            max-width: 90vw !important;
          }
        }
      `}</style>

      {/* Mapa */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px]" />

      {/* Buscador Geográfico */}
      {mapLoaded && (
        <div className="absolute top-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 w-56 md:w-80 z-[1000]">
          <BuscadorGeografico
            map={map}
            onLocationFound={handleLocationFound}
            currentCountry={currentCountry}
          />
        </div>
      )}

      {/* Botón GPS */}
      <button
        onClick={toggleGPS}
        className={`absolute bottom-20 md:bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg font-semibold transition-all z-[1000] flex items-center gap-2 mb-16 md:mb-0 ${
          gpsActive ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm">{gpsActive ? 'GPS Activo' : 'Ver ubicación'}</span>
      </button>

      {/* Botón Restablecer Zoom */}
      <button
        onClick={resetZoom}
        className="absolute bottom-6 md:bottom-6 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-50 active:scale-95 transition-all z-[1000] flex items-center gap-2 font-semibold text-gray-700 mb-16 md:mb-0"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
        <span className="text-sm">Restablecer Zoom</span>
      </button>
    </div>
  )
}
