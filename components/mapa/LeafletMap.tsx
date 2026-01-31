'use client'

import { useEffect, useRef, useState } from 'react'
import type { Area } from '@/types/database.types'
import { BuscadorGeografico } from './BuscadorGeografico'
import Supercluster from 'supercluster'

// Importar Leaflet solo en cliente
let L: any = null

if (typeof window !== 'undefined') {
  L = require('leaflet')
  require('leaflet/dist/leaflet.css')
}

interface LeafletMapProps {
  areas: Area[]
  areaSeleccionada: Area | null
  onAreaClick: (area: Area) => void
  mapRef?: React.MutableRefObject<any>
  onCountryChange?: (country: string, previousCountry: string | null) => void
  currentCountry?: string
  estilo?: 'default' | 'waze' | 'satellite' | 'dark'
  paisFiltro?: string // Filtro de país/región activo
}

export function LeafletMap({ 
  areas, 
  areaSeleccionada, 
  onAreaClick, 
  mapRef: externalMapRef,
  onCountryChange,
  currentCountry,
  estilo = 'default',
  paisFiltro = ''
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const markersRef = useRef<{ [key: string]: any }>({})
  const popupRef = useRef<any>(null)
  const clusterIndexRef = useRef<Supercluster | null>(null)
  const areasMapRef = useRef<Map<string, Area>>(new Map())
  const userMarkerRef = useRef<any>(null)
  const [gpsActive, setGpsActive] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const watchIdRef = useRef<number | null>(null)
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

  // Obtener URL de tiles según estilo
  const getTileUrl = () => {
    const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || 'get_your_own_key'
    switch (estilo) {
      case 'waze': return `https://api.maptiler.com/maps/bright-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
      case 'satellite': return `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
      case 'dark': return `https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
      default: return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }
  }

  // Inicializar Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || !L) return

    console.log('🗺️ Inicializando Leaflet...')

    try {
      const mapInstance = L.map(mapContainerRef.current, {
        center: [40.4168, -3.7038], // Madrid
        zoom: 6,
        zoomControl: true
      })

      // Añadir capa de tiles
      L.tileLayer(getTileUrl(), {
        maxZoom: 19,
        attribution: estilo === 'default' 
          ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          : '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
      }).addTo(mapInstance)

      // Crear popup singleton
      popupRef.current = L.popup({
        maxWidth: 360,
        minWidth: 300,
        closeButton: true,
        autoClose: true,
        closeOnClick: true,
        className: 'leaflet-popup-custom'
      })

      mapInstance.on('load', () => {
        console.log('✅ Leaflet cargado')
      })

      setMap(mapInstance)
      setMapLoaded(true)

      if (externalMapRef) {
        externalMapRef.current = mapInstance
      }

      return () => {
        mapInstance.remove()
      }
    } catch (err) {
      console.error('Error inicializando mapa:', err)
      setError('Error al cargar el mapa')
    }
  }, [estilo])

  // Actualizar mapa de áreas cuando cambian
  useEffect(() => {
    areasMapRef.current.clear()
    areas.forEach(area => areasMapRef.current.set(area.id, area))
  }, [areas])

  // Añadir marcadores CON CLUSTERING
  useEffect(() => {
    if (!map || !mapLoaded || !L) return

    // Limpiar markers existentes
    Object.values(markersRef.current).forEach((m: any) => m.remove())
    markersRef.current = {}

    if (areas.length === 0) {
      clusterIndexRef.current = null
      return
    }

    console.log(`📍 Inicializando clustering para ${areas.length} áreas...`)

    // Crear índice de Supercluster
    const index = new Supercluster({
      radius: 100,
      maxZoom: 13,
      minPoints: 3
    })

    const points: Supercluster.PointFeature<{ areaId: string }>[] = areas.map(area => ({
      type: 'Feature',
      properties: { areaId: area.id },
      geometry: {
        type: 'Point',
        coordinates: [Number(area.longitud), Number(area.latitud)]
      }
    }))

    index.load(points)
    clusterIndexRef.current = index

    const updateMarkers = () => {
      if (!map || !clusterIndexRef.current) return

      const zoom = Math.floor(map.getZoom())
      const bounds = map.getBounds()
      const bbox: [number, number, number, number] = [
        bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()
      ]

      const clusters = clusterIndexRef.current.getClusters(bbox, zoom)

      const neededIds = new Set<string>()
      clusters.forEach(c => {
        if (c.properties.cluster) {
          neededIds.add(`cluster-${c.properties.cluster_id}`)
        } else {
          neededIds.add(`area-${c.properties.areaId}`)
        }
      })

      // Eliminar markers que ya no necesitamos
      Object.keys(markersRef.current).forEach(id => {
        if (!neededIds.has(id)) {
          markersRef.current[id].remove()
          delete markersRef.current[id]
        }
      })

      // Crear markers que faltan
      clusters.forEach(cluster => {
        const [lng, lat] = cluster.geometry.coordinates
        const isCluster = cluster.properties.cluster

        if (isCluster) {
          const id = `cluster-${cluster.properties.cluster_id}`
          if (markersRef.current[id]) return

          const count = cluster.properties.point_count
          const scale = count < 10 ? 22 : count < 50 ? 30 : count < 100 ? 38 : 45

          const icon = L.divIcon({
            html: `<div style="
              width: ${scale}px;
              height: ${scale}px;
              border-radius: 50%;
              background-color: rgba(2, 132, 199, 0.85);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: ${count < 100 ? '14px' : '16px'};
              cursor: pointer;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            ">${count}</div>`,
            className: 'cluster-marker',
            iconSize: [scale, scale],
            iconAnchor: [scale/2, scale/2]
          })

          const marker = L.marker([lat, lng], { icon }).addTo(map)

          marker.on('click', () => {
            const expansionZoom = clusterIndexRef.current!.getClusterExpansionZoom(cluster.properties.cluster_id!)
            map.flyTo([lat, lng], Math.min(expansionZoom, 16), { duration: 0.5 })
          })

          markersRef.current[id] = marker

        } else {
          const areaId = cluster.properties.areaId
          const id = `area-${areaId}`
          if (markersRef.current[id]) return

          const area = areasMapRef.current.get(areaId)
          if (!area) return

          const icon = L.divIcon({
            html: `<div style="
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background-color: ${getTipoAreaColor(area.tipo_area)};
              border: 2px solid white;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>`,
            className: 'area-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })

          const marker = L.marker([lat, lng], { icon }).addTo(map)

          marker.on('click', () => {
            onAreaClick(area)
            
            if (popupRef.current) {
              popupRef.current
                .setLatLng([lat, lng])
                .setContent(createInfoWindowContent(area))
                .openOn(map)
            }
            
            map.panTo([lat, lng])
          })

          markersRef.current[id] = marker
        }
      })
    }

    updateMarkers()

    map.on('moveend', updateMarkers)
    map.on('zoomend', updateMarkers)

    console.log(`✅ Clustering inicializado`)

    return () => {
      map.off('moveend', updateMarkers)
      map.off('zoomend', updateMarkers)
      Object.values(markersRef.current).forEach((m: any) => m.remove())
      markersRef.current = {}
      clusterIndexRef.current = null
    }
  }, [map, mapLoaded, areas, onAreaClick])

  // Actualizar cuando se selecciona un área desde la lista
  useEffect(() => {
    if (!map || !areaSeleccionada || !popupRef.current) return

    const latLng = [Number(areaSeleccionada.latitud), Number(areaSeleccionada.longitud)]
    
    map.flyTo(latLng, 14, { duration: 0.8 })
    
    setTimeout(() => {
      if (popupRef.current && map) {
        popupRef.current
          .setLatLng(latLng)
          .setContent(createInfoWindowContent(areaSeleccionada))
          .openOn(map)
      }
    }, 400)
      
  }, [areaSeleccionada, map])

  // Auto-activar GPS
  useEffect(() => {
    if (map && gpsActive && !watchIdRef.current && navigator.geolocation && L) {
      console.log('🏃 Auto-activando GPS desde localStorage')
      
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude }
          setUserLocation(pos)
          
          if (!userMarkerRef.current) {
            const icon = L.divIcon({
              html: `<div style="
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background-color: #FF6B35;
                border: 3px solid white;
                box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.3);
              "></div>`,
              className: 'gps-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
            userMarkerRef.current = L.marker([pos.lat, pos.lng], { icon }).addTo(map)
            console.log('✅ Marcador GPS creado')
          } else {
            userMarkerRef.current.setLatLng([pos.lat, pos.lng])
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
      if (userMarkerRef.current && map) {
        map.removeLayer(userMarkerRef.current)
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

  // Crear contenido HTML para popup - IGUAL que MapLibre
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
      if (navigator.geolocation && map && L) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const pos = { lat: position.coords.latitude, lng: position.coords.longitude }
            setUserLocation(pos)
            
            if (!userMarkerRef.current) {
              const icon = L.divIcon({
                html: `<div style="
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background-color: #FF6B35;
                  border: 3px solid white;
                  box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.3);
                "></div>`,
                className: 'gps-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })
              userMarkerRef.current = L.marker([pos.lat, pos.lng], { icon }).addTo(map)
              
              map.flyTo([pos.lat, pos.lng], 12, { duration: 1.5 })
            } else {
              userMarkerRef.current.setLatLng([pos.lat, pos.lng])
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
      if (userMarkerRef.current && map) {
        map.removeLayer(userMarkerRef.current)
        userMarkerRef.current = null
      }
      setUserLocation(null)
      setGpsActive(false)
      localStorage.setItem('gpsActive', 'false')
    }
  }

  // Función para restablecer zoom según el filtro activo
  const resetZoom = () => {
    if (!map) return

    const vistas: Record<string, { center: [number, number], zoom: number }> = {
      '': { center: [20, -20], zoom: 2 },
      'REGION_EUROPA': { center: [48, 10], zoom: 4 },
      'REGION_SUDAMERICA': { center: [-15, -60], zoom: 3 },
      'REGION_CENTROAMERICA': { center: [15, -85], zoom: 5 },
      'España': { center: [40.4, -3.7], zoom: 6 },
      'Portugal': { center: [39.4, -8.2], zoom: 6 },
      'Francia': { center: [46.2, 2.2], zoom: 5 },
      'Italia': { center: [41.9, 12.6], zoom: 5 },
      'Alemania': { center: [51.2, 10.5], zoom: 5 },
      'Argentina': { center: [-34, -64], zoom: 4 },
      'Chile': { center: [-33, -71], zoom: 4 },
      'Colombia': { center: [4.6, -74], zoom: 5 },
      'Perú': { center: [-9, -75], zoom: 5 },
      'Uruguay': { center: [-33, -56], zoom: 6 },
      'Ecuador': { center: [-2, -78], zoom: 6 },
      'Paraguay': { center: [-23, -58], zoom: 6 },
      'Costa Rica': { center: [10, -84], zoom: 7 },
      'Panamá': { center: [9, -80], zoom: 7 },
      'Puerto Rico': { center: [18, -66], zoom: 8 }
    }

    const vista = vistas[paisFiltro] || vistas['']
    map.flyTo(vista.center, vista.zoom, { duration: 1.5 })
  }

  if (!L) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Cargando Leaflet...</p>
      </div>
    )
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
        .leaflet-popup-content-wrapper {
          padding: 15px !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
          overflow: hidden !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-popup-close-button {
          font-size: 18px !important;
          width: 28px !important;
          height: 28px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0 !important;
          margin: 8px !important;
          color: #374151 !important;
          background: rgba(255, 255, 255, 0.95) !important;
          border-radius: 50% !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
          line-height: 1 !important;
        }
        .leaflet-popup-close-button:hover {
          background: #f3f4f6 !important;
          color: #111827 !important;
        }
        @media (max-width: 640px) {
          .leaflet-popup-content-wrapper {
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
