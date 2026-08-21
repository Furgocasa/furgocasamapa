import OpenAI from 'openai'
import sharp from 'sharp'
import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'areas'
const FOLDER = 'ia'
const MODELS = ['gpt-image-2', 'gpt-image-1', 'dall-e-3'] as const

export function buildAreaImagePrompt(area: {
  nombre?: string | null
  ciudad?: string | null
  provincia?: string | null
  pais?: string | null
  tipo_area?: string | null
}): string {
  const lugar = [area.ciudad, area.provincia, area.pais].filter(Boolean).join(', ') || 'Europa'
  const tipo = area.tipo_area === 'camping'
    ? 'campsite with motorhome pitches'
    : area.tipo_area === 'parking'
      ? 'overnight motorhome parking area'
      : 'aire de service / motorhome rest area'

  return [
    `Original cinematic photograph-style illustration of a peaceful ${tipo} near ${lugar}.`,
    'A single generic white camper van with no logos, no brand names, no license plates and no readable text, parked on a tidy gravel pitch.',
    `Landscape, light and vegetation typical of ${lugar}. Late afternoon, natural light, no people faces, no watermarks, no signage with letters.`,
    'This must be an original generated scene, not a copy or imitation of any existing stock photo, magazine cover or real campsite photograph.',
  ].join(' ')
}

async function ensureAreasBucket(supabase: SupabaseClient) {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw error
  const exists = (buckets || []).some((b) => b.id === BUCKET || b.name === BUCKET)
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 6 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
    if (createError && !/already exists/i.test(createError.message || '')) {
      throw createError
    }
  }
}

async function generateBytes(prompt: string): Promise<{ bytes: Buffer; contentType: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  let lastError: Error | null = null

  for (const model of MODELS) {
    try {
      const result = await openai.images.generate({
        model,
        prompt,
        n: 1,
        size: model === 'dall-e-3' ? '1792x1024' : '1536x1024',
        quality: model === 'dall-e-3' ? 'standard' : 'medium',
        ...(model === 'dall-e-3' ? {} : { output_format: 'jpeg' as const }),
      } as any)

      const item = result.data?.[0]
      if (!item) throw new Error('OpenAI no devolvió imagen')

      if (item.b64_json) {
        return { bytes: Buffer.from(item.b64_json, 'base64'), contentType: 'image/jpeg' }
      }
      if (item.url) {
        const resp = await fetch(item.url)
        if (!resp.ok) throw new Error(`No se pudo descargar la imagen (${resp.status})`)
        const arr = await resp.arrayBuffer()
        return { bytes: Buffer.from(arr), contentType: resp.headers.get('content-type') || 'image/png' }
      }
      throw new Error('La respuesta de OpenAI no traía b64 ni URL')
    } catch (e: any) {
      lastError = e
      const msg = String(e?.message || e)
      if (/unknown|not found|not exist|invalid model|does not have access/i.test(msg)) {
        continue
      }
      throw e
    }
  }

  throw lastError || new Error('No se pudo generar la imagen con ningún modelo')
}

export async function applyAiWatermark(bytes: Buffer): Promise<Buffer> {
  const image = sharp(bytes)
  const meta = await image.metadata()
  const width = meta.width || 1536
  const height = meta.height || 1024
  const pad = Math.max(16, Math.round(width * 0.018))
  const fontSize = Math.max(20, Math.round(width * 0.024))
  const drop = Math.round(fontSize * 1.15)
  const boxH = Math.round(fontSize * 2.15)
  const boxW = Math.round(drop + 18 + fontSize * 11.2)
  const x = pad
  const y = height - pad - boxH
  const dropX = x + 12
  const dropY = y + Math.round((boxH - drop * 1.15) / 2)
  const textX = dropX + drop + 10
  const textY = y + Math.round(boxH * 0.66)

  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x}" y="${y}" rx="${Math.round(boxH / 2)}" width="${boxW}" height="${boxH}" fill="rgba(11,60,116,0.78)"/>
      <path d="M${dropX + drop / 2} ${dropY}
        C${dropX + drop / 2} ${dropY}, ${dropX} ${dropY + drop * 0.55}, ${dropX} ${dropY + drop * 0.78}
        a${drop / 2} ${drop / 2} 0 0 0 ${drop} 0
        C${dropX + drop} ${dropY + drop * 0.55}, ${dropX + drop / 2} ${dropY}, ${dropX + drop / 2} ${dropY} z"
        fill="#7dd3fc"/>
      <path d="M${dropX + drop * 0.38} ${dropY + drop * 0.72}
        a${drop * 0.16} ${drop * 0.2} 0 0 1 ${drop * 0.12} -${drop * 0.28}"
        fill="rgba(255,255,255,0.55)" stroke="none"/>
      <text x="${textX}" y="${textY}" fill="#ffffff"
        font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}"
        font-weight="700">AI Generated Image</text>
    </svg>
  `)

  return sharp(bytes)
    .composite([{ input: svg, top: 0, left: 0 }])
    .jpeg({ quality: 86 })
    .toBuffer()
}

export async function generateAndStoreAreaImage(
  supabase: SupabaseClient,
  area: {
    id: string
    nombre?: string | null
    ciudad?: string | null
    provincia?: string | null
    pais?: string | null
    tipo_area?: string | null
    foto_principal?: string | null
    fotos_urls?: string[] | null
  }
): Promise<{ publicUrl: string; foto_principal: string; fotos_urls: string[] }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no configurada')
  }

  await ensureAreasBucket(supabase)
  const generated = await generateBytes(buildAreaImagePrompt(area))
  const bytes = await applyAiWatermark(generated.bytes)
  const path = `${FOLDER}/${area.id}-${Date.now()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = data.publicUrl
  const actuales = Array.isArray(area.fotos_urls) ? area.fotos_urls.filter(Boolean) : []
  const fotos_urls = [publicUrl, ...actuales.filter((u) => u !== publicUrl)].slice(0, 7)

  const { error: updateError } = await (supabase as any)
    .from('areas')
    .update({
      foto_principal: publicUrl,
      fotos_urls,
      updated_at: new Date().toISOString(),
    })
    .eq('id', area.id)

  if (updateError) throw updateError

  return { publicUrl, foto_principal: publicUrl, fotos_urls }
}
