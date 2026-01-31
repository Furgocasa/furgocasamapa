'use client'

import { useEffect, useRef, useState } from 'react'
import type { Area } from '@/types/database.types'
import { BuscadorGeografico } from './BuscadorGeografico'

// Importar Leaflet solo en cliente
let L: any = null
let MarkerClusterGroup: any = null

if (typeof window !== 'undefined') {
  L = require('leaflet')
  require('leaflet/dist/leaflet.css')
  
  // Importar Leaflet.markercluster (TEMPORALMENTE COMENTADO PARA BUILD)
  try {
    require('leaflet.markercluster')
    require('leaflet.markercluster/dist/MarkerCluster.css')
    require('leaflet.markercluster/dist/MarkerCluster.Default.css')
  } catch (e) {
    console.warn('⚠️ leaflet.markercluster no disponible, usando marcadores sin clustering')
  }
  
  // Fix para los iconos de Leaflet (problema conocido con webpack)
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

interface LeafletMapProps {
  areas: Area[]
  areaSeleccionada: Area | null
  onAreaClick: (area: Area) => void
  mapRef?: React.MutableRefObject<any>
  onCountryChange?: (country: string, previousCountry: string | null) => void
  currentCountry?: string
  estilo?: 'default' | 'waze' | 'satellite' | 'dark'
}

export function LeafletMap({ 
  areas, 
  areaSeleccionada, 
  onAreaClick, 
  mapRef: externalMapRef,
  onCountryChange,
  currentCountry,
  estilo = 'default'
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerClusterGroupRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [gpsActive, setGpsActive] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // ✅ CRÍTICO 4: GPS persiste en localStorage
  useEffect(() => {
    const gpsStored = localStorage.getItem('gps_active')
    if (gpsStored === 'true') {
      setGpsActive(true)
    }
  }, [])

  // Obtener URL de tiles según estilo
  const getTileUrl = () => {
    const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || 'get_your_own_key'
    
    switch (estilo) {
      case 'waze':
        // Estilo minimalista tipo Waze con colores vibrantes
        return `https://api.maptiler.com/maps/bright-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
      case 'satellite':
        // Vista satélite híbrida
        return `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
      case 'dark':
        // Modo oscuro
        return `https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
      case 'default':
      default:
        // Estilo estándar OpenStreetMap
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }
  }

  const getTileOptions = () => {
    const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || 'get_your_own_key'
    
    const baseOptions = {
      maxZoom: 19,
    }

    if (estilo === 'default') {
      return {
        ...baseOptions,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    }

    return {
      ...baseOptions,
      attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
    }
  }

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || !L) return

    console.log('🗺️ Inicializando Leaflet...')

    // Crear mapa
    const map = L.map(mapContainerRef.current, {
      center: [40.4168, -3.7038], // Madrid
      zoom: 6,
      zoomControl: true,
      scrollWheelZoom: true, // ✅ Zoom bidireccional con scroll
      doubleClickZoom: true,
      touchZoom: true,
    })

    // Añadir capa de tiles
    L.tileLayer(getTileUrl(), getTileOptions()).addTo(map)

    mapRef.current = map

    // Pasar referencia al padre
    if (externalMapRef) {
      externalMapRef.current = map
    }

    setMapLoaded(true)
    console.log('✅ Leaflet cargado')

    return () => {
      map.remove()
    }
  }, [estilo])

  // Añadir marcadores (SIN CLUSTERING por ahora - pendiente npm install)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !L) return

    console.log(`📍 Añadiendo ${areas.length} marcadores a Leaflet...`)

    // ✅ CRÍTICO: Limpiar marcadores anteriores SIEMPRE
    if (markerClusterGroupRef.current?.markers) {
      markerClusterGroupRef.current.markers.forEach((m: any) => m.remove())
    }
    markerClusterGroupRef.current = null

    // Si no hay áreas, terminar aquí (mapa limpio)
    if (areas.length === 0) {
      console.log('✅ Mapa limpio (sin áreas)')
      return
    }

    // Crear marcadores directamente (sin clustering)
    const markers: any[] = []
    
    areas.forEach(area => {
      const iconHtml = `
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: ${getTipoAreaColor(area.tipo_area)};
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const marker = L.marker([area.latitud, area.longitud], { icon: customIcon })
        .addTo(mapRef.current)
        .bindPopup(createPopupContent(area), {
          maxWidth: 360,
          minWidth: 300,
          closeButton: true,
          closeOnClick: true,
          autoClose: true,
          autoPan: true,
          autoPanPadding: [50, 50],
          className: 'leaflet-popup-custom'
        })
        .on('click', () => {
          // ✅ CRÍTICO 5 & 6: Solo hacer click, sin zoom ni delays
          onAreaClick(area)
        })

      markers.push(marker)
    })

    // Guardar referencia para limpieza
    markerClusterGroupRef.current = { markers }

    console.log(`✅ ${areas.length} marcadores añadidos (sin clustering - pendiente instalación)`)

    return () => {
      if (markerClusterGroupRef.current?.markers) {
        markerClusterGroupRef.current.markers.forEach((m: any) => m.remove())
      }
    }

  }, [areas, mapLoaded, onAreaClick])

  // ✅ CRÍTICO 5 & 6: Centrar en área seleccionada (sin zoom, sin delay, con panTo)
  useEffect(() => {
    if (!mapRef.current || !areaSeleccionada) return

    // Usar panTo en lugar de flyTo (más rápido, sin animación larga)
    mapRef.current.panTo([areaSeleccionada.latitud, areaSeleccionada.longitud])
  }, [areaSeleccionada])

  // Handler para búsqueda geográfica
  const handleLocationFound = (location: { lat: number; lng: number; address: string; country: string; countryCode: string }) => {
    if (!mapRef.current) return

    console.log('📍 Búsqueda: volando a', location)

    mapRef.current.flyTo([location.lat, location.lng], 12, {
      duration: 1.5
    })

    // Notificar cambio de país si aplica
    if (onCountryChange && location.country && currentCountry !== location.country) {
      onCountryChange(location.country, currentCountry || null)
    }
  }

  const getTipoAreaColor = (tipo: string): string => {
    const colors: Record<string, string> = {
      publica: '#0284c7',
      privada: '#FF6B35',
      camping: '#52B788',
      parking: '#F4A261',
    }
    return colors[tipo] || '#0284c7'
  }

  const createPopupContent = (area: Area): string => {
    // Servicios disponibles
    const serviciosIconos: Record<string, { icon: string; label: string }> = {
      agua: { icon: '💧', label: 'Agua' },
      electricidad: { icon: '⚡', label: 'Electricidad' },
      vaciado_aguas_negras: { icon: '♻️', label: 'Vaciado' },
      vaciado_aguas_grises: { icon: '🚰', label: 'Aguas Grises' },
      wifi: { icon: '📶', label: 'WiFi' },
      duchas: { icon: '🚿', label: 'Duchas' },
      wc: { icon: '🚻', label: 'WC' },
      lavanderia: { icon: '🧺', label: 'Lavandería' },
      restaurante: { icon: '🍽️', label: 'Restaurante' },
      supermercado: { icon: '🛒', label: 'Supermercado' },
      zona_mascotas: { icon: '🐕', label: 'Mascotas' }
    }

    const tipoLabels: Record<string, string> = {
      publica: 'Pública',
      privada: 'Privada',
      camping: 'Camping',
      parking: 'Parking'
    }

    const serviciosDisponibles = area.servicios
      ? Object.entries(area.servicios)
          .filter(([_, value]) => value === true)
          .map(([key, _]) => serviciosIconos[key])
          .filter(Boolean)
      : []

    const mostrarServicios = serviciosDisponibles.slice(0, 6)
    const serviciosRestantes = serviciosDisponibles.length - 6

    return `
      <div style="max-width: 360px; font-family: system-ui, -apple-system, sans-serif;">
        ${area.foto_principal ? `
          <div style="margin: -20px -20px 12px -20px; width: calc(100% + 40px); height: 180px; overflow: hidden; position: relative;">
            <img 
              src="${area.foto_principal}" 
              alt="${area.nombre}"
              style="width: 100%; height: 100%; object-fit: cover;"
              onerror="this.style.display='none'"
            />
            ${area.google_rating ? `
              <div style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; background: rgba(255, 255, 255, 0.95); padding: 6px 12px; border-radius: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); backdrop-filter: blur(4px);">
                <span style="color: #F59E0B; font-size: 16px; margin-right: 4px;">⭐</span>
                <span style="font-weight: 700; font-size: 15px; color: #111827;">${area.google_rating}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <div style="padding: ${area.foto_principal ? '0' : '8px 0'};">
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #111827; line-height: 1.3;">
            ${area.nombre}
          </h3>

          ${area.ciudad || area.provincia ? `
            <div style="display: flex; align-items: center; color: #6B7280; font-size: 14px; margin-bottom: 10px;">
              <svg style="width: 16px; height: 16px; margin-right: 6px; flex-shrink: 0;" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              <span>${[area.ciudad, area.provincia].filter(Boolean).join(', ')}</span>
            </div>
          ` : ''}

          ${area.descripcion ? `
            <p style="margin: 0 0 12px 0; color: #4B5563; font-size: 14px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${area.descripcion.replace(/'/g, "&#39;")}
            </p>
          ` : ''}

          <div style="display: flex; gap: 6px; margin: 12px 0; flex-wrap: wrap;">
            <span style="background: ${getTipoAreaColor(area.tipo_area)}20; color: ${getTipoAreaColor(area.tipo_area)}; padding: 6px 12px; border-radius: 14px; font-size: 12px; font-weight: 600; border: 1px solid ${getTipoAreaColor(area.tipo_area)}30;">
              ${tipoLabels[area.tipo_area] || 'Pública'}
            </span>
            ${area.precio_noche !== null && area.precio_noche !== undefined ? `
              <span style="background: #F3F4F6; color: #374151; padding: 6px 12px; border-radius: 14px; font-size: 12px; font-weight: 600; border: 1px solid #E5E7EB;">
                ${area.precio_noche === 0 ? '🎉 Gratis' : `💰 ${area.precio_noche}€/noche`}
              </span>
            ` : ''}
            ${area.verificado ? `
              <span style="background: #D1FAE5; color: #059669; padding: 6px 12px; border-radius: 14px; font-size: 12px; font-weight: 600; border: 1px solid #A7F3D0;">
                ✓ Verificado
              </span>
            ` : ''}
          </div>

          ${mostrarServicios.length > 0 ? `
            <div style="background: #F9FAFB; border-radius: 12px; padding: 12px; margin: 12px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <svg style="width: 16px; height: 16px; margin-right: 6px; color: #6B7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span style="font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Servicios Disponibles</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                ${mostrarServicios.map((s: any) => `
                  <div style="display: flex; align-items: center; font-size: 11px; color: #6B7280;">
                    <span style="font-size: 16px; margin-right: 4px;">${s.icon}</span>
                    <span>${s.label}</span>
                  </div>
                `).join('')}
              </div>
              ${serviciosRestantes > 0 ? `
                <div style="margin-top: 8px; text-align: center; font-size: 11px; color: #0284c7; font-weight: 600;">
                  +${serviciosRestantes} servicio${serviciosRestantes > 1 ? 's' : ''} más
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px;">
            <a 
              href="/area/${area.slug}"
              style="text-align: center; background: #0284c7; color: white; padding: 12px 16px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.3);"
              onmouseover="this.style.background='#0369a1'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 6px rgba(2, 132, 199, 0.4)'"
              onmouseout="this.style.background='#0284c7'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(2, 132, 199, 0.3)'"
            >
              <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              Ver Detalles
            </a>
            
            ${area.google_maps_url || (area.latitud && area.longitud) ? `
              <a 
                href="${area.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${area.latitud},${area.longitud}`}"
                target="_blank"
                rel="noopener noreferrer"
                style="text-align: center; background: #34A853; color: white; padding: 12px 16px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(52, 168, 83, 0.3);"
                onmouseover="this.style.background='#2d8e47'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 6px rgba(52, 168, 83, 0.4)'"
                onmouseout="this.style.background='#34A853'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(52, 168, 83, 0.3)'"
              >
                <svg style="width: 16px; height: 16px;" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                </svg>
                Google Maps
              </a>
            ` : ''}
          </div>

          <!-- ✅ CRÍTICO 7: Botones secundarios Favorito + Registrar Visita -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
            <button
              onclick="alert('Funcionalidad de favoritos próximamente')"
              style="text-align: center; background: #F3F4F6; color: #374151; padding: 10px 12px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s; border: 1px solid #E5E7EB; cursor: pointer;"
              onmouseover="this.style.background='#E5E7EB'; this.style.borderColor='#D1D5DB'"
              onmouseout="this.style.background='#F3F4F6'; this.style.borderColor='#E5E7EB'"
            >
              <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              Favorito
            </button>
            
            <button
              onclick="alert('Funcionalidad de registro próximamente')"
              style="text-align: center; background: #F3F4F6; color: #374151; padding: 10px 12px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s; border: 1px solid #E5E7EB; cursor: pointer;"
              onmouseover="this.style.background='#E5E7EB'; this.style.borderColor='#D1D5DB'"
              onmouseout="this.style.background='#F3F4F6'; this.style.borderColor='#E5E7EB'"
            >
              <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Registrar Visita
            </button>
          </div>
        </div>
      </div>
    `
  }

  // Función GPS - Igual que Google Maps y MapLibre
  const toggleGPS = () => {
    if (!gpsActive && L) {
      // Activar GPS
      if (navigator.geolocation && mapRef.current) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            setUserLocation(pos)
            
            // Crear o actualizar marcador de usuario
            if (!userMarkerRef.current) {
              // ✅ CRÍTICO 3: Color GPS naranja + 24px
              const gpsIcon = L.divIcon({
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

              userMarkerRef.current = L.marker([pos.lat, pos.lng], { icon: gpsIcon })
                .addTo(mapRef.current)
              
              // Solo centrar cuando se activa manualmente (no desde localStorage)
              const gpsFromStorage = localStorage.getItem('gps_active') === 'true'
              if (!gpsFromStorage) {
                mapRef.current.flyTo([pos.lat, pos.lng], 14, {
                  duration: 1.5
                })
              }
            } else {
              // Actualizar posición
              userMarkerRef.current.setLatLng([pos.lat, pos.lng])
            }
          },
          (error) => {
            console.error('Error GPS:', error)
            alert('No se pudo obtener tu ubicación. Verifica los permisos.')
          },
          {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 5000
          }
        )
        watchIdRef.current = watchId
        setGpsActive(true)
        localStorage.setItem('gps_active', 'true') // ✅ Guardar estado
      }
    } else {
      // Desactivar GPS
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (userMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current)
        userMarkerRef.current = null
      }
      setGpsActive(false)
      setUserLocation(null)
      localStorage.setItem('gps_active', 'false') // ✅ Guardar estado
    }
  }

  // Función restablecer zoom - Igual que Google Maps
  const resetZoom = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([40.4168, -3.7038], 6, {
        duration: 1.5
      })
    }
  }

  // Limpiar GPS al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (userMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current)
      }
    }
  }, [])

  if (!L) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Cargando Leaflet...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Estilos personalizados para popups de Leaflet */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          padding: 0 !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
          overflow: hidden !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
          max-width: 380px !important;
        }
        .leaflet-popup-close-button {
          font-size: 24px !important;
          width: 32px !important;
          height: 32px !important;
          color: #6B7280 !important;
          background: white !important;
          border-radius: 50% !important;
          right: 12px !important;
          top: 12px !important;
          z-index: 10 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
          transition: all 0.2s !important;
          padding: 0 !important;
          line-height: 32px !important;
        }
        .leaflet-popup-close-button:hover {
          background: #F3F4F6 !important;
          color: #111827 !important;
          transform: scale(1.1) !important;
        }
        .leaflet-popup-tip {
          background: white !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
        .leaflet-popup-custom .leaflet-popup-content-wrapper {
          max-width: 380px !important;
        }
      `}</style>

      {/* Contenedor del mapa */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full min-h-[400px]"
        style={{ touchAction: 'none' }}
      />

      {/* Buscador Geográfico - Igual que en Google Maps */}
      {mapLoaded && (
        <div className="absolute top-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 w-56 md:w-80 z-[1000]">
          <BuscadorGeografico
            map={mapRef.current}
            onLocationFound={handleLocationFound}
            currentCountry={currentCountry}
          />
        </div>
      )}

      {/* Contador de áreas */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 z-[1000]">
        <p className="text-sm font-semibold text-gray-700">
          {areas.length} {areas.length === 1 ? 'área' : 'áreas'}
        </p>
      </div>

      {/* Botón GPS - Igual que Google Maps */}
      <button
        onClick={() => toggleGPS()}
        className={`absolute bottom-20 md:bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg font-semibold transition-all z-[1000] flex items-center gap-2 mb-16 md:mb-0 ${
          gpsActive
            ? 'bg-orange-500 text-white hover:bg-orange-600'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        aria-label={gpsActive ? "Desactivar GPS" : "Activar GPS"}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="text-sm">{gpsActive ? 'GPS Activo' : 'Ver ubicación'}</span>
      </button>

      {/* Botón Restablecer Zoom - Igual que Google Maps */}
      <button
        onClick={resetZoom}
        className="absolute bottom-6 md:bottom-6 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-50 active:scale-95 transition-all z-[1000] flex items-center gap-2 font-semibold text-gray-700 mb-16 md:mb-0"
        aria-label="Restablecer zoom"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
          />
        </svg>
        <span className="text-sm">Restablecer Zoom</span>
      </button>
    </div>
  )
}
