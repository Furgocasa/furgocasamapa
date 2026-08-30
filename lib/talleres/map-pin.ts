import type { Area } from '@/types/database.types'
import { getTipoAreaColor } from '@/lib/areas/tipo-area'
import { TALLER_PIN_COLOR } from './types'
import type { Taller } from './types'

export type MapPin = Area & { fichaBase?: '/area' | '/taller' }

export function fichaBaseDePin(pin: Pick<MapPin, 'fichaBase'> | { fichaBase?: string } | null | undefined): '/area' | '/taller' {
  return pin?.fichaBase === '/taller' ? '/taller' : '/area'
}

export function colorPin(pin: Pick<MapPin, 'fichaBase' | 'tipo_area'>): string {
  if (pin.fichaBase === '/taller') return TALLER_PIN_COLOR
  return getTipoAreaColor(pin.tipo_area)
}

export function tallerToMapPin(t: Taller): MapPin {
  return {
    id: t.id,
    nombre: t.nombre,
    slug: t.slug,
    descripcion: t.descripcion,
    latitud: Number(t.latitud),
    longitud: Number(t.longitud),
    direccion: t.direccion,
    codigo_postal: t.codigo_postal,
    ciudad: t.ciudad,
    provincia: t.provincia,
    comunidad: t.comunidad,
    comunidad_autonoma: t.comunidad,
    pais: t.pais || 'España',
    telefono: t.telefono,
    email: t.email,
    website: t.website,
    google_maps_url: t.google_maps_url,
    google_place_id: t.google_place_id,
    google_rating: t.google_rating,
    google_ratings_total: t.google_ratings_total,
    google_types: t.google_types,
    servicios: {},
    tipo_area: 'privada',
    precio_noche: null,
    precio_24h: false,
    plazas_totales: null,
    plazas_camper: null,
    acceso_24h: false,
    barrera_altura: null,
    fotos_urls: t.fotos_urls || [],
    foto_principal: t.foto_principal,
    verificado: t.verificado,
    activo: t.activo,
    con_descuento_furgocasa: false,
    created_at: t.created_at,
    updated_at: t.updated_at,
    created_by: null,
    fichaBase: '/taller',
  }
}
