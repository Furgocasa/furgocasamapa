/**
 * CTAs de la ficha: alquiler Furgocasa y cena Casi Cinco.
 * Solo España. Fuera, la ficha no vende.
 */

import { sinTildes } from './slug'

const FURGOCASA_ORIGIN = 'https://www.furgocasa.com'
const CASI_CINCO_MAPA = 'https://www.casicinco.com/mapa'

export type ZonaAlquiler =
  | 'murcia'
  | 'alicante'
  | 'valencia'
  | 'albacete'
  | 'madrid'
  | 'almeria'
  | 'espana'

export interface CtaAlquiler {
  zona: ZonaAlquiler
  titulo: string
  cuerpo: string
  boton: string
  basePath: string
}

export interface AreaCtaInput {
  id: string
  slug: string
  pais?: string | null
  ciudad?: string | null
  provincia?: string | null
  comunidad?: string | null
}

function norm(value?: string | null): string {
  return sinTildes(value).replace(/\s+/g, ' ').trim()
}

function blob(area: AreaCtaInput): string {
  return [area.ciudad, area.provincia, area.comunidad].map(norm).filter(Boolean).join(' ')
}

function includesAny(text: string, needles: string[]): boolean {
  return needles.some((n) => text.includes(norm(n)))
}

export function isEspana(pais?: string | null): boolean {
  const n = norm(pais)
  return n === 'espana' || n === 'spain' || n === 'es'
}

export function zonaAlquiler(area: AreaCtaInput): ZonaAlquiler | null {
  if (!isEspana(area.pais)) return null
  const t = blob(area)

  if (includesAny(t, ['madrid', 'comunidad de madrid'])) return 'madrid'
  if (includesAny(t, ['albacete'])) return 'albacete'
  if (includesAny(t, ['alicante', 'alacant'])) return 'alicante'
  if (includesAny(t, ['valencia', 'castellon', 'castello'])) return 'valencia'
  if (includesAny(t, ['almeria'])) return 'almeria'
  if (includesAny(t, ['murcia', 'cartagena'])) return 'murcia'
  return 'espana'
}

const COPY: Record<ZonaAlquiler, Omit<CtaAlquiler, 'zona'>> = {
  murcia: {
    titulo: 'Alquila una camper en Murcia y duerme aquí',
    cuerpo: 'Recogida en Casillas (Murcia). Flota lista para salir hacia esta área el mismo día.',
    boton: 'Ver campers en Murcia',
    basePath: '/es/alquiler-autocaravanas-campervans/murcia',
  },
  alicante: {
    titulo: 'Esta ruta se hace desde el Levante',
    cuerpo: 'Alquila en Furgocasa: recogida en Murcia, a unos 60 minutos de Alicante.',
    boton: 'Alquilar para el Levante',
    basePath: '/es/alquiler-autocaravanas-campervans/alicante',
  },
  valencia: {
    titulo: 'Esta ruta se hace desde el Levante',
    cuerpo: 'Alquila en Furgocasa. Recogida en Murcia; Valencia queda a un día suave de ruta.',
    boton: 'Alquilar para Valencia',
    basePath: '/es/alquiler-autocaravanas-campervans/valencia',
  },
  albacete: {
    titulo: 'Alquila una camper para esta zona',
    cuerpo: 'Recogida en Murcia. Albacete está a hora y media: puedes estar aquí el mismo día.',
    boton: 'Ver alquiler para Albacete',
    basePath: '/es/alquiler-autocaravanas-campervans/albacete',
  },
  madrid: {
    titulo: 'Alquila una camper desde Madrid',
    cuerpo: 'Entrega en Madrid o recogida en Murcia, según la reserva.',
    boton: 'Ver campers (Madrid)',
    basePath: '/es/alquiler-autocaravanas-campervans/madrid',
  },
  almeria: {
    titulo: 'Alquila una camper para Almería',
    cuerpo: 'Recogida en Murcia. Cabo de Gata y el levante almeriense quedan a un salto.',
    boton: 'Alquilar para Almería',
    basePath: '/es/alquiler-autocaravanas-campervans/almeria',
  },
  espana: {
    titulo: 'Alquila una camper para recorrer esta zona',
    cuerpo: 'Furgocasa. Recogida en Murcia o entrega en Madrid. Kilómetros ilimitados en España.',
    boton: 'Reservar una camper',
    basePath: '/es/reservar',
  },
}

export function resolverCtaAlquiler(area: AreaCtaInput): CtaAlquiler | null {
  const zona = zonaAlquiler(area)
  if (!zona) return null
  return { zona, ...COPY[zona] }
}

export function urlAlquiler(area: AreaCtaInput, cta: CtaAlquiler): string {
  const params = new URLSearchParams({
    utm_source: 'mapafurgocasa',
    utm_medium: 'cta_ficha',
    utm_campaign: 'alquiler',
    utm_content: area.slug || area.id,
  })
  return `${FURGOCASA_ORIGIN}${cta.basePath}?${params.toString()}`
}

export function urlCenaCerca(area: AreaCtaInput): string | null {
  if (!isEspana(area.pais)) return null
  const params = new URLSearchParams({
    category: 'restaurante',
    utm_source: 'mapafurgocasa',
    utm_medium: 'cta_cerca',
    utm_campaign: 'cena_cerca',
    utm_content: area.slug || area.id,
  })
  const ciudad = (area.ciudad || '').trim()
  const provincia = (area.provincia || '').trim()
  if (ciudad) params.set('city', ciudad)
  if (provincia) params.set('province', provincia)
  if (!ciudad && !provincia) return null
  return `${CASI_CINCO_MAPA}?${params.toString()}`
}
