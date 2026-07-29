'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DashboardStats } from '@/components/perfil/DashboardStats'
import { VisitasTab } from '@/components/perfil/VisitasTab'
import { ValoracionesTab } from '@/components/perfil/ValoracionesTab'
import { FavoritosTab } from '@/components/perfil/FavoritosTab'
import { RutasTab } from '@/components/perfil/RutasTab'
import { useLanguage } from '@/lib/i18n'
import {
  UserCircleIcon,
  EnvelopeIcon,
  KeyIcon,
  MapPinIcon,
  HeartIcon,
  ClockIcon,
  ArrowLeftIcon,
  StarIcon,
  MapIcon
} from '@heroicons/react/24/outline'

type TabType = 'perfil' | 'visitas' | 'valoraciones' | 'favoritos' | 'rutas'

export default function PerfilPage() {
  const { t, locale } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('perfil')
  const router = useRouter()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
  })

  const [stats, setStats] = useState({
    totalVisitas: 0,
    totalValoraciones: 0,
    totalFavoritos: 0,
    totalRutas: 0,
    promedioRating: 0,
    totalReportesNoLeidos: 0,
  })

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push('/auth/login')
        return
      }

      setUser(session.user)
      setFormData({
        first_name: session.user.user_metadata?.first_name || '',
        last_name: session.user.user_metadata?.last_name || '',
        username: session.user.user_metadata?.username || '',
      })

      // Cargar estadísticas
      loadStats(session.user.id)

      setLoading(false)
    }

    loadUser()
  }, [router])

  const loadStats = async (userId: string) => {
    try {
      const supabase = createClient()

      // Obtener visitas
      const { count: visitasCount } = await (supabase as any)
        .from('visitas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Obtener valoraciones y calcular promedio
      const { data: valoraciones } = await (supabase as any)
        .from('valoraciones')
        .select('rating')
        .eq('user_id', userId)

      const totalValoraciones = valoraciones?.length || 0
      const promedioRating = totalValoraciones > 0 && valoraciones
        ? valoraciones.reduce((sum: number, v: any) => sum + v.rating, 0) / totalValoraciones
        : 0

      // Obtener favoritos
      const { count: favoritosCount } = await (supabase as any)
        .from('favoritos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Obtener rutas
      const { count: rutasCount } = await (supabase as any)
        .from('rutas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Obtener reportes no leídos
      const { data: reportesNoLeidosData } = await (supabase as any)
        .rpc('contar_reportes_no_leidos', { usuario_uuid: userId })

      setStats({
        totalVisitas: visitasCount || 0,
        totalValoraciones,
        totalFavoritos: favoritosCount || 0,
        totalRutas: rutasCount || 0,
        promedioRating,
        totalReportesNoLeidos: (reportesNoLeidosData as number) || 0,
      })
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          username: formData.username,
          full_name: `${formData.first_name} ${formData.last_name}`.trim(),
        }
      })

      if (error) throw error

      setMessage({ type: 'success', text: t('perfil_ok') })
      setEditing(false)

      // Recargar usuario
      const { data: { user: updatedUser } } = await supabase.auth.getUser()
      if (updatedUser) setUser(updatedUser)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || t('perfil_err') })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">{t('perfil_loading')}</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('perfil_title')}</h1>
              <p className="mt-1 text-sm text-gray-500">{t('perfil_sub')}</p>
            </div>
            <Link
              href="/mapa"
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              {t('perfil_back_map')}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-6 sticky top-6">
              {/* Avatar */}
              <div className="text-center">
                {user.user_metadata?.profile_photo && user.user_metadata.profile_photo !== 'default_profile.png' ? (
                  <img
                    src={user.user_metadata.profile_photo}
                    alt={user.user_metadata?.full_name || user.email}
                    className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-gray-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full mx-auto bg-sky-100 flex items-center justify-center">
                    <UserCircleIcon className="w-16 h-16 text-sky-600" />
                  </div>
                )}

                <h2 className="mt-4 text-xl font-bold text-gray-900">
                  {user.user_metadata?.full_name || t('perfil_user')}
                </h2>
                <p className="text-sm text-gray-500">{user.email}</p>

                {user.user_metadata?.is_admin && (
                  <span className="inline-block mt-3 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                    👑 Administrador
                  </span>
                )}
              </div>

              {/* Navigation */}
              <nav className="mt-6 pt-6 border-t space-y-1">
                <button
                  onClick={() => setActiveTab('perfil')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'perfil'
                      ? 'bg-sky-50 text-sky-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <UserCircleIcon className="w-5 h-5" />
                  {t('perfil_title')}
                </button>
                <button
                  onClick={() => setActiveTab('visitas')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'visitas'
                      ? 'bg-sky-50 text-sky-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MapPinIcon className="w-5 h-5" />
                  {t('perfil_tab_visits')}
                  <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {stats.totalVisitas}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('valoraciones')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'valoraciones'
                      ? 'bg-sky-50 text-sky-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <StarIcon className="w-5 h-5" />
                  {t('perfil_tab_ratings')}
                  <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {stats.totalValoraciones}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('favoritos')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'favoritos'
                      ? 'bg-sky-50 text-sky-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <HeartIcon className="w-5 h-5" />
                  {t('perfil_tab_favs')}
                  <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {stats.totalFavoritos}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('rutas')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'rutas'
                      ? 'bg-sky-50 text-sky-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MapIcon className="w-5 h-5" />
                  {t('perfil_tab_routes')}
                  <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {stats.totalRutas}
                  </span>
                </button>
              </nav>

              {/* Quick Info */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    {t('perfil_member_since')}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {new Date(user.created_at).toLocaleDateString(locale, {
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            {/* Dashboard Stats - Solo en vista perfil */}
            {activeTab === 'perfil' && (
              <DashboardStats stats={stats} />
            )}

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow p-6">
              {activeTab === 'perfil' && (
                <div className="space-y-6">
                  {/* Información Personal */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">{t('perfil_personal')}</h3>
                      {!editing && (
                        <button
                          onClick={() => setEditing(true)}
                          className="px-4 py-2 text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors"
                        >
                          {t('edit')}
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('auth_first_name')}
                          </label>
                          {editing ? (
                            <input
                              type="text"
                              value={formData.first_name}
                              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                              {user.user_metadata?.first_name || '-'}
                            </p>
                          )}
                        </div>

                        {/* Apellido */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('auth_last_name')}
                          </label>
                          {editing ? (
                            <input
                              type="text"
                              value={formData.last_name}
                              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                              {user.user_metadata?.last_name || '-'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Username */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('auth_username')}
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                            {user.user_metadata?.username || '-'}
                          </p>
                        )}
                      </div>

                      {/* Email (no editable) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('auth_email')}
                        </label>
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                          <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                          {user.email}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {t('perfil_email_locked')}
                        </p>
                      </div>

                      {/* Botones de acción */}
                      {editing && (
                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? t('saving') : t('perfil_save')}
                          </button>
                          <button
                            onClick={() => {
                              setEditing(false)
                              setFormData({
                                first_name: user.user_metadata?.first_name || '',
                                last_name: user.user_metadata?.last_name || '',
                                username: user.user_metadata?.username || '',
                              })
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seguridad */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('perfil_security')}</h3>
                    <Link
                      href="/auth/reset-password"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <KeyIcon className="w-5 h-5" />
                      {t('perfil_change_pass')}
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'visitas' && <VisitasTab userId={user.id} />}
              {activeTab === 'valoraciones' && <ValoracionesTab userId={user.id} />}
              {activeTab === 'favoritos' && <FavoritosTab userId={user.id} />}
              {activeTab === 'rutas' && <RutasTab userId={user.id} />}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
