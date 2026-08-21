'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'
import Link from 'next/link'
import {
  MapPinIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  ArrowPathIcon,
  SparklesIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  TableCellsIcon,
  MapIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

export default function AdminDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user || !session.user.user_metadata?.is_admin) {
      router.push('/mapa')
    }
  }

  const sections = [
    {
      title: 'Gestión de Áreas',
      description: 'Administra áreas para autocaravanas',
      icon: <MapPinIcon className="w-12 h-12" />,
      href: '/admin/areas',
      color: 'from-sky-500 to-blue-600'
    },
    {
      title: 'Nueva Área',
      description: 'Añade una nueva área manualmente',
      icon: <PlusIcon className="w-12 h-12" />,
      href: '/admin/areas/new',
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Búsqueda Masiva',
      description: 'Encuentra áreas en Google Maps',
      icon: <MagnifyingGlassIcon className="w-12 h-12" />,
      href: '/admin/areas/busqueda-masiva',
      color: 'from-blue-500 to-sky-600'
    },
    {
      title: 'Configuración de Mapas',
      description: 'Elige proveedor y estilo de mapas',
      icon: <MapIcon className="w-12 h-12" />,
      href: '/admin/mapas',
      color: 'from-violet-500 to-purple-600'
    },
    {
      title: 'Actualizar Servicios',
      description: 'Detecta servicios con IA y SerpAPI',
      icon: <ArrowPathIcon className="w-12 h-12" />,
      href: '/admin/areas/actualizar-servicios',
      color: 'from-teal-500 to-cyan-600'
    },
    {
      title: 'Enriquecer Textos',
      description: 'Genera descripciones automáticas',
      icon: <SparklesIcon className="w-12 h-12" />,
      href: '/admin/areas/enriquecer-textos',
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Enriquecer Imágenes',
      description: 'Busca y añade imágenes automáticamente',
      icon: <PhotoIcon className="w-12 h-12" />,
      href: '/admin/areas/enriquecer-imagenes',
      color: 'from-pink-500 to-rose-600'
    },
    {
      title: 'Derechos de imagen',
      description: 'Revisa, borra fotos de terceros y genera IA',
      icon: <ExclamationTriangleIcon className="w-12 h-12" />,
      href: '/admin/areas/revisar-imagenes',
      color: 'from-amber-500 to-red-600'
    },
    {
      title: 'Usuarios',
      description: 'Gestiona usuarios del sistema',
      icon: <UsersIcon className="w-12 h-12" />,
      href: '/admin/users',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      title: 'Analíticas',
      description: 'Reportes y estadísticas',
      icon: <ChartBarIcon className="w-12 h-12" />,
      href: '/admin/analytics',
      color: 'from-orange-500 to-red-600'
    },
    {
      title: 'Configuración de IA',
      description: 'Ajusta prompts y parámetros',
      icon: <CogIcon className="w-12 h-12" />,
      href: '/admin/configuracion',
      color: 'from-gray-600 to-slate-700'
    },
    {
      title: 'Respuestas Tío Viajero',
      description: 'Revisa y evalúa respuestas del chatbot',
      icon: <ChatBubbleLeftRightIcon className="w-12 h-12" />,
      href: '/admin/chatbot-respuestas',
      color: 'from-sky-500 to-indigo-600'
    },
    {
      title: 'Reportes de Accidentes',
      description: 'Gestiona reportes y estadísticas',
      icon: <ExclamationTriangleIcon className="w-12 h-12" />,
      href: '/admin/reportes',
      color: 'from-red-500 to-orange-600'
    },
    {
      title: 'Gestión de Vehículos',
      description: 'Analiza el parque de autocaravanas',
      icon: <TruckIcon className="w-12 h-12" />,
      href: '/admin/vehiculos',
      color: 'from-cyan-500 to-blue-600'
    },
    {
      title: 'Datos de Mercado',
      description: 'Gestiona comparables para valoraciones',
      icon: <TableCellsIcon className="w-12 h-12" />,
      href: '/admin/datos-mercado',
      color: 'from-emerald-500 to-teal-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Gestiona todas las funciones del Mapa Furgocasa
          </p>
        </div>

        {/* Grid de secciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section: any, idx: any) => (
            <Link
              key={idx}
              href={section.href}
              className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className={`h-2 bg-gradient-to-r ${section.color}`} />

              <div className="p-6">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${section.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {section.icon}
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-sky-600 transition-colors">
                  {section.title}
                </h2>

                <p className="text-gray-600 text-sm mb-4">
                  {section.description}
                </p>

                <div className="mt-4 text-sm text-sky-600 font-semibold group-hover:translate-x-2 transition-transform inline-block">
                  Acceder →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info adicional */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <CogIcon className="w-5 h-5" />
            Estado del Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <span className="font-medium">APIs:</span> Supabase, OpenAI, SerpAPI, Google Maps
            </div>
            <div>
              <span className="font-medium">Agentes IA:</span> 3 activos (Textos, Servicios, Imágenes)
            </div>
            <div>
              <span className="font-medium">Base de datos:</span> PostgreSQL (Supabase)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
