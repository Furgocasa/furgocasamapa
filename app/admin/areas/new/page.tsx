'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { usePaisesDisponibles } from '@/hooks/usePaisesDisponibles'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  ArrowLeftIcon,
  PhotoIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'

const GooglePlacesPicker = dynamic(() => import('@/components/admin/GooglePlacesPicker'), {
  ssr: false,
  loading: () => <div className="text-center py-8">Cargando mapa...</div>
})

const SERVICIOS_DISPONIBLES = [
  { id: 'agua', label: '💧 Agua' },
  { id: 'electricidad', label: '⚡ Electricidad' },
  { id: 'vaciado_aguas_negras', label: '♻️ Vaciado Químico' },
  { id: 'vaciado_aguas_grises', label: '🚰 Vaciado Aguas Grises' },
  { id: 'wifi', label: '📶 WiFi' },
  { id: 'duchas', label: '🚿 Duchas' },
  { id: 'wc', label: '🚻 WC' },
  { id: 'lavanderia', label: '🧺 Lavandería' },
  { id: 'restaurante', label: '🍽️ Restaurante' },
  { id: 'supermercado', label: '🛒 Supermercado' },
  { id: 'zona_mascotas', label: '🐕 Zona Mascotas' }
]

export default function NewAreaPage() {
  const router = useRouter()
  const { paises } = usePaisesDisponibles()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [customPais, setCustomPais] = useState('')
  const [showCustomPais, setShowCustomPais] = useState(false)
  const [area, setArea] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    tipo_area: 'publica' as 'publica' | 'privada' | 'camping',
    pais: 'España',
    provincia: '',
    ciudad: '',
    direccion: '',
    codigo_postal: '',
    latitud: 0,
    longitud: 0,
    precio_noche: null as number | null,
    plazas_camper: 0,
    telefono: '',
    email: '',
    website: '',
    google_maps_url: '',
    foto_principal: '',
    verificado: false,
    activo: true,
    servicios: {} as Record<string, boolean>
  })

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user || !session.user.user_metadata?.is_admin) {
      router.push('/mapa')
      return
    }
  }

  const generateSlug = (nombre: string) => {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      
      // Generar slug si no existe
      const slug = area.slug || generateSlug(area.nombre)
      
      // Verificar que el slug no exista
      const { data: existingArea } = await (supabase as any)
        .from('areas')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existingArea) {
        setMessage({ type: 'error', text: 'Ya existe un área con este nombre. Por favor, usa otro.' })
        setSaving(false)
        return
      }

      const { data, error } = await (supabase as any)
        .from('areas')
        .insert([{
          ...area,
          slug
        }])
        .select()
        .single()

      if (error) throw error

      setMessage({ type: 'success', text: '✅ Área creada correctamente' })
      
      // Redirigir a la página de edición después de crear
      setTimeout(() => {
        router.push(`/admin/areas/edit/${data.id}`)
      }, 1500)
    } catch (error: any) {
      console.error('Error creando área:', error)
      setMessage({ type: 'error', text: error.message || 'Error al crear el área' })
      setSaving(false)
    }
  }

  const handleServicioToggle = (servicioId: string) => {
    setArea(prev => ({
      ...prev,
      servicios: {
        ...(prev.servicios as Record<string, boolean>),
        [servicioId]: !(prev.servicios as Record<string, boolean>)?.[servicioId]
      }
    }))
  }

  const handlePlaceSelected = (placeData: any) => {
    setArea(prev => ({
      ...prev,
      nombre: placeData.nombre || prev.nombre,
      slug: placeData.nombre ? generateSlug(placeData.nombre) : prev.slug,
      direccion: placeData.direccion || prev.direccion,
      ciudad: placeData.ciudad || prev.ciudad,
      provincia: placeData.provincia || prev.provincia,
      pais: placeData.pais || prev.pais,
      codigo_postal: placeData.codigo_postal || prev.codigo_postal,
      latitud: placeData.latitud || prev.latitud,
      longitud: placeData.longitud || prev.longitud,
      telefono: placeData.telefono || prev.telefono,
      website: placeData.web || prev.website,
      google_maps_url: placeData.google_maps_url || prev.google_maps_url,
      foto_principal: placeData.foto_principal || prev.foto_principal,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/areas"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nueva Área</h1>
              <p className="mt-1 text-sm text-gray-500">Añadir una nueva área de pernocta</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensaje */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Buscador de Google Places */}
          <GooglePlacesPicker
            onPlaceSelected={handlePlaceSelected}
            initialLat={area.latitud || undefined}
            initialLng={area.longitud || undefined}
          />

          {/* Información Básica */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Básica</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Área * <span className="text-red-500">(Requerido)</span>
                </label>
                <input
                  type="text"
                  required
                  value={area.nombre}
                  onChange={(e) => {
                    setArea({ ...area, nombre: e.target.value })
                    if (!area.slug) {
                      setArea(prev => ({ ...prev, slug: generateSlug(e.target.value) }))
                    }
                  }}
                  placeholder="Ej: Área de Autocaravanas El Mirador"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              {/* Slug */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL (Slug) * <span className="text-gray-500">(Se genera automáticamente)</span>
                </label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-500 rounded-l-lg border border-r-0 border-gray-300">
                    /area/
                  </span>
                  <input
                    type="text"
                    required
                    value={area.slug}
                    onChange={(e) => setArea({ ...area, slug: e.target.value })}
                    placeholder="area-de-autocaravanas-el-mirador"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  rows={4}
                  value={area.descripcion}
                  onChange={(e) => setArea({ ...area, descripcion: e.target.value })}
                  placeholder="Describe el área, sus características, servicios, ubicación..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Área *
                </label>
                <select
                  required
                  value={area.tipo_area}
                  onChange={(e) => setArea({ ...area, tipo_area: e.target.value as 'publica' | 'privada' | 'camping' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="publica">Pública</option>
                  <option value="privada">Privada</option>
                  <option value="camping">Camping</option>
                </select>
              </div>

              {/* Precio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio por Noche (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={area.precio_noche ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    setArea({ 
                      ...area, 
                      precio_noche: val === '' ? null : (parseFloat(val) || null)
                    })
                  }}
                  placeholder="Dejar vacío si desconocido"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usa <strong>0</strong> para áreas gratuitas, o <strong>déjalo vacío</strong> si el precio es desconocido
                </p>
              </div>

              {/* Capacidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidad de Campers
                </label>
                <input
                  type="number"
                  min="0"
                  value={area.plazas_camper}
                  onChange={(e) => setArea({ ...area, plazas_camper: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              {/* Estados */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={area.verificado}
                    onChange={(e) => setArea({ ...area, verificado: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Verificada</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={area.activo}
                    onChange={(e) => setArea({ ...area, activo: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Activa</span>
                </label>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Ubicación</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">País *</label>
                {!showCustomPais ? (
                  <div className="flex gap-2">
                    <select
                      value={paises.includes(area.pais) ? area.pais : '__custom__'}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setShowCustomPais(true)
                          setCustomPais('')
                        } else {
                          setArea({ ...area, pais: e.target.value })
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      required
                    >
                      {paises.map((p: any) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                      <option value="__custom__">➕ Otro país...</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customPais}
                      onChange={(e) => setCustomPais(e.target.value)}
                      onBlur={() => {
                        if (customPais.trim()) {
                          setArea({ ...area, pais: customPais.trim() })
                          setShowCustomPais(false)
                          setCustomPais('')
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && customPais.trim()) {
                          setArea({ ...area, pais: customPais.trim() })
                          setShowCustomPais(false)
                          setCustomPais('')
                        }
                      }}
                      placeholder="Escribe el nombre del país (ej: Argentina)"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomPais(false)
                        setCustomPais('')
                      }}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Puedes añadir cualquier país. Los países se actualizan automáticamente en los filtros.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
                <input
                  type="text"
                  value={area.provincia}
                  onChange={(e) => setArea({ ...area, provincia: e.target.value })}
                  placeholder="Ej: Barcelona, Madrid..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
                <input
                  type="text"
                  value={area.ciudad}
                  onChange={(e) => setArea({ ...area, ciudad: e.target.value })}
                  placeholder="Ej: Barcelona, Madrid..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Código Postal</label>
                <input
                  type="text"
                  value={area.codigo_postal}
                  onChange={(e) => setArea({ ...area, codigo_postal: e.target.value })}
                  placeholder="08001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  value={area.direccion}
                  onChange={(e) => setArea({ ...area, direccion: e.target.value })}
                  placeholder="Calle, número..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitud * <span className="text-red-500">(Requerido)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={area.latitud || ''}
                  onChange={(e) => setArea({ ...area, latitud: parseFloat(e.target.value) })}
                  placeholder="41.3851"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitud * <span className="text-red-500">(Requerido)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={area.longitud || ''}
                  onChange={(e) => setArea({ ...area, longitud: parseFloat(e.target.value) })}
                  placeholder="2.1734"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Puedes obtener las coordenadas desde Google Maps haciendo clic derecho en el mapa y copiando las coordenadas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contacto y Enlaces */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Contacto y Enlaces</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={area.telefono}
                  onChange={(e) => setArea({ ...area, telefono: e.target.value })}
                  placeholder="+34 123 456 789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={area.email}
                  onChange={(e) => setArea({ ...area, email: e.target.value })}
                  placeholder="info@area.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sitio Web</label>
                <input
                  type="url"
                  value={area.website}
                  onChange={(e) => setArea({ ...area, website: e.target.value })}
                  placeholder="https://www.ejemplo.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">URL de Google Maps</label>
                <input
                  type="url"
                  value={area.google_maps_url}
                  onChange={(e) => setArea({ ...area, google_maps_url: e.target.value })}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Servicios Disponibles</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERVICIOS_DISPONIBLES.map((servicio: any) => (
                <label
                  key={servicio.id}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    (area.servicios as Record<string, boolean>)?.[servicio.id]
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-sky-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={(area.servicios as Record<string, boolean>)?.[servicio.id] || false}
                    onChange={() => handleServicioToggle(servicio.id)}
                    className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{servicio.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Imágenes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Imágenes</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto Principal (URL)
                </label>
                <input
                  type="url"
                  value={area.foto_principal}
                  onChange={(e) => setArea({ ...area, foto_principal: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                {area.foto_principal && (
                  <img 
                    src={area.foto_principal} 
                    alt="Preview" 
                    className="mt-3 w-full max-w-md h-48 object-cover rounded-lg"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4 justify-end">
            <Link
              href="/admin/areas"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creando...' : 'Crear Área'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

