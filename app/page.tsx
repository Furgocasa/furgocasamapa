'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { InstallAppCTA } from '@/components/ui/InstallAppCTA'
import { BackToTop } from '@/components/area/BackToTop'
import { HerramientasVehiculo } from '@/components/ui/HerramientasVehiculo'
import { useLanguage } from '@/lib/i18n'
import {
  MapIcon,
  MapPinIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  TruckIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon,
  SparklesIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

export default function HomePage() {
  const { t } = useLanguage()
  /** Fallback alineado con metadatos (+3600) hasta cargar el conteo real desde Supabase */
  const [totalAreas, setTotalAreas] = useState(3600)

  // Home logada: mis sitios guardados + última ruta
  const [user, setUser] = useState<any>(null)
  const [misSitios, setMisSitios] = useState<any[]>([])
  const [ultimaRuta, setUltimaRuta] = useState<any>(null)
  const [vehiculoNombre, setVehiculoNombre] = useState<string | null>(null)
  const [personalLoaded, setPersonalLoaded] = useState(false)

  useEffect(() => {
    // Cargar contador dinámico de áreas
    const loadTotalAreas = async () => {
      try {
        const supabase = createClient()
        const { count, error } = await (supabase as any)
          .from('areas')
          .select('*', { count: 'exact', head: true })
          .eq('activo', true)

        if (!error && typeof count === 'number') {
          setTotalAreas(count)
        }
      } catch (err) {
        console.error('Error loading total areas:', err)
      }
    }

    loadTotalAreas()
  }, [])

  useEffect(() => {
    // Si hay sesión, cargar el contenido personal (favoritos + última ruta)
    const loadPersonal = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          setPersonalLoaded(true)
          return
        }
        setUser(session.user)

        const [{ data: favs }, { data: rutas }, { data: vehiculos }] = await Promise.all([
          (supabase as any)
            .from('favoritos')
            .select('id, created_at, areas ( id, nombre, slug, ciudad, pais, foto_principal, precio_noche, google_rating )')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(6),
          (supabase as any)
            .from('rutas')
            .select('id, nombre, distancia_km, duracion_minutos, created_at')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1),
          (supabase as any)
            .from('vehiculos_registrados')
            .select('marca, modelo')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1),
        ])

        setMisSitios((favs || []).filter((f: any) => f.areas))
        setUltimaRuta(rutas && rutas.length > 0 ? rutas[0] : null)
        if (vehiculos && vehiculos.length > 0) {
          const v = vehiculos[0]
          setVehiculoNombre([v.marca, v.modelo].filter(Boolean).join(' ') || 'mi furgo')
        }
      } catch (err) {
        console.error('Error loading personal home:', err)
      } finally {
        setPersonalLoaded(true)
      }
    }

    loadPersonal()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HOME LOGADA: tus sitios + tu última ruta (tu viaje primero, la landing después) */}
      {user && personalLoaded && (
        <section className="bg-gradient-to-b from-sky-50 to-white border-b border-sky-100">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-[#0b3c74]">
                ❤️ Tus sitios guardados
              </h2>
              {misSitios.length > 0 && (
                <Link href="/perfil" className="text-sm text-sky-600 hover:text-sky-700 font-semibold">
                  Ver todos →
                </Link>
              )}
            </div>

            {misSitios.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {misSitios.map((fav: any) => (
                  <Link
                    key={fav.id}
                    href={`/area/${fav.areas.slug}`}
                    className="group bg-white rounded-xl border border-gray-200 hover:border-sky-300 hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="h-24 bg-slate-100 overflow-hidden">
                      {fav.areas.foto_principal ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={fav.areas.foto_principal}
                          alt={fav.areas.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🚐</div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-sky-700">
                        {fav.areas.nombre}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {fav.areas.ciudad}, {fav.areas.pais}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border-2 border-dashed border-sky-200 p-6 text-center mb-6">
                <p className="text-gray-700 font-medium mb-1">
                  Aún no has guardado ningún sitio
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Abre el mapa y toca el corazón ❤️ en 3 áreas que te gusten: las tendrás siempre a mano para tu próximo viaje.
                </p>
                <Link
                  href="/mapa"
                  className="inline-flex items-center gap-2 bg-[#0b3c74] hover:bg-[#0d4a8f] text-white font-semibold px-6 py-2.5 rounded-lg transition-all"
                >
                  <MapIcon className="w-5 h-5" />
                  Explorar el mapa
                </Link>
              </div>
            )}

            {ultimaRuta && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ArrowPathIcon className="w-6 h-6 text-sky-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{ultimaRuta.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {ultimaRuta.distancia_km ? `${Math.round(ultimaRuta.distancia_km)} km` : ''}
                      {ultimaRuta.duracion_minutos ? ` · ${Math.floor(ultimaRuta.duracion_minutos / 60)}h ${ultimaRuta.duracion_minutos % 60}min` : ''}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/ruta?ruta=${ultimaRuta.id}`}
                  className="text-sm bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold px-4 py-2 rounded-lg border border-sky-200 transition-colors flex-shrink-0"
                >
                  Reabrir tu última ruta →
                </Link>
              </div>
            )}

            <div className="mt-6">
              <HerramientasVehiculo vehiculoNombre={vehiculoNombre} compact />
            </div>
          </div>
        </section>
      )}

      {/* HERO - Azul corporativo con stats */}
      <section className="relative bg-gradient-to-br from-[#0b3c74] via-[#0d4a8f] to-[#0b3c74] text-white overflow-hidden">
        <div className="container mx-auto px-4 py-8 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge superior */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 md:px-6 md:py-3 rounded-full mb-5 md:mb-8 border border-white/30 max-w-full">
              <SparklesIcon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm md:text-base leading-snug">{t('home_badge_ai')}</span>
            </div>

            {/* Tres iconos principales */}
            <div className="flex justify-center items-center gap-5 md:gap-12 mb-5 md:mb-8">
              {/* Icono Mapa */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 mb-2">
                  <MapIcon className="w-6 h-6 md:w-10 md:h-10 text-white" />
                </div>
                <span className="text-xs md:text-base font-semibold text-white/90">{t('home_icon_map')}</span>
              </div>

              {/* Icono Rutas */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 mb-2">
                  <ArrowPathIcon className="w-6 h-6 md:w-10 md:h-10 text-white" />
                </div>
                <span className="text-xs md:text-base font-semibold text-white/90">{t('home_icon_routes')}</span>
              </div>

              {/* Icono IA */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 mb-2">
                  <SparklesIcon className="w-6 h-6 md:w-10 md:h-10 text-white" />
                </div>
                <span className="text-xs md:text-base font-semibold text-white/90">{t('home_icon_ai')}</span>
              </div>
            </div>

            <h1 className="text-[1.7rem] leading-tight sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-3 md:mb-6">
              {t('home_h1')}
            </h1>

            <p className="text-base md:text-2xl text-white/90 mb-6 md:mb-10 leading-relaxed max-w-3xl mx-auto">
              {t('home_lead')}
            </p>

            {/* CTAs principales */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-16">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-3.5 md:py-4 bg-white text-[#0b3c74] rounded-xl font-bold text-base md:text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                {t('home_cta_start')}
              </Link>
              <Link
                href="/mapa"
                className="inline-flex items-center justify-center px-8 py-3.5 md:py-4 bg-transparent text-white rounded-xl font-bold text-base md:text-lg border-2 border-white hover:bg-white/10 transition-all"
              >
                {t('home_cta_map')}
              </Link>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-3xl mx-auto">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl py-3 md:py-6 px-1 border border-white/20">
                <div className="text-2xl md:text-5xl font-bold text-white mb-1 tabular-nums">+{totalAreas}</div>
                <div className="text-[11px] md:text-sm text-white/80 leading-tight">{t('home_stat_areas')}</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl py-3 md:py-6 px-1 border border-white/20">
                <div className="text-2xl md:text-5xl font-bold text-white mb-1">100%</div>
                <div className="text-[11px] md:text-sm text-white/80 leading-tight">{t('home_stat_free')}</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl py-3 md:py-6 px-1 border border-white/20">
                <div className="text-2xl md:text-5xl font-bold text-white mb-1">24/7</div>
                <div className="text-[11px] md:text-sm text-white/80 leading-tight">{t('home_stat_updated')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visitante anónimo: las 3 funciones de vehículo, arriba, no a 2 pantallas */}
      {!user && (
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="container mx-auto px-4 py-6 max-w-5xl">
            <HerramientasVehiculo compact />
          </div>
        </section>
      )}

      {/* FEATURES PRINCIPALES - Blanco con tarjetas */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('home_features_title')}
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              {t('home_features_sub')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 - Áreas */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:border-[#0b3c74]/30 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-[#0b3c74] rounded-xl flex items-center justify-center mb-6">
                <MapPinIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t('home_feat1_title', { n: totalAreas })}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home_feat1_body')}
              </p>
            </div>

            {/* Feature 2 - Planificador */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:border-[#0b3c74]/30 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-[#0b3c74] rounded-xl flex items-center justify-center mb-6">
                <ArrowPathIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t('home_feat2_title')}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home_feat2_body')}
              </p>
            </div>

            {/* Feature 3 - Cobertura */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:border-[#0b3c74]/30 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-[#0b3c74] rounded-xl flex items-center justify-center mb-6">
                <GlobeAltIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t('home_feat3_title')}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home_feat3_body')}
              </p>
            </div>
          </div>

          {/* CTA después de features */}
          <div className="text-center mt-12">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#0b3c74] text-white rounded-xl font-bold text-lg hover:bg-[#0d4a8f] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {t('home_cta_join')}
            </Link>
            <p className="text-gray-500 mt-3 text-sm">{t('home_cta_join_note')}</p>
          </div>
        </div>
      </section>

      {/* GESTIÓN IA - Destacado con fondo gris claro */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Badge superior */}
            <div className="flex justify-center mb-6 md:mb-8">
              <div className="inline-flex items-center gap-2 bg-[#0b3c74] text-white px-4 py-2.5 md:px-6 md:py-3 rounded-full font-bold shadow-lg text-xs sm:text-sm md:text-base">
                <SparklesIcon className="w-5 h-5 shrink-0" />
                POWERED BY GPT-5.6 TERRA
              </div>
            </div>

            <div className="bg-white rounded-2xl md:rounded-3xl p-5 sm:p-8 md:p-12 shadow-xl border-2 border-[#0b3c74]/20">
              <div className="flex items-start gap-4 md:gap-6 mb-8">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-[#0b3c74] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <TruckIcon className="w-8 h-8 md:w-12 md:h-12 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
                    {t('home_ai_title')}
                  </h2>
                  <p className="text-base md:text-xl text-gray-600 leading-relaxed">
                    {t('home_ai_lead')}
                  </p>
                </div>
              </div>

              {/* Grid de características */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-3 md:p-5 border border-gray-200">
                  <div className="text-3xl mb-3">🤖</div>
                  <p className="font-bold text-gray-900 mb-1">{t('home_ai_card1')}</p>
                  <p className="text-sm text-gray-600">{t('home_ai_card1_sub')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 md:p-5 border border-gray-200">
                  <div className="text-3xl mb-3">📊</div>
                  <p className="font-bold text-gray-900 mb-1">{t('home_ai_card2')}</p>
                  <p className="text-sm text-gray-600">{t('home_ai_card2_sub')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 md:p-5 border border-gray-200">
                  <div className="text-3xl mb-3">🔧</div>
                  <p className="font-bold text-gray-900 mb-1">{t('home_ai_card3')}</p>
                  <p className="text-sm text-gray-600">{t('home_ai_card3_sub')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 md:p-5 border border-gray-200">
                  <div className="text-3xl mb-3">💰</div>
                  <p className="font-bold text-gray-900 mb-1">{t('home_ai_card4')}</p>
                  <p className="text-sm text-gray-600">{t('home_ai_card4_sub')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 md:p-5 border border-gray-200">
                  <div className="text-3xl mb-3">📈</div>
                  <p className="font-bold text-gray-900 mb-1">{t('home_ai_card5')}</p>
                  <p className="text-sm text-gray-600">{t('home_ai_card5_sub')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 md:p-5 border border-gray-200">
                  <div className="text-3xl mb-3">📸</div>
                  <p className="font-bold text-gray-900 mb-1">{t('home_ai_card6')}</p>
                  <p className="text-sm text-gray-600">{t('home_ai_card6_sub')}</p>
                </div>
              </div>

              {/* CTA para más información */}
              <div className="text-center">
                <Link
                  href="/valoracion-ia-vehiculos"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#0b3c74] text-white rounded-xl font-bold text-lg hover:bg-[#0d4a8f] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  {t('home_ai_cta')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SISTEMA QR - Destacado similar a Gestión IA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Badge superior */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg">
                <ShieldCheckIcon className="w-5 h-5" />
                {t('home_qr_badge')}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-10 md:p-12 shadow-xl border-2 border-red-600/20">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheckIcon className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {t('home_qr_title')}
                  </h2>
                  <p className="text-xl text-gray-600 leading-relaxed">
                    {t('home_qr_lead')}
                  </p>
                </div>
              </div>

              {/* Grid de características */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-3 md:p-5 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">🚨</div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">{t('home_qr_1')}</p>
                      <p className="text-sm text-gray-600">{t('home_qr_1_sub')}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 md:p-5 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">🔔</div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">{t('home_qr_2')}</p>
                      <p className="text-sm text-gray-600">{t('home_qr_2_sub')}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 md:p-5 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">📞</div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">{t('home_qr_3')}</p>
                      <p className="text-sm text-gray-600">{t('home_qr_3_sub')}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 md:p-5 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">📋</div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">{t('home_qr_4')}</p>
                      <p className="text-sm text-gray-600">{t('home_qr_4_sub')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA para más información */}
              <div className="text-center">
                <Link
                  href="/sistema-reporte-accidentes"
                  className="inline-flex items-center justify-center px-8 py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <ShieldCheckIcon className="w-5 h-5 mr-2" />
                  {t('home_qr_cta')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECNOLOGÍA IA - 3 características principales */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#0b3c74] text-white px-6 py-3 rounded-full font-bold mb-6">
              <SparklesIcon className="w-5 h-5" />
              {t('home_tech_badge')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('home_tech_title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('home_tech_sub')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* IA Feature 1 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
              <div className="text-5xl mb-6 text-center">🧠</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                {t('home_tech1_title')}
              </h3>
              <p className="text-gray-600 leading-relaxed text-center">
                {t('home_tech1_body')}
              </p>
            </div>

            {/* IA Feature 2 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
              <div className="text-5xl mb-6 text-center">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                {t('home_tech2_title')}
              </h3>
              <p className="text-gray-600 leading-relaxed text-center">
                {t('home_tech2_body')}
              </p>
            </div>

            {/* IA Feature 3 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
              <div className="text-5xl mb-6 text-center">💬</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                {t('home_tech3_title')}
              </h3>
              <p className="text-gray-600 leading-relaxed text-center">
                {t('home_tech3_body')}
              </p>
            </div>
          </div>

          {/* CTA después de IA */}
          <div className="text-center mt-12">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#0b3c74] text-white rounded-xl font-bold text-lg hover:bg-[#0d4a8f] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              {t('home_tech_cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA - 3 pasos */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('home_steps_title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('home_steps_sub')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Paso 1 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#0b3c74] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                  1
                </div>
                <div className="text-5xl mb-6 text-center">📝</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  {t('home_step1_title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-center">
                  {t('home_step1_body')}
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#0b3c74] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                  2
                </div>
                <div className="text-5xl mb-6 text-center">🚐</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  {t('home_step2_title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-center">
                  {t('home_step2_body')}
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border-2 border-[#0b3c74]/10 hover:shadow-xl transition-all">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#0b3c74] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                  3
                </div>
                <div className="text-5xl mb-6 text-center">🤖</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  {t('home_step3_title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-center">
                  {t('home_step3_body')}
                </p>
              </div>
            </div>
          </div>

          {/* CTA tras los pasos */}
          <div className="text-center mt-12">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-10 py-5 bg-[#0b3c74] text-white rounded-xl font-bold text-xl hover:bg-[#0d4a8f] transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              {t('home_steps_cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* POR QUÉ CONFIAR - Azul corporativo con credenciales técnicas */}
      <section className="py-20 bg-gradient-to-br from-[#0b3c74] to-[#0d4a8f] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                {t('home_trust_title')}
              </h2>
              <p className="text-xl text-white/80">
                {t('home_trust_sub')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Razón 1 - Google Maps */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('home_trust1_title')}</h3>
                    <p className="text-white/80">
                      {t('home_trust1_body')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Razón 2 - OpenAI GPT-5.6 Terra */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('home_trust2_title')}</h3>
                    <p className="text-white/80">
                      {t('home_trust2_body')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Razón 3 - Historial Completo */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ChartBarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('home_trust3_title')}</h3>
                    <p className="text-white/80">
                      {t('home_trust3_body')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Razón 4 - Seguridad */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShieldCheckIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('home_trust4_title')}</h3>
                    <p className="text-white/80">
                      {t('home_trust4_body')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Razón 5 - Datos Verificados */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('home_trust5_title')}</h3>
                    <p className="text-white/80">
                      {t('home_trust5_body')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Razón 6 - Sin Publicidad */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('home_trust6_title')}</h3>
                    <p className="text-white/80">
                      {t('home_trust6_body')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Badge Tecnología */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-10 border border-white/20 text-center">
              <div className="flex justify-center gap-8 mb-6 flex-wrap">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">Google Maps</div>
                  <div className="text-sm text-white/70">API Oficial</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">GPT-5.6 Terra</div>
                  <div className="text-sm text-white/70">IA Avanzada</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">AWS Cloud</div>
                  <div className="text-sm text-white/70">Infraestructura Segura</div>
                </div>
              </div>
              <p className="text-lg text-white/90 mb-8">
                {t('home_tech_footer')}
              </p>

              {/* CTA final de confianza */}
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-10 py-5 bg-yellow-400 text-[#0b3c74] rounded-xl font-bold text-xl hover:bg-yellow-300 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                {t('home_trust_cta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Instalar App Móvil */}
      <InstallAppCTA />

      <Footer />
      
      {/* Botón volver arriba */}
      <BackToTop />
    </div>
  )
}
