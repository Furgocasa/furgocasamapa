'use client'

import { MapaInteractivo } from '@/components/mapa/MapaInteractivo'
import { FiltrosMapa, Filtros, paisPerteneceAFiltro } from '@/components/mapa/FiltrosMapa'
import { ListaResultados } from '@/components/mapa/ListaResultados'
import { Navbar } from '@/components/layout/Navbar'
import BottomSheet from '@/components/mobile/BottomSheet'
import { createClient } from '@/lib/supabase/client'
import type { Area } from '@/types/database.types'
import { useEffect, useState, useMemo, useRef } from 'react'
import { MapIcon, FunnelIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import LoginWall from '@/components/ui/LoginWall'
import { usePersistentFilters } from '@/hooks/usePersistentFilters'
import { ToastNotification } from '@/components/mapa/ToastNotification'
import { reverseGeocode } from '@/lib/google/geocoding'

export default function MapaPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true) // Para skeleton loader
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 })
  const [areaSeleccionada, setAreaSeleccionada] = useState<Area | null>(null)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [mostrarLista, setMostrarLista] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsActive, setGpsActive] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null)
  const mapRef = useRef<any>(null) // Referencia al mapa para controlarlo
  const skipMapCenterRef = useRef(false) // Evitar centrado automático después de búsqueda geográfica

  // Lista hardcodeada de países reales con áreas en la base de datos
  const paisesDisponibles = [
    'Alemania',
    'Andorra',
    'Argentina',
    'Austria',
    'Bélgica',
    'Chequia',
    'Chile',
    'Colombia',
    'Costa Rica',
    'Dinamarca',
    'Ecuador',
    'Eslovenia',
    'España',
    'Francia',
    'Italia',
    'Luxemburgo',
    'Noruega',
    'Países Bajos',
    'Panamá',
    'Paraguay',
    'Perú',
    'Portugal',
    'Puerto Rico',
    'Suecia',
    'Suiza',
    'Uruguay'
  ]

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

  // ✅ CARGAR TODAS LAS ÁREAS (SIN CACHÉ - siempre fresco)
  useEffect(() => {
    const loadAreas = async () => {
      try {
        setLoading(true)
        
        // Cargar DIRECTO desde Supabase - sin caché
        const supabase = createClient()
        const allAreas: Area[] = []
        const pageSize = 1000
        let page = 0
        let hasMore = true

        console.log(`🔄 Cargando áreas desde Supabase...`)

        while (hasMore) {
          const { data, error } = await supabase
            .from('areas')
            .select('id, nombre, slug, latitud, longitud, ciudad, provincia, pais, tipo_area, precio_noche, foto_principal, servicios, plazas_totales, acceso_24h, barrera_altura')
            .eq('activo', true)
            .order('nombre')
            .range(page * pageSize, (page + 1) * pageSize - 1)

          if (error) throw error

          if (data && data.length > 0) {
            allAreas.push(...(data as Area[]))
            console.log(`📦 Página ${page + 1}: ${data.length} áreas`)
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
  }, []) // Solo cargar una vez al inicio

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

              // Actualizar metadata GPS
              setMetadata({
                gpsCountry: detectedCountryValue,
                gpsActive: true,
                paisSource: metadata.paisSource === 'manual' ? 'manual' : (filtros.pais ? metadata.paisSource : 'gps')
              })

              // APLICAR FILTRO AUTOMÁTICO si no hay filtro de país previo
              if (!filtros.pais && metadata.paisSource !== 'manual') {
                console.log('✅ Aplicando filtro automático de país:', detectedCountryValue)
                setFiltros({
                  ...filtros,
                  pais: detectedCountryValue
                })

                // Mostrar Toast Notification
                setToastMessage(`Para mejorar los tiempos de carga, hemos aplicado un filtro del país donde te encuentras. Puedes cambiarlo en los filtros si lo deseas.`)
                setShowToast(true)
              } else {
                console.log('ℹ️ Ya existe filtro de país:', filtros.pais, '- No se aplica automático')
              }
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

  // Centrar mapa cuando cambia el filtro de país
  useEffect(() => {
    if (!filtros.pais || !mapRef.current) return

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
      // Centroamérica
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

    const coordenadas = paisCoordenadas[filtros.pais]

    // No centrar si el cambio viene del buscador geográfico
    if (skipMapCenterRef.current) {
      console.log('⏭️ Saltando centrado automático (cambio desde buscador geográfico)')
      skipMapCenterRef.current = false // Resetear para próxima vez
      return
    }

    if (coordenadas && mapRef.current) {
      console.log(`🗺️ Centrando mapa en ${filtros.pais}`)
      // Solo centrar (panTo), sin cambiar zoom
      mapRef.current.panTo({ lat: coordenadas.lat, lng: coordenadas.lng })
    }
  }, [filtros.pais])

  // Obtener países únicos de las áreas
  // Ya no necesitamos comunidades ni provincias

  const paisObjetivo = filtros.pais || (metadata.paisSource === 'gps' ? detectedCountry : '')
  const paisFiltroLista = metadata.paisSource === 'manual' ? filtros.pais : ''

  // ✅ ÁREAS PARA LA LISTA: Solo filtrar por país si es manual
  const areasParaLista = useMemo(() => {
    return areas.filter((area: any) => {
      // Filtro de búsqueda
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase()
        const coincide =
          area.nombre.toLowerCase().includes(busqueda) ||
          area.ciudad?.toLowerCase().includes(busqueda) ||
          area.provincia?.toLowerCase().includes(busqueda) ||
          area.descripcion?.toLowerCase().includes(busqueda)

        if (!coincide) return false
      }

      // Filtro de país/región (soporta regiones como REGION_EUROPA, REGION_SUDAMERICA)
      if (paisFiltroLista) {
        const paisArea = area.pais?.trim() || ''
        
        // Usar función que soporta regiones
        if (!paisPerteneceAFiltro(paisArea, paisFiltroLista)) {
          return false
        }
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

  // ✅ ÁREAS PARA EL MAPA: usar mismo país/región objetivo
  const areasParaMapa = useMemo(() => {
    if (!paisObjetivo) {
      // Si no hay país objetivo, mostrar todas las áreas (fallback)
      return areas
    }

    // Filtrar áreas usando la función que soporta regiones
    return areas.filter((area: any) => {
      const paisArea = area.pais?.trim() || ''
      return paisPerteneceAFiltro(paisArea, paisObjetivo)
    })
  }, [areas, paisObjetivo])

  const handleAreaClick = (area: Area) => {
    setAreaSeleccionada(area)
    // En móvil se muestra el InfoWindow del mapa, no se abre la lista
  }

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

  // Mostrar loading mientras comprobamos autenticación
  if (authLoading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    )
  }

  // Skeleton Loader MEJORADO - Solo primera carga, luego cache instantáneo
  if (initialLoading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
        <Navbar />

        {/* Skeleton del mapa con animación */}
        <div className="flex-1 relative">
          {/* Fondo con patrón de mapa */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}></div>
          </div>

          {/* Indicador de carga centrado */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
              {/* Icono de mapa animado */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <MapIcon className="w-16 h-16 text-sky-600 animate-pulse" />
                  <div className="absolute inset-0 animate-ping opacity-20">
                    <MapIcon className="w-16 h-16 text-sky-600" />
                  </div>
                </div>
              </div>

              {/* Texto dinámico basado en si viene de cache */}
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                {areas.length > 0 ? '⚡ Carga Instantánea' : 'Cargando Mapa'}
              </h2>
              <p className="text-gray-600 text-center mb-6">
                {areas.length > 0
                  ? `${areas.length} áreas desde cache...`
                  : loadingProgress.loaded > 0
                    ? `${loadingProgress.loaded} áreas cargadas...`
                    : 'Preparando tu mapa de autocaravanas...'}
              </p>

              {/* Barra de progreso - solo si está cargando desde servidor */}
              {loadingProgress.loaded > 0 && areas.length === 0 && (
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-blue-600 h-full transition-all duration-300 ease-out rounded-full"
                    style={{
                      width: `${Math.min((loadingProgress.loaded / 5000) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              )}

              {/* Spinner */}
              <div className="flex justify-center mt-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      {/* Navbar - siempre visible */}
      <Navbar />

      {/* Layout principal - difuminado si no hay usuario */}
      <main className={`flex-1 relative flex overflow-hidden min-h-0 ${!user ? 'blur-sm pointer-events-none select-none' : ''}`}>
        {/* Panel de Filtros - Desktop y Tablet */}
        <aside className="hidden md:block md:w-72 lg:w-80 bg-white shadow-lg border-r overflow-y-auto overflow-x-hidden">
          <FiltrosMapa
            filtros={filtros}
            onFiltrosChange={setFiltros}
            onPaisChange={handlePaisManualChange}
            onClose={() => {}}
            totalResultados={areasParaLista.length}
            paisesDisponibles={paisesDisponibles}
          />
        </aside>

        {/* Mapa - Centro */}
        <div className="flex-1 relative">
          <MapaInteractivo
            areas={areasParaMapa}
            areaSeleccionada={areaSeleccionada}
            onAreaClick={handleAreaClick}
            mapRef={mapRef}
            onCountryChange={handleCountryChange}
            currentCountry={paisObjetivo || undefined}
          />


          {/* Contador de resultados con indicador de carga */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 z-10">
            <p className="text-sm font-semibold text-gray-700">
              {areasParaMapa.length} {areasParaMapa.length === 1 ? 'área' : 'áreas'}
              {detectedCountry && (
                <span className="ml-2 text-xs text-gray-500">({detectedCountry})</span>
              )}
              {loading && (
                <span className="ml-2 inline-flex items-center">
                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-sky-600"></span>
                  <span className="ml-1 text-xs text-gray-500">cargando...</span>
                </span>
              )}
            </p>
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

      {/* Modal de bloqueo si no hay usuario */}
      {!user && <LoginWall feature="mapa" />}

      {/* Toast Notification para GPS - Solo si está logueado */}
      {user && (
        <ToastNotification
          show={showToast}
          message={toastMessage}
          country={detectedCountry || undefined}
          onClose={() => setShowToast(false)}
          onViewFilters={() => setMostrarFiltros(true)}
        />
      )}

      {/* Bottom Sheet - Filtros (solo móvil) */}
      <BottomSheet
        isOpen={mostrarFiltros}
        onClose={() => setMostrarFiltros(false)}
        title="Filtros"
        snapPoints={['full']}
      >
        <FiltrosMapa
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onPaisChange={handlePaisManualChange}
          onClose={() => setMostrarFiltros(false)}
          totalResultados={areasParaLista.length}
          paisesDisponibles={paisesDisponibles}
        />
      </BottomSheet>

      {/* Bottom Sheet - Lista (solo móvil) */}
      <BottomSheet
        isOpen={mostrarLista}
        onClose={() => setMostrarLista(false)}
        title={`${areasParaLista.length} Lugares`}
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-40">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Mapa */}
          <button
            onClick={() => {
              setMostrarFiltros(false)
              setMostrarLista(false)
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              !mostrarFiltros && !mostrarLista ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <MapIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Mapa</span>
          </button>

          {/* Filtros */}
          <button
            onClick={() => setMostrarFiltros(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              mostrarFiltros ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <FunnelIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Filtros</span>
          </button>

          {/* Lista */}
          <button
            onClick={() => setMostrarLista(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
              mostrarLista ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <div className="relative">
              <ListBulletIcon className="w-6 h-6 mb-1" />
              {areasParaLista.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center">
                  {areasParaLista.length > 99 ? '99+' : areasParaLista.length}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Lista</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
