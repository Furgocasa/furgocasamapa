'use client'

import { track } from '@/lib/analytics/track'
import {
  resolverCtaAlquiler,
  urlAlquiler,
  type AreaCtaInput,
} from '@/lib/areas/cta-comercial'

const FOTOS = [
  '/images/banners/camper-1.jpg',
  '/images/banners/camper-4.jpg',
  '/images/banners/camper-5.jpg',
  '/images/banners/camper-6.jpg',
  '/images/banners/camper-7.jpg',
  '/images/banners/camper-8.jpg',
]

function fotoDeArea(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return FOTOS[hash % FOTOS.length]
}

interface Props {
  area: AreaCtaInput
}

export function CtaAlquilerFurgocasa({ area }: Props) {
  const cta = resolverCtaAlquiler(area)
  if (!cta) return null

  const href = urlAlquiler(area, cta)
  const foto = fotoDeArea(area.id || area.slug)

  return (
    <div className="w-full">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          track('click', {
            area_id: area.id,
            event_data: {
              cta: 'alquiler',
              zona: cta.zona,
              slug: area.slug,
            },
          })
        }}
        className="block no-underline group"
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-gray-100 transition-all hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1">
          <div className="flex flex-col md:flex-row items-stretch">
            <div className="w-full md:w-[45%] lg:w-[40%] relative overflow-hidden h-[200px] md:h-auto min-h-[200px]">
              <img
                src={foto}
                alt="Camper Furgocasa en ruta"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-slate-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Alquiler
              </div>
            </div>

            <div className="flex-1 p-6 md:p-8 lg:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🚐</span>
                <span className="text-primary-600 font-bold text-sm tracking-wide">Furgocasa</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 text-sm font-medium">Campers de gran volumen</span>
              </div>

              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
                {cta.titulo}
              </h3>

              <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-6 max-w-xl">
                {cta.cuerpo}
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-0.5">
                    Precio desde
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-accent-500 leading-none">95€</span>
                    <span className="text-slate-500 text-sm font-medium">/día</span>
                  </div>
                </div>

                <div className="bg-primary-600 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-md group-hover:bg-primary-500 transition-colors whitespace-nowrap">
                  {cta.boton} →
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100 text-slate-500 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> KM ilimitados
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Todo incluido
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-400">★</span> 4.9 Google
                </span>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
