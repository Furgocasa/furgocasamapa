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
  serializeToolResultForModel,
  esGpsValido,
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
import { validateOpenAIModel, buildTokensParam } from '@/lib/openai/model-validation'

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
          description: 'Ciudad de origen. Ejemplo: "Madrid"'
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
function detectarPreguntaRuta(mensaje: string): boolean {
  if (!mensaje || typeof mensaje !== 'string') return false
  const t = mensaje.trim()
  // "Driving Madrid to Valencia, where to stop?" / "voy de X a Y" / "de X a Y dónde paro"
  const patrones = [
    /\b(?:driving|drive|voy|vamos|ruta|route|trayecto)\b.+\b(?:to|a|hacia|→|->)\b.+/i,
    /\b(?:from|de)\s+[A-Za-zÀ-ÿ][\wÀ-ÿ\s.'-]{1,40}\s+(?:to|a|hacia)\s+[A-Za-zÀ-ÿ][\wÀ-ÿ\s.'-]{1,40}/i,
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
async function logRespuesta(supabase: any, datos: Record<string, any>) {
  try {
    const { error } = await supabase.from('chatbot_respuestas_log').insert(datos)
    if (error) logger.warn('No se pudo registrar en chatbot_respuestas_log', { error: error.message })
  } catch (e: any) {
    logger.warn('No se pudo registrar en chatbot_respuestas_log', { error: e?.message })
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
    let { messages, conversacionId, ubicacionUsuario, userId, locale } = body
    if (ubicacionUsuario && !esGpsValido(ubicacionUsuario.lat, ubicacionUsuario.lng)) {
      logger.warn('GPS inválido o Null Island; se ignora', ubicacionUsuario)
      ubicacionUsuario = undefined
    }
    
    // ============================================
    // RATE LIMITING
    // ============================================
    if (ratelimit) {
      const identifier = userId || req.headers.get('x-forwarded-for') || 'anonymous'
      
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
      userId: userId || 'anonymous'
    })
    
    // Validar mensajes
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un mensaje' },
        { status: 400 }
      )
    }
    
    const supabase = getSupabaseClient()
    
    // Si NO hay conversacionId pero SÍ hay userId, crear conversación
    if (!conversacionId && userId) {
      console.log('🆕 Creando nueva conversación...')
      const sesionId = userId || `anon_${Date.now()}`
      
      const { data: nuevaConv, error: convError } = await (supabase as any)
        .from('chatbot_conversaciones')
        .insert({
          user_id: userId,
          sesion_id: sesionId,
          titulo: 'Nueva conversación',
          ubicacion_usuario: ubicacionUsuario || null,
          total_mensajes: 0
        })
        .select()
        .single()
      
      if (convError) {
        console.error('❌ Error creando conversación:', convError)
      } else if (nuevaConv) {
        conversacionId = nuevaConv.id
        console.log('✅ Conversación creada:', conversacionId)
      }
    }
    
    // Guardar mensaje del usuario en BD (si hay conversación)
    if (conversacionId && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1]
      if (lastUserMessage.role === 'user') {
        console.log('💾 Guardando mensaje del usuario...')
        await (supabase as any).from('chatbot_mensajes').insert({
          conversacion_id: conversacionId,
          rol: 'user',
          contenido: lastUserMessage.content
        })
      }
    }
    
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
            .limit(10)
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
2. Si el usuario menciona EXPLÍCITAMENTE otra ciudad ("áreas en Barcelona"), IGNORA su GPS y busca en esa ciudad
3. Siempre incluye las distancias cuando uses búsqueda por GPS (el campo "distancia_km" estará disponible)
4. Radio de búsqueda:
   - Si dice "cerca", "aquí", "cerca de mí" → Radio 10-20km
   - Si es genérico ("áreas", "buscar") → Radio 50km
   - Si menciona ciudad específica → Búsqueda por nombre de ciudad (sin radio)`
    }
    
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

    // Idioma: prioridad al mensaje del usuario; la UI es solo fallback
    {
      const NOMBRES_IDIOMA: Record<string, string> = {
        es: 'español', en: 'inglés', fr: 'francés', de: 'alemán', it: 'italiano', pt: 'portugués', nl: 'neerlandés'
      }
      const nombreUi = NOMBRES_IDIOMA[locale || 'es'] || locale || 'español'
      systemPromptEnriquecido += `\n\n═══════════════════════════════════════
🌍 IDIOMA DE RESPUESTA (PRIORIDAD)
═══════════════════════════════════════
1) PRIORIDAD MÁXIMA: responde en el idioma del ÚLTIMO mensaje del usuario
   (si escribe en español → español; si en inglés → inglés; etc.), aunque la web esté en otro idioma.
