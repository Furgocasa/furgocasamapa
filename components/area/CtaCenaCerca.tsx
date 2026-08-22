'use client'

import { track } from '@/lib/analytics/track'
import { urlCenaCerca, type AreaCtaInput } from '@/lib/areas/cta-comercial'

interface Props {
  area: AreaCtaInput
}

export function CtaCenaCerca({ area }: Props) {
  const href = urlCenaCerca(area)
  if (!href) return null

  const sitio = area.ciudad || area.provincia || 'esta zona'

  return (
    <aside className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-card">
      <p className="text-sm font-semibold text-gray-900 mb-1">¿Cenas cerca?</p>
      <p className="text-sm text-gray-600 leading-relaxed mb-3">
        Sitios 4,7★ en {sitio}, filtrados por Casi Cinco. No es una suscripción:
        es la lista de esta zona.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          track('click', {
            area_id: area.id,
            event_data: {
              cta: 'cena_cerca',
              slug: area.slug,
              ciudad: area.ciudad,
            },
          })
        }}
        className="text-sm font-semibold text-primary-600 hover:text-primary-700"
      >
        Ver restaurantes cerca →
      </a>
    </aside>
  )
}
