const TITLE_MAX = 60
const DESC_MAX = 155

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.55 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

export function tituloTaller(nombre?: string | null): string {
  let n = (nombre || '')
    .replace(/\([^)]*(online|shop only|solo tienda|tienda online)[^)]*\)/gi, ' ')
    .replace(/\b(solo tienda online|shop only)\b/gi, ' ')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/[.\s]+$/u, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!n) return 'Taller'
  if (n === n.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(n)) {
    return n
      .toLowerCase()
      .replace(/(^|[\s/-])(\S)/g, (_, sep, ch) => sep + ch.toUpperCase())
  }
  return n
}

/** Localidad que la gente busca: Cartagena, Murcia. No «nave 2». */
export function lugarSeoTaller(ciudad?: string | null, provincia?: string | null): string {
  const sitio = sitioTaller(ciudad, provincia)
  if (!sitio) return ''
  return sitio.split(',')[0].trim()
}

/** H1 de ficha: la query local, no la marca. */
export function h1Taller(ciudad?: string | null, provincia?: string | null): string {
  const lugar = lugarSeoTaller(ciudad, provincia)
  return lugar ? `Taller de camperización en ${lugar}` : 'Taller de camperización'
}

/** Menos de esto: landing visible, noindex, fuera del sitemap. Molde áreas: no pueblo con 1. */
export const MIN_TALLERES_LANDING_INDEX = 3

/** Alquiler / flota = competencia de Furgocasa. No es taller de camperizado. */
export function esAlquilerNoTaller(nombre?: string | null, descripcion?: string | null): boolean {
  const blob = `${nombre || ''} ${descripcion || ''}`
  if (/\b(indie campers|yescapa|camperdays|roadsurfer|alquicamper|rent.?a.?camper)\b/i.test(blob)) {
    return true
  }
  if (/\bempresa de alquiler\b/i.test(blob)) return true
  if (/se centra en el alquiler|actividad (publicada )?se centra en el alquiler/i.test(blob)) {
    return true
  }
  if (/dedicad[oa] (al alquiler|a la venta y (el )?alquiler|a la compra, venta y alquiler)/i.test(blob)) {
    return true
  }
  if (/apartado de reservas/i.test(blob) && !/camperizaci/i.test(blob)) return true
  return false
}

const SENAL_CAMPER = /camper|autocaravan|caravana|\bfurgo|camperiz|\bvans?\b/i

const RUIDO_TALLER =
  /feu\s*vert|norauto|glassdrive|carglass|\bitv\b|desguace|eurorepar|nomad clean|neum[aá]tic|\blunas\b|concesionario|solo tienda|shop only|tienda online|camperizando|corte ingles|aparkarea|parking (camper|autocaravana|caravana)|área (de )?(servicio|autocaravana|sosta)|area (de )?(servicio|autocaravana)/i

/** Coche genérico, concesionario, tienda online, lunas, ITV. */
export function esRuidoTaller(
  nombre?: string | null,
  descripcion?: string | null,
  types?: string[] | null
): boolean {
  const blob = `${nombre || ''} ${descripcion || ''}`
  const tipos = types || []
  if (tipos.includes('car_rental') || tipos.includes('car_dealer')) return true
  if (RUIDO_TALLER.test(blob)) return true
  if (/accesorios/i.test(blob) && !/(taller|camperiz|reparac)/i.test(blob)) return true
  if (/taller oficial/i.test(blob) && !SENAL_CAMPER.test(blob)) return true
  return false
}

export function tieneSenalCamper(nombre?: string | null, types?: string[] | null): boolean {
  if (SENAL_CAMPER.test(nombre || '')) return true
  return (types || []).some((t) => SENAL_CAMPER.test(t))
}

/** Import: exigir señal camper. Hub / Tío: `exigirSenal: false` (catálogo ya curado). */
export function admiteTallerCamper(
  t: {
    nombre?: string | null
    descripcion?: string | null
    types?: string[] | null
    google_types?: string[] | null
  },
  opts?: { exigirSenal?: boolean }
): boolean {
  const types = t.types || t.google_types || null
  if (esAlquilerNoTaller(t.nombre, t.descripcion)) return false
  if (esRuidoTaller(t.nombre, t.descripcion, types)) return false
  if (opts?.exigirSenal !== false && !tieneSenalCamper(t.nombre, types)) return false
  return true
}

/** Ciudad de Places a veces es «nave 2» o un número. Entonces solo provincia. */
export function sitioTaller(ciudad?: string | null, provincia?: string | null): string {
  const c = (ciudad || '').trim()
  const sucia =
    !c ||
    /^\d/.test(c) ||
    /^(nave|n[ºo°.]?\s*\d|pol[ií]gono|c\/|calle |carril |pino )/i.test(c)
  const partes = sucia ? [provincia] : [c, provincia]
  return [...new Set(partes.filter(Boolean))].join(', ')
}

/** Agrupa el listado por localidad; sucias caen en la provincia. */
export function ciudadGrupoTaller(ciudad?: string | null, provincia?: string | null): string {
  const sitio = sitioTaller(ciudad, provincia)
  if (!sitio) return ''
  if (provincia && sitio === provincia) return provincia
  return (ciudad || '').trim() || provincia || sitio
}

/** Misma fórmula que el Tío: nota × volumen. Un 5 con 2 votos no gana a un 4,8 con 80. */
export function scoreValoracionTaller(
  rating: number | null | undefined,
  reviews: number | null | undefined
): number {
  if (rating == null || rating <= 0) return 0
  const n = Math.max(0, Number(reviews) || 0)
  return (15 * 4.2 + n * rating) / (15 + n)
}

export function direccionVisible(direccion?: string | null): string | null {
  if (!direccion?.trim()) return null
  return direccion
    .replace(/\s*,\s*Spain\s*$/i, '')
    .replace(/^Neumáticos\s*\(\s*Lavadero,\s*/i, '')
    .replace(/\)$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function mapsUrlTaller(t: {
  google_maps_url?: string | null
  latitud?: number | string | null
  longitud?: number | string | null
}): string | null {
  if (t.google_maps_url) return t.google_maps_url
  const lat = Number(t.latitud)
  const lng = Number(t.longitud)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

export function tallerSeoSnippet(t: {
  nombre?: string | null
  ciudad?: string | null
  provincia?: string | null
  google_rating?: number | null
  descripcion?: string | null
}) {
  const nombre = tituloTaller(t.nombre)
  const lugar = lugarSeoTaller(t.ciudad, t.provincia)
  const local = lugar ? `Taller camper ${lugar}` : 'Taller de camperización'
  const title = clip(nombre && nombre !== 'Taller' ? `${local} | ${nombre}` : local, TITLE_MAX)
  const propio = (t.descripcion || '').split(/\n\s*\n/)[0]?.replace(/\s+/g, ' ').trim()
  const rating =
    t.google_rating && t.google_rating > 0
      ? ` ${t.google_rating.toFixed(1)}★ en Google.`
      : ''
  const description = clip(
    propio ||
      `${h1Taller(t.ciudad, t.provincia)}: ficha de ${nombre}. Dirección, teléfono y mapa en MapafurgoCasa.${rating}`,
    DESC_MAX
  )
  return { title, description, h1: h1Taller(t.ciudad, t.provincia) }
}
