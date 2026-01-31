'use client'

import { useEffect, useRef, useState } from 'react'
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
      zoom: 6, // ✅ CORREGIDO: Era 5, ahora 6 como Google Maps
      attributionControl: false
    })

    // Añadir controles
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(new maplibregl.AttributionControl({
      compact: true
    }), 'bottom-right')

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
      map.remove()
    }
  }, [estilo])

  // Añadir marcadores CON CLUSTERING cuando el mapa esté listo
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    // ✅ CRÍTICO: Limpiar marcadores anteriores PRIMERO
    Object.values(markersRef.current).forEach(marker => marker.remove())
    markersRef.current = {}
    
    // Si no hay áreas, terminar aquí (mapa limpio)
    if (areas.length === 0) {
      clusterIndexRef.current = null
      return
    }

    console.log(`📍 Inicializando clustering para ${areas.length} áreas...`)

    // Convertir áreas a formato GeoJSON para Supercluster
    const points: Supercluster.PointFeature<{ area: Area }>[] = areas.map(area => ({
      type: 'Feature',
      properties: { area },
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

    // Función para actualizar marcadores según el zoom/bounds
    const updateMarkers = () => {
      if (!mapRef.current || !clusterIndexRef.current) return

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

      // Limpiar marcadores que ya no están visibles
      const newMarkerIds = new Set(clusters.map(c => 
        c.properties.cluster ? `cluster-${c.properties.cluster_id}` : `area-${c.properties.area.id}`
      ))

      Object.keys(markersRef.current).forEach(id => {
        if (!newMarkerIds.has(id)) {
          markersRef.current[id].remove()
          delete markersRef.current[id]
        }
      })

      // Añadir/actualizar marcadores
      clusters.forEach(cluster => {
        const [lng, lat] = cluster.geometry.coordinates
        const isCluster = cluster.properties.cluster

        if (isCluster) {
          const clusterId = `cluster-${cluster.properties.cluster_id}`
          const count = cluster.properties.point_count

          // ✅ CORREGIDO: Escala DINÁMICA como Google Maps
          const scale = count < 10 ? 22 : 
                       count < 50 ? 30 : 
                       count < 100 ? 38 : 45
          
          // Crear elemento del cluster
          const el = document.createElement('div')
          el.className = 'marker-cluster'
          el.style.width = `${scale}px` // ✅ DINÁMICO
          el.style.height = `${scale}px` // ✅ DINÁMICO
          el.style.borderRadius = '50%'
          el.style.backgroundColor = 'rgba(2, 132, 199, 0.85)' // ✅ Con opacidad 0.85 como Google
          el.style.color = 'white'
          el.style.display = 'flex'
          el.style.alignItems = 'center'
          el.style.justifyContent = 'center'
          el.style.fontWeight = '700'
          el.style.fontSize = count < 100 ? '14px' : '16px' // ✅ DINÁMICO
          el.style.cursor = 'pointer'
          el.style.border = '3px solid white'
          el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)'
          el.textContent = count.toString()

          // Click en cluster: hacer zoom
          el.addEventListener('click', () => {
            const expansionZoom = clusterIndexRef.current!.getClusterExpansionZoom(cluster.properties.cluster_id!)
            map.flyTo({
              center: [lng, lat],
              zoom: Math.min(expansionZoom, 16),
              duration: 500
            })
          })

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(map)

          markersRef.current[clusterId] = marker

        } else {
          // Marcador individual
          const area = cluster.properties.area
          const areaId = `area-${area.id}`

          if (markersRef.current[areaId]) return

          const el = document.createElement('div')
          el.className = 'marker'
          el.style.width = '20px'
          el.style.height = '20px'
          el.style.borderRadius = '50%'
          el.style.backgroundColor = getTipoAreaColor(area.tipo_area)
          el.style.border = '2px solid white'
          el.style.cursor = 'pointer'
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

          const popup = new maplibregl.Popup({ 
            offset: 25,
            closeButton: true,      // ✅ Botón X para cerrar
            closeOnClick: true,     // ✅ Cerrar al hacer click fuera
            closeOnMove: false,     // No cerrar al mover el mapa
            maxWidth: '360px',      // Ancho consistente
            className: 'maplibre-popup-custom',
            anchor: 'bottom'        // ✅ Siempre arriba del marcador para mejor visibilidad
          })
            .setHTML(createPopupContent(area))

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map)

          el.addEventListener('click', () => {
            onAreaClick(area)
            
            // ✅ CORREGIDO: Solo centrar (panTo), NO cambiar zoom
            map.panTo([lng, lat])
            
            // ✅ CORREGIDO: Abrir popup INMEDIATAMENTE (sin setTimeout)
            marker.togglePopup()
          })

          markersRef.current[areaId] = marker
        }
      })

      console.log(`✅ ${Object.keys(markersRef.current).length} marcadores visibles (clusters + áreas)`)
    }

    // Actualizar marcadores inicialmente
    updateMarkers()

    // Actualizar marcadores al mover/zoom
    const handleUpdate = () => {
      updateMarkers()
    }

    mapRef.current.on('moveend', handleUpdate)
    mapRef.current.on('zoomend', handleUpdate)

    return () => {
      // Limpiar todos los marcadores
      Object.values(markersRef.current).forEach(marker => marker.remove())
      markersRef.current = {}
      clusterIndexRef.current = null

      if (mapRef.current) {
        mapRef.current.off('moveend', handleUpdate)
        mapRef.current.off('zoomend', handleUpdate)
      }
    }

  }, [areas, mapLoaded, onAreaClick])

  // Centrar en área seleccionada y abrir popup
  useEffect(() => {
    if (!mapRef.current || !areaSeleccionada) return

    const areaId = `area-${areaSeleccionada.id}`
    const marker = markersRef.current[areaId]

    if (marker) {
      // ✅ CORREGIDO: panTo en vez de flyTo, sin delays
      mapRef.current.panTo([Number(areaSeleccionada.longitud), Number(areaSeleccionada.latitud)])
      mapRef.current.setZoom(14)
      
      // ✅ CORREGIDO: Abrir popup INMEDIATAMENTE
      const popup = marker.getPopup()
      if (popup && !popup.isOpen()) {
        marker.togglePopup()
      }
    } else {
      // Si no hay marcador visible (área filtrada), crear popup temporal
      mapRef.current.panTo([Number(areaSeleccionada.longitud), Number(areaSeleccionada.latitud)])
      mapRef.current.setZoom(14)
      
      // ✅ CORREGIDO: Sin setTimeout
      new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: true,
        maxWidth: '360px',
        className: 'maplibre-popup-custom'
      })
        .setLngLat([Number(areaSeleccionada.longitud), Number(areaSeleccionada.latitud)])
        .setHTML(createPopupContent(areaSeleccionada))
        .addTo(mapRef.current!)
    }
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

          <!-- Botones secundarios -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
            <a
              href="/area/${area.slug}"
              style="background: #FEF3C7; color: #92400E; padding: 10px 12px; border: 1px solid #FDE68A; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; text-decoration: none;"
              onmouseover="this.style.background='#FDE68A'"
              onmouseout="this.style.background='#FEF3C7'"
            >
              <svg style="width: 14px; height: 14px;" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
              </svg>
              Favorito
            </a>
            
            <a
              href="/area/${area.slug}"
              style="background: #DBEAFE; color: #1E40AF; padding: 10px 12px; border: 1px solid #BFDBFE; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; text-decoration: none;"
              onmouseover="this.style.background='#BFDBFE'"
              onmouseout="this.style.background='#DBEAFE'"
            >
              <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Registrar Visita
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
        .maplibregl-popup-content {
          padding: 0 !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
          overflow: hidden !important;
          max-width: 360px !important;
        }
        .maplibregl-popup-close-button {
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
          line-height: 28px !important;
          text-align: center !important;
          padding: 0 !important;
        }
        .maplibregl-popup-close-button:hover {
          background: #F3F4F6 !important;
          color: #111827 !important;
          transform: scale(1.1) !important;
        }
        .maplibregl-popup-tip {
          border-top-color: white !important;
        }
        .maplibre-popup-custom .maplibregl-popup-content {
          max-width: 380px !important;
        }
        
        /* ✅ Estilos responsive para móvil */
        @media (max-width: 640px) {
          .maplibregl-popup-content {
            max-width: 90vw !important;
            width: 320px !important;
          }
          .maplibregl-popup {
            max-width: 90vw !important;
          }
        }
        
        /* ✅ Mejorar interacción táctil en móvil */
        .maplibregl-popup a {
          -webkit-tap-highlight-color: transparent;
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
