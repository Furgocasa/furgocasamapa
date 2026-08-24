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
  searchAreasAlongRoute,
  buscarInfoViajeWeb,
  serializeToolResultForModel,
  esGpsValido,
  sanitizarRespuestaChat,
  componerRespuestaConFichas,
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
import { clientIp, consumeGuestQuestion, huellaDeIp, GUEST_QUESTION_LIMIT } from '@/lib/chatbot/guest-quota'
import { clasificarIntencion, extraerSitioNombrado, textoAtajoIntencion } from '@/lib/chatbot/intencion'

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
    description: 'Busca áreas de autocaravanas según múltiples criterios. Retorna hasta 10 resultados. USAR SIEMPRE que el usuario pregunte por áreas, ubicaciones, servicios o precios. NO sirve para gasolineras, restaurantes ni hoteles.',
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
    description: 'Busca un área CONCRETA por su nombre. Usar cuando el usuario menciona un área específica: "háblame del área de Ronda", "el área municipal de Zafra".',
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
          default: 5
        }
      },
      required: ['nombre']
    }
  },
  {
    name: 'search_areas_along_route',
    description: 'OBLIGATORIA para cualquier pregunta de ruta/paradas entre dos ciudades (ES/EN/FR/DE/IT). Ej: "voy de Madrid a Valencia", "Driving X to Y, where to stop?", "dónde paro de A a B". NUNCA respondas solo redirigiendo a /ruta: primero llama a esta función y lista paradas concretas.',
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
    name: 'buscar_info_viaje',
    description:
      'Búsqueda web SOLO para lo práctico del camino que NO está en el catálogo: gasolineras / diésel / taller de emergencia. ' +
      'Ej: "hay gasolinera entre Madrid y Valencia". ' +
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
  ubicacionUsuario?: {
    lat: number
    lng: number
  }
  userId?: string
  locale?: string // idioma de la interfaz del usuario (es, fr, de, it, en...)
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
  return /\b(gasolinera|gasolineras|gasolina|di[eé]sel|petrol|tankstelle|station.?service|talleres?\b)/i.test(mensaje)
}

function pideAreasEnMensaje(mensaje: string): boolean {
  return /\b(area|área|areas|áreas|stellplatz|sosta|aire camping|pernoct|autocaravana|camper park)\b/i.test(mensaje || '')
}

