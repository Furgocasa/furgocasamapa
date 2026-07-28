import type { Locale } from './config'

type Dict = Record<Locale, string>

export const TIPO_AREA_LABELS: Record<string, Dict> = {
  publica: {
    es: 'Pública',
    en: 'Public',
    fr: 'Publique',
    de: 'Öffentlich',
    it: 'Pubblica',
  },
  privada: {
    es: 'Privada',
    en: 'Private',
    fr: 'Privée',
    de: 'Privat',
    it: 'Privata',
  },
  camping: {
    es: 'Camping',
    en: 'Campsite',
    fr: 'Camping',
    de: 'Campingplatz',
    it: 'Campeggio',
  },
  parking: {
    es: 'Parking',
    en: 'Parking',
    fr: 'Parking',
    de: 'Parkplatz',
    it: 'Parcheggio',
  },
}

/** Labels cortos para chips/filtros/popups */
export const SERVICIO_LABELS: Record<string, Dict> = {
  agua: { es: 'Agua', en: 'Water', fr: 'Eau', de: 'Wasser', it: 'Acqua' },
  electricidad: { es: 'Electricidad', en: 'Electricity', fr: 'Électricité', de: 'Strom', it: 'Elettricità' },
  vaciado_aguas_negras: {
    es: 'Vaciado Químico',
    en: 'Chemical toilet dump',
    fr: 'Vidange WC chimique',
    de: 'Chemietoilette',
    it: 'Svuotamento WC chimico',
  },
  vaciado_quimico: {
    es: 'Vaciado WC',
    en: 'Toilet dump',
    fr: 'Vidange WC',
    de: 'WC-Entsorgung',
    it: 'Svuotamento WC',
  },
  vaciado_aguas_grises: {
    es: 'Aguas grises',
    en: 'Grey water',
    fr: 'Eaux grises',
    de: 'Grauwasser',
    it: 'Acque grigie',
  },
  wifi: { es: 'WiFi', en: 'WiFi', fr: 'WiFi', de: 'WLAN', it: 'WiFi' },
  duchas: { es: 'Duchas', en: 'Showers', fr: 'Douches', de: 'Duschen', it: 'Docce' },
  wc: { es: 'WC', en: 'Toilets', fr: 'WC', de: 'WC', it: 'WC' },
  lavanderia: { es: 'Lavandería', en: 'Laundry', fr: 'Buanderie', de: 'Wäsche', it: 'Lavanderia' },
  restaurante: { es: 'Restaurante', en: 'Restaurant', fr: 'Restaurant', de: 'Restaurant', it: 'Ristorante' },
  oferta_restauracion: {
    es: 'Restauración',
    en: 'Food & drink',
    fr: 'Restauration',
    de: 'Gastronomie',
    it: 'Ristorazione',
  },
  supermercado: { es: 'Supermercado', en: 'Supermarket', fr: 'Supermarché', de: 'Supermarkt', it: 'Supermercato' },
  zona_mascotas: { es: 'Mascotas', en: 'Pets', fr: 'Animaux', de: 'Haustiere', it: 'Animali' },
}

/** Labels más descriptivos para la ficha de detalle */
export const SERVICIO_LABELS_FULL: Record<string, Dict> = {
  agua: { es: 'Agua potable', en: 'Drinking water', fr: 'Eau potable', de: 'Trinkwasser', it: 'Acqua potabile' },
  electricidad: { es: 'Electricidad', en: 'Electricity', fr: 'Électricité', de: 'Strom', it: 'Elettricità' },
  vaciado_aguas_negras: {
    es: 'Vaciado WC Químico',
    en: 'Chemical toilet dump',
    fr: 'Vidange WC chimique',
    de: 'Chemietoiletten-Entsorgung',
    it: 'Svuotamento WC chimico',
  },
  vaciado_aguas_grises: {
    es: 'Vaciado Aguas Grises',
    en: 'Grey water dump',
    fr: 'Vidange eaux grises',
    de: 'Grauwasser-Entsorgung',
    it: 'Svuotamento acque grigie',
  },
  wifi: { es: 'Conexión WiFi', en: 'WiFi connection', fr: 'Connexion WiFi', de: 'WLAN-Verbindung', it: 'Connessione WiFi' },
  duchas: { es: 'Duchas', en: 'Showers', fr: 'Douches', de: 'Duschen', it: 'Docce' },
  wc: { es: 'Aseos (WC)', en: 'Toilets (WC)', fr: 'Toilettes (WC)', de: 'Toiletten (WC)', it: 'Servizi igienici (WC)' },
  lavanderia: { es: 'Lavandería', en: 'Laundry', fr: 'Buanderie', de: 'Waschsalon', it: 'Lavanderia' },
  restaurante: {
    es: 'Restaurante / Bar',
    en: 'Restaurant / Bar',
    fr: 'Restaurant / Bar',
    de: 'Restaurant / Bar',
    it: 'Ristorante / Bar',
  },
  supermercado: { es: 'Supermercado', en: 'Supermarket', fr: 'Supermarché', de: 'Supermarkt', it: 'Supermercato' },
  zona_mascotas: {
    es: 'Admite Mascotas',
    en: 'Pets allowed',
    fr: 'Animaux acceptés',
    de: 'Haustiere erlaubt',
    it: 'Animali ammessi',
  },
}

export const SERVICIO_ICONS: Record<string, string> = {
  agua: '💧',
  electricidad: '⚡',
  vaciado_aguas_negras: '♻️',
  vaciado_quimico: '🚽',
  vaciado_aguas_grises: '🚰',
  wifi: '📶',
  duchas: '🚿',
  wc: '🚻',
  lavanderia: '🧺',
  restaurante: '🍽️',
  oferta_restauracion: '🍽️',
  supermercado: '🛒',
  zona_mascotas: '🐾',
}

export function getTipoAreaLabel(tipo: string, locale: Locale = 'es'): string {
  return TIPO_AREA_LABELS[tipo]?.[locale] || TIPO_AREA_LABELS.publica[locale]
}

export function getServicioLabel(key: string, locale: Locale = 'es', full = false): string {
  const dict = full ? SERVICIO_LABELS_FULL : SERVICIO_LABELS
  return dict[key]?.[locale] || SERVICIO_LABELS[key]?.[locale] || key
}
