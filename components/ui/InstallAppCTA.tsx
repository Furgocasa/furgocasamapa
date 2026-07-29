'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'

export function InstallAppCTA() {
  const { t } = useLanguage()

  return (
    <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
      {/* Patrón de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Contenido */}
          <div className="text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">📱</span>
              <span className="font-semibold">{t('install_badge')}</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              {t('install_title')}
            </h2>
            
            <p className="text-xl text-white/90 mb-8">
              {t('install_lead')}
            </p>

            {/* Beneficios */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-lg">{t('install_b1')}</p>
                  <p className="text-white/80 text-sm">{t('install_b1_sub')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-lg">{t('install_b2')}</p>
                  <p className="text-white/80 text-sm">{t('install_b2_sub')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-lg">{t('install_b3')}</p>
                  <p className="text-white/80 text-sm">{t('install_b3_sub')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-lg">{t('install_b4')}</p>
                  <p className="text-white/80 text-sm">{t('install_b4_sub')}</p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/instalar-app"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all shadow-xl hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {t('install_cta')}
              </Link>

              <Link
                href="/mapa"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-all border-2 border-white/30"
              >
                Ir al Mapa
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Contador social proof */}
            <div className="mt-8 flex items-center gap-2 text-white/80">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-primary-600 flex items-center justify-center text-sm">
                  👤
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-primary-600 flex items-center justify-center text-sm">
                  👤
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-primary-600 flex items-center justify-center text-sm">
                  👤
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-primary-600 flex items-center justify-center text-sm font-bold">
                  +1k
                </div>
              </div>
              <p className="text-sm">
                Miles de autocaravanistas ya la tienen instalada
              </p>
            </div>
          </div>

          {/* Mockup de móvil */}
          <div className="relative lg:block hidden">
            <div className="relative mx-auto" style={{ width: '280px' }}>
              {/* Marco del móvil */}
              <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[2.5rem] overflow-hidden">
                  {/* Notch */}
                  <div className="bg-gray-900 h-8 rounded-b-3xl mx-auto" style={{ width: '140px' }}></div>
                  
                  {/* Pantalla simulada */}
                  <div className="bg-gradient-to-br from-primary-50 to-blue-50 p-6 h-[500px] flex flex-col">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg flex items-center justify-center">
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-center font-bold text-gray-900 text-xl mb-2">Furgocasa</h3>
                    <p className="text-center text-gray-600 text-sm mb-6">Áreas para Autocaravanas</p>
                    
                    {/* Simulación de contenido */}
                    <div className="space-y-3 flex-1">
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Iconos flotantes de plataformas */}
              <div className="absolute -left-8 top-1/4 bg-white rounded-2xl p-4 shadow-xl transform -rotate-12">
                <span className="text-4xl">🍎</span>
              </div>
              <div className="absolute -right-8 top-1/3 bg-white rounded-2xl p-4 shadow-xl transform rotate-12">
                <span className="text-4xl">🤖</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
