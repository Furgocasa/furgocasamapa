/** Tipos de ubicación en el mapa. Solo tres. */
export type TipoArea = 'publica' | 'privada' | 'camping'

export const TIPO_AREA_IDS: TipoArea[] = ['publica', 'privada', 'camping']

export const TIPO_AREA_COLORS: Record<TipoArea, string> = {
  publica: '#0284c7',
  privada: '#FF6B35',
  camping: '#52B788',
}

export const TIPO_AREA_BADGE_CLASSES: Record<TipoArea, string> = {
  publica: 'bg-sky-500/90 text-white backdrop-blur-md border border-sky-400/30',
  privada: 'bg-orange-500/90 text-white backdrop-blur-md border border-orange-400/30',
  camping: 'bg-emerald-500/90 text-white backdrop-blur-md border border-emerald-400/30',
}

export function tipoAreaParaPrompt(tipo?: string | null): string {
  if (tipo === 'camping') return 'camping (recinto con parcela)'
  if (tipo === 'privada') return 'área privada (empresa o particular)'
  if (tipo === 'publica') return 'área pública (ayuntamiento u organismo)'
  return 'área de autocaravanas'
}

/** Para prompts de búsqueda, ficha y chatbot. No buscar estas tres palabras: buscar el nombre local. */
export const REGLA_TRES_TIPOS_PROMPT =
  'En este mapa solo hay tres tipos: área pública, área privada y camping. Se busca con el nombre local del territorio (aire, sosta, Stellplatz, camperplaats, CL, parking autocaravanas, trailer park, Weingut). Eso es etiqueta, no un tipo extra. Si no encaja en una de las tres, no entra. No existe la categoría stopover.'

const LATAM = new Set([
  'México',
  'Mexico',
  'Guatemala',
  'Belice',
  'Honduras',
  'El Salvador',
  'Nicaragua',
  'Costa Rica',
  'Panamá',
  'Panama',
  'Cuba',
  'República Dominicana',
  'Puerto Rico',
  'Jamaica',
  'Haití',
  'Argentina',
  'Chile',
  'Uruguay',
  'Paraguay',
  'Brasil',
  'Brazil',
  'Bolivia',
  'Perú',
  'Peru',
  'Ecuador',
  'Colombia',
  'Venezuela',
  'Guyana',
  'Surinam',
])

