import OpenAI, { toFile } from 'openai'
import sharp from 'sharp'
import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'areas'
const FOLDER = 'ia'
const MODELS = ['gpt-image-2', 'gpt-image-1', 'dall-e-3'] as const
const EDIT_MODELS = ['gpt-image-2', 'gpt-image-1'] as const

export type AreaImageInput = {
  id?: string
  nombre?: string | null
  ciudad?: string | null
  provincia?: string | null
  pais?: string | null
  tipo_area?: string | null
  latitud?: number | null
  longitud?: number | null
}

function norm(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

const PAISAJE_POR_PROVINCIA: Array<{ keys: string[]; paisaje: string }> = [
  {
    keys: ['soria', 'teruel', 'cuenca', 'guadalajara', 'burgos', 'palencia', 'zamora', 'avila', 'segovia', 'soria provincia'],
    paisaje: 'inland Castilian highland / meseta: ochre-green dry farmland, pine and holm-oak woods, open plateau, cool clear light, no palm trees, no desert, no Mediterranean beach',
  },
  {
    keys: ['valladolid', 'leon', 'salamanca', 'ciudad real', 'albacete', 'toledo'],
    paisaje: 'inland Iberian plateau: cereal fields, holm oaks, pale earth, wide sky, continental climate, no palms, no arid Almeria desert',
  },
  {
    keys: ['almeria', 'almería'],
    paisaje: 'semi-arid southeast Spain: pale dry earth, sparse shrubs, ramblas, harsh light, low ochre hills — not a lush green plateau',
  },
  {
    keys: ['murcia', 'alicante', 'alacant'],
    paisaje: 'dry Mediterranean southeast: pale soil, low maquis, olive and carob, strong sun; only include sea if the place is actually coastal',
  },
  {
    keys: ['a coruna', 'a coruña', 'coruna', 'lugo', 'pontevedra', 'ourense', 'orense', 'asturias', 'cantabria', 'bizkaia', 'vizcaya', 'gipuzkoa', 'guipuzcoa', 'alava', 'araba'],
    paisaje: 'green Atlantic north of Spain: lush meadows, oak or eucalyptus, misty cool light, stone and humidity — never desert or Andalusian clichés',
  },
  {
    keys: ['huesca', 'lleida', 'lerida', 'andorra'],
    paisaje: 'Pyrenean / pre-Pyrenean landscape: mountains, conifers or high pasture, cooler light, possible snow on distant peaks',
  },
  {
    keys: ['navarra', 'nafarroa'],
    paisaje: 'Navarre: green hills or continental fields depending on the spot, Atlantic-influenced north or dry south — follow the satellite, no tropical look',
  },
  {
    keys: ['barcelona', 'girona', 'gerona', 'tarragona', 'castellon', 'castello', 'valencia', 'illes balears', 'baleares', 'mallorca', 'menorca', 'ibiza'],
    paisaje: 'western Mediterranean: pines, maquis, pale rock; sea only if the satellite shows coast — not Andalusian desert',
  },
  {
    keys: ['malaga', 'málaga', 'cadiz', 'cádiz', 'huelva', 'granada', 'sevilla', 'cordoba', 'córdoba', 'jaen', 'jaén'],
    paisaje: 'Andalusia: olive groves, dry hills or sierra; include desert or palms ONLY if the satellite really shows them (Almeria-like), otherwise green-ochre farmland',
  },
  {
    keys: ['caceres', 'cáceres', 'badajoz'],
    paisaje: 'Extremadura dehesa: holm oaks scattered on pasture, warm dry light, cork and livestock landscape',
  },
  {
    keys: ['las palmas', 'santa cruz de tenerife', 'tenerife', 'gran canaria', 'lanzarote', 'fuerteventura'],
    paisaje: 'Canary Islands: volcanic rock, laurel forest or dry lava slopes according to the satellite — not mainland meseta',
  },
]

function paisajeDeUbicacion(area: AreaImageInput): string {
  const provincia = area.provincia ? norm(area.provincia) : ''
  const ciudad = area.ciudad ? norm(area.ciudad) : ''
  const pais = area.pais ? norm(area.pais) : ''
  const lat = Number(area.latitud)
  const lng = Number(area.longitud)

  for (const grupo of PAISAJE_POR_PROVINCIA) {
    if (grupo.keys.some((k) => provincia === k || provincia.includes(k) || ciudad === k)) {
      return grupo.paisaje
    }
  }

  if (pais.includes('espana') || pais.includes('spain')) {
    if (Number.isFinite(lat) && lat >= 42.3) {
      return 'green northern Spain: humid Atlantic vegetation, cool light, no desert and no palm-lined Almeria look'
    }
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat <= 37.6 && lng >= -3.2 && lng <= 0.4) {
      return 'dry southeast Spain: pale earth and sparse scrub, strong sun'
    }
    return 'inland or regional Spain matching the real coordinates — not a generic Andalusian postcard'
  }

  if (Number.isFinite(lat)) {
    if (lat >= 50) return 'cool northern European landscape: green fields or forest, soft light'
    if (lat >= 45) return 'temperate European landscape: mixed woodland and farmland'
    if (lat >= 41) return 'southern-temperate European landscape; follow the satellite, do not invent a desert'
    if (lat >= 35) return 'Mediterranean or Maghreb latitude: maquis or dry hills only if the satellite shows them'
    if (lat >= 20) return 'warm / subtropical landscape matching the satellite reference'
    if (lat <= -20) return 'southern-hemisphere landscape matching the satellite reference'
  }

  return `real local landscape of ${[area.ciudad, area.provincia, area.pais].filter(Boolean).join(', ') || 'the given coordinates'}`
}

