'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'

interface LoginWallProps {
  onClose?: () => void
  feature?: 'ruta' | 'mapa'
}

export default function LoginWall({ onClose, feature = 'ruta' }: LoginWallProps) {
  const { t } = useLanguage()
  const isRuta = feature === 'ruta'
  const isMapa = feature === 'mapa'

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl p-5 sm:p-8 animate-fade-in max-h-[min(90dvh,calc(100dvh-2rem))] overflow-y-auto">
        {/* Icono de candado */}
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
          {isRuta && t('wall_title_ruta')}
          {isMapa && t('wall_title_mapa')}
        </h2>

        {/* Descripción */}
        <p className="text-gray-600 text-center mb-6 leading-relaxed">
          {isRuta && t('wall_body_ruta')}
          {isMapa && t('wall_body_mapa')}
        </p>

        {/* Beneficios */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 space-y-2">
          <p className="text-sm font-semibold text-blue-900 mb-2">{t('wall_benefits')}</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>{t('wall_b1')}</li>
            <li>{t('wall_b2')}</li>
            <li>{t('wall_b3')}</li>
            <li>{t('wall_b4')}</li>
            <li>{t('wall_b5')}</li>
          </ul>
        </div>

        {/* Botones */}
        <div className="space-y-3">
          <Link
            href="/auth/register"
            className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            {t('wall_register')}
          </Link>
          
          <Link
            href="/auth/login"
            className="block w-full bg-white border-2 border-gray-300 text-gray-700 text-center py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            {t('wall_login')}
          </Link>

          <Link
            href="/"
            className="block w-full text-gray-600 text-center py-2 rounded-lg font-medium hover:text-gray-900 hover:bg-gray-50 transition-all"
          >
            {t('wall_home')}
          </Link>
        </div>

        {/* Texto pequeño */}
        <p className="text-xs text-gray-500 text-center mt-4">
          {t('wall_note')}
        </p>
      </div>
    </div>
  )
}
