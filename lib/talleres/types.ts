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

export const CAMPOS_MAPA_TALLER =
  'id, nombre, slug, latitud, longitud, ciudad, provincia, pais, foto_principal, google_rating, google_ratings_total, google_maps_url, telefono, verificado'
