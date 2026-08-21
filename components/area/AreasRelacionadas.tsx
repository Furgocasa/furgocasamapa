import Link from 'next/link'
import { MapPinIcon, StarIcon } from '@heroicons/react/24/solid'

interface AreaRelacionada {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  provincia: string | null
  tipo_area: string
  precio_noche: number | null
  foto_principal: string | null
  google_rating: number | null
}

interface AreasRelacionadasProps {
  areas: AreaRelacionada[]
}

export function AreasRelacionadas({ areas }: AreasRelacionadasProps) {
  return (
    <section className="bg-white rounded-2xl shadow-card p-6">
      <h2 className="text-2xl font-bold text-[#0b3c74] mb-6">
        Áreas Relacionadas
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {areas.map((area) => (
          <Link
            key={area.id}
            href={`/area/${area.slug}`}
            className="group bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-xl hover:border-[#0b3c74] transition-all"
          >
            {/* Imagen */}
            <div className="relative w-full h-48 bg-gray-200">
              {area.foto_principal ? (
                <img
                  src={area.foto_principal}
                  alt={area.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <MapPinIcon className="w-12 h-12" />
                </div>
              )}
              
              {/* Rating badge */}
              {area.google_rating && (
                <div className="absolute top-2 right-2 flex items-center bg-white px-2 py-1 rounded-full shadow-md">
                  <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-sm font-semibold text-gray-900">
                    {area.google_rating}
                  </span>
                </div>
              )}
            </div>

            {/* Contenido */}
            <div className="p-4 space-y-2">
              {/* Título */}
              <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-[#0b3c74] transition-colors">
                {area.nombre}
              </h3>

              {/* Ubicación */}
              <div className="flex items-center text-sm text-gray-600">
                <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">
                  {[area.ciudad, area.provincia].filter(Boolean).join(', ')}
                </span>
              </div>

              {/* Precio */}
              {area.precio_noche !== null && area.precio_noche !== undefined && (
                <div className="flex">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {area.precio_noche === 0 ? 'Gratis' : `${area.precio_noche}€`}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