function tipoAreaTexto(tipo?: string | null) {
  if (tipo === 'camping') return 'campsite with motorhome pitches'
  if (tipo === 'privada') return 'private motorhome aire'
  return 'aire de service / motorhome rest area'
}

function hashArea(area: AreaImageInput) {
  return `${area.id || ''}-${area.nombre || ''}`
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0)
}

function indiceComposicion(area: AreaImageInput) {
  return hashArea(area) % 5
}

function tipoVehiculo(area: AreaImageInput) {
  // Variación determinista: un mismo área conserva su tipo al regenerarse,
  // pero el conjunto de imágenes no acaba lleno de la misma perfilada blanca.
  const variantes = [
    'white coachbuilt low-profile motorhome',
    'white integrated A-class motorhome with a full-width cab',
    'white camper van conversion',
  ]
  return variantes[hashArea(area) % variantes.length]
}

function composicionArea(area: AreaImageInput) {
  const variantes = [
    'GROUND-LEVEL OVERVIEW: show the whole facility from its internal access road, with 3 to 6 occupied pitches and a natural mix of coachbuilt motorhomes, integrated motorhomes and camper vans. Make the grid of pitches, internal road and service points easy to understand.',
    'OBLIQUE AERIAL / DRONE OVERVIEW: MANDATORY camera position 20–40 metres above the facility, at a 35-degree oblique angle. This must visibly be a drone view: the complete organised layout, several marked pitches, internal access lanes and service point occupy the image; 4 to 10 small motorhomes/campers are seen from above. Never return a ground-level view, map or satellite screenshot.',
    'FACILITY-FOCUSED SCENE: prioritise the maintained designated bays, hookups, water/waste service point, entrance or sanitary/reception building as the main subject. If vehicles appear, show at most two and keep them secondary to the facility.',
    `SINGLE-PITCH DETAIL: show one ${tipoVehiculo(area)} inside a maintained designated pitch, but include neighbouring empty pitches and visible shared service infrastructure so the whole place still unmistakably reads as an area.`,
    'LIVELY AREA SCENE: show two or three varied motorhomes/camper vans in separate marked pitches, with a visible service bollard, waste point or small facility building. The scene must show an organised place, not an isolated vehicle.',
  ]
  return variantes[indiceComposicion(area)]
}

function esVistaAerea(area: AreaImageInput) {
  return indiceComposicion(area) === 1
}

