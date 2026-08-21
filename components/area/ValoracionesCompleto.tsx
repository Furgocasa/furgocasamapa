'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import AuthModal from '@/components/ui/AuthModal'
import { consumePendingAction, setPendingAction, syncLocalFavoritesToAccount } from '@/lib/favoritos/local'
import { track } from '@/lib/analytics/track'
import type { Valoracion } from '@/types/database.types'

interface Props {
  areaId: string
  areaNombre: string
  valoraciones: Valoracion[]
}

/**
 * Un solo gesto: "Estuve aquí" = registrar visita + valorar con estrellas
 * en el mismo modal. El comentario y la fecha son opcionales/secundarios.
 * Si el usuario no tiene cuenta, se le pide en el momento (modal inline),
 * y al autenticarse se retoma la acción.
 */
export function ValoracionesCompleto({ areaId, areaNombre, valoraciones: initialValoraciones }: Props) {
  const [user, setUser] = useState<any>(null)
  const [showEstuveModal, setShowEstuveModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [valoraciones, setValoraciones] = useState(initialValoraciones)
  const { toast, showToast, hideToast } = useToast()

  const [formData, setFormData] = useState({
    rating: 0,
    comentario: '',
    fecha_visita: new Date().toISOString().split('T')[0],
  })
  const [mostrarDetalles, setMostrarDetalles] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)

    // Si venía de un login para valorar esta área, retomar la acción
    if (session?.user) {
      const pending = consumePendingAction()
      if (pending?.type === 'estuve_aqui' && pending.areaId === areaId) {
        setShowEstuveModal(true)
      }
    }
  }

  const handleEstuveClick = () => {
    if (!user) {
      // Guardar la intención para retomarla si vuelve vía OAuth/confirmación
      setPendingAction({ type: 'estuve_aqui', areaId })
      setShowAuthModal(true)
      return
    }
    setShowEstuveModal(true)
  }

  const handleAuthSuccess = async (loggedUser: any) => {
    setShowAuthModal(false)
    setUser(loggedUser)
    try {
      const supabase = createClient()
      await syncLocalFavoritesToAccount(supabase, loggedUser.id)
    } catch { /* la sincronización global lo reintentará */ }
    consumePendingAction()
    setShowEstuveModal(true)
  }

  const handleSubmitEstuve = async () => {
    if (!user) return
    if (formData.rating === 0) {
      showToast('Toca las estrellas para puntuar tu experiencia', 'error')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // 1. Registrar la visita (si ya existía en esa fecha, no pasa nada)
      const { error: errorVisita } = await (supabase as any)
        .from('visitas')
        .insert({
          user_id: user.id,
          area_id: areaId,
          fecha_visita: formData.fecha_visita,
          notas: null,
        })
      if (errorVisita && errorVisita.code !== '23505') throw errorVisita
      if (!errorVisita) {
        track('area_visit_register', { area_id: areaId })
      }

      // 2. Registrar la valoración
      const { error: errorVal } = await (supabase as any)
        .from('valoraciones')
        .insert({
          user_id: user.id,
          area_id: areaId,
          rating: formData.rating,
          comentario: formData.comentario.trim() || null,
        })

      if (errorVal) {
        if (errorVal.code === '23505') {
          showToast('Ya habías valorado esta área. Tu visita ha quedado registrada.', 'info')
          setShowEstuveModal(false)
          return
        }
        throw errorVal
      }
      track('area_rate', { area_id: areaId, event_data: { rating: formData.rating } })

      // Recargar valoraciones
      const { data: newValoraciones } = await (supabase as any)
        .from('valoraciones')
        .select('*')
        .eq('area_id', areaId)
        .order('created_at', { ascending: false })

      if (newValoraciones) setValoraciones(newValoraciones)

      showToast('✅ ¡Gracias! Visita y valoración registradas', 'success')
      setShowEstuveModal(false)
      setFormData({
        rating: 0,
        comentario: '',
        fecha_visita: new Date().toISOString().split('T')[0],
      })
      setMostrarDetalles(false)
    } catch (error: any) {
      console.error('Error registrando visita/valoración:', error)
      showToast(`Error: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Calcular estadísticas
  const totalValoraciones = valoraciones.length
  const ratingPromedio = totalValoraciones > 0
    ? (valoraciones.reduce((sum: any, v: any) => sum + v.rating, 0) / totalValoraciones).toFixed(1)
    : '0.0'

  const ratingCounts = [5, 4, 3, 2, 1].map((stars: any) =>
    valoraciones.filter((v: any) => v.rating === stars).length
  )

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      <section className="bg-white rounded-lg shadow-mobile p-6 border-t-4 border-[#0b3c74]">
        <h2 className="text-xl font-bold text-[#0b3c74] mb-4">Valoraciones</h2>

        {/* Resumen de valoraciones */}
        <div className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-200">
          <div className="text-center">
            <div className="text-4xl font-bold text-[#0b3c74] mb-1">{ratingPromedio}</div>
            <div className="flex items-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(Number(ratingPromedio))
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-600">
              {totalValoraciones} {totalValoraciones === 1 ? 'valoración' : 'valoraciones'}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((stars: any, index: any) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-8">{stars}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: totalValoraciones > 0
                        ? `${(ratingCounts[index] / totalValoraciones) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">
                  {ratingCounts[index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Un solo CTA: Estuve aquí (visita + valoración en un paso) */}
        <button
          onClick={handleEstuveClick}
          className="w-full mb-6 py-3.5 bg-[#0b3c74] text-white rounded-lg font-semibold hover:bg-[#0d4a8f] hover:shadow-lg transition-all flex items-center justify-center gap-2 text-base"
        >
          <CheckCircleIcon className="w-6 h-6" />
          Estuve aquí — Valorar
        </button>

        {/* Lista de valoraciones */}
        {totalValoraciones > 0 ? (
          <div className="space-y-4">
            {valoraciones.map((valoracion) => (
              <div
                key={valoracion.id}
                className="pb-4 border-b border-gray-200 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                      👤
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Usuario</p>
                      <p className="text-xs text-gray-500">
                        {new Date(valoracion.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`w-4 h-4 ${
                          star <= valoracion.rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {valoracion.comentario && (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {valoracion.comentario}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">📝 Aún no hay valoraciones</p>
            <p className="text-sm text-gray-400">¡Sé el primero en valorar esta área!</p>
          </div>
        )}
      </section>

      {/* Modal único: Estuve aquí (estrellas + opcionales) */}
      {showEstuveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              ¿Qué tal en {areaNombre}?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Registramos tu visita y tu valoración de una vez.
            </p>

            {/* Estrellas: el único paso obligatorio */}
            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="transition-transform hover:scale-110"
                  aria-label={`${star} estrellas`}
                >
                  {star <= formData.rating ? (
                    <StarIcon className="w-11 h-11 text-yellow-400" />
                  ) : (
                    <StarOutlineIcon className="w-11 h-11 text-gray-300" />
                  )}
                </button>
              ))}
            </div>

            {/* Detalles opcionales, colapsados por defecto */}
            {!mostrarDetalles ? (
              <button
                onClick={() => setMostrarDetalles(true)}
                className="w-full text-sm text-sky-600 hover:text-sky-700 font-medium mb-5"
              >
                + Añadir comentario o cambiar fecha (opcional)
              </button>
            ) : (
              <div className="space-y-3 mb-5">
                <textarea
                  value={formData.comentario}
                  onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                  placeholder="Comparte tu experiencia (opcional)..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c74] focus:border-transparent resize-none text-sm"
                  maxLength={1000}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Fecha de la visita
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_visita}
                    onChange={(e) => setFormData({ ...formData, fecha_visita: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c74] focus:border-transparent text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSubmitEstuve}
                disabled={loading || formData.rating === 0}
                className="flex-1 px-4 py-2.5 bg-[#0b3c74] text-white rounded-lg font-semibold hover:bg-[#0d4a8f] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Publicar'}
              </button>
              <button
                onClick={() => setShowEstuveModal(false)}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          title="Cuéntanos cómo fue tu visita"
          subtitle="Crea una cuenta gratis para valorar áreas y ayudar a otros viajeros."
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </>
  )
}
