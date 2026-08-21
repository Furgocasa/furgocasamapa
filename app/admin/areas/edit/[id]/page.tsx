'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal'
import { usePaisesDisponibles } from '@/hooks/usePaisesDisponibles'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  ArrowLeftIcon,
  PhotoIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import type { Area } from '@/types/database.types'

const GooglePlacesPicker = dynamic(
  () => import('@/components/admin/GooglePlacesPicker'),
  {
    ssr: false,
    loading: () => <div className="text-center py-8">Cargando mapa...</div>
  }
) as any

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

export default function EditAreaPage() {
  const params = useParams()
  const router = useRouter()
  const { paises } = usePaisesDisponibles()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [customPais, setCustomPais] = useState('')
  const [showCustomPais, setShowCustomPais] = useState(false)
  const [deleteImageModal, setDeleteImageModal] = useState<{
    isOpen: boolean
    index: number | null
  }>({ isOpen: false, index: null })
  const [area, setArea] = useState<Partial<Area>>({
    nombre: '',
    slug: '',
    descripcion: '',
    tipo_area: 'publica',
    pais: 'España',
    provincia: '',
    ciudad: '',
    direccion: '',
    codigo_postal: '',
    latitud: 0,
    longitud: 0,
    precio_noche: 0,
    plazas_camper: 0,
    telefono: '',
    email: '',
    website: '',
    google_maps_url: '',
    foto_principal: '',
    fotos_urls: [],
    verificado: false,
    activo: true,
    servicios: {}
  })

  useEffect(() => {
    checkAdminAndLoadArea()
  }, [params.id])

  const checkAdminAndLoadArea = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user || !session.user.user_metadata?.is_admin) {
      router.push('/mapa')
      return
    }

    loadArea()
  }

  const loadArea = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await (supabase as any)
        .from('areas')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      
      setArea(data)
    } catch (error) {
      console.error('Error cargando área:', error)
      setMessage({ type: 'error', text: 'Error al cargar el área' })
    } finally {
      setLoading(false)
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
      
      // Generar slug si el nombre cambió
      const slug = area.slug || generateSlug(area.nombre || '')
      
      console.log('💾 Guardando área...', {
        id: params.id,
        nombre: area.nombre,
        fotos_urls: area.fotos_urls,
        foto_principal: area.foto_principal
      })
      
      const { error } = await (supabase as any)
        .from('areas')
        .update({
          ...area,
          slug,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) {
        console.error('❌ Error de Supabase:', error)
        throw error
      }

      console.log('✅ Área guardada correctamente')
      setMessage({ type: 'success', text: '✅ Área actualizada correctamente' })
      setHasUnsavedChanges(false)
      
      // Recargar datos
      setTimeout(() => {
        loadArea()
      }, 1500)
    } catch (error: any) {
      console.error('❌ Error actualizando área:', error)
      setMessage({ type: 'error', text: error.message || 'Error al actualizar el área' })
    } finally {
      setSaving(false)
    }
  }

  const handleServicioToggle = (servicioId: string) => {
    setArea(prev => ({
      ...prev,
      servicios: {
        ...(typeof prev.servicios === 'object' ? prev.servicios : {}),
        [servicioId]: !(prev.servicios as any)?.[servicioId]
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="spinner mb-4"></div>
            <p className="text-gray-600">Cargando área...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/areas"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Editar Área</h1>
                <p className="mt-1 text-sm text-gray-500">{area.nombre}</p>
              </div>
            </div>
            <Link
              href={`/area/${area.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <MapPinIcon className="w-5 h-5" />
              Ver en el Mapa
            </Link>
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
                  Nombre del Área *
                </label>
                <input
                  type="text"
                  required
                  value={area.nombre || ''}
                  onChange={(e) => {
                    setArea({ ...area, nombre: e.target.value })
                    if (!area.slug) {
                      setArea(prev => ({ ...prev, slug: generateSlug(e.target.value) }))
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              {/* Slug */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL (Slug) *
                </label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-500 rounded-l-lg border border-r-0 border-gray-300">
                    /area/
                  </span>
                  <input
                    type="text"
                    required
                    value={area.slug || ''}
                    onChange={(e) => setArea({ ...area, slug: e.target.value })}
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
                  value={area.descripcion || ''}
                  onChange={(e) => setArea({ ...area, descripcion: e.target.value })}
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
                  value={area.tipo_area || 'publica'}
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
                  value={area.plazas_camper || 0}
                  onChange={(e) => setArea({ ...area, plazas_camper: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              {/* Estados */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={area.verificado || false}
                    onChange={(e) => setArea({ ...area, verificado: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Verificada</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={area.activo !== false}
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
                      value={paises.includes(area.pais || '') ? area.pais : '__custom__'}
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
                      placeholder="Escribe el nombre del país"
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
                  Los países se cargan dinámicamente de las áreas existentes. Puedes añadir cualquier país nuevo.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
                <input
                  type="text"
                  value={area.provincia || ''}
                  onChange={(e) => setArea({ ...area, provincia: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
                <input
                  type="text"
                  value={area.ciudad || ''}
                  onChange={(e) => setArea({ ...area, ciudad: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Código Postal</label>
                <input
                  type="text"
                  value={area.codigo_postal || ''}
                  onChange={(e) => setArea({ ...area, codigo_postal: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  value={area.direccion || ''}
                  onChange={(e) => setArea({ ...area, direccion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Latitud *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={area.latitud || ''}
                  onChange={(e) => setArea({ ...area, latitud: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Longitud *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={area.longitud || ''}
                  onChange={(e) => setArea({ ...area, longitud: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
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
                  value={area.telefono || ''}
                  onChange={(e) => setArea({ ...area, telefono: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={area.email || ''}
                  onChange={(e) => setArea({ ...area, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sitio Web</label>
                <input
                  type="url"
                  value={area.website || ''}
                  onChange={(e) => setArea({ ...area, website: e.target.value })}
                  placeholder="https://"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">URL de Google Maps</label>
                <input
                  type="url"
                  value={area.google_maps_url || ''}
                  onChange={(e) => setArea({ ...area, google_maps_url: e.target.value })}
                  placeholder="https://maps.google.com/..."
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
                  className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-sky-500 transition-colors"
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

          {/* Galería de Imágenes */}
          <div className="bg-white rounded-lg shadow p-6">
            {/* Banner de cambios sin guardar */}
            {hasUnsavedChanges && (
              <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg flex items-start gap-3 animate-pulse">
                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="font-bold text-yellow-900">⚠️ Tienes cambios sin guardar</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Has modificado la galería de imágenes. <strong>Haz clic en "Guardar Cambios"</strong> al final de la página para aplicar los cambios.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-2 rounded-lg">
                  <PhotoIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Galería de Imágenes</h2>
                  <p className="text-sm text-gray-500">
                    {(area.fotos_urls as string[] || []).length} de 7 imágenes
                  </p>
                </div>
              </div>
              <Link
                href="/admin/areas/enriquecer-imagenes"
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-semibold"
              >
                Buscar Más Imágenes
              </Link>
            </div>

            {/* Grid de Imágenes */}
            {(area.fotos_urls as string[] || []).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(area.fotos_urls as string[] || []).map((foto: any, index: any) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-sky-500 transition-all bg-gray-100"
                  >
                    {/* Badge de Posición */}
                    <div className="absolute top-2 left-2 z-10 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-bold">
                      #{index + 1}
                      {index === 0 && ' 📌'}
                    </div>

                    {/* Imagen */}
                    <img
                      src={foto}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Error+cargando+imagen'
                      }}
                    />

                    {/* Overlay con Controles */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {/* Botón Mover Izquierda */}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            console.log('⬅️ Moviendo imagen a la izquierda')
                            const fotos = [...(area.fotos_urls as string[] || [])]
                            ;[fotos[index], fotos[index - 1]] = [fotos[index - 1], fotos[index]]
                            setArea({ 
                              ...area, 
                              fotos_urls: fotos,
                              foto_principal: fotos[0]
                            })
                            setHasUnsavedChanges(true)
                          }}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Mover a la izquierda"
                        >
                          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                      )}

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={() => setDeleteImageModal({ isOpen: true, index })}
                        className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                        title="Eliminar imagen"
                      >
                        <TrashIcon className="w-5 h-5 text-white" />
                      </button>

                      {/* Botón Mover Derecha */}
                      {index < (area.fotos_urls as string[] || []).length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            console.log('➡️ Moviendo imagen a la derecha')
                            const fotos = [...(area.fotos_urls as string[] || [])]
                            ;[fotos[index], fotos[index + 1]] = [fotos[index + 1], fotos[index]]
                            setArea({ 
                              ...area, 
                              fotos_urls: fotos,
                              foto_principal: fotos[0]
                            })
                            setHasUnsavedChanges(true)
                          }}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Mover a la derecha"
                        >
                          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Indicador de Foto Principal */}
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold text-center">
                        ⭐ Foto Principal
                      </div>
                    )}
                  </div>
                ))}

                {/* Placeholder para más imágenes */}
                {Array.from({ length: 7 - (area.fotos_urls as string[] || []).length }).map((_: any, i: any) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400"
                  >
                    <PhotoIcon className="w-12 h-12 mb-2 opacity-30" />
                    <span className="text-xs">Vacío</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <PhotoIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay imágenes en la galería
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Usa el sistema de búsqueda automática de imágenes para llenar la galería
                </p>
                <Link
                  href="/admin/areas/enriquecer-imagenes"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-semibold"
                >
                  <PhotoIcon className="w-5 h-5" />
                  Buscar Imágenes Automáticamente
                </Link>
              </div>
            )}

            {/* Información Adicional */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Consejos:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>La primera imagen será la <strong>foto principal</strong> del área</li>
                    <li>Usa las flechas para <strong>reordenar</strong> las imágenes</li>
                    <li>Puedes tener hasta <strong>7 imágenes</strong> en la galería</li>
                    <li>Haz clic en el icono de papelera para <strong>eliminar</strong> una imagen</li>
                  </ul>
                </div>
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
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </main>

      {/* Modal de Confirmación para Eliminar Imagen */}
      <DeleteConfirmModal
        isOpen={deleteImageModal.isOpen}
        onClose={() => setDeleteImageModal({ isOpen: false, index: null })}
        onConfirm={() => {
          if (deleteImageModal.index !== null) {
            console.log('🗑️ Eliminando imagen #' + (deleteImageModal.index + 1))
            const fotos = [...(area.fotos_urls as string[] || [])].filter((_: any, i: any) => i !== deleteImageModal.index)
            setArea({ 
              ...area, 
              fotos_urls: fotos,
              foto_principal: fotos[0] || null
            })
            setHasUnsavedChanges(true)
            setDeleteImageModal({ isOpen: false, index: null })
            console.log('✅ Imagen eliminada del estado. No olvides guardar los cambios!')
          }
        }}
        title="⚠️ Eliminar Imagen"
        itemName={`Imagen #${(deleteImageModal.index || 0) + 1}`}
        warningText="Esta imagen será eliminada de la galería. No olvides guardar los cambios después."
      />
    </div>
  )
}