function norm(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Evita tratar "camping-car" (autocaravana) como camping. */
function isMotorhomeWording(n: string): boolean {
  return /\bcamping[-\s]?cars?\b|\bcamping[-\s]?ca\b|\bcampingcar\b/.test(n)
}

/** Anfitrión que invita una noche. No es un área: el sitio existe para otra cosa. */
function esStopoverDeAnfitrion(n: string): boolean {
  return /\b(weingut|chez l.habitant|parking de passage|brit.?stop|stopover|stop over)\b/.test(n)
}

function esParkingAutocaravana(n: string): boolean {
  return (
    /\b(parking|aparcamiento|estacionamiento|estacionamento|parkplatz|parcheggio)\b/.test(n) &&
    /\b(autocaravana|autocaravanes|caravana|camper|wohnmobil|reisemobil|camping[-\s]?car|motorhome)\b/.test(
      n
    )
  ) || /wohnmobil[-\s]?parkplatz|parkplatz[-\s]?wohnmobil/.test(n)
}

function esAnfitrionPrivado(n: string): boolean {
  return (
    esStopoverDeAnfitrion(n) ||
    /\b(weingut|obsthof|bauernhof|buschenschank|heuriger|chez l.habitant|brit.?stop)\b/.test(n)
  )
}

function esMarcaPrivada(n: string): boolean {
  return (
    /\b(camper ?park(?!ing)|camperpark|camperparking|camper ?stop|camperstop|vanventure|low cost|bon bini|stop and go|barcelona beach|granadaparking|portaventura|ciutat caravaning|parkingvan|mundo autocaravanas|valcaravan|webcaravan|sol calnegre|tortuga mora|los narejos|maravilla parking|el moreral|murcia rio|anibal)\b/.test(
      n
    ) ||
    (/\bgranja\b/.test(n) && !/\bla granja(\s+d|\s*$)/.test(n) && !/\barea(s)? autocaravanas la granja\b/.test(n)) ||
    /\bfinca-?caravana\b/.test(n) ||
    (/\bcaravan park\b/.test(n) && /\barea\b/.test(n))
  )
}

function esAreaHabilitadaEnNombre(n: string): boolean {
  return (
    isMotorhomeWording(n) ||
    /\b(area de (autocaravanas?|autocaravanes|servicio|servicios)|area autocaravanas?|aire de services?|aire d'accueil|area sosta|sosta camper|camperplaats)\b/.test(
      n
    ) ||
    /stallplats|bobilplass|autocamperplads/.test(n)
  )
}

/**
 * Pernocta sin servicio de área (zona de acampada, aire naturelle, wild camp).
 * No es un tipo: no entra en el mapa. Si el nombre deja claro que es área
 * o aire de camping-car, no se descarta.
 */
export function esPernoctaSinServicio(name: string): boolean {
  const n = norm(name)
  if (!n || esAreaHabilitadaEnNombre(n)) return false

  return (
    /\bzona(s)? de acampada\b/.test(n) ||
    /\bzona acampada\b/.test(n) ||
    /\bzona camping\b/.test(n) ||
    /\bacampada (libre|rural)\b/.test(n) ||
    /\baires? naturelles?\b/.test(n) ||
    /\b(wild ?camp(ing)?|wildcamping|boondock(ing)?|dispersed camping|bivouac|allemansratt|allemannsrett|fri teltning)\b/.test(n)
  )
}

function tieneSenalDeLasCuatro(n: string, types: string[]): boolean {
  if (types.includes('campground') || types.includes('rv_park')) return true
  if (esAreaHabilitadaEnNombre(n)) return true
  if (esParkingAutocaravana(n)) return true
  if (esMarcaPrivada(n) || esAnfitrionPrivado(n)) return true
  return (
    /\b(stellplatz|wohnmobilstellplatz|reisemobilstellplatz|area sosta|sosta camper|arosfan|camperplaats)\b/.test(
      n
    ) ||
    /stallplats|bobilplass|autocamperplads/.test(n) ||
    (/\baires?\b/.test(n) && !/\b(airport|aire acondicionado)\b/.test(n)) ||
    /\b(camping|campeggio|campismo|campsite|camp site|campground|caravan park|holiday park|touring park|trailer park|rv park|campingplatz|campingplads|campingplass|parque de campismo)\b/.test(
      n
    ) ||
    /\b(certified location|certificated (site|location)|certified site|cl site|c&cc|club cs)\b/.test(
      n
    ) ||
    /\b cl(\s+site)?\b/.test(n) ||
    /\b(camper ?park|camperstop|area camper|area camping)\b/.test(n) ||
    /\b(weingut|chez l.habitant|parking de passage|brit.?stop)\b/.test(n) ||
    /\b(casa.?rodante|casas rodantes|motorhome|trailer)\b/.test(n)
  )
}

/** Taller, hire, solar, wild camp, parking de día: no es ninguna de las tres. */
export function esFueraDelMapa(name: string, types: string[] = []): boolean {
  if (esPernoctaSinServicio(name)) return true
  const n = norm(name)
  if (!n) return true
  if (/\b(now closed|permanently closed|closed down|cerrado definitivamente)\b/.test(n)) {
    return true
  }
  if (/^\d+\s*,/.test(name.trim())) return true
  if (types.includes('car_dealer')) return true
  if (
    types.includes('car_repair') &&
    !types.includes('campground') &&
    !/\b(stellplatz|aire|area|sosta|camping)\b/.test(n)
  ) {
    return true
  }
  if (
    /\b(hire|rental|alquiler|arriendo|vermietung|noleggio|location de )\b/.test(n) &&
    /\b(camper|motorhome|van|autocaravana|wohnmobil|fourgon|casa.?rodante)\b/.test(n)
  ) {
    return true
  }
  if (/\b(residential|park home|mobile home sales)\b/.test(n) && !/\b(touring|campsite|aire)\b/.test(n)) {
    return true
  }
  if (/\b(storage|marina seca|invernaje|caravan sales)\b/.test(n)) return true
  if (
    /\b(services ltd|taller|workshop|depot|escapes)\b/.test(n) &&
    !/\b(aire|stellplatz|campsite|camping|cl site|area)\b/.test(n)
  ) {
    return true
  }
  if (
    /\bofficial motorhome parking\b/.test(n) &&
    !/\b(stopover|aire|arosfan|overnight stay)\b/.test(n)
  ) {
    return true
  }
  if (types.includes('store') && /\b(depot|sales|parts)\b/.test(n)) return true
  return false
}

export type DecisionUbicacion = {
  admite: boolean
  tipo: TipoArea | null
  motivo: string
}

/**
 * Puerta de las búsquedas nuevas: clasifica al encontrar.
 * Si no encaja en una de las tres, no se inserta (tipo = null).
 */
export function decidirUbicacion(
  name: string,
  opts: { pais?: string | null; types?: string[] } = {}
): DecisionUbicacion {
  const types = opts.types || []
  const n = norm(name)
  if (!n) return { admite: false, tipo: null, motivo: 'sin-nombre' }
  if (esFueraDelMapa(name, types)) {
    return { admite: false, tipo: null, motivo: 'fuera-del-mapa' }
  }
  if (!tieneSenalDeLasCuatro(n, types)) {
    return { admite: false, tipo: null, motivo: 'sin-senal-de-las-tres' }
  }
  return {
    admite: true,
    tipo: classifyTipoArea(name, opts),
    motivo: 'ok',
  }
}

export function admiteEnMapa(
  name: string,
  opts: { pais?: string | null; types?: string[] } = {}
): boolean {
  return decidirUbicacion(name, opts).admite
}

/** Anota un resultado de Google Places al encontrarlo. */
export function anotarLugarEncontrado<T extends { name: string; types?: string[] }>(
  place: T,
  pais?: string | null
): T & { admite: boolean; tipo_area: TipoArea | null; motivo_tipo: string } {
  const d = decidirUbicacion(place.name, { types: place.types || [], pais })
  return { ...place, admite: d.admite, tipo_area: d.tipo, motivo_tipo: d.motivo }
}

export function getTipoAreaColor(tipo?: string | null): string {
  if (tipo === 'parking') return TIPO_AREA_COLORS.privada
  if (tipo && tipo in TIPO_AREA_COLORS) {
    return TIPO_AREA_COLORS[tipo as TipoArea]
  }
  return TIPO_AREA_COLORS.publica
}

export function getTipoAreaBadgeClass(tipo?: string | null): string {
  if (tipo === 'parking') return TIPO_AREA_BADGE_CLASSES.privada
  if (tipo && tipo in TIPO_AREA_BADGE_CLASSES) {
    return TIPO_AREA_BADGE_CLASSES[tipo as TipoArea]
  }
  return TIPO_AREA_BADGE_CLASSES.publica
}

/**
 * Pública = municipal / organismo público.
 * Privada = empresa o particular (camper park, Weingut, granja, CL).
 * Camping = recinto comercial / touring park.
 * Zona de acampada y similar no se clasifican: usar esPernoctaSinServicio().
 */
export function classifyTipoArea(
  name: string,
  opts: { pais?: string | null; types?: string[] } = {}
): TipoArea {
  const n = norm(name)
  const types = opts.types || []
  const pais = (opts.pais || '').trim()

  const municipal =
    /\b(municipal|municipio|ayuntamiento|concejo|consell|consorcio|diputacion|alcaldia|publico|publica|gratuit[oa]? municipal)\b/.test(
      n
    )

  const esAire =
    /\b(aire d'accueil|aire de services?|aires? de |area de servicio|area de servicos?|area de servico|estacion de servicio|sosta)\b/.test(
      n
    ) ||
    /\barea (de )?(autocaravanas?|autocaravanes|servicio|servicios|aparcamiento|estacionamiento)\b/.test(
      n
    ) ||
    /\barea autocaravanas?\b/.test(n) ||
    (/\baires?\b/.test(n) && !/\b(airport|aire acondicionado)\b/.test(n))

  const esUk = pais === 'Reino Unido' || pais === 'United Kingdom'

  // En España «área camping» / «área camper» es un área, no un recinto.
  const esAreaEnNombre =
    /\barea(s)? (de )?(camping|camper|autocaravanas?|autocaravanes)\b/.test(n)

  const nameIsCamping =
    !isMotorhomeWording(n) &&
    !esAreaEnNombre &&
    !/\b(rimessaggio|soccorso|storage|invernaje)\b/.test(n) &&
    /\b(camping|campeggio|campismo|campground|campamentos?|campament|acampada|caravan park|holiday park|touring park|trailer park|rv park|rv resort|parque de trailers?|parque de campismo|campingplads|campingplass)\b/.test(
      n
    )

  if (nameIsCamping) {
    return 'camping'
  }

  if (esAnfitrionPrivado(n) || esMarcaPrivada(n) || /\bcamping[-\s]?car park\b/.test(n)) {
    return 'privada'
  }

  if (/\b(privad[oa]|privata)\b/.test(n) && (esAire || /\barea\b/.test(n))) {
    return 'privada'
  }

  if (esAreaEnNombre) {
    if (/\barea(s)? (de )?camping\b/.test(n)) {
      return 'privada'
    }
    return 'publica'
  }

  // Parking / Parkplatz / parcheggio de autocaravanas = área.
  if (esParkingAutocaravana(n)) {
    return 'publica'
  }
  const typeIsCamping =
    LATAM.has(pais) && (types.includes('campground') || types.includes('rv_park'))

  if (nameIsCamping || typeIsCamping) {
    return 'camping'
  }

  if (/\b(wohnmobilstellplatz|reisemobilstellplatz|stellplatz)\b/.test(n)) {
    if (/\bprivat/.test(n)) return 'privada'
    return 'publica'
  }

  if (/\bcamperplaats(en)?\b/.test(n)) {
    if (/\b(prive|privee|privat|particulier)\b/.test(n)) return 'privada'
    return 'publica'
  }

  // Nordics: ställplats / bobilplass / autocamperplads = área
  if (/stallplats|bobilplass|autocamperplads/.test(n)) {
    if (/\bprivat/.test(n)) return 'privada'
    return 'publica'
  }

  if (esAire || municipal) {
    return 'publica'
  }

  if (/\b(certified location|certificated (site|location)|camc\b.*\bcl\b|\bcl\b.*camc)\b/.test(n)) {
    return 'privada'
  }

  if (/\b(particular|finca|camper ?park(?!ing)|camper ?stop|autocaravaning)\b/.test(n)) {
    return 'privada'
  }

  if (LATAM.has(pais)) {
    if (types.includes('rv_park') || types.includes('campground')) return 'camping'
    return 'privada'
  }

  if (esUk) {
    if (/\b(arosfan|y glyn)\b/.test(n) || (/\baire\b/.test(n) && /\b(pwllheli|cricieth|llanberis|caernarfon)\b/.test(n))) {
      return 'publica'
    }
    if (/\baire\b/.test(n)) return 'privada'
    if (
      /\b(certified location|certificated (site|location)|certified site|cl site|camc\b.*\bcl\b|\bcl\b.*camc|c&cc)\b/.test(
        n
      ) ||
      /\b cl(\s+site)?\b/.test(n) ||
      /\bclub cs\b/.test(n)
    ) {
      return 'privada'
    }
    return 'camping'
  }

  return 'publica'
}
