'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/lib/i18n'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const isSubmitting = useRef(false)
  const { t } = useLanguage()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevenir múltiples envíos simultáneos
    if (loading || isSubmitting.current) return
    
    isSubmitting.current = true
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (error: any) {
      // Traducir errores comunes de Supabase a español
      let errorMessage = error.message || 'Error al enviar el correo de recuperación'
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('Email rate limit exceeded')) {
        errorMessage = 'Has solicitado demasiados correos de recuperación. Por favor, espera 60 segundos antes de intentarlo de nuevo.'
      } else if (errorMessage.includes('User not found')) {
        errorMessage = 'No existe una cuenta con este correo electrónico.'
      } else if (errorMessage.includes('Invalid email')) {
        errorMessage = 'El formato del correo electrónico no es válido.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
      isSubmitting.current = false
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Correo enviado!</h2>
          <p className="text-gray-600 mb-6">
            Revisa tu correo electrónico. Te hemos enviado un enlace para restablecer tu contraseña.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Si no ves el correo, revisa tu carpeta de spam.
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {t('auth_login_link')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image 
              src="/logo-negro.png" 
              alt="Furgocasa" 
              width={200} 
              height={80}
              className="mx-auto mb-4"
            />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth_reset_title')}</h2>
          <p className="text-gray-600">
            {t('auth_reset_sub')}
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleResetPassword} className="space-y-6">
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
              <p className="mt-2 text-sm text-gray-500">
                Introduce el correo asociado a tu cuenta
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                if (loading || isSubmitting.current) {
                  e.preventDefault()
                  return
                }
              }}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth_loading') : t('auth_reset_send')}
            </button>
          </form>

          {/* Link a login */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('auth_login_link')}
            </Link>
          </div>
        </div>

        {/* Ayuda adicional */}
        <div className="mt-6 bg-sky-50 border border-sky-200 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-sky-900 mb-1">
                ¿Usuario migrado?
              </h3>
              <p className="text-sm text-sky-800">
                Si ya tenías una cuenta anteriormente, usa esta opción para crear una nueva contraseña.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

