'use client'

import type { Area } from '@/types/database.types'
import { PhoneIcon, EnvelopeIcon, GlobeAltIcon, MapIcon } from '@heroicons/react/24/outline'

interface Props {
  area: Area
}

export function ContactoInfo({ area }: Props) {
  const handlePhoneClick = () => {
    // Track analytics
    console.log('Phone click:', area.id)
  }

  const handleEmailClick = () => {
    // Track analytics
    console.log('Email click:', area.id)
  }

  const handleWebsiteClick = () => {
    // Track analytics
    console.log('Website click:', area.id)
  }

  const handleGoogleMapsClick = () => {
    // Track analytics
    console.log('Google Maps click:', area.id)
  }

  const hasContactInfo = area.telefono || area.email || area.website || area.google_maps_url

  if (!hasContactInfo) {
    return null
  }

  return (
    <section className="bg-white rounded-3xl shadow-[0_2px_24px_-8px_rgba(0,0,0,0.08)] border border-gray-100 p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Contacto Directo</h2>

      <div className="space-y-4">
        {/* Teléfono */}
        {area.telefono && (
          <a
            href={`tel:${area.telefono}`}
            onClick={handlePhoneClick}
            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-100 transition-all">
              <PhoneIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mb-0.5">Llamar</p>
              <p className="text-base font-bold text-slate-900">{area.telefono}</p>
            </div>
            <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )}

        {/* Email */}
        {area.email && (
          <a
            href={`mailto:${area.email}`}
            onClick={handleEmailClick}
            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-100 transition-all">
              <EnvelopeIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mb-0.5">Correo</p>
              <p className="text-base font-bold text-slate-900 truncate">{area.email}</p>
            </div>
            <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )}

        {/* Website */}
        {area.website && (
          <a
            href={area.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWebsiteClick}
            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-100 transition-all">
              <GlobeAltIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mb-0.5">Página Web</p>
              <p className="text-base font-bold text-slate-900 truncate">{area.website}</p>
            </div>
            <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* Google Maps */}
        {area.google_maps_url && (
          <a
            href={area.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleGoogleMapsClick}
            className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 group-hover:bg-emerald-200 transition-all">
              <MapIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-emerald-600/80 font-bold tracking-wider uppercase mb-0.5">Navegación</p>
              <p className="text-base font-bold text-emerald-900">Abrir en Google Maps</p>
            </div>
            <svg className="w-5 h-5 text-emerald-400 group-hover:text-emerald-600 transform group-hover:-translate-y-1 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </section>
  )
}
