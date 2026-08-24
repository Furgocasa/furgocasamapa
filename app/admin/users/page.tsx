'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AdminTable, AdminTableColumn } from '@/components/admin/AdminTable'
import { 
  UserCircleIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface UserProfile {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  confirmed_at: string | null
  user_metadata: {
    full_name?: string
    first_name?: string
    last_name?: string
    username?: string
    is_admin?: boolean
    profile_photo?: string
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAdmin, setFiltroAdmin] = useState<'all' | 'admin' | 'user'>('all')
  const router = useRouter()

  useEffect(() => {
    // Limpiar cualquier caché del Service Worker para esta ruta
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach((cacheName: any) => {
          if (cacheName.includes('supabase') || cacheName.includes('api')) {
            caches.delete(cacheName)
            console.log('🗑️ Caché eliminado:', cacheName)
          }
        })
      })
    }

    checkAdminAndLoadUsers()
  }, [])

  const checkAdminAndLoadUsers = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user || !session.user.user_metadata?.is_admin) {
      router.push('/mapa')
      return
    }

    loadUsers()
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Llamar a la API del servidor que usa Service Role Key
      // Agregar un timestamp para evitar caché
      const response = await fetch(`/api/admin/users?t=${Date.now()}`, {
        cache: 'no-store'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar usuarios')
      }

      console.log(`✅ Cargados ${data.total} usuarios desde Supabase Auth`)
      console.log('📊 Datos de usuarios:', data.users.slice(0, 3)) // Mostrar los primeros 3 para debug
      setUsers(data.users || [])
      
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error)
      alert('Error al cargar usuarios. Verifica la consola.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const usuariosFiltrados = users.filter((user: any) => {
    const matchAdmin = filtroAdmin === 'all' ||
                      (filtroAdmin === 'admin' && user.user_metadata?.is_admin) ||
                      (filtroAdmin === 'user' && !user.user_metadata?.is_admin)

    return matchAdmin
  })

  // Función para detectar el proveedor de autenticación
  const getAuthProvider = (user: UserProfile) => {
    // Verificar si tiene identities en app_metadata
    const identities = (user as any).identities || []
    if (identities.length > 0) {
      return identities[0].provider // 'google', 'email', etc.
    }
    // Fallback: si tiene foto de perfil probablemente es Google
    if (user.user_metadata?.profile_photo) {
      return 'google'
    }
    return 'email'
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

  const formatDateTime = (value: string) =>
    `${formatDate(value)} ${new Date(value).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })}`

  // Definir columnas para la tabla
  const columns: AdminTableColumn<UserProfile>[] = [
    {
      key: 'provider',
      title: 'Tipo',
      sortable: true,
      className: 'w-[5%]',
      render: (user) => {
        const provider = getAuthProvider(user)
        return (
          <div className="flex items-center justify-center">
            {provider === 'google' ? (
              <div className="w-6 h-6 flex items-center justify-center" title="Google">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded" title="Email">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
            )}
          </div>
        )
      },
      exportValue: (user) => getAuthProvider(user)
    },
    {
      key: 'full_name',
      title: 'Nombre',
      sortable: true,
      className: 'w-[16%]',
      nowrap: false,
      render: (user) => {
        const nombre = user.user_metadata?.full_name ||
          user.user_metadata?.username ||
          user.user_metadata?.first_name ||
          'Sin nombre'
        return (
          <div className="text-sm font-medium text-gray-900 truncate" title={nombre}>
            {nombre}
          </div>
        )
      },
      exportValue: (user) => user.user_metadata?.full_name || user.user_metadata?.username || 'Sin nombre'
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
      className: 'w-[23%]',
      nowrap: false,
      render: (user) => (
        <div className="text-sm text-gray-900 truncate" title={user.email}>
          {user.email}
        </div>
      )
    },
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      className: 'w-[9%]',
      render: (user) => (
        <div className="text-xs text-gray-500 font-mono truncate" title={user.id}>
          {user.id.substring(0, 8)}
        </div>
      ),
      exportValue: (user) => user.id
    },
    {
      key: 'rol',
      title: 'Rol',
      sortable: true,
      className: 'w-[11%]',
      render: (user) => (
        user.user_metadata?.is_admin ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            Admin
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <UserCircleIcon className="w-3.5 h-3.5" />
            Usuario
          </span>
        )
      ),
      exportValue: (user) => user.user_metadata?.is_admin ? 'Admin' : 'Usuario'
    },
    {
      key: 'created_at',
      title: 'Registro',
      sortable: true,
      className: 'w-[11%]',
      render: (user) => (
        <span className="text-sm text-gray-600">
          {formatDate(user.created_at)}
        </span>
      ),
      exportValue: (user) => new Date(user.created_at).toLocaleDateString('es-ES')
    },
    {
      key: 'last_sign_in_at',
      title: 'Acceso',
      sortable: true,
      className: 'w-[14%]',
      render: (user) => (
        user.last_sign_in_at ? (
          <span className="text-sm text-gray-900" title={formatDateTime(user.last_sign_in_at)}>
            {formatDateTime(user.last_sign_in_at)}
          </span>
        ) : (
          <span className="text-sm text-gray-400">Nunca</span>
        )
      ),
      exportValue: (user) => user.last_sign_in_at
        ? `${new Date(user.last_sign_in_at).toLocaleDateString('es-ES')} ${new Date(user.last_sign_in_at).toLocaleTimeString('es-ES')}`
        : 'Nunca'
    },
    {
      key: 'confirmed_at',
      title: 'Estado',
      sortable: true,
      className: 'w-[11%]',
      render: (user) => (
        user.confirmed_at ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Confirmado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <XCircleIcon className="w-3.5 h-3.5" />
            Pendiente
          </span>
        )
      ),
      exportValue: (user) => user.confirmed_at ? 'Confirmado' : 'Pendiente'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="spinner mb-4"></div>
            <p className="text-gray-600">Cargando usuarios...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="mt-1 text-sm text-gray-500">
              Total: {users.length} usuarios registrados
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6">
        {/* Filtro Rol y Acciones */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por rol</label>
              <select
                value={filtroAdmin}
                onChange={(e) => setFiltroAdmin(e.target.value as any)}
                className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="all">Todos los usuarios</option>
                <option value="admin">Solo administradores</option>
                <option value="user">Solo usuarios</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <a
                href="/clear-cache.html"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap flex items-center gap-2 text-sm font-medium"
                title="Limpiar caché del navegador"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Limpiar caché
              </a>
              
              <button
                onClick={loadUsers}
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                {loading ? 'Cargando...' : 'Recargar datos'}
              </button>
            </div>
          </div>
        </div>

        {/* Información sobre gestión de usuarios */}
        {users.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Usuarios Cargados desde Supabase Auth
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Se encontraron <strong>{users.length} usuarios</strong> registrados en Supabase Authentication.
                  </p>
                  <p className="mt-1">
                    También puedes gestionar usuarios directamente desde el{' '}
                    <a 
                      href="https://supabase.com/dashboard" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline hover:text-blue-900"
                    >
                      Dashboard de Supabase → Authentication → Users
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UserCircleIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ShieldCheckIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Administradores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u: any) => u.user_metadata?.is_admin).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Confirmados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u: any) => u.confirmed_at).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de usuarios con AdminTable */}
        {users.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <UserCircleIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No hay usuarios</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              No se encontraron usuarios en Supabase Authentication.
            </p>
          </div>
        ) : (
          <AdminTable
            data={usuariosFiltrados}
            columns={columns}
            loading={loading}
            emptyMessage="No se encontraron usuarios con los filtros aplicados"
            searchPlaceholder="Buscar por nombre, email, ID..."
            exportFilename="usuarios"
            initialSortColumn="last_sign_in_at"
            initialSortDirection="desc"
            layout="fixed"
          />
        )}
      </main>
    </div>
  )
}