2) Solo si el mensaje es ambiguo/emoji/sin texto claro, usa el idioma de la interfaz (${nombreUi}).
3) Los datos de áreas están en español: tradúcelos al idioma de la respuesta.
4) NUNCA mezcles idiomas en la misma respuesta.`
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
- FILTROS: Si el usuario solo nombra una ciudad o país ("Murcia", "Viseu", "Cádiz", "En Tecolutla"), busca SIN heredar servicios, tipo_area ni solo_gratuitas del turno anterior.
- TIPO: solo tres. publica = ayuntamiento/organismo. privada = empresa/particular (camper park, granja, Weingut, CL, Brit Stop). camping = recinto. No existe la categoría stopover. En cada país la gente usa otro nombre (aire, sosta, Stellplatz, camperplaats, motorhome aire, trailer park): eso es etiqueta. Un "parking autocaravanas" del pueblo es pública. UK: touring park = camping; CL/aire de anfitrión = privada; Arosfan = pública.
- CERCA DE MÍ: si no hay GPS válido en este mensaje, pide la ciudad. No busques en todo el mundo ni inventes una ubicación.
- POI turísticos (grutas, catedrales, playas, santuarios): busca áreas CERCA de esa ciudad, no un área con ese nombre. Ej: Gruta de Massabielle → Lourdes.
- Gasolineras, talleres, restaurantes, hoteles: NO están en el catálogo. No llames a search_areas con supermercado. Explica que solo hay áreas de autocaravanas.
- example.com u otras URLs inventadas: prohibido. Solo /area/{slug}.
- Idioma: si el último mensaje está en inglés, portugués, francés, alemán o italiano, responde TODO en ese idioma (también títulos y etiquetas).`
    
    // 5. PREPARAR MENSAJES COMPLETOS
    const fullMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { 
        role: 'system', 
        content: systemPromptEnriquecido 
      },
      // Añadir historial previo
      ...historialPrevio.map((h: any) => ({
        role: h.rol as 'user' | 'assistant',
        content: h.contenido
      })),
      // Añadir nuevos mensajes
      ...messages.map((m: any) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      }))
    ]
    
    console.log(`📝 Total mensajes en contexto: ${fullMessages.length} (system: 1, historial: ${historialPrevio.length}, nuevos: ${messages.length})`)
    
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
    const conversation: OpenAI.Chat.ChatCompletionMessageParam[] = [...fullMessages]
    let finalResponse: string | null = null

    const ultimoMensajeUsuario = [...messages]
      .reverse()
      .find((m: any) => m.role === 'user')?.content || ''
    const parecePreguntaRuta = detectarPreguntaRuta(ultimoMensajeUsuario)

    while (rounds < MAX_TOOL_ROUNDS) {
      rounds++
      console.log(`🔮 Llamando a OpenAI (ronda ${rounds})...`)

      // Primera ronda + pregunta de ruta → forzar search_areas_along_route
      const toolChoice: OpenAI.Chat.ChatCompletionToolChoiceOption =
        rounds === 1 && parecePreguntaRuta && !firstFunctionName
          ? { type: 'function', function: { name: 'search_areas_along_route' } }
          : 'auto'

      if (toolChoice !== 'auto') {
        console.log('🛣️ Forzando search_areas_along_route por detección de ruta')
      }

      const completion = await openai.chat.completions.create({
        model: config.modelo,
        messages: conversation,
        tools,
        tool_choice: toolChoice,
        temperature: config.temperature,
        ...buildTokensParam(config.max_tokens)
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
              functionResult = await searchAreasAlongRoute(fnArgs.origen, fnArgs.destino, fnArgs.corredor_km || 15)
              if (functionResult?.areas) todasLasAreas.push(...functionResult.areas)
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
          content: serializeToolResultForModel(functionResult)
        })
      }
    }

    // Si se agotaron las rondas con tools pendientes, pedir cierre sin herramientas
    if (finalResponse == null) {
      console.log('⏹️ Máximo de rondas alcanzado, generando respuesta de cierre...')
      const closing = await openai.chat.completions.create({
        model: config.modelo,
        messages: conversation,
        temperature: config.temperature,
        ...buildTokensParam(config.max_tokens)
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
      await logRespuesta(supabase, {
        conversacion_id: conversacionId || null,
        user_id: userId || null,
        locale: locale || 'es',
        pregunta: messages[messages.length - 1]?.content || null,
        respuesta: finalResponse,
        funciones: funcionesEjecutadas,
        areas_ids: areasEncontradas.map((a: any) => a.id),
        tokens: totalTokens,
        modelo: config.modelo,
        duracion_ms: duration
      })

      return NextResponse.json({
        message: finalResponse,
        conversacionId: conversacionId, // Retornar conversacionId para que el frontend lo guarde
        functionCalled: functionName,
        functionArgs: functionArgs,
        areas: areasEncontradas,
        tokensUsados: totalTokens,
        modelo: config.modelo,
        duration: duration
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
    await logRespuesta(supabase, {
      conversacion_id: conversacionId || null,
      user_id: userId || null,
      locale: locale || 'es',
      pregunta: messages[messages.length - 1]?.content || null,
      respuesta: finalResponse,
      funciones: [],
      areas_ids: [],
      tokens: totalTokens,
      modelo: config.modelo,
      duracion_ms: duration
    })

    return NextResponse.json({
      message: finalResponse,
      conversacionId: conversacionId, // Retornar conversacionId
      tokensUsados: totalTokens,
      modelo: config.modelo,
      duration: duration
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
    version: '2.4',
    status: hasOpenAI ? 'active' : 'error',
    openai_configured: hasOpenAI,
    supabase_configured: hasSupabase,
    endpoints: {
      POST: '/api/chatbot - Enviar mensaje al chatbot'
    },
    functions: AVAILABLE_FUNCTIONS.map((f: any) => ({
      name: f.name,
      description: f.description
    }))
  })
}

