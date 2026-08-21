/** Tipos de ubicación en el mapa. El valor `parking` en BD se muestra como Stopover. */
export type TipoArea = 'publica' | 'privada' | 'camping' | 'parking'

export const TIPO_AREA_IDS: TipoArea[] = ['publica', 'privada', 'camping', 'parking']

export const TIPO_AREA_COLORS: Record<TipoArea, string> = {
  publica: '#0284c7',
  privada: '#FF6B35',
  camping: '#52B788',
  parking: '#7C3AED',
}

export const TIPO_AREA_BADGE_CLASSES: Record<TipoArea, string> = {
  publica: 'bg-sky-500/90 text-white backdrop-blur-md border border-sky-400/30',
  privada: 'bg-orange-500/90 text-white backdrop-blur-md border border-orange-400/30',
  camping: 'bg-emerald-500/90 text-white backdrop-blur-md border border-emerald-400/30',
  parking: 'bg-violet-600/90 text-white backdrop-blur-md border border-violet-400/30',
}

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
  return /\bcamping[-\s]?cars?\b|\bcampingcar\b/.test(n)
}

/** Anfitrión que invita una noche. No es un área: el sitio existe para otra cosa. */
function esStopoverDeAnfitrion(n: string): boolean {
  return /\b(weingut|chez l.habitant|parking de passage|brit.?stop|stopover|stop over)\b/.test(n)
}

function esParkingAutocaravana(n: string): boolean {
  return (
    /\b(parking|aparcamiento|estacionamiento|estacionamento)\b/.test(n) &&
    /\b(autocaravana|autocaravanes|caravana|camper|wohnmobil|reisemobil|camping[-\s]?car|motorhome)\b/.test(
      n
    )
  )
}

/**
 * En España/Portugal «Parking autocaravanas» es un área (municipal o privada),
 * no un stopover. El stopover es pub/tienda/granja que invita una noche.
 */
function esStopoverHint(n: string, pais?: string): boolean {
  if (esStopoverDeAnfitrion(n)) return true
  if (pais === 'España' || pais === 'Portugal') return false

  const motorhome =
    /\b(autocaravana|autocaravanes|caravana|camper|wohnmobil|reisemobil|camping[-\s]?car|motorhome)\b/.test(
      n
    ) || /wohnmobil|reisemobil/.test(n)
  if (!motorhome && !/\b(overnight parking)\b/.test(n)) {
    return false
  }
  return (
    /\b(overnight parking)\b/.test(n) ||
    (/\b(parking|aparcamiento|estacionamiento|estacionamento|parkplatz|parcheggio)\b/.test(n) &&
      !/\barea de (servicio|servicios|autocaravanas|aparcamiento)\b/.test(n) &&
      !/\b(stellplatz|area sosta|sosta camper)\b/.test(n))
  )
}

