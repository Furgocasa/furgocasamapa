'use client'

/**
 * CONFIRMAR DATOS DEL ÁREA (contribuciones de usuarios)
 * =====================================================
 * "¿Has estado aquí?" — permite a usuarios logueados confirmar o corregir
 * servicios, precio y plazas en unos pocos taps. Las contribuciones se
 * guardan en `area_contribuciones` (estado 'pendiente') para revisión.
 */

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircleIcon, HandThumbUpIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import { useLanguage, getServicioLabel, SERVICIO_ICONS } from '@/lib/i18n'

const SERVICIO_IDS = [
  'agua',
  'electricidad',
  'vaciado_aguas_negras',
  'vaciado_aguas_grises',
  'wifi',
  'duchas',
  'wc',
  'lavanderia',
  'restaurante',
  'supermercado',
  'zona_mascotas',
] as const

interface Props {
  areaId: string
  serviciosActuales?: Record<string, boolean> | null
  precioActual?: number | null
  plazasActuales?: number | null
}

export function ConfirmarDatosArea({ areaId, serviciosActuales, precioActual, plazasActuales }: Props) {
  const { locale } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [abierto, setAbierto] = useState(false)
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

  const [servicios, setServicios] = useState<Record<string, boolean>>(
    () => {
      const base: Record<string, boolean> = {}
      SERVICIO_IDS.forEach((id) => {
        if (serviciosActuales && serviciosActuales[id] === true) base[id] = true
      })
      return base
    }
  )
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
          setError('Ya has enviado una contribución para esta área hoy. ¡Gracias!')
        } else {
          setError('No se pudo guardar. Inténtalo de nuevo.')
        }
        return
      }
      setEnviada(true)
    } catch {
      setError('No se pudo guardar. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviada) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center gap-4">
        <CheckCircleSolid className="w-10 h-10 text-green-500 flex-shrink-0" />
        <div>
          <p className="font-semibold text-green-900">¡Gracias por tu contribución!</p>
          <p className="text-sm text-green-700">Tu confirmación ayuda a miles de viajeros a tener datos fiables.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      {/* Cabecera */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
            <HandThumbUpIcon className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">¿Has estado aquí?</h3>
            <p className="text-sm text-gray-500">Confirma los servicios y el precio en 30 segundos</p>
          </div>
        </div>
        <span className={`text-gray-400 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {abierto && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {!user ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-3">Inicia sesión para contribuir — solo te llevará un momento.</p>
              <a
                href="/auth/login"
                className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-2.5 rounded-full transition-colors"
              >
                Iniciar sesión
              </a>
            </div>
          ) : (
            <>
              {/* Servicios */}
              <p className="text-sm font-semibold text-gray-700 mb-2">Marca los servicios que tiene el área:</p>
              <div className="flex flex-wrap gap-2 mb-4">
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

              {/* Precio y plazas */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Precio/noche (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="0 = gratis"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Plazas</label>
                  <input
                    type="number"
                    min="1"
                    value={plazas}
                    onChange={(e) => setPlazas(e.target.value)}
                    placeholder="nº plazas"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Comentario opcional */}
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Algo más que deban saber los viajeros... (opcional)"
                rows={2}
                maxLength={500}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
              />

              {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

              <button
                onClick={enviar}
                disabled={enviando}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-3 rounded-full transition-colors flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/40 border-t-white"></span>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Enviar confirmación
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
