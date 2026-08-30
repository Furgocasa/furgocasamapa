export type Taller = {
  id: string
  origen_id: string | null
  nombre: string
  slug: string
  descripcion: string | null
  latitud: number
  longitud: number
  direccion: string | null
  codigo_postal: string | null
  ciudad: string | null
  provincia: string | null
  comunidad: string | null
  pais: string
  telefono: string | null
  email: string | null
  website: string | null
  google_maps_url: string | null
  google_place_id: string | null
  google_rating: number | null
  google_ratings_total: number | null
  google_types: string[] | null
  opening_hours: string | null
  fotos_urls: string[] | null
  foto_principal: string | null
  quality_score: number | null
  verificado: boolean
  activo: boolean
  created_at: string
  updated_at: string
}

export const TALLER_PIN_COLOR = '#B45309'

/** Llave de taller, misma silueta gruesa que bandera / valla / tienda (16 px). */
export const TALLER_ICON_PATH =
  'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z'

export const CAMPOS_MAPA_TALLER =
  'id, nombre, slug, latitud, longitud, ciudad, provincia, pais, foto_principal, google_rating, google_ratings_total, google_maps_url, telefono, verificado'
