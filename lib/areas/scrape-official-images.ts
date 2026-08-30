import sharp from 'sharp'
import { isProhibidaParaEnriquecer } from './image-copyright'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const JUNK =
  /logo|logotipo|favicon|sprite|avatar|whatsapp|wasap|pixel|1x1|flags?\/|redes-sociales|widgetkit\/cache|wifi|kit-digital|free-wifi|signal_|banner-kit|opengraph-image|twitter-image|elementor\/thumbs|cabecera|header-logo|site_backgro|artboard|subvencion|subvenció|nextgeneration|ivace|idae|aviso-legal|politica-de-privacidad|cookies-policy/i
const DOCUMENTO_NOMBRE =
  /subvencion|subvenció|nextgeneration|ivace|financiado-por|aviso-legal|documento-|cartel-|convocatoria|ayuda-publica/i
const FLAGS = /\/(spain|france|germany|italy|united-kingdom|portugal|nederland|belgium)\.png/i
const PHOTO_EXT = /\.(jpe?g|png|webp)(\?|#|$)/i
const EXTRA_PATHS = [
  '/galeria', '/galeria/', '/fotos', '/fotos/', '/gallery', '/instalaciones',
  '/el-camping', '/camping', '/parcelas', '/el-recinto', '/servicios', '/sanitarios',
]
const SKIP_PATH = /entorno|surroundings|excursiones|turismo|actividades|snorkel|buceo/i
const RECINTO_NOMBRE =
  /instalacion|parcela|pitch|recepcion|reception|sanitari|ducha|aseo|lavander|stellplatz|sosta|camperpark|wohnmobil|autocaravana|motorhome|service-point|aire-de/i
const ENTORNO_NOMBRE =
  /landscape|monument|theatre|teatro|wrasse|underwater|snorkel|scuba|entorno|excursion|cityscape|skyline|castillo|catedral|bolnuevo|gredas|natural-monument|ornate-wrasse|roman-theatre|pez-|fish-|starfish|buceo/i
const MAPA_NOMBRE =
  /streets-v2|img_cache\/streets|staticmap|maps\.googleapis|openstreetmap|maptiler|mapa-de-situacion|plano-de-acceso|location-map|map-pin|street-map/i
const PORTADA_NOMBRE =
  /aerea|aéreo|aerial|drone|panoram|vista-general|vista-aerea|resumen|overview|bird.?eye/i
const LUGAR = /parcela|piscina|bungalow|instalacion|caravana|entrada|recepcion|autocaravana|sanitari|ducha|lavander/i
const MIN_BYTES = 35000
const MIN_W = 480
const MIN_H = 320

type FotoOk = { url: string; w: number; h: number; bytes: number }

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function abs(base: string, raw: string): string | null {
  const clean = decodeHtml(raw.trim())
  if (!clean || clean.startsWith('data:') || clean.startsWith('#')) return null
  try {
    const url = new URL(clean, base)
    if (url.pathname.includes('/_next/image')) {
      const inner = url.searchParams.get('url')
      if (inner) return abs(`${url.protocol}//${url.host}`, inner)
    }
    return url.href
  } catch {
    return null
  }
}

function decodificarUrl(url: string): string {
  try {
    return decodeURIComponent(url)
  } catch {
    return url
  }
}

function widthHint(url: string): number {
  const raw = decodificarUrl(url)
  const wix = raw.match(/[?/_]w_(\d+)/i)
  if (wix) return parseInt(wix[1], 10)
  const dim = raw.match(/(\d{3,4})x(\d{3,4})/)
  if (dim) return parseInt(dim[1], 10)
  const wp = raw.match(/-(\d{3,4})x\d{3,4}\./)
  if (wp) return parseInt(wp[1], 10)
  return 0
}

/** Miniatura Wix de una foto real → versión grande. No toca PNG (suelen ser logos). */
function ampliarWix(url: string): string {
  const decoded = decodificarUrl(url)
  if (!/wixstatic\.com\/media\//i.test(decoded)) return url
  const file = decoded.match(/\/media\/([^/]+)/i)?.[1]
  if (!file || /\.png/i.test(file)) return url
  const w = widthHint(decoded)
  if (w && w < 250) return url
  if (w >= 900) return decoded
  return `https://static.wixstatic.com/media/${file}/v1/fill/w_1400,h_933,al_c,q_85,enc_auto/${file}`
}

/** Misma foto de WordPress/Wix en 1024, 1536 y 2048 → una sola clave. */
export function claveFoto(url: string): string {
  try {
    const u = new URL(decodificarUrl(url))
    if (u.host.includes('wixstatic') || u.host.includes('cdn-website.com')) {
      const media = u.pathname.match(/\/media\/([^/]+)/i)
      if (media) return `wix:${media[1].toLowerCase()}`
    }
    const p = u.pathname
      .replace(/-\d{2,4}x\d{2,4}(?=\.[a-z0-9]+$)/i, '')
      .replace(/\/styles\/[^/]+\/public\//i, '/public/')
      .toLowerCase()
    return `${u.host}${p}`
  } catch {
    return url.split('?')[0].toLowerCase()
  }
}

export function esFotoMapa(url: string): boolean {
  return MAPA_NOMBRE.test(url.toLowerCase()) || MAPA_NOMBRE.test(pathnameFoto(url))
}

export function esFotoDocumentoPorNombre(url: string): boolean {
  const u = url.toLowerCase()
  return DOCUMENTO_NOMBRE.test(u) || DOCUMENTO_NOMBRE.test(pathnameFoto(url))
}

/** Cartel, PDF escaneado o aviso legal: mucho blanco y poco color. */
export async function esDocumentoVisual(buf: Buffer): Promise<boolean> {
  try {
    const { data, info } = await sharp(buf)
      .resize(96, 96, { fit: 'inside' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    let blancos = 0
    const pixeles = info.width * info.height
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      if (r > 228 && g > 228 && b > 228) blancos++
    }
    return blancos / pixeles > 0.52
  } catch {
    return false
  }
}

export function esFotoOficialUsable(url: string): boolean {
  if (!url || isProhibidaParaEnriquecer(url)) return false
  const u = url.toLowerCase()
  if (JUNK.test(u) || FLAGS.test(u) || esFotoMapa(url) || esFotoDocumentoPorNombre(url)) return false
  if (u.includes('.svg') || u.includes('.gif')) return false
  const w = widthHint(url)
  if (w && w < 300) return false
  const cdn =
    u.includes('wixstatic.com') ||
    u.includes('cdn-website.com') ||
    u.includes('wp-content/uploads') ||
    u.includes('/images/') ||
    u.includes('/assets/images/') ||
    u.includes('paraty.es')
  return PHOTO_EXT.test(u) || cdn
}

function pathnameFoto(url: string): string {
  try {
    return decodificarUrl(new URL(url).pathname).toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

/** Nombre de archivo / ruta: foto del recinto (parcelas, recepción, sanitarios). */
export function esFotoRecintoPorNombre(url: string): boolean {
  return RECINTO_NOMBRE.test(pathnameFoto(url))
}

/** Nombre de archivo / ruta: monumento, pueblo, pez, “landscape” de stock. */
export function esFotoEntornoPorNombre(url: string): boolean {
  if (esFotoMapa(url) || esFotoDocumentoPorNombre(url)) return true
  const path = pathnameFoto(url)
  if (esFotoRecintoPorNombre(url)) return false
  return ENTORNO_NOMBRE.test(path)
}

export function esFotoPortadaPorNombre(url: string): boolean {
  if (esFotoMapa(url) || esFotoEntornoPorNombre(url)) return false
  return PORTADA_NOMBRE.test(pathnameFoto(url))
}

function score(foto: FotoOk): number {
  let s = foto.w * foto.h / 80000
  const path = pathnameFoto(foto.url)
  const u = foto.url.toLowerCase()
  if (u.includes('wp-content/uploads')) s += 12
  if (u.includes('wixstatic.com') && u.includes('mv2')) s += 8
  if (esFotoPortadaPorNombre(foto.url)) s += 36
  if (esFotoRecintoPorNombre(foto.url)) s += 24
  else if (LUGAR.test(path)) s += 10
  if (esFotoEntornoPorNombre(foto.url) || esFotoMapa(foto.url)) s -= 40
  if (foto.w >= 1400 && foto.w / Math.max(foto.h, 1) >= 1.35) s += 10
  if (/\.jpe?g(\?|#|$)/i.test(u)) s += 6
  if (/\.png(\?|#|$)/i.test(u)) s -= 6
  if (/concierto|fiesta|menu|carta|wasap|icon/.test(path)) s -= 8
  if (foto.bytes < 50000) s -= 10
  if (foto.w >= 1000 && foto.h >= 600) s += 8
  const ratio = foto.w / foto.h
  if (ratio > 0.85 && ratio < 1.15 && foto.w < 900) s -= 15
  return s
}

export function extraerFotosDeHtml(base: string, html: string): string[] {
  const found = new Set<string>()
  const push = (raw?: string) => {
    if (!raw) return
    const url = abs(base, raw)
    if (url && esFotoOficialUsable(url)) found.add(url)
  }

  const attrRe = /(?:src|data-src|data-lazy-src|data-original|data-bg)=["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = attrRe.exec(html))) push(m[1])

  const srcsetRe = /srcset=["']([^"']+)["']/gi
  while ((m = srcsetRe.exec(html))) {
    for (const part of m[1].split(',')) push(part.trim().split(/\s+/)[0])
  }

  const cssBg = /url\((['"]?)([^'")]+)\1\)/gi
  while ((m = cssBg.exec(html))) {
    if (PHOTO_EXT.test(m[2])) push(m[2])
  }

  const packed = /["'](\/(?:images|uploads|media|wp-content|sites)\/[^"']+\.(?:jpe?g|png|webp))["']/gi
  while ((m = packed.exec(html))) push(m[1])

  const cdn = /https?:\/\/(?:static\.wixstatic\.com|[^"'/\s]+\.cdn-website\.com)\/[^"'\\\s)]+/gi
  while ((m = cdn.exec(html))) push(m[0])

  return [...found]
}

async function fetchHtml(url: string): Promise<{ url: string; html: string } | null> {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })
    if (!resp.ok) return null
    const ctype = resp.headers.get('content-type') || ''
    if (ctype && !/html|xml|text/.test(ctype)) return null
    return { url: resp.url, html: await resp.text() }
  } catch {
    return null
  }
}

async function validarFoto(url: string, referer?: string): Promise<FotoOk | null> {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: referer || `${new URL(url).origin}/`,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })
    if (!resp.ok) return null
    const ctype = resp.headers.get('content-type') || ''
    if (ctype && !/image\/(jpeg|jpg|png|webp|avif)/i.test(ctype)) return null
    const buf = Buffer.from(await resp.arrayBuffer())
    if (buf.length < MIN_BYTES || buf.length > 8_000_000) return null
    let w = widthHint(url)
    let h = 0
    try {
      const meta = await sharp(buf).metadata()
      w = meta.width || w
      h = meta.height || 0
    } catch {
      if (buf.length >= 50000) return { url, w: w || 800, h: h || 500, bytes: buf.length }
      return null
    }
    if (w < MIN_W || (h && h < MIN_H)) return null
    const ratio = w / Math.max(h || w * 0.65, 1)
    const cuadrada = h && w < 800 && h < 800 && ratio > 0.82 && ratio < 1.22
    if (cuadrada && buf.length < 80000) return null
    if (await esDocumentoVisual(buf)) return null
    return { url, w, h: h || Math.round(w * 0.65), bytes: buf.length }
  } catch {
    return null
  }
}

async function validarLote(urls: string[], referer?: string): Promise<FotoOk[]> {
  const unicas = new Map<string, string>()
  for (const url of urls) {
    const key = claveFoto(url)
    const prev = unicas.get(key)
    const mejor = ampliarWix(url)
    if (!prev || widthHint(mejor) > widthHint(prev)) unicas.set(key, mejor)
  }
  const candidatos = [...unicas.entries()]
    .filter(([key, url]) => !(key.startsWith('wix:') && widthHint(url) < 400))
    .sort((a, b) => widthHint(b[1]) - widthHint(a[1]))
    .map(([, url]) => url)
    .slice(0, 30)
  const ok: FotoOk[] = []
  for (let i = 0; i < candidatos.length; i += 5) {
    const chunk = await Promise.all(candidatos.slice(i, i + 5).map((url) => validarFoto(url, referer)))
    for (const foto of chunk) {
      if (foto) ok.push(foto)
    }
  }
  const porClave = new Map<string, FotoOk>()
  for (const foto of ok) {
    const key = claveFoto(foto.url)
    const prev = porClave.get(key)
    if (!prev || foto.w * foto.h > prev.w * prev.h) porClave.set(key, foto)
  }
  return [...porClave.values()].sort((a, b) => score(b) - score(a))
}

function extraUrls(home: string, extraPaths: string[] = []): string[] {
  try {
    const u = new URL(home)
    return [...EXTRA_PATHS, ...extraPaths]
      .filter((p) => !SKIP_PATH.test(p))
      .map((p) => `${u.protocol}//${u.host}${p}`)
  } catch {
    return []
  }
}

async function pareceFotoDelRecinto(url: string): Promise<boolean> {
  if (esFotoRecintoPorNombre(url)) return true
  if (esFotoEntornoPorNombre(url)) return false
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return false
  try {
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey })
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_completion_tokens: 8,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Does this photo show the motorhome/camping FACILITY itself (pitches, reception, sanitary block, laundry, internal roads, parked campers on the site)? Reply only RECINTO or ENTORNO. Towns, monuments, generic beaches, fish, food and portraits are ENTORNO.',
            },
            { type: 'image_url', image_url: { url, detail: 'low' } },
          ],
        },
      ],
    })
    return /RECINTO/i.test(resp.choices[0]?.message?.content || '')
  } catch {
    return false
  }
}

async function quedarseSoloRecinto(fotos: FotoOk[]): Promise<FotoOk[]> {
  const ok: FotoOk[] = []
  for (const foto of fotos) {
    if (esFotoEntornoPorNombre(foto.url)) continue
    if (esFotoRecintoPorNombre(foto.url) || (await pareceFotoDelRecinto(foto.url))) {
      ok.push(foto)
    }
  }
  return ok
}

export async function scrapeFotosWebOficial(
  website: string,
  max = 7,
  opts?: { skipRecintoFilter?: boolean; extraPaths?: string[] }
): Promise<string[]> {
  const home = website.replace(/[?#].*$/, '')
  const urls = new Set<string>()

  const first = await fetchHtml(home)
  if (first && !SKIP_PATH.test(new URL(first.url).pathname)) {
    extraerFotosDeHtml(first.url, first.html).forEach((u) => urls.add(u))
    for (const page of extraUrls(first.url, opts?.extraPaths)) {
      const extra = await fetchHtml(page)
      if (!extra || SKIP_PATH.test(new URL(extra.url).pathname)) continue
      extraerFotosDeHtml(extra.url, extra.html).forEach((u) => urls.add(u))
    }
  }

  const validadas = await validarLote(
    [...urls].filter((u) => !esFotoEntornoPorNombre(u)),
    first?.url || home
  )
  const elegidas = opts?.skipRecintoFilter ? validadas : await quedarseSoloRecinto(validadas)
  return elegidas.slice(0, max).map((f) => f.url)
}
