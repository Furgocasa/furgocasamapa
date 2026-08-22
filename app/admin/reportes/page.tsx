'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminTable } from '@/components/admin/AdminTable'
import Link from 'next/link'
import {
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  MapPinIcon,
  CalendarIcon,
  TruckIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface DashboardMetricas {
  total_vehiculos: number
  vehiculos_mes_actual: number
  valor_total_parque: number
  total_reportes_accidentes: number
  reportes_pendientes: number
  datos_mercado_verificados: number
  datos_mercado_pendientes: number
  usuarios_con_vehiculos: number
  usuarios_compartiendo_datos: number
}

interface ReporteAccidente {
  id: string
  vehiculo_matricula: string
  vehiculo_marca: string
  vehiculo_modelo: string
  propietario_nombre: string
  propietario_email: string
  testigo_nombre: string
  testigo_email: string
  testigo_telefono: string
  fecha_accidente: string
  ubicacion_lat: number
  ubicacion_lng: number
  ubicacion_descripcion: string
  descripcion: string
  tipo_dano: string
  leido: boolean
  cerrado: boolean
  created_at: string
}

export default function AdminReportesPage() {
  const [loading, setLoading] = useState(true)
  const [metricas, setMetricas] = useState<DashboardMetricas | null>(null)
  const [reportes, setReportes] = useState<ReporteAccidente[]>([])
  const [filtro, setFiltro] = useState<'todos' | 'pendientes' | 'cerrados'>('todos')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user || !session.user.user_metadata?.is_admin) {
      router.push('/mapa')
      return
    }

    await Promise.all([
      loadMetricas(),
      loadReportes()
    ])

    setLoading(false)
  }

  const loadMetricas = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await (supabase as any).rpc('admin_dashboard_metricas')
      
      if (error) throw error
      
      if (data && data.length > 0) {
        setMetricas(data[0])
      }
    } catch (error) {
      console.error('Error cargando métricas:', error)
    }
  }

  const loadReportes = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await (supabase as any).rpc('admin_listado_reportes_accidentes')
      
      if (error) {
        console.error('Error en RPC admin_listado_reportes_accidentes:', error)
        setError(`Error al cargar reportes: ${error.message}`)
        throw error
      }
      
      console.log('✅ Reportes cargados:', data)
      setReportes(data || [])
    } catch (error: any) {
      console.error('Error cargando reportes:', error)
      setError(error.message || 'Error desconocido al cargar reportes')
    }
  }

  const reportesFiltrados = reportes.filter((r: any) => {
    if (filtro === 'pendientes') return !r.cerrado
    if (filtro === 'cerrados') return r.cerrado
    return true
  })

  // Definir columnas para AdminTable
  const columns = [
    {
      key: 'vehiculo',
      title: 'Vehículo',
      sortable: true,
      searchable: true,
      render: (reporte: ReporteAccidente) => (
        <div>
          <p className="font-semibold">{reporte.vehiculo_marca} {reporte.vehiculo_modelo}</p>
          <p className="text-sm text-gray-500">{reporte.vehiculo_matricula}</p>
        </div>
      ),
      exportValue: (reporte: ReporteAccidente) => 
        `${reporte.vehiculo_marca} ${reporte.vehiculo_modelo} - ${reporte.vehiculo_matricula}`
    },
    {
      key: 'propietario',
      title: 'Propietario',
      sortable: true,
      searchable: true,
      render: (reporte: ReporteAccidente) => (
        <div>
          <p className="font-medium">{reporte.propietario_nombre}</p>
          <p className="text-sm text-gray-500">{reporte.propietario_email}</p>
        </div>
      ),
      exportValue: (reporte: ReporteAccidente) => 
        `${reporte.propietario_nombre} (${reporte.propietario_email})`
    },
    {
      key: 'testigo',
      title: 'Testigo',
      sortable: true,
      searchable: true,
      render: (reporte: ReporteAccidente) => (
        <div>
          <p className="font-medium">{reporte.testigo_nombre}</p>
          <p className="text-sm text-gray-500">{reporte.testigo_email || 'Sin email'}</p>
        </div>
      ),
      exportValue: (reporte: ReporteAccidente) => 
        `${reporte.testigo_nombre} (${reporte.testigo_email || 'Sin email'})`
    },
    {
      key: 'tipo_dano',
      title: 'Tipo de Daño',
      sortable: true,
      searchable: true,
      render: (reporte: ReporteAccidente) => (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
          {reporte.tipo_dano}
        </span>
      ),
      exportValue: (reporte: ReporteAccidente) => reporte.tipo_dano
    },
    {
      key: 'fecha_accidente',
      title: 'Fecha Accidente',
      sortable: true,
      render: (reporte: ReporteAccidente) => (
        <span className="text-sm">
          {new Date(reporte.fecha_accidente).toLocaleDateString('es-ES')}
        </span>
      ),
      exportValue: (reporte: ReporteAccidente) => 
        new Date(reporte.fecha_accidente).toLocaleDateString('es-ES')
    },
    {
      key: 'estado',
      title: 'Estado',
      sortable: true,
      render: (reporte: ReporteAccidente) => (
        <div className="flex flex-col gap-1">
          {!reporte.leido && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">
              No leído
            </span>
          )}
          {reporte.cerrado ? (
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
              Cerrado
            </span>
          ) : (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
              Activo
            </span>
          )}
        </div>
      ),
      exportValue: (reporte: ReporteAccidente) => 
        reporte.cerrado ? 'Cerrado' : 'Activo'
    },
    {
      key: 'ubicacion',
      title: 'Ubicación',
      render: (reporte: ReporteAccidente) => (
        <a
          href={`https://www.google.com/maps?q=${reporte.ubicacion_lat},${reporte.ubicacion_lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:underline text-sm flex items-center gap-1"
        >
          <MapPinIcon className="w-4 h-4" />
          Ver mapa
        </a>
      ),
      exportValue: (reporte: ReporteAccidente) => 
        `${reporte.ubicacion_lat}, ${reporte.ubicacion_lng}`
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver al Panel
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <ExclamationTriangleIcon className="w-10 h-10 text-red-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Reportes de Accidentes
            </h1>
          </div>
          <p className="text-gray-600">
            Gestiona y analiza todos los reportes de accidentes del sistema
          </p>
        </div>

        {/* Métricas Clave */}
        {metricas && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Reportes</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {metricas.total_reportes_accidentes}
                  </p>
                </div>
                <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pendientes</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {metricas.reportes_pendientes}
                  </p>
                </div>
                <CalendarIcon className="w-12 h-12 text-orange-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Vehículos Activos</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {metricas.total_vehiculos}
                  </p>
                </div>
                <TruckIcon className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Usuarios con Vehículos</p>
                  <p className="text-3xl font-bold text-green-600">
                    {metricas.usuarios_con_vehiculos}
                  </p>
                </div>
                <UserIcon className="w-12 h-12 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Banner de Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Error al cargar reportes</h3>
                <p className="text-sm text-red-800 mb-3">{error}</p>
                <div className="bg-white rounded p-3 text-sm">
                  <p className="font-medium text-gray-900 mb-2">Solución:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>Ve a Supabase SQL Editor</li>
                    <li>Ejecuta el script: <code className="bg-gray-100 px-2 py-1 rounded text-xs">reportes/19_admin_listado_reportes.sql</code></li>
                    <li>Recarga esta página</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setFiltro('todos')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filtro === 'todos'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({reportes.length})
            </button>
            <button
              onClick={() => setFiltro('pendientes')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filtro === 'pendientes'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendientes ({reportes.filter((r: any) => !r.cerrado).length})
            </button>
            <button
              onClick={() => setFiltro('cerrados')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filtro === 'cerrados'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cerrados ({reportes.filter((r: any) => r.cerrado).length})
            </button>
          </div>
        </div>

        {/* Tabla de Reportes con AdminTable */}
        <AdminTable
          data={reportesFiltrados}
          columns={columns}
          emptyMessage="No hay reportes en esta categoría"
        />
      </div>
    </div>
  )
}

