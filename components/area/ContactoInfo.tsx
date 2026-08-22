'use client'

import type { Area } from '@/types/database.types'
import { PhoneIcon, EnvelopeIcon, GlobeAltIcon, MapIcon } from '@heroicons/react/24/outline'
import { track } from '@/lib/analytics/track'
import { isEspana } from '@/lib/areas/cta-comercial'

interface Props {
  area: Area
}

function waHref(telefono: string, nombre: string): string | null {
  const digits = telefono.replace(/\D/g, '')
  if (digits.length < 8) return null
  const num =
    digits.startsWith('34') ? digits : digits.length === 9 ? `34${digits}` : digits
  const text = encodeURIComponent(
    `Hola, os escribo desde Mapa Furgocasa (${nombre}). ¿Tenéis plaza?`
  )
  return `https://wa.me/${num}?text=${text}`
}

export function ContactoInfo({ area }: Props) {
  const bookable =
    isEspana(area.pais) &&
    (area.tipo_area === 'privada' || area.tipo_area === 'camping')
  const whatsapp = bookable && area.telefono ? waHref(area.telefono, area.nombre) : null

  const lead = (cta: string) => {
    track('click', {
      area_id: area.id,
      event_data: {
        cta,
        tipo_area: area.tipo_area,
        slug: area.slug,
        pais: area.pais,
      },
    })
  }

  const hasContactInfo =
    area.telefono || area.email || area.website || area.google_maps_url || whatsapp

  if (!hasContactInfo) {
    return null
  }

  return (
    <section className="bg-white rounded-3xl shadow-[0_2px_24px_-8px_rgba(0,0,0,0.08)] border border-gray-100 p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Contacto Directo</h2>

      <div className="space-y-4">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => lead('plaza_whatsapp')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20.5 3.5A11 11 0 0 0 2.1 17.1L1 23l6-1.1A11 11 0 0 0 20.5 3.5zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-3.5.6.6-3.4-.2-.3A9 9 0 1 1 12 20.5zm5-6.7c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6 0a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.4.1-.3c0-.2 0-.4-.1-.5l-.9-2.1c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3s-.9.9-.9 2.1.9 2.4 1 2.6 1.8 2.8 4.4 3.8c.6.3 1.1.4 1.5.5.6.2 1.2.2 1.7.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3 0-.1-.2-.2-.5-.3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-emerald-700 font-bold tracking-wider uppercase mb-0.5">
                WhatsApp · lead
              </p>
              <p className="text-base font-bold text-slate-900">¿Hay plaza esta noche?</p>
            </div>
          </a>
        )}

        {area.telefono && (
          <a
            href={`tel:${area.telefono}`}
            onClick={() => lead(bookable ? 'plaza_tel' : 'contacto_tel')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-100 transition-all">
              <PhoneIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mb-0.5">Llamar</p>
              <p className="text-base font-bold text-slate-900">{area.telefono}</p>
            </div>
          </a>
        )}

        {area.email && (
          <a
            href={`mailto:${area.email}`}
            onClick={() => lead(bookable ? 'plaza_email' : 'contacto_email')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-100 transition-all">
              <EnvelopeIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mb-0.5">Correo</p>
              <p className="text-base font-bold text-slate-900 truncate">{area.email}</p>
            </div>
          </a>
        )}

        {area.website && (
          <a
            href={area.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => lead(bookable ? 'plaza_web' : 'contacto_web')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-100 transition-all">
              <GlobeAltIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mb-0.5">Página Web</p>
              <p className="text-base font-bold text-slate-900 truncate">{area.website}</p>
            </div>
          </a>
        )}

        {area.google_maps_url && (
          <a
            href={area.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => lead('navegacion_maps')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 group-hover:bg-emerald-200 transition-all">
              <MapIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-emerald-600/80 font-bold tracking-wider uppercase mb-0.5">Navegación</p>
              <p className="text-base font-bold text-emerald-900">Abrir en Google Maps</p>
            </div>
          </a>
        )}
      </div>
    </section>
  )
}
