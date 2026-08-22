/**
 * Title y description de /area/[slug] para el SERP.
 * No pegar la descripción larga ni el código tipo_area. No acabar en «| Mapa Furgocasa».
 */

import { sinTildes } from './slug'

export const TITLE_MAX = 60
export const DESC_MAX = 155

export interface AreaSnippetInput {
  nombre?: string | null
  ciudad?: string | null
  provincia?: string | null
  tipo_area?: string | null
  precio_noche?: number | null
  precio_24h?: boolean | null
  acceso_24h?: boolean | null
  servicios?: Record<string, boolean> | string | null
}

const SERVICIO_SNIPPET: Array<{ key: string; label: string }> = [
  { key: 'vaciado_aguas_negras', label: 'vaciado' },
  { key: 'vaciado_aguas_grises', label: 'vaciado' },
  { key: 'agua', label: 'agua' },
  { key: 'electricidad', label: 'electricidad' },
  { key: 'duchas', label: 'duchas' },
  { key: 'wc', label: 'WC' },
]

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.55 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

function jobTipo(tipo?: string | null): string {
  if (tipo === 'camping') return 'camping autocaravanas'
  if (tipo === 'privada') return 'área privada autocaravanas'
  return 'área autocaravanas'
}

function fraseTipoDonde(tipo: string | null | undefined, ciudad: string, provincia: string): string {
  const donde = [ciudad, provincia && provincia !== ciudad ? provincia : '']
    .filter(Boolean)
    .join(', ')
  if (tipo === 'camping') return `Camping en ${donde || 'España'}.`
  if (tipo === 'privada') return `Área privada en ${donde || 'España'}.`
  return `Área pública en ${donde || 'España'}.`
}

function asServicios(
  servicios?: AreaSnippetInput['servicios']
): Record<string, boolean> | null {
  if (!servicios) return null
  if (typeof servicios === 'string') {
    try {
      const parsed = JSON.parse(servicios)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  }
  return typeof servicios === 'object' ? servicios : null
}

function serviciosCortos(servicios?: AreaSnippetInput['servicios']): string[] {
  const map = asServicios(servicios)
  if (!map) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const { key, label } of SERVICIO_SNIPPET) {
    if (!map[key] || seen.has(label)) continue
    seen.add(label)
    out.push(label)
    if (out.length >= 3) break
  }
  return out
}

export function areaSeoTitle(area: AreaSnippetInput): string {
  const nombre = (area.nombre || 'Área').trim()
  const ciudad = (area.ciudad || '').trim()
  const job = jobTipo(area.tipo_area)
  const nombreLlevaCiudad =
    !!ciudad && sinTildes(nombre).includes(sinTildes(ciudad))

  let title = nombreLlevaCiudad || !ciudad
    ? `${nombre}: ${job}`
    : `${nombre} en ${ciudad}: ${job}`

  if (title.length > TITLE_MAX) {
    const jobCorto =
      area.tipo_area === 'camping'
        ? 'camping'
        : area.tipo_area === 'privada'
          ? 'área privada'
          : 'área autocaravanas'
    title = nombreLlevaCiudad || !ciudad
      ? `${nombre}: ${jobCorto}`
      : `${nombre} en ${ciudad}: ${jobCorto}`
  }

  return clip(title, TITLE_MAX)
}

export function areaSeoDescription(area: AreaSnippetInput): string {
  const ciudad = (area.ciudad || '').trim()
  const provincia = (area.provincia || '').trim()
  const partes = [
    fraseTipoDonde(area.tipo_area, ciudad, provincia),
    'Pernocta para autocaravanas.',
  ]

  if (area.precio_noche === 0) {
    partes.push('Pernocta gratuita.')
  } else if (typeof area.precio_noche === 'number' && area.precio_noche > 0) {
    partes.push(
      area.precio_24h
        ? `Desde ${area.precio_noche}€/24h.`
        : `Desde ${area.precio_noche}€/noche.`
    )
  }

  const sv = serviciosCortos(area.servicios)
  if (sv.length) partes.push(`${sv.join(', ')}.`)
  else if (area.acceso_24h) partes.push('Acceso 24 h.')

  partes.push('Cómo llegar y servicios.')
  return clip(partes.join(' '), DESC_MAX)
}

export function areaSeoSnippet(area: AreaSnippetInput): {
  title: string
  description: string
} {
  return {
    title: areaSeoTitle(area),
    description: areaSeoDescription(area),
  }
}
