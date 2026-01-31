'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
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
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({})
  const clusterIndexRef = useRef<Supercluster | null>(null)
  const userMarkerRef = useRef<maplibregl.Marker | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const isUpdatingRef = useRef(false)
  
  // ✅ NUEVO: Popup singleton como Google Maps InfoWindow
  const popupRef = useRef<maplibregl.Popup | null>(null)
  // ✅ NUEVO: Mapa de áreas para acceso rápido por ID
  const areasMapRef = useRef<Map<string, Area>>(new Map())
  // ✅ NUEVO: Bandera para evitar updateMarkers durante interacciones
  const isInteractingRef = useRef(false)
  
  const [mapLoaded, setMapLoaded] = useState(false)
  const [gpsActive, setGpsActive] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showInfoTooltip, setShowInfoTooltip] = useState(false)
  
  // Cargar estado del GPS desde localStorage DESPUÉS de montar (solo cliente)
  useEffect(() => {
    const savedGpsState = localStorage.getItem('gpsActive') === 'true'
    if (savedGpsState) {
      setGpsActive(true)
    }
  }, [])
  
  // ✅ NUEVO: Actualizar mapa de áreas cuando cambian
  useEffect(() => {
    areasMapRef.current.clear()
    areas.forEach(area => {
      areasMapRef.current.set(area.id, area)
    })
  }, [areas])

  // Obtener URL de estilo según configuración
  const getStyleUrl = () => {
    const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || 'get_your_own_key'
    
    switch (estilo) {
      case 'waze':
        // Estilo minimalista tipo Waze con colores vibrantes
        return `https://api.maptiler.com/maps/bright-v2/style.json?key=${MAPTILER_KEY}`
      case 'satellite':
        // Vista satélite híbrida
        return `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`
      case 'dark':
        // Modo oscuro
        return `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`
      case 'default':
      default:
        // Estilo estándar de calles
        return `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
    }
  }

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current) return

    console.log('🗺️ Inicializando MapLibre GL...')

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getStyleUrl(),
      center: [-3.7038, 40.4168], // Madrid (lng, lat - orden inverso a Google)
      zoom: 6,
      attributionControl: false
    })

    // Añadir controles
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(new maplibregl.AttributionControl({
      compact: true
    }), 'bottom-right')

    // ✅ NUEVO: Crear popup singleton (como InfoWindow de Google Maps)
    popupRef.current = new maplibregl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: true,  // ✅ Cerrar al hacer click fuera (sobre el mapa)
      closeOnMove: false,  // No cerrar al mover el mapa
      maxWidth: '360px',
      className: 'maplibre-popup-custom',
      anchor: 'bottom'
    })

    map.on('load', () => {
      console.log('✅ MapLibre cargado')
      setMapLoaded(true)
    })

    mapRef.current = map

    // Pasar referencia al padre
    if (externalMapRef) {
      externalMapRef.current = map
    }

    return () => {
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      map.remove()
    }
  }, [estilo])

  // ✅ NUEVO: Función para mostrar popup singleton (como InfoWindow de Google)
  const showPopup = useCallback((area: Area, lngLat: [number, number]) => {
    if (!mapRef.current || !popupRef.current) return
    
    console.log('📍 Mostrando popup para:', area.nombre)
    
    // Actualizar contenido y posición del popup singleton
    popupRef.current
      .setLngLat(lngLat)
      .setHTML(createPopupContent(area))
      .addTo(mapRef.current)
  }, [])

  // Añadir marcadores CON CLUSTERING cuando el mapa esté listo
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    // Limpiar marcadores anteriores
    Object.values(markersRef.current).forEach(marker => marker.remove())
    markersRef.current = {}
    
    // Si no hay áreas, terminar aquí (mapa limpio)
    if (areas.length === 0) {
      clusterIndexRef.current = null
      return
    }

    console.log(`📍 Inicializando clustering para ${areas.length} áreas...`)

    // Convertir áreas a formato GeoJSON para Supercluster
    const points: Supercluster.PointFeature<{ areaId: string }>[] = areas.map(area => ({
      type: 'Feature',
      properties: { areaId: area.id }, // ✅ Solo guardamos el ID, no el área completa
      geometry: {
        type: 'Point',
        coordinates: [Number(area.longitud), Number(area.latitud)]
      }
    }))

    // Inicializar Supercluster
    const cluster = new Supercluster({
      radius: 100,
      maxZoom: 13,
      minPoints: 3
    })
    cluster.load(points)
    clusterIndexRef.current = cluster

    // ✅ Función para actualizar marcadores según el zoom/bounds
    const updateMarkers = () => {
      if (!mapRef.current || !clusterIndexRef.current) return
      
      // ✅ No actualizar si estamos en medio de una interacción
      if (isInteractingRef.current) {
        console.log('⏸️ Interacción en progreso, posponiendo actualización...')
        return
      }
      
      // Evitar actualizaciones concurrentes
      if (isUpdatingRef.current) return
      isUpdatingRef.current = true

      const map = mapRef.current
      const zoom = Math.floor(map.getZoom())
      const bounds = map.getBounds()
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ]

      // Obtener clusters y puntos para el viewport actual
      const clusters = clusterIndexRef.current.getClusters(bbox, zoom)

      // ✅ NUEVO: Identificar qué marcadores necesitamos
      const neededMarkerIds = new Set<string>()
      
      clusters.forEach(clusterFeature => {
        const isCluster = clusterFeature.properties.cluster
        if (isCluster) {
          neededMarkerIds.add(`cluster-${clusterFeature.properties.cluster_id}`)
        } else {
          neededMarkerIds.add(`area-${clusterFeature.properties.areaId}`)
        }
      })

      // ✅ NUEVO: Eliminar solo los marcadores que ya no necesitamos
      Object.keys(markersRef.current).forEach(id => {
        if (!neededMarkerIds.has(id)) {
          markersRef.current[id].remove()
          delete markersRef.current[id]
        }
      })

      // ✅ NUEVO: Crear solo los marcadores que faltan
      clusters.forEach(clusterFeature => {
        const [lng, lat] = clusterFeature.geometry.coordinates
        const isCluster = clusterFeature.properties.cluster

        if (isCluster) {
          const clusterId = `cluster-${clusterFeature.properties.cluster_id}`
          
          // Si ya existe, no recrear
          if (markersRef.current[clusterId]) return
          
          const count = clusterFeature.properties.point_count
          const scale = count < 10 ? 22 : count < 50 ? 30 : count < 100 ? 38 : 45
          
          const el = document.createElement('div')
          el.className = 'marker-cluster'
          el.style.cssText = `
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
            touch-action: manipulation;
            user-select: none;
            -webkit-user-select: none;
            -webkit-user-drag: none;
            -webkit-tap-highlight-color: transparent;
          `
          el.textContent = count.toString()

          // Click en cluster: hacer zoom
          el.addEventListener('click', (e) => {
            e.stopPropagation()
            const expansionZoom = clusterIndexRef.current!.getClusterExpansionZoom(clusterFeature.properties.cluster_id!)
            map.flyTo({
              center: [lng, lat],
              zoom: Math.min(expansionZoom, 16),
              duration: 500
            })
          })

          const marker = new maplibregl.Marker({ element: el, draggable: false })
            .setLngLat([lng, lat])
            .addTo(map)

          markersRef.current[clusterId] = marker

        } else {
          // Marcador individual
          const areaId = clusterFeature.properties.areaId
          const markerId = `area-${areaId}`
          
          // Si ya existe, no recrear
          if (markersRef.current[markerId]) return
          
          // ✅ Obtener el área desde el mapa de áreas
          const area = areasMapRef.current.get(areaId)
          if (!area) return

          const el = document.createElement('div')
          el.className = 'marker-area'
          el.dataset.areaId = areaId // ✅ Guardar ID en el elemento
          el.style.cssText = `
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: ${getTipoAreaColor(area.tipo_area)};
            border: 2px solid white;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transition: transform 0.15s ease;
            touch-action: manipulation;
            user-select: none;
            -webkit-user-select: none;
            -webkit-user-drag: none;
            -webkit-tap-highlight-color: transparent;
          `
          
          // Hover effect
          el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.2)'
          })
          el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)'
          })

          // ✅ NUEVO: Click handler que usa popup singleton
          el.addEventListener('click', (e) => {
            e.stopPropagation()
            
            // Marcar que estamos interactuando
            isInteractingRef.current = true
            
            // Notificar al padre
            onAreaClick(area)
            
            // Mostrar popup singleton (sin depender del marker)
            showPopup(area, [lng, lat])
            
            // Centrar mapa suavemente
            map.panTo([lng, lat], { duration: 300 })
            
            // Liberar interacción después de que termine la animación
            setTimeout(() => {
              isInteractingRef.current = false
            }, 350)
          })

          const marker = new maplibregl.Marker({ element: el, draggable: false })
            .setLngLat([lng, lat])
            .addTo(map)

          markersRef.current[markerId] = marker
        }
      })

      console.log(`✅ ${Object.keys(markersRef.current).length} marcadores visibles`)
      isUpdatingRef.current = false
    }

    // Actualizar marcadores inicialmente
    updateMarkers()

    // ✅ NUEVO: Debounce para evitar actualizaciones excesivas
    let updateTimeout: NodeJS.Timeout | null = null
    const debouncedUpdate = () => {
      if (updateTimeout) clearTimeout(updateTimeout)
      updateTimeout = setTimeout(updateMarkers, 100)
    }

    mapRef.current.on('moveend', debouncedUpdate)
    mapRef.current.on('zoomend', debouncedUpdate)

    return () => {
      if (updateTimeout) clearTimeout(updateTimeout)
      Object.values(markersRef.current).forEach(marker => marker.remove())
      markersRef.current = {}
      clusterIndexRef.current = null
      isUpdatingRef.current = false
      isInteractingRef.current = false

      if (mapRef.current) {
        mapRef.current.off('moveend', debouncedUpdate)
        mapRef.current.off('zoomend', debouncedUpdate)
      }
    }

  }, [areas, mapLoaded, onAreaClick, showPopup])

  // ✅ NUEVO: Centrar en área seleccionada y abrir popup singleton
  useEffect(() => {
    if (!mapRef.current || !areaSeleccionada || !popupRef.current) return

    console.log('📍 Área seleccionada desde lista:', areaSeleccionada.nombre)
    
    // Marcar que estamos interactuando para evitar updateMarkers
    isInteractingRef.current = true
    
    const lngLat: [number, number] = [
      Number(areaSeleccionada.longitud), 
      Number(areaSeleccionada.latitud)
    ]
    
    // Centrar mapa y hacer zoom
    mapRef.current.flyTo({
      center: lngLat,
      zoom: 14,
      duration: 800
    })
    
    // Mostrar popup singleton después de un pequeño delay para que el mapa se centre
    setTimeout(() => {
      if (popupRef.current && mapRef.current) {
        popupRef.current
          .setLngLat(lngLat)
          .setHTML(createPopupContent(areaSeleccionada))
          .addTo(mapRef.current)
      }
      
      // Liberar interacción después de que termine la animación
      setTimeout(() => {
        isInteractingRef.current = false
      }, 200)
    }, 400)
    
  }, [areaSeleccionada])

  // Handler para búsqueda geográfica
  const handleLocationFound = (location: { lat: number; lng: number; address: string; country: string; countryCode: string }) => {
    if (!mapRef.current) return

    console.log('📍 Búsqueda: volando a', location)

    mapRef.current.flyTo({
      center: [location.lng, location.lat],
      zoom: 12,
      duration: 1500
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
      <div class="popup-container">
        ${area.foto_principal ? `
          <div class="popup-image-container">
            <img 
              src="${area.foto_principal}" 
              alt="${area.nombre}"
              class="popup-image"
              onerror="this.parentElement.style.display='none'"
            />
            ${area.google_rating ? `
              <div class="popup-rating">
                <span class="popup-rating-star">⭐</span>
                <span class="popup-rating-value">${area.google_rating}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <div class="popup-content">
          <h3 class="popup-title">${area.nombre}</h3>

          ${area.ciudad || area.provincia ? `
            <div class="popup-location">
              <svg class="popup-location-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              <span>${[area.ciudad, area.provincia].filter(Boolean).join(', ')}</span>
            </div>
          ` : ''}

          ${area.descripcion ? `
            <p class="popup-description">${area.descripcion.replace(/'/g, "&#39;")}</p>
          ` : ''}

          <div class="popup-badges">
            <span class="popup-badge" style="background: ${getTipoAreaColor(area.tipo_area)}15; color: ${getTipoAreaColor(area.tipo_area)}; border-color: ${getTipoAreaColor(area.tipo_area)}30;">
              ${tipoLabels[area.tipo_area] || 'Pública'}
            </span>
            ${area.precio_noche !== null && area.precio_noche !== undefined ? `
              <span class="popup-badge popup-badge-price">
                ${area.precio_noche === 0 ? '🎉 Gratis' : `💰 ${area.precio_noche}€/noche`}
              </span>
            ` : ''}
            ${area.verificado ? `
              <span class="popup-badge popup-badge-verified">✓ Verificado</span>
            ` : ''}
          </div>

          ${mostrarServicios.length > 0 ? `
            <div class="popup-services">
              <div class="popup-services-header">
                <svg class="popup-services-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Servicios</span>
              </div>
              <div class="popup-services-grid">
                ${mostrarServicios.map((s: any) => `
                  <div class="popup-service-item">
                    <span class="popup-service-icon">${s.icon}</span>
                    <span>${s.label}</span>
                  </div>
                `).join('')}
              </div>
              ${serviciosRestantes > 0 ? `
                <div class="popup-services-more">+${serviciosRestantes} más</div>
              ` : ''}
            </div>
          ` : ''}

          <div class="popup-buttons-primary">
            <a href="/area/${area.slug}" class="popup-btn popup-btn-primary">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                class="popup-btn popup-btn-maps"
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                </svg>
                Google Maps
              </a>
            ` : ''}
          </div>

          <div class="popup-buttons-secondary">
            <a href="/area/${area.slug}" class="popup-btn popup-btn-fav">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
              </svg>
              Favorito
            </a>
            
            <a href="/area/${area.slug}" class="popup-btn popup-btn-visit">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Visita
            </a>
          </div>
        </div>
      </div>
    `
  }

  // Función GPS - Igual que Google Maps
  const toggleGPS = () => {
    if (!gpsActive) {
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
              // ✅ CORREGIDO: Marcador GPS con color NARANJA (#FF6B35) y tamaño 24px
              const el = document.createElement('div')
              el.style.width = '24px' // ✅ CORREGIDO: Era 20px, ahora 24px
              el.style.height = '24px'
              el.style.borderRadius = '50%'
              el.style.backgroundColor = '#FF6B35' // ✅ CORREGIDO: Era azul #4285F4, ahora naranja
              el.style.border = '3px solid white'
              el.style.boxShadow = '0 0 0 4px rgba(255, 107, 53, 0.3)' // ✅ CORREGIDO: Sombra naranja

              userMarkerRef.current = new maplibregl.Marker({ element: el })
                .setLngLat([pos.lng, pos.lat])
                .addTo(mapRef.current!)
              
              // ✅ CORREGIDO: Solo centrar si es activación MANUAL (no auto-activación)
              const savedGpsState = localStorage.getItem('gpsActive') === 'true'
              if (!savedGpsState) {
                // Centrar solo en activación manual
                mapRef.current!.flyTo({
                  center: [pos.lng, pos.lat],
                  zoom: 14,
                  duration: 1500
                })
              }
            } else {
              // Actualizar posición
              userMarkerRef.current.setLngLat([pos.lng, pos.lat])
            }
          },
          (error) => {
            console.error('Error GPS:', error)
            alert('No se pudo obtener tu ubicación. Verifica los permisos.')
            setGpsActive(false)
            localStorage.setItem('gpsActive', 'false') // ✅ Guardar estado
          },
          {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 5000
          }
        )
        watchIdRef.current = watchId
        setGpsActive(true)
        localStorage.setItem('gpsActive', 'true') // ✅ Guardar estado
      }
    } else {
      // Desactivar GPS
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
        userMarkerRef.current = null
      }
      setGpsActive(false)
      setUserLocation(null)
      localStorage.setItem('gpsActive', 'false') // ✅ Guardar estado
    }
  }

  // Función restablecer zoom - Igual que Google Maps
  const resetZoom = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [-3.7038, 40.4168], // Madrid
        zoom: 6,
        duration: 1500
      })
    }
  }

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

  return (
    <div className="relative w-full h-full">
      {/* Estilos personalizados para popups de MapLibre */}
      <style jsx global>{`
        /* ========== CONTENEDOR PRINCIPAL DEL POPUP ========== */
        .maplibregl-popup-content {
          padding: 0 !important;
          border-radius: 20px !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25), 0 8px 20px rgba(0, 0, 0, 0.1) !important;
          overflow: hidden !important;
          max-width: 340px !important;
          width: 340px !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
        }
        
        .maplibregl-popup-close-button {
          font-size: 20px !important;
          width: 36px !important;
          height: 36px !important;
          color: #6B7280 !important;
          background: rgba(255, 255, 255, 0.95) !important;
          border-radius: 50% !important;
          right: 10px !important;
          top: 10px !important;
          z-index: 20 !important;
          box-shadow: 0 2px 12px rgba(0,0,0,0.2) !important;
          transition: all 0.2s ease !important;
          line-height: 34px !important;
          text-align: center !important;
          padding: 0 !important;
          backdrop-filter: blur(8px) !important;
        }
        
        .maplibregl-popup-close-button:hover {
          background: white !important;
          color: #111827 !important;
          transform: scale(1.1) !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25) !important;
        }
        
        .maplibregl-popup-tip {
          border-top-color: white !important;
        }

        /* ========== CONTENEDOR INTERNO ========== */
        .popup-container {
          font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
          max-width: 100%;
          overflow: hidden;
        }

        /* ========== IMAGEN ========== */
        .popup-image-container {
          position: relative;
          width: 100%;
          height: 160px;
          overflow: hidden;
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
        }
        
        .popup-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        
        .popup-rating {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.95);
          padding: 5px 10px;
          border-radius: 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15);
          backdrop-filter: blur(8px);
        }
        
        .popup-rating-star {
          font-size: 14px;
          margin-right: 3px;
        }
        
        .popup-rating-value {
          font-weight: 700;
          font-size: 13px;
          color: #111827;
        }

        /* ========== CONTENIDO ========== */
        .popup-content {
          padding: 16px;
        }
        
        .popup-title {
          margin: 0 0 8px 0;
          font-size: 17px;
          font-weight: 700;
          color: #111827;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .popup-location {
          display: flex;
          align-items: center;
          color: #6B7280;
          font-size: 13px;
          margin-bottom: 8px;
        }
        
        .popup-location-icon {
          width: 14px;
          height: 14px;
          margin-right: 5px;
          flex-shrink: 0;
        }
        
        .popup-description {
          margin: 0 0 10px 0;
          color: #4B5563;
          font-size: 13px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* ========== BADGES ========== */
        .popup-badges {
          display: flex;
          gap: 6px;
          margin: 10px 0;
          flex-wrap: wrap;
        }
        
        .popup-badge {
          padding: 5px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid;
          white-space: nowrap;
        }
        
        .popup-badge-price {
          background: #F3F4F6;
          color: #374151;
          border-color: #E5E7EB;
        }
        
        .popup-badge-verified {
          background: #D1FAE5;
          color: #059669;
          border-color: #A7F3D0;
        }

        /* ========== SERVICIOS ========== */
        .popup-services {
          background: #F8FAFC;
          border-radius: 12px;
          padding: 10px 12px;
          margin: 10px 0;
          border: 1px solid #E2E8F0;
        }
        
        .popup-services-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .popup-services-icon {
          width: 14px;
          height: 14px;
          margin-right: 5px;
          color: #0284c7;
        }
        
        .popup-services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        
        .popup-service-item {
          display: flex;
          align-items: center;
          font-size: 10px;
          color: #64748B;
        }
        
        .popup-service-icon {
          font-size: 13px;
          margin-right: 3px;
        }
        
        .popup-services-more {
          margin-top: 6px;
          text-align: center;
          font-size: 10px;
          color: #0284c7;
          font-weight: 600;
        }

        /* ========== BOTONES ========== */
        .popup-buttons-primary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 12px;
        }
        
        .popup-buttons-secondary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 8px;
        }
        
        .popup-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 10px 12px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 600;
          font-size: 12px;
          transition: all 0.2s ease;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        
        .popup-btn svg {
          width: 14px;
          height: 14px;
        }
        
        .popup-btn-primary {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
        }
        
        .popup-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.45);
        }
        
        .popup-btn-maps {
          background: linear-gradient(135deg, #34A853 0%, #2d8e47 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(52, 168, 83, 0.35);
        }
        
        .popup-btn-maps:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(52, 168, 83, 0.45);
        }
        
        .popup-btn-fav {
          background: #FEF3C7;
          color: #92400E;
          border: 1px solid #FDE68A;
        }
        
        .popup-btn-fav:hover {
          background: #FDE68A;
        }
        
        .popup-btn-visit {
          background: #DBEAFE;
          color: #1E40AF;
          border: 1px solid #BFDBFE;
        }
        
        .popup-btn-visit:hover {
          background: #BFDBFE;
        }

        /* ========== RESPONSIVE MÓVIL ========== */
        @media (max-width: 640px) {
          .maplibregl-popup {
            max-width: 92vw !important;
          }
          
          .maplibregl-popup-content {
            max-width: 92vw !important;
            width: 92vw !important;
            max-height: 70vh !important;
            overflow-y: auto !important;
            border-radius: 16px !important;
          }
          
          .popup-image-container {
            height: 140px;
          }
          
          .popup-content {
            padding: 14px;
          }
          
          .popup-title {
            font-size: 16px;
          }
          
          .popup-services-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .popup-buttons-primary,
          .popup-buttons-secondary {
            grid-template-columns: 1fr 1fr;
            gap: 6px;
          }
          
          .popup-btn {
            padding: 10px 8px;
            font-size: 11px;
          }
          
          .popup-btn svg {
            width: 12px;
            height: 12px;
          }
        }
        
        /* ========== MÓVIL MUY PEQUEÑO ========== */
        @media (max-width: 380px) {
          .popup-buttons-secondary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Contenedor del mapa */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full min-h-[400px]"
        style={{ touchAction: 'pan-x pan-y' }}
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

      {/* Botón GPS - ✅ CORREGIDO: Color naranja cuando activo */}
      <button
        onClick={() => toggleGPS()}
        className={`absolute bottom-20 md:bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg font-semibold transition-all z-[1000] flex items-center gap-2 mb-16 md:mb-0 ${
          gpsActive
            ? 'bg-orange-500 text-white hover:bg-orange-600' // ✅ CORREGIDO: Naranja en vez de primary
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
        <span className="text-sm">{gpsActive ? 'GPS Activo' : 'Ver ubicación'}</span> {/* ✅ CORREGIDO: "GPS Activo" */}
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
