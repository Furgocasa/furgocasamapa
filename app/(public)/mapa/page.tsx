'use client'

import { MapaInteractivo } from '@/components/mapa/MapaInteractivo'
import { FiltrosMapa, Filtros, paisPerteneceAFiltro, normalizarPais, REGIONES } from '@/components/mapa/FiltrosMapa'
import { ListaResultados } from '@/components/mapa/ListaResultados'
import { Navbar } from '@/components/layout/Navbar'
import BottomSheet from '@/components/mobile/BottomSheet'
import { createClient } from '@/lib/supabase/client'
import type { Area } from '@/types/database.types'
import { useEffect, useState, useMemo, useRef, useCallback, useId } from 'react'
import { MapIcon, FunnelIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import { usePersistentFilters } from '@/hooks/usePersistentFilters'
import { ToastNotification } from '@/components/mapa/ToastNotification'
import { reverseGeocode } from '@/lib/google/geocoding'
import { track } from '@/lib/analytics/track'
import { useLanguage, getTipoAreaLabel } from '@/lib/i18n'
import { TIPO_AREA_IDS, getTipoAreaColor, getTipoAreaIconPath } from '@/lib/areas/tipo-area'
import { sinTildes } from '@/lib/areas/slug'
import { motion, AnimatePresence } from 'framer-motion'

const SPLASH_JOKES = ['splash_joke_1', 'splash_joke_2', 'splash_joke_3'] as const

export default function MapaPage() {
  const { locale, t } = useLanguage()
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true) // Para skeleton loader
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 })
  const [splashJoke, setSplashJoke] = useState(0)
  const [areaSeleccionada, setAreaSeleccionada] = useState<Area | null>(null)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [mostrarLista, setMostrarLista] = useState(false)
  const [leyendaAbierta, setLeyendaAbierta] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsActive, setGpsActive] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null)
  const mapRef = useRef<any>(null) // Referencia al mapa para controlarlo
  const skipMapCenterRef = useRef(false) // Evitar centrado automático después de búsqueda geográfica

  // Países reales de las áreas cargadas (misma fuente que el mapa: la BD).
  const paisesDisponibles = useMemo(() => {
    const set = new Set<string>()
    for (const area of areas) {
      const raw = (area.pais || '').trim()
      if (raw) set.add(raw)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
  }, [areas])

  const conteoPaisesRegion = useMemo(() => {
    const enRegion = (regionPaises: string[]) =>
      paisesDisponibles.filter(
        (p) => regionPaises.includes(p) || regionPaises.includes(normalizarPais(p))
      ).length
    return {
      europa: enRegion(REGIONES.EUROPA.paises),
      sudamerica: enRegion(REGIONES.SUDAMERICA.paises),
      centroamerica: enRegion(REGIONES.CENTROAMERICA.paises),
    }
  }, [paisesDisponibles])

  // Hook de filtros persistentes (reemplaza el useState anterior)
  const { filtros, setFiltros, metadata, setMetadata, limpiarFiltros, contarFiltrosActivos } = usePersistentFilters()

  const handlePaisManualChange = (_pais: string) => {
    setMetadata((prev) => ({
      ...prev,
      paisSource: 'manual'
    }))
  }

  // Verificar autenticación
  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setAuthLoading(false)
    }

    getUser()

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ✅ CARGAR TODAS LAS ÁREAS desde /api/areas (cacheado en CDN; se recarga al cambiar idioma)
  useEffect(() => {
    const loadAreas = async () => {
      try {
        setLoading(true)

        // 1º intento: endpoint cacheado (rápido y barato en egress)
        try {
          const qs = new URLSearchParams()
          if (locale && locale !== 'es') qs.set('lang', locale)
          // Cubo de 30 s: alinea con s-maxage del API. No hace falta bump manual.
          qs.set('t', String(Math.floor(Date.now() / 30_000)))
          const res = await fetch(`/api/areas?${qs.toString()}`, { cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            if (Array.isArray(json.areas) && json.areas.length > 0) {
              console.log(`✅ Total: ${json.areas.length} áreas cargadas (CDN, lang=${locale})`)
              setAreas(json.areas as Area[])
              setLoadingProgress({ loaded: json.areas.length, total: json.areas.length })
              return
            }
          }
        } catch {
          // caemos al fallback
        }

        // Fallback: carga directa desde Supabase con paginación (comportamiento anterior)
        console.warn('⚠️ /api/areas no disponible, cargando directo desde Supabase...')
        const supabase = createClient()
        const allAreas: Area[] = []
        const pageSize = 1000
        let page = 0
        let hasMore = true

        while (hasMore) {
          const { data, error } = await supabase
            .from('areas')
            .select('id, nombre, slug, latitud, longitud, ciudad, provincia, pais, tipo_area, precio_noche, foto_principal, servicios, plazas_totales, plazas_camper, acceso_24h, barrera_altura, google_rating, google_ratings_total, google_maps_url, verificado, con_descuento_furgocasa')
            .eq('activo', true)
            .order('nombre')
            .range(page * pageSize, (page + 1) * pageSize - 1)

          if (error) throw error

          if (data && data.length > 0) {
            allAreas.push(...(data as Area[]))
            page++
            if (data.length < pageSize) hasMore = false
          } else {
            hasMore = false
          }
        }

        console.log(`✅ Total: ${allAreas.length} áreas cargadas`)
        setAreas(allAreas)
        setLoadingProgress({ loaded: allAreas.length, total: allAreas.length })

      } catch (err) {
        console.error('Error cargando áreas:', err)
      } finally {
        setLoading(false)
        setInitialLoading(false)
      }
    }

    loadAreas()
  }, [locale])

  useEffect(() => {
    if (!initialLoading) return
    const id = window.setInterval(() => {
      setSplashJoke((i) => (i + 1) % SPLASH_JOKES.length)
    }, 3400)
    return () => window.clearInterval(id)
  }, [initialLoading])

  // ✅ OPTIMIZACIÓN #3: Obtener ubicación del usuario CON REVERSE GEOCODING (con cache)
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          setUserLocation({ lat, lng })
          setGpsActive(true)

          console.log('📍 GPS activado:', { lat, lng })

          // Reverse Geocoding para detectar país (CON CACHE)
          try {
            // Verificar cache primero (válido por 24 horas)
            const cacheKey = 'gps_country_cache'
            const cacheTimestampKey = 'gps_country_timestamp'
            const cachedCountry = localStorage.getItem(cacheKey)
            const cachedTimestamp = localStorage.getItem(cacheTimestampKey)
            
            let detectedCountryValue = null

            if (cachedCountry && cachedTimestamp) {
              const age = Date.now() - parseInt(cachedTimestamp)
              const maxAge = 1000 * 60 * 60 * 24 // 24 horas
              
              if (age < maxAge) {
                console.log('⚡ País detectado desde cache:', cachedCountry)
                detectedCountryValue = cachedCountry
              } else {
                console.log('🔄 Cache de país expirado, consultando API...')
              }
            }

            // Si no hay cache válido, consultar API
            if (!detectedCountryValue) {
              const locationData = await reverseGeocode(lat, lng)

              if (locationData?.country) {
                detectedCountryValue = locationData.country
                
                // Guardar en cache
                localStorage.setItem(cacheKey, detectedCountryValue)
                localStorage.setItem(cacheTimestampKey, Date.now().toString())
                console.log('💾 País guardado en cache:', detectedCountryValue)
              }
            }

            if (detectedCountryValue) {
              console.log('🌍 País detectado:', detectedCountryValue)
              setDetectedCountry(detectedCountryValue)

              // Solo registramos el país GPS en metadata. La aplicación del filtro
              // se hace en un efecto aparte que espera a que los filtros persistentes
              // terminen de cargarse, para no pisar una selección manual guardada
              // (condición de carrera: el GPS puede resolver antes que localStorage).
              setMetadata(prev => ({
                ...prev,
                gpsCountry: detectedCountryValue,
                gpsActive: true
              }))
            }
          } catch (error) {
            console.error('❌ Error en reverse geocoding:', error)
            // No es crítico, continuar sin filtro automático
          }
        },
        (error) => {
          console.log('GPS no disponible:', error.message)
          setGpsActive(false)
        }
      )
    }
  }, []) // Solo ejecutar al montar

  // País objetivo: selección manual del usuario o, en su defecto, el país GPS.
  // Se usa para CENTRAR el mapa (no para filtrar).
  const paisObjetivo = filtros.pais || detectedCountry || ''
  // ⚠️ El país detectado por GPS YA NO filtra las áreas: el mapa carga TODAS las
  // áreas en cualquier dispositivo (igual que en PC). El filtrado por país es
  // exclusivamente manual desde los filtros.
  const paisFiltroLista = filtros.pais

  // Centrar mapa cuando cambia el país objetivo (selección manual o GPS).
  // El GPS solo se usa aquí para acercar el mapa al país del usuario.
  useEffect(() => {
    if (!paisObjetivo || !mapRef.current) return

    // Coordenadas de REGIONES (con zoom apropiado)
    const regionCoordenadas: Record<string, { lat: number, lng: number, zoom: number }> = {
      'REGION_EUROPA': { lat: 48.0, lng: 10.0, zoom: 4 },
      'REGION_SUDAMERICA': { lat: -15.0, lng: -60.0, zoom: 3 },
      'REGION_CENTROAMERICA': { lat: 15.0, lng: -85.0, zoom: 5 }
    }

    // Coordenadas centrales de cada país (Europa + LATAM)
    const paisCoordenadas: Record<string, { lat: number, lng: number }> = {
      // Europa Occidental
      'España': { lat: 40.4168, lng: -3.7038 },
      'Portugal': { lat: 39.3999, lng: -8.2245 },
      'Francia': { lat: 46.2276, lng: 2.2137 },
      'Italia': { lat: 41.8719, lng: 12.5674 },
      'Alemania': { lat: 51.1657, lng: 10.4515 },
      'Bélgica': { lat: 50.5039, lng: 4.4699 },
      'Países Bajos': { lat: 52.1326, lng: 5.2913 },
      'Luxemburgo': { lat: 49.8153, lng: 6.1296 },
      'Suiza': { lat: 46.8182, lng: 8.2275 },
      'Austria': { lat: 47.5162, lng: 14.5501 },
      'Reino Unido': { lat: 55.3781, lng: -3.4360 },
      'Gales': { lat: 52.2928, lng: -3.7389 },
      'Irlanda': { lat: 53.1424, lng: -7.6921 },
      'Andorra': { lat: 42.5063, lng: 1.5218 },
      'Mónaco': { lat: 43.7384, lng: 7.4246 },
      // Europa del Norte
      'Noruega': { lat: 60.4720, lng: 8.4689 },
      'Suecia': { lat: 60.1282, lng: 18.6435 },
      'Dinamarca': { lat: 56.2639, lng: 9.5018 },
      'Finlandia': { lat: 61.9241, lng: 25.7482 },
      'Islandia': { lat: 64.9631, lng: -19.0208 },
      // Europa del Este
      'Polonia': { lat: 51.9194, lng: 19.1451 },
      'República Checa': { lat: 49.8175, lng: 15.4730 },
      'Eslovaquia': { lat: 48.6690, lng: 19.6990 },
      'Hungría': { lat: 47.1625, lng: 19.5033 },
      'Rumania': { lat: 45.9432, lng: 24.9668 },
      'Bulgaria': { lat: 42.7339, lng: 25.4858 },
      'Croacia': { lat: 45.1, lng: 15.2 },
      'Eslovenia': { lat: 46.1512, lng: 14.9955 },
      'Serbia': { lat: 44.0165, lng: 21.0059 },
      'Bosnia y Herzegovina': { lat: 43.9159, lng: 17.6791 },
      'Montenegro': { lat: 42.7087, lng: 19.3744 },
      'Albania': { lat: 41.1533, lng: 20.1683 },
      // Europa del Sur
      'Grecia': { lat: 39.0742, lng: 21.8243 },
      'Chipre': { lat: 35.1264, lng: 33.4299 },
      'Malta': { lat: 35.9375, lng: 14.3754 },
      // Sudamérica
      'Argentina': { lat: -38.4161, lng: -63.6167 },
      'Chile': { lat: -35.6751, lng: -71.5430 },
      'Uruguay': { lat: -32.5228, lng: -55.7658 },
      'Paraguay': { lat: -23.4425, lng: -58.4438 },
      'Brasil': { lat: -14.2350, lng: -51.9253 },
      'Perú': { lat: -9.1900, lng: -75.0152 },
      'Bolivia': { lat: -16.2902, lng: -63.5887 },
      'Ecuador': { lat: -1.8312, lng: -78.1834 },
      'Colombia': { lat: 4.5709, lng: -74.2973 },
      'Venezuela': { lat: 6.4238, lng: -66.5897 },
      // Norteamérica / Centroamérica
      'México': { lat: 23.6345, lng: -102.5528 },
      'Costa Rica': { lat: 9.7489, lng: -83.7534 },
      'Panamá': { lat: 8.5380, lng: -80.7821 },
      'Nicaragua': { lat: 12.8654, lng: -85.2072 },
      'Honduras': { lat: 15.2000, lng: -86.2419 },
      'El Salvador': { lat: 13.7942, lng: -88.8965 },
      'Guatemala': { lat: 15.7835, lng: -90.2308 },
      'Belice': { lat: 17.1899, lng: -88.4976 },
      // Caribe
      'Cuba': { lat: 21.5218, lng: -77.7812 },
      'República Dominicana': { lat: 18.7357, lng: -70.1627 },
      'Puerto Rico': { lat: 18.2208, lng: -66.5901 },
      'Jamaica': { lat: 18.1096, lng: -77.2975 },
    }

    // No centrar si el cambio viene del buscador geográfico
    if (skipMapCenterRef.current) {
      console.log('⏭️ Saltando centrado automático (cambio desde buscador geográfico)')
      skipMapCenterRef.current = false // Resetear para próxima vez
      return
    }

    // Verificar si es una región
    const region = regionCoordenadas[paisObjetivo]
    if (region && mapRef.current) {
      console.log(`🗺️ Centrando mapa en región: ${paisObjetivo}`)
      const m = mapRef.current
      // Detectar proveedor: MapLibre tiene getCanvas; Google tiene setCenter/setZoom;
      // Leaflet usa flyTo([lat, lng], zoom) con orden invertido respecto a MapLibre.
      if (m.getCanvas && m.flyTo) {
        // MapLibre GL → [lng, lat]
        m.flyTo({ center: [region.lng, region.lat], zoom: region.zoom, duration: 1000 })
      } else if (m.setCenter && m.setZoom) {
        // Google Maps
        m.setCenter({ lat: region.lat, lng: region.lng })
        m.setZoom(region.zoom)
      } else if (m.flyTo) {
        // Leaflet → [lat, lng]
        m.flyTo([region.lat, region.lng], region.zoom, { duration: 1 })
      }
      return
    }

    // Verificar si es un país
    const coordenadas = paisCoordenadas[paisObjetivo]
    if (coordenadas && mapRef.current) {
      console.log(`🗺️ Centrando mapa en ${paisObjetivo}`)
      // Solo centrar (panTo), sin cambiar zoom
      mapRef.current.panTo({ lat: coordenadas.lat, lng: coordenadas.lng })
    }
  }, [paisObjetivo])

  // ✅ ÁREAS PARA LA LISTA: filtrar por país (solo manual) + otros filtros
  const areasParaLista = useMemo(() => {
    console.log('🔍 Filtrando lista:', {
      paisSource: metadata.paisSource,
      filtros_pais: filtros.pais,
      detectedCountry,
      paisFiltroLista
    })
    
    return areas.filter((area: any) => {
      // Filtro de búsqueda
      if (filtros.busqueda) {
        const busqueda = sinTildes(filtros.busqueda)
        // Nota: la descripción NO se carga en el SELECT (sería muy pesado para
        // ~5.000 áreas), por lo que la búsqueda es por nombre, ciudad y provincia.
        const coincide =
          sinTildes(area.nombre).includes(busqueda) ||
          sinTildes(area.ciudad).includes(busqueda) ||
          sinTildes(area.provincia).includes(busqueda)

        if (!coincide) return false
      }

      // Filtro de país/región (soporta regiones como REGION_EUROPA, REGION_SUDAMERICA)
      if (paisFiltroLista) {
        const paisArea = area.pais?.trim() || ''
        
        // DEBUG: Ver qué países se están comparando
        const perteneceAlFiltro = paisPerteneceAFiltro(paisArea, paisFiltroLista)
        if (!perteneceAlFiltro) {
          // console.log(`❌ ${paisArea} NO pertenece a ${paisFiltroLista}`)
          return false
        } else {
          // console.log(`✅ ${paisArea} SÍ pertenece a ${paisFiltroLista}`)
        }
      }

      if (filtros.tipos?.length > 0) {
        const tiposActivos = filtros.tipos.filter((t) =>
          (TIPO_AREA_IDS as readonly string[]).includes(t)
        )
        if (tiposActivos.length === 0) return true
        if (!tiposActivos.includes(area.tipo_area)) return false
      }

      // Filtro de precio
      if (filtros.precio) {
        if (filtros.precio === 'gratis') {
          // Gratis: precio es exactamente 0 (confirmado gratis)
          if (area.precio_noche !== 0) {
            return false
          }
        }
        if (filtros.precio === 'de-pago') {
          // De pago: tiene un precio mayor que 0
          if (!area.precio_noche || area.precio_noche <= 0) {
            return false
          }
        }
        if (filtros.precio === 'desconocido') {
          // Desconocido: precio es null o undefined (no confirmado)
          if (area.precio_noche !== null && area.precio_noche !== undefined) {
            return false
          }
        }
      }

      // Filtro de características
      if (filtros.caracteristicas.length > 0) {
        if (filtros.caracteristicas.includes('verificado') && !area.verificado) {
          return false
        }
        if (filtros.caracteristicas.includes('con_descuento_furgocasa') && !area.con_descuento_furgocasa) {
          return false
        }
      }

      // Filtro de servicios
      if (filtros.servicios.length > 0) {
        const serviciosArea = area.servicios as Record<string, boolean>
        const tieneServicios = filtros.servicios.every(
          servicio => serviciosArea && serviciosArea[servicio] === true
        )
        if (!tieneServicios) return false
      }

      return true
    })
  }, [areas, filtros, paisFiltroLista])

  // ✅ ÁREAS PARA EL MAPA: usan EXACTAMENTE los mismos filtros que la lista.
  // Antes había una copia idéntica de toda la lógica de filtrado (se recorrían
  // ~5.000 áreas dos veces y podían divergir). Ahora reutilizamos el mismo cálculo.
  const areasParaMapa = areasParaLista

  const handleAreaClick = useCallback((area: Area) => {
    setAreaSeleccionada(area)

    // Coherencia: si el área seleccionada (p. ej. desde el buscador) no pasa el
    // filtro de país activo, ajustamos el filtro a su país para que aparezca
    // también en la lista y en los marcadores. En clics sobre marcadores ya
    // visibles esta condición no se cumple, por lo que no altera el filtro.
    const paisArea = (area as any)?.pais?.trim() || ''
    if (paisArea && paisFiltroLista && !paisPerteneceAFiltro(paisArea, paisFiltroLista)) {
      skipMapCenterRef.current = true
      setFiltros(prev => ({ ...prev, pais: paisArea }))
      setMetadata(prev => ({ ...prev, paisSource: 'manual' }))
    }

    track('area_view', {
      area_id: (area as any)?.id,
      event_data: {
        nombre: area?.nombre,
        pais: area?.pais,
        provincia: (area as any)?.provincia,
        tipo_area: (area as any)?.tipo_area,
      },
    })
    // En móvil se muestra el InfoWindow del mapa, no se abre la lista
  }, [paisFiltroLista, setFiltros, setMetadata])

  // ✅ CONEXIÓN CHATBOT → MAPA: seleccionar un área por slug/id.
  // Los 3 mapas ya centran y abren el popup al cambiar areaSeleccionada.
  const selectAreaBySlug = useCallback((slug: string) => {
    if (!slug) return false
    const area = areas.find((a: any) => a.slug === slug || a.id === slug)
    if (area) {
      handleAreaClick(area as Area)
      return true
    }
    return false
  }, [areas, handleAreaClick])

  // Caso 1: llegada con /mapa?area=slug (desde el chatbot en otra página)
  const areaUrlProcesadaRef = useRef(false)
  useEffect(() => {
    if (areas.length === 0 || areaUrlProcesadaRef.current) return
    const params = new URLSearchParams(window.location.search)
    const slug = params.get('area')
    if (slug) {
      areaUrlProcesadaRef.current = true
      // Pequeño margen para que el mapa esté montado antes de centrar
      setTimeout(() => selectAreaBySlug(slug), 400)
      // Limpiar la URL para no re-seleccionar al recargar
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [areas, selectAreaBySlug])

  // Caso 2: el chatbot está abierto SOBRE el propio mapa → evento directo
  useEffect(() => {
    const handler = (e: Event) => {
      const slug = (e as CustomEvent).detail?.slug
      if (slug) selectAreaBySlug(slug)
    }
    window.addEventListener('furgocasa:select-area', handler)
    return () => window.removeEventListener('furgocasa:select-area', handler)
  }, [selectAreaBySlug])

  // Sincronizar búsqueda del mapa con el panel lateral
  const handleMapSearchQuery = useCallback((query: string) => {
    setFiltros((prev) => ({ ...prev, busqueda: query }))
  }, [setFiltros])

  // Handler para cambio de país desde búsqueda geográfica
  const handleCountryChange = (newCountry: string, previousCountry: string | null) => {
    console.log(`📍 Cambio de país: ${previousCountry || 'ninguno'} → ${newCountry}`)
    
    // Marcar que el cambio viene del buscador geográfico
    // para que NO se re-centre el mapa automáticamente
    skipMapCenterRef.current = true
    
    // Cambiar el filtro de país automáticamente
    setFiltros(prev => ({
      ...prev,
      pais: newCountry
    }))
    setMetadata(prev => ({
      ...prev,
      paisSource: 'manual'
    }))

    // Mostrar mensaje informativo
    const mensaje = previousCountry
      ? `Has buscado en ${newCountry}. Hemos cambiado el filtro de país de ${previousCountry} a ${newCountry}. Puedes revertirlo desde los filtros.`
      : `Has buscado en ${newCountry}. Hemos aplicado el filtro de país automáticamente. Puedes modificarlo desde los filtros.`
    
    setToastMessage(mensaje)
    setShowToast(true)

    // Ocultar el toast después de 8 segundos
    setTimeout(() => setShowToast(false), 8000)
  }

  // El mapa es público: no se bloquea la carga esperando la autenticación.
  // (El estado `user` se mantiene por si se necesita para funciones personales.)

  // La carga inicial ya no bloquea el render: el mapa se monta desde el primer
  // segundo (con el vuelo de entrada visible) y la tarjeta de carga flota encima.

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden relative">
      {/* Navbar - siempre visible */}
      <Navbar />

      {/* Layout principal - el mapa es PÚBLICO (el login se pide solo en favoritos/rutas/perfil) */}
      <main className="flex-1 relative flex overflow-hidden min-h-0">
        {/* Panel de Filtros - Desktop y Tablet */}
        <aside className="hidden md:block md:w-72 lg:w-80 bg-white shadow-lg border-r overflow-y-auto overflow-x-hidden">
          <FiltrosMapa
            filtros={filtros}
            onFiltrosChange={setFiltros}
            onPaisChange={handlePaisManualChange}
            onClose={() => {}}
            totalResultados={areasParaLista.length}
            paisesDisponibles={paisesDisponibles}
            conteoPaisesRegion={conteoPaisesRegion}
          />
        </aside>

        {/* Mapa - Centro */}
        <div className="flex-1 relative">
          <MapaInteractivo
            areas={areasParaMapa}
            areasBusqueda={areas}
            areaSeleccionada={areaSeleccionada}
            onAreaClick={handleAreaClick}
            mapRef={mapRef}
            onCountryChange={handleCountryChange}
            onSearchQuery={handleMapSearchQuery}
            currentCountry={paisObjetivo || undefined}
            paisFiltro={filtros.pais}
          />

          {/* Splash de carga: flota sobre el mapa sin bloquearlo, con la
              furgoneta de marca en ruta. Se despide cuando llegan las áreas. */}
          <AnimatePresence>
            {initialLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.45 } }}
                className="absolute inset-0 z-30 flex items-center justify-center px-4 pointer-events-none"
              >
                <motion.div
                  initial={{ y: 28, scale: 0.95, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  exit={{ y: 28, scale: 0.95, opacity: 0 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                  className="relative overflow-hidden bg-white/95 backdrop-blur-md rounded-3xl shadow-overlay ring-1 ring-gray-900/5 px-7 py-8 max-w-[22rem] w-full text-center"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-accent-500" />

                  <div className="flex flex-col items-center mb-5">
                    <SplashFurgo />
                  </div>

                  <h2 className="text-[1.65rem] leading-tight font-bold text-gray-900 mb-2">
                    {t('splash_title')}
                  </h2>
                  <p className="text-gray-600 text-[13.5px] leading-relaxed mb-3">
                    {t('splash_body')}
                  </p>
                  <div className="min-h-[2.75rem] mb-5 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={SPLASH_JOKES[splashJoke]}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.28 }}
                        className="text-primary-700 text-[13px] italic px-1"
                      >
                        {t(SPLASH_JOKES[splashJoke])}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  {loadingProgress.loaded > 0 && (
                    <p className="text-xs font-medium text-gray-400 mb-3 tabular-nums">
                      {t('splash_found', {
                        n: loadingProgress.loaded.toLocaleString(locale),
                      })}
                    </p>
                  )}

                  <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 w-1/3 rounded-full bg-accent-500 animate-[fc-bar-slide_1.2s_ease-in-out_infinite]" />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contador de resultados y leyenda de tipos justo debajo */}
          <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-2">
            <div className="max-w-[min(11rem,calc(100%-9rem))] bg-white/90 backdrop-blur-md rounded-full shadow-lg ring-1 ring-gray-900/5 px-3 py-1.5">
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <span className="text-primary-600 font-bold tabular-nums">{areasParaMapa.length}</span>
                {areasParaMapa.length === 1 ? 'área' : 'áreas'}
                {filtros.pais && !filtros.pais.startsWith('REGION_') && (
                  <span className="text-xs text-gray-500 font-normal">· {filtros.pais}</span>
                )}
                {loading && (
                  <span className="inline-flex items-center gap-1">
                    <span className="animate-spin rounded-full h-3 w-3 border-2 border-primary-200 border-t-primary-600"></span>
                  </span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLeyendaAbierta((v) => !v)}
              aria-expanded={leyendaAbierta}
              className="flex bg-white/90 backdrop-blur-md rounded-full shadow-lg ring-1 ring-gray-900/5 w-11 h-11 items-center justify-center active:scale-95 transition-transform"
              aria-label={t('type_filter')}
            >
              <span className="flex items-center" aria-hidden>
                {TIPO_AREA_IDS.map((tipo, i) => (
                  <span
                    key={tipo}
                    className={`w-[15px] h-[15px] rounded-full ring-2 ring-white flex items-center justify-center ${i > 0 ? '-ml-1' : ''}`}
                    style={{ backgroundColor: getTipoAreaColor(tipo) }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff">
                      <path d={getTipoAreaIconPath(tipo)} />
                    </svg>
                  </span>
                ))}
              </span>
            </button>

            {leyendaAbierta && (
              <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-2xl p-3 ring-1 ring-gray-900/5 w-60">
                <p className="text-xs font-semibold text-gray-900 mb-2">{t('type_filter')}</p>
                <div className="space-y-2">
                  {TIPO_AREA_IDS.map((tipo) => (
                    <div key={tipo} className="flex items-start gap-2">
                      <span
                        className="w-[22px] h-[22px] shrink-0 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: getTipoAreaColor(tipo) }}
                        aria-hidden
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                          <path d={getTipoAreaIconPath(tipo)} />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-gray-900 leading-tight">
                          {getTipoAreaLabel(tipo, locale)}
                        </p>
                        <p className="text-[11px] text-gray-500 leading-tight">
                          {t(
                            tipo === 'publica'
                              ? 'type_public_hint'
                              : tipo === 'privada'
                                ? 'type_private_hint'
                                : 'type_camping_hint'
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel de Resultados - Desktop y Tablet */}
        <aside className="hidden md:block md:w-80 lg:w-96 bg-white shadow-lg border-l overflow-y-auto">
          <ListaResultados
            areas={areasParaLista}
            onAreaClick={handleAreaClick}
            onClose={() => {}}
            userLocation={userLocation}
            gpsActive={gpsActive}
          />
        </aside>
      </main>

      {/* Toast Notification para GPS */}
      <ToastNotification
        show={showToast}
        message={toastMessage}
        country={detectedCountry || undefined}
        onClose={() => setShowToast(false)}
        onViewFilters={() => setMostrarFiltros(true)}
      />

      {/* Bottom Sheet - Filtros (solo móvil) */}
      <BottomSheet
        isOpen={mostrarFiltros}
        onClose={() => setMostrarFiltros(false)}
        title={t('filters')}
        snapPoints={['full']}
      >
        <FiltrosMapa
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onPaisChange={handlePaisManualChange}
          onClose={() => setMostrarFiltros(false)}
          totalResultados={areasParaLista.length}
          paisesDisponibles={paisesDisponibles}
          conteoPaisesRegion={conteoPaisesRegion}
        />
      </BottomSheet>

      {/* Bottom Sheet - Lista (solo móvil) */}
      <BottomSheet
        isOpen={mostrarLista}
        onClose={() => setMostrarLista(false)}
        title={`${areasParaLista.length} ${t('places')}`}
        snapPoints={['full', 'half']}
      >
        <ListaResultados
          areas={areasParaLista}
          onAreaClick={handleAreaClick}
          onClose={() => setMostrarLista(false)}
          userLocation={userLocation}
          gpsActive={gpsActive}
        />
      </BottomSheet>

      {/* Bottom Bar (solo móvil) - Mapa, Filtros, Lista */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14 px-3">
          {/* Mapa */}
          <button
            onClick={() => {
              setMostrarFiltros(false)
              setMostrarLista(false)
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 active:scale-95 ${
              !mostrarFiltros && !mostrarLista ? 'text-accent-600' : 'text-gray-500'
            }`}
          >
            <span className={`px-4 py-1 rounded-full transition-colors duration-200 ${
              !mostrarFiltros && !mostrarLista ? 'bg-accent-50' : 'bg-transparent'
            }`}>
              <MapIcon className="w-6 h-6" />
            </span>
            <span className={`text-[11px] ${!mostrarFiltros && !mostrarLista ? 'font-semibold' : 'font-medium'}`}>{t('nav_mapa')}</span>
          </button>

          {/* Filtros */}
          <button
            onClick={() => setMostrarFiltros(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 active:scale-95 relative ${
              mostrarFiltros ? 'text-accent-600' : 'text-gray-500'
            }`}
          >
            <span className={`px-4 py-1 rounded-full transition-colors duration-200 relative ${
              mostrarFiltros ? 'bg-accent-50' : 'bg-transparent'
            }`}>
              <FunnelIcon className="w-6 h-6" />
              {contarFiltrosActivos() > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF6B35] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-sm">
                  {contarFiltrosActivos()}
                </span>
              )}
            </span>
            <span className={`text-[11px] ${mostrarFiltros ? 'font-semibold' : 'font-medium'}`}>{t('filters')}</span>
          </button>

          {/* Lista */}
          <button
            onClick={() => setMostrarLista(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 active:scale-95 relative ${
              mostrarLista ? 'text-accent-600' : 'text-gray-500'
            }`}
          >
            <span className={`px-4 py-1 rounded-full transition-colors duration-200 relative ${
              mostrarLista ? 'bg-accent-50' : 'bg-transparent'
            }`}>
              <ListBulletIcon className="w-6 h-6" />
              {areasParaLista.length > 0 && (
                <span className="absolute -top-1.5 -right-3 bg-accent-500 text-white text-[10px] rounded-full px-1.5 py-px font-bold min-w-[20px] text-center shadow-sm">
                  {areasParaLista.length > 99 ? '99+' : areasParaLista.length}
                </span>
              )}
            </span>
            <span className={`text-[11px] ${mostrarLista ? 'font-semibold' : 'font-medium'}`}>{t('places')}</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

/** Fiat Ducato H2 L3 camperizado: caja alta, batalla larga, morro corto. */
function SplashFurgo() {
  const rawId = useId().replace(/:/g, '')
  const bodyClip = `fc-ducato-body-${rawId}`
  const bodyPath =
    'M32 76 V26 Q32 18 40 18 H148 C155 18 158 21 161 27 L182 52 C186 57 188 61 188 65 V72 Q188 76 184 76 H32 Z'

  return (
    <svg
      viewBox="0 0 220 104"
      className="w-56 h-[6.5rem] animate-[fc-van-bob_1.1s_ease-in-out_infinite]"
      aria-hidden
    >
      <defs>
        <clipPath id={bodyClip}>
          <path d={bodyPath} />
        </clipPath>
      </defs>

      <ellipse cx="110" cy="96" rx="58" ry="4" fill="#111827" opacity="0.1" />
      <g fill="#cbd5e1">
        <rect x="70" y="95" width="12" height="2" rx="1" />
        <rect x="96" y="95" width="12" height="2" rx="1" />
        <rect x="122" y="95" width="12" height="2" rx="1" />
        <rect x="148" y="95" width="12" height="2" rx="1" />
      </g>

      {/* Cassette del toldo sobre el techo, sin salirse de la caja */}
      <rect x="46" y="15.5" width="70" height="3" rx="1.2" fill="#374151" />

      <path d={bodyPath} fill="#0b3c74" />

      <g clipPath={`url(#${bodyClip})`}>
        <rect x="32" y="68" width="156" height="8" fill="#111827" />
        <rect x="34" y="56" width="118" height="7" fill="#FF6B35" />
      </g>

      <rect x="42" y="26" width="30" height="20" rx="2.5" fill="#dbeafe" />
      <rect x="80" y="26" width="30" height="20" rx="2.5" fill="#dbeafe" />
      <rect x="116.5" y="24" width="2" height="44" rx="1" fill="#082a52" opacity="0.45" />
      <rect x="122" y="46" width="7" height="2.2" rx="1" fill="#e5e7eb" />
      <rect x="144" y="20" width="3.2" height="48" fill="#082a52" />
      <rect x="150" y="28" width="12" height="26" rx="2.2" fill="#dbeafe" />
      <path d="M163 30 L177 48 L163 48 Z" fill="#dbeafe" />

      <path d="M161 41 h-8 v9 h6 a2 2 0 0 0 2-2 z" fill="#1f2937" />
      <rect x="154.5" y="43.5" width="4" height="5" rx="0.8" fill="#93c5fd" />

      <rect x="33.2" y="48" width="3" height="10" rx="1" fill="#ef4444" />
      <rect x="180" y="61" width="6" height="8" rx="1.2" fill="#fde68a" />
      <rect x="36" y="40" width="2.4" height="8" rx="1" fill="#9ca3af" />

      <g>
        <circle cx="60" cy="80" r="13" fill="#111827" />
        <circle cx="60" cy="80" r="7.5" fill="#4b5563" />
        <circle cx="60" cy="80" r="3.2" fill="#e5e7eb" />
        <circle cx="164" cy="80" r="13" fill="#111827" />
        <circle cx="164" cy="80" r="7.5" fill="#4b5563" />
        <circle cx="164" cy="80" r="3.2" fill="#e5e7eb" />
      </g>
    </svg>
  )
}
