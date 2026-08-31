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

/**
 * Tipo de taller DERIVADO (no hay columna en BD): nombre + descripción + tipos Google.
 * - camperizacion: fabrica / transforma furgonetas en camper.
 * - autocaravanas: repara y mantiene autocaravanas y caravanas (Caravanas Murcia, Sangar).
 * - especialista: accesorios, electricidad, solar, toldos, tapicería… sin fabricar.
 * Una única función para H1, title/description, malla de import y Tío Viajero.
 */
export type TipoTaller = 'camperizacion' | 'autocaravanas' | 'especialista'

export const TIPO_TALLER_LABEL: Record<TipoTaller, string> = {
  camperizacion: 'Taller de camperización',
  autocaravanas: 'Taller de autocaravanas',
  especialista: 'Taller especialista camper',
}

const RE_CAMPERIZA = /camperiz\w*|conversi[oó]n de furg|transformaci[oó]n de furg|fabricaci[oó]n de campers?|fabricamos campers?/gi
const RE_AUTOCARAVANA = /autocaravanas?|caravanas?|motorhomes?/gi
const RE_ESPECIALISTA =
  /accesorios|el[eé]ctric\w*|electricidad|energ[ií]a solar|placas? solares?|bater[ií]as?|toldos?|calefacci[oó]n|tapicer[ií]a|rotulaci[oó]n|aislamiento|mosquiteras?/i

function cuenta(texto: string, re: RegExp): number {
  return (texto.match(re) || []).length
}

export function tipoTaller(t: {
  nombre?: string | null
  descripcion?: string | null
  google_types?: string[] | null
}): TipoTaller {
  const nombre = t.nombre || ''
  const blob = `${nombre} ${t.descripcion || ''}`
  let camperiza = cuenta(blob, RE_CAMPERIZA)
  let autocaravana = cuenta(blob, RE_AUTOCARAVANA)
  // La marca pesa: «Caravanas Sangar» es taller de autocaravanas aunque su texto cite camperización.
  if (/caravan|autocaravan|motorhome/i.test(nombre)) autocaravana += 3
  if (/camperiz|\bvans?\b|furgo|\bcampers?\b/i.test(nombre)) camperiza += 3
  if (!camperiza && !autocaravana) {
    return RE_ESPECIALISTA.test(blob) ? 'especialista' : 'camperizacion'
  }
  if (autocaravana > camperiza) return 'autocaravanas'
  return 'camperizacion'
}

/** H1 de ficha: la query local según el tipo real, no la marca. */
export function h1Taller(t: {
  nombre?: string | null
  descripcion?: string | null
  ciudad?: string | null
  provincia?: string | null
  google_types?: string[] | null
}): string {
  const etiqueta = TIPO_TALLER_LABEL[tipoTaller(t)]
  const lugar = lugarSeoTaller(t.ciudad, t.provincia)
  return lugar ? `${etiqueta} en ${lugar}` : etiqueta
}

/** Menos de esto: landing visible, noindex, fuera del sitemap. Molde áreas: no pueblo con 1. */
export const MIN_TALLERES_LANDING_INDEX = 3

const SENAL_CAMPER = /camper|autocaravan|caravana|\bfurgo|camperiz|\bvans?\b/i
const SENAL_TALLER = /taller|camperiz|reparac|fabricac|conversi[oó]n/i
const FLOTA_SOLA =
  /\b(indie campers|yescapa|camperdays|roadsurfer|alquicamper|rent.?a.?camper|semura camper)\b/i

/** Solo flota. Caravanas Murcia (taller + venta + alquiler) no entra aquí. */
export function esAlquilerNoTaller(nombre?: string | null, descripcion?: string | null): boolean {
  const blob = `${nombre || ''} ${descripcion || ''}`
  if (FLOTA_SOLA.test(blob)) return true
  if (SENAL_TALLER.test(blob)) return false
  if (/\bempresa de alquiler\b/i.test(blob)) return true
  if (/se centra en el alquiler|actividad (publicada )?se centra en el alquiler/i.test(blob)) {
    return true
  }
  if (/apartado de reservas/i.test(blob) && !/camperizaci/i.test(blob)) return true
  // «Myvan Alquiler Autocaravanas», «AC-LLAR. Vacaciones en Autocaravana», «X Rent a Van»:
  // flota con nombre camper pero sin taller. Sin «de» también cuenta.
  if (
    /^alquiler\b|\balquiler\s+(de\s+)?(autocaravanas?|campers?|caravanas?|furgonetas?)\b|vacaciones en (autocaravana|camper)|\brent\s?a\s?(car|van|camper)\b/i.test(
      nombre || ''
    )
  ) {
    return true
  }
  return false
}

const RUIDO_TALLER =
  /feu\s*vert|norauto|glassdrive|carglass|\bitv\b|desguace|eurorepar|nomad clean|neum[aá]tic|\blunas\b|solo tienda|shop only|tienda online|camperizando|corte ingl[eé]s|aparkarea|parking (camper|autocaravana|caravana)|área (de )?(servicio|autocaravana|sosta)|area (de )?(servicio|autocaravana)/i

/** Coche genérico, tienda online, lunas, ITV. No capar concesionario con taller. */
export function esRuidoTaller(
  nombre?: string | null,
  descripcion?: string | null,
  types?: string[] | null
): boolean {
  const blob = `${nombre || ''} ${descripcion || ''}`
  const tipos = types || []
  // car_rental sin señal de taller = flota, aunque el rótulo diga «Caravan» (Caravan La Mancha).
  if (tipos.includes('car_rental') && !SENAL_TALLER.test(blob)) {
    return true
  }
  if (RUIDO_TALLER.test(blob)) return true
  if (/accesorios/i.test(blob) && !SENAL_TALLER.test(blob)) return true
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
  const tipo = tipoTaller(t)
  const query = tipo === 'autocaravanas' ? 'Taller de autocaravanas' : 'Taller camper'
  const local = lugar ? `${query} ${lugar}` : TIPO_TALLER_LABEL[tipo]
  const title = clip(nombre && nombre !== 'Taller' ? `${local} | ${nombre}` : local, TITLE_MAX)
  const propio = (t.descripcion || '').split(/\n\s*\n/)[0]?.replace(/\s+/g, ' ').trim()
  const rating =
    t.google_rating && t.google_rating > 0
      ? ` ${t.google_rating.toFixed(1)}★ en Google.`
      : ''
  const description = clip(
    propio ||
      `${h1Taller(t)}: ficha de ${nombre}. Dirección, teléfono y mapa en MapafurgoCasa.${rating}`,
    DESC_MAX
  )
  return { title, description, h1: h1Taller(t) }
}
