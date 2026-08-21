'use client'

import { useState } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import type { Valoracion } from '@/types/database.types'

interface Props {
  areaId: string
  valoraciones: Valoracion[]
}

export function Valoraciones({ areaId, valoraciones }: Props) {
  const [showForm, setShowForm] = useState(false)

  // Calcular estadísticas
  const totalValoraciones = valoraciones.length
  const ratingPromedio = totalValoraciones > 0
    ? (valoraciones.reduce((sum: any, v: any) => sum + v.rating, 0) / totalValoraciones).toFixed(1)
    : '0.0'

  // Contar ratings por estrella
  const ratingCounts = [5, 4, 3, 2, 1].map((stars: any) => 
    valoraciones.filter((v: any) => v.rating === stars).length
  )

  return (
    <section className="bg-white rounded-2xl shadow-card p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Valoraciones</h2>

      {/* Resumen de valoraciones */}
      <div className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-200">
        {/* Rating promedio */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-1">{ratingPromedio}</div>
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

        {/* Distribución de estrellas */}
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

      {/* Botón escribir valoración */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full mb-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
      >
        ✍️ Escribir valoración
      </button>

      {/* Formulario (si está visible) */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            🔐 Debes iniciar sesión para dejar una valoración
          </p>
          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-sm">
              Iniciar sesión
            </button>
            <button 
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de valoraciones */}
      {totalValoraciones > 0 ? (
        <div className="space-y-4">
          {valoraciones.map((valoracion) => (
            <div
              key={valoracion.id}
              className="pb-4 border-b border-gray-200 last:border-0 last:pb-0"
            >
              {/* Header de valoración */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-semibold">
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

                {/* Estrellas */}
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

              {/* Comentario */}
              {valoracion.comentario && (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {valoracion.comentario}
                </p>
              )}

              {/* Fotos de la valoración */}
              {valoracion.fotos && valoracion.fotos.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {valoracion.fotos.map((foto: any, index: any) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
                    >
                      <img
                        src={foto}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
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
  )
}