function detectarPreguntaRuta(mensaje: string): boolean {
  if (!mensaje || typeof mensaje !== 'string') return false
  if (esPreguntaFueraCatalogo(mensaje) && !pideAreasEnMensaje(mensaje)) return false
  const t = mensaje.trim()
  // "Driving Madrid to Valencia, where to stop?" / "voy de X a Y" / "de X a Y dónde paro"
  const patrones = [
    /\b(?:driving|drive|voy|vamos|ir|ruta|route|trayecto)\b.+\b(?:to|a|hacia|→|->)\b.+/i,
    /\b(?:from|de|desde)\s+(?:aqu[ií]|aca|acá|here|hier|qui|[A-Za-zÀ-ÿ][\wÀ-ÿ\s.'-]{1,40})\s+(?:to|a|hacia)\s+[A-Za-zÀ-ÿ][\wÀ-ÿ\s.'-]{1,40}/i,
    /\b(?:where to stop|d[oó]nde paro|donde parar|paradas?\s+entre|stop(?:s)?\s+along|áreas?\s+de\s+camino)\b/i,
    /\b[A-Za-zÀ-ÿ][\wÀ-ÿ.'-]{2,30}\s+(?:to|→|->|–|-)\s+[A-Za-zÀ-ÿ][\wÀ-ÿ.'-]{2,30}.{0,40}\b(?:stop|paro|parar|paradas?)\b/i,
  ]
  return patrones.some((re) => re.test(t))
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
    let { messages, conversacionId, ubicacionUsuario, locale } = body
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
    const huella = huellaDeIp(ip)
    let guest: { used: number; limit: number; remaining: number } | undefined
    
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
    const atajo = clasificarIntencion({
      ultimo: ultimoMensajeUsuario,
      previosUsuario: messages
        .filter((m: any) => m.role === 'user')
        .slice(0, -1)
        .map((m: any) => m.content),
      ultimoAsistente: [...messages].reverse().find((m: any) => m.role === 'assistant')?.content || null,
    })
    if (atajo) {
      const message = textoAtajoIntencion(
        atajo,
        idiomaAtajo,
        atajo === 'ambigua' ? extraerSitioNombrado(ultimoMensajeUsuario) : undefined
      )
      logger.info('Respuesta corta sin modelo', { atajo, pregunta: ultimoMensajeUsuario.slice(0, 80) })
      const logId = await logRespuesta(supabase, {
        conversacion_id: conversacionId || null,
        user_id: userId || null,
        locale: idiomaAtajo,
        pregunta: ultimoMensajeUsuario,
        respuesta: message,
        funciones: [
          ...(userId ? [] : [{ name: '_cliente', args: { huella } }]),
          { name: '_intencion', args: { tipo: atajo } },
        ],
        areas_ids: [],
        tokens: 0,
        modelo: 'atajo',
        duracion_ms: Date.now() - startTime,
      })
      return NextResponse.json({
        message,
        conversacionId: conversacionId || null,
        logId,
        modelo: 'atajo',
        duration: Date.now() - startTime,
        guest,
      })
    }

    if (!userId) {
      const quota = await consumeGuestQuestion(supabase, huella)
      guest = { used: quota.used, limit: quota.limit, remaining: quota.remaining }
      if (!quota.allowed) {
        logger.warn('Cupo anónimo del chatbot agotado', { huella, used: quota.used })
        return NextResponse.json({
          error: 'LOGIN_REQUIRED',
          errorType: 'LOGIN_REQUIRED',
          message: `Has usado tus ${GUEST_QUESTION_LIMIT} preguntas gratis. Entra o crea una cuenta para seguir.`,
          loginUrl: '/auth/login',
          registerUrl: '/auth/register',
          guest,
        }, { status: 403 })
      }
    }

    // Crear hilo para registrados y anónimos (el admin agrupa por conversacion_id)
    if (!conversacionId) {
      const primerMensaje = [...messages].reverse().find((m: any) => m.role === 'user')?.content || ''
      const fila: Record<string, any> = {
        sesion_id: userId || crypto.randomUUID(),
        titulo: String(primerMensaje).trim().slice(0, 80) || 'Nueva conversación',
        ubicacion_usuario: ubicacionUsuario || null,
        total_mensajes: 0,
        preferencias_detectadas: {},
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
      : null
    const paisGps = ubicacionDetectada?.country && ubicacionDetectada.country !== 'Desconocida'
      ? ubicacionDetectada.country
      : null
    const ubicacionLog = {
      ciudad: ciudadGps,
      pais: paisGps,
      lat: ubicacionUsuario?.lat ?? null,
      lng: ubicacionUsuario?.lng ?? null,
    }
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
1. Cuando el usuario pregunte por "áreas cerca", "áreas aquí", "cerca de mí", o no mencione ciudad específica → USA su ubicación GPS (${ubicacionDetectada.city})
2. "De aquí a X", "desde aquí", "from here to X": el origen ES ${ubicacionDetectada.city}. NUNCA pases origen="aquí".
3. Recuerda el hilo: si ya hablasteis de un área o una ciudad, "esa", "la de antes" y "desde aquí" apuntan a eso o al GPS.
4. Si el usuario menciona EXPLÍCITAMENTE otra ciudad ("áreas en Barcelona"), IGNORA su GPS y busca en esa ciudad
5. Siempre incluye las distancias cuando uses búsqueda por GPS (el campo "distancia_km" estará disponible)
6. Radio de búsqueda:
   - Si dice "cerca", "aquí", "cerca de mí" → Radio 10-20km
   - Si es genérico ("áreas", "buscar") → Radio 50km
   - Si menciona ciudad específica → Búsqueda por nombre de ciudad (sin radio)`
    }

    const ciudadGpsTxt = ciudadGps || 'desconocida'
    systemPromptEnriquecido += `\n\n═══════════════════════════════════════
🧠 MEMORIA DEL HILO (OBLIGATORIO)
═══════════════════════════════════════
El Tío DEBE usar las últimas frases de ESTA conversación. No empieces de cero.
${hiloModelo.slice(-8).map((m) => `- ${m.role === 'user' ? 'Usuario' : 'Tío'}: ${m.content.slice(0, 220)}`).join('\n') || '- (primer mensaje)'}
- GPS (dónde está físicamente): ${ciudadGpsTxt}
- Ciudades ya dichas en el hilo: ${ciudadesHilo.join(', ') || '(ninguna aún)'}
- "aquí / cerca de mí / donde estoy" → GPS (${ciudadGpsTxt}).
- "allí / esa / la de antes / y ahora a X" → el hilo (${ciudadHilo || ciudadGpsTxt}).
GPS y memoria se complementan: pueden no ser el mismo sitio. Ubicar se hace con las dos.`
    
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
- Si el usuario pregunta paradas/ruta entre dos ciudades → llama SIEMPRE a search_areas_along_route.
- /ruta es complemento OPCIONAL después de listar paradas, NUNCA la única respuesta.
- Servicios: SOLO los que estén en true (ej: "Agua, Electricidad"). NUNCA "[agua: no, ...]".
- Valoración: "⭐ 4.7/5 (128 valoraciones)" si hay nº de reseñas. No digas "5 estrellas" sin volumen.
- Links: solo /area/{slug}. Prohibido Google Maps e imágenes markdown.

═══════════════════════════════════════
✅ CALIDAD DE DATOS (OBLIGATORIO)
═══════════════════════════════════════
- PRECIO: Solo di "Gratis" si el resumen o precio_noche es 0. Si dice "Precio no disponible" o precio_noche es null, escribe exactamente eso. NUNCA conviertas un precio desconocido en gratis.
- FICHAS: pega el campo "resumen" de cada área TAL CUAL. No reescribas precio, servicios ni enlaces. Prohibido autocaravanas.com, example.com y Google Maps.
- FILTROS: Si el usuario nombra solo una ciudad DESPUÉS de haber pedido áreas/servicios, busca ahí SIN heredar filtros viejos.
- TIPO: solo tres. publica = ayuntamiento/organismo. privada = empresa/particular (camper park, granja, Weingut, CL, Brit Stop). camping = recinto. No existe la categoría stopover. En cada país la gente usa otro nombre (aire, sosta, Stellplatz, camperplaats, motorhome aire, trailer park): eso es etiqueta. Un "parking autocaravanas" del pueblo es pública. UK: touring park = camping; CL/aire de anfitrión = privada; Arosfan = pública.
- CERCA DE MÍ: si no hay GPS válido en este mensaje, pide la ciudad. No busques en todo el mundo ni inventes una ubicación.
- NO eres una guía turística. Si piden qué ver, pueblos, planes o itinerarios, NO inventes una guía y NO uses buscar_info_viaje. Di que no cubres eso y enlaza https://www.furgocasa.com/es/blog?category=rutas
- Si piden áreas/gasolinera Y además turismo: responde SOLO la parte de áreas/gasolinera y manda el turismo al blog de Furgocasa.
- Gasolinera o taller de emergencia: buscar_info_viaje. Di que es info de la web, no una ficha /area/. Prohibido restaurantes, hoteles, monumentos y "qué ver".
- example.com u otras URLs inventadas: prohibido. Solo /area/{slug}.
- Idioma: último mensaje del cliente. TODO en ese idioma (intro y etiquetas). Las fichas "resumen" ya están traducidas.`
    
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
    const parecePreguntaRuta = detectarPreguntaRuta(ultimoMensajeUsuario)
    const pareceFueraCatalogo =
      esPreguntaFueraCatalogo(ultimoMensajeUsuario) && !pideAreasEnMensaje(ultimoMensajeUsuario)

    while (rounds < MAX_TOOL_ROUNDS) {
      rounds++
      console.log(`🔮 Llamando a OpenAI (ronda ${rounds})...`)

      const toolChoice: OpenAI.Chat.ChatCompletionToolChoiceOption =
        rounds === 1 && parecePreguntaRuta && !firstFunctionName
          ? { type: 'function', function: { name: 'search_areas_along_route' } }
          : rounds === 1 && pareceFueraCatalogo && !firstFunctionName
            ? { type: 'function', function: { name: 'buscar_info_viaje' } }
            : 'auto'

      if (toolChoice !== 'auto') {
        console.log(
          parecePreguntaRuta
            ? '🛣️ Forzando search_areas_along_route por detección de ruta'
            : '🌐 Forzando buscar_info_viaje (fuera de catálogo)'
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
        }
        funcionesEjecutadas.push({ name: fnName, args: fnArgs })

        // Inyectar GPS del usuario si busca sin ubicación explícita
        if (
          ubicacionUsuario &&
          esGpsValido(ubicacionUsuario.lat, ubicacionUsuario.lng) &&
          fnName === 'search_areas' &&
          !fnArgs.ubicacion?.lat &&
          !fnArgs.ubicacion?.nombre
        ) {
          console.log('📍 Inyectando ubicación del usuario')
          fnArgs.ubicacion = {
            ...fnArgs.ubicacion,
            lat: ubicacionUsuario.lat,
            lng: ubicacionUsuario.lng,
            radio_km: fnArgs.ubicacion?.radio_km || config.radio_busqueda_default_km || 50
          }
        }

        let functionResult: any
        try {
          console.log(`⚡ Ejecutando ${fnName}:`, JSON.stringify(fnArgs))
          switch (fnName) {
            case 'search_areas':
              functionResult = await searchAreas(fnArgs as BusquedaAreasParams)
              if (Array.isArray(functionResult)) todasLasAreas.push(...functionResult)
              break
            case 'get_area_details':
              functionResult = await getAreaDetails(fnArgs.area_id)
              break
            case 'get_areas_by_country':
              functionResult = await getAreasByCountry(fnArgs.pais, fnArgs.limit || 10)
              if (Array.isArray(functionResult)) todasLasAreas.push(...functionResult)
              break
            case 'get_area_by_name':
              functionResult = await buscarAreasPorNombre(fnArgs.nombre, fnArgs.limit || 5)
              if (Array.isArray(functionResult)) todasLasAreas.push(...functionResult)
              break
            case 'search_areas_along_route':
              fnArgs.origen = resolverLugarRelativo(fnArgs.origen, ciudadGps, ciudadHilo)
              fnArgs.destino = resolverLugarRelativo(fnArgs.destino, ciudadGps, ciudadHilo)
              functionResult = await searchAreasAlongRoute(fnArgs.origen, fnArgs.destino, fnArgs.corredor_km || 15)
              if (functionResult?.areas) todasLasAreas.push(...functionResult.areas)
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

    // Deduplicar áreas por id para las tarjetas del chat
    const vistos = new Set<string>()
    const areasEncontradas: AreaResumen[] = []
    for (const a of todasLasAreas) {
      if (a && (a as any).id && !vistos.has((a as any).id)) {
        vistos.add((a as any).id)
        areasEncontradas.push(a)
      }
    }

    if (finalResponse) {
      finalResponse = areasEncontradas.length
        ? componerRespuestaConFichas(finalResponse, areasEncontradas, idiomaRespuesta)
        : sanitizarRespuestaChat(finalResponse, areasEncontradas)
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
        ciudad: ubicacionLog.ciudad,
        pais: ubicacionLog.pais,
        lat: ubicacionLog.lat,
        lng: ubicacionLog.lng,
      })

      return NextResponse.json({
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
      ciudad: ubicacionLog.ciudad,
      pais: ubicacionLog.pais,
      lat: ubicacionLog.lat,
      lng: ubicacionLog.lng,
    })

    return NextResponse.json({
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

