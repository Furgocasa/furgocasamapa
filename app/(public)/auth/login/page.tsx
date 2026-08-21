'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isSubmitting = useRef(false)
  const router = useRouter()
  const { t } = useLanguage()

  // Destino tras el login: respeta ?next= (p. ej. volver a la ficha de área
  // donde el usuario intentó guardar o valorar). Leemos window.location para
  // no necesitar Suspense de useSearchParams.
  const getNext = () => {
    if (typeof window === 'undefined') return '/mapa'
    const next = new URLSearchParams(window.location.search).get('next')
    return next && next.startsWith('/') ? next : '/mapa'
  }

  // Login con email y contraseña
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevenir múltiples envíos simultáneos
    if (loading || isSubmitting.current) return
    
    isSubmitting.current = true
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // Lista de emails de admin (debe coincidir con el backend)
      const ADMIN_EMAILS = ['info@furgocasa.com', 'admin@mapafurgocasa.com']
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase())

      // Si es admin, usar endpoint especial que bypasea rate limits
      if (isAdmin) {
        const response = await fetch('/api/admin/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || t('auth_err_generic'))
        }

        // Establecer sesión manualmente usando el cliente
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || '',
        })

        if (sessionError) throw sessionError

        // Redirigir al admin después del login exitoso
        router.push('/admin')
        router.refresh()
        return
      }

      // Login normal para usuarios no-admin
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Redirigir después del login exitoso
      router.push(getNext())
      router.refresh()
    } catch (error: any) {
      console.error('Error login email:', error)
      
      // Mapear errores comunes a claves i18n
      let errorMessage = error.message || t('auth_err_generic')
      
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = t('auth_err_credentials')
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = t('auth_err_confirm')
      } else if (errorMessage.includes('rate limit')) {
        errorMessage = t('auth_err_rate')
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
      isSubmitting.current = false
    }
  }

  // Login con Google
  const handleGoogleLogin = async () => {
    // Prevenir múltiples clics
    if (loading || isSubmitting.current) return
    
    isSubmitting.current = true
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      
      // SIEMPRE redirigir a producción (consistente con register)
      const redirectTo = `https://www.mapafurgocasa.com/auth/callback?next=${encodeURIComponent(getNext())}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })

      if (error) throw error

      // La redirección a Google es automática
    } catch (error: any) {
      console.error('Error login Google:', error)
      setError(error.message || t('auth_err_generic'))
      setLoading(false)
      isSubmitting.current = false
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-sky-50 via-white to-sky-100 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo-negro.png"
              alt="FurgoCasa Logo"
              width={160}
              height={60}
              className="h-auto w-auto max-w-[160px] md:max-w-[200px]"
              priority
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            {t('auth_login_title')}
          </h1>
          <p className="text-gray-600 text-sm md:text-base">{t('auth_login_sub')}</p>
        </div>

        {/* Tarjeta de login */}
        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8">
          {/* Mensaje de error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Formulario de email */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('auth_email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all disabled:opacity-50"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('auth_password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 disabled:opacity-50"
                  disabled={loading}
                  aria-label={showPassword ? t('auth_hide') : t('auth_show')}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth_loading') : t('auth_submit')}
            </button>
          </form>

          {/* Link recuperar contraseña */}
          <div className="mt-4 text-center">
            <Link
              href="/auth/reset-password"
              className="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              {t('auth_forgot')}
            </Link>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">O continúa con</span>
            </div>
          </div>

          {/* Login con Google */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t('auth_google')}
          </button>

          {/* Link a registro */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('auth_no_account')}{' '}
              <Link
                href="/auth/register"
                className="text-sky-600 hover:text-sky-700 font-semibold"
              >
                {t('auth_register_link')}
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>{t('footer_rights', { y: new Date().getFullYear() })}</p>
        </div>
      </div>
    </div>
  )
}
