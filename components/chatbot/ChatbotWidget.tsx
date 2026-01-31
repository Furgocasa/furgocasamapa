'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatErrorForUser } from '@/lib/chatbot/errors'

interface Message {
  rol: 'user' | 'assistant'
  contenido: string
  areas?: any[]
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
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
  
  // Obtener geolocalización
  useEffect(() => {
    if (isOpen && user && !ubicacion) {
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
  }, [isOpen, user, ubicacion])
  
  // Iniciar conversación (ahora lo hace la API)
  const iniciarConversacion = async () => {
    if (!user) return
    
    // Mensaje de bienvenida inmediato
    setMessages([{
      rol: 'assistant',
      contenido: '¡Hola! 👋 Soy el Tío Viajero IA, tu compañero de aventuras en autocaravana. ¿En qué puedo ayudarte hoy?\n\nPuedo ayudarte a:\n🔍 Encontrar áreas para tu autocaravana\n📍 Recomendar las mejores ubicaciones\n💡 Responder dudas sobre servicios y precios\n🌍 Buscar áreas por país o región\n🚐 Consejos para tu viaje\n\n💡 **Tip:** Si quieres planificar una ruta completa, usa nuestra herramienta 🗺️ **Planificador de Rutas** en /ruta\n\n¡Pregúntame lo que necesites! Estoy aquí para ayudarte. 🚐✨'
    }])
    
    // La conversación se creará en el API al enviar el primer mensaje
  }
  
  // Abrir chat
  const handleOpen = () => {
    setIsOpen(true)
    setIsMinimized(false)
    if (user && !conversacionId) {
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
  
  // Enviar mensaje
  const enviarMensaje = async () => {
    if (!input.trim() || sending || !user) return
    
    const userMessage: Message = { rol: 'user', contenido: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSending(true)
    
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
          userId: user.id // Enviar user ID para que la API cree la conversación
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
  
  // MODAL DE BLOQUEO (si no está autenticado)
  if (isOpen && !user) {
    return (
      <>
        {/* Botón difuminado */}
        <button
          onClick={() => setIsOpen(false)}
          className="fixed bottom-24 right-6 md:bottom-6 bg-gradient-to-r from-blue-600 to-gray-700 rounded-full p-2 shadow-2xl z-50 blur-sm"
        >
          <img 
            src="/tio-viajero-avatar.png" 
            alt="Tío Viajero IA" 
            className="w-14 h-14 object-cover rounded-full border-2 border-white"
          />
        </button>
        
        {/* Modal de bloqueo */}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative max-w-md w-full mx-4 bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
            {/* Botón cerrar */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Avatar Tío Viajero */}
            <div className="mx-auto w-24 h-24 mb-4">
              <img 
                src="/tio-viajero-avatar.png" 
                alt="Tío Viajero IA" 
                className="w-full h-full object-cover rounded-full border-4 border-blue-500 shadow-lg"
              />
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
              Tío Viajero IA Bloqueado
            </h2>

            {/* Descripción */}
            <p className="text-gray-600 text-center mb-6 leading-relaxed">
              Para usar el <span className="font-semibold text-purple-600">Asistente Inteligente</span> con IA, 
              una de nuestras herramientas más avanzadas, necesitas registrarte e iniciar sesión.
            </p>

            {/* Beneficios */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 space-y-2">
              <p className="text-sm font-semibold text-blue-900 mb-2">✨ Con el Tío Viajero IA podrás:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>🤖 Búsqueda inteligente con IA</li>
                <li>💬 Conversación natural en español</li>
                <li>🎯 Recomendaciones personalizadas</li>
                <li>📍 Búsqueda por ubicación GPS</li>
                <li>⚡ Respuestas instantáneas 24/7</li>
              </ul>
            </div>

            {/* Botones */}
            <div className="space-y-3">
              <Link
                href="/auth/register"
                onClick={() => setIsOpen(false)}
                className="block w-full bg-gradient-to-r from-blue-600 to-gray-700 text-white text-center py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl"
              >
                🚀 Registrarme Gratis
              </Link>
              
              <Link
                href="/auth/login"
                onClick={() => setIsOpen(false)}
                className="block w-full bg-white border-2 border-blue-300 text-gray-700 text-center py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all"
              >
                Ya tengo cuenta
              </Link>
            </div>

            {/* Texto pequeño */}
            <p className="text-xs text-gray-500 text-center mt-4">
              ✓ Acceso inmediato · ✓ 100% gratis · ✓ IA avanzada
            </p>
          </div>
        </div>
      </>
    )
  }
  
  return (
    <>
      {/* Botón flotante con avatar - cuando el chat está cerrado */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-24 right-6 md:bottom-6 bg-gradient-to-r from-blue-600 to-gray-700 rounded-full p-2 shadow-2xl hover:scale-110 transition-transform z-50 group"
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
      )}
      
      {/* Avatar minimizado con botón de expandir */}
      {isOpen && user && isMinimized && (
        <button
          onClick={handleExpand}
          className="fixed bottom-24 right-6 md:bottom-6 bg-gradient-to-r from-blue-600 to-gray-700 rounded-full p-2 shadow-2xl hover:scale-110 transition-transform z-50 group"
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
      )}
      
      {/* Ventana del chat */}
      {isOpen && user && !isMinimized && (
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
                  
                  {/* Mostrar áreas si las hay */}
                  {msg.areas && msg.areas.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.areas.slice(0, 3).map((area: any) => (
                        <Link
                          key={area.id}
                          href={`/area/${area.slug}`}
                          className="block bg-blue-50 hover:bg-blue-100 p-2 rounded-lg text-xs transition-colors"
                          target="_blank"
                        >
                          <strong className="text-blue-900">{area.nombre}</strong>
                          <div className="text-gray-700 text-xs mt-1">
                            📍 {area.ciudad}, {area.pais}
                            {area.precio_noche !== null && area.precio_noche > 0 && (
                              <span className="ml-2">💰 {area.precio_noche}€</span>
                            )}
                            {(area.precio_noche === null || area.precio_noche === 0) && (
                              <span className="ml-2">💰 Gratis</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
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
                placeholder="Pregunta al Tío Viajero..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={sending}
              />
              <button
                onClick={enviarMensaje}
                disabled={sending || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-gray-700 text-white rounded-full px-6 py-2 hover:from-blue-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-md"
              >
                {sending ? '...' : 'Enviar'}
              </button>
            </div>
            {ubicacion && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                📍 Ubicación detectada · Las búsquedas serán más precisas
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

