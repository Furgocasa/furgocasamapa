export type ClasificacionImagen =
  | 'stock'
  | 'catalogo'
  | 'revista'
  | 'social'
  | 'basura'
  | 'mapa'
  | 'google_places'
  | 'directorio_area'
  | 'ia_propia'
  | 'otro'
  | 'invalid'

export type RiesgoImagen = 'ALTO' | 'MEDIO' | 'BAJO'

export const CLASE_LABELS: Record<ClasificacionImagen, string> = {
  stock: 'Stock / Getty / Adobe',
  catalogo: 'Catálogo de marca',
  revista: 'Revista / medio',
  social: 'Facebook / Instagram',
  basura: 'Miniatura / basura',
  mapa: 'Captura de mapa',
  google_places: 'Google Places',
  directorio_area: 'Directorio del área',
  ia_propia: 'Generada por nosotros',
  otro: 'Otro dominio',
  invalid: 'URL inválida',
}

const STOCK_HOSTS = [
  'shutterstock.com', 'gettyimages.com', 'istockphoto.com', 'istock.com',
  'dreamstime.com', '123rf.com', 'depositphotos.com', 'alamy.com',
  'stock.adobe.com', 'fotolia.com', 'canstockphoto.com', 'bigstockphoto.com',
  'stocksy.com', 'pond5.com', 'superstock.com', 'agefotostock.com',
  'imagebroker.com', 'robertharding.com', 'freepik.com', 'elements.envato.com',
]

const STOCK_FILENAME = [
  /adobestock[_-]/i,
  /gettyimages[-_]/i,
  /shutterstock/i,
  /istock[_-]?photo/i,
  /dreamstime/i,
  /depositphotos/i,
  /alamy/i,
  /123rf/i,
  /c_shutterstock/i,
]

const CATALOG_HOSTS = [
  'hymer.com', 'burstner.com', 'knaus.com', 'fendt.com', 'dethleffs.com',
  'hobby-caravan.de', 'tabbert.com', 'adria-mobil.com', 'lmc-caravan.com',
  'weinsberg.com', 'carado.com', 'sunlight-caravan.com', 'eura-mobil.de',
  'frankia.de', 'concorde.eu', 'laika.it', 'swiftgroup.co.uk',
  'chausson-motorhomes.com', 'rapido.com', 'pilote.fr', 'winnebago.com',
  'motor1.com', 'mundoautocaravanas.com', 'mundovan.com', 'onroadmagazine.com',
  'carwow.com', 'carwow-es-wp-0.imgix.net',
]

const REVISTA_HOSTS = [
  'promobil.de', 'imgsdb1.promobil.de', 'pleinair.it', 'caravaning.es',
  'autocaravana.es', 'autocaravanas.es', 'practicalmotorhome.com',
  'whatmotorhome.com', 'campingcar-plus.fr', 'lemondeducampingcar.fr',
  'le-monde-du-camping-car.fr', 'campingcarlesite.com', 'reisemobil-international.de',
  'camperlife.it', 'motorhome.com', 'caravanmagazine.co.uk',
]

const SOCIAL_HOSTS = [
  'lookaside.fbsbx.com', 'lookaside.instagram.com', 'scontent.cdninstagram.com',
  'cdninstagram.com', 'instagram.com', 'scontent.xx.fbcdn.net', 'fbcdn.net',
  'facebook.com',
]

const JUNK_HOSTS = [
  'i.ytimg.com', 'ytimg.com', 'youtube.com', 'tiktok.com',
  'scribdassets.com', 'scribd.com',
]

const MAP_URL = [
  'img_cache/streets',
  'streets-v2',
  'staticmap',
]

const JUNK_URL = [
  'x-raw-image://',
  'registrationmodal',
  'placeholder',
  'data:image',
  'editor-elements-library',
]

