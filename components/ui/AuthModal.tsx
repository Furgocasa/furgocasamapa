'use client'

/**
 * Modal de autenticación inline: permite iniciar sesión o crear cuenta
 * sin abandonar la página (ficha de área, planificador, chatbot...).
 *
 * - Google OAuth en 1 clic (vuelve a la misma página vía ?next=)
 * - Email + contraseña, sin pedir nombre/apellidos/usuario
 * - Al completar login, llama a onSuccess(user) para retomar la acción
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface AuthModalProps {
  /** Texto que explica por qué merece la pena crear cuenta en este contexto */
  title?: string
  subtitle?: string
  onClose: () => void
  onSuccess: (user: any) => void
}

export default function AuthModal({
  title = 'Guarda tus sitios favoritos',
  subtitle = 'Crea una cuenta gratis en segundos para no perder lo que guardas.',
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const currentPath = () =>
    typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : '/mapa'

  const handleGoogle = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const base =
        typeof window !== 'undefined' &&
        window.location.hostname === 'localhost'
          ? window.location.origin
          : 'https://www.mapafurgocasa.com'
      const redirectTo = `${base}/auth/callback?next=${encodeURIComponent(currentPath())}`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        },
      })
      if (error) throw error
      // Redirección automática a Google
    } catch (e: any) {
      setError(e.message || 'Error al conectar con Google')
      setLoading(false)
    }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)
    setInfo(null)

    try {
      const supabase = createClient()

      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        onSuccess(data.user)
        return
      }

      // Registro mínimo: solo email + contraseña
      const base =
        typeof window !== 'undefined' &&
        window.location.hostname === 'localhost'
          ? window.location.origin
          : 'https://www.mapafurgocasa.com'
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${base}/auth/callback?next=${encodeURIComponent(currentPath())}`,
          data: {
            username: email.split('@')[0],
            profile_photo: 'default_profile.png',
          },
        },
      })
      if (error) throw error

      if (data.user && data.session) {
        onSuccess(data.user)
        return
      }

      // Necesita confirmar email
      setInfo(
        'Te hemos enviado un email de confirmación. Ábrelo y volverás aquí con tu cuenta lista. Lo que has guardado te estará esperando.'
      )
    } catch (err: any) {
      let msg = err.message || 'Error de autenticación'
      if (msg.includes('Invalid login credentials')) msg = 'Email o contraseña incorrectos'
      else if (msg.includes('User already registered')) msg = 'Este email ya tiene cuenta. Prueba a iniciar sesión.'
      else if (msg.includes('Password should be at least')) msg = 'La contraseña debe tener al menos 6 caracteres'
      else if (msg.includes('Email not confirmed')) msg = 'Confirma tu email antes de iniciar sesión (revisa tu correo)'
      else if (msg.includes('rate limit')) msg = 'Demasiados intentos. Espera unos minutos.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 sm:p-6 max-h-[min(90dvh,calc(100dvh-2rem))] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1"
          aria-label="Cerrar"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-1 pr-6">{title}</h2>
        <p className="text-sm text-gray-600 mb-5">{subtitle}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-800 rounded text-sm">
            {info}
          </div>
        )}

        {!info && (
          <>
            {/* Google: la vía rápida */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar con Google
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400">o con tu email</span>
              </div>
            </div>

            <form onSubmit={handleEmail} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="tu@email.com"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm disabled:opacity-50"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                placeholder="Contraseña (mín. 6 caracteres)"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0b3c74] hover:bg-[#0d4a8f] text-white font-semibold py-2.5 px-4 rounded-lg transition-all disabled:opacity-50"
              >
                {loading
                  ? 'Un momento...'
                  : mode === 'signup'
                    ? 'Crear cuenta gratis'
                    : 'Iniciar sesión'}
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              {mode === 'signup' ? (
                <>
                  ¿Ya tienes cuenta?{' '}
                  <button
                    onClick={() => { setMode('login'); setError(null) }}
                    className="text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    Inicia sesión
                  </button>
                </>
              ) : (
                <>
                  ¿No tienes cuenta?{' '}
                  <button
                    onClick={() => { setMode('signup'); setError(null) }}
                    className="text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    Créala gratis
                  </button>
                </>
              )}
            </p>
            <p className="text-[11px] text-gray-400 text-center mt-2">
              100% gratis · Sin tarjeta · Tus favoritos se sincronizan en todos tus dispositivos
            </p>
          </>
        )}

        {info && (
          <button
            onClick={onClose}
            className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-all"
          >
            Entendido
          </button>
        )}
      </div>
    </div>
  )
}
