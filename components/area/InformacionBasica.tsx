'use client'

import type { Area } from '@/types/database.types'
import { TruckIcon, ClockIcon, ArrowsUpDownIcon, CurrencyEuroIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/lib/i18n'

interface Props {
  area: Area
}

export function InformacionBasica({ area }: Props) {
  const { t } = useLanguage()

  return (
    <section className="bg-white rounded-3xl shadow-[0_2px_24px_-8px_rgba(0,0,0,0.08)] border border-gray-100 p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('info_title')}</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {area.plazas_totales && (
          <div className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <TruckIcon className="w-6 h-6 text-slate-500 mb-2" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{t('spots')}</span>
            <span className="text-base font-semibold text-slate-900">{area.plazas_totales} {t('total_spots')}</span>
          </div>
        )}

        <div className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <ClockIcon className="w-6 h-6 text-slate-500 mb-2" />
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{t('access')}</span>
          <span className="text-base font-semibold text-slate-900">{area.acceso_24h ? t('access_24h') : t('access_limited')}</span>
        </div>

        {area.barrera_altura && (
          <div className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <ArrowsUpDownIcon className="w-6 h-6 text-slate-500 mb-2" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{t('max_height')}</span>
            <span className="text-base font-semibold text-slate-900">{area.barrera_altura}m</span>
          </div>
        )}

        {area.precio_noche !== null && (
          <div className="flex flex-col p-4 bg-blue-50/60 rounded-2xl border border-blue-100 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <CurrencyEuroIcon className="w-24 h-24 text-blue-600" />
            </div>
            <CurrencyEuroIcon className="w-6 h-6 text-blue-600 mb-2 relative z-10" />
            <span className="text-xs text-blue-600/80 font-bold uppercase tracking-wider mb-1 relative z-10">{t('price')}</span>
            <span className="text-lg font-bold text-blue-900 relative z-10">
              {area.precio_noche === 0 ? t('free') : `${area.precio_noche}€`}
            </span>
          </div>
        )}
      </div>

      {area.descripcion && (
        <div className="prose prose-slate max-w-none text-gray-600">
          {area.descripcion
            .split(/\r?\n\r?\n/)
            .filter((p: any) => p.trim().length > 0)
            .map((parrafo: any, index: any) => (
              <p key={index} className="leading-relaxed text-base md:text-lg mb-4">{parrafo.trim()}</p>
            ))}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-slate-100 rounded-lg">
            <MapPinIcon className="w-5 h-5 text-slate-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('location_title')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm text-gray-600 bg-slate-50 p-5 rounded-2xl border border-slate-100">
          {area.direccion && (
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">{t('address')}</span>
              <span className="font-medium text-slate-900 text-base">{area.direccion}</span>
            </div>
          )}
          {area.codigo_postal && (
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">{t('postal_code')}</span>
              <span className="font-medium text-slate-900 text-base">{area.codigo_postal}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">{t('city')}</span>
            <span className="font-medium text-slate-900 text-base">{area.ciudad}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">{t('province')}</span>
            <span className="font-medium text-slate-900 text-base">{area.provincia}</span>
          </div>
          {area.comunidad && (
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">{t('community')}</span>
              <span className="font-medium text-slate-900 text-base">{area.comunidad}</span>
            </div>
          )}
          {area.pais && (
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">{t('country')}</span>
              <span className="font-medium text-slate-900 text-base">{area.pais}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
