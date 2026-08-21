'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatErrorForUser } from '@/lib/chatbot/errors'
import { track } from '@/lib/analytics/track'
import { useLanguage } from '@/lib/i18n'
import {
  getLocalFavorites,
  hasLocalFavorite,
  addLocalFavorite,
  removeLocalFavorite,
} from '@/lib/favoritos/local'

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
    bienvenida: '¡Hola! 👋 Soy el Tío Viajero IA. Pregúntame por áreas, rutas… o por valorar tu furgo y el QR anti-golpes. ¿Por dónde empezamos?',
    sugerencias: [
      '🆓 Áreas gratis cerca de mí',
      '⭐ Las mejores áreas de España',
      '🛣️ Voy de Madrid a Valencia, ¿dónde paro?',
      '💧 Áreas con agua y electricidad',
      '🐕 Áreas cerca de mí (mascotas bienvenidas)'
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
      '🐕 Areas near me (pets welcome)'
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
  const router = useRouter()
  const pathname = usePathname()
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
  const restauradoRef = useRef(false)

  // ✅ RESTAURAR CONVERSACIÓN al montar (no se resetea al refrescar):
  // 1º localStorage (funciona para todos, también anónimos)
  // 2º si no hay nada local y el usuario está logueado, última conversación de BD
  useEffect(() => {
    if (loading || restauradoRef.current) return
    restauradoRef.current = true

    try {
      const msgsGuardados = localStorage.getItem('fc_chat_msgs')
      if (msgsGuardados) {
        const parsed = JSON.parse(msgsGuardados)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
          const convGuardada = localStorage.getItem('fc_chat_conv_id')
          if (convGuardada) setConversacionId(convGuardada)
          return
        }
      }
    } catch {
      // localStorage corrupto: seguimos al plan B
    }

    // Plan B: recuperar de BD la última conversación (solo logueados)
    if (user) {
      fetch('/api/chatbot/historial')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages(data.messages)
            if (data.conversacionId) setConversacionId(data.conversacionId)
          }
        })
        .catch(() => {})
    }
  }, [loading, user])

  // ✅ PERSISTIR la conversación en localStorage (sobrevive al refresco).
  // Solo cuando hay conversación real (más allá del mensaje de bienvenida).
  useEffect(() => {
    try {
      const hayConversacion = messages.some((m) => m.rol === 'user')
      if (hayConversacion) {
        localStorage.setItem('fc_chat_msgs', JSON.stringify(messages.slice(-30)))
      }
      if (conversacionId) {
        localStorage.setItem('fc_chat_conv_id', conversacionId)
      }
    } catch {
      // sin espacio o modo privado: no pasa nada
    }
  }, [messages, conversacionId])
  
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
  
  // Links clicables: markdown [texto](url), /area/slug, /ruta y "Ver en Google Maps:"
  const renderMessageWithLinks = (text: string) => {
    // Quitar imágenes markdown ![alt](url) — las tarjetas ya muestran foto
    const sinImagenes = text.replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    const tokenRegex =
      /(\[[^\]]+\]\([^)]+\))|(Ver en Google Maps:\s*https?:\/\/[^\s)]+)|(\/area\/[a-z0-9\-]+)|(\/ruta(?:\?[^\s]*)?)|(https?:\/\/[^\s)]+)/gi

    const nodes: ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    let key = 0

    while ((match = tokenRegex.exec(sinImagenes)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(<span key={key++}>{sinImagenes.slice(lastIndex, match.index)}</span>)
      }

      const token = match[0]
      const md = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (md) {
        const [, label, href] = md
        if (href.startsWith('/')) {
          nodes.push(
            <Link key={key++} href={href} target="_blank" className="text-sky-700 hover:text-sky-900 underline font-medium">
              {label}
            </Link>
          )
        } else {
          nodes.push(
            <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:text-sky-900 underline font-medium">
              {label}
            </a>
          )
        }
      } else if (/^Ver en Google Maps:/i.test(token)) {
        const url = token.replace(/^Ver en Google Maps:\s*/i, '')
        nodes.push(
          <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 underline font-medium">
            🗺️ Ver en Google Maps
          </a>
        )
      } else if (/^\/area\//i.test(token) || /^\/ruta/i.test(token)) {
        nodes.push(
          <Link key={key++} href={token} target="_blank" className="text-sky-700 hover:text-sky-900 underline font-medium">
            {token.startsWith('/area/') ? 'Ver área →' : 'Planificador de rutas →'}
          </Link>
        )
      } else if (/^https?:\/\//i.test(token)) {
        const esMaps = /google\.com\/maps|maps\.google\.com/i.test(token)
        nodes.push(
          <a key={key++} href={token} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:text-sky-900 underline font-medium break-all">
            {esMaps ? '🗺️ Google Maps' : token}
          </a>
        )
      } else {
        nodes.push(<span key={key++}>{token}</span>)
      }

      lastIndex = match.index + token.length
    }

    if (lastIndex < sinImagenes.length) {
      nodes.push(<span key={key++}>{sinImagenes.slice(lastIndex)}</span>)
    }

    return <span className="whitespace-pre-wrap">{nodes.length ? nodes : sinImagenes}</span>
  }
  
  // Obtener geolocalización (también para usuarios sin cuenta)
  useEffect(() => {
    if (isOpen && !ubicacion) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude
            const lng = position.coords.longitude
            if (Math.abs(lat) < 0.5 && Math.abs(lng) < 0.5) {
              console.log('⚠️ GPS ignorado (Null Island)')
              return
            }
            setUbicacion({ lat, lng })
            console.log('📍 Ubicación obtenida:', lat, lng)
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

  // Nueva conversación: resetea SOLO la vista y el hilo actual.
  // Las conversaciones anteriores permanecen intactas en la base de datos.
  const nuevaConversacion = () => {
    try {
      localStorage.removeItem('fc_chat_msgs')
      localStorage.removeItem('fc_chat_conv_id')
    } catch {}
    setConversacionId(null)
    setMessages([{ rol: 'assistant', contenido: txt.bienvenida }])
    track('chatbot_nueva_conversacion', {})
  }

  // -------------------------------------------------------------------
  // Favoritos desde el chat: el Tío Viajero también llena la mochila.
  // Con cuenta van a la tabla `favoritos`; sin cuenta, a localStorage
  // (se sincronizan al crear cuenta).
  // -------------------------------------------------------------------
  const [favIds, setFavIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isOpen) return
    const cargarFavoritos = async () => {
      if (user) {
        try {
          const supabase = createClient()
          const { data } = await (supabase as any)
            .from('favoritos')
            .select('area_id')
            .eq('user_id', user.id)
          setFavIds(new Set((data || []).map((f: any) => f.area_id)))
        } catch { /* noop */ }
      } else {
        setFavIds(new Set(getLocalFavorites()))
      }
    }
    cargarFavoritos()
  }, [isOpen, user])

  const toggleFavorito = async (area: any) => {
    const esFav = favIds.has(area.id)
    // Optimista
    setFavIds((prev) => {
      const next = new Set(prev)
      if (esFav) next.delete(area.id)
      else next.add(area.id)
      return next
    })

    if (!user) {
      if (esFav) removeLocalFavorite(area.id)
      else addLocalFavorite(area.id)
      track(esFav ? 'area_unfavorite' : 'area_favorite', {
        area_id: area.id,
        event_data: { origen: 'chatbot', modo: 'local' },
      })
      return
    }

    try {
      const supabase = createClient()
      if (esFav) {
        await (supabase as any)
          .from('favoritos')
          .delete()
          .eq('user_id', user.id)
          .eq('area_id', area.id)
      } else {
        await (supabase as any)
          .from('favoritos')
          .insert({ user_id: user.id, area_id: area.id })
      }
      track(esFav ? 'area_unfavorite' : 'area_favorite', {
        area_id: area.id,
        event_data: { origen: 'chatbot' },
      })
    } catch { /* noop: el estado optimista ya refleja la intención */ }
  }

  const guardarTodas = async (areas: any[]) => {
    const pendientes = areas.filter((a) => !favIds.has(a.id))
    if (pendientes.length === 0) return
    setFavIds((prev) => {
      const next = new Set(prev)
      pendientes.forEach((a) => next.add(a.id))
      return next
    })
    for (const area of pendientes) {
      if (!user) {
        addLocalFavorite(area.id)
      } else {
        try {
          const supabase = createClient()
          await (supabase as any)
            .from('favoritos')
            .insert({ user_id: user.id, area_id: area.id })
        } catch { /* noop */ }
      }
      track('area_favorite', {
        area_id: area.id,
        event_data: { origen: 'chatbot_todas', modo: user ? 'cuenta' : 'local' },
      })
    }
  }

  // Ir al MAPA con el área seleccionada (el chat se minimiza, no se pierde).
  // Si ya estamos en /mapa, avisamos a la página con un evento; si no, navegamos
  // en la MISMA pestaña con ?area=slug (la página del mapa lo lee al cargar).
  const irAlMapa = (slug: string) => {
    if (!slug) return
    setIsMinimized(true)
    track('chatbot_area_to_map', { event_data: { slug } })
    if (pathname === '/mapa') {
      window.dispatchEvent(new CustomEvent('furgocasa:select-area', { detail: { slug } }))
    } else {
      router.push(`/mapa?area=${encodeURIComponent(slug)}`)
    }
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
          ubicacionUsuario:
            ubicacion && !(Math.abs(ubicacion.lat) < 0.5 && Math.abs(ubicacion.lng) < 0.5)
              ? ubicacion
              : undefined,
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

  // En login/registro el widget tapa CTAs y campos en móvil
  if (pathname?.startsWith('/auth') || pathname?.startsWith('/admin')) {
    return null
  }

  const isMapa = pathname === '/mapa'
  const fabAnchor = isMapa
    ? 'fixed z-[11000] right-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:right-6 md:bottom-6'
    : 'fixed z-[11000] right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:right-6 md:bottom-6'

  // El Tío Viajero es PÚBLICO: sin cuenta también funciona (rate limit por IP).
  // Con cuenta, además, se guarda el historial de conversaciones.

  return (
    <>
      {/* Botón pequeño para mostrar avatar cuando está oculto */}
      {isHidden && (
        <button
          onClick={handleShow}
          className={`${fabAnchor} bg-blue-600 text-white rounded-full w-8 h-8 shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center text-xl font-bold`}
          title="Mostrar Tío Viajero IA"
        >
          +
        </button>
      )}

      {/* Botón flotante con avatar - cuando el chat está cerrado */}
      {!isOpen && !isHidden && (
        <div className={`${fabAnchor} group`}>
          <button
            onClick={handleOpen}
            className="bg-gradient-to-r from-blue-600 to-gray-700 rounded-full p-1.5 md:p-2 shadow-2xl hover:scale-110 transition-transform relative"
            title="Tío Viajero IA"
          >
            <img 
              src="/tio-viajero-avatar.png" 
              alt="Tío Viajero IA" 
              className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-full border-2 border-white"
            />
            {/* Badge "IA" */}
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full shadow-lg">
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
        <div className={`${fabAnchor} group`}>
          <button
            onClick={handleExpand}
            className="bg-gradient-to-r from-blue-600 to-gray-700 rounded-full p-1.5 md:p-2 shadow-2xl hover:scale-110 transition-transform relative"
            title="Expandir Tío Viajero IA"
          >
            <img 
              src="/tio-viajero-avatar.png" 
              alt="Tío Viajero IA" 
              className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-full border-2 border-white"
            />
            {/* Badge "IA" */}
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full shadow-lg">
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
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 w-full md:w-96 h-full md:h-[600px] bg-white md:rounded-2xl shadow-2xl flex flex-col z-[11000] border-0 md:border border-gray-200 md:max-w-[calc(100vw-3rem)] md:max-h-[calc(100vh-3rem)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-gray-700 text-white p-4 md:rounded-t-2xl flex justify-between items-center">
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
            <div className="flex items-center gap-1">
              <button
                onClick={nuevaConversacion}
                className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors text-lg leading-none"
                title="Nueva conversación (el historial anterior se conserva)"
              >
                ↻
              </button>
              <button
                onClick={handleMinimize}
                className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors text-2xl font-bold leading-none pb-1"
                title="Minimizar"
              >
                −
              </button>
            </div>
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
                        const fotoCandidata = (() => {
                          if (Array.isArray(area.fotos_urls) && area.fotos_urls.length > 0) return area.fotos_urls[0]
                          if (typeof area.fotos_urls === 'string' && area.fotos_urls.trim().startsWith('http')) {
                            return area.fotos_urls.split(',')[0].trim()
                          }
                          if (typeof area.foto_principal === 'string' && area.foto_principal.startsWith('http')) {
                            return area.foto_principal
                          }
                          return null
                        })()
                        // PhotoService de Google no sirve como <img> directo
                        const foto = fotoCandidata && !/PhotoService\.GetPhoto|maps\.googleapis\.com\/maps\/api\/place\/js/i.test(fotoCandidata)
                          ? fotoCandidata
                          : null
                        return (
                          <div
                            key={area.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => irAlMapa(area.slug)}
                            onKeyDown={(e) => { if (e.key === 'Enter') irAlMapa(area.slug) }}
                            className="w-full text-left flex gap-2.5 bg-white hover:bg-sky-50 border border-gray-200 hover:border-sky-300 rounded-xl overflow-hidden transition-all group shadow-sm cursor-pointer"
                            title="Ver en el mapa"
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
                              <div className="flex items-start gap-1">
                                <p className="font-semibold text-gray-900 text-xs leading-tight truncate group-hover:text-sky-700 flex-1">{area.nombre}</p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleFavorito(area)
                                  }}
                                  className="flex-shrink-0 text-base leading-none hover:scale-110 transition-transform -mt-0.5"
                                  aria-label={favIds.has(area.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                                  title={favIds.has(area.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                                >
                                  {favIds.has(area.id) ? '❤️' : '🤍'}
                                </button>
                              </div>
                              <p className="text-[11px] text-gray-500 truncate">📍 {area.ciudad}, {area.pais}</p>
                              <div className="flex items-center gap-2 mt-1 text-[11px]">
                                <span className={`font-bold ${(!area.precio_noche || area.precio_noche === 0) ? 'text-green-600' : 'text-gray-800'}`}>
                                  {(!area.precio_noche || area.precio_noche === 0) ? 'Gratis' : `${area.precio_noche}€/noche`}
                                </span>
                                {area.google_rating && (
                                  <span className="text-amber-500 font-medium">
                                    ★ {Number(area.google_rating).toFixed(1)}
                                    {(area.google_ratings_total ?? 0) > 0 ? (
                                      <span className="text-amber-700/70 font-normal"> ({area.google_ratings_total})</span>
                                    ) : null}
                                  </span>
                                )}
                                {area.distancia_km !== undefined && (
                                  <span className="text-gray-500">{Number(area.distancia_km).toFixed(0)} km</span>
                                )}
                                {area.desvio_km !== undefined && (
                                  <span className="text-gray-500">↔ {area.desvio_km} km</span>
                                )}
                                <span className="ml-auto text-sky-600 font-medium">🗺️</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {/* Guardar todas las áreas sugeridas de una vez */}
                      {msg.areas.slice(0, 6).some((a: any) => !favIds.has(a.id)) && (
                        <button
                          type="button"
                          onClick={() => guardarTodas(msg.areas!.slice(0, 6))}
                          className="w-full text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg py-2 transition-colors"
                        >
                          ❤️ Guardar {msg.areas.slice(0, 6).length === 1 ? 'esta área' : `estas ${msg.areas.slice(0, 6).length} áreas`} en favoritos
                        </button>
                      )}
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
                <Link
                  href="/valoracion-ia-vehiculos"
                  className="text-xs bg-[#0b3c74] text-white hover:bg-[#0d4a8f] rounded-full px-3 py-1.5 transition-all shadow-sm"
                >
                  🤖 ¿Cuánto vale mi furgo?
                </Link>
                <Link
                  href="/sistema-reporte-accidentes"
                  className="text-xs bg-red-600 text-white hover:bg-red-700 rounded-full px-3 py-1.5 transition-all shadow-sm"
                >
                  🛡️ QR anti-golpes
                </Link>
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
          <div className="p-4 border-t bg-white md:rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
                placeholder={txt.placeholder}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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

