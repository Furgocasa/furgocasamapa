import { isProhibidaParaEnriquecer } from './image-copyright'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const JUNK = /logo|logotipo|favicon|sprite|avatar|whatsapp|wasap|pixel|1x1|flags?\/|redes-sociales|widgetkit\/cache|wifi|kit-digital|free-wifi|signal_|banner-kit|opengraph-image|twitter-image|elementor\/thumbs/i
const FLAGS = /\/(spain|france|germany|italy|united-kingdom|portugal|nederland|belgium)\.png/i
const PHOTO_EXT = /\.(jpe?g|png|webp)(\?|#|$)/i
const EXTRA_PATHS = ['/galeria', '/galeria/', '/fotos', '/fotos/', '/gallery', '/instalaciones', '/el-camping', '/camping']

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

function widthHint(url: string): number {
  const wix = url.match(/[?/_]w_(\d+)/i)
  if (wix) return parseInt(wix[1], 10)
  const dim = url.match(/(\d{3,4})x(\d{3,4})/)
  if (dim) return parseInt(dim[1], 10)
  const wp = url.match(/-(\d{3,4})x\d{3,4}\./)
  if (wp) return parseInt(wp[1], 10)
  return 0
}

export function esFotoOficialUsable(url: string): boolean {
  if (!url || isProhibidaParaEnriquecer(url)) return false
  const u = url.toLowerCase()
  if (JUNK.test(u) || FLAGS.test(u)) return false
  if (u.includes('.svg') || u.includes('.gif')) return false
  const w = widthHint(url)
  if (w && w < 300) return false
  const cdn =
    u.includes('wixstatic.com') ||
    u.includes('cdn-website.com') ||
    u.includes('wp-content/uploads') ||
    u.includes('/images/') ||
    u.includes('/assets/images/')
  return PHOTO_EXT.test(u) || cdn
}

function score(url: string): number {
  let s = 10
  const u = url.toLowerCase()
  if (u.includes('wp-content/uploads')) s += 12
  if (u.includes('wixstatic.com') && u.includes('mv2')) s += 8
  if (/parcela|piscina|bungalow|playa|camping|instalacion|caravana/.test(u)) s += 8
  if (/\.png(\?|#|$)/i.test(u) && !/parcela|piscina|camping|instalacion/.test(u)) s -= 8
  if (/\.jpe?g(\?|#|$)/i.test(u)) s += 4
  if (u.includes('logotipo') || u.includes('flag')) s -= 20
  const w = widthHint(url)
  if (w >= 800) s += 6
  else if (w >= 400) s += 3
  return s
}

export function extraerFotosDeHtml(base: string, html: string): string[] {
  const found = new Set<string>()
  const push = (raw?: string) => {
    if (!raw) return
    const url = abs(base, raw)
    if (url && esFotoOficialUsable(url)) found.add(url)
  }

  const metaRe = /<(?:meta|link)[^>]+(?:og:image|twitter:image)[^>]*>/gi
  let m: RegExpExecArray | null
  while ((m = metaRe.exec(html))) {
    const content = m[0].match(/(?:content|href)=["']([^"']+)["']/i)
    push(content?.[1])
  }

  const attrRe = /(?:src|data-src|data-lazy-src|data-original|data-bg)=["']([^"']+)["']/gi
  while ((m = attrRe.exec(html))) push(m[1])

  const srcsetRe = /srcset=["']([^"']+)["']/gi
  while ((m = srcsetRe.exec(html))) {
    for (const part of m[1].split(',')) push(part.trim().split(/\s+/)[0])
  }

  const cssBg = /url\((['"]?)([^'")]+)\1\)/gi
  while ((m = cssBg.exec(html))) {
    if (PHOTO_EXT.test(m[2])) push(m[2])
  }

  const packed = /["'](\/(?:images|uploads|media|wp-content)\/[^"']+\.(?:jpe?g|png|webp))["']/gi
  while ((m = packed.exec(html))) push(m[1])

  return [...found].sort((a, b) => score(b) - score(a))
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

function extraUrls(home: string): string[] {
  try {
    const u = new URL(home)
    return EXTRA_PATHS.map((p) => `${u.protocol}//${u.host}${p}`)
  } catch {
    return []
  }
}

export async function scrapeFotosWebOficial(website: string, max = 7): Promise<string[]> {
  const home = website.replace(/[?#].*$/, '')
  const seen = new Set<string>()
  const out: string[] = []

  const pages = [home]
  const first = await fetchHtml(home)
  if (first) {
    for (const url of extraerFotosDeHtml(first.url, first.html)) {
      if (seen.has(url)) continue
      seen.add(url)
      out.push(url)
    }
    if (out.length < 3) pages.push(...extraUrls(first.url))
  }

  for (const page of pages.slice(1)) {
    if (out.length >= max) break
    const extra = await fetchHtml(page)
    if (!extra) continue
    for (const url of extraerFotosDeHtml(extra.url, extra.html)) {
      if (seen.has(url)) continue
      seen.add(url)
      out.push(url)
      if (out.length >= max) break
    }
  }

  return out.slice(0, max)
}
