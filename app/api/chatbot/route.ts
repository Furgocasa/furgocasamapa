/**
 * API ROUTE: CHATBOT CON FUNCTION CALLING
 * ========================================
 * Endpoint principal del chatbot que:
 * 1. Recibe mensajes del usuario
 * 2. Llama a OpenAI con Function Calling
 * 3. Ejecuta funciones de búsqueda en la BD
 * 4. Retorna respuestas inteligentes
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import {
  searchAreas,
  getAreaDetails,
  getAreasByCountry,
  buscarAreasPorNombre,
  buscarInfoViajeWeb,
  searchTalleres,
  buscarTalleresPorNombre,
  getTallerDetails,
  serializeToolResultForModel,
  esGpsValido,
  sanitizarRespuestaChat,
  componerRespuestaConFichas,
  elegirAreasParaTarjetas,
  resolveChatLocale,
  BusquedaAreasParams,
  AreaResumen
} from '@/lib/chatbot/functions'
import { getCityAndProvinceFromCoords, GeocodeResult, formatLocation } from '@/lib/google/geocoding'

// Rate Limiting
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Cache
import { getCached, CACHE_TTL } from '@/lib/cache/redis'

// Logger
import { logger } from '@/lib/logger'
import { validateOpenAIModel, buildTokensParam, buildReasoningForTools, buildTemperatureParam } from '@/lib/openai/model-validation'
import { createClient as createServerClient } from '@/lib/supabase/server'
import {
  clientIp,
  consumeGuestQuestion,
  huellaDeIp,
  leerOCrearGuestCookie,
  ponerGuestCookie,
  GUEST_QUESTION_LIMIT,
} from '@/lib/chatbot/guest-quota'
import {
  clasificarIntencion,
  extraerSitioNombrado,
  extraerCiudadNombrada,
  extraerRutaNombrada,
  textoAtajoIntencion,
  etiquetaFiltro,
  chipsSeguimiento,
  pideCercaDeMi,
  esDeixisMapa,
  esPreguntaAreaConcreta,
  extraerNombreAreaConcreta,
  esFiltroSinSitio,
  pideSoloGratuitas,
  pideSinCamping,
  topePrecioQueja,
  esAmpliacionBusqueda,
  extraerServiciosPedidos,
  nombreRecintoMencionado,
  pareceIdentificarRecinto,
  pideTaller,
  pareceComposicionGrupo,
  extraerNombreAreaDelHilo,
  asistenteListoAreas,
} from '@/lib/chatbot/intencion'

// ============================================
// CONFIGURACIÓN
// ============================================

// Cliente Supabase (service role para acceso completo)
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    logger.error('Faltan credenciales de Supabase (URL o service role)')
    throw new Error('Configuración de Supabase incompleta en el servidor')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

// Cliente OpenAI (se crea bajo demanda para asegurar que las env vars estén cargadas)
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurada')
  }
  return new OpenAI({ apiKey })
}

// ============================================
// RATE LIMITING
// ============================================

// Inicializar rate limiter (solo si están configuradas las variables)
let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 peticiones por minuto
      analytics: true,
      prefix: "chatbot",
    })
    
    logger.info('Rate limiting habilitado')
  } catch (error) {
    logger.error('Error inicializando rate limiter', error)
  }
} else {
  logger.warn('Rate limiting deshabilitado: faltan UPSTASH_REDIS_REST_URL o UPSTASH_REDIS_REST_TOKEN')
}

// ============================================
// DEFINICIÓN DE FUNCIONES DISPONIBLES
// ============================================

const AVAILABLE_FUNCTIONS: OpenAI.Chat.ChatCompletionCreateParams.Function[] = [
  {
    name: 'search_areas',
    description: 'Busca áreas de autocaravanas. Máximo 3 fichas útiles. NO la uses si pregunta por UN área concreta (usa get_area_by_name). NO la uses con GPS salvo que diga cerca de mí / aquí. Si no hay sitio, PREGUNTA; no dispares un listado.',
    parameters: {
      type: 'object',
      properties: {
        ubicacion: {
          type: 'object',
          description: 'Ubicación de búsqueda. Si el usuario dice "cerca de mí", usar lat/lng. Si menciona ciudad/país, usar nombre.',
          properties: {
            lat: { 
              type: 'number', 
              description: 'Latitud del usuario (solo si está disponible la geolocalización)' 
            },
            lng: { 
              type: 'number', 
              description: 'Longitud del usuario (solo si está disponible la geolocalización)' 
            },
            nombre: { 
              type: 'string', 
              description: 'Nombre de ciudad, provincia o país. Ejemplo: "Barcelona", "Costa Brava", "España"' 
            },
            radio_km: { 
              type: 'number', 
              description: 'Radio de búsqueda en kilómetros (solo para búsquedas por lat/lng)',
              default: 50,
              enum: [10, 20, 30, 50, 100]
            }
          }
        },
        servicios: {
          type: 'array',
          description:
            'Servicios que DEBE tener (filtro AND). ' +
            'IMPORTANTE mascotas: zona_mascotas = solo si piden "zona/área específica para perros". ' +
            'Si dicen "admiten mascotas", "pet-friendly" o el chip de mascotas, NO uses zona_mascotas (casi no hay datos); ' +
            'busca áreas normales en la ubicación y comenta cuáles tienen zona_mascotas=true si aparece.',
          items: {
            type: 'string',
            enum: [
              'agua',
              'electricidad',
              'vaciado_aguas_negras',
              'vaciado_aguas_grises',
              'wifi',
              'duchas',
              'wc',
              'lavanderia',
              'restaurante',
              'supermercado',
              'zona_mascotas'
            ]
          }
        },
        precio_max: {
          type: 'number',
          description: 'Precio máximo por noche en euros. Ejemplo: 15 para "máximo 15€"'
        },
        solo_gratuitas: {
          type: 'boolean',
          description: 'true para mostrar SOLO áreas con precio_noche = 0. No incluir áreas con precio desconocido (null).'
        },
        tipo_area: {
          type: 'string',
          enum: ['publica', 'privada', 'camping'],
          description: 'Tipo: publica (área municipal/organismo), privada (área de empresa o particular: camper park, granja, Weingut), camping (recinto). Un parking de autocaravanas es publica o privada, no un cuarto tipo.'
        },
        excluir_camping: {
          type: 'boolean',
          description: 'true si el usuario dice "camping no", "sin camping" o no quiere campings. No devuelve recintos.'
        },
        pais: {
          type: 'string',
          description: 'Filtrar por país específico. Ejemplo: "España", "Francia", "Portugal"'
        },
        valoracion_minima: {
          type: 'number',
          description: 'Valoración mínima en Google (1-5). Ejemplo: 4 para "bien valoradas"'
        }
      }
    }
  },
  {
    name: 'get_area_by_name',
    description: 'UN área concreta por nombre (Castillo de Garcimuñoz, García Muñoz, "esta" si hay pin). Una o dos coincidencias, nunca un corredor de ruta.',
    parameters: {
      type: 'object',
      properties: {
        nombre: {
          type: 'string',
          description: 'Nombre (o parte del nombre) del área mencionada por el usuario'
        },
        limit: {
          type: 'number',
          description: 'Máximo de coincidencias a devolver',
          default: 2
        }
      },
      required: ['nombre']
    }
  },
  {
    name: 'search_areas_along_route',
    description:
      'NO USAR para listar áreas en un trayecto. Si piden paradas / áreas de A a B, ' +
      'responde con el enlace /ruta (o /ruta?origen=A&destino=B) y no llames esta función. ' +
      'El planificador ve el trazado real; el chat no.',
    parameters: {
      type: 'object',
      properties: {
        origen: {
          type: 'string',
          description: 'Ciudad de origen. Si dicen "aquí", "desde aquí" o "de donde estoy", usa la ciudad del GPS del usuario, no la palabra "aquí". Ejemplo: "Murcia"'
        },
        destino: {
          type: 'string',
          description: 'Ciudad de destino. Ejemplo: "Valencia"'
        },
        corredor_km: {
          type: 'number',
          description: 'Desvío máximo de la ruta en km',
          default: 15
        },
        tramo: {
          type: 'string',
          enum: ['mitad', 'cerca_destino', 'todo'],
          description: 'mitad = centro del trayecto. cerca_destino = último tramo. todo = cualquier punto excepto el origen.'
        },
        tipo_area: {
          type: 'string',
          enum: ['publica', 'privada', 'camping'],
          description: 'Si pidieron camping o un tipo de área concreto'
        },
        servicios: {
          type: 'array',
          description: 'Servicios OBLIGATORIOS en la parada (filtro AND). Ej: llenado de agua = "agua"; vaciado de aguas = "vaciado_aguas_grises" y "vaciado_aguas_negras".',
          items: {
            type: 'string',
            enum: ['agua', 'electricidad', 'vaciado_aguas_negras', 'vaciado_aguas_grises', 'wifi', 'duchas', 'wc', 'lavanderia', 'restaurante', 'supermercado']
          }
        },
        incluir_origen: {
          type: 'boolean',
          description: 'true SOLO si piden parar al salir / en la ciudad de origen'
        }
      },
      required: ['origen', 'destino']
    }
  },
  {
    name: 'get_area_details',
    description: 'Obtiene información COMPLETA y detallada de un área específica por su ID. Usar cuando el usuario pide "más detalles", "dime más sobre X", "información completa", o cuando necesite datos específicos como contacto, horarios, etc.',
    parameters: {
      type: 'object',
      properties: {
        area_id: {
          type: 'string',
          description: 'UUID del área a consultar (obtenido de una búsqueda previa)'
        }
      },
      required: ['area_id']
    }
  },
  {
    name: 'get_areas_by_country',
    description: 'Lista las mejores áreas de un país ordenadas por score ponderado (nota Google × nº de valoraciones, no solo estrellas). Usar para "mejores áreas de España", "áreas en Francia", "dónde ir en Italia". En la respuesta menciona ★ y el nº de valoraciones si viene en los datos.',
    parameters: {
      type: 'object',
      properties: {
        pais: {
          type: 'string',
          description: 'Nombre del país en español. Ejemplo: "España", "Francia", "Portugal", "Italia"'
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados a retornar',
          default: 10,
          maximum: 20
        }
      },
      required: ['pais']
    }
  },
  {
    name: 'search_talleres',
    description:
      'Busca talleres de campers del catálogo. Máximo 3 fichas. Ciudad dicha gana al GPS. Enlace /taller/slug. ' +
      'NO la uses para áreas de pernocta ni para gasolineras.',
    parameters: {
      type: 'object',
      properties: {
        ciudad: { type: 'string', description: 'Ciudad o pueblo' },
        provincia: { type: 'string', description: 'Provincia' },
        nombre: { type: 'string', description: 'Nombre del taller si lo pide concreto' },
        lat: { type: 'number' },
        lng: { type: 'number' },
        radio_km: { type: 'number', default: 50 },
      },
    },
  },
  {
    name: 'buscar_info_viaje',
    description:
      'Búsqueda web SOLO para gasolineras / diésel. ' +
      'Ej: "hay gasolinera entre Madrid y Valencia". ' +
      'NUNCA para talleres (usa search_talleres). ' +
      'NUNCA para qué ver, pueblos, monumentos, restaurantes, hoteles ni guías turísticas. ' +
      'NUNCA para listar áreas (usa search_areas).',
    parameters: {
      type: 'object',
      properties: {
        pregunta: {
          type: 'string',
          description: 'La pregunta del usuario, tal cual o resumida (gasolinera / qué ver / restaurante)'
        },
        lugar: {
          type: 'string',
          description: 'Ciudad o zona si la hay. Ejemplo: "Cuenca"'
        },
        origen: {
          type: 'string',
          description: 'Origen si preguntan algo entre dos sitios'
        },
        destino: {
          type: 'string',
          description: 'Destino si preguntan algo entre dos sitios'
        }
      },
      required: ['pregunta']
    }
  }
]

// ============================================
// TIPOS
// ============================================

interface ChatbotRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  conversacionId?: string
  guestKey?: string
  ubicacionUsuario?: {
    lat: number
    lng: number
  }
  userId?: string
  locale?: string // idioma de la interfaz del usuario (es, fr, de, it, en...)
  areaEnMapa?: {
    id: string
    nombre: string
    slug?: string
    ciudad?: string
    pais?: string
    fichaBase?: '/area' | '/taller'
  } | null
}

interface EstadisticasBD {
  totalAreas: number
  totalPaises: number
  totalCiudades: number
  areasEuropa: number
  areasLatam: number
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Detecta si el mensaje pide paradas/áreas en una ruta entre dos ciudades.
 * Usado para forzar search_areas_along_route en la primera ronda.
 */
