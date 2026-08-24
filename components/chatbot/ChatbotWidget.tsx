'use client'

import { useState, useRef, useEffect } from 'react'
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
import {
  avisarGps,
  cookiesGranted,
  gpsActivo,
  onCookieConsentChange,
  onGpsChange,
  pedirAceptarCookies,
  setCookieConsent,
} from '@/components/CookieConsentBar'
import { ChatMensajeTexto } from '@/components/chatbot/ChatMensajeTexto'

export const AREA_MAPA_CHANGE = 'mapafc:area-mapa'
export type AreaEnMapa = {
  id: string
  nombre: string
  slug?: string
  ciudad?: string
  pais?: string
}

export function avisarAreaMapa(area: AreaEnMapa | null) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(AREA_MAPA_CHANGE, { detail: area }))
}

export function onAreaMapaChange(cb: (area: AreaEnMapa | null) => void) {
  const handler = (e: Event) => cb(((e as CustomEvent).detail as AreaEnMapa) || null)
  window.addEventListener(AREA_MAPA_CHANGE, handler)
  return () => window.removeEventListener(AREA_MAPA_CHANGE, handler)
}

interface Message {
  rol: 'user' | 'assistant'
  contenido: string
  areas?: any[]
  logId?: string
  voto?: 'up' | 'down' | null
}

