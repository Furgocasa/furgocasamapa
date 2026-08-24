import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'

export const GUEST_QUESTION_LIMIT = 2

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

async function countAnalytics(supabase: any, huella: string): Promise<number | null> {
  const { count, error } = await supabase
    .from('chatbot_analytics')
    .select('id', { count: 'exact', head: true })
    .eq('evento', 'guest_pregunta')
    .contains('detalles', { huella })
  if (error) return null
  return count || 0
}

/**
 * Reserva un hueco de pregunta para un anónimo (por IP hasheada).
 * Si ya gastó el cupo, no llama a OpenAI.
 */
export async function consumeGuestQuestion(supabase: any, huella: string): Promise<GuestQuota> {
  if (redis) {
    try {
      const used = Number(await redis.incr(`chatbot:guest:${huella}`))
      if (used === 1) {
        await redis.expire(`chatbot:guest:${huella}`, 60 * 60 * 24 * 90)
      }
      if (used > GUEST_QUESTION_LIMIT) {
        await redis.decr(`chatbot:guest:${huella}`).catch(() => {})
        return toQuota(used, huella)
      }
      await supabase.from('chatbot_analytics').insert({
        evento: 'guest_pregunta',
        categoria: 'cuota',
        detalles: { huella },
      })
      return toQuota(used, huella)
    } catch {
      // caemos al conteo en BD
    }
  }

  const previos = await countAnalytics(supabase, huella)
  if (previos != null && previos >= GUEST_QUESTION_LIMIT) {
    return toQuota(previos + 1, huella)
  }

  await supabase.from('chatbot_analytics').insert({
    evento: 'guest_pregunta',
    categoria: 'cuota',
    detalles: { huella },
  })

  const used = (previos == null ? 0 : previos) + 1
  return toQuota(used, huella)
}
