/**
 * Dry-run del agente actual: 50 preguntas de los temas que fallaban.
 * NO escribe en chatbot_respuestas_log.
 *
 * $env:NODE_TLS_REJECT_UNAUTHORIZED="0"
 * npx ts-node --project tsconfig.scripts.json scripts/simular-preguntas-chatbot.ts
 */
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}
require('dotenv').config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import {
  clasificarIntencion,
  extraerRutaNombrada,
  extraerNombreAreaConcreta,
  extraerSitioNombrado,
  extraerCiudadNombrada,
  esPreguntaAreaConcreta,
  esDeixisMapa,
  pideCercaDeMi,
  textoAtajoIntencion,
  enlacePlanificador,
} from '../lib/chatbot/intencion'

const GPS = { lat: 37.9922, lng: -1.1307 }
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const POOL: Array<{ tema: string; q: string }> = [
  { tema: 'ruta', q: 'Voy de Murcia a Madrid, ¿dónde paro?' },
  { tema: 'ruta', q: 'Driving Madrid to Valencia, where to stop?' },
  { tema: 'ruta', q: '🛣️ Paradas en una ruta' },
  { tema: 'ruta', q: 'De Barcelona a Zaragoza, camping a mitad' },
  { tema: 'ruta', q: 'Pues busco un área pública que tenga vaciado y llenado de aguas en la ruta de Murcia a Granada' },
  { tema: 'ruta', q: 'Voy de aquí a Valencia' },
  { tema: 'ruta', q: 'Stops along a route' },
  { tema: 'ruta', q: 'Pernoctar a mitad de ruta' },
  { tema: 'ruta', q: 'From Porto to Lisbon where to stop' },
  { tema: 'ruta', q: 'Voy de Sevilla a Málaga' },
  { tema: 'ruta', q: 'Dónde paro entre León y Oviedo' },
  { tema: 'ruta', q: 'Etapas de itinerario de Madrid a Cádiz' },
  { tema: 'gratis', q: '🆓 Áreas gratis cerca de mí' },
  { tema: 'gratis', q: 'Free areas near me' },
  { tema: 'gratis', q: 'Hay alguna gratis' },
  { tema: 'gratis', q: 'Áreas gratis en Granada' },
  { tema: 'gratis', q: 'Solo las de 0 euros cerca' },
  { tema: 'gratis', q: 'Quiero algo gratuito' },
  { tema: 'filtro', q: '💧 Áreas con agua y electricidad cerca de mí' },
  { tema: 'filtro', q: 'Áreas con agua y electricidad' },
  { tema: 'filtro', q: '🅿️ Área pública cerca de mí' },
  { tema: 'filtro', q: 'Dónde estacionar' },
  { tema: 'filtro', q: 'Duchas cerca' },
  { tema: 'filtro', q: 'Camping cerca de mí' },
  { tema: 'filtro', q: 'Área privada cerca' },
  { tema: 'filtro', q: 'Recomiéndame un área' },
  { tema: 'filtro', q: 'Áreas cerca de mí' },
  { tema: 'filtro', q: 'Quiero agua y vaciado' },
  { tema: 'mascotas', q: '🐕 Áreas cerca de mí (mascotas bienvenidas)' },
  { tema: 'mascotas', q: 'Admiten perros cerca' },
  { tema: 'mascotas', q: 'Pet friendly near me' },
  { tema: 'mascotas', q: 'Zona para mascotas' },
  { tema: 'mascotas', q: 'Voy con el perro, dónde duermo cerca' },
  { tema: 'concreta', q: 'Castillo de Garcimuñoz' },
  { tema: 'concreta', q: 'Háblame del área de Ronda' },
  { tema: 'concreta', q: 'Qué pasa con Camper Park Rey Lobo' },
  { tema: 'concreta', q: 'El área de Ajo, Cantabria' },
  { tema: 'concreta', q: 'Ajo, Cantabria' },
  { tema: 'concreta', q: 'parking ciutat caravaning' },
  { tema: 'concreta', q: 'Camping taifa puerto santa maria' },
  { tema: 'gas', q: 'Gasolineras' },
  { tema: 'gas', q: 'Gasolinera entre Murcia y Madrid' },
  { tema: 'gas', q: 'Taller cerca' },
  { tema: 'guia', q: 'Qué ver en Huesca' },
  { tema: 'recepcion', q: 'Están molestando en la parcela de alado' },
  { tema: 'recepcion', q: 'Hay una persona con el coche arrancado' },
  { tema: 'guia', q: 'En Cádiz' },
  { tema: 'guia', q: 'Con quién puedo hablar para hacer camping en la playa' },
  { tema: 'otro', q: 'hola' },
  { tema: 'otro', q: 'Las mejores áreas de España' },
  { tema: 'otro', q: 'So qmplia' },
  { tema: 'otro', q: 'Cercqnas?' },
  { tema: 'otro', q: 'Ya te había dicho que cerca de mi ubicación actual' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function cerca(filtros: { gratis?: boolean; tipo?: string; servicios?: string[] }) {
  const { data, error } = await supabase.rpc('areas_cerca', {
    lat_usuario: GPS.lat,
    lng_usuario: GPS.lng,
    radio_km: 20,
  })
  if (error) throw error
  let rows = (data || []) as any[]
  if (filtros.gratis) rows = rows.filter((a) => a.precio_noche === 0)
  if (filtros.tipo) rows = rows.filter((a) => a.tipo_area === filtros.tipo)
  if (filtros.servicios?.length) {
    rows = rows.filter((a) => filtros.servicios!.every((s) => a.servicios && a.servicios[s] === true))
  }
  return rows.slice(0, 3)
}

async function porNombre(nombre: string) {
  const { data } = await supabase
    .from('areas')
    .select('id,nombre,ciudad,precio_noche,tipo_area')
    .eq('activo', true)
    .ilike('nombre', `%${nombre}%`)
    .limit(2)
  return data || []
}

async function porCiudad(ciudad: string, gratis?: boolean) {
  let q = supabase
    .from('areas')
    .select('id,nombre,ciudad,precio_noche,tipo_area')
    .eq('activo', true)
    .ilike('ciudad', `%${ciudad}%`)
    .limit(8)
  if (gratis) q = q.eq('precio_noche', 0)
  const { data } = await q
  return (data || []).slice(0, 3)
}

async function simular(q: string, tema: string) {
  let atajo = clasificarIntencion({ ultimo: q, previosUsuario: [], ultimoAsistente: null })
  const ruta = extraerRutaNombrada(q)
  const concreta = esPreguntaAreaConcreta(q) || esDeixisMapa(q) || Boolean(extraerNombreAreaConcreta(q))
  const nombraSitio =
    Boolean(extraerSitioNombrado(q)) ||
    Boolean(extraerCiudadNombrada(q)) ||
    Boolean(ruta) ||
    Boolean(extraerNombreAreaConcreta(q))
  const inyectaGps = pideCercaDeMi(q) || !nombraSitio
  // Igual que route.ts: con GPS no preguntamos el dónde
  if (atajo === 'filtro_sin_sitio' && inyectaGps) atajo = null

  if (atajo) {
    const etiqueta = atajo === 'ruta_sin_intencion' && ruta ? `${ruta.origen} → ${ruta.destino}` : undefined
    const texto = textoAtajoIntencion(atajo, 'es', etiqueta)
    const enlace = ruta ? enlacePlanificador(ruta) : '/ruta'
    let veredicto = 'OK'
    let nota = `atajo ${atajo}`
    if (atajo === 'ruta_sin_intencion') {
      veredicto = /\/ruta/.test(texto) ? 'OK' : 'FALLO'
      nota = /\/ruta/.test(texto) ? `deriva a ${enlace}, 0 fichas` : 'ruta sin /ruta'
    }
    if (atajo === 'guia') nota = 'manda al blog, no inventa guía'
    if (atajo === 'gas_sin_sitio') nota = 'pide zona, no busca supermercado'
    if (atajo === 'incidencia_recinto') {
      veredicto = /no somos la recepci[oó]n|mapa furgocasa/i.test(texto) ? 'OK' : 'FALLO'
      nota = 'no se hace pasar por el camping'
    }
    if (atajo === 'filtro_sin_sitio' && inyectaGps) {
      veredicto = 'FALLO'
      nota = 'pregunta dónde con GPS puesto'
    }
    return { q, tema, via: `atajo:${atajo}`, veredicto, nota, preview: texto.slice(0, 140).replace(/\n/g, ' ') }
  }

  if (concreta) {
    const nombre = extraerNombreAreaConcreta(q) || q.replace(/háblame de|qué pasa con|el área de/gi, '').trim()
    const areas = await porNombre(nombre.split(',')[0].trim())
    return {
      q,
      tema,
      via: 'get_area_by_name',
      veredicto: areas.length <= 2 ? 'OK' : 'FALLO',
      nota: `${areas.length} ficha(s): ${areas[0]?.nombre || 'ninguna'}`,
      preview: areas[0] ? `${areas[0].nombre} · ${areas[0].precio_noche ?? 'null'}€` : 'sin coincidencia',
    }
  }

  if (ruta && /(gasolinera|taller|petrol|tankstelle)/i.test(q)) {
    return {
      q,
      tema,
      via: 'buscar_info_viaje',
      veredicto: 'OK',
      nota: 'gas/taller en trayecto: web, no listado de áreas',
      preview: `${ruta.origen} → ${ruta.destino}`,
    }
  }
  if (ruta) {
    return {
      q,
      tema,
      via: 'sin-atajo',
      veredicto: 'FALLO',
      nota: 'ruta que no cayó en atajo: el modelo podría listar áreas',
      preview: `${ruta.origen} → ${ruta.destino}`,
    }
  }

  const gratis = /gratis|gratuit|free|0 euros/i.test(q)
  const publica = /p[uú]blica/i.test(q) && !/privada/.test(q)
  const privada = /privada/i.test(q)
  const camping = /\bcampings?\b/i.test(q)
  const aguaLuz = /agua/.test(q.toLowerCase()) && /electricidad/.test(q.toLowerCase())
  const ciudad = extraerCiudadNombrada(q) || extraerSitioNombrado(q)

  let top: any[] = []
  if (/^(hola|hello|hi|hey|ok|vale)$/i.test(q.trim())) {
    return { q, tema, via: 'saludo', veredicto: 'OK', nota: 'saludo, no dispara áreas', preview: '' }
  }

  if (inyectaGps && !ciudad) {
    top = await cerca({
      gratis,
      tipo: publica ? 'publica' : privada ? 'privada' : camping ? 'camping' : undefined,
      servicios: aguaLuz ? ['agua', 'electricidad'] : undefined,
    })
  } else if (ciudad) {
    top = await porCiudad(ciudad, gratis)
  } else {
    return { q, tema, via: 'modelo', veredicto: 'REVISAR', nota: 'sin sitio ni GPS', preview: '' }
  }

  let veredicto = 'OK'
  let nota = `${top.length} áreas`
  if (gratis && top.some((a) => a.precio_noche !== 0)) {
    veredicto = 'FALLO'
    nota = `gratis mezclado: ${top.map((a) => `${a.nombre}=${a.precio_noche}`).join('; ')}`
  } else if (gratis) {
    nota = top.length ? `${top.length} con precio 0` : '0 gratis en radio (correcto: no inventa)'
  }
  if (publica && top.some((a) => a.tipo_area !== 'publica')) {
    veredicto = 'FALLO'
    nota = 'coló una no pública'
  }
  return {
    q,
    tema,
    via: ciudad ? 'ciudad' : 'GPS',
    veredicto,
    nota,
    preview: top.map((a) => `${a.nombre} (${a.precio_noche ?? 'null'}€ ${a.tipo_area || '?'})`).join(' · '),
  }
}

async function main() {
  const preguntas = shuffle(POOL).slice(0, 50)
  console.log(`🧪 Dry-run agente actual | ${preguntas.length} preguntas | GPS Murcia | NO escribe en admin\n`)
  const stats = { OK: 0, FALLO: 0, REVISAR: 0 }
  const rows: any[] = []
  for (let i = 0; i < preguntas.length; i++) {
    const { tema, q } = preguntas[i]
    process.stdout.write(`[${i + 1}/${preguntas.length}] ${q.slice(0, 52)}… `)
    try {
      const r = await simular(q, tema)
      stats[r.veredicto as keyof typeof stats]++
      rows.push(r)
      console.log(`${r.veredicto} · ${r.via} · ${r.nota}`)
    } catch (e: any) {
      stats.FALLO++
      rows.push({ q, tema, via: 'error', veredicto: 'FALLO', nota: e.message, preview: '' })
      console.log('ERROR', e.message)
    }
  }
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`OK ${stats.OK} · FALLO ${stats.FALLO} · REVISAR ${stats.REVISAR}`)
  const fallos = rows.filter((r) => r.veredicto !== 'OK')
  if (fallos.length) {
    console.log('\nNo OK:')
    for (const f of fallos) {
      console.log(`- [${f.tema}] ${f.q}`)
      console.log(`  ${f.veredicto} · ${f.via} · ${f.nota}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
