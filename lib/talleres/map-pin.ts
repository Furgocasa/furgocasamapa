import type { Area } from '@/types/database.types'
import { getTipoAreaColor, getTipoAreaIconPath, TIPO_AREA_GLYPH_RATIO } from '@/lib/areas/tipo-area'
import type { Locale } from '@/lib/i18n/config'
import { getTipoAreaLabel } from '@/lib/i18n/labels'
import { TALLER_ICON_PATH, TALLER_PIN_COLOR } from './types'
import type { Taller } from './types'

export type MapPin = Area & { fichaBase?: '/area' | '/taller' }

export function fichaBaseDePin(pin: unknown): '/area' | '/taller' {
  if (!pin || typeof pin !== 'object') return '/area'
  return (pin as { fichaBase?: string }).fichaBase === '/taller' ? '/taller' : '/area'
}

export function esPinTaller(pin: unknown): boolean {
  return fichaBaseDePin(pin) === '/taller'
}

export function colorPin(pin: unknown): string {
  if (esPinTaller(pin)) return TALLER_PIN_COLOR
  return getTipoAreaColor((pin as { tipo_area?: string } | null)?.tipo_area)
}

export function iconPathDePin(pin: unknown): string {
  if (esPinTaller(pin)) return TALLER_ICON_PATH
  return getTipoAreaIconPath((pin as { tipo_area?: string } | null)?.tipo_area)
}

export function iconSvgDePin(pin: unknown, size = 16): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="${iconPathDePin(pin)}"/></svg>`
}

export function pinSvgDePin(pin: unknown, size = 26): string {
  const glyph = size * TIPO_AREA_GLYPH_RATIO
  const offset = (size - glyph) / 2
  const scale = glyph / 24
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1.5}" fill="${colorPin(pin)}" stroke="#fff" stroke-width="2"/><g transform="translate(${offset} ${offset}) scale(${scale})" fill="#fff"><path d="${iconPathDePin(pin)}"/></g></svg>`
}

export function etiquetaDePin(pin: unknown, locale: Locale): string {
  if (esPinTaller(pin)) {
    return (
      { es: 'Taller', en: 'Workshop', fr: 'Atelier', de: 'Werkstatt', it: 'Officina' }[locale] ||
      'Taller'
    )
  }
  return getTipoAreaLabel((pin as { tipo_area?: string }).tipo_area || 'publica', locale)
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
