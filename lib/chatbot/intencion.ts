import type { ChatLocale } from '@/lib/chatbot/functions'

export const BLOG_RUTAS_FURGOCASA = 'https://www.furgocasa.com/es/blog?category=rutas'

const UTIL_RE =
  /(^|[^\p{L}\p{N}])(area|área|areas|áreas|stellplatz|sosta|aire camping|pernoct|dormir|autocaravana|autocaravanas|camper|furgo|furgoneta|motorhome|parking|aparcamiento|estacionar|estacionamiento|gasolinera|gasolineras|gasolina|di[eé]sel|petrol|tankstelle|taller|luz|electricidad|agua|ducha|duchas|wifi|wc|vaciado|precio|gratis|free|cerca de m[ií]|mejores|best)(?=[^\p{L}\p{N}]|$)/iu

const GUIA_RE =
  /(^|[^\p{L}\p{N}])(qu[eé]\s+ver|qu[eé]\s+visitar|qu[eé]\s+hacer|what to see|what to do|things to do|que visiter|quoi faire|was sehen|was unternehmen|cosa vedere|cosa fare|o que ver|pueblos?\s+(para\s+parar|que\s+visitar|con\s+encanto)|en qu[eé] pueblos|itinerario|monumentos?|museos?|catedral|atracciones?|turismo|tur[ií]stic|gu[ií]a de viaje|planes? en|actividades?|senderismo|birdwatching|p[áa]jaros|visitar en|fiestas? de|playas?\s+para\s+ba[nñ])(?=[^\p{L}\p{N}]|$)/iu

const GAS_SUELTA_RE = /^(gasolineras?|gasolina|di[eé]sel|petrol|tankstelle)$/i

export function pideUtilCamper(mensaje: string): boolean {
  return UTIL_RE.test(mensaje || '')
}

export function esGuiaTuristicaPura(mensaje: string): boolean {
  if (!mensaje) return false
  if (!GUIA_RE.test(mensaje)) return false
  return !pideUtilCamper(mensaje)
}

