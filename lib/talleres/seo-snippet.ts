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
  const n = (nombre || '').trim()
  if (!n) return 'Taller'
  if (n === n.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(n)) {
    return n
      .toLowerCase()
      .replace(/(^|[\s/-])(\S)/g, (_, sep, ch) => sep + ch.toUpperCase())
  }
  return n
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
}) {
  const sitio = [t.ciudad, t.provincia].filter(Boolean).join(', ')
  const title = clip(
    sitio ? `${t.nombre} | Taller camper ${sitio}` : `${t.nombre} | Taller camper`,
    TITLE_MAX
  )
  const rating =
    t.google_rating && t.google_rating > 0
      ? ` ${t.google_rating.toFixed(1)}★ en Google.`
      : ''
  const description = clip(
    `${t.nombre} es un taller de campers y autocaravanas${sitio ? ` en ${sitio}` : ''}.${rating} Ficha en Mapa Furgocasa: dirección, teléfono y mapa.`,
    DESC_MAX
  )
  return { title, description }
}
