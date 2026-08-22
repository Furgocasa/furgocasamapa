/**
 * Provincias de España canónicas para las landings SEO /areas/{provincia}
 * (GUIA_MAPA_ALQUILER.md §15).
 *
 * - `nombre` es el valor canónico que debe tener `areas.provincia`.
 * - `aliases` recoge variantes vistas en la base o habituales
 *   («Lérida» → Lleida) para normalizar datos y consultas.
 * - `vecinas` (slugs) alimenta el interlinking entre landings.
 */

import { sinTildes } from './slug'

export interface ProvinciaES {
  slug: string
  nombre: string
  aliases?: string[]
  vecinas: string[]
}

export const PROVINCIAS_ES: ProvinciaES[] = [
  { slug: 'a-coruna', nombre: 'A Coruña', aliases: ['La Coruña', 'Coruña'], vecinas: ['lugo', 'pontevedra'] },
  { slug: 'alava', nombre: 'Álava', aliases: ['Araba', 'Araba/Álava'], vecinas: ['bizkaia', 'gipuzkoa', 'navarra', 'la-rioja', 'burgos'] },
  { slug: 'albacete', nombre: 'Albacete', vecinas: ['cuenca', 'valencia', 'alicante', 'murcia', 'granada', 'jaen', 'ciudad-real'] },
  { slug: 'alicante', nombre: 'Alicante', aliases: ['Alacant', 'Alicante/Alacant'], vecinas: ['valencia', 'albacete', 'murcia'] },
  { slug: 'almeria', nombre: 'Almería', vecinas: ['murcia', 'granada'] },
  { slug: 'asturias', nombre: 'Asturias', aliases: ['Principado de Asturias'], vecinas: ['lugo', 'leon', 'cantabria'] },
  { slug: 'avila', nombre: 'Ávila', vecinas: ['salamanca', 'caceres', 'toledo', 'madrid', 'segovia', 'valladolid'] },
  { slug: 'badajoz', nombre: 'Badajoz', vecinas: ['huelva', 'sevilla', 'cordoba', 'ciudad-real', 'toledo', 'caceres'] },
  { slug: 'barcelona', nombre: 'Barcelona', vecinas: ['girona', 'lleida', 'tarragona'] },
  { slug: 'bizkaia', nombre: 'Bizkaia', aliases: ['Vizcaya'], vecinas: ['cantabria', 'burgos', 'alava', 'gipuzkoa'] },
  { slug: 'burgos', nombre: 'Burgos', vecinas: ['palencia', 'valladolid', 'segovia', 'soria', 'la-rioja', 'alava', 'bizkaia', 'cantabria'] },
  { slug: 'caceres', nombre: 'Cáceres', vecinas: ['badajoz', 'toledo', 'avila', 'salamanca'] },
  { slug: 'cadiz', nombre: 'Cádiz', vecinas: ['malaga', 'sevilla'] },
  { slug: 'cantabria', nombre: 'Cantabria', vecinas: ['asturias', 'leon', 'palencia', 'burgos', 'bizkaia'] },
  { slug: 'castellon', nombre: 'Castellón', aliases: ['Castelló', 'Castellón/Castelló', 'Castelló de la Plana'], vecinas: ['tarragona', 'teruel', 'valencia'] },
  { slug: 'ciudad-real', nombre: 'Ciudad Real', vecinas: ['jaen', 'cordoba', 'badajoz', 'toledo', 'cuenca', 'albacete'] },
  { slug: 'cordoba', nombre: 'Córdoba', vecinas: ['sevilla', 'malaga', 'granada', 'jaen', 'ciudad-real', 'badajoz'] },
  { slug: 'cuenca', nombre: 'Cuenca', vecinas: ['toledo', 'ciudad-real', 'albacete', 'valencia', 'teruel', 'guadalajara', 'madrid'] },
  { slug: 'girona', nombre: 'Girona', aliases: ['Gerona'], vecinas: ['lleida', 'barcelona'] },
  { slug: 'gipuzkoa', nombre: 'Gipuzkoa', aliases: ['Guipúzcoa'], vecinas: ['bizkaia', 'alava', 'navarra'] },
  { slug: 'granada', nombre: 'Granada', vecinas: ['almeria', 'murcia', 'albacete', 'jaen', 'cordoba', 'malaga'] },
  { slug: 'guadalajara', nombre: 'Guadalajara', vecinas: ['madrid', 'cuenca', 'teruel', 'zaragoza', 'soria', 'segovia'] },
  { slug: 'huelva', nombre: 'Huelva', vecinas: ['sevilla', 'badajoz'] },
  { slug: 'huesca', nombre: 'Huesca', vecinas: ['navarra', 'zaragoza', 'lleida'] },
  { slug: 'illes-balears', nombre: 'Illes Balears', aliases: ['Islas Baleares', 'Baleares', 'Mallorca', 'Menorca', 'Ibiza', 'Eivissa'], vecinas: [] },
  { slug: 'jaen', nombre: 'Jaén', vecinas: ['cordoba', 'granada', 'albacete', 'ciudad-real'] },
  { slug: 'la-rioja', nombre: 'La Rioja', vecinas: ['alava', 'navarra', 'zaragoza', 'soria', 'burgos'] },
  { slug: 'las-palmas', nombre: 'Las Palmas', vecinas: ['santa-cruz-de-tenerife'] },
  { slug: 'leon', nombre: 'León', vecinas: ['asturias', 'lugo', 'ourense', 'zamora', 'valladolid', 'palencia', 'cantabria'] },
  { slug: 'lleida', nombre: 'Lleida', aliases: ['Lérida'], vecinas: ['huesca', 'zaragoza', 'tarragona', 'barcelona', 'girona'] },
  { slug: 'lugo', nombre: 'Lugo', vecinas: ['a-coruna', 'pontevedra', 'ourense', 'asturias', 'leon'] },
  { slug: 'madrid', nombre: 'Madrid', aliases: ['Comunidad de Madrid'], vecinas: ['segovia', 'avila', 'toledo', 'cuenca', 'guadalajara'] },
  { slug: 'malaga', nombre: 'Málaga', vecinas: ['granada', 'cordoba', 'sevilla', 'cadiz'] },
  { slug: 'murcia', nombre: 'Murcia', aliases: ['Región de Murcia'], vecinas: ['alicante', 'albacete', 'granada', 'almeria'] },
  { slug: 'navarra', nombre: 'Navarra', aliases: ['Nafarroa'], vecinas: ['gipuzkoa', 'alava', 'la-rioja', 'zaragoza', 'huesca'] },
  { slug: 'ourense', nombre: 'Ourense', aliases: ['Orense'], vecinas: ['pontevedra', 'lugo', 'leon', 'zamora'] },
  { slug: 'palencia', nombre: 'Palencia', vecinas: ['leon', 'valladolid', 'burgos', 'cantabria'] },
  { slug: 'pontevedra', nombre: 'Pontevedra', vecinas: ['a-coruna', 'lugo', 'ourense'] },
  { slug: 'salamanca', nombre: 'Salamanca', vecinas: ['caceres', 'avila', 'valladolid', 'zamora'] },
  { slug: 'santa-cruz-de-tenerife', nombre: 'Santa Cruz de Tenerife', aliases: ['Tenerife'], vecinas: ['las-palmas'] },
  { slug: 'segovia', nombre: 'Segovia', vecinas: ['madrid', 'avila', 'valladolid', 'burgos', 'soria', 'guadalajara'] },
  { slug: 'sevilla', nombre: 'Sevilla', vecinas: ['cadiz', 'malaga', 'cordoba', 'badajoz', 'huelva'] },
  { slug: 'soria', nombre: 'Soria', vecinas: ['burgos', 'segovia', 'guadalajara', 'zaragoza', 'la-rioja'] },
  { slug: 'tarragona', nombre: 'Tarragona', vecinas: ['barcelona', 'lleida', 'zaragoza', 'teruel', 'castellon'] },
  { slug: 'teruel', nombre: 'Teruel', vecinas: ['zaragoza', 'guadalajara', 'cuenca', 'valencia', 'castellon', 'tarragona'] },
  { slug: 'toledo', nombre: 'Toledo', vecinas: ['caceres', 'badajoz', 'ciudad-real', 'cuenca', 'madrid', 'avila'] },
  { slug: 'valencia', nombre: 'Valencia', aliases: ['València', 'Valencia/València'], vecinas: ['castellon', 'teruel', 'cuenca', 'albacete', 'alicante'] },
  { slug: 'valladolid', nombre: 'Valladolid', vecinas: ['zamora', 'salamanca', 'avila', 'segovia', 'burgos', 'palencia', 'leon'] },
  { slug: 'zamora', nombre: 'Zamora', vecinas: ['salamanca', 'valladolid', 'leon', 'ourense'] },
  { slug: 'zaragoza', nombre: 'Zaragoza', vecinas: ['huesca', 'navarra', 'la-rioja', 'soria', 'guadalajara', 'teruel', 'tarragona', 'lleida'] },
]

const porSlug = new Map(PROVINCIAS_ES.map((p) => [p.slug, p]))

const porNombreNormalizado = new Map<string, ProvinciaES>()
for (const p of PROVINCIAS_ES) {
  porNombreNormalizado.set(sinTildes(p.nombre), p)
  for (const alias of p.aliases || []) {
    porNombreNormalizado.set(sinTildes(alias), p)
  }
}

export function provinciaPorSlug(slug: string): ProvinciaES | null {
  return porSlug.get(slug) || null
}

/** Devuelve la provincia canónica para un valor libre de `areas.provincia`. */
export function normalizarProvincia(valor: string | null | undefined): ProvinciaES | null {
  const n = sinTildes(valor).replace(/\s+/g, ' ').trim()
  if (!n) return null
  return porNombreNormalizado.get(n) || null
}

/** Valores que hay que consultar en la base para una provincia (nombre + alias). */
export function valoresConsultaProvincia(p: ProvinciaES): string[] {
  return [p.nombre, ...(p.aliases || [])]
}
