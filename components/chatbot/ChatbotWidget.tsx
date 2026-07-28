'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatErrorForUser } from '@/lib/chatbot/errors'
import { track } from '@/lib/analytics/track'
import { useLanguage } from '@/lib/i18n'

interface Message {
  rol: 'user' | 'assistant'
  contenido: string
  areas?: any[]
}

// Textos del widget y mensajes prefijados por idioma
const TEXTOS: Record<string, {
  bienvenida: string
  sugerencias: string[]
  placeholder: string
  enviar: string
  ubicacionDetectada: string
}> = {
  es: {
    bienvenida: '¡Hola! 👋 Soy el Tío Viajero IA. Pregúntame por áreas, servicios, precios o paradas de ruta. ¿Por dónde empezamos?',
    sugerencias: [
      '🆓 Áreas gratis cerca de mí',
      '⭐ Las mejores áreas de España',
      '🛣️ Voy de Madrid a Valencia, ¿dónde paro?',
      '💧 Áreas con agua y electricidad',
      '🐕 Áreas que admiten mascotas'
    ],
    placeholder: 'Pregunta al Tío Viajero...',
    enviar: 'Enviar',
    ubicacionDetectada: '📍 Ubicación detectada · Las búsquedas serán más precisas'
  },
  en: {
    bienvenida: "Hi! 👋 I'm Tío Viajero AI. Ask me about motorhome areas, services, prices or route stops. Where shall we start?",
    sugerencias: [
      '🆓 Free areas near me',
      '⭐ Best areas in Spain',
      '🛣️ Driving Madrid to Valencia, where to stop?',
      '💧 Areas with water and electricity',
      '🐕 Pet-friendly areas'
    ],
    placeholder: 'Ask Tío Viajero...',
    enviar: 'Send',
    ubicacionDetectada: '📍 Location detected · Searches will be more accurate'
  },
  fr: {
    bienvenida: "Salut ! 👋 Je suis Tío Viajero IA. Demandez-moi des aires, services, prix ou étapes d'itinéraire. On commence ?",
    sugerencias: [
      '🆓 Aires gratuites près de moi',
      '⭐ Meilleures aires en Espagne',
      '🛣️ De Madrid à Valence, où m\'arrêter ?',
      '💧 Aires avec eau et électricité',
      '🐕 Aires acceptant les animaux'
    ],
    placeholder: 'Demandez à Tío Viajero...',
    enviar: 'Envoyer',
    ubicacionDetectada: '📍 Position détectée · Recherches plus précises'
  },
  de: {
    bienvenida: 'Hallo! 👋 Ich bin Tío Viajero KI. Frag mich nach Stellplätzen, Services, Preisen oder Routenstopps. Womit fangen wir an?',
    sugerencias: [
      '🆓 Kostenlose Stellplätze in meiner Nähe',
      '⭐ Beste Stellplätze in Spanien',
      '🛣️ Von Madrid nach Valencia — wo halten?',
      '💧 Stellplätze mit Wasser und Strom',
      '🐕 Haustierfreundliche Stellplätze'
    ],
    placeholder: 'Frag Tío Viajero...',
    enviar: 'Senden',
    ubicacionDetectada: '📍 Standort erkannt · Genauere Suche'
  },
  it: {
    bienvenida: 'Ciao! 👋 Sono Tío Viajero IA. Chiedimi aree, servizi, prezzi o soste lungo il percorso. Da dove iniziamo?',
    sugerencias: [
      '🆓 Aree gratuite vicino a me',
      '⭐ Le migliori aree in Spagna',
      '🛣️ Da Madrid a Valencia, dove fermarmi?',
      '💧 Aree con acqua ed elettricità',
      '🐕 Aree che accettano animali'
    ],
    placeholder: 'Chiedi a Tío Viajero...',
    enviar: 'Invia',
    ubicacionDetectada: '📍 Posizione rilevata · Ricerche più precise'
  }
}

