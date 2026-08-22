'use client'

/**
 * Tasación IA, registro y QR. Solo home / perfil.
 * No va en /area: esa ficha vende el alquiler (GUIA_MAPA_ALQUILER.md).
 */

import Link from 'next/link'
import {
  SparklesIcon,
  TruckIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

interface Props {
  /** Si el usuario ya tiene un vehículo registrado, el CTA central cambia */
  vehiculoNombre?: string | null
  compact?: boolean
}

export function HerramientasVehiculo({ vehiculoNombre, compact = false }: Props) {
  const items = [
    {
      href: '/valoracion-ia-vehiculos',
      icon: SparklesIcon,
      title: 'Valorar con IA',
      sub: 'Precio de mercado de tu furgo en minutos',
      tone: 'bg-[#0b3c74] text-white hover:bg-[#0d4a8f]',
      iconWrap: 'bg-white/15',
    },
    {
      href: '/mis-autocaravanas',
      icon: TruckIcon,
      title: vehiculoNombre ? `Mi furgo: ${vehiculoNombre}` : 'Registrar mi furgo',
      sub: vehiculoNombre
        ? 'Ficha, gastos, mantenimiento y QR'
        : 'Lleva el registro y genera el QR de protección',
      tone: 'bg-sky-50 text-sky-950 hover:bg-sky-100 border border-sky-200',
      iconWrap: 'bg-sky-200/60',
    },
    {
      href: '/accidente',
      icon: ShieldCheckIcon,
      title: 'Reportar un golpe',
      sub: 'Si ves una furgo dañada, avisa al dueño en 1 minuto',
      tone: 'bg-red-50 text-red-950 hover:bg-red-100 border border-red-200',
      iconWrap: 'bg-red-200/60',
    },
  ]

  return (
    <section
      className={`bg-white rounded-lg border border-gray-200 ${
        compact ? 'p-4' : 'p-5 md:p-6'
      }`}
    >
      <h2 className="text-lg font-bold text-[#0b3c74] mb-1">
        Tu furgo también vive aquí
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        El mapa es el principio. También puedes saber cuánto vale tu vehículo,
        llevar su ficha y que te avisen si alguien le da un golpe.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl p-4 transition-colors ${item.tone}`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${item.iconWrap}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <p className="font-semibold text-sm leading-tight mb-1">
                {item.title}
              </p>
              <p className="text-xs opacity-80 leading-snug">{item.sub}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