const AREA_HOSTS = [
  'park4night.com', 'stellplatz.info', 'areascamper.com', 'areasac.es',
  'pitchup.com', 'searchforsites.co.uk', 'camping.info', 'acsi.eu',
  'geniuscamping.com', 'aireparkreservation.com', 'caramaps.com',
  'meinwomo.net', 'reseauaireservices.com', 'campcation-prod-images',
  'idylcar.fr', 'pleinairclub.it', 'where-e.com', 'guiagps.com',
  'clubrural.com', 'campings.net', 'bstatic.com', 'booking.com',
  'turicamp.com', 'samay.com',
]

const GOOGLE_HOSTS = [
  'maps.googleapis.com', 'lh3.googleusercontent.com', 'lh4.googleusercontent.com',
  'lh5.googleusercontent.com', 'lh6.googleusercontent.com',
  'streetviewpixels-pa.googleapis.com', 'ggpht.com',
]

export const CLASES_ALTO: ClasificacionImagen[] = [
  'stock', 'catalogo', 'revista', 'social', 'basura', 'mapa',
]

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

function hostMatches(host: string, list: string[]): boolean {
  if (!host) return false
  return list.some((h) => host === h || host.endsWith('.' + h) || host.includes(h))
}

export function classifyUrl(url: string): ClasificacionImagen {
  const host = hostOf(url)
  const full = (url || '').toLowerCase()
  if (!url) return 'invalid'
  if (full.includes('/storage/v1/object/public/areas/ia/') || full.includes('/storage/v1/object/public/areas/talleres-ia/')) {
    return 'ia_propia'
  }
  if (!host && full.startsWith('x-raw-image://')) return 'basura'
  if (!host) return 'invalid'
  if (MAP_URL.some((p) => full.includes(p))) return 'mapa'
  if (JUNK_URL.some((p) => full.includes(p))) return 'basura'
  if (hostMatches(host, JUNK_HOSTS)) return 'basura'
  if (STOCK_FILENAME.some((re) => re.test(url))) return 'stock'
  if (hostMatches(host, STOCK_HOSTS)) return 'stock'
  if (hostMatches(host, CATALOG_HOSTS)) return 'catalogo'
  if (hostMatches(host, REVISTA_HOSTS)) return 'revista'
  if (hostMatches(host, SOCIAL_HOSTS)) return 'social'
  if (hostMatches(host, GOOGLE_HOSTS)) return 'google_places'
  if (hostMatches(host, AREA_HOSTS) || host.includes('park4night')) return 'directorio_area'
  return 'otro'
}

export function riskOf(clasificacion: ClasificacionImagen, areasDistintas: number): RiesgoImagen {
  if (CLASES_ALTO.includes(clasificacion)) return 'ALTO'
  if (areasDistintas >= 3) return 'ALTO'
  if (areasDistintas === 2) return 'MEDIO'
  return 'BAJO'
}

export function isProhibidaParaEnriquecer(url: string): boolean {
  const c = classifyUrl(url)
  return CLASES_ALTO.includes(c) || c === 'directorio_area' || c === 'google_places'
}

/** Foto que puede quedarse en la ficha: propia, IA o web oficial. No mapas, stock ni directorios. */
export function esFotoSeguraEnFicha(url?: string | null): boolean {
  if (!url) return false
  const c = classifyUrl(url)
  if (c === 'invalid') return false
  if (c === 'ia_propia') return true
  return !isProhibidaParaEnriquecer(url)
}

/** En nuestro sitio HTTPS una foto http:// se ve rota (contenido mixto). */
export function esFotoMostrable(url?: string | null): boolean {
  return !!url && /^https:\/\//i.test(url) && esFotoSeguraEnFicha(url)
}

export function esWebDirectorio(website?: string | null): boolean {
  if (!website) return false
  const raw = website.startsWith('http') ? website : `https://${website}`
  const host = hostOf(raw)
  if (!host) return false
  if (hostMatches(host, AREA_HOSTS) || host.includes('park4night')) return true
  if (hostMatches(host, SOCIAL_HOSTS)) return true
  return /(?:^|\.)(?:instagram|facebook|fb|tiktok|twitter|x)\.com$/.test(host)
}

