'use client'

import { 
  MapPinIcon, 
  HeartIcon, 
  MapIcon 
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/lib/i18n'

interface Props {
  stats: {
    totalVisitas: number
    totalValoraciones: number
    totalFavoritos: number
    totalRutas: number
    promedioRating: number
  }
}

export function DashboardStats({ stats }: Props) {
  const { t } = useLanguage()

  const cards = [
    {
      title: t('perfil_tab_visits'),
      value: stats.totalVisitas,
      icon: MapPinIcon,
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('perfil_tab_favs'),
      value: stats.totalFavoritos,
      icon: HeartIcon,
      color: 'bg-red-100 text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: t('perfil_tab_routes'),
      value: stats.totalRutas,
      icon: MapIcon,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.bgColor} rounded-xl p-6 border border-gray-200`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
            </div>
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
