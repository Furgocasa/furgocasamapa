'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function AdminMapasPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    proveedor: 'google',
    estilo: 'default'
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    checkAdmin()
    loadCurrentConfig()
  }, [])

  const checkAdmin = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user || !session.user.user_metadata?.is_admin) {
      router.push('/mapa')
    }
  }

  const loadCurrentConfig = async () => {
    try {
      const supabase = createClient()
      const { data } = await (supabase as any)
        .from('configuracion_mapas')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setConfig({
          proveedor: data.proveedor,
          estilo: data.estilo
        })
      }
    } catch (err) {
      console.error('Error cargando configuración:', err)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()

      // Desactivar todas las configuraciones anteriores
      await (supabase as any)
        .from('configuracion_mapas')
        .update({ activo: false })
        .eq('activo', true)

      // Crear nueva configuración activa
      const { error } = await (supabase as any)
        .from('configuracion_mapas')
        .insert({
          proveedor: config.proveedor,
          estilo: config.estilo,
          activo: true
        })

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: '✅ Configuración guardada. Recarga la página del mapa para ver los cambios.' 
      })

      // Ocultar mensaje después de 5 segundos
      setTimeout(() => setMessage(null), 5000)
    } catch (err) {
      console.error('Error guardando configuración:', err)
      setMessage({ 
        type: 'error', 
        text: '❌ Error al guardar la configuración. Intenta de nuevo.' 
      })
    } finally {
      setSaving(false)
    }
  }

  const proveedores = [
    {
      id: 'google',
      name: 'Google Maps',
      description: 'Proveedor premium con datos completos',
      badge: 'Premium',
      badgeColor: 'bg-blue-100 text-blue-800',
      pros: ['Datos más completos', 'Mejor geocoding', 'Street View'],
      cons: ['Costoso', 'Límites de uso']
    },
    {
      id: 'maplibre',
      name: 'MapLibre GL (OSM)',
      description: 'Rápido, moderno y gratuito con OpenStreetMap',
      badge: 'Recomendado',
      badgeColor: 'bg-green-100 text-green-800',
      pros: ['Gratis', 'Muy rápido (WebGL)', 'Sin límites'],
      cons: ['Datos menos completos', 'Requiere tiles externos']
    },
    {
      id: 'leaflet',
      name: 'Leaflet (OSM)',
      description: 'Ligero y estable con OpenStreetMap',
      badge: 'Ligero',
      badgeColor: 'bg-gray-100 text-gray-800',
      pros: ['Muy ligero', 'Gratis', 'Estable'],
      cons: ['Más lento con muchos marcadores', 'Sin WebGL']
    }
  ]

  const estilos = [
    { id: 'default', name: 'Default', description: 'Estilo estándar del proveedor' },
    { id: 'waze', name: 'Waze-like (Minimal)', description: 'Estilo simplificado tipo Waze' },
    { id: 'satellite', name: 'Satélite', description: 'Vista satelital (solo Google)' },
    { id: 'dark', name: 'Dark Mode', description: 'Modo oscuro (próximamente)' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MapIcon className="w-8 h-8 text-sky-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Configuración de Mapas
            </h1>
          </div>
          <p className="text-gray-600">
            Selecciona el proveedor y estilo de mapas que se usará en toda la aplicación
          </p>
        </div>

        {/* Mensaje de éxito/error */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Selector de Proveedor */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Proveedor de Mapa
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proveedores.map((proveedor) => (
              <button
                key={proveedor.id}
                onClick={() => setConfig({ ...config, proveedor: proveedor.id })}
                className={`relative bg-white rounded-lg p-6 text-left transition-all ${
                  config.proveedor === proveedor.id
                    ? 'ring-2 ring-sky-500 shadow-lg'
                    : 'border border-gray-200 hover:border-sky-300 hover:shadow-md'
                }`}
              >
                {config.proveedor === proveedor.id && (
                  <CheckCircleIcon className="absolute top-4 right-4 w-6 h-6 text-sky-500" />
                )}
                
                <div className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-3 ${proveedor.badgeColor}`}>
                  {proveedor.badge}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {proveedor.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {proveedor.description}
                </p>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-green-600">✓ Pros:</span>
                    <ul className="ml-4 mt-1 space-y-1">
                      {proveedor.pros.map((pro, idx) => (
                        <li key={idx} className="text-gray-600">• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold text-red-600">✗ Contras:</span>
                    <ul className="ml-4 mt-1 space-y-1">
                      {proveedor.cons.map((con, idx) => (
                        <li key={idx} className="text-gray-600">• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Estilo */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Estilo Visual
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {estilos.map((estilo) => (
              <button
                key={estilo.id}
                onClick={() => setConfig({ ...config, estilo: estilo.id })}
                disabled={estilo.id === 'satellite' && config.proveedor !== 'google'}
                className={`relative bg-white rounded-lg p-4 text-left transition-all ${
                  config.estilo === estilo.id
                    ? 'ring-2 ring-sky-500 shadow-lg'
                    : 'border border-gray-200 hover:border-sky-300 hover:shadow-md'
                } ${estilo.id === 'satellite' && config.proveedor !== 'google' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {config.estilo === estilo.id && (
                  <CheckCircleIcon className="absolute top-4 right-4 w-5 h-5 text-sky-500" />
                )}
                
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {estilo.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {estilo.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-sky-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>

        {/* Info adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            ℹ️ Información Importante
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Los cambios se aplican en <strong>toda la aplicación</strong> (Mapa y Rutas)</li>
            <li>• Después de guardar, <strong>recarga las páginas</strong> para ver los cambios</li>
            <li>• La configuración se guarda en la base de datos y persiste entre sesiones</li>
            <li>• Solo administradores pueden cambiar esta configuración</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
