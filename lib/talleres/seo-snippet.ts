const TITLE_MAX = 60
const DESC_MAX = 155

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.55 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
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