const TIPOS_AREA_VALIDOS = ['publica', 'privada', 'camping'] as const

/** "Huesca", "En Tecolutla", "Viseu" → no heredar filtros del turno anterior. */
function esMensajeSoloUbicacion(mensaje: string): boolean {
  const t = (mensaje || '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[¿?¡!.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t || t.length > 48) return false
  if (/\b(gratis|free|luz|electricidad|agua|wc|ducha|wifi|mascotas|cerca de m[ií]|ruta|paro|precio|cu[aá]nto|best|mejores)\b/i.test(t)) {
    return false
  }
  return /^(en\s+)?[A-Za-zÀ-ÿ0-9\s,'-]{2,48}$/i.test(t)
}

const LUGAR_AQUI_RE =
  /^(aqu[ií]|aca|acá|here|from here|desde aqu[ií]|de aqu[ií]|mi (ubicaci[oó]n|posici[oó]n)|donde estoy|d[oó]nde estoy|near me|pr[eè]s de moi|hier|qui)$/i

const LUGAR_ALLI_RE =
  /^(all[ií]|allá|alla|esa ciudad|ese sitio|la de antes|from there|there|l[aà]-bas)$/i

function resolverLugarRelativo(
  valor: string | undefined,
  ciudadGps: string | null,
  ciudadHilo: string | null = null
): string | undefined {
  const t = String(valor || '').trim()
  if (!t) return ciudadGps || ciudadHilo || undefined
  if (LUGAR_AQUI_RE.test(t)) return ciudadGps || ciudadHilo || t
  if (LUGAR_ALLI_RE.test(t)) return ciudadHilo || ciudadGps || t
  return t
}

function normalizarMsgHilo(
  m: { role?: string; rol?: string; content?: string; contenido?: string }
): { role: 'user' | 'assistant'; content: string } {
  const raw = String(m.role || m.rol || 'user')
  const role: 'user' | 'assistant' = raw === 'assistant' ? 'assistant' : 'user'
  const content = String(m.content ?? m.contenido ?? '').trim()
  return { role, content }
}

/** Un solo hilo para el modelo: las últimas frases, sin duplicar BD + cliente. */
function fusionarHilo(
  db: Array<{ rol: string; contenido: string }> | null | undefined,
  client: any[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const cli = (client || []).map(normalizarMsgHilo).filter((m) => m.content)
  const fromDb = (db || []).map(normalizarMsgHilo).filter((m) => m.content)
  const usuariosCliente = cli.filter((m) => m.role === 'user').length
  const base = usuariosCliente >= 1 && cli.length >= 2 ? [...cli] : [...fromDb]
  if (!(usuariosCliente >= 1 && cli.length >= 2)) {
    for (const m of cli) {
      const last = base[base.length - 1]
      if (last && last.role === m.role && last.content === m.content) continue
      base.push(m)
    }
  }
  return base.slice(-16)
}

function ciudadesDelHilo(hilo: Array<{ role: string; content: string }>): string[] {
  const stop = new Set([
    'aqui', 'aquí', 'aca', 'acá', 'alli', 'allí', 'hola', 'area', 'área', 'areas', 'áreas',
    'gratis', 'mejor', 'mejores', 'españa', 'spain', 'francia', 'portugal',
  ])
  const found: string[] = []
  const re =
    /(?:\b(?:en|a|hacia|desde|de|cerca de)\s+)([A-ZÁÉÍÓÚÑ][A-Za-zÀ-ÿ''-]{2,}(?:\s+[A-ZÁÉÍÓÚÑ][A-Za-zÀ-ÿ''-]{2,})?)/g
  for (const m of hilo) {
    if (m.role !== 'user') continue
    let match: RegExpExecArray | null
    const t = m.content
    re.lastIndex = 0
    while ((match = re.exec(t))) {
      const c = match[1].trim()
      if (!stop.has(c.toLowerCase())) found.push(c)
    }
  }
  return [...new Set(found)].slice(-6)
}

function sanitizarArgsBusqueda(fnArgs: any, ultimoMensaje: string) {
  if (fnArgs?.tipo_area && !TIPOS_AREA_VALIDOS.includes(fnArgs.tipo_area)) {
    delete fnArgs.tipo_area
  }
  if (esMensajeSoloUbicacion(ultimoMensaje)) {
    delete fnArgs.servicios
    delete fnArgs.solo_gratuitas
    delete fnArgs.tipo_area
    delete fnArgs.precio_max
  }
  return fnArgs
}

function esPreguntaFueraCatalogo(mensaje: string): boolean {
  if (!mensaje) return false
  if (pideTaller(mensaje)) return false
  return /\b(gasolinera|gasolineras|gasolina|di[eé]sel|petrol|tankstelle|station.?service)\b/i.test(mensaje)
}

function pideAreasEnMensaje(mensaje: string): boolean {
  return /\b(area|área|areas|áreas|stellplatz|sosta|aire camping|pernoct|autocaravana|camper park)\b/i.test(mensaje || '')
}

/**
 * Obtiene estadísticas de la base de datos para contexto (con caché)
 */
async function getEstadisticasBD(supabase: any): Promise<EstadisticasBD> {
  return getCached(
    'chatbot:stats',
    CACHE_TTL.STATS,
    async () => {
      try {
        // Total de áreas activas
        const { count: totalAreas } = await (supabase as any)
          .from('areas')
          .select('id', { count: 'exact', head: true })
          .eq('activo', true)
        
        // Contar países únicos
        const { data: paises } = await (supabase as any)
          .from('areas')
          .select('pais')
          .eq('activo', true)
        const paisesUnicos = new Set(paises?.map((a: any) => a.pais).filter(Boolean))
        
        // Contar ciudades únicas
        const { data: ciudades } = await (supabase as any)
          .from('areas')
          .select('ciudad')
          .eq('activo', true)
        const ciudadesUnicas = new Set(ciudades?.map((a: any) => a.ciudad).filter(Boolean))
        
        // Áreas en Europa (aproximación por países principales)
        const { count: areasEuropa } = await (supabase as any)
          .from('areas')
          .select('id', { count: 'exact', head: true })
          .eq('activo', true)
          .in('pais', ['España', 'Francia', 'Portugal', 'Italia', 'Alemania'])
        
        // Áreas en LATAM (aproximación)
        const { count: areasLatam } = await (supabase as any)
          .from('areas')
          .select('id', { count: 'exact', head: true })
          .eq('activo', true)
          .in('pais', ['Argentina', 'Chile', 'Uruguay', 'Brasil', 'Colombia', 'Perú', 'México', 'Costa Rica', 'Puerto Rico', 'Ecuador', 'Panamá', 'Paraguay'])
        
        return {
          totalAreas: totalAreas || 0,
          totalPaises: paisesUnicos.size,
          totalCiudades: ciudadesUnicas.size,
          areasEuropa: areasEuropa || 0,
          areasLatam: areasLatam || 0
        }
      } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error)
        return {
          totalAreas: 0,
          totalPaises: 0,
          totalCiudades: 0,
          areasEuropa: 0,
          areasLatam: 0
        }
      }
    }
  )
}

async function resolverUbicacionLog(ubicacionUsuario?: { lat: number; lng: number } | null) {
  if (!ubicacionUsuario || !esGpsValido(ubicacionUsuario.lat, ubicacionUsuario.lng)) {
    return { ciudad: null as string | null, pais: null as string | null, lat: null as number | null, lng: null as number | null }
  }
  const geo = await getCached(
    `geocoding:${ubicacionUsuario.lat.toFixed(4)},${ubicacionUsuario.lng.toFixed(4)}`,
    CACHE_TTL.GEOCODING,
    () => getCityAndProvinceFromCoords(ubicacionUsuario.lat, ubicacionUsuario.lng)
  )
  return {
    ciudad: geo?.city && geo.city !== 'Desconocida' ? geo.city : null,
    pais: geo?.country && geo.country !== 'Desconocida' ? geo.country : null,
    lat: ubicacionUsuario.lat,
    lng: ubicacionUsuario.lng,
  }
}

/**
 * Registra TODA respuesta del chatbot (también anónimas) en
 * chatbot_respuestas_log para revisión manual desde el admin.
 * Best-effort: nunca rompe la respuesta al usuario.
 */
async function logRespuesta(supabase: any, datos: Record<string, any>): Promise<string | null> {
  try {
    const intento = await supabase
      .from('chatbot_respuestas_log')
      .insert(datos)
      .select('id')
      .single()
    if (intento.error && /ciudad|pais|lat|lng/i.test(intento.error.message || '')) {
      const { ciudad, pais, lat, lng, ...sinUbicacion } = datos
      const retry = await supabase
        .from('chatbot_respuestas_log')
        .insert(sinUbicacion)
        .select('id')
        .single()
      if (retry.error) {
        logger.warn('No se pudo registrar en chatbot_respuestas_log', { error: retry.error.message })
        return null
      }
      return retry.data?.id || null
    }
    if (intento.error) {
      logger.warn('No se pudo registrar en chatbot_respuestas_log', { error: intento.error.message })
      return null
    }
    return intento.data?.id || null
  } catch (e: any) {
    logger.warn('No se pudo registrar en chatbot_respuestas_log', { error: e?.message })
    return null
  }
}

// ============================================
// ENDPOINT POST
// ============================================

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const endTimer = logger.start('Chatbot Request')
  
  try {
    logger.info('Nueva petición recibida')
    
    // Parsear body primero
    const body: ChatbotRequest = await req.json()
    let { messages, conversacionId, ubicacionUsuario, locale, areaEnMapa, guestKey } = body
    if (areaEnMapa && (!areaEnMapa.id || !areaEnMapa.nombre)) areaEnMapa = undefined
    if (ubicacionUsuario && !esGpsValido(ubicacionUsuario.lat, ubicacionUsuario.lng)) {
      logger.warn('GPS inválido o Null Island; se ignora', ubicacionUsuario)
      ubicacionUsuario = undefined
    }

    // La sesión de cookies manda. El userId del body se ignora (se puede falsificar).
    let userId: string | undefined
    try {
      const auth = await createServerClient()
      const { data: { user } } = await auth.auth.getUser()
      userId = user?.id
    } catch (e: any) {
      logger.warn('No se pudo leer la sesión del chatbot', { error: e?.message })
    }

    const ip = clientIp(req)
    const huellaIp = huellaDeIp(ip)
    const guestCookieId = userId ? null : leerOCrearGuestCookie(req)
    let huella = guestCookieId ? huellaDeIp(`ck:${guestCookieId}`) : huellaIp
    let guest: { used: number; limit: number; remaining: number } | undefined
    const responder = (payload: any, init?: { status?: number; headers?: HeadersInit }) => {
      const res = NextResponse.json(payload, init)
      if (guestCookieId) ponerGuestCookie(res, guestCookieId)
      return res
    }
    
    // ============================================
    // VALIDACIONES
    // ============================================
    logger.debug('Verificando OPENAI_API_KEY')
    
    // Validar variables de entorno
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      logger.error('OPENAI_API_KEY no configurada')
      return NextResponse.json(
        { error: 'Chatbot no configurado: falta OPENAI_API_KEY' },
        { status: 500 }
      )
    }
    
    logger.debug('OPENAI_API_KEY encontrada')
    
    logger.info('Procesando petición', {
      messageCount: messages.length,
      hasLocation: !!ubicacionUsuario,
      userId: userId || 'anonymous',
      huella: userId ? undefined : huella,
    })
    
    // Validar mensajes
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un mensaje' },
        { status: 400 }
      )
    }

    if (!ubicacionUsuario) {
      return NextResponse.json({
        error: 'LOCATION_REQUIRED',
        errorType: 'LOCATION_REQUIRED',
        message: 'Activa la ubicación para usar el Tío Viajero.',
      }, { status: 403 })
    }

    const supabase = getSupabaseClient()

    // ============================================
    // RATE LIMITING (por cuenta o IP real, no por userId del body)
    // Antes del atajo: sin esto un bot podría llenar el log con atajos gratis.
    // ============================================
    if (ratelimit) {
      const identifier = userId || ip || 'anonymous'

      logger.debug('Verificando rate limit', { identifier })

      const { success, limit, reset, remaining } = await ratelimit.limit(identifier)

      if (!success) {
        const waitSeconds = Math.ceil((reset - Date.now()) / 1000)
        logger.warn(`Rate limit excedido para ${identifier}`, { waitSeconds, limit })

        return NextResponse.json({
          error: 'Demasiadas peticiones',
          message: `Has realizado muchas consultas. Por favor, espera ${waitSeconds} segundos antes de volver a intentarlo.`,
          tip: 'Mientras tanto, puedes explorar el mapa o buscar manualmente áreas.',
          retryAfter: waitSeconds
        }, {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
            'Retry-After': waitSeconds.toString()
          }
        })
      }

      logger.debug(`Rate limit OK. Restantes: ${remaining}/${limit}`)
    }

    // Cupo anónimo: cookie + clave del navegador + IP + hilo.
    // Un cambio de IP (4G/WiFi) no puede regalar una tercera pregunta.
    if (!userId) {
      const quota = await consumeGuestQuestion(supabase, {
        ipHuella: huellaIp,
        cookieId: guestCookieId,
        clientKey: guestKey,
        conversacionId,
      })
      guest = { used: quota.used, limit: quota.limit, remaining: quota.remaining }
      if (quota.huella) huella = quota.huella
      if (!quota.allowed) {
        logger.warn('Cupo anónimo del chatbot agotado', { huella: quota.huella, used: quota.used })
        return responder({
          error: 'LOGIN_REQUIRED',
          errorType: 'LOGIN_REQUIRED',
          message: `Has usado tus ${GUEST_QUESTION_LIMIT} preguntas gratis. Entra o crea una cuenta para seguir.`,
          loginUrl: '/auth/login',
          registerUrl: '/auth/register',
          guest,
        }, { status: 403 })
      }
    }

    const ultimoMensajeUsuario = [...messages]
      .reverse()
      .find((m: any) => m.role === 'user')?.content || ''
    const idiomaAtajo = resolveChatLocale({
      pageLocale: locale,
      lastUserText: ultimoMensajeUsuario,
      previousUserTexts: messages
        .filter((m: any) => m.role === 'user')
        .slice(0, -1)
        .map((m: any) => m.content),
    })
    let atajo = clasificarIntencion({
      ultimo: ultimoMensajeUsuario,
      previosUsuario: messages
        .filter((m: any) => m.role === 'user')
        .slice(0, -1)
        .map((m: any) => m.content),
      ultimoAsistente: [...messages].reverse().find((m: any) => m.role === 'assistant')?.content || null,
    })
    if (atajo === 'filtro_sin_sitio' && (areaEnMapa || esGpsValido(ubicacionUsuario?.lat, ubicacionUsuario?.lng))) {
      atajo = null
    }
    const ubicacionLog = await resolverUbicacionLog(ubicacionUsuario)
    if (atajo) {
      const previosUsuario = messages
        .filter((m: any) => m.role === 'user')
        .map((m: any) => m.content)
      const ruta = extraerRutaNombrada(ultimoMensajeUsuario)
        || [...previosUsuario].reverse().map((t) => extraerRutaNombrada(t)).find(Boolean)
      let etiqueta =
        atajo === 'ambigua'
          ? extraerSitioNombrado(ultimoMensajeUsuario)
          : atajo === 'ruta_sin_intencion' && ruta
            ? `${ruta.origen} → ${ruta.destino}`
            : atajo === 'filtro_sin_sitio'
              ? etiquetaFiltro(ultimoMensajeUsuario)
              : atajo === 'incidencia_recinto'
                ? nombreRecintoMencionado(ultimoMensajeUsuario)
                  || (pareceIdentificarRecinto(ultimoMensajeUsuario) ? ultimoMensajeUsuario.trim() : '')
                : atajo === 'no_somos_recinto'
                  ? extraerCiudadNombrada(ultimoMensajeUsuario)
                    || extraerSitioNombrado(ultimoMensajeUsuario)
                    || extraerNombreAreaConcreta(ultimoMensajeUsuario)
                  : undefined
      if (atajo === 'incidencia_recinto' && etiqueta) {
        const halladas = await buscarAreasPorNombre(etiqueta, 1, ubicacionUsuario)
        if (halladas[0]?.nombre) etiqueta = halladas[0].nombre
      }
      let message = textoAtajoIntencion(atajo, idiomaAtajo, etiqueta)
      const seguimiento = chipsSeguimiento(atajo, idiomaAtajo, etiqueta)
      let areasAtajo: AreaResumen[] = []
      if (atajo === 'no_somos_recinto') {
        if (etiqueta) {
          areasAtajo = (await searchAreas({ ubicacion: { nombre: etiqueta } })).slice(0, 3)
        } else if (esGpsValido(ubicacionUsuario?.lat, ubicacionUsuario?.lng)) {
          areasAtajo = (await searchAreas({
            ubicacion: { lat: ubicacionUsuario!.lat, lng: ubicacionUsuario!.lng, radio_km: 20 },
          })).slice(0, 3)
        }
        if (areasAtajo.length) {
          message = componerRespuestaConFichas(message, areasAtajo, idiomaAtajo)
        }
      }
      logger.info('Respuesta corta sin modelo', { atajo, pregunta: ultimoMensajeUsuario.slice(0, 80) })

      if (!conversacionId) {
        const fila: Record<string, any> = {
          sesion_id: userId || crypto.randomUUID(),
          titulo: String(ultimoMensajeUsuario).trim().slice(0, 80) || 'Nueva conversación',
          ubicacion_usuario: ubicacionUsuario || null,
          total_mensajes: 1,
          preferencias_detectadas: { ubicacion: ubicacionLog },
        }
        if (userId) fila.user_id = userId
        const { data: nuevaConv, error: convError } = await (supabase as any)
          .from('chatbot_conversaciones')
          .insert(fila)
          .select('id')
          .single()
        if (convError) {
          logger.warn('No se pudo crear conversación del atajo', { error: convError.message })
        } else if (nuevaConv?.id) {
          conversacionId = nuevaConv.id
        }
      } else if (ubicacionLog.ciudad || ubicacionLog.lat != null) {
        await (supabase as any)
          .from('chatbot_conversaciones')
          .update({
            ubicacion_usuario: ubicacionUsuario || undefined,
            preferencias_detectadas: { ubicacion: ubicacionLog },
            ultimo_mensaje_at: new Date().toISOString(),
          })
          .eq('id', conversacionId)
      }

      if (conversacionId) {
        await (supabase as any).from('chatbot_mensajes').insert([
          { conversacion_id: conversacionId, rol: 'user', contenido: ultimoMensajeUsuario },
          {
            conversacion_id: conversacionId,
            rol: 'assistant',
            contenido: message,
            modelo_usado: 'atajo',
          },
        ])
      }

      const logId = await logRespuesta(supabase, {
        conversacion_id: conversacionId || null,
        user_id: userId || null,
        locale: idiomaAtajo,
        pregunta: ultimoMensajeUsuario,
        respuesta: message,
        funciones: [
          ...(userId ? [] : [{ name: '_cliente', args: { huella } }]),
          { name: '_intencion', args: { tipo: atajo } },
          { name: '_ubicacion', args: ubicacionLog },
        ],
        areas_ids: areasAtajo.map((a) => a.id),
        tokens: 0,
        modelo: 'atajo',
        duracion_ms: Date.now() - startTime,
      })
      return responder({
        message,
        conversacionId: conversacionId || null,
        logId,
        modelo: 'atajo',
        duration: Date.now() - startTime,
        guest,
        seguimiento,
        areas: areasAtajo,
      })
    }

    // Crear hilo para registrados y anónimos (el admin agrupa por conversacion_id)
    if (!conversacionId) {
      const primerMensaje = [...messages].reverse().find((m: any) => m.role === 'user')?.content || ''
      const fila: Record<string, any> = {
        sesion_id: userId || crypto.randomUUID(),
        titulo: String(primerMensaje).trim().slice(0, 80) || 'Nueva conversación',
        ubicacion_usuario: ubicacionUsuario || null,
        total_mensajes: 0,
        preferencias_detectadas: { ubicacion: ubicacionLog },
      }
      if (userId) fila.user_id = userId

      const { data: nuevaConv, error: convError } = await (supabase as any)
        .from('chatbot_conversaciones')
        .insert(fila)
        .select()
        .single()

      if (convError) {
        console.error('❌ Error creando conversación:', convError)
      } else if (nuevaConv) {
        conversacionId = nuevaConv.id
        console.log('✅ Conversación creada:', conversacionId)
      }
    }
    
    // El mensaje de este turno se guarda DESPUÉS de leer el historial,
    // para no duplicarlo en el contexto del modelo.
    
    // Cargar configuración del chatbot
    console.log('⚙️ Cargando configuración del chatbot...')
    const { data: config, error: configError } = await (supabase as any)
      .from('chatbot_config')
      .select('*')
      .eq('nombre', 'asistente_principal')
      .eq('activo', true)
      .single()
    
    if (configError || !config) {
      console.error('❌ Error cargando configuración:', configError)
      return NextResponse.json(
        { error: 'Configuración del chatbot no encontrada' },
        { status: 500 }
      )
    }
    
    console.log('✅ Configuración cargada:', config.modelo)

    const modelValidation = await validateOpenAIModel(config.modelo)
    if (!modelValidation.valid) {
      return NextResponse.json(
        {
          error: 'Modelo OpenAI no válido en configuración del chatbot',
          details: modelValidation.reason,
          errorType: 'MODEL_NOT_AVAILABLE'
        },
        { status: 400 }
      )
    }
    
    // ============================================
    // ENRIQUECER CONTEXTO (PARALELIZADO)
    // ============================================
    
    logger.debug('Cargando contexto en paralelo (geocoding + stats + historial)')
    const contextStartTime = Date.now()
    
    // Ejecutar las 3 operaciones en paralelo
    const [ubicacionDetectada, stats, historialData] = await Promise.all([
      // 1. GEOCODING: Convertir GPS a ciudad/provincia (con caché)
      ubicacionUsuario?.lat && ubicacionUsuario?.lng
        ? getCached(
            `geocoding:${ubicacionUsuario.lat.toFixed(4)},${ubicacionUsuario.lng.toFixed(4)}`,
            CACHE_TTL.GEOCODING,
            () => getCityAndProvinceFromCoords(ubicacionUsuario.lat, ubicacionUsuario.lng)
          )
        : Promise.resolve(null),
      
      // 2. ESTADÍSTICAS: Obtener datos de la BD (con caché)
      getEstadisticasBD(supabase),
      
      // 3. HISTORIAL: Cargar mensajes previos de la conversación
      conversacionId
        ? (supabase as any).from('chatbot_mensajes')
            .select('rol, contenido')
            .eq('conversacion_id', conversacionId)
            .order('created_at', { ascending: true })
            .limit(24)
        : Promise.resolve({ data: null, error: null })
    ])
    
    const contextDuration = Date.now() - contextStartTime
    logger.metric('Context Load', contextDuration)
    
    logger.debug('Contexto cargado', {
      location: ubicacionDetectada ? formatLocation(ubicacionDetectada) : 'none',
      stats,
      historyCount: historialData.data?.length || 0
    })
    
    const historialPrevio: Array<{ rol: string, contenido: string }> = historialData.data || []
    const hiloModelo = fusionarHilo(historialPrevio, messages)
    const ciudadesHilo = ciudadesDelHilo(hiloModelo)
    const ciudadHilo = ciudadesHilo.length ? ciudadesHilo[ciudadesHilo.length - 1] : null

    if (conversacionId && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1]
      if (lastUserMessage.role === 'user') {
        await (supabase as any).from('chatbot_mensajes').insert({
          conversacion_id: conversacionId,
          rol: 'user',
          contenido: lastUserMessage.content
        })
      }
    }

    const ciudadGps = ubicacionDetectada?.city && ubicacionDetectada.city !== 'Desconocida'
      ? ubicacionDetectada.city
      : ubicacionLog.ciudad
    const paisGps = ubicacionDetectada?.country && ubicacionDetectada.country !== 'Desconocida'
      ? ubicacionDetectada.country
      : ubicacionLog.pais
    if (ciudadGps) ubicacionLog.ciudad = ciudadGps
    if (paisGps) ubicacionLog.pais = paisGps
    if (conversacionId && (ubicacionLog.ciudad || ubicacionLog.lat != null)) {
      await (supabase as any)
        .from('chatbot_conversaciones')
        .update({
          ubicacion_usuario: ubicacionUsuario || undefined,
          preferencias_detectadas: {
            ubicacion: ubicacionLog,
            ciudades_hilo: ciudadesHilo,
            ciudad_hilo: ciudadHilo,
          },
        })
        .eq('id', conversacionId)
    }
    
    // 4. CONSTRUIR SYSTEM PROMPT ENRIQUECIDO
    let systemPromptEnriquecido = config.system_prompt
    
    // Añadir información de ubicación si está disponible
    if (ubicacionDetectada) {
      systemPromptEnriquecido += `\n\n═══════════════════════════════════════
📍 UBICACIÓN ACTUAL DEL USUARIO
═══════════════════════════════════════
✅ GPS COMPARTIDO
- Ciudad: ${ubicacionDetectada.city}
- Provincia: ${ubicacionDetectada.province}
- Región: ${ubicacionDetectada.region}
- País: ${ubicacionDetectada.country}
- Coordenadas: ${ubicacionUsuario!.lat.toFixed(4)}, ${ubicacionUsuario!.lng.toFixed(4)}

REGLAS DE UBICACIÓN:
1. GPS SOLO si dice "cerca de mí", "aquí" o "donde estoy". "Recomiéndame un área" o "qué área" SIN sitio NO usa el GPS: pregunta dónde, o usa el pin del mapa.
2. "De aquí a X", "desde aquí": el origen ES ${ubicacionDetectada.city}. NUNCA pases origen="aquí".
3. Recuerda el hilo: "esa", "la de antes" apuntan al área o ciudad del hilo, NO a un listado nuevo.
4. Si nombra otra ciudad, IGNORA el GPS.
5. Distancias solo en búsquedas GPS.
6. Radio: cerca de mí → 10-20km. Ciudad concreta → por nombre, sin radio. NUNCA 50km por una frase genérica.`
    }

    const ciudadGpsTxt = ciudadGps || 'desconocida'
    systemPromptEnriquecido += `\n\n═══════════════════════════════════════
🧠 MEMORIA DEL HILO (OBLIGATORIO)
═══════════════════════════════════════
El Tío DEBE usar las últimas frases de ESTA conversación. No empieces de cero.
${hiloModelo.slice(-8).map((m) => `- ${m.role === 'user' ? 'Usuario' : 'Tío'}: ${m.content.slice(0, 220)}`).join('\n') || '- (primer mensaje)'}
- GPS (dónde está físicamente): ${ciudadGpsTxt}
- Ciudades ya dichas en el hilo: ${ciudadesHilo.join(', ') || '(ninguna aún)'}
- Pin abierto en el mapa: ${areaEnMapa ? `${areaEnMapa.nombre} (${[areaEnMapa.ciudad, areaEnMapa.pais].filter(Boolean).join(', ')}) ${areaEnMapa.fichaBase === '/taller' ? '/taller' : '/area'}/${areaEnMapa.slug || ''}` : '(ninguno)'}
- "aquí / cerca de mí / donde estoy" → GPS (${ciudadGpsTxt}).
- "esta / esa / la del mapa / recomiéndame un área" con pin abierto → ESA área, una ficha.
- "allí / la de antes" → el hilo (${ciudadHilo || ciudadGpsTxt}).
- SEGUIMIENTO: si acabas de listar áreas y el usuario dice "amplía", "más", "y con duchas", "y gratis" o corrige ("esas no son gratis"), MANTÉN los filtros de antes (gratis, servicios, tipo) y la misma ubicación/GPS. No preguntes "¿dónde?" otra vez ni pierdas el filtro. Si dijiste "gratis", que TODAS sean precio 0; si una no lo es, no la incluyas ni la llames gratuita.
- GRUPO / FAMILIA: "vamos 2 adultos y dos niñas", "somos cuatro", "niña de 8" es QUIÉN viaja a la área del hilo, NO un trayecto. Sigue hablando de ESA ficha. No saltes a /ruta.
GPS, pin y memoria se complementan. No dispares el corredor entero si preguntan por una.`
    
    // Añadir estadísticas de la plataforma
    systemPromptEnriquecido += `\n\n═══════════════════════════════════════
📊 ESTADÍSTICAS DE LA PLATAFORMA
═══════════════════════════════════════
- Total de áreas: ${stats.totalAreas} áreas verificadas
- Países disponibles: ${stats.totalPaises} países
- Ciudades cubiertas: ${stats.totalCiudades} ciudades
- Áreas en Europa: ${stats.areasEuropa} áreas
- Áreas en LATAM: ${stats.areasLatam} áreas

Usa estas estadísticas cuando el usuario pregunte "cuántas áreas hay", "dónde están", etc.`

    // Idioma: misma regla que Andrea (Furgocasa) — último mensaje del cliente
    {
      const NOMBRES_IDIOMA: Record<string, string> = {
        es: 'español', en: 'inglés', fr: 'francés', de: 'alemán', it: 'italiano', pt: 'portugués', nl: 'neerlandés'
      }
      const nombreUi = NOMBRES_IDIOMA[locale || 'es'] || locale || 'español'
      systemPromptEnriquecido += `\n\n═══════════════════════════════════════
🌍 IDIOMA (multilingüe, PRIORIDAD)
═══════════════════════════════════════
- Responde SIEMPRE en el MISMO idioma en el que te escribe el cliente, sea cual sea: español, inglés, francés, alemán, italiano, portugués, polaco, neerlandés, etc. No te limites a los idiomas de la web.
- Detecta el idioma por el ÚLTIMO mensaje del cliente. Si cambia de idioma a mitad de conversación, cambia tú con él.
- Aunque los datos de las áreas estén en español, TRADÚCELOS con naturalidad. Nunca respondas en español a quien te escribe en otro idioma, ni mezcles idiomas.
- Los nombres propios (áreas, ciudades) se mantienen. Las fichas "resumen" YA vienen en el idioma de respuesta: pégalas TAL CUAL.
- Si no estás seguro del idioma (mensaje muy corto como "ok"), responde en el idioma de los mensajes anteriores; si no hay, en ${nombreUi}.`
    }

    systemPromptEnriquecido += `\n\n═══════════════════════════════════════
🛣️ RUTAS Y FORMATO (RECORDATORIO)
═══════════════════════════════════════
- Áreas / paradas en una ruta (de A a B, "dónde paro", "paradas en el camino"): NO listes áreas y NO llames search_areas_along_route. Deriva al planificador: /ruta o /ruta?origen=A&destino=B. Ahí se ve el trazado real.
- Si pregunta por UN área o pueblo (Garcimuñoz, "esta", "la de X"): get_area_by_name. UNA ficha. NO reabras la ruta ni pegues el corredor.
- Si estás pidiendo aclaración ("¿te refieres a…?"): CERO fichas. Primero que confirme.
- /ruta es la respuesta cuando piden un trayecto. No sueltes 3 áreas a ojo.
- Servicios: SOLO los que estén en true (ej: "Agua, Electricidad"). NUNCA "[agua: no, ...]".
- Valoración: "⭐ 4.7/5 (128 valoraciones)" si hay nº de reseñas. No digas "5 estrellas" sin volumen.
- Links: solo /area/{slug}. Prohibido Google Maps e imágenes markdown.

═══════════════════════════════════════
✅ CALIDAD DE DATOS (OBLIGATORIO)
═══════════════════════════════════════
- PRECIO: Solo di "Gratis" si el resumen o precio_noche es 0. Si dice "Precio no disponible" o precio_noche es null, escribe exactamente eso. NUNCA conviertas un precio desconocido en gratis. Si piden gratuita y no hay otra, dilo y NO listes de pago.
- FICHAS: pega el campo "resumen" de cada área TAL CUAL. No reescribas precio, servicios ni enlaces. Prohibido autocaravanas.com, example.com y Google Maps. Di el mismo número de áreas que te llegan (máx. 3). Nunca "he encontrado 5" si solo hay 3 fichas.
- FILTROS: Si el usuario nombra solo una ciudad DESPUÉS de haber pedido áreas/servicios, busca ahí SIN heredar filtros viejos.
- TIPO: solo tres. publica = ayuntamiento/organismo. privada = empresa/particular (camper park, granja, Weingut, CL, Brit Stop). camping = recinto. No existe la categoría stopover. En cada país la gente usa otro nombre (aire, sosta, Stellplatz, camperplaats, motorhome aire, trailer park): eso es etiqueta. Un "parking autocaravanas" del pueblo es pública. UK: touring park = camping; CL/aire de anfitrión = privada; Arosfan = pública. "Dónde estacionar" = áreas de esas tres, nunca un tipo parking.
- Si dicen "camping no" / "sin camping": search_areas con excluir_camping=true. CERO fichas de camping. No las menciones "para descartarlas".
- Nunca llames "privada" a un área pública ni al revés. El tipo va en el resumen: pégalo tal cual.
- No inventes tarifas semanales o mensuales. Si precio_noche es null, di "Precio no disponible" y que lo confirmen en el recinto.
- Si dicen que X € es caro: search_areas con precio_max por debajo. Si no hay fichas con precio confirmado en ese tope, dilo y NO listes áreas de precio desconocido como si fueran más baratas.
- MASCOTAS: zona_mascotas=true es lo único confirmado. Si piden "mascotas bienvenidas" NO filtres por eso (casi no hay dato) y NO digas que las cercanas admiten perros. Enseña cercanas y di que en las fichas no está confirmado, salvo las que lleven Mascotas en servicios.
- NO eres un camping ni un área. Eres una aplicación de búsqueda de áreas de autocaravanas. Si piden reservar, disponibilidad o una plaza: empieza SIEMPRE con esa identidad. NUNCA digas «no podemos consultar disponibilidad» ni «desde aquí no puedo confirmar». Di que hay que contactar con el recinto y enseña fichas si hay un pueblo.
- NO eres la recepción de un camping ni de un área. Si se quejan de vecinos, ruido, parcela de al lado o un coche arrancado: di que somos un mapa, que avisen a recepción o al responsable, y al 112 si hay riesgo. CERO fichas.
- Si el hilo ya es una incidencia y luego nombran un camping o un área, NO busques fichas ni preguntes si quieres campings de la ciudad. Están identificando DÓNDE están. Confirma el recinto y repite que no somos su recepción.
- CERCA DE MÍ: si hay GPS válido y no nombran otra ciudad, busca ahí. Si no hay GPS, pide la ciudad. No busques en todo el mundo ni inventes una ubicación.
- NO eres una guía turística. Si piden qué ver, pueblos, planes o itinerarios, NO inventes una guía y NO uses buscar_info_viaje. Di que no cubres eso y enlaza https://www.furgocasa.com/es/blog?category=rutas
- Si piden áreas/gasolinera Y además turismo: responde SOLO la parte de áreas/gasolinera y manda el turismo al blog de Furgocasa.
- Taller camper: search_talleres. Cita ficha y enlace /taller/slug. Si hay fichas, prohibido decir que no tienes.
- Si piden un nombre concreto (Petervan, un taller, un área): busca en los dos catálogos. El enlace es /area/{slug} o /taller/{slug} según la ficha.
- Gasolinera o diésel: buscar_info_viaje. Di que es info de la web, no una ficha /area/. Prohibido restaurantes, hoteles, monumentos y "qué ver".
- example.com u otras URLs inventadas: prohibido. Solo /area/{slug}.
- Idioma: último mensaje del cliente. TODO en ese idioma (intro y etiquetas). Las fichas "resumen" ya están traducidas.

═══════════════════════════════════════
📋 SEIS REGLAS DE DIRECTORIO (comunes a Roy y Casi Cinco)
═══════════════════════════════════════
1. Ciudad o pueblo dicho en el mensaje gana al GPS.
2. Pega el campo "resumen" tal cual (precio, ⭐, /area/{slug}). No inventes ni redondees.
3. Si este turno trae fichas, prohibido decir «no tengo». Di el mismo número que te llegan (máx. 3).
4. Follow-up («y con duchas», «más baratos», «¿y en Murcia?») conserva filtros y sitio. Una ciudad SOLA, sin «y» ni filtro, es búsqueda nueva: no heredes duchas/gratis.
5. «Cerca» sin GPS → pregunta la ciudad. No inventes dónde está.
6. Solo /area/{slug}, /taller/{slug} y /ruta. Prohibido Google Maps, maps.google, goo.gl/maps, example.com.

═══════════════════════════════════════
🗣️ TONO Y CONVERSACIÓN (como Andrea en Furgocasa)
═══════════════════════════════════════
- Habla como una persona del equipo: cercana, clara, tutea. Nunca suenes a listado automático.
- Empieza humano cuando encaje: "Claro", "Te cuento", "Perfecto", "Entiendo".
- PROHIBIDO responder solo con la ficha. Antes, 2-5 frases que contesten LO QUE ACABA DE DECIR, ligadas al hilo. La ficha se pega sola después.
- Mantén el tema: si hablabais de Los Narejos / Los Alcázares y dicen con quién van, habla de ESA área (plazas, precio, servicios confirmados). No inventes parque infantil ni "ideal para niños" si la ficha no lo dice.
- "vamos a X" con UN sitio = esa área o pueblo. "vamos de A a B" / "dónde paro" = /ruta. Quien viaja no es origen→destino.
- No cambies de tema ni ofrezcas el planificador si no piden un trayecto.
- Cierra a veces con una pregunta útil ("¿Una noche o varios días?", "¿Te encaja el precio o busco alternativas cerca?").`
    
    // 5. PREPARAR MENSAJES COMPLETOS (un solo hilo, sin duplicar)
    const fullMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { 
        role: 'system', 
        content: systemPromptEnriquecido 
      },
      ...hiloModelo.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ]
    
    console.log(`📝 Hilo al modelo: ${hiloModelo.length} frases (bd ${historialPrevio.length}, cliente ${messages.length})`)
    
    // Crear cliente OpenAI (bajo demanda para asegurar que las env vars estén cargadas)
    const openai = getOpenAIClient()
    
    // ============================================
    // BUCLE DE HERRAMIENTAS (tools API moderna)
    // Permite encadenar y combinar varias búsquedas en un mismo mensaje
    // (p.ej. "compara áreas gratis en Granada y Sevilla").
    // ============================================
    const tools: OpenAI.Chat.ChatCompletionTool[] = AVAILABLE_FUNCTIONS.map((f: any) => ({
      type: 'function' as const,
      function: f
    }))

    const MAX_TOOL_ROUNDS = 4
    let totalTokens = 0
    let rounds = 0
    const todasLasAreas: AreaResumen[] = []
    let firstFunctionName: string | null = null
    let firstFunctionArgs: any = null
    let lastFunctionResult: any = null
    const funcionesEjecutadas: Array<{ name: string; args: any }> = []
    if (!userId && huella) {
      funcionesEjecutadas.push({ name: '_cliente', args: { huella } })
    }
    funcionesEjecutadas.push({ name: '_ubicacion', args: ubicacionLog })
    const conversation: OpenAI.Chat.ChatCompletionMessageParam[] = [...fullMessages]
    let finalResponse: string | null = null

    const idiomaRespuesta = resolveChatLocale({
      pageLocale: locale,
      lastUserText: ultimoMensajeUsuario,
      previousUserTexts: [
        ...hiloModelo.filter((h) => h.role === 'user').slice(0, -1).map((h) => h.content),
        ...messages.filter((m: any) => m.role === 'user').slice(0, -1).map((m: any) => m.content),
      ],
    })
    const areaHilo = extraerNombreAreaDelHilo(
      messages
        .filter((m: any) => m.role === 'user')
        .slice(0, -1)
        .map((m: any) => String(m.content || '')),
      [...messages].reverse().find((m: any) => m.role === 'assistant')?.content || null
    )
    const followupGrupoSobreArea =
      pareceComposicionGrupo(ultimoMensajeUsuario) &&
      Boolean(areaHilo || areaEnMapa || asistenteListoAreas(
        [...messages].reverse().find((m: any) => m.role === 'assistant')?.content || null
      ))
    const preguntaConcreta =
      esPreguntaAreaConcreta(ultimoMensajeUsuario) ||
      esDeixisMapa(ultimoMensajeUsuario) ||
      Boolean(extraerNombreAreaConcreta(ultimoMensajeUsuario)) ||
      followupGrupoSobreArea ||
      Boolean(areaEnMapa && /recomi[eé]ndame|esta no te suena|qu[eé] (pasa con |tal )?([eé]sta|[eé]sa)/i.test(ultimoMensajeUsuario))
    const forzarAreaConcreta = preguntaConcreta
    const forzarTaller = pideTaller(ultimoMensajeUsuario) && !forzarAreaConcreta
    const pareceFueraCatalogo =
      esPreguntaFueraCatalogo(ultimoMensajeUsuario) && !pideAreasEnMensaje(ultimoMensajeUsuario)
    const nombraOtroSitioGps =
      Boolean(extraerSitioNombrado(ultimoMensajeUsuario)) ||
      Boolean(extraerCiudadNombrada(ultimoMensajeUsuario)) ||
      Boolean(extraerRutaNombrada(ultimoMensajeUsuario))
    const forzarBusquedaGps =
      !forzarAreaConcreta &&
      !pareceFueraCatalogo &&
      esGpsValido(ubicacionUsuario?.lat, ubicacionUsuario?.lng) &&
      !nombraOtroSitioGps &&
      (pideCercaDeMi(ultimoMensajeUsuario) ||
        esFiltroSinSitio(ultimoMensajeUsuario) ||
        /recomi[eé]ndame|estacionar|d[oó]nde duermo|cerca/i.test(ultimoMensajeUsuario))

    while (rounds < MAX_TOOL_ROUNDS) {
      rounds++
      console.log(`🔮 Llamando a OpenAI (ronda ${rounds})...`)

      const toolChoice: OpenAI.Chat.ChatCompletionToolChoiceOption =
        rounds === 1 && forzarTaller && !firstFunctionName
          ? { type: 'function', function: { name: 'search_talleres' } }
          : rounds === 1 && forzarAreaConcreta && !firstFunctionName
          ? { type: 'function', function: { name: 'get_area_by_name' } }
          : rounds === 1 && pareceFueraCatalogo && !firstFunctionName
            ? { type: 'function', function: { name: 'buscar_info_viaje' } }
          : rounds === 1 && forzarBusquedaGps && !firstFunctionName
            ? { type: 'function', function: { name: 'search_areas' } }
            : 'auto'

      if (toolChoice !== 'auto') {
        console.log(
          forzarTaller
            ? '🔧 Forzando search_talleres'
            : forzarAreaConcreta
            ? '📌 Forzando get_area_by_name (un área, no el corredor)'
            : pareceFueraCatalogo
              ? '🌐 Forzando buscar_info_viaje (fuera de catálogo)'
              : '📍 Forzando search_areas (GPS ya activo)'
        )
      }

      const completion = await openai.chat.completions.create({
        model: config.modelo,
        messages: conversation,
        tools,
        tool_choice: toolChoice,
        ...buildTemperatureParam(config.modelo, config.temperature),
        ...buildTokensParam(config.max_tokens),
        ...buildReasoningForTools(config.modelo)
      })

      const response = completion.choices[0].message
      totalTokens += completion.usage?.total_tokens || 0

      // Sin tool calls → respuesta final
      if (!response.tool_calls || response.tool_calls.length === 0) {
        finalResponse = response.content || ''
        break
      }

      conversation.push(response as OpenAI.Chat.ChatCompletionMessageParam)

      // Ejecutar TODAS las tool calls de la ronda (pueden ser varias en paralelo)
      for (const toolCall of response.tool_calls) {
        const fnName: string = (toolCall as any).function?.name
        let fnArgs: any = {}
        try {
          fnArgs = JSON.parse((toolCall as any).function?.arguments || '{}')
        } catch {
          fnArgs = {}
        }

        if (!firstFunctionName) {
          firstFunctionName = fnName
          firstFunctionArgs = fnArgs
        }
        if (fnName === 'search_areas') {
          sanitizarArgsBusqueda(fnArgs, ultimoMensajeUsuario)
          if (fnArgs.ubicacion?.nombre) {
            fnArgs.ubicacion.nombre = resolverLugarRelativo(fnArgs.ubicacion.nombre, ciudadGps, ciudadHilo)
          }
          const previosUser = messages
            .filter((m: any) => m.role === 'user')
            .map((m: any) => String(m.content || ''))
          const hiloGratis = previosUser.some((t: string) => pideSoloGratuitas(t) || /gratis|gratuit/i.test(t))
          if (pideSoloGratuitas(ultimoMensajeUsuario) || (hiloGratis && esAmpliacionBusqueda(ultimoMensajeUsuario))) {
            fnArgs.solo_gratuitas = true
          }
          const hiloSinCamping = previosUser.some((t: string) => pideSinCamping(t)) || pideSinCamping(ultimoMensajeUsuario)
          if (hiloSinCamping) {
            fnArgs.excluir_camping = true
            if (fnArgs.tipo_area === 'camping') delete fnArgs.tipo_area
          }
          const tope = topePrecioQueja(ultimoMensajeUsuario)
            || [...previosUser].reverse().map((t: string) => topePrecioQueja(t)).find((n: number | undefined) => n != null)
          if (tope && !fnArgs.solo_gratuitas && !fnArgs.precio_max) {
            fnArgs.precio_max = tope
          }
          const ciudadSola =
            Boolean(extraerCiudadNombrada(ultimoMensajeUsuario)) &&
            !esFiltroSinSitio(ultimoMensajeUsuario) &&
            !esAmpliacionBusqueda(ultimoMensajeUsuario) &&
            !/^(y |¿y |and )/i.test(ultimoMensajeUsuario.trim())
          if (!ciudadSola) {
            const serviciosHilo = [
              ...extraerServiciosPedidos(ultimoMensajeUsuario),
              ...previosUser.flatMap((t: string) => extraerServiciosPedidos(t)),
            ]
            if (serviciosHilo.length) {
              fnArgs.servicios = [...new Set([...(fnArgs.servicios || []), ...serviciosHilo])]
            }
          }
        }
        if (fnName === 'get_area_by_name') {
          const nombrada = extraerNombreAreaConcreta(ultimoMensajeUsuario)
          if (!fnArgs.nombre || esDeixisMapa(fnArgs.nombre) || String(fnArgs.nombre).length < 3) {
            fnArgs.nombre = nombrada || areaHilo || areaEnMapa?.nombre || fnArgs.nombre
          }
          fnArgs.limit = Math.min(Number(fnArgs.limit) || 2, 2)
        }
        funcionesEjecutadas.push({ name: fnName, args: fnArgs })

        // GPS: "cerca de mí" o un filtro sin ciudad (agua, pública, mascotas).
        // Si nombran un pueblo/ruta, no vuelques la ubicación del usuario.
        const nombraOtroSitio =
          Boolean(extraerSitioNombrado(ultimoMensajeUsuario)) ||
          Boolean(extraerCiudadNombrada(ultimoMensajeUsuario)) ||
          Boolean(extraerRutaNombrada(ultimoMensajeUsuario)) ||
          Boolean(extraerNombreAreaConcreta(ultimoMensajeUsuario))
        if (
          ubicacionUsuario &&
          esGpsValido(ubicacionUsuario.lat, ubicacionUsuario.lng) &&
          fnName === 'search_areas' &&
          !fnArgs.ubicacion?.lat &&
          !fnArgs.ubicacion?.nombre &&
          (pideCercaDeMi(ultimoMensajeUsuario) || !nombraOtroSitio)
        ) {
          console.log('📍 Inyectando ubicación del usuario (cerca de mí)')
          fnArgs.ubicacion = {
            ...fnArgs.ubicacion,
            lat: ubicacionUsuario.lat,
            lng: ubicacionUsuario.lng,
            radio_km: fnArgs.ubicacion?.radio_km || 20
          }
        }

        let functionResult: any
        try {
          console.log(`⚡ Ejecutando ${fnName}:`, JSON.stringify(fnArgs))
          switch (fnName) {
            case 'search_areas':
              functionResult = await searchAreas(fnArgs as BusquedaAreasParams)
              if (Array.isArray(functionResult)) todasLasAreas.push(...functionResult.slice(0, 3))
              break
            case 'get_area_details':
              functionResult = await getAreaDetails(fnArgs.area_id)
              break
            case 'get_areas_by_country':
              functionResult = await getAreasByCountry(fnArgs.pais, fnArgs.limit || 10)
              if (Array.isArray(functionResult)) todasLasAreas.push(...functionResult)
              break
            case 'get_area_by_name':
              functionResult = await buscarAreasPorNombre(
                fnArgs.nombre,
                fnArgs.limit || 2,
                ubicacionUsuario
              )
              if (!Array.isArray(functionResult) || functionResult.length === 0) {
                const talleresNombrados = await buscarTalleresPorNombre(fnArgs.nombre, 2)
                if (talleresNombrados.length) functionResult = talleresNombrados
              }
              if (Array.isArray(functionResult)) todasLasAreas.push(...functionResult.slice(0, 2))
              break
            case 'search_areas_along_route':
              {
                const rutaHilo = extraerRutaNombrada(ultimoMensajeUsuario)
                  || [...hiloModelo].reverse().map((m) => extraerRutaNombrada(m.content)).find(Boolean)
                const origen = fnArgs.origen || rutaHilo?.origen
                const destino = fnArgs.destino || rutaHilo?.destino
                const q = origen && destino
                  ? `/ruta?origen=${encodeURIComponent(origen)}&destino=${encodeURIComponent(destino)}`
                  : '/ruta'
                functionResult = {
                  areas: [],
                  aviso:
                    `No listes áreas. El usuario quiere paradas de ruta: deriva al planificador ${q}. El chat no ve el trazado real.`,
                }
              }
              break
            case 'search_talleres':
              if (
                ubicacionUsuario &&
                esGpsValido(ubicacionUsuario.lat, ubicacionUsuario.lng) &&
                !fnArgs.ciudad &&
                !fnArgs.provincia &&
                !fnArgs.nombre &&
                (pideCercaDeMi(ultimoMensajeUsuario) || !nombraOtroSitio)
              ) {
                fnArgs.lat = ubicacionUsuario.lat
                fnArgs.lng = ubicacionUsuario.lng
                fnArgs.radio_km = fnArgs.radio_km || 50
              }
              if (!fnArgs.nombre) {
                const nombrado = extraerNombreAreaConcreta(ultimoMensajeUsuario)
                if (nombrado) fnArgs.nombre = nombrado
              }
              if (!fnArgs.ciudad) {
                const ciudad = extraerCiudadNombrada(ultimoMensajeUsuario) || extraerSitioNombrado(ultimoMensajeUsuario)
                if (ciudad && ciudad.toLowerCase() !== String(fnArgs.nombre || '').toLowerCase()) {
                  fnArgs.ciudad = ciudad
                }
              }
              functionResult = await searchTalleres(fnArgs)
              if (Array.isArray(functionResult)) todasLasAreas.push(...functionResult.slice(0, 3))
              break
            case 'buscar_info_viaje':
              functionResult = await buscarInfoViajeWeb({
                pregunta: fnArgs.pregunta || ultimoMensajeUsuario,
                lugar: fnArgs.lugar,
                origen: fnArgs.origen,
                destino: fnArgs.destino,
                idioma: idiomaRespuesta,
              })
              break
            default:
              functionResult = { error: `Función ${fnName} no implementada` }
              console.error('❌ Función desconocida:', fnName)
          }
        } catch (functionError: any) {
          console.error('❌ Error ejecutando función:', functionError)
          functionResult = { error: functionError.message || 'Error ejecutando la función' }
        }

        lastFunctionResult = functionResult

        conversation.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: serializeToolResultForModel(functionResult, idiomaRespuesta)
        })
      }
    }

    // Si se agotaron las rondas con tools pendientes, pedir cierre sin herramientas
    if (finalResponse == null) {
      console.log('⏹️ Máximo de rondas alcanzado, generando respuesta de cierre...')
      const closing = await openai.chat.completions.create({
        model: config.modelo,
        messages: conversation,
        ...buildTemperatureParam(config.modelo, config.temperature),
        ...buildTokensParam(config.max_tokens),
        ...buildReasoningForTools(config.modelo)
      })
      finalResponse = closing.choices[0].message.content || ''
      totalTokens += closing.usage?.total_tokens || 0
    }

    // Deduplicar y recortar: no pegar el corredor si pregunta por una
    const vistos = new Set<string>()
    const areasBrutas: AreaResumen[] = []
    for (const a of todasLasAreas) {
      if (a && (a as any).id && !vistos.has((a as any).id)) {
        vistos.add((a as any).id)
        areasBrutas.push(a)
      }
    }
    if (areaEnMapa?.id && preguntaConcreta && !areasBrutas.some((a) => a.id === areaEnMapa.id)) {
      const delPin =
        areaEnMapa.fichaBase === '/taller'
          ? await getTallerDetails(areaEnMapa.id)
          : (await getAreaDetails(areaEnMapa.id)) || (await getTallerDetails(areaEnMapa.id))
      if (delPin) areasBrutas.unshift(delPin as AreaResumen)
    }
    const hiloPideSinCamping =
      pideSinCamping(ultimoMensajeUsuario) ||
      messages.some((m: any) => m.role === 'user' && pideSinCamping(String(m.content || '')))
    const areasFiltradas = hiloPideSinCamping
      ? areasBrutas.filter((a) => a.tipo_area !== 'camping')
      : areasBrutas
    const areasEncontradas = elegirAreasParaTarjetas(
      finalResponse || '',
      areasFiltradas,
      ultimoMensajeUsuario,
      3
    )

    if (finalResponse) {
      finalResponse = areasEncontradas.length
        ? componerRespuestaConFichas(finalResponse, areasEncontradas, idiomaRespuesta)
        : sanitizarRespuestaChat(finalResponse, areasFiltradas)
    }

    const functionName = firstFunctionName
    const functionArgs = firstFunctionArgs

    if (functionName) {

      console.log('✅ Respuesta final generada')
      console.log('📊 Total tokens:', totalTokens)
      
      // Guardar en base de datos (si hay conversacionId)
      if (conversacionId) {
        console.log('💾 Guardando mensaje en BD...')
        
        const { error: insertError } = await (supabase as any)
          .from('chatbot_mensajes')
          .insert({
            conversacion_id: conversacionId,
            rol: 'assistant',
            contenido: finalResponse,
            tokens_usados: totalTokens,
            modelo_usado: config.modelo,
            temperatura_usada: config.temperature,
            function_call_name: functionName,
            function_call_args: functionArgs,
            function_call_result: lastFunctionResult,
            areas_mencionadas: areasEncontradas?.map((a: any) => a.id) || []
          })
        
        if (insertError) {
          console.error('⚠️ Error guardando mensaje:', insertError)
        } else {
          console.log('✅ Mensaje guardado')
        }
        
        // Actualizar conversación
        const { data: conversacion } = await (supabase as any)
          .from('chatbot_conversaciones')
          .select('total_mensajes')
          .eq('id', conversacionId)
          .single()
        
        await (supabase as any)
          .from('chatbot_conversaciones')
          .update({
            ultimo_mensaje_at: new Date().toISOString(),
            total_mensajes: (conversacion?.total_mensajes || 0) + 1
          })
          .eq('id', conversacionId)
      }
      
      // Analytics
      await (supabase as any).from('chatbot_analytics').insert({
        conversacion_id: conversacionId,
        evento: 'function_call',
        categoria: 'busqueda',
        detalles: {
          function_name: functionName,
          args: functionArgs,
          results_count: areasEncontradas.length
        }
      })
      
      const duration = Date.now() - startTime
      console.log(`⏱️ Duración total: ${duration}ms`)

      // Registro para revisión (TODAS las respuestas, también anónimas)
      const logId = await logRespuesta(supabase, {
        conversacion_id: conversacionId || null,
        user_id: userId || null,
        locale: locale || 'es',
        pregunta: messages[messages.length - 1]?.content || null,
        respuesta: finalResponse,
        funciones: funcionesEjecutadas,
        areas_ids: areasEncontradas.map((a: any) => a.id),
        tokens: totalTokens,
        modelo: config.modelo,
        duracion_ms: duration,
      })

      return responder({
        message: finalResponse,
        conversacionId: conversacionId,
        logId,
        functionCalled: functionName,
        functionArgs: functionArgs,
        areas: areasEncontradas,
        tokensUsados: totalTokens,
        modelo: config.modelo,
        duration: duration,
        guest,
      })
    }
    
    // RESPUESTA DIRECTA (sin tool calls)
    console.log('💬 Respuesta directa (sin tool calls)')

    // Guardar mensaje
    if (conversacionId) {
      await (supabase as any)
        .from('chatbot_mensajes')
        .insert({
          conversacion_id: conversacionId,
          rol: 'assistant',
          contenido: finalResponse,
          tokens_usados: totalTokens,
          modelo_usado: config.modelo,
          temperatura_usada: config.temperature
        })

      const { data: conversacionFinal } = await (supabase as any)
        .from('chatbot_conversaciones')
        .select('total_mensajes')
        .eq('id', conversacionId)
        .single()

      await (supabase as any)
        .from('chatbot_conversaciones')
        .update({
          ultimo_mensaje_at: new Date().toISOString(),
          total_mensajes: (conversacionFinal?.total_mensajes || 0) + 1
        })
        .eq('id', conversacionId)
    }

    const duration = Date.now() - startTime
    console.log(`⏱️ Duración total: ${duration}ms`)

    // Registro para revisión (TODAS las respuestas, también anónimas)
    const logId = await logRespuesta(supabase, {
      conversacion_id: conversacionId || null,
      user_id: userId || null,
      locale: locale || 'es',
      pregunta: messages[messages.length - 1]?.content || null,
      respuesta: finalResponse,
      funciones: funcionesEjecutadas,
      areas_ids: [],
      tokens: totalTokens,
      modelo: config.modelo,
      duracion_ms: duration,
    })

    return responder({
      message: finalResponse,
      conversacionId: conversacionId,
      logId,
      tokensUsados: totalTokens,
      modelo: config.modelo,
      duration: duration,
      guest,
    })
    
  } catch (error: any) {
    console.error('❌ [CHATBOT] Error general:', error)
    console.error('❌ [CHATBOT] Error message:', error.message)
    console.error('❌ [CHATBOT] Error stack:', error.stack)
    console.error('❌ [CHATBOT] Error completo:', JSON.stringify(error, null, 2))
    
    // Errors específicos de OpenAI
    if (error.status === 401) {
      return NextResponse.json({
        error: 'API Key de OpenAI inválida',
        details: 'Verifica OPENAI_API_KEY en las variables de entorno'
      }, { status: 401 })
    }
    
    if (error.status === 429) {
      return NextResponse.json({
        error: 'Límite de OpenAI alcanzado',
        details: 'Has superado tu cuota. Espera unos minutos o aumenta tu límite.'
      }, { status: 429 })
    }
    
    if (error.status === 400) {
      return NextResponse.json({
        error: 'Petición inválida a OpenAI',
        details: error.message || 'Verifica los parámetros'
      }, { status: 400 })
    }
    
    // Error genérico - Seguro para producción
    return NextResponse.json({
      error: 'Error interno del servidor',
      message: 'Estamos trabajando en solucionarlo. Por favor, inténtalo de nuevo en unos momentos.',
      support: 'Si el problema persiste, contacta con info@furgocasa.com',
      timestamp: new Date().toISOString(),
      // Solo en desarrollo: mostrar detalles técnicos
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          message: error.message,
          name: error.name,
          code: error.code,
          stack: error.stack
        }
      })
    }, { status: 500 })
  }
}

