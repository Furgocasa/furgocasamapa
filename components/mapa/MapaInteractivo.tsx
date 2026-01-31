'use client'

import { useMapConfig } from '@/hooks/useMapConfig'
import type { Area } from '@/types/database.types'
import { MapaInteractivoGoogle } from './MapaInteractivoGoogle'
import { MapLibreMap } from './MapLibreMap'
import { LeafletMap } from './LeafletMap'

interface MapaInteractivoProps {
  areas: Area[]
  areaSeleccionada: Area | null
  onAreaClick: (area: Area) => void
  mapRef?: React.MutableRefObject<any>
  onCountryChange?: (country: string, previousCountry: string | null) => void
  currentCountry?: string
  paisFiltro?: string
}

/**
 * Wrapper que elige el proveedor de mapa según la configuración
 */
export function MapaInteractivo(props: MapaInteractivoProps) {
  const { config, loading } = useMapConfig()

  // Mostrar loading mientras se carga la configuración
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  console.log('🗺️ Proveedor de mapa seleccionado:', config.proveedor, '| Estilo:', config.estilo)

  // Renderizar el mapa según el proveedor configurado
  // ✅ Usamos key={config.estilo} para forzar remontaje cuando cambia el estilo
  switch (config.proveedor) {
    case 'maplibre':
      return <MapLibreMap key={`maplibre-${config.estilo}`} {...props} estilo={config.estilo} />
    
    case 'leaflet':
      return <LeafletMap key={`leaflet-${config.estilo}`} {...props} estilo={config.estilo} />
    
    case 'google':
    default:
      return <MapaInteractivoGoogle key={`google-${config.estilo}`} {...props} estilo={config.estilo} />
  }
}
