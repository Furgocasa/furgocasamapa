'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import {
  Squares2X2Icon,
  MapPinIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  SparklesIcon,
  PhotoIcon,
  ShieldExclamationIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  TruckIcon,
  TableCellsIcon,
  ExclamationTriangleIcon,
  MapIcon,
  UsersIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  GlobeAltIcon,
  ArrowRightOnRectangleIcon,
  HandThumbUpIcon,
} from '@heroicons/react/24/outline'

type NavItem = {
  label: string
  href: string
  icon: JSX.Element
}

type NavGroup = {
  label: string
  icon: JSX.Element
  items: NavItem[]
}

type NavEntry = NavItem | NavGroup

const iconClass = 'w-5 h-5 shrink-0'

const NAV: NavEntry[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <Squares2X2Icon className={iconClass} />,
  },
  {
    label: 'Áreas',
    icon: <MapPinIcon className={iconClass} />,
    items: [
      { label: 'Listado de áreas', href: '/admin/areas', icon: <MapPinIcon className={iconClass} /> },
      { label: 'Nueva área', href: '/admin/areas/new', icon: <PlusIcon className={iconClass} /> },
      { label: 'Búsqueda masiva', href: '/admin/areas/busqueda-masiva', icon: <MagnifyingGlassIcon className={iconClass} /> },
      { label: 'Actualizar servicios', href: '/admin/areas/actualizar-servicios', icon: <ArrowPathIcon className={iconClass} /> },
      { label: 'Gestión de descripciones', href: '/admin/areas/enriquecer-textos', icon: <SparklesIcon className={iconClass} /> },
      { label: 'Gestión de imágenes', href: '/admin/areas/enriquecer-imagenes', icon: <PhotoIcon className={iconClass} /> },
      { label: 'Derechos de imagen', href: '/admin/areas/revisar-imagenes', icon: <ShieldExclamationIcon className={iconClass} /> },
      { label: 'Confirmaciones de viajeros', href: '/admin/areas/contribuciones', icon: <HandThumbUpIcon className={iconClass} /> },
    ],
  },
  {
    label: 'IA y Chatbot',
    icon: <CpuChipIcon className={iconClass} />,
    items: [
      { label: 'Configuración de IA', href: '/admin/configuracion', icon: <CpuChipIcon className={iconClass} /> },
      { label: 'Respuestas Tío Viajero', href: '/admin/chatbot-respuestas', icon: <ChatBubbleLeftRightIcon className={iconClass} /> },
    ],
  },
  {
    label: 'Datos y análisis',
    icon: <ChartBarIcon className={iconClass} />,
    items: [
      { label: 'Analíticas', href: '/admin/analytics', icon: <ChartBarIcon className={iconClass} /> },
      { label: 'Vehículos', href: '/admin/vehiculos', icon: <TruckIcon className={iconClass} /> },
      { label: 'Datos de mercado', href: '/admin/datos-mercado', icon: <TableCellsIcon className={iconClass} /> },
      { label: 'Reportes de accidentes', href: '/admin/reportes', icon: <ExclamationTriangleIcon className={iconClass} /> },
    ],
  },
  {
    label: 'Sistema',
    icon: <MapIcon className={iconClass} />,
    items: [
      { label: 'Configuración de mapas', href: '/admin/mapas', icon: <MapIcon className={iconClass} /> },
      { label: 'Usuarios', href: '/admin/users', icon: <UsersIcon className={iconClass} /> },
    ],
  },
]

function isGroup(entry: NavEntry): entry is NavGroup {
  return (entry as NavGroup).items !== undefined
}

function flattenItems(): NavItem[] {
  return NAV.flatMap((entry) => (isGroup(entry) ? entry.items : [entry]))
}

/** Devuelve el href del item activo: el prefijo más largo que casa con el pathname */
function findActiveHref(pathname: string): string | null {
  let best: string | null = null
  for (const item of flattenItems()) {
    if (pathname === item.href || pathname.startsWith(item.href + '/')) {
      if (!best || item.href.length > best.length) best = item.href
    }
  }
  return best
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const activeHref = findActiveHref(pathname || '')
  const activeItem = flattenItems().find((i) => i.href === activeHref)

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user || !session.user.user_metadata?.is_admin) {
        router.push('/mapa')
        return
      }
      setUserEmail(session.user.email || '')
      setReady(true)
    }
    check()
  }, [router])

  // Abrir automáticamente el grupo que contiene la ruta activa
  useEffect(() => {
    if (!activeHref) return
    for (const entry of NAV) {
      if (isGroup(entry) && entry.items.some((i) => i.href === activeHref)) {
        setOpenGroups((prev) => (prev[entry.label] ? prev : { ...prev, [entry.label]: true }))
      }
    }
  }, [activeHref])

  // Cerrar el menú móvil al navegar
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/mapa')
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  const linkClasses = (href: string, indented = false) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${indented ? 'pl-10' : ''} ${
      activeHref === href
        ? 'bg-primary-600 text-white font-semibold'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-900">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-1.5 shrink-0">
            <Image src="/logo-furgocasa.png" alt="Furgocasa" width={36} height={36} className="h-9 w-9 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold leading-tight">Mapa Furgocasa</p>
            <p className="text-slate-400 text-xs leading-tight">Panel de Administración</p>
          </div>
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map((entry) => {
          if (!isGroup(entry)) {
            return (
              <Link key={entry.href} href={entry.href} className={linkClasses(entry.href)}>
                {entry.icon}
                {entry.label}
              </Link>
            )
          }

          const open = !!openGroups[entry.label]
          const containsActive = entry.items.some((i) => i.href === activeHref)
          return (
            <div key={entry.label}>
              <button
                onClick={() => setOpenGroups((prev) => ({ ...prev, [entry.label]: !open }))}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  containsActive && !open
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {entry.icon}
                <span className="flex-1 text-left">{entry.label}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && (
                <div className="mt-1 space-y-1">
                  {entry.items.map((item) => (
                    <Link key={item.href} href={item.href} className={linkClasses(item.href, true)}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Usuario */}
      <div className="border-t border-slate-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-500 flex items-center justify-center text-white font-bold shrink-0">
            {(userEmail[0] || 'A').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{userEmail}</p>
            <p className="text-slate-400 text-xs">Administrador</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar escritorio */}
      <aside className="hidden lg:block w-72 shrink-0">{sidebar}</aside>

      {/* Sidebar móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-xl">
            {sidebar}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 text-slate-400 hover:text-white"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </aside>
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Barra superior */}
        <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center gap-3 px-4">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="font-semibold text-gray-900 truncate">
            {activeItem?.label || 'Panel de Administración'}
          </h1>
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/mapa"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              <GlobeAltIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Ver web</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
