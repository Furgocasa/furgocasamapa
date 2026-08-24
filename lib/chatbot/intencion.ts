import type { ChatLocale } from '@/lib/chatbot/functions'

export const BLOG_RUTAS_FURGOCASA = 'https://www.furgocasa.com/es/blog?category=rutas'

const UTIL_RE =
  /(^|[^\p{L}\p{N}])(area|área|areas|áreas|stellplatz|sosta|aire camping|pernoct|dormir|autocaravana|autocaravanas|camper|furgo|furgoneta|motorhome|gasolinera|gasolineras|gasolina|di[eé]sel|petrol|tankstelle|taller|luz|electricidad|agua|ducha|duchas|wifi|wc|vaciado|precio|gratis|free|cerca de m[ií]|mejores|best)(?=[^\p{L}\p{N}]|$)/iu

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
  return /no me queda claro|qu[eé] informaci[oó]n necesitas|not sure what you need|what do you need about|pas clair|de quoi tu as besoin|nicht klar|was du brauchst|non mi [eè] chiaro/i.test(
    texto || ''
  )
}

export type AtajoIntencion = 'ambigua' | 'guia' | 'gas_sin_sitio'

export function clasificarIntencion(opts: {
  ultimo: string
  previosUsuario?: string[]
  ultimoAsistente?: string | null
}): AtajoIntencion | null {
  const ultimo = (opts.ultimo || '').trim()
  if (!ultimo) return null
  if (esGuiaTuristicaPura(ultimo)) return 'guia'
  if (esGasolineraSinSitio(ultimo)) return 'gas_sin_sitio'
  if (asistentePidioClarificar(opts.ultimoAsistente)) return null
  if (!esSitioSinIntencion(ultimo)) return null
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

  const textos: Record<AtajoIntencion, Record<ChatLocale, string>> = {
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