// Textos del widget y mensajes prefijados por idioma
const TEXTOS: Record<string, {
  bienvenida: string
  sugerencias: string[]
  placeholder: string
  enviar: string
  ubicacionDetectada: string
  votoPregunta: string
  votoBien: string
  votoMal: string
  loginWall: string
  loginCta: string
  registerCta: string
  guestHint: string
  cookiesWall: string
  cookiesCta: string
  locationWall: string
  locationCta: string
  locationDenied: string
}> = {
  es: {
    bienvenida: '¡Hola! 👋 Soy el Tío Viajero IA. Pregúntame por áreas, rutas… o por valorar tu furgo y el QR anti-golpes. ¿Por dónde empezamos?',
    sugerencias: [
      '🆓 Áreas gratis cerca de mí',
      '⭐ Las mejores áreas de España',
      '🛣️ Paradas en una ruta',
      '💧 Áreas con agua y electricidad',
      '🐕 Áreas cerca de mí (mascotas bienvenidas)'
    ],
    placeholder: 'Pregunta al Tío Viajero...',
    enviar: 'Enviar',
    ubicacionDetectada: '📍 Ubicación detectada · Las búsquedas serán más precisas',
    votoPregunta: '¿Qué te ha parecido esta respuesta?',
    votoBien: 'Bien',
    votoMal: 'Mal',
    loginWall: 'Has usado tus 2 preguntas gratis. Entra o crea una cuenta para seguir preguntando.',
    loginCta: 'Entrar',
    registerCta: 'Crear cuenta',
    guestHint: 'Te quedan {n} preguntas sin cuenta',
    cookiesWall: 'Para hablar con el Tío Viajero hay que aceptar las cookies y activar la ubicación. Así te sitúo en el mapa y te digo dónde dormir cerca.',
    cookiesCta: 'Aceptar cookies',
    locationWall: 'Activa la ubicación para usar el chat. Sin ella no puedo situarte ni decirte qué hay cerca.',
    locationCta: 'Activar ubicación',
    locationDenied: 'El navegador ha bloqueado la ubicación. Actívala en los permisos de esta página y pulsa de nuevo.'
  },
  en: {
    bienvenida: "Hi! 👋 I'm Tío Viajero AI. Ask me about motorhome areas, services, prices or route stops. Where shall we start?",
    sugerencias: [
      '🆓 Free areas near me',
      '⭐ Best areas in Spain',
      '🛣️ Stops along a route',
      '💧 Areas with water and electricity',
      '🐕 Areas near me (pets welcome)'
    ],
    placeholder: 'Ask Tío Viajero...',
    enviar: 'Send',
    ubicacionDetectada: '📍 Location detected · Searches will be more accurate',
    votoPregunta: 'How was this reply?',
    votoBien: 'Good',
    votoMal: 'Bad',
    loginWall: 'You’ve used your 2 free questions. Sign in or create an account to keep asking.',
    loginCta: 'Sign in',
    registerCta: 'Create account',
    guestHint: '{n} free questions left',
    cookiesWall: 'To chat with Tío Viajero you need to accept cookies and turn on location. That’s how I place you on the map and find places to sleep nearby.',
    cookiesCta: 'Accept cookies',
    locationWall: 'Turn on location to use the chat. Without it I can’t place you or tell you what’s nearby.',
    locationCta: 'Enable location',
    locationDenied: 'The browser blocked location. Allow it for this page and tap again.'
  },
  fr: {
    bienvenida: "Salut ! 👋 Je suis Tío Viajero IA. Demandez-moi des aires, services, prix ou étapes d'itinéraire. On commence ?",
    sugerencias: [
      '🆓 Aires gratuites près de moi',
      '⭐ Meilleures aires en Espagne',
      '🛣️ Étapes sur une route',
      '💧 Aires avec eau et électricité',
      '🐕 Aires près de moi (animaux)'
    ],
    placeholder: 'Demandez à Tío Viajero...',
    enviar: 'Envoyer',
    ubicacionDetectada: '📍 Position détectée · Recherches plus précises',
    votoPregunta: 'Cette réponse vous a convenu ?',
    votoBien: 'Bien',
    votoMal: 'Mal',
    loginWall: 'Vous avez utilisé vos 2 questions gratuites. Connectez-vous ou créez un compte pour continuer.',
    loginCta: 'Connexion',
    registerCta: 'Créer un compte',
    guestHint: 'Il vous reste {n} questions sans compte',
    cookiesWall: 'Pour parler au Tío Viajero, accepte les cookies et active la localisation. Ainsi je te place sur la carte et je cherche où dormir près de toi.',
    cookiesCta: 'Accepter les cookies',
    locationWall: 'Active la localisation pour utiliser le chat. Sans elle, je ne peux pas te placer ni dire ce qu’il y a près de toi.',
    locationCta: 'Activer la localisation',
    locationDenied: 'Le navigateur a bloqué la localisation. Autorise-la pour cette page et réessaie.'
  },
  de: {
    bienvenida: 'Hallo! 👋 Ich bin Tío Viajero KI. Frag mich nach Stellplätzen, Services, Preisen oder Routenstopps. Womit fangen wir an?',
    sugerencias: [
      '🆓 Kostenlose Stellplätze in meiner Nähe',
      '⭐ Beste Stellplätze in Spanien',
      '🛣️ Stopps auf einer Route',
      '💧 Stellplätze mit Wasser und Strom',
      '🐕 Stellplätze in meiner Nähe (Haustiere)'
    ],
    placeholder: 'Frag Tío Viajero...',
    enviar: 'Senden',
    ubicacionDetectada: '📍 Standort erkannt · Genauere Suche',
    votoPregunta: 'Wie war diese Antwort?',
    votoBien: 'Gut',
    votoMal: 'Schlecht',
    loginWall: 'Du hast deine 2 kostenlosen Fragen verbraucht. Melde dich an oder erstelle ein Konto, um weiterzufragen.',
    loginCta: 'Anmelden',
    registerCta: 'Konto erstellen',
    guestHint: 'Noch {n} Fragen ohne Konto',
    cookiesWall: 'Für den Tío Viajero musst du Cookies akzeptieren und den Standort aktivieren. So setze ich dich auf die Karte und finde Schlafplätze in der Nähe.',
    cookiesCta: 'Cookies akzeptieren',
    locationWall: 'Aktiviere den Standort, um den Chat zu nutzen. Ohne ihn kann ich dich nicht orten.',
    locationCta: 'Standort aktivieren',
    locationDenied: 'Der Browser hat den Standort blockiert. Erlaube ihn für diese Seite und tippe erneut.'
  },
  it: {
    bienvenida: 'Ciao! 👋 Sono Tío Viajero IA. Chiedimi aree, servizi, prezzi o soste lungo il percorso. Da dove iniziamo?',
    sugerencias: [
      '🆓 Aree gratuite vicino a me',
      '⭐ Le migliori aree in Spagna',
      '🛣️ Soste su un percorso',
      '💧 Aree con acqua ed elettricità',
      '🐕 Aree vicino a me (animali)'
    ],
    placeholder: 'Chiedi a Tío Viajero...',
    enviar: 'Invia',
    ubicacionDetectada: '📍 Posizione rilevata · Ricerche più precise',
    votoPregunta: 'Che ne pensi di questa risposta?',
    votoBien: 'Bene',
    votoMal: 'Male',
    loginWall: 'Hai usato le 2 domande gratis. Accedi o crea un account per continuare.',
    loginCta: 'Accedi',
    registerCta: 'Crea account',
    guestHint: 'Ti restano {n} domande senza account',
    cookiesWall: 'Per parlare con Tío Viajero devi accettare i cookie e attivare la posizione. Così ti metto sulla mappa e cerco dove dormire vicino.',
    cookiesCta: 'Accetta i cookie',
    locationWall: 'Attiva la posizione per usare la chat. Senza non posso collocarti né dirti cosa c’è vicino.',
    locationCta: 'Attiva posizione',
    locationDenied: 'Il browser ha bloccato la posizione. Abilitala per questa pagina e riprova.'
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
  const [seguimiento, setSeguimiento] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [conversacionId, setConversacionId] = useState<string | null>(null)
  const [ubicacion, setUbicacion] = useState<{lat: number, lng: number} | null>(null)
  const [loginRequired, setLoginRequired] = useState(false)
  const [guestRemaining, setGuestRemaining] = useState<number | null>(null)
  const [cookiesOk, setCookiesOk] = useState(false)
  const [gpsOn, setGpsOn] = useState(false)
  const [areaEnMapa, setAreaEnMapa] = useState<AreaEnMapa | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [pidiendoGeo, setPidiendoGeo] = useState(false)
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
    
    try {
      if (localStorage.getItem('fc_chat_guest_done') === '1') setLoginRequired(true)
    } catch {}

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setLoginRequired(false)
        setGuestRemaining(null)
        try { localStorage.removeItem('fc_chat_guest_done') } catch {}
      }
    })

    return () => subscription.unsubscribe()
  }, [])
  
  // Auto-scroll al último mensaje solo cuando entra uno nuevo o el bot escribe,
  // no al mutar un mensaje existente (p.ej. votar una respuesta de más arriba)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, sending])
  
  const pedirUbicacion = () => {
    if (!navigator.geolocation) {
      setGeoError('denied')
      return
    }
    setPidiendoGeo(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setPidiendoGeo(false)
        if (Math.abs(lat) < 0.5 && Math.abs(lng) < 0.5) {
          setGeoError('denied')
          return
        }
        setUbicacion({ lat, lng })
        setGeoError(null)
        setGpsOn(true)
        avisarGps(true, { lat, lng })
      },
      () => {
        setPidiendoGeo(false)
        setGeoError('denied')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    )
  }

  useEffect(() => {
    setCookiesOk(cookiesGranted())
    setGpsOn(gpsActivo())
    const offCookie = onCookieConsentChange((granted) => {
      setCookiesOk(granted)
      if (granted && isOpen && gpsActivo() && !ubicacion) pedirUbicacion()
    })
    const offGps = onGpsChange((active, coords) => {
      setGpsOn(active)
      if (!active) {
        setUbicacion(null)
        return
      }
      if (coords && !(Math.abs(coords.lat) < 0.5 && Math.abs(coords.lng) < 0.5)) {
        setUbicacion(coords)
        setGeoError(null)
      }
    })
    return () => {
      offCookie()
      offGps()
    }
  }, [isOpen, ubicacion])

  useEffect(() => {
    if (isOpen && cookiesOk && gpsOn && !ubicacion) pedirUbicacion()
  }, [isOpen, cookiesOk, gpsOn, ubicacion])

  useEffect(() => onAreaMapaChange(setAreaEnMapa), [])

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
    if (!cookiesGranted()) pedirAceptarCookies()
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
    if (!texto || sending || (loginRequired && !user)) return
    if (!cookiesGranted()) {
      pedirAceptarCookies()
      return
    }
    if (!gpsActivo() || !ubicacion) {
      return
    }

    const userMessage: Message = { rol: 'user', contenido: texto }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSeguimiento([])
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
          locale, // Fallback si el mensaje es corto; manda el idioma del último mensaje
          areaEnMapa: areaEnMapa || undefined,
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error API:', errorData)
        if (response.status === 403 && errorData.errorType === 'LOGIN_REQUIRED') {
          setLoginRequired(true)
          setGuestRemaining(0)
          try { localStorage.setItem('fc_chat_guest_done', '1') } catch {}
          return
        }
        if (response.status === 403 && errorData.errorType === 'LOCATION_REQUIRED') {
          setGeoError('denied')
          pedirUbicacion()
          return
        }
        throw new Error(errorData.error || 'Error en la respuesta')
      }
      
      const data = await response.json()
      if (!user && data.guest) {
        setGuestRemaining(data.guest.remaining)
        if (data.guest.remaining <= 0) {
          setLoginRequired(true)
          try { localStorage.setItem('fc_chat_guest_done', '1') } catch {}
        }
      }
      
      // Si es el primer mensaje y retorna conversacionId, guardarlo
      if (data.conversacionId && !conversacionId) {
        setConversacionId(data.conversacionId)
      }
      
      setMessages(prev => [...prev, {
        rol: 'assistant',
        contenido: data.message,
        areas: data.areas,
        logId: data.logId || undefined,
        voto: null
      }])
      setSeguimiento(Array.isArray(data.seguimiento) ? data.seguimiento : [])
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

  const votarRespuesta = async (index: number, voto: 'up' | 'down') => {
    const msg = messages[index]
    if (!msg?.logId || msg.rol !== 'assistant') return
    const siguiente = msg.voto === voto ? null : voto
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, voto: siguiente } : m)))
    track('chatbot_voto', { event_data: { voto: siguiente || 'quitar', log_id: msg.logId } })
    try {
      const res = await fetch('/api/chatbot', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId: msg.logId, voto: siguiente }),
      })
      if (!res.ok) {
        setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, voto: msg.voto ?? null } : m)))
      }
    } catch {
      setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, voto: msg.voto ?? null } : m)))
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

  // Cookies + GPS obligatorios. Sin cuenta: 2 preguntas. Luego hay que entrar.
  const nextAuth = `/auth/login?next=${encodeURIComponent(pathname || '/mapa')}`
  const nextRegister = `/auth/register?next=${encodeURIComponent(pathname || '/mapa')}`
  const bloqueadoInvitado = loginRequired && !user
  const faltaCookies = !cookiesOk
  const faltaUbicacion = cookiesOk && (!gpsOn || !ubicacion)
  const puedeHablar = cookiesOk && gpsOn && Boolean(ubicacion) && !bloqueadoInvitado

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
          <div className="relative flex-1 min-h-0 bg-gray-50">
            {faltaUbicacion && (
              <div
                className="absolute inset-0 z-10 bg-white/65 backdrop-blur-[1px]"
                aria-hidden
              />
            )}
          <div className={`h-full overflow-y-auto p-4 space-y-4 ${faltaUbicacion ? 'pointer-events-none' : ''}`}>
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
                
                <div className="max-w-[80%] min-w-0">
                <div className={`rounded-2xl p-3 ${
                  msg.rol === 'user' 
                    ? 'bg-gradient-to-r from-blue-600 to-gray-700 text-white' 
                    : 'bg-white text-gray-900 shadow-md border border-blue-100'
                }`}>
                  <div className="text-sm leading-relaxed">
                    <ChatMensajeTexto texto={msg.contenido} />
                  </div>
                  
                  {/* Tarjetas de áreas encontradas */}
                  {msg.areas && msg.areas.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.areas.slice(0, 3).map((area: any) => {
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
                                <span className={`font-bold ${area.precio_noche === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                                  {area.precio_noche === 0
                                    ? 'Gratis'
                                    : area.precio_noche != null
                                      ? `${area.precio_noche}€/noche`
                                      : 'Precio no disponible'}
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
                      {msg.areas.slice(0, 3).some((a: any) => !favIds.has(a.id)) && (
                        <button
                          type="button"
                          onClick={() => guardarTodas(msg.areas!.slice(0, 3))}
                          className="w-full text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg py-2 transition-colors"
                        >
                          ❤️ Guardar {msg.areas.slice(0, 3).length === 1 ? 'esta área' : `estas ${msg.areas.slice(0, 3).length} áreas`} en favoritos
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {msg.rol === 'assistant' && msg.logId && (
                  <div className="mt-1.5 flex items-center gap-2 px-1">
                    <span className="text-[11px] text-gray-500">{txt.votoPregunta}</span>
                    <button
                      type="button"
                      onClick={() => votarRespuesta(i, 'up')}
                      aria-pressed={msg.voto === 'up'}
                      aria-label={txt.votoBien}
                      title={txt.votoBien}
                      className={`rounded-full px-2 py-0.5 text-sm leading-none transition-colors ${
                        msg.voto === 'up'
                          ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      onClick={() => votarRespuesta(i, 'down')}
                      aria-pressed={msg.voto === 'down'}
                      aria-label={txt.votoMal}
                      title={txt.votoMal}
                      className={`rounded-full px-2 py-0.5 text-sm leading-none transition-colors ${
                        msg.voto === 'down'
                          ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
                          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                    >
                      👎
                    </button>
                  </div>
                )}
                </div>
              </div>
            ))}
            
            {/* Arranque: temas. Tras un atajo: segunda fase (dónde / qué parada). */}
            {!sending && puedeHablar && (messages.length <= 1 || seguimiento.length > 0) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {(messages.length <= 1 ? txt.sugerencias : seguimiento).map((sugerencia) => (
                  <button
                    key={sugerencia}
                    onClick={() => enviarMensaje(sugerencia)}
                    className="text-xs bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-400 rounded-full px-3 py-1.5 transition-all active:scale-95 shadow-sm text-left"
                  >
                    {sugerencia}
                  </button>
                ))}
                {messages.length <= 1 && (
                  <>
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
                  </>
                )}
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
          </div>
          
          {/* Input */}
          <div className="p-4 border-t bg-white md:rounded-b-2xl">
            {faltaCookies ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
                <p className="text-sm text-gray-800 mb-3">{txt.cookiesWall}</p>
                <button
                  type="button"
                  onClick={() => setCookieConsent(true)}
                  className="rounded-full bg-gradient-to-r from-blue-600 to-gray-700 text-white text-sm font-semibold px-4 py-2"
                >
                  {txt.cookiesCta}
                </button>
              </div>
            ) : faltaUbicacion ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-center">
                <p className="text-sm text-gray-800 mb-3">
                  {geoError === 'denied' ? txt.locationDenied : txt.locationWall}
                </p>
                <button
                  type="button"
                  onClick={pedirUbicacion}
                  disabled={pidiendoGeo}
                  className="rounded-full bg-gradient-to-r from-blue-600 to-gray-700 text-white text-sm font-semibold px-4 py-2 disabled:opacity-50"
                >
                  {pidiendoGeo ? '...' : txt.locationCta}
                </button>
              </div>
            ) : bloqueadoInvitado ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-center">
                <p className="text-sm text-gray-800 mb-3">{txt.loginWall}</p>
                <div className="flex gap-2 justify-center">
                  <Link
                    href={nextAuth}
                    className="rounded-full bg-gradient-to-r from-blue-600 to-gray-700 text-white text-sm font-semibold px-4 py-2"
                  >
                    {txt.loginCta}
                  </Link>
                  <Link
                    href={nextRegister}
                    className="rounded-full border border-sky-300 bg-white text-sky-800 text-sm font-semibold px-4 py-2"
                  >
                    {txt.registerCta}
                  </Link>
                </div>
              </div>
            ) : (
              <>
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
            {!user && guestRemaining != null && guestRemaining > 0 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                {txt.guestHint.replace('{n}', String(guestRemaining))}
              </p>
            )}
            {ubicacion && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                {txt.ubicacionDetectada}
              </p>
            )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