export function buildAreaImagePrompt(area: AreaImageInput, tieneMapa = false): string {
  const lugar = [area.ciudad, area.provincia, area.pais].filter(Boolean).join(', ') || 'Europa'
  const tipo = tipoAreaTexto(area.tipo_area)
  const composicion = composicionArea(area)
  const coords = Number.isFinite(Number(area.latitud)) && Number.isFinite(Number(area.longitud))
    ? `${Number(area.latitud).toFixed(5)}, ${Number(area.longitud).toFixed(5)}`
    : null
  const paisaje = paisajeDeUbicacion(area)
  const nombre = (area.nombre || '').trim()

  if (esVistaAerea(area)) {
    return [
      'MANDATORY CAMERA ANGLE: high oblique drone photograph, camera 35 metres above ground and looking down at 35 degrees. This is NOT a ground-level photo. Vehicles must be visibly small because the camera is high above them.',
      `Show ${nombre || 'a motorhome area'} in ${lugar}${coords ? ` at coordinates ${coords}` : ''}: a clearly organised ${tipo}.`,
      `Real regional landscape: ${paisaje}.`,
      'The facility must fill most of the frame: show the complete pitch layout, several marked bays, internal access lanes, service/utility point and 4 to 10 small varied motorhomes or camper vans. No logos, names, readable text or licence plates.',
      'Photorealistic aerial drone image, original and unbranded. Do NOT render a map, satellite screenshot, street-level photograph, close vehicle portrait or isolated camper in nature.',
    ].join(' ')
  }

  return [
    tieneMapa
      ? 'The attached image is a satellite screenshot of the EXACT real location of this motorhome area. Use it as geographic ground truth.'
      : `Generate a scene that belongs specifically to ${lugar}${coords ? ` (${coords})` : ''}.`,
    `Place: ${nombre || 'motorhome area'} — ${lugar}${coords ? ` — coordinates ${coords}` : ''}.`,
    `Real landscape to match: ${paisaje}.`,
    `Original cinematic photograph-style illustration of a peaceful, clearly identifiable ${tipo} standing in THIS same place, as if someone looked at that map and then photographed the spot. Do NOT return a map, satellite view or screenshot; return a photographic scene from the requested perspective.`,
    'Match the real terrain: same ground color, vegetation density, tree or shrub types, relief (flat / hills / mountains), climate and light. It does not need to be the literal parking lot, but it MUST look like that region.',
    'AREA INFRASTRUCTURE IS MANDATORY AND MUST BE PROMINENT: show a maintained, clearly designated camper pitch or parking bay, with compacted gravel/asphalt/paving, defined edges or painted bay markings, and at least one visible area element such as a power hookup pedestal, water tap, waste-service point, small reception/sanitary building, service bollard, or a simple entrance sign with NO readable text. The image must immediately read as an organised motorhome area, camping or parking facility — never as wild camping, an isolated desert stop, a remote dirt track, a wilderness landscape, or a van parked in nature.',
    'All vehicles, when present, must have no logos, no brand names, no license plates and no readable text. Do not add people as the focal point.',
    'VEHICLE ACCESS (when a vehicle is present, mandatory and realistic): it must look like it drove in. A continuous dirt or gravel track must run from the foreground into the pitch, wide enough for a long van, with visible wheel-worn ground. If there are rocks, timber or curbs, they may only line the SIDES of that track — never close in front of the vehicle, never form a sealed rectangle, never block the wheels. No logs, fences, ditches, cacti or posts in the driving path. Wheels sit naturally on the ground, not floating or spawned inside a pad.',
    'STRICTLY FORBIDDEN unless clearly visible in the satellite/map reference: palm trees, Andalusian white villages, Tabernas/Almeria desert, tropical beach, generic Mediterranean postcard, alpine snow.',
    'Late afternoon, natural light, no people faces, no watermarks, no signage with letters.',
    'This must be an original generated scene, not a copy of any stock photo, magazine cover or real campsite photograph.',
    `FINAL, NON-NEGOTIABLE COMPOSITION REQUIREMENT: ${composicion}`,
  ].join(' ')
}

