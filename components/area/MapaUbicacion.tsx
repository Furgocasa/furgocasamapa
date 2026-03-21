'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface Props {
  latitud: number
  longitud: number
  nombre: string
}

export function MapaUbicacion({ latitud, longitud, nombre }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  // Validar coordenadas ANTES de cualquier hook
  const coordenadasValidas = !isNaN(latitud) && !isNaN(longitud) && latitud !== 0 && longitud !== 0

  useEffect(() => {
    if (!coordenadasValidas || !mapContainerRef.current) return

    const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || 'get_your_own_key'

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
        center: [longitud, latitud],
        zoom: 15,
        attributionControl: false
      })

      map.addControl(new maplibregl.NavigationControl(), 'top-right')

      // Crear marcador
      const el = document.createElement('div')
      el.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: #0b3c74;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        cursor: pointer;
      `

      // Círculo blanco en el centro
      const inner = document.createElement('div')
      inner.style.cssText = `
        width: 12px;
        height: 12px;
        background-color: white;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      `
      el.appendChild(inner)

      new maplibregl.Marker({ element: el })
        .setLngLat([longitud, latitud])
        .addTo(map)

      // Añadir popup simple con el nombre
      const popup = new maplibregl.Popup({ offset: 25 })
        .setText(nombre)
      
      new maplibregl.Marker({ element: el })
        .setLngLat([longitud, latitud])
        .setPopup(popup)
        .addTo(map)

      mapRef.current = map

      return () => {
        map.remove()
      }
    } catch (error) {
      console.error('Error inicializando mapa de MapLibre:', error)
    }
  }, [latitud, longitud, nombre, coordenadasValidas])

  const handleComoLlegar = () => {
    // Abrir en Google Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`
    window.open(url, '_blank')
  }

  // DESPUÉS de todos los hooks, hacer el render condicional
  if (!coordenadasValidas) {
    return (
      <section className="bg-white rounded-lg shadow-mobile p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Ubicación</h2>
        </div>
        <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="font-medium">Coordenadas no disponibles</p>
            <p className="text-sm">No se puede mostrar el mapa para esta área</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-lg shadow-mobile p-6 border-t-4 border-[#0b3c74]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#0b3c74]">Ubicación</h2>
        <button
          onClick={handleComoLlegar}
          className="text-sm font-semibold text-[#0b3c74] hover:bg-sky-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-[#0b3c74]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Cómo llegar
        </button>
      </div>

      {/* Mapa */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-64 md:h-80 rounded-lg overflow-hidden border border-gray-200"
      />

      {/* Coordenadas */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>📍 {latitud.toFixed(6)}, {longitud.toFixed(6)}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${latitud},${longitud}`)
            alert('Coordenadas copiadas')
          }}
          className="text-[#0b3c74] hover:text-[#0d4a8f] font-semibold"
        >
          Copiar coordenadas
        </button>
      </div>
    </section>
  )
}
