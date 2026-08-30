'use client'

import { track } from '@/lib/analytics/track'
import { urlCenaCerca, type AreaCtaInput } from '@/lib/areas/cta-comercial'

const TITULARES = [
  (sitio: string) => `Hoy no se cocina en la furgo. ${sitio} tiene mesa.`,
  (sitio: string) => `${sitio} de noche no es un área. Es una cena de 4,7★.`,
  (sitio: string) => `Google te tira 2.000 sitios. En ${sitio} solo dejamos los buenos.`,
  (sitio: string) => `Has aparcado. Ahora, ¿dónde se come de verdad en ${sitio}?`,
]

const TITULARES_TALLER = [
  (sitio: string) => `Sales del taller. En ${sitio} se cena de 4,7★.`,
  (sitio: string) => `Hoy no se cocina en la furgo. ${sitio} tiene mesa.`,
  (sitio: string) => `Google te tira 2.000 sitios. En ${sitio} solo dejamos los buenos.`,
  (sitio: string) => `Has salido del taller. ¿Dónde se come de verdad en ${sitio}?`,
]

function pick<T>(id: string, list: T[]): T {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return list[hash % list.length]
}

interface Props {
  area: AreaCtaInput
  variante?: 'area' | 'taller'
}

export function CtaCenaCerca({ area, variante = 'area' }: Props) {
  const href = urlCenaCerca(area)
  if (!href) return null

  const sitio = area.ciudad || area.provincia || 'esta zona'
  const titular = pick(area.id || area.slug, variante === 'taller' ? TITULARES_TALLER : TITULARES)(sitio)

  return (
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
      className="block no-underline group"
    >
      <div className="relative overflow-hidden rounded-2xl min-h-[200px]">
        <div
          className="absolute inset-0 animate-gradient-shift"
          style={{
            background:
              'linear-gradient(135deg, #8B0000 0%, #063971 25%, #052d5a 50%, #8B0000 75%, #063971 100%)',
            backgroundSize: '400% 400%',
          }}
        />
        <div className="absolute w-[120px] h-[120px] top-[10%] right-[8%] rounded-full bg-[rgba(255,217,53,0.12)]" />
        <div className="absolute w-[80px] h-[80px] bottom-[15%] left-[12%] rounded-full bg-[rgba(255,217,53,0.08)]" />

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🍽️</span>
              <div>
                <p className="text-[#ffd935] font-black text-lg leading-none tracking-tight">
                  Casi Cinco
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#ff9999] mt-1">
                  Solo +4.7★ · {sitio}
                </p>
              </div>
            </div>

            <h3 className="text-white text-xl md:text-2xl font-black leading-tight tracking-tight mb-2">
              {titular}
            </h3>
            <p className="text-white/75 text-sm leading-relaxed max-w-xl">
              Tiramos el 95% de Google. Te quedan los restaurantes que merecen
              bajar la rampa.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            <div className="bg-[#ffd935] text-[#063971] px-7 py-3.5 rounded-xl font-black text-sm shadow-[0_8px_24px_rgba(255,217,53,0.35)] group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_32px_rgba(255,217,53,0.5)] transition-all">
              Ver dónde se cena →
            </div>
            <p className="text-white/60 text-xs font-medium">
              Mapa de {sitio}, no de toda España
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-shift {
          animation: gradient-shift 15s ease infinite;
        }
      `}</style>
    </a>
  )
}
