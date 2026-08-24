'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  MapPinIcon,
  UsersIcon,
  ChartBarIcon,
  CpuChipIcon,
  ArrowPathIcon,
  SparklesIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  TableCellsIcon,
  MapIcon,
  ChatBubbleLeftRightIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  EyeSlashIcon,
  HandThumbUpIcon,
} from '@heroicons/react/24/outline'

type Seccion = {
  title: string
  description: string
  icon: JSX.Element
  href: string
}

type Grupo = {
  label: string
  color: string
  sections: Seccion[]
}

const GRUPOS: Grupo[] = [
  {
    label: 'Áreas',
    color: 'text-primary-600 border-primary-200 bg-primary-50',
    sections: [
      { title: 'Listado de áreas', description: 'Busca, edita, activa o desactiva áreas', icon: <MapPinIcon className="w-6 h-6" />, href: '/admin/areas' },
      { title: 'Nueva área', description: 'Añade una nueva área manualmente', icon: <PlusIcon className="w-6 h-6" />, href: '/admin/areas/new' },
      { title: 'Búsqueda masiva', description: 'Encuentra áreas en Google Maps', icon: <MagnifyingGlassIcon className="w-6 h-6" />, href: '/admin/areas/busqueda-masiva' },
      { title: 'Actualizar servicios', description: 'Detecta servicios con IA y SerpAPI', icon: <ArrowPathIcon className="w-6 h-6" />, href: '/admin/areas/actualizar-servicios' },
      { title: 'Enriquecer textos', description: 'Genera descripciones automáticas', icon: <SparklesIcon className="w-6 h-6" />, href: '/admin/areas/enriquecer-textos' },
      { title: 'Enriquecer imágenes', description: 'Busca y añade imágenes automáticamente', icon: <PhotoIcon className="w-6 h-6" />, href: '/admin/areas/enriquecer-imagenes' },
      { title: 'Derechos de imagen', description: 'Revisa fotos de terceros y genera IA', icon: <ShieldExclamationIcon className="w-6 h-6" />, href: '/admin/areas/revisar-imagenes' },
      { title: 'Confirmaciones de viajeros', description: 'Revisa y aplica servicios, precio y plazas', icon: <HandThumbUpIcon className="w-6 h-6" />, href: '/admin/areas/contribuciones' },
    ],
  },
  {
    label: 'IA y Chatbot',
    color: 'text-purple-600 border-purple-200 bg-purple-50',
    sections: [
      { title: 'Configuración de IA', description: 'Ajusta prompts y parámetros', icon: <CpuChipIcon className="w-6 h-6" />, href: '/admin/configuracion' },
      { title: 'Respuestas Tío Viajero', description: 'Revisa y evalúa respuestas del chatbot', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />, href: '/admin/chatbot-respuestas' },
    ],
  },
  {
    label: 'Datos y análisis',
    color: 'text-emerald-600 border-emerald-200 bg-emerald-50',
    sections: [
      { title: 'Analíticas', description: 'Reportes y estadísticas de uso', icon: <ChartBarIcon className="w-6 h-6" />, href: '/admin/analytics' },
      { title: 'Vehículos', description: 'Analiza el parque de autocaravanas', icon: <TruckIcon className="w-6 h-6" />, href: '/admin/vehiculos' },
      { title: 'Datos de mercado', description: 'Comparables para valoraciones', icon: <TableCellsIcon className="w-6 h-6" />, href: '/admin/datos-mercado' },
      { title: 'Reportes de accidentes', description: 'Gestiona reportes y estadísticas', icon: <ExclamationTriangleIcon className="w-6 h-6" />, href: '/admin/reportes' },
    ],
  },
  {
    label: 'Sistema',
    color: 'text-slate-600 border-slate-200 bg-slate-100',
    sections: [
      { title: 'Configuración de mapas', description: 'Proveedor y estilo de mapas', icon: <MapIcon className="w-6 h-6" />, href: '/admin/mapas' },
      { title: 'Usuarios', description: 'Gestiona usuarios del sistema', icon: <UsersIcon className="w-6 h-6" />, href: '/admin/users' },
    ],
  },
]

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{
    activas: number | null
    inactivas: number | null
    sinTexto: number | null
    contribuciones: number | null
  }>({
    activas: null,
    inactivas: null,
    sinTexto: null,
    contribuciones: null,
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        const supabase = createClient()
        const [activas, inactivas, sinTexto, contribuciones] = await Promise.all([
          supabase.from('areas').select('id', { count: 'exact', head: true }).eq('activo', true),
          supabase.from('areas').select('id', { count: 'exact', head: true }).eq('activo', false),
          supabase.from('areas').select('id', { count: 'exact', head: true }).eq('activo', true).or('descripcion.is.null,descripcion.eq.'),
          (supabase as any).from('area_contribuciones').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        ])
        setStats({
          activas: activas.count ?? null,
          inactivas: inactivas.count ?? null,
          sinTexto: sinTexto.count ?? null,
          contribuciones: contribuciones.count ?? null,
        })
      } catch (err) {
        console.error('Error cargando estadísticas:', err)
      }
    }
    loadStats()
  }, [])

  const statCards = [
    {
      label: 'Áreas activas (visibles en el mapa)',
      value: stats.activas,
      icon: <CheckCircleIcon className="w-8 h-8 text-emerald-500" />,
    },
    {
      label: 'Áreas inactivas (ocultas)',
      value: stats.inactivas,
      icon: <EyeSlashIcon className="w-8 h-8 text-gray-400" />,
    },
    {
      label: 'Activas sin descripción',
      value: stats.sinTexto,
      icon: <SparklesIcon className="w-8 h-8 text-purple-500" />,
    },
    {
      label: 'Confirmaciones pendientes',
      value: stats.contribuciones,
      icon: <HandThumbUpIcon className="w-8 h-8 text-sky-500" />,
    },
  ]

  return (
    <div className="p-6 lg:p-8">
      {/* Cabecera */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Panel de Administración</h1>
        <p className="text-gray-600">Gestiona todas las funciones del Mapa Furgocasa</p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            {stat.icon}
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stat.value === null ? '—' : stat.value.toLocaleString('es-ES')}
              </p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Secciones agrupadas */}
      <div className="space-y-10">
        {GRUPOS.map((grupo) => (
          <section key={grupo.label}>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${grupo.color.split(' ')[0].replace('text-', 'bg-')}`} />
              {grupo.label}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {grupo.sections.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div className={`inline-flex p-2.5 rounded-lg border ${grupo.color} mb-3`}>
                    {section.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Estado del sistema */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Estado del Sistema</h3>
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
  )
}