/** "Huesca", "En Cádiz", "Ciudad de Lourdes" — sin decir qué quieren. */
export function esSitioSinIntencion(mensaje: string): boolean {
  const t = (mensaje || '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[¿?¡!.,:;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t || t.length > 48) return false
  if (pideUtilCamper(t) || GUIA_RE.test(t) || GAS_SUELTA_RE.test(t)) return false
  if (/\b(hola|hello|hi|hey|gracias|thanks|ok|vale)\b/i.test(t) && t.split(/\s+/).length <= 2) return false
  return /^(en\s+|in\s+|à\s+|a\s+|stadt\s+|ciudad de\s+)?[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9\s,'-]{1,46}$/i.test(t)
}

export function esGasolineraSinSitio(mensaje: string): boolean {
  const t = (mensaje || '').replace(/[¿?¡!.,]/g, ' ').replace(/\s+/g, ' ').trim()
  return GAS_SUELTA_RE.test(t)
}

export function extraerSitioNombrado(mensaje: string): string {
  const t = (mensaje || '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[¿?¡!.,:;]/g, ' ')
    .replace(/^(en|in|à|a|stadt|ciudad de)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  // Solo si parece topónimo: cada palabra empieza por mayúscula o es un conector
  // ("El Puerto de Santa María" sí; "necesito ayuda" no se incrusta como lugar).
  const conectores = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'sur', 'sobre', 'da', 'do', 'di'])
  const palabras = t.split(/\s+/)
  if (!palabras.length || palabras.length > 5) return ''
  const esToponimo = palabras.every(
    (p) => conectores.has(p.toLowerCase()) || /^[A-ZÁÉÍÓÚÑÀ-Ö0-9]/u.test(p)
  )
  return esToponimo && /^[A-ZÁÉÍÓÚÑÀ-Ö0-9]/u.test(palabras[0]) ? t : ''
}

export function asistentePidioClarificar(texto: string | null | undefined): boolean {
  return /no me queda claro|qu[eé] informaci[oó]n necesitas|not sure what you need|what do you need about|pas clair|de quoi tu as besoin|nicht klar|was du brauchst|non mi [eè] chiaro|qu[eé] parada buscas|pernoctar|mitad de ruta|cerca del destino|no al salir|what kind of stop|quelle halte|welche pause|che sosta|d[oó]nde las buscas|cerca de tu ubicaci[oó]n|en una localidad|punto del mapa|where do you want them|pr[eè]s de (toi|vous)|in einer ortschaft/i.test(
    texto || ''
  ) || /te refieres|te refer[ií]as|o a un [aá]rea concreta|dime si quieres que ampl[ií]e/i.test(texto || '')
}

/** "cerca de mí / aquí" — único caso en el que el GPS decide el listado. */
export function pideCercaDeMi(mensaje: string): boolean {
  return /cerca de m[ií]|cerca de (tu |mi )?ubicaci[oó]n|near me|from my location|pr[eè]s de (moi|toi|vous)|in meiner n[aä]he|vicino a me|junto a m[ií]|donde estoy|where I am/i.test(
    mensaje || ''
  )
}

/** Señala el pin del mapa o "esta/esa" sin nombrar otra cosa. */
export function esDeixisMapa(mensaje: string): boolean {
  const t = (mensaje || '').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim()
  if (!t || t.length > 80) return false
  return /^(y\s+)?(esta|esa|esto|eso)\b|esta no te suena|esa no te suena|la del mapa|este (sitio|pin|[aá]rea)|ese ([aá]rea|sitio)/i.test(t)
}

/**
 * Pregunta por UN sitio/área concreto. No es "dónde paro en la ruta".
 * Evita reabrir el corredor entero (metralleta de fichas).
 */
export function esPreguntaAreaConcreta(mensaje: string): boolean {
  const t = (mensaje || '').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim()
  if (!t) return false
  if (parecePreguntaRuta(t) && !/castillo|[aá]rea de|la de |esta no te suena/i.test(t)) return false
  return (
    esDeixisMapa(t) ||
    /qu[eé] pasa con|h[aá]blame de|la (informaci[oó]n )?de la|solo (te )?(pido|quiero|das) (una|esa|esta)|una sola|[aá]rea concreta|el [aá]rea de|castillo de|garcim[uú][nñ]oz|garc[ií]a\s*mu[nñ]oz|me refer[ií]a|te suena esa|te suena esta|recomi[eé]ndame (esa|esta)/i.test(t)
  )
}

export function extraerNombreAreaConcreta(mensaje: string): string {
  const t = (mensaje || '').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').replace(/[¿?¡!]/g, ' ').replace(/\s+/g, ' ').trim()
  const m =
    t.match(/castillo de\s+([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9\s'-]{2,40})/i) ||
    t.match(/(?:[aá]rea(?: de autocaravanas)?|camping)\s+(?:de\s+)?([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9\s'-]{2,40})/i) ||
    t.match(/(?:la de|el de|la del|el del)\s+([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9\s'-]{2,40})/i)
  if (m) return m[1].replace(/\s+(de )?(cuenca|espa[nñ]a|murcia).*$/i, '').trim()
  return ''
}

/** "Voy de Madrid a Valencia, dónde paro" — pregunta de ruta, no de un sitio suelto. */
export function extraerRutaNombrada(mensaje: string): { origen: string; destino: string } | null {
  const t = (mensaje || '').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').replace(/\s+/g, ' ').trim()
  if (!t) return null
  const patrones = [
    /(?:voy|vamos|ir|ruta|route|driving|drive|from|de|desde)\s+(?:de\s+)?(.+?)\s+(?:a|hacia|to)\s+(.+)/i,
    /entre\s+(.+?)\s+y\s+(.+)/i,
  ]
  for (const re of patrones) {
    const m = t.match(re)
    if (!m) continue
    const origen = limpiarNombreRuta(m[1])
    const destino = limpiarNombreRuta(m[2])
    if (origen.length >= 2 && destino.length >= 2 && origen.toLowerCase() !== destino.toLowerCase()) {
      return { origen, destino }
    }
  }
  return null
}

function limpiarNombreRuta(raw: string): string {
  return String(raw || '')
    .replace(/[¿?¡!.,;:].*$/g, ' ')
    .replace(/\b(d[oó]nde|donde|where|paro|parar|paradas?|stop|stops|camping|campings|área|area|áreas|areas)\b.*$/i, ' ')
    .replace(/^(de|desde|from|el|la|los|las)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parecePreguntaRuta(mensaje: string): boolean {
  if (!mensaje) return false
  const t = mensaje.trim()
  const patrones = [
    /\b(?:driving|drive|voy|vamos|ir|ruta|route|trayecto)\b.+\b(?:to|a|hacia|→|->)\b.+/i,
    /\b(?:from|de|desde)\s+(?:aqu[ií]|aca|acá|here|hier|qui|[A-Za-zÀ-ÿ][\wÀ-ÿ\s.'-]{1,40})\s+(?:to|a|hacia)\s+[A-Za-zÀ-ÿ][\wÀ-ÿ\s.'-]{1,40}/i,
    /\b(?:where to stop|d[oó]nde paro|donde parar|paradas?\s+entre|stop(?:s)?\s+along|áreas?\s+de\s+camino)\b/i,
    /\b[A-Za-zÀ-ÿ][\wÀ-ÿ.'-]{2,30}\s+(?:to|→|->|–|-)\s+[A-Za-zÀ-ÿ][\wÀ-ÿ.'-]{2,30}.{0,40}\b(?:stop|paro|parar|paradas?)\b/i,
  ]
  return patrones.some((re) => re.test(t)) || Boolean(extraerRutaNombrada(t))
}

/** Ya dijo pernocta, tipo o tramo: se puede buscar. */
export function tieneDetalleParadaRuta(mensaje: string): boolean {
  return /(pernoct|a dormir|overnight|übernacht|nächtigen|pernottare|mitad|halfway|medio (de )?(camino|ruta)|a medio|cerca del destino|cerca de llegar|al (final|llegar)|lejos de (salir|origen)|no (al )?(salir|principio|inicio)|camping|área p[uú]blica|area p[uú]blica|área privada|area privada|parada t[eé]cnica|vaciado|agua y (luz|electricidad))/i.test(
    mensaje || ''
  )
}

export function inferirFiltrosRuta(mensaje: string): {
  tramo?: 'mitad' | 'cerca_destino' | 'todo'
  tipo_area?: 'publica' | 'privada' | 'camping'
  incluir_origen: boolean
} {
  const t = mensaje || ''
  let tramo: 'mitad' | 'cerca_destino' | 'todo' | undefined
  if (/mitad|halfway|medio (de )?(camino|ruta)|a medio/i.test(t)) tramo = 'mitad'
  else if (/cerca del destino|cerca de llegar|al (final|llegar)|m[aá]s cerca de/i.test(t)) tramo = 'cerca_destino'
  else if (/da igual|cualquier (tramo|sitio)|todo el (camino|trayecto)/i.test(t)) tramo = 'todo'
  let tipo_area: 'publica' | 'privada' | 'camping' | undefined
  if (/\bcampings?\b/i.test(t) && !/\b[aá]reas?\b/i.test(t)) tipo_area = 'camping'
  else if (/[aá]rea p[uú]blica|p[uú]blica/i.test(t) && !/\bcamping/i.test(t)) tipo_area = 'publica'
  else if (/[aá]rea privada|privada/i.test(t) && !/\bcamping/i.test(t)) tipo_area = 'privada'
  const incluir_origen = /al salir|al (principio|inicio)|nada m[aá]s salir|en el origen|cerca del origen/i.test(t)
  return { tramo, tipo_area, incluir_origen }
}

/** Áreas / paradas en un trayecto: van al planificador, no a un listado del chat. */
export function esRutaSinIntencion(mensaje: string): boolean {
  if (!mensaje) return false
  if (/(gasolinera|gasolineras|gasolina|di[eé]sel|petrol|tankstelle|taller)/i.test(mensaje)) return false
  if (esPreguntaAreaConcreta(mensaje) || esDeixisMapa(mensaje)) return false
  if (/paradas? en (una )?ruta|etapas de (ruta|itinerario)|stops? on (a |the )?route/i.test(mensaje)) {
    return true
  }
  return parecePreguntaRuta(mensaje)
}

export function enlacePlanificador(ruta?: { origen: string; destino: string } | null): string {
  if (!ruta?.origen || !ruta?.destino) return '/ruta'
  const q = new URLSearchParams({ origen: ruta.origen, destino: ruta.destino })
  return `/ruta?${q.toString()}`
}

function enlaceDesdeEtiqueta(sitio?: string): string {
  const m = (sitio || '').match(/^(.+?)\s+→\s+(.+)$/)
  if (!m) return '/ruta'
  return enlacePlanificador({ origen: m[1].trim(), destino: m[2].trim() })
}

function tieneSitioOCerca(mensaje: string): boolean {
  return /cerca de m[ií]|cerca de (tu |mi )?ubicaci[oó]n|near me|from my location|pr[eè]s de (moi|toi|vous)|in meiner n[aä]he|vicino a me|junto a m[ií]|espa[nñ]a|spain|francia|france|portugal|italia|italy|alemania|germany|m[eé]xico|mexico/i.test(
    mensaje || ''
  )
}

/** "Áreas con agua y electricidad" — filtro claro, sitio no. */
export function esFiltroSinSitio(mensaje: string): boolean {
  const t = (mensaje || '').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim()
  if (!t) return false
  if (tieneSitioOCerca(t) || extraerRutaNombrada(t) || parecePreguntaRuta(t)) return false
  if (esGuiaTuristicaPura(t) || esGasolineraSinSitio(t)) return false
  return pideUtilCamper(t) || /mascotas|pets|animales|haustier|animaux|water|electricity|[eé]lectricit[eé]|strom|acqua|elettricit/i.test(t)
}

export type AtajoIntencion = 'ambigua' | 'guia' | 'gas_sin_sitio' | 'ruta_sin_intencion' | 'filtro_sin_sitio'

/** El asistente ya listó áreas: lo siguiente es un seguimiento, no una pregunta nueva. */
export function asistenteListoAreas(texto: string | null | undefined): boolean {
  return /🚐|\/area\//.test(texto || '')
}

export function clasificarIntencion(opts: {
  ultimo: string
  previosUsuario?: string[]
  ultimoAsistente?: string | null
}): AtajoIntencion | null {
  const ultimo = (opts.ultimo || '').trim()
  if (!ultimo) return null
  if (esGuiaTuristicaPura(ultimo)) return 'guia'
  if (esGasolineraSinSitio(ultimo)) return 'gas_sin_sitio'
  if (esPreguntaAreaConcreta(ultimo) || esDeixisMapa(ultimo)) return null
  if (esRutaSinIntencion(ultimo)) return 'ruta_sin_intencion'
  const hiloRuta =
    (opts.previosUsuario || []).some((t) => parecePreguntaRuta(t) || Boolean(extraerRutaNombrada(t))) ||
    /planificador de rutas|\/ruta/i.test(opts.ultimoAsistente || '')
  if (hiloRuta && tieneDetalleParadaRuta(ultimo)) return 'ruta_sin_intencion'
  if (asistentePidioClarificar(opts.ultimoAsistente)) return null
  // Si el asistente acaba de listar áreas, "amplía", "esas no son gratis" o
  // "y con duchas" son seguimientos: el modelo debe usar el hilo, no preguntar dónde.
  const hiloConAreas = asistenteListoAreas(opts.ultimoAsistente)
  if (esFiltroSinSitio(ultimo)) return hiloConAreas ? null : 'filtro_sin_sitio'
  if (!esSitioSinIntencion(ultimo)) return null
  if (hiloConAreas) return null
  const hiloUtil = (opts.previosUsuario || []).some((t) => pideUtilCamper(t))
  if (hiloUtil) return null
  return 'ambigua'
}

function urlBlog(locale: ChatLocale): string {
  return locale === 'en' ? 'https://www.furgocasa.com/en/blog?category=rutas' : BLOG_RUTAS_FURGOCASA
}

export function textoAtajoIntencion(tipo: AtajoIntencion, locale: ChatLocale, sitio?: string): string {
  const blog = urlBlog(locale)
  const lugar = (sitio || '').trim()
  const deLugar = lugar ? { es: ` de ${lugar}`, en: ` about ${lugar}`, fr: ` sur ${lugar}`, de: ` zu ${lugar}`, it: ` su ${lugar}`, pt: ` de ${lugar}` }[locale] : ''

  const ruta = lugar || 'esa ruta'
  const filtro = lugar || 'esas áreas'
  const textos: Record<AtajoIntencion, Record<ChatLocale, string>> = {
    filtro_sin_sitio: {
      es: `Entiendo: ${filtro}. ¿Dónde las buscas?\n• ¿Cerca de tu ubicación actual?\n• ¿En una localidad? Dime cuál.\n• ¿En un punto del mapa? Dime la zona.`,
      en: `Got it: ${filtro}. Where should I look?\n• Near your current location?\n• In a town? Tell me which.\n• Around a spot on the map? Tell me the area.`,
      fr: `Compris : ${filtro}. Où je cherche ?\n• Près de ta position actuelle ?\n• Dans une ville ? Dis-moi laquelle.\n• Autour d’un point sur la carte ?`,
      de: `Verstanden: ${filtro}. Wo soll ich suchen?\n• In deiner Nähe?\n• In einem Ort? Sag welchen.\n• An einem Punkt auf der Karte?`,
      it: `Capito: ${filtro}. Dove le cerco?\n• Vicino a te?\n• In un paese? Dimmi quale.\n• In un punto della mappa?`,
      pt: `Percebi: ${filtro}. Onde as procuro?\n• Perto da tua localização?\n• Numa localidade? Diz qual.\n• Num ponto do mapa?`,
    },
    ruta_sin_intencion: {
      es: lugar && lugar.includes('→')
        ? `Para paradas de ${ruta} no te suelto áreas a ojo: el chat no ve el trazado real y acaba acertando a medias.\n\nUsa el planificador: marca origen y destino, calcula el camino y te enseña las áreas que quedan de verdad en la ruta.\n\n${enlaceDesdeEtiqueta(lugar)}`
        : `Para paradas en una ruta usa el planificador: marca origen y destino y ves las áreas del camino. Aquí no especulo con un listado suelto.\n\n/ruta`,
      en: lugar && lugar.includes('→')
        ? `For stops on ${ruta} I won’t guess a handful of areas — the chat can’t see the real road.\n\nUse the route planner: set origin and destination, it traces the drive and shows areas that are actually on the way.\n\n${enlaceDesdeEtiqueta(lugar)}`
        : `For stops along a route, use the planner: set origin and destination and see the areas on the way. I won’t guess a loose list here.\n\n/ruta`,
      fr: lugar && lugar.includes('→')
        ? `Pour les haltes de ${ruta} je ne te jette pas des aires au hasard : le chat ne voit pas le tracé réel.\n\nUtilise le planificateur : origine, destination, itinéraire, puis les aires vraiment sur le chemin.\n\n${enlaceDesdeEtiqueta(lugar)}`
        : `Pour des haltes sur un trajet, utilise le planificateur : origine, destination, et les aires du chemin. Pas de liste au hasard ici.\n\n/ruta`,
      de: lugar && lugar.includes('→')
        ? `Für Stopps auf ${ruta} rate ich keine Stellplätze — der Chat sieht die echte Strecke nicht.\n\nNimm den Routenplaner: Start, Ziel, Strecke, dann die Plätze, die wirklich am Weg liegen.\n\n${enlaceDesdeEtiqueta(lugar)}`
        : `Für Stopps auf einer Route nimm den Planer: Start und Ziel, dann die Plätze am Weg. Hier rate ich keine lose Liste.\n\n/ruta`,
      it: lugar && lugar.includes('→')
        ? `Per le soste di ${ruta} non ti butto aree a caso: la chat non vede il percorso vero.\n\nUsa il pianificatore: origine, destinazione, tracciato, e le aree che stanno davvero sulla strada.\n\n${enlaceDesdeEtiqueta(lugar)}`
        : `Per soste su un percorso usa il pianificatore: origine e destinazione, e vedi le aree sulla strada. Qui non speculo con una lista sciolta.\n\n/ruta`,
      pt: lugar && lugar.includes('→')
        ? `Para paragens de ${ruta} não te deito áreas a olho: o chat não vê o traçado real.\n\nUsa o planeador: origem, destino, caminho, e as áreas que ficam mesmo na rota.\n\n${enlaceDesdeEtiqueta(lugar)}`
        : `Para paragens numa rota usa o planeador: origem e destino, e vês as áreas do caminho. Aqui não especulo com uma lista solta.\n\n/ruta`,
    },
    ambigua: {
      es: `Perdona, no me queda claro qué información necesitas${deLugar}. ¿Buscas un área donde dormir, servicios (agua, electricidad) o una gasolinera en la zona?\n\nSi lo que quieres es qué ver, qué pueblos visitar o una guía de viaje, eso no lo cubro: en Furgocasa hay rutas pensadas para camper:\n${blog}`,
      en: `Sorry, I’m not sure what you need${deLugar}. Are you looking for a place to sleep in the van, services (water, electricity), or a petrol station?\n\nIf you want sights, towns or a travel guide, that’s not what I do. Furgocasa has camper routes here:\n${blog}`,
      fr: `Pardon, je ne vois pas bien ce dont tu as besoin${deLugar}. Tu cherches une aire pour dormir, des services (eau, électricité) ou une station-service ?\n\nSi tu veux quoi voir, quels villages visiter ou un guide, ce n’est pas mon rôle. Les routes camper de Furgocasa sont ici :\n${blog}`,
      de: `Sorry, mir ist nicht klar, was du${deLugar} brauchst. Suchst du einen Stellplatz zum Übernachten, Services (Wasser, Strom) oder eine Tankstelle?\n\nWenn du Sehenswürdigkeiten, Dörfer oder einen Reiseführer willst: das mache ich nicht. Camper-Routen von Furgocasa:\n${blog}`,
      it: `Scusa, non mi è chiaro cosa ti serve${deLugar}. Cerchi un’area dove dormire, servizi (acqua, elettricità) o un distributore?\n\nSe vuoi cosa vedere, borghi o una guida, non è il mio campo. Le rotte camper di Furgocasa:\n${blog}`,
      pt: `Desculpa, não percebo o que precisas${deLugar}. Procuras uma área para dormir, serviços (água, eletricidade) ou um posto de combustível?\n\nSe queres o que ver, aldeias ou um guia, não é o meu trabalho. Rotas camper da Furgocasa:\n${blog}`,
    },
    guia: {
      es: `Esto no es una guía de viajes. Te ayudo con áreas de autocaravana y lo útil del camino (dónde dormir, gasolinera en la ruta).\n\nSi buscas pueblos, planes o qué ver, mira las rutas de Furgocasa:\n${blog}`,
      en: `This is not a travel guide. I help with motorhome areas and practical stuff on the road (where to sleep, petrol on the route).\n\nFor towns, plans or what to see, check Furgocasa’s camper routes:\n${blog}`,
      fr: `Ce n’est pas un guide de voyage. Je t’aide pour les aires camping-car et le pratique (où dormir, station-service sur la route).\n\nPour les villages, les visites ou quoi voir, les routes Furgocasa :\n${blog}`,
      de: `Das ist kein Reiseführer. Ich helfe mit Stellplätzen und dem Nützlichen unterwegs (übernachten, Tankstelle auf der Strecke).\n\nFür Orte, Tipps oder Sehenswürdigkeiten: Camper-Routen von Furgocasa:\n${blog}`,
      it: `Non sono una guida turistica. Ti aiuto con aree sosta e il pratico (dove dormire, benzina sul percorso).\n\nPer borghi, cose da fare o cosa vedere, le rotte Furgocasa:\n${blog}`,
      pt: `Isto não é um guia de viagens. Ajudo com áreas de autocaravana e o útil da estrada (onde dormir, combustível na rota).\n\nPara aldeias, planos ou o que ver, as rotas da Furgocasa:\n${blog}`,
    },
    gas_sin_sitio: {
      es: `¿Gasolinera en qué zona, o entre qué dos ciudades? Dime origen y destino (o la ciudad) y te busco algo útil en la ruta.`,
      en: `A petrol station where — which area, or between which two cities? Tell me origin and destination (or the town) and I’ll look it up.`,
      fr: `Une station-service où — quelle zone, ou entre quelles villes ? Donne-moi l’origine et la destination (ou la ville).`,
      de: `Tankstelle wo — welche Gegend, oder zwischen welchen Städten? Sag Start und Ziel (oder den Ort).`,
      it: `Distributore dove — in che zona, o tra quali città? Dimmi origine e destinazione (o la città).`,
      pt: `Posto onde — em que zona, ou entre que cidades? Diz origem e destino (ou a cidade).`,
    },
  }

  return textos[tipo][locale] || textos[tipo].es
}

export function etiquetaFiltro(mensaje: string): string {
  const t = (mensaje || '').replace(/[\u{1F300}-\u{1FAFF}🆓⭐🛣️💧🐕]/gu, '').replace(/\s+/g, ' ').trim()
  return t.length > 60 ? `${t.slice(0, 57)}…` : t
}

export function chipsSeguimiento(tipo: AtajoIntencion, locale: ChatLocale, sitio?: string): string[] {
  const t: Record<AtajoIntencion, Record<ChatLocale, string[]>> = {
    filtro_sin_sitio: {
      es: ['Cerca de mi ubicación', 'En una localidad', 'En un punto del mapa'],
      en: ['Near my location', 'In a town', 'Around a map spot'],
      fr: ['Près de moi', 'Dans une ville', 'Sur la carte'],
      de: ['In meiner Nähe', 'In einem Ort', 'Auf der Karte'],
      it: ['Vicino a me', 'In un paese', 'Sulla mappa'],
      pt: ['Perto de mim', 'Numa localidade', 'No mapa'],
    },
    ruta_sin_intencion: { es: [], en: [], fr: [], de: [], it: [], pt: [] },
    ambigua: { es: [], en: [], fr: [], de: [], it: [], pt: [] },
    guia: { es: [], en: [], fr: [], de: [], it: [], pt: [] },
    gas_sin_sitio: { es: [], en: [], fr: [], de: [], it: [], pt: [] },
  }
  return t[tipo]?.[locale] || t[tipo]?.es || []
}
