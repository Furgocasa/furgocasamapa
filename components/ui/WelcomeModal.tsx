'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n'

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    const checkUserAndModal = async () => {
      // Crear cliente solo cuando se necesita
      const supabase = createClient()
      
      // Verificar si el usuario está autenticado
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Si el usuario ya está logueado, no mostrar el modal
      if (user) return

      // Verificar si ya se mostró el modal anteriormente
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
      
      if (!hasSeenWelcome) {
        // Pequeño delay para mejor UX
        setTimeout(() => {
          setIsOpen(true)
        }, 1000)
      }
    }

    checkUserAndModal()
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('hasSeenWelcome', 'true')
  }

  const handleRegister = () => {
    setIsOpen(false)
    localStorage.setItem('hasSeenWelcome', 'true')
    router.push('/auth/register')
  }

  const handleLogin = () => {
    setIsOpen(false)
    localStorage.setItem('hasSeenWelcome', 'true')
    router.push('/auth/login')
  }

  const handleContinue = () => {
    handleClose()
  }

  if (!isOpen || user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header azul */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 sm:p-8 text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white transition-colors z-10 bg-white/20 rounded-full p-2"
            aria-label={t('close')}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Icono de usuario */}
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 rounded-full p-4 backdrop-blur-sm">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <svg className="w-6 h-6 text-white absolute ml-8 -mt-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">{t('welcome_title')}</h2>
          <p className="text-blue-100 text-base sm:text-lg">
            {t('welcome_sub')}
          </p>
          
          {/* Decoración de estrellas */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              <span className="text-yellow-300 text-2xl">✨</span>
              <span className="text-yellow-300 text-2xl">✨</span>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-4 sm:p-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <span className="text-xl sm:text-2xl mr-2">🎉</span>
              {t('welcome_hello')}
            </h3>
            <p className="text-gray-700 mb-4">
              {t('welcome_seeing')}
            </p>
            <p className="text-gray-600 text-sm font-semibold mb-3">
              {t('welcome_didyou')}
            </p>
            <p className="text-gray-600 text-sm mb-3">
              {t('welcome_if_register')}
            </p>
          </div>

          {/* Lista de beneficios */}
          <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            <li className="flex items-start">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base text-gray-700">{t('welcome_b1')}</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base text-gray-700">{t('welcome_b2')}</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base text-gray-700">{t('welcome_b3')}</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base text-gray-700">{t('welcome_b4')}</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base text-gray-700">{t('welcome_b5')}</span>
            </li>
          </ul>

          {/* Botones de acción */}
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={handleRegister}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
            >
              {t('welcome_register')}
            </button>
            
            <button
              onClick={handleLogin}
              className="w-full bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 text-sm sm:text-base"
            >
              {t('welcome_login')}
            </button>
            
            <button
              onClick={handleContinue}
              className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-4 sm:px-6 rounded-xl transition-colors duration-200 text-xs sm:text-sm"
            >
              {t('welcome_skip')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