export default function ChatbotWidget() {
  const { locale } = useLanguage()
  const txt = TEXTOS[locale] || TEXTOS.es
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [conversacionId, setConversacionId] = useState<string | null>(null)
  const [ubicacion, setUbicacion] = useState<{lat: number, lng: number} | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Comprobar autenticación
  useEffect(() => {
    const supabase = createClient()
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])
  
  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Función para convertir URLs en links clicables
  const renderMessageWithLinks = (text: string) => {
    // Detectar URLs de Google Maps
    const googleMapsRegex = /(Ver en Google Maps:\s*)(https:\/\/(?:www\.)?google\.com\/maps[^\s)]+)/gi;
    
    // Si no hay URLs, retornar texto normal
    if (!googleMapsRegex.test(text)) {
      return <span className="whitespace-pre-wrap">{text}</span>;
    }

    // Dividir el texto por URLs de Google Maps
    const parts = text.split(/(Ver en Google Maps:\s*https:\/\/(?:www\.)?google\.com\/maps[^\s)]+)/gi);
    
    return (
      <span className="whitespace-pre-wrap">
        {parts.map((part: any, index: any) => {
          const match = part.match(/Ver en Google Maps:\s*(https:\/\/(?:www\.)?google\.com\/maps[^\s)]+)/i);
          
          if (match) {
            const url = match[1];
            return (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline font-medium"
              >
                🗺️ Ver en Google Maps
              </a>
            );
          }
          
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  }
  
  // Obtener geolocalización (también para usuarios sin cuenta)
  useEffect(() => {
    if (isOpen && !ubicacion) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUbicacion({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
            console.log('📍 Ubicación obtenida:', position.coords.latitude, position.coords.longitude)
          },
          (error) => {
            console.log('⚠️ No se pudo obtener ubicación:', error)
          }
        )
      }
    }
  }, [isOpen, ubicacion])

  // Iniciar conversación (abierta a todos, con o sin cuenta)
  const iniciarConversacion = async () => {
    // Mensaje de bienvenida inmediato (en el idioma del usuario)
    setMessages([{
      rol: 'assistant',
      contenido: txt.bienvenida
    }])

    // La conversación se creará en el API al enviar el primer mensaje
  }

  // Abrir chat
  const handleOpen = () => {
    setIsOpen(true)
    setIsMinimized(false)
    setIsHidden(false)
    track('chatbot_open', { event_data: { autenticado: Boolean(user) } })
    if (messages.length === 0) {
      iniciarConversacion()
    }
  }
  
  // Minimizar chat
  const handleMinimize = () => {
    setIsMinimized(true)
  }
  
  // Expandir chat desde minimizado
  const handleExpand = () => {
    setIsMinimized(false)
  }
  
  // Ocultar avatar temporalmente
  const handleHide = () => {
    setIsHidden(true)
    setIsOpen(false)
    setIsMinimized(false)
  }
  
  // Mostrar avatar de nuevo
  const handleShow = () => {
    setIsHidden(false)
  }
  
  // Enviar mensaje (texto opcional para los mensajes prefijados)
  const enviarMensaje = async (textoPrefijado?: string) => {
    const texto = (textoPrefijado ?? input).trim()
    if (!texto || sending) return

    const userMessage: Message = { rol: 'user', contenido: texto }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSending(true)

    track('chatbot_message', {
      event_data: {
        longitud: userMessage.contenido.length,
        es_primer_mensaje: messages.length === 0,
        tiene_ubicacion: Boolean(ubicacion),
      },
    })
    
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map((m: any) => ({ 
            role: m.rol, 
            content: m.contenido 
          })),
          conversacionId,
          ubicacionUsuario: ubicacion,
          userId: user?.id || undefined, // Con cuenta: se guarda el historial
          locale // La IA responde en el idioma de la interfaz
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error API:', errorData)
        throw new Error(errorData.error || 'Error en la respuesta')
      }
      
      const data = await response.json()
      
      // Si es el primer mensaje y retorna conversacionId, guardarlo
      if (data.conversacionId && !conversacionId) {
        setConversacionId(data.conversacionId)
      }
      
      setMessages(prev => [...prev, {
        rol: 'assistant',
        contenido: data.message,
        areas: data.areas
      }])
    } catch (error: any) {
      console.error('Error:', error)
      
      // Usar mensaje de error amigable y específico
      const errorMessage = formatErrorForUser(error)
      
      setMessages(prev => [...prev, {
        rol: 'assistant',
        contenido: errorMessage
      }])
    } finally {
      setSending(false)
    }
  }
  
  // Loading inicial
  if (loading) {
    return null
  }

  // El Tío Viajero es PÚBLICO: sin cuenta también funciona (rate limit por IP).
  // Con cuenta, además, se guarda el historial de conversaciones.

  return (
    <>
      {/* Botón pequeño para mostrar avatar cuando está oculto */}
      {isHidden && (
        <button
          onClick={handleShow}
          className="fixed bottom-24 right-6 md:bottom-6 bg-blue-600 text-white rounded-full w-8 h-8 shadow-lg hover:bg-blue-700 transition-all z-50 flex items-center justify-center text-xl font-bold"
          title="Mostrar Tío Viajero IA"
        >
          +
        </button>
      )}

      {/* Botón flotante con avatar - cuando el chat está cerrado */}
      {!isOpen && !isHidden && (
        <div className="fixed bottom-24 right-6 md:bottom-6 z-50 group">
          <button
            onClick={handleOpen}
            className="bg-gradient-to-r from-blue-600 to-gray-700 rounded-full p-2 shadow-2xl hover:scale-110 transition-transform relative"
            title="Tío Viajero IA"
          >
            <img 
              src="/tio-viajero-avatar.png" 
              alt="Tío Viajero IA" 
              className="w-14 h-14 object-cover rounded-full border-2 border-white"
            />
            {/* Badge "IA" */}
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
              IA
            </span>
          </button>
          {/* Botón minimizar superpuesto */}
          <button
            onClick={handleHide}
            className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors shadow-lg"
            title="Ocultar temporalmente"
          >
            −
          </button>
        </div>
      )}
      
      {/* Avatar minimizado con botón de expandir */}
      {isOpen && isMinimized && !isHidden && (
        <div className="fixed bottom-24 right-6 md:bottom-6 z-50 group">
          <button
            onClick={handleExpand}
            className="bg-gradient-to-r from-blue-600 to-gray-700 rounded-full p-2 shadow-2xl hover:scale-110 transition-transform relative"
            title="Expandir Tío Viajero IA"
          >
            <img 
              src="/tio-viajero-avatar.png" 
              alt="Tío Viajero IA" 
              className="w-14 h-14 object-cover rounded-full border-2 border-white"
            />
            {/* Badge "IA" */}
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
              IA
            </span>
          </button>
          {/* Botón ocultar superpuesto */}
          <button
            onClick={handleHide}
            className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors shadow-lg"
            title="Ocultar temporalmente"
          >
            −
          </button>
        </div>
      )}
      
      {/* Ventana del chat */}
      {isOpen && !isMinimized && !isHidden && (
        <div className="fixed bottom-24 right-6 md:bottom-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-gray-700 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img 
                src="/tio-viajero-avatar.png" 
                alt="Tío Viajero IA" 
                className="w-10 h-10 object-cover rounded-full border-2 border-white"
              />
              <div>
                <h3 className="font-bold">
                  Tío Viajero IA
                </h3>
                <p className="text-xs opacity-90">IA · Respuestas en tiempo real</p>
              </div>
            </div>
            <button 
              onClick={handleMinimize} 
              className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors text-2xl font-bold leading-none pb-1"
              title="Minimizar"
            >
              −
            </button>
          </div>
          
          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg: any, i: any) => (
              <div key={i} className={`flex ${msg.rol === 'user' ? 'justify-end' : 'justify-start gap-2'}`}>
                {/* Avatar del Tío Viajero para mensajes del asistente */}
                {msg.rol === 'assistant' && (
                  <img 
                    src="/tio-viajero-avatar.png" 
                    alt="Tío Viajero IA" 
                    className="w-8 h-8 object-cover rounded-full border-2 border-blue-500 flex-shrink-0 mt-1"
                  />
                )}
                
                <div className={`max-w-[80%] rounded-2xl p-3 ${
                  msg.rol === 'user' 
                    ? 'bg-gradient-to-r from-blue-600 to-gray-700 text-white' 
                    : 'bg-white text-gray-900 shadow-md border border-blue-100'
                }`}>
                  <div className="text-sm leading-relaxed">
                    {renderMessageWithLinks(msg.contenido)}
                  </div>
                  
                  {/* Tarjetas de áreas encontradas */}
                  {msg.areas && msg.areas.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.areas.slice(0, 6).map((area: any) => {
                        const foto = Array.isArray(area.fotos_urls) && area.fotos_urls.length > 0
                          ? area.fotos_urls[0]
                          : (typeof area.fotos_urls === 'string' && area.fotos_urls.trim().startsWith('http')
                            ? area.fotos_urls.split(',')[0].trim()
                            : null)
                        return (
                          <Link
                            key={area.id}
                            href={`/area/${area.slug}`}
                            target="_blank"
                            className="flex gap-2.5 bg-white hover:bg-sky-50 border border-gray-200 hover:border-sky-300 rounded-xl overflow-hidden transition-all group shadow-sm"
                          >
                            {/* Foto */}
                            <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center overflow-hidden">
                              {foto ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={foto} alt={area.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                              ) : (
                                <span className="text-2xl">🚐</span>
                              )}
                            </div>
                            {/* Datos */}
                            <div className="py-2 pr-2.5 min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 text-xs leading-tight truncate group-hover:text-sky-700">{area.nombre}</p>
                              <p className="text-[11px] text-gray-500 truncate">📍 {area.ciudad}, {area.pais}</p>
                              <div className="flex items-center gap-2 mt-1 text-[11px]">
                                <span className={`font-bold ${(!area.precio_noche || area.precio_noche === 0) ? 'text-green-600' : 'text-gray-800'}`}>
                                  {(!area.precio_noche || area.precio_noche === 0) ? 'Gratis' : `${area.precio_noche}€/noche`}
                                </span>
                                {area.google_rating && (
                                  <span className="text-amber-500 font-medium">★ {Number(area.google_rating).toFixed(1)}</span>
                                )}
                                {area.distancia_km !== undefined && (
                                  <span className="text-gray-500">{Number(area.distancia_km).toFixed(0)} km</span>
                                )}
                                {area.desvio_km !== undefined && (
                                  <span className="text-gray-500">↔ {area.desvio_km} km</span>
                                )}
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Mensajes prefijados (solo al inicio de la conversación) */}
            {!sending && messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {txt.sugerencias.map((sugerencia) => (
                  <button
                    key={sugerencia}
                    onClick={() => enviarMensaje(sugerencia)}
                    className="text-xs bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-400 rounded-full px-3 py-1.5 transition-all active:scale-95 shadow-sm text-left"
                  >
                    {sugerencia}
                  </button>
                ))}
              </div>
            )}

            {sending && (
              <div className="flex justify-start gap-2">
                <img
                  src="/tio-viajero-avatar.png"
                  alt="Tío Viajero IA"
                  className="w-8 h-8 object-cover rounded-full border-2 border-blue-500 flex-shrink-0"
                />
                <div className="bg-white rounded-2xl p-3 shadow-md">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
                placeholder={txt.placeholder}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={sending}
              />
              <button
                onClick={() => enviarMensaje()}
                disabled={sending || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-gray-700 text-white rounded-full px-6 py-2 hover:from-blue-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-md"
              >
                {sending ? '...' : txt.enviar}
              </button>
            </div>
            {ubicacion && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                {txt.ubicacionDetectada}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