async function fetchLocationMapSnapshot(lat: number, lng: number): Promise<Buffer | null> {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY
  const urls: string[] = []

  if (googleKey) {
    urls.push(
      `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=640x640&scale=2&maptype=satellite&key=${googleKey}`
    )
  }
  if (maptilerKey) {
    urls.push(
      `https://api.maptiler.com/maps/satellite/static/${lng},${lat},14/640x640.jpg?key=${maptilerKey}`
    )
  }

  for (const url of urls) {
    try {
      const resp = await fetch(url)
      if (!resp.ok) continue
      const contentType = resp.headers.get('content-type') || ''
      if (contentType.includes('json') || contentType.includes('text')) continue
      const arr = await resp.arrayBuffer()
      if (arr.byteLength < 4000) continue
      return Buffer.from(arr)
    } catch {
      continue
    }
  }
  return null
}

export async function alojarFotoOficial(
  supabase: SupabaseClient,
  areaId: string,
  url: string,
  index = 0
): Promise<string | null> {
  if (!url) return null
  if (/^https:\/\//i.test(url)) return url

  const httpsUrl = url.replace(/^http:\/\//i, 'https://')
  try {
    const probe = await fetch(httpsUrl, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) })
    const ctype = probe.headers.get('content-type') || ''
    if (probe.ok && /image\//i.test(ctype)) return httpsUrl
  } catch {
    /* el recinto solo sirve HTTP */
  }

  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MapaFurgocasa/1.0)', Accept: 'image/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  })
  if (!resp.ok) return null
  const raw = Buffer.from(await resp.arrayBuffer())
  if (raw.length < 4000) return null
  const jpeg = await sharp(raw).jpeg({ quality: 86 }).toBuffer()
  await ensureAreasBucket(supabase)
  const path = `oficial/${areaId}-${index}-${Date.now()}.jpg`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, jpeg, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
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

function extractImageBytes(item: { b64_json?: string | null; url?: string | null } | undefined) {
  if (!item) throw new Error('OpenAI no devolvió imagen')
  if (item.b64_json) {
    return { bytes: Buffer.from(item.b64_json, 'base64'), contentType: 'image/jpeg' }
  }
  return null
}

async function downloadImageUrl(url: string) {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`No se pudo descargar la imagen (${resp.status})`)
  const arr = await resp.arrayBuffer()
  return { bytes: Buffer.from(arr), contentType: resp.headers.get('content-type') || 'image/png' }
}

async function generateBytes(
  prompt: string,
  referenciaMapa?: Buffer | null
): Promise<{ bytes: Buffer; contentType: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  let lastError: Error | null = null

  if (referenciaMapa) {
    const image = await toFile(referenciaMapa, 'ubicacion-satelite.jpg', { type: 'image/jpeg' })
    for (const model of EDIT_MODELS) {
      try {
        const result = await openai.images.edit({
          model,
          image,
          prompt,
          n: 1,
          size: '1536x1024',
          quality: 'medium',
        } as any)
        const item = result.data?.[0]
        const fromB64 = extractImageBytes(item)
        if (fromB64) return fromB64
        if (item?.url) return downloadImageUrl(item.url)
        throw new Error('La respuesta de OpenAI no traía b64 ni URL')
      } catch (e: any) {
        lastError = e
        const msg = String(e?.message || e)
        if (/unknown|not found|not exist|invalid model|does not have access/i.test(msg)) {
          continue
        }
        break
      }
    }
  }

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
      const fromB64 = extractImageBytes(item)
      if (fromB64) return fromB64
      if (item?.url) return downloadImageUrl(item.url)
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
  area: AreaImageInput & {
    id: string
    foto_principal?: string | null
    fotos_urls?: string[] | null
  }
): Promise<{ publicUrl: string; foto_principal: string; fotos_urls: string[] }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no configurada')
  }

  await ensureAreasBucket(supabase)
  const lat = Number(area.latitud)
  const lng = Number(area.longitud)
  // Para la toma aérea el modelo sigue mejor la instrucción de cámara sin
  // recibir una captura satélite que tienda a convertir en plano horizontal.
  const mapa = !esVistaAerea(area) && Number.isFinite(lat) && Number.isFinite(lng)
    ? await fetchLocationMapSnapshot(lat, lng)
    : null
  const generated = await generateBytes(buildAreaImagePrompt(area, !!mapa), mapa)
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
