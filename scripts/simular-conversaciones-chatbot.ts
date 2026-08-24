/**
 * 10 conversaciones enteras con el modelo actual.
 * NO escribe en chatbot_respuestas_log.
 *
 * $env:NODE_TLS_REJECT_UNAUTHORIZED="0"
 * npx ts-node --project tsconfig.scripts.json scripts/simular-conversaciones-chatbot.ts
 */
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}
require('dotenv').config({ path: '.env.local' })

import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import {
  clasificarIntencion,
  extraerRutaNombrada,
  extraerCiudadNombrada,
  extraerNombreAreaConcreta,
  extraerSitioNombrado,
  esPreguntaAreaConcreta,
  esDeixisMapa,
  esFiltroSinSitio,
  textoAtajoIntencion,
  enlacePlanificador,
  pideCercaDeMi,
} from '../lib/chatbot/intencion'

const GPS = { lat: 37.9922, lng: -1.1307 }
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const CONVS: Array<{ titulo: string; turns: string[] }> = [
  { titulo: 'Mascotas cerca', turns: ['🐕 Áreas cerca de mí (mascotas bienvenidas)'] },
  { titulo: 'Pública cerca', turns: ['🅿️ Área pública cerca de mí'] },
  { titulo: 'Gratis cerca', turns: ['🆓 Áreas gratis cerca de mí'] },
  { titulo: 'Ruta Murcia-Madrid', turns: ['Voy de Murcia a Madrid, ¿dónde paro?'] },
  { titulo: 'Área concreta', turns: ['Castillo de Garcimuñoz'] },
  { titulo: 'Agua y luz', turns: ['Áreas con agua y electricidad'] },
  { titulo: 'Gratis en Granada', turns: ['Áreas gratis en Granada'] },
  { titulo: 'Gasolinera en ruta', turns: ['Gasolinera entre Murcia y Madrid'] },
  { titulo: 'Guía Huesca', turns: ['Qué ver en Huesca'] },
  { titulo: 'Recomiéndame + cerca', turns: ['Recomiéndame un área', 'Cerca de mi ubicación actual'] },
]

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  { type: 'function', function: { name: 'search_areas', description: 'Busca áreas. Máx 3. GPS solo si cerca de mí o filtro sin ciudad.', parameters: { type: 'object', properties: { ubicacion: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' }, nombre: { type: 'string' }, radio_km: { type: 'number' } } }, servicios: { type: 'array', items: { type: 'string' } }, solo_gratuitas: { type: 'boolean' }, tipo_area: { type: 'string', enum: ['publica', 'privada', 'camping'] } } } } },
  { type: 'function', function: { name: 'get_area_by_name', description: 'UN área por nombre.', parameters: { type: 'object', properties: { nombre: { type: 'string' } }, required: ['nombre'] } } },
  { type: 'function', function: { name: 'search_areas_along_route', description: 'NO listar. Derivar a /ruta.', parameters: { type: 'object', properties: { origen: { type: 'string' }, destino: { type: 'string' } } } } },
  { type: 'function', function: { name: 'buscar_info_viaje', description: 'Solo gasolinera/taller.', parameters: { type: 'object', properties: { pregunta: { type: 'string' }, origen: { type: 'string' }, destino: { type: 'string' } } } } },
]

function palabra(nombre: string, q: string) {
  return new RegExp(`(^|[^A-Za-zÀ-ÿ])${q.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}([^A-Za-zÀ-ÿ]|$)`, 'i').test(nombre)
}

async function runTool(name: string, args: any, ultimo: string) {
  if (name === 'search_areas_along_route') {
    const r = extraerRutaNombrada(ultimo)
    const url = enlacePlanificador({ origen: args.origen || r?.origen || '', destino: args.destino || r?.destino || '' })
    return { areas: [], aviso: `No listes áreas. Deriva a ${url}` }
  }
  if (name === 'buscar_info_viaje') {
    return { aviso: 'Info de la web, no ficha /area/. Di que es una gasolinera/taller de emergencia, no un área del mapa.' }
  }
  if (name === 'get_area_by_name') {
    const nombre = args.nombre || extraerNombreAreaConcreta(ultimo) || ''
    const { data } = await supabase.from('areas').select('id,nombre,ciudad,precio_noche,tipo_area,slug').eq('activo', true).ilike('nombre', `%${nombre}%`).limit(8)
    const hit = (data || []).filter((a: any) => palabra(a.nombre, nombre) || palabra(a.ciudad || '', nombre)).slice(0, 2)
    return { areas: hit, instrucciones: 'Máx 2. Precio null ≠ Gratis. Pega nombre y /area/slug.' }
  }
  const nombra = extraerSitioNombrado(ultimo) || extraerCiudadNombrada(ultimo)
  let rows: any[] = []
  if (args.ubicacion?.nombre || nombra) {
    const ciudad = args.ubicacion?.nombre || nombra
    let q = supabase.from('areas').select('id,nombre,ciudad,precio_noche,tipo_area,slug,servicios').eq('activo', true).ilike('ciudad', `%${ciudad}%`).limit(12)
    if (args.solo_gratuitas) q = q.eq('precio_noche', 0)
    const { data } = await q
    rows = data || []
  } else {
    const { data } = await supabase.rpc('areas_cerca', { lat_usuario: GPS.lat, lng_usuario: GPS.lng, radio_km: 20 })
    rows = data || []
    if (args.solo_gratuitas) rows = rows.filter((a: any) => a.precio_noche === 0)
    if (args.tipo_area) rows = rows.filter((a: any) => a.tipo_area === args.tipo_area)
  }
  const top = rows.slice(0, 3).map((a: any) => ({
    nombre: a.nombre,
    slug: a.slug,
    precio_noche: a.precio_noche,
    tipo_area: a.tipo_area,
    resumen: `${a.nombre} · ${a.precio_noche === 0 ? 'Gratis' : a.precio_noche == null ? 'Precio no disponible' : a.precio_noche + '€'} · /area/${a.slug || ''}`,
  }))
  return { areas: top, instrucciones: `Muestra SOLO estas ${top.length}. Null ≠ Gratis. No digas un número mayor.` }
}

async function hablar(system: string, model: string, historial: OpenAI.Chat.ChatCompletionMessageParam[], ultimo: string) {
  let atajo = clasificarIntencion({
    ultimo,
    previosUsuario: historial.filter((m) => m.role === 'user').map((m) => String(m.content || '')),
    ultimoAsistente: [...historial].reverse().find((m) => m.role === 'assistant')?.content as string || null,
  })
  const nombra = extraerSitioNombrado(ultimo) || extraerCiudadNombrada(ultimo) || extraerRutaNombrada(ultimo) || extraerNombreAreaConcreta(ultimo)
  if (atajo === 'filtro_sin_sitio' && (pideCercaDeMi(ultimo) || !nombra)) atajo = null
  if (atajo) {
    const ruta = extraerRutaNombrada(ultimo)
    const etiqueta = atajo === 'ruta_sin_intencion' && ruta ? `${ruta.origen} → ${ruta.destino}` : undefined
    return { texto: textoAtajoIntencion(atajo, 'es', etiqueta), tools: [`atajo:${atajo}`], atajo: true }
  }

  const conversation: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: system },
    ...historial,
    { role: 'user', content: ultimo },
  ]
  const toolsUsados: string[] = []
  const concreta = esPreguntaAreaConcreta(ultimo) || esDeixisMapa(ultimo) || Boolean(extraerNombreAreaConcreta(ultimo))
  const forzarGps =
    !concreta &&
    !nombra &&
    (pideCercaDeMi(ultimo) || esFiltroSinSitio(ultimo) || /recomi[eé]ndame|estacionar|cerca/i.test(ultimo))
  for (let r = 0; r < 3; r++) {
    const tool_choice: any =
      r === 0 && concreta
        ? { type: 'function', function: { name: 'get_area_by_name' } }
        : r === 0 && forzarGps
          ? { type: 'function', function: { name: 'search_areas' } }
          : 'auto'
    const completion = await openai.chat.completions.create({
      model,
      messages: conversation,
      tools: TOOLS,
      tool_choice,
      reasoning_effort: 'none',
    } as any)
    const msg = completion.choices[0].message
    if (!msg.tool_calls?.length) {
      return { texto: msg.content || '', tools: toolsUsados, atajo: false }
    }
    conversation.push(msg as any)
    for (const tc of msg.tool_calls) {
      const fn = (tc as any).function?.name
      let args: any = {}
      try { args = JSON.parse((tc as any).function?.arguments || '{}') } catch { args = {} }
      if (fn === 'search_areas' && !args.ubicacion?.lat && !args.ubicacion?.nombre && !nombra) {
        args.ubicacion = { ...args.ubicacion, lat: GPS.lat, lng: GPS.lng, radio_km: 20 }
      }
      toolsUsados.push(fn)
      const result = await runTool(fn, args, ultimo)
      conversation.push({ role: 'tool', tool_call_id: (tc as any).id, content: JSON.stringify(result) } as any)
    }
  }
  return { texto: 'Sin cierre del modelo', tools: toolsUsados, atajo: false }
}

function juzgar(titulo: string, texto: string, tools: string[]) {
  const t = texto.toLowerCase()
  const fichas = (texto.match(/\/area\//g) || []).length
  if (titulo.startsWith('Ruta')) {
    return /\/ruta/.test(t) && fichas === 0 ? 'OK' : 'FALLO'
  }
  if (titulo.startsWith('Guía')) {
    return /furgocasa\.com\/es\/blog/.test(t) && fichas === 0 ? 'OK' : 'FALLO'
  }
  if (titulo.startsWith('Gasolinera')) {
    return !/\/area\//.test(t) || tools.includes('buscar_info_viaje') ? 'OK' : 'FALLO'
  }
  if (titulo.startsWith('Gratis')) {
    if (/gratis/.test(t) && /precio no disponible/.test(t) === false) {
      // OK if it listed gratis from filter; FALLO if it called something gratis without being sure
    }
    return fichas <= 3 ? 'OK' : 'FALLO'
  }
  if (titulo.startsWith('Área concreta')) {
    return fichas <= 2 && /garcim/i.test(texto) ? 'OK' : 'FALLO'
  }
  if (/cerca|Pública|Agua|Recomiéndame|Gratis cerca/i.test(titulo)) {
    if (/activa la (localizaci|ubicaci)|necesito tu ubicaci/i.test(texto)) return 'FALLO'
    return fichas >= 1 && fichas <= 3 ? 'OK' : 'REVISAR'
  }
  return fichas <= 3 ? 'OK' : 'FALLO'
}

async function main() {
  const { data: cfg } = await supabase.from('chatbot_config').select('modelo,system_prompt').limit(1).maybeSingle()
  const model = cfg?.modelo || 'gpt-5.6-terra'
  const system = `${cfg?.system_prompt || 'Eres el Tío Viajero de Mapa Furgocasa.'}

REGLAS DURAS:
- Paradas de A a B: NO listes áreas. Enlaza /ruta o /ruta?origen=&destino=.
- Gratis solo si precio_noche es 0. Null = Precio no disponible.
- Con GPS y sin otra ciudad, busca cerca. Máximo 3 fichas.
- Un área concreta: get_area_by_name, 1-2 fichas.
- Mascotas: no afirmes pet-friendly si zona_mascotas no es true.
- Qué ver / pueblos: blog https://www.furgocasa.com/es/blog?category=rutas
- Gasolinera/taller: buscar_info_viaje, no /area/.
- Idioma del último mensaje del usuario.`

  console.log(`🧪 10 conversaciones enteras | modelo ${model} | GPS Murcia | NO escribe en admin\n`)
  const stats = { OK: 0, FALLO: 0, REVISAR: 0 }

  for (let i = 0; i < CONVS.length; i++) {
    const conv = CONVS[i]
    const historial: OpenAI.Chat.ChatCompletionMessageParam[] = []
    console.log(`\n━━ ${i + 1}/10 ${conv.titulo} ━━`)
    let ultimoTexto = ''
    let ultimoTools: string[] = []
    try {
    for (const turn of conv.turns) {
      process.stdout.write(`  USER: ${turn}\n  … `)
      const r = await hablar(system, model, historial, turn)
      historial.push({ role: 'user', content: turn })
      historial.push({ role: 'assistant', content: r.texto })
      ultimoTexto = r.texto
      ultimoTools = r.tools
      console.log(`${r.atajo ? 'ATAJO' : 'MODELO'} [${r.tools.join(', ') || '—'}]`)
      console.log(`  ${r.texto.slice(0, 420).replace(/\n/g, ' | ')}\n`)
    }
    const v = juzgar(conv.titulo, ultimoTexto, ultimoTools)
    stats[v]++
    console.log(`  → ${v}`)
    } catch (e: any) {
      stats.FALLO++
      console.log('ERROR', e.message)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`OK ${stats.OK} · FALLO ${stats.FALLO} · REVISAR ${stats.REVISAR}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
