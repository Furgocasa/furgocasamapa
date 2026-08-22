'use client'

import { TruckIcon } from '@heroicons/react/24/outline'
import { track } from '@/lib/analytics/track'
import {
  resolverCtaAlquiler,
  urlAlquiler,
  type AreaCtaInput,
} from '@/lib/areas/cta-comercial'

interface Props {
  area: AreaCtaInput
}

export function CtaAlquilerFurgocasa({ area }: Props) {
  const cta = resolverCtaAlquiler(area)
  if (!cta) return null

  const href = urlAlquiler(area, cta)

  return (
    <section className="rounded-2xl border border-primary-200 bg-primary-50 p-6 md:p-7 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-2">
        Alquiler Furgocasa
      </p>
      <h2 className="font-heading text-xl md:text-2xl font-bold text-primary-700 mb-2">
        {cta.titulo}
      </h2>
      <p className="text-sm text-primary-800/80 leading-relaxed mb-5 max-w-xl">
        {cta.cuerpo}
      </p>
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
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
      >
        <TruckIcon className="w-5 h-5" />
        {cta.boton}
      </a>
    </section>
  )
}
