'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const router = useRouter()
  const { t } = useLanguage()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validaciones
    if (password !== confirmPassword) {
      setError(t('auth_pass_mismatch'))
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t('auth_pass_short'))
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      // Configurar URL de redireccionamiento para confirmación de email
      const siteUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'https://www.mapafurgocasa.com'
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=/mapa`,
          data: {
            username: username || email.split('@')[0],
            first_name: firstName,
            last_name: lastName,
            full_name: [firstName, lastName].filter(Boolean).join(' '),
            profile_photo: 'default_profile.png',
          },
        },
      })

      if (error) throw error

      // Verificar si necesita confirmación de email
      if (data.user && !data.session) {
        // Usuario creado pero necesita confirmar email
        setError(null)
        setSuccess(true)
        setNeedsEmailConfirmation(true)
        setRegisteredEmail(email)
      } else if (data.user && data.session) {
        // Usuario creado y ya puede acceder (no requiere confirmación)
        setSuccess(true)
        setNeedsEmailConfirmation(false)
        setRegisteredEmail(email)
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          window.location.href = '/mapa'
        }, 2000)
      }
    } catch (error: any) {
      console.error('Error en registro:', error)
      
      // Traducir errores comunes a español
      let errorMessage = error.message || 'Error al crear la cuenta'
      
      if (errorMessage.includes('User already registered')) {
        errorMessage = 'Este correo ya está registrado. Por favor, inicia sesión.'
      } else if (errorMessage.includes('Password should be at least')) {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres.'
      } else if (errorMessage.includes('rate limit')) {
        errorMessage = 'Demasiados intentos. Por favor, espera unos minutos.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      const supabase = createClient()
      
      // SIEMPRE redirigir a producción
      const redirectUrl = 'https://www.mapafurgocasa.com/auth/callback?next=/mapa'
      
      // Debug en consola para verificar
      console.log('🔐 OAuth redirectTo:', redirectUrl)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      
      if (error) {
        console.error('❌ Error OAuth:', error)
        throw error
      }
    } catch (error: any) {
      setError(error.message || 'Error al registrarse con Google')
    }
  }

  if (success) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-sky-50 via-white to-sky-100 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 sm:p-8 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {needsEmailConfirmation ? (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {needsEmailConfirmation ? '¡Revisa tu correo!' : '¡Cuenta creada!'}
          </h2>
          <p className="text-gray-600 mb-6">
            {needsEmailConfirmation 
              ? `Hemos enviado un correo de verificación a ${registeredEmail}. Por favor, revisa tu bandeja de entrada y haz clic en el enlace de confirmación para activar tu cuenta.`
              : 'Tu cuenta ha sido creada exitosamente. Redirigiendo al mapa...'
            }
          </p>
          {needsEmailConfirmation && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">¿No recibiste el correo?</p>
              <Link
                href="/auth/login"
                className="text-sky-600 hover:text-sky-700 font-medium text-sm"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-sky-50 via-white to-sky-100 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-6 md:mb-8">
          <Link href="/" className="inline-block">
            <Image 
              src="/logo-negro.png" 
              alt="Furgocasa" 
              width={200} 
              height={80}
              className="mx-auto mb-4 max-w-[160px] md:max-w-[200px] h-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('auth_register_title')}</h1>
          <p className="text-gray-600 text-sm md:text-base">{t('auth_register_sub')}</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 border border-gray-100">
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth_first_name')}
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="Juan"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth_last_name')}
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="García"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth_username')}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                placeholder="juangarcia (opcional)"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth_email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                placeholder="tu@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth_password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth_confirm_password')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                placeholder="Repite tu contraseña"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Términos y condiciones */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                required
                className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 mt-1"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                Acepto los{' '}
                <Link href="/terminos" className="text-sky-600 hover:text-sky-700 font-medium">
                  términos y condiciones
                </Link>{' '}
                y la{' '}
                <Link href="/privacidad" className="text-sky-600 hover:text-sky-700 font-medium">
                  política de privacidad
                </Link>
              </label>
            </div>

            {/* Botón de registro */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth_loading') : t('auth_create')}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">O regístrate con</span>
            </div>
          </div>

          {/* Registro con Google */}
          <button
            onClick={handleGoogleSignup}
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all"
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

          {/* Link a login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('auth_have_account')}{' '}
              <Link
                href="/auth/login"
                className="font-medium text-sky-600 hover:text-sky-700 transition-colors"
              >
                {t('auth_login_link')}
              </Link>
            </p>
          </div>
        </div>

        {/* Link volver al mapa */}
        <div className="mt-6 text-center">
          <Link
            href="/mapa"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al mapa
          </Link>
        </div>
      </div>
    </div>
  )
}

