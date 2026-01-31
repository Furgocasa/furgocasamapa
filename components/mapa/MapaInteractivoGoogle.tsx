'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer'
import type { Area } from '@/types/database.types'
import Link from 'next/link'
import { BuscadorGeografico } from './BuscadorGeografico'
import { getMapStyle } from '@/lib/mapStyles'

// Tipos simplificados para Google Maps (se cargan din├ímicamente)
type GoogleMap = any
type GoogleMarker = any
type GoogleInfoWindow = any

interface MapaInteractivoGoogleProps {
  areas: Area[]
  areaSeleccionada: Area | null
  onAreaClick: (area: Area) => void
  mapRef?: React.MutableRefObject<GoogleMap | null>
  onCountryChange?: (country: string, previousCountry: string | null) => void
  currentCountry?: string
  estilo?: 'default' | 'waze' | 'satellite' | 'dark'
  paisFiltro?: string
}

export function MapaInteractivoGoogle({ areas, areaSeleccionada, onAreaClick, mapRef: externalMapRef, onCountryChange, currentCountry, estilo, paisFiltro = '' }: MapaInteractivoGoogleProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<GoogleMap | null>(null)
  const [error, setError] = useState<string | null>(null)
  const markersRef = useRef<GoogleMarker[]>([])
  const markerIdsRef = useRef<string[]>([])
  const infoWindowRef = useRef<GoogleInfoWindow | null>(null)
  const markerClustererRef = useRef<MarkerClusterer | null>(null)
  const userMarkerRef = useRef<GoogleMarker | null>(null)
  const [gpsActive, setGpsActive] = useState(false) // Siempre false inicialmente para evitar hidrataci├│n
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const [showInfoTooltip, setShowInfoTooltip] = useState(false) // Estado para tooltip de informaci├│n
  
  // Handler para cuando se busca una ubicaci├│n geogr├ífica
  const handleLocationFound = (location: { lat: number; lng: number; address: string; country: string; countryCode: string }) => {
    console.log('­ƒôì Nueva ubicaci├│n seleccionada:', location)
    
    // Si el pa├¡s es diferente al filtro actual, notificar al padre
    if (onCountryChange && location.country && currentCountry !== location.country) {
      onCountryChange(location.country, currentCountry || null)
    }
  }
  
  // Cargar estado del GPS desde localStorage DESPU├ëS de montar (solo cliente)
  useEffect(() => {
    const savedGpsState = localStorage.getItem('gpsActive') === 'true'
    if (savedGpsState) {
      setGpsActive(true)
    }
  }, [])

  // Inicializar Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        // Ô£à ESPERAR A QUE EL CONTENEDOR TENGA DIMENSIONES
        const waitForContainer = (): Promise<void> => {
          return new Promise((resolve) => {
            let attempts = 0
            const maxAttempts = 50 // M├íximo 5 segundos (50 * 100ms)
            
            const checkSize = () => {
              if (mapRef.current) {
                const rect = mapRef.current.getBoundingClientRect()
                if (rect.width > 0 && rect.height > 0) {
                  console.log('Ô£à Contenedor tiene dimensiones:', { width: rect.width, height: rect.height })
                  resolve()
                  return
                }
              }
              
              attempts++
              if (attempts >= maxAttempts) {
                console.warn('ÔÜá´©Å Timeout esperando dimensiones del contenedor, inicializando de todas formas...')
                resolve()
                return
              }
              
              // Esperar un frame antes de verificar de nuevo
              requestAnimationFrame(() => {
                setTimeout(checkSize, 100)
              })
            }
            
            // Empezar a verificar despu├®s del primer frame
            requestAnimationFrame(checkSize)
          })
        }

        await waitForContainer()

        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
          version: 'weekly',
          libraries: ['places', 'geometry']
        })

        const { Map } = await loader.importLibrary('maps')
        const google = (window as any).google
        
        if (mapRef.current) {
          // Ô£à VERIFICAR DIMENSIONES UNA VEZ M├üS ANTES DE CREAR EL MAPA
          const rect = mapRef.current.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) {
            console.warn('ÔÜá´©Å Contenedor a├║n sin dimensiones, reintentando en 200ms...')
            setTimeout(initMap, 200)
            return
          }

          console.log('­ƒù║´©Å Inicializando mapa con centro:', { lat: 40.4168, lng: -3.7038 }, 'zoom:', 6)
          
          // Obtener estilo seg├║n configuraci├│n
          const mapStyle = getMapStyle(estilo || 'default')
          console.log(`­ƒÄ¿ Aplicando estilo: ${estilo || 'default'}`, mapStyle.length > 0 ? `(${mapStyle.length} reglas)` : '(default)')
          
          const mapInstance = new Map(mapRef.current, {
            mapId: "DEMO_MAP_ID", // Activa mapas vectoriales (transiciones suaves)
            isFractionalZoomEnabled: true, // Zoom fluido sin "saltos"
            center: { lat: 40.4168, lng: -3.7038 }, // Madrid centro por defecto
            zoom: 6,
            mapTypeControl: false, // Quitamos para evitar solapamiento
            streetViewControl: false,
            fullscreenControl: false, // Lo controlamos nosotros
            zoomControl: true,
            zoomControlOptions: {
              position: google.maps.ControlPosition.RIGHT_CENTER
            },
            gestureHandling: 'greedy', // Permite desplazar con un dedo en m├│vil
            styles: mapStyle // Aplicar estilo seg├║n configuraci├│n
          })

          setMap(mapInstance)

          // Pasar el mapa a la referencia externa si existe
          if (externalMapRef) {
            externalMapRef.current = mapInstance
          }

          // Crear InfoWindow ├║nica para reutilizar
          infoWindowRef.current = new google.maps.InfoWindow()

          console.log('Ô£à Mapa inicializado correctamente en Madrid, zoom 6')
          
          // Ô£à FORZAR RESIZE DEL MAPA PARA ASEGURAR RENDERIZADO CORRECTO
          // Esto es cr├¡tico para la primera carga en PC
          setTimeout(() => {
            if (mapInstance && google.maps.event) {
              google.maps.event.trigger(mapInstance, 'resize')
              console.log('­ƒöä Resize del mapa forzado')
            }
          }, 150)
        }
      } catch (err) {
        console.error('Error inicializando mapa:', err)
        setError('Error al cargar el mapa')
      }
    }

    initMap()
  }, [])

  // A├▒adir marcadores al mapa con clustering INCREMENTAL (sin parpadeo)
  useEffect(() => {
    if (!map) return

    // Si no hay ├íreas, limpiar markers y clusters
    if (areas.length === 0) {
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers()
        markerClustererRef.current = null
      }
      markersRef.current.forEach((marker: any) => marker.setMap(null))
      markersRef.current = []
      markerIdsRef.current = []
      return
    }

    const google = (window as any).google

    // Reset si cambiaron los filtros (ids diferentes o menor cantidad)
    const nextIds = areas.map((area) => area.id)
    const prevIds = markerIdsRef.current
    const idsIguales =
      prevIds.length === nextIds.length &&
      prevIds.every((id, index) => id === nextIds[index])

    if (!idsIguales) {
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers()
        markerClustererRef.current = null
      }
      markersRef.current.forEach((marker: any) => marker.setMap(null))
      markersRef.current = []
      markerIdsRef.current = []
    }

    // N├║mero de markers existentes
    const existingCount = markersRef.current.length

    // Si ya tenemos todos los markers, no hacer nada
    if (existingCount === areas.length) return

    // Solo crear markers para las ├íreas NUEVAS (incrementales)
    const newAreas = areas.slice(existingCount)
    
    console.log(`­ƒôì A├▒adiendo ${newAreas.length} markers nuevos (total: ${areas.length}, existentes: ${existingCount})`)

    const newMarkers = newAreas.map((area) => {
      const pinColor = getTipoAreaColor(area.tipo_area)
      
      const marker = new google.maps.Marker({
        position: {
          lat: Number(area.latitud),
          lng: Number(area.longitud)
        },
        title: area.nombre,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: pinColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        // Sin animaci├│n para evitar el rebote
      })

      // Evento click en marcador
      marker.addListener('click', () => {
        // Notificar al componente padre
        onAreaClick(area)
        
        // Mostrar InfoWindow
        if (infoWindowRef.current) {
          const content = createInfoWindowContent(area)
          infoWindowRef.current.setContent(content)
          infoWindowRef.current.open(map, marker)
          
          // Centrar mapa en el marcador
          map.panTo(marker.getPosition()!)
        }
      })

      return marker
    })

    // A├æADIR los nuevos markers al array existente (sin borrar los anteriores)
    markersRef.current = [...markersRef.current, ...newMarkers]
    markerIdsRef.current = [...markerIdsRef.current, ...newAreas.map((area) => area.id)]

    // Actualizar clusterer: a├▒adir solo los nuevos markers
    if (!markerClustererRef.current) {
      // Primera vez: crear clusterer con optimizaciones de rendimiento
      markerClustererRef.current = new MarkerClusterer({
        map,
        markers: markersRef.current,
        
        // Ô£à ALGORITMO OPTIMIZADO: Reduce solapamiento y mejora rendimiento
        algorithm: new SuperClusterAlgorithm({
          radius: 100,    // Radio de 100px (antes: 60px default) - menos clusters
          minPoints: 3,   // M├¡nimo 3 ├íreas por cluster (antes: 2) - clusters m├ís significativos
          maxZoom: 13     // Agrupa hasta zoom 13 (antes: 15) - clustering m├ís agresivo
        }),
        
        renderer: {
          render: ({ count, position }) => {
            // Ô£à OPTIMIZACI├ôN: Escala din├ímica seg├║n cantidad de ├íreas
            // M├ís ├íreas = c├¡rculo m├ís grande (m├ís visible y menos solapamiento)
            const scale = count < 10 ? 22 : 
                         count < 50 ? 30 : 
                         count < 100 ? 38 : 45
            
            const marker = new google.maps.Marker({
              position,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: scale,
                fillColor: '#0284c7',
                fillOpacity: 0.85,
                strokeColor: '#ffffff',
                strokeWeight: 3,
              },
              label: {
                text: String(count),
                color: '#ffffff',
                fontSize: count < 100 ? '14px' : '16px',
                fontWeight: 'bold',
              },
              zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
            })
            
            // Ô£à UX: Hacer zoom autom├ítico al hacer click en cluster
            marker.addListener('click', () => {
              if (map) {
                const currentZoom = map.getZoom() || 6
                map.setZoom(currentZoom + 2)
                map.panTo(position)
              }
            })
            
            return marker
          },
        },
      })
    } else {
      // Ya existe: solo a├▒adir los nuevos markers al clusterer
      markerClustererRef.current.addMarkers(newMarkers)
    }

    console.log(`Ô£à Total markers en mapa: ${markersRef.current.length}`)

    // Cleanup solo al desmontar el componente completo
    return () => {
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers()
        markerClustererRef.current = null
      }
      markersRef.current.forEach((marker: any) => marker.setMap(null))
      markersRef.current = []
    }
  }, [map, areas, onAreaClick])

  // Actualizar cuando se selecciona un ├írea desde la lista
  useEffect(() => {
    if (!map || !areaSeleccionada || !infoWindowRef.current) return

    // Buscar el marcador correspondiente en TODOS los markers (no depender de 'areas' filtrado)
    const marker = markersRef.current.find((m, index) => markerIdsRef.current[index] === areaSeleccionada.id)
    
    if (marker) {
      // Centrar mapa
      map.panTo(marker.getPosition()!)
      map.setZoom(14)
      
      // Mostrar InfoWindow
      const content = createInfoWindowContent(areaSeleccionada)
      infoWindowRef.current.setContent(content)
      infoWindowRef.current.open(map, marker)
    } else {
      // Si no hay marker (área no visible), crear InfoWindow temporal
      const position = { lat: areaSeleccionada.latitud, lng: areaSeleccionada.longitud }
      map.panTo(position)
      map.setZoom(14)
      
      const content = createInfoWindowContent(areaSeleccionada)
      infoWindowRef.current.setContent(content)
      infoWindowRef.current.setPosition(position)
      infoWindowRef.current.open(map)
    }
  }, [areaSeleccionada, map])

  // Auto-activar GPS si estaba activo anteriormente
  useEffect(() => {
    console.log('­ƒôì useEffect GPS - map:', !!map, 'gpsActive:', gpsActive, 'watchIdRef:', !!watchIdRef.current)
    
    if (map && gpsActive && !watchIdRef.current && navigator.geolocation) {
      console.log('­ƒƒó Auto-activando GPS desde localStorage')
      
      const google = (window as any).google
      
      // Activar directamente sin pasar por toggleGPS
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(pos)
          
          // Crear o actualizar marcador de usuario
          if (!userMarkerRef.current) {
            console.log('­ƒôì Creando marcador GPS (auto-activaci├│n) en:', pos)
            userMarkerRef.current = new google.maps.Marker({
              position: pos,
              map: map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#FF6B35',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
              },
              zIndex: 999999,
              title: 'Tu ubicaci├│n'
            })
            console.log('Ô£à Marcador GPS creado (NO se centra el mapa)')
          } else {
            userMarkerRef.current.setPosition(pos)
          }
        },
        (error) => {
          console.error('Error obteniendo ubicaci├│n (auto-activaci├│n):', error)
          setGpsActive(false)
          localStorage.setItem('gpsActive', 'false')
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      )
      watchIdRef.current = watchId
      console.log('Ô£à GPS auto-activado, watchId:', watchId)
    }
  }, [map, gpsActive])

  // Limpiar watchPosition y marcador al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null)
      }
    }
  }, [])

  const getTipoAreaColor = (tipo: string): string => {
    const colors: Record<string, string> = {
      publica: '#0284c7', // Azul
      privada: '#FF6B35', // Naranja
      camping: '#52B788', // Verde
      parking: '#F4A261', // Arena
    }
    return colors[tipo] || '#0284c7'
  }

  // Obtener icono para cada servicio (coincide exactamente con los filtros)
  const getServicioIcon = (servicio: string): string => {
    const iconos: Record<string, string> = {
      agua: '­ƒÆº',
      electricidad: 'ÔÜí',
      vaciado_aguas_negras: 'ÔÖ╗´©Å',
      vaciado_aguas_grises: '­ƒÜ░',
      wifi: '­ƒôÂ',
      duchas: '­ƒÜ┐',
      wc: '­ƒÜ╗',
      lavanderia: '­ƒº║',
      restaurante: '­ƒì¢´©Å',
      supermercado: '­ƒøÆ',
      zona_mascotas: '­ƒÉò'
    }
    return iconos[servicio] || 'Ô£ô'
  }

  // Obtener etiqueta legible para cada servicio (coincide exactamente con los filtros)
  const getServicioLabel = (servicio: string): string => {
    const etiquetas: Record<string, string> = {
      agua: 'Agua',
      electricidad: 'Electricidad',
      vaciado_aguas_negras: 'Vaciado Qu├¡mico',
      vaciado_aguas_grises: 'Vaciado Aguas Grises',
      wifi: 'WiFi',
      duchas: 'Duchas',
      wc: 'WC',
      lavanderia: 'Lavander├¡a',
      restaurante: 'Restaurante',
      supermercado: 'Supermercado',
      zona_mascotas: 'Zona Mascotas'
    }
    return etiquetas[servicio] || servicio
  }

  // Crear contenido HTML para InfoWindow
  const createInfoWindowContent = (area: Area): string => {
    const tipoLabels: Record<string, string> = {
      publica: 'P├║blica',
      privada: 'Privada',
      camping: 'Camping',
      parking: 'Parking'
    }

    // Lista de servicios v├ílidos en espa├▒ol (coinciden con los filtros)
    const serviciosValidos = [
      'agua',
      'electricidad',
      'wc',
      'duchas',
      'vaciado_quimico',
      'vaciado_aguas_grises',
      'oferta_restauracion'
    ]

    // Obtener servicios disponibles (solo los v├ílidos en espa├▒ol)
    const serviciosDisponibles = area.servicios && typeof area.servicios === 'object' 
      ? Object.entries(area.servicios)
          .filter(([key, value]) => value === true && serviciosValidos.includes(key))
          .map(([key]) => ({
            icon: getServicioIcon(key),
            label: getServicioLabel(key)
          }))
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
                <span style="color: #F59E0B; font-size: 16px; margin-right: 4px;">Ôÿà</span>
                <span style="font-weight: 700; font-size: 15px; color: #111827;">${area.google_rating}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <div style="padding: ${area.foto_principal ? '0' : '8px 0'};">
          <!-- T├¡tulo -->
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #111827; line-height: 1.3;">
            ${area.nombre}
          </h3>

          <!-- Ubicaci├│n -->
          ${area.ciudad || area.provincia ? `
            <div style="display: flex; align-items: center; color: #6B7280; font-size: 14px; margin-bottom: 10px;">
              <svg style="width: 16px; height: 16px; margin-right: 6px; flex-shrink: 0;" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              <span>${[area.ciudad, area.provincia].filter(Boolean).join(', ')}</span>
            </div>
          ` : ''}

          <!-- Descripci├│n -->
          ${area.descripcion ? `
            <p style="margin: 0 0 12px 0; color: #4B5563; font-size: 14px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${area.descripcion.replace(/'/g, "&#39;")}
            </p>
          ` : ''}

          <!-- Badges -->
          <div style="display: flex; gap: 6px; margin: 12px 0; flex-wrap: wrap;">
            <span style="background: ${getTipoAreaColor(area.tipo_area)}20; color: ${getTipoAreaColor(area.tipo_area)}; padding: 6px 12px; border-radius: 14px; font-size: 12px; font-weight: 600; border: 1px solid ${getTipoAreaColor(area.tipo_area)}30;">
              ${tipoLabels[area.tipo_area] || 'P├║blica'}
            </span>
            ${area.precio_noche !== null && area.precio_noche !== undefined ? `
              <span style="background: #F3F4F6; color: #374151; padding: 6px 12px; border-radius: 14px; font-size: 12px; font-weight: 600; border: 1px solid #E5E7EB;">
                ${area.precio_noche === 0 ? 'Ô£¿ Gratis' : `­ƒÆ░ ${area.precio_noche}Ôé¼/noche`}
              </span>
            ` : ''}
            ${area.verificado ? `
              <span style="background: #D1FAE5; color: #059669; padding: 6px 12px; border-radius: 14px; font-size: 12px; font-weight: 600; border: 1px solid #A7F3D0;">
                Ô£ô Verificado
              </span>
            ` : ''}
          </div>

          <!-- Servicios -->
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
                  +${serviciosRestantes} servicio${serviciosRestantes > 1 ? 's' : ''} m├ís
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- Botones de Acci├│n -->
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

  // Funci├│n para activar/desactivar GPS (ANTES del return condicional)
  const toggleGPS = (autoActivate: boolean = false) => {
    console.log('­ƒöä toggleGPS llamado - gpsActive:', gpsActive, 'autoActivate:', autoActivate, 'watchIdRef:', !!watchIdRef.current)
    
    if (!gpsActive) {
      // Activar GPS
          if (navigator.geolocation && map) {
        const google = (window as any).google
        const watchId = navigator.geolocation.watchPosition(
              (position) => {
                const pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                }
            setUserLocation(pos)
            
            // Crear o actualizar marcador de usuario
            if (!userMarkerRef.current) {
              console.log('­ƒôì Creando marcador GPS en:', pos, 'autoActivate:', autoActivate)
              userMarkerRef.current = new google.maps.Marker({
                position: pos,
                map: map,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: '#FF6B35',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                },
                zIndex: 999999, // MUY ALTO - Por encima de clusters y todo
                title: 'Tu ubicaci├│n'
              })
              
              // Solo centrar si es activaci├│n MANUAL (clic en bot├│n), no auto-activaci├│n
              if (!autoActivate) {
                console.log('­ƒÄ» Centrando mapa en ubicaci├│n GPS (activaci├│n manual)')
                map.setCenter(pos)
                map.setZoom(12)
              } else {
                console.log('Ô£à NO centrando mapa (auto-activaci├│n desde localStorage)')
              }
            } else {
              userMarkerRef.current.setPosition(pos)
            }
          },
          (error) => {
            console.error('Error obteniendo ubicaci├│n:', error)
            if (!autoActivate) {
              alert('No se pudo obtener tu ubicaci├│n')
            }
            setGpsActive(false)
            localStorage.setItem('gpsActive', 'false')
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
          }
        )
        watchIdRef.current = watchId
        setGpsActive(true)
        localStorage.setItem('gpsActive', 'true') // Guardar estado
      }
    } else {
      // Desactivar GPS
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null)
        userMarkerRef.current = null
      }
      setUserLocation(null)
      setGpsActive(false)
      localStorage.setItem('gpsActive', 'false') // Guardar estado
    }
  }

  // Función para restablecer zoom según el filtro activo
  const resetZoom = () => {
    if (!map) return

    // Coordenadas según el filtro
    const vistas: Record<string, { center: { lat: number, lng: number }, zoom: number }> = {
      // Sin filtro: ver todo (Europa + Latinoamérica)
      '': { center: { lat: 20, lng: -20 }, zoom: 2 },
      // Regiones
      'REGION_EUROPA': { center: { lat: 48, lng: 10 }, zoom: 4 },
      'REGION_SUDAMERICA': { center: { lat: -15, lng: -60 }, zoom: 3 },
      'REGION_CENTROAMERICA': { center: { lat: 15, lng: -85 }, zoom: 5 },
      // Países principales
      'España': { center: { lat: 40.4, lng: -3.7 }, zoom: 6 },
      'Portugal': { center: { lat: 39.4, lng: -8.2 }, zoom: 6 },
      'Francia': { center: { lat: 46.2, lng: 2.2 }, zoom: 5 },
      'Italia': { center: { lat: 41.9, lng: 12.6 }, zoom: 5 },
      'Alemania': { center: { lat: 51.2, lng: 10.5 }, zoom: 5 },
      'Argentina': { center: { lat: -34, lng: -64 }, zoom: 4 },
      'Chile': { center: { lat: -33, lng: -71 }, zoom: 4 },
      'Colombia': { center: { lat: 4.6, lng: -74 }, zoom: 5 },
      'Perú': { center: { lat: -9, lng: -75 }, zoom: 5 },
      'Uruguay': { center: { lat: -33, lng: -56 }, zoom: 6 },
      'Ecuador': { center: { lat: -2, lng: -78 }, zoom: 6 },
      'Paraguay': { center: { lat: -23, lng: -58 }, zoom: 6 },
      'Costa Rica': { center: { lat: 10, lng: -84 }, zoom: 7 },
      'Panamá': { center: { lat: 9, lng: -80 }, zoom: 7 },
      'Puerto Rico': { center: { lat: 18, lng: -66 }, zoom: 8 }
    }

    const vista = vistas[paisFiltro] || vistas['']
    map.setCenter(vista.center)
    map.setZoom(vista.zoom)
  }

  // Limpiar GPS al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null)
      }
    }
  }, [])

  // DESPU├ëS de todos los hooks y funciones, hacer el return condicional
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-6">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Mapa */}
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[400px]" 
        style={{ touchAction: 'none' }} // Mejora respuesta t├íctil en m├│viles
      />

      {/* Buscador Geogr├ífico - M├│vil: derecha, Desktop: centro */}
      {map && (
        <div className="absolute top-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 w-56 md:w-80 z-[1000]">
          <BuscadorGeografico
            map={map}
            onLocationFound={handleLocationFound}
            currentCountry={currentCountry}
          />
        </div>
      )}

      {/* Bot├│n de Informaci├│n - Izquierda, altura de controles de zoom */}
      <button
        onClick={() => setShowInfoTooltip(!showInfoTooltip)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 active:scale-95 transition-all z-[1000]"
        aria-label="Informaci├│n sobre rendimiento"
      >
        <svg
          className="w-6 h-6 text-sky-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Tooltip Informativo */}
      {showInfoTooltip && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 ml-16 bg-white rounded-lg shadow-2xl z-20 w-80 max-w-[calc(100vw-6rem)] border-2 border-sky-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <h3 className="font-bold text-white text-sm">Consejo de Rendimiento</h3>
            </div>
            <button
              onClick={() => setShowInfoTooltip(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong className="text-gray-900">┬┐El mapa carga lento?</strong>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Con <strong className="text-sky-600">{areas.length.toLocaleString()} ├íreas</strong> visibles, 
                  aplicar filtros mejorar├í significativamente los tiempos de carga.
                </p>
              </div>
            </div>

            {/* Lista de sugerencias */}
            <div className="bg-sky-50 rounded-lg p-3 border border-sky-100">
              <p className="text-xs font-semibold text-sky-900 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                </svg>
                Prueba estos filtros:
              </p>
              <ul className="space-y-1.5 text-xs text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-sky-500">­ƒîì</span>
                  <span><strong>Pa├¡s:</strong> Reduce a tu zona de inter├®s</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sky-500">­ƒÜ┐</span>
                  <span><strong>Servicios:</strong> Agua, electricidad, duchas...</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sky-500">­ƒÆ░</span>
                  <span><strong>Precio:</strong> Gratis, de pago...</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sky-500">­ƒôì</span>
                  <span><strong>Tipo:</strong> P├║blica, privada, camping...</span>
                </li>
              </ul>
            </div>

            {/* Footer tip */}
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-2.5">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <p className="text-xs text-green-800">
                <strong>Tip:</strong> Aplicar 1-2 filtros puede reducir el tiempo de carga hasta un <strong>70%</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bot├│n GPS - Encima de Restablecer Zoom */}
      <button
        onClick={() => toggleGPS()}
        className={`absolute bottom-20 md:bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg font-semibold transition-all z-[1000] flex items-center gap-2 mb-16 md:mb-0 ${
          gpsActive 
            ? 'bg-orange-500 text-white hover:bg-orange-600' 
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        aria-label={gpsActive ? 'Desactivar GPS' : 'Ver ubicaci├│n'}
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
        <span className="text-sm" suppressHydrationWarning>{gpsActive ? 'GPS Activo' : 'Ver ubicaci├│n'}</span>
      </button>

      {/* Bot├│n Restablecer Zoom - Abajo Centro (m├ís arriba en m├│vil para evitar bottom bar) */}
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

// Funciones auxiliares para servicios
function getServicioIcon(servicio: string): string {
  const icons: Record<string, string> = {
    agua: '­ƒÆº',
    electricidad: 'ÔÜí',
    vaciado_aguas_negras: 'ÔÖ╗´©Å',
    vaciado_aguas_grises: '­ƒÜ░',
    wifi: '­ƒôÂ',
    duchas: '­ƒÜ┐',
    wc: '­ƒÜ╗',
    lavanderia: '­ƒº║',
    restaurante: '­ƒì¢´©Å',
    supermercado: '­ƒøÆ',
    zona_mascotas: '­ƒÉò'
  }
  return icons[servicio] || 'Ô£ô'
}

function getServicioLabel(servicio: string): string {
  const labels: Record<string, string> = {
    agua: 'Agua',
    electricidad: 'Electricidad',
    vaciado_aguas_negras: 'Vaciado Qu├¡mico',
    vaciado_aguas_grises: 'Vaciado Aguas Grises',
    wifi: 'WiFi',
    duchas: 'Duchas',
    wc: 'WC',
    lavanderia: 'Lavander├¡a',
    restaurante: 'Restaurante',
    supermercado: 'Supermercado',
    zona_mascotas: 'Zona Mascotas'
  }
  return labels[servicio] || servicio
}