export function isImagenIA(url?: string | null): boolean {
  return classifyUrl(url || '') === 'ia_propia'
}

export function uniqueUrlsOf(area: { foto_principal?: string | null; fotos_urls?: string[] | null }): string[] {
  const set = new Set<string>()
  if (area.foto_principal) set.add(area.foto_principal)
  const extras = Array.isArray(area.fotos_urls) ? area.fotos_urls : []
  extras.forEach((u) => {
    if (u) set.add(u)
  })
  return [...set]
}

export function removeUrlsFromArea(
  area: { foto_principal?: string | null; fotos_urls?: string[] | null },
  urlsToRemove: Set<string>
): { foto_principal: string | null; fotos_urls: string[]; removed: number } {
  const remaining = uniqueUrlsOf(area).filter((u) => !urlsToRemove.has(u))
  const removed = uniqueUrlsOf(area).length - remaining.length
  return {
    foto_principal: remaining[0] || null,
    fotos_urls: remaining,
    removed,
  }
}

export type AreaImagenMin = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  provincia: string | null
  pais: string | null
  tipo_area?: string | null
  latitud?: number | null
  longitud?: number | null
  foto_principal: string | null
  fotos_urls: string[] | null
}

export type ImagenFlagged = {
  riesgo: RiesgoImagen
  clasificacion: ClasificacionImagen
  areasDistintas: number
  esPrincipal: boolean
  areaId: string
  nombre: string
  ciudad: string | null
  pais: string | null
  slug: string
  host: string
  url: string
}

export function indexImages(areas: AreaImagenMin[]) {
  const urlIndex = new Map<string, {
    clasificacion: ClasificacionImagen
    host: string
    areas: Map<string, { area: AreaImagenMin; esPrincipal: boolean }>
  }>()

  for (const area of areas) {
    for (const url of uniqueUrlsOf(area)) {
      if (!urlIndex.has(url)) {
        urlIndex.set(url, {
          clasificacion: classifyUrl(url),
          host: hostOf(url) || '(url-invalida)',
          areas: new Map(),
        })
      }
      urlIndex.get(url)!.areas.set(area.id, {
        area,
        esPrincipal: area.foto_principal === url,
      })
    }
  }

  return urlIndex
}

export function flagImages(areas: AreaImagenMin[]): ImagenFlagged[] {
  const urlIndex = indexImages(areas)
  const rows: ImagenFlagged[] = []

  for (const [url, info] of urlIndex.entries()) {
    const n = info.areas.size
    const riesgo = riskOf(info.clasificacion, n)
    if (riesgo === 'BAJO') continue
    for (const { area, esPrincipal } of info.areas.values()) {
      rows.push({
        riesgo,
        clasificacion: info.clasificacion,
        areasDistintas: n,
        esPrincipal,
        areaId: area.id,
        nombre: area.nombre,
        ciudad: area.ciudad,
        pais: area.pais,
        slug: area.slug,
        host: info.host,
        url,
      })
    }
  }

  return rows
}

export function isMapScreenshot(url: string): boolean {
  return classifyUrl(url) === 'mapa'
}

export function mapaUrlsOf(areas: AreaImagenMin[]): Set<string> {
  const urls = new Set<string>()
  for (const area of areas) {
    for (const url of uniqueUrlsOf(area)) {
      if (isMapScreenshot(url)) urls.add(url)
    }
  }
  return urls
}

export function altoUrlsOf(areas: AreaImagenMin[]): Set<string> {
  const urlIndex = indexImages(areas)
  const alto = new Set<string>()
  for (const [url, info] of urlIndex.entries()) {
    if (riskOf(info.clasificacion, info.areas.size) === 'ALTO') {
      alto.add(url)
    }
  }
  return alto
}
