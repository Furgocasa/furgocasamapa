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

interface Props {
  servicios: Servicios
}

export function ServiciosGrid({ servicios }: Props) {
  const serviciosConfig = [
    { key: 'agua', label: 'Agua potable', icon: BeakerIcon },
    { key: 'electricidad', label: 'Electricidad', icon: BoltIcon },
    { key: 'vaciado_aguas_negras', label: 'Vaciado WC Químico', icon: TrashIcon },
    { key: 'vaciado_aguas_grises', label: 'Vaciado Aguas Grises', icon: ArchiveBoxArrowDownIcon },
    { key: 'wifi', label: 'Conexión WiFi', icon: WifiIcon },
    { key: 'duchas', label: 'Duchas', icon: SparklesIcon },
    { key: 'wc', label: 'Aseos (WC)', icon: UserIcon },
    { key: 'lavanderia', label: 'Lavandería', icon: ArchiveBoxIcon },
    { key: 'restaurante', label: 'Restaurante / Bar', icon: BuildingStorefrontIcon },
    { key: 'supermercado', label: 'Supermercado', icon: ShoppingCartIcon },
    { key: 'zona_mascotas', label: 'Admite Mascotas', icon: HeartIcon },
  ]

  // Contar servicios disponibles
  const serviciosDisponibles = Object.values(servicios).filter(Boolean).length
  const serviciosTotales = serviciosConfig.length

  return (
    <section className="bg-white rounded-3xl shadow-[0_2px_24px_-8px_rgba(0,0,0,0.08)] border border-gray-100 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Servicios e Instalaciones</h2>
        <span className="inline-flex items-center text-sm font-bold text-blue-700 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
          {serviciosDisponibles} de {serviciosTotales} disponibles
        </span>
      </div>

      {/* Grid de servicios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviciosConfig.map(({ key, label, icon: Icon }) => {
          const disponible = servicios[key as keyof Servicios]
          
          return (
            <div
              key={key}
              className={`
                flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200
                ${disponible 
                  ? 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200' 
                  : 'bg-slate-50 border-transparent opacity-60'
                }
              `}
            >
              <div className={`p-2.5 rounded-xl transition-colors ${disponible ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold tracking-tight ${disponible ? 'text-slate-900' : 'text-slate-500'}`}>
                  {label}
                </p>
              </div>
              {disponible ? (
                <CheckCircleIcon className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-slate-300 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Nota si no hay servicios */}
      {serviciosDisponibles === 0 && (
        <div className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 items-start">
          <div className="text-amber-500 text-xl mt-0.5">ℹ️</div>
          <div>
            <h4 className="text-amber-800 font-bold mb-1">Sin información detallada</h4>
            <p className="text-sm text-amber-700">
              Actualmente no disponemos de información confirmada sobre los servicios e instalaciones de esta área.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