function esMarcaPrivada(n: string): boolean {
  return (
    /\b(camper ?park|camperpark|camper ?parking|camper ?stop|camperstop|vanventure|low cost|bon bini|stop and go|barcelona beach|granadaparking|portaventura|ciutat caravaning|parkingvan|mundo autocaravanas|valcaravan|webcaravan|sol calnegre|tortuga mora|los narejos|maravilla parking|el moreral|murcia rio|anibal)\b/.test(
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
    /\b(area de (autocaravanas?|autocaravanes|servicio|servicios)|area autocaravanas?|aire de services?|aire d'accueil|area sosta|sosta camper)\b/.test(
      n
    )
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
    /\b(wild ?camp(ing)?|wildcamping|boondock(ing)?|dispersed camping|bivouac)\b/.test(n)
  )
}

export function getTipoAreaColor(tipo?: string | null): string {
  if (tipo && tipo in TIPO_AREA_COLORS) {
    return TIPO_AREA_COLORS[tipo as TipoArea]
  }
  return TIPO_AREA_COLORS.publica
}

export function getTipoAreaBadgeClass(tipo?: string | null): string {
  if (tipo && tipo in TIPO_AREA_BADGE_CLASSES) {
    return TIPO_AREA_BADGE_CLASSES[tipo as TipoArea]
  }
  return TIPO_AREA_BADGE_CLASSES.publica
}

/**
 * Pública = municipal / organismo público.
 * Privada = empresa o particular.
 * Camping = camping comercial / CL / trailer/RV park.
 * Parking (Stopover) = anfitrión que invita una noche (pub, tienda, granja).
 * En España «Parking autocaravanas» es un área, no un stopover.
 * Zona de acampada y similar no se clasifican: usar esPernoctaSinServicio().
 */
export function classifyTipoArea(
  name: string,
  opts: { pais?: string | null; types?: string[] } = {}
): TipoArea {
  const n = norm(name)
  const types = opts.types || []
  const pais = (opts.pais || '').trim()
  const iberia = pais === 'España' || pais === 'Portugal'

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

  // En UK «stopover» en el nombre suele ser un sitio pequeño para la furgo
  // (privada), no un pub. Brit Stop / pub stopover sí es stopover.
  if (esStopoverDeAnfitrion(n)) {
    const stopoverUkEsAnfitrion = /\b(brit.?stop|pub|inn|tavern)\b/.test(n)
    if (!esUk || stopoverUkEsAnfitrion) {
      return 'parking'
    }
  }

  if (/\b(privad[oa]|privata)\b/.test(n) && (esAire || /\barea\b/.test(n))) {
    return 'privada'
  }

  if (/\bcamping[-\s]?car park\b/.test(n) || esMarcaPrivada(n)) {
    return 'privada'
  }

  // En España «área camping» / «área camper» es un área, no un recinto.
  // «Área camper + pueblo» suele ser municipal (Guitiriz). Marca comercial → privada.
  const esAreaEnNombre =
    /\barea(s)? (de )?(camping|camper|autocaravanas?|autocaravanes)\b/.test(n)
  if (esAreaEnNombre) {
    if (esMarcaPrivada(n) || /\barea(s)? (de )?camping\b/.test(n)) {
      return 'privada'
    }
    return 'publica'
  }

  // Parking/aparcamiento de autocaravanas en Iberia = área (titularidad por marca).
  if (iberia && esParkingAutocaravana(n)) {
    return 'publica'
  }

  const nameIsCamping =
    !isMotorhomeWording(n) &&
    !esAreaEnNombre &&
    /\b(camping|campeggio|campismo|campground|campamentos?|campament|acampada|caravan park|holiday park|touring park|trailer park|rv park|rv resort|parque de trailers?|parque de campismo)\b/.test(
      n
    )
  const typeIsCamping =
    LATAM.has(pais) && (types.includes('campground') || types.includes('rv_park'))
  const esCampingReal = nameIsCamping || typeIsCamping

  if (esCampingReal) {
    return 'camping'
  }

  // Weingut / chez l'habitant = stopover (pernocta de paso), aunque digan Stellplatz
  if (/\b(weingut|chez l.habitant|parking de passage)\b/.test(n)) {
    return 'parking'
  }

  // En DACH el Stellplatz es el área (municipal o privada), no un stopover UK
  if (/\b(wohnmobilstellplatz|reisemobilstellplatz|stellplatz)\b/.test(n)) {
    if (/\bprivat/.test(n)) return 'privada'
    return 'publica'
  }

  if (esAire || (municipal && !esStopoverHint(n, pais))) {
    return 'publica'
  }

  if (/\b(certified location|certificated (site|location)|camc\b.*\bcl\b|\bcl\b.*camc)\b/.test(n)) {
    return 'privada'
  }

  if (esStopoverHint(n, pais)) {
    return 'parking'
  }

  if (/\b(particular|finca|camper ?park|camper ?stop|autocaravaning)\b/.test(n)) {
    return 'privada'
  }

  if (LATAM.has(pais)) {
    if (types.includes('rv_park') || types.includes('campground')) return 'camping'
    return 'privada'
  }

  if (esUk) {
    // Arosfan / aire del consejo (Gwynedd). El resto de «aire» UK es CAMpRA o anfitrión.
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
