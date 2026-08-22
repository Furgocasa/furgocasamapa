'use client'

/**
 * CONFIRMAR DATOS DEL ÁREA (contribuciones de usuarios)
 * =====================================================
 * Bloque principal de la ficha: confirmar o corregir servicios,
 * precio y plazas. Se guarda en `area_contribuciones` (pendiente)
 * para que el admin lo revise y aplique.
 */

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid, HandThumbUpIcon } from '@heroicons/react/24/solid'
import { useLanguage, getServicioLabel, SERVICIO_ICONS } from '@/lib/i18n'
import { track } from '@/lib/analytics/track'
import { SERVICIO_IDS, serviciosPropuestos } from '@/lib/areas/contribuciones'

interface Props {
  areaId: string
  serviciosActuales?: Record<string, boolean> | null
  precioActual?: number | null
  plazasActuales?: number | null
}

export function ConfirmarDatosArea({ areaId, serviciosActuales, precioActual, plazasActuales }: Props) {
  const { locale, t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviada, setEnviada] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const serviciosOpts = useMemo(
    () =>
      SERVICIO_IDS.map((id) => ({
        id,
        label: `${SERVICIO_ICONS[id] || '✓'} ${getServicioLabel(id, locale)}`,
      })),
    [locale]
  )

  const [servicios, setServicios] = useState<Record<string, boolean>>(() => serviciosPropuestos(serviciosActuales))
  const [precio, setPrecio] = useState<string>(precioActual != null ? String(precioActual) : '')
  const [plazas, setPlazas] = useState<string>(plazasActuales != null ? String(plazasActuales) : '')
  const [comentario, setComentario] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const toggleServicio = (id: string) => {
    setServicios((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const enviar = async () => {
    if (!user) return
    setEnviando(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: dbError } = await (supabase as any).from('area_contribuciones').insert({
        area_id: areaId,
        user_id: user.id,
        servicios,
        precio_noche: precio.trim() === '' ? null : Number(precio),
        plazas_totales: plazas.trim() === '' ? null : parseInt(plazas, 10),
        comentario: comentario.trim() || null,
      })
      if (dbError) {
        if (dbError.code === '23505') {
          setError(t('confirm_already'))
        } else {
          setError(t('confirm_error'))
        }
        return
      }
      track('form_submit', {
        area_id: areaId,
        event_data: { kind: 'area_contribucion' },
      })
      setEnviada(true)
    } catch {
      setError(t('confirm_error'))
    } finally {
      setEnviando(false)
    }
  }

  const serviciosEnFicha = SERVICIO_IDS.filter((id) => serviciosActuales?.[id] === true).length
  const precioLabel =
    precioActual != null ? `${precioActual} €${t('per_night')}` : t('confirm_price_unknown')
  const plazasLabel =
    plazasActuales != null ? `${plazasActuales} ${t('spots')}` : t('confirm_spots_unknown')

  if (enviada) {
    return (
      <div
        id="confirmar-datos"
        className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 md:p-8 flex items-start gap-4"
      >
        <CheckCircleSolid className="w-10 h-10 text-emerald-500 flex-shrink-0" />
        <div>
          <p className="font-bold text-lg text-emerald-900">{t('confirm_thanks_title')}</p>
          <p className="text-sm text-emerald-800 mt-1">{t('confirm_thanks_body')}</p>
        </div>
      </div>
    )
  }

  return (
    <section
      id="confirmar-datos"
      className="bg-gradient-to-br from-sky-50 to-white rounded-2xl shadow-card border-2 border-sky-200 overflow-hidden"
    >
      <div className="p-5 md:p-7">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-sky-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <HandThumbUpIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{t('confirm_here')}</h3>
            <p className="text-sm text-gray-600 mt-1">{t('confirm_here_sub')}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-sky-800 bg-sky-100 px-2.5 py-1 rounded-full">
            {t('confirm_now')}
          </span>
          <span className="text-sm bg-white border border-sky-100 text-gray-700 px-3 py-1 rounded-full">
            {precioLabel}
          </span>
          <span className="text-sm bg-white border border-sky-100 text-gray-700 px-3 py-1 rounded-full">
            {plazasLabel}
          </span>
          <span className="text-sm bg-white border border-sky-100 text-gray-700 px-3 py-1 rounded-full">
            {serviciosEnFicha} {t('of')} 11 {t('available')}
          </span>
        </div>

        {!user ? (
          <div className="text-center py-4 bg-white/80 rounded-xl border border-sky-100">
            <p className="text-gray-700 mb-3 px-4">{t('confirm_login')}</p>
            <a
              href="/auth/login"
              className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-2.5 rounded-full transition-colors"
            >
              {t('nav_login')}
            </a>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-gray-800 mb-2">{t('confirm_services')}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {serviciosOpts.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleServicio(s.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 active:scale-95 ${
                    servicios[s.id]
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('confirm_price')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('confirm_spots')}</label>
                <input
                  type="number"
                  min="1"
                  value={plazas}
                  onChange={(e) => setPlazas(e.target.value)}
                  placeholder="—"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>

            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder={t('confirm_comment_ph')}
              rows={2}
              maxLength={500}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
            />

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <button
              onClick={enviar}
              disabled={enviando}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 text-base shadow-sm"
            >
              {enviando ? (
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/40 border-t-white"></span>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  {t('confirm_send')}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </section>
  )
}
