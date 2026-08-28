import { createHash, randomBytes } from 'crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const GUEST_QUESTION_LIMIT = 2
export const GUEST_COOKIE = 'fc_guest'

let redis: Redis | null = null
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } catch {
    redis = null
  }
}

export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

export function huellaDeIp(ip: string): string {
  const salt = process.env.CHATBOT_GUEST_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'mapa-fc'
  return createHash('sha256').update(`${salt}|${ip}`).digest('hex').slice(0, 16)
}

function huellaDeToken(token: string, tag: string): string {
  const salt = process.env.CHATBOT_GUEST_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'mapa-fc'
  return createHash('sha256').update(`${salt}|${tag}|${token}`).digest('hex').slice(0, 16)
}

const TOKEN_RE = /^[a-f0-9-]{16,64}$/i

export function leerOCrearGuestCookie(req: NextRequest): string {
  const raw = req.cookies.get(GUEST_COOKIE)?.value || ''
  if (TOKEN_RE.test(raw)) return raw
  return randomBytes(16).toString('hex')
}

export function ponerGuestCookie(res: NextResponse, id: string): NextResponse {
  res.cookies.set(GUEST_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  })
  return res
}

export function huellaDeLog(log: { ip_hash?: string | null; funciones?: Array<{ name?: string; args?: any }> | null }): string | null {
  if (log.ip_hash) return String(log.ip_hash)
  const meta = (log.funciones || []).find((f) => f?.name === '_cliente')?.args
  return meta?.huella ? String(meta.huella) : null
}

export type GuestQuota = {
  allowed: boolean
  used: number
  limit: number
  remaining: number
  huella: string
}

export type GuestConsumeInput = {
  ipHuella: string
  cookieId?: string | null
  clientKey?: string | null
  conversacionId?: string | null
}

function toQuota(used: number, huella: string): GuestQuota {
  const clipped = Math.max(0, used)
  return {
    allowed: clipped <= GUEST_QUESTION_LIMIT,
    used: Math.min(clipped, GUEST_QUESTION_LIMIT + 1),
    limit: GUEST_QUESTION_LIMIT,
    remaining: Math.max(0, GUEST_QUESTION_LIMIT - clipped),
    huella,
  }
}

function identidadesDe(input: GuestConsumeInput): { primary: string; huellas: string[] } {
  const huellas: string[] = []
  if (input.cookieId && TOKEN_RE.test(input.cookieId)) {
    huellas.push(huellaDeToken(input.cookieId, 'ck'))
  }
  if (input.clientKey && TOKEN_RE.test(input.clientKey)) {
    huellas.push(huellaDeToken(input.clientKey, 'gk'))
  }
  if (input.ipHuella) huellas.push(input.ipHuella)
  const uniq = [...new Set(huellas.filter(Boolean))]
  return { primary: uniq[0] || input.ipHuella || 'unknown', huellas: uniq.length ? uniq : ['unknown'] }
}

async function peekRedis(huella: string): Promise<number | null> {
  if (!redis) return null
  try {
    const raw = await redis.get<number | string>(`chatbot:guest:${huella}`)
    if (raw == null) return 0
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  } catch {
    return null
  }
}

async function incrRedis(huella: string): Promise<number | null> {
  if (!redis) return null
  try {
    const used = Number(await redis.incr(`chatbot:guest:${huella}`))
    if (used === 1) {
      await redis.expire(`chatbot:guest:${huella}`, 60 * 60 * 24 * 90)
    }
    return used
  } catch {
    return null
  }
}

async function peekAnalytics(supabase: any, huella: string): Promise<number | null> {
  const { count, error } = await supabase
    .from('chatbot_analytics')
    .select('id', { count: 'exact', head: true })
    .eq('evento', 'guest_pregunta')
    .contains('detalles', { huella })
  if (error) return null
  return count || 0
}

async function peekHuella(supabase: any, huella: string): Promise<number> {
  const fromRedis = await peekRedis(huella)
  if (fromRedis != null) return fromRedis
  return (await peekAnalytics(supabase, huella)) || 0
}

async function countConvAnonimas(supabase: any, conversacionId?: string | null): Promise<number> {
  if (!conversacionId) return 0
  const { count, error } = await supabase
    .from('chatbot_respuestas_log')
    .select('id', { count: 'exact', head: true })
    .eq('conversacion_id', conversacionId)
    .is('user_id', null)
  if (error) return 0
  return count || 0
}

/**
 * Reserva un hueco de pregunta para un anónimo.
 * Cuenta cookie + clave del navegador + IP + hilo: si cualquiera
 * ya gastó el cupo, no llama a OpenAI. Así un cambio de IP (4G/WiFi)
 * no regala una tercera pregunta en el mismo móvil.
 */
export async function consumeGuestQuestion(
  supabase: any,
  input: GuestConsumeInput | string
): Promise<GuestQuota> {
  const ident = typeof input === 'string'
    ? identidadesDe({ ipHuella: input })
    : identidadesDe(input)
  const conversacionId = typeof input === 'string' ? null : input.conversacionId

  const convUsed = await countConvAnonimas(supabase, conversacionId)
  const peeked = await Promise.all(ident.huellas.map((h) => peekHuella(supabase, h)))
  const already = Math.max(convUsed, ...peeked, 0)
  if (already >= GUEST_QUESTION_LIMIT) {
    return toQuota(already + 1, ident.primary)
  }

  const afterIncr = await Promise.all(
    ident.huellas.map(async (h) => {
      const n = await incrRedis(h)
      return n == null ? (await peekAnalytics(supabase, h) || 0) + 1 : n
    })
  )
  const used = Math.max(...afterIncr, convUsed + 1, 1)

  await supabase.from('chatbot_analytics').insert({
    evento: 'guest_pregunta',
    categoria: 'cuota',
    detalles: { huella: ident.primary, huellas: ident.huellas },
  })

  return toQuota(used, ident.primary)
}
