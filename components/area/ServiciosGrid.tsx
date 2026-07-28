'use client'

import type { Servicios } from '@/types/database.types'
import { 
  CheckCircleIcon,
  XCircleIcon,
  BeakerIcon,
  BoltIcon,
  TrashIcon,
  ArchiveBoxArrowDownIcon,
  WifiIcon, 
  SparklesIcon,
  UserIcon,
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { useLanguage, getServicioLabel } from '@/lib/i18n'

interface Props {
  servicios: Servicios
}

const SERVICIOS_CONFIG = [
  { key: 'agua', icon: BeakerIcon },
  { key: 'electricidad', icon: BoltIcon },
  { key: 'vaciado_aguas_negras', icon: TrashIcon },
  { key: 'vaciado_aguas_grises', icon: ArchiveBoxArrowDownIcon },
  { key: 'wifi', icon: WifiIcon },
  { key: 'duchas', icon: SparklesIcon },
  { key: 'wc', icon: UserIcon },
  { key: 'lavanderia', icon: ArchiveBoxIcon },
  { key: 'restaurante', icon: BuildingStorefrontIcon },
  { key: 'supermercado', icon: ShoppingCartIcon },
  { key: 'zona_mascotas', icon: HeartIcon },
] as const

export function ServiciosGrid({ servicios }: Props) {
  const { locale, t } = useLanguage()
  const serviciosDisponibles = Object.values(servicios).filter(Boolean).length
  const serviciosTotales = SERVICIOS_CONFIG.length

  return (
    <section className="bg-white rounded-3xl shadow-[0_2px_24px_-8px_rgba(0,0,0,0.08)] border border-gray-100 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">{t('services_title')}</h2>
        <span className="inline-flex items-center text-sm font-bold text-blue-700 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
          {serviciosDisponibles} {t('of')} {serviciosTotales} {t('available')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICIOS_CONFIG.map(({ key, icon: Icon }) => {
          const disponible = servicios[key as keyof Servicios]
          const label = getServicioLabel(key, locale, true)
          
          return (
            <div
              key={key}
              className={`
                flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200
                ${disponible 
                  ? 'bg-emerald-50/50 border-emerald-100 shadow-sm' 
                  : 'bg-gray-50/50 border-gray-100 opacity-60'
                }
              `}
            >
              <div className={`
                flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                ${disponible ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'}
              `}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${disponible ? 'text-gray-900' : 'text-gray-500'}`}>
                  {label}
                </p>
              </div>
              {disponible ? (
                <CheckCircleIcon className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-gray-300 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