// ============================================
// ENDPOINT GET (info)
// ============================================

export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

  return NextResponse.json({
    service: 'Chatbot Furgocasa',
    version: '2.5',
    status: hasOpenAI ? 'active' : 'error',
    openai_configured: hasOpenAI,
    supabase_configured: hasSupabase,
    endpoints: {
      POST: '/api/chatbot - Enviar mensaje al chatbot',
      PATCH: '/api/chatbot - Voto 👍/👎 de una respuesta (logId)'
    },
    functions: AVAILABLE_FUNCTIONS.map((f: any) => ({
      name: f.name,
      description: f.description
    }))
  })
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Voto del usuario sobre una respuesta ya entregada. Anónimos también. */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const logId = typeof body.logId === 'string' ? body.logId.trim() : ''
    const voto = body.voto === 'up' || body.voto === 'down' ? body.voto : body.voto === null ? null : undefined

    if (!UUID_RE.test(logId) || voto === undefined) {
      return NextResponse.json({ error: 'logId y voto (up|down|null) son requeridos' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const { data, error } = await (supabase as any)
      .from('chatbot_respuestas_log')
      .update({
        voto_usuario: voto,
        votado_at: voto ? new Date().toISOString() : null,
      })
      .eq('id', logId)
      .select('id, voto_usuario')
      .maybeSingle()

    if (error) {
      logger.warn('No se pudo guardar voto del chatbot', { error: error.message })
      return NextResponse.json({ error: 'No se pudo guardar el voto' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Respuesta no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, voto: data.voto_usuario })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'No se pudo guardar el voto' }, { status: 500 })
  }
}

