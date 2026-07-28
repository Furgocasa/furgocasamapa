export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      areas: {
        Row: {
          id: string
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
          comunidad_autonoma: string | null
          pais: string
          telefono: string | null
          email: string | null
          website: string | null
          google_maps_url: string | null
          google_place_id: string | null
          google_rating: number | null
          google_types: string[] | null
          servicios: Json
          tipo_area: 'publica' | 'privada' | 'camping' | 'parking'
          precio_noche: number | null
          precio_24h: boolean
          plazas_totales: number | null
          plazas_camper: number | null
          acceso_24h: boolean
          barrera_altura: number | null
          fotos_urls: string[]
          foto_principal: string | null
          verificado: boolean
          activo: boolean
          con_descuento_furgocasa: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          nombre: string
          slug: string
          descripcion?: string | null
          latitud: number
          longitud: number
          direccion?: string | null
          codigo_postal?: string | null
          ciudad?: string | null
          provincia?: string | null
          comunidad?: string | null
          comunidad_autonoma?: string | null
          pais?: string
          telefono?: string | null
          email?: string | null
          website?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_types?: string[] | null
          servicios?: Json
          tipo_area: 'publica' | 'privada' | 'camping' | 'parking'
          precio_noche?: number | null
          precio_24h?: boolean
          plazas_totales?: number | null
          plazas_camper?: number | null
          acceso_24h?: boolean
          barrera_altura?: number | null
          fotos_urls?: string[]
          foto_principal?: string | null
          verificado?: boolean
          activo?: boolean
          con_descuento_furgocasa?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          slug?: string
          descripcion?: string | null
          latitud?: number
          longitud?: number
          direccion?: string | null
          codigo_postal?: string | null
          ciudad?: string | null
          provincia?: string | null
          comunidad?: string | null
          comunidad_autonoma?: string | null
          pais?: string
          telefono?: string | null
          email?: string | null
          website?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_types?: string[] | null
          servicios?: Json
          tipo_area?: 'publica' | 'privada' | 'camping' | 'parking'
          precio_noche?: number | null
          precio_24h?: boolean
          plazas_totales?: number | null
          plazas_camper?: number | null
          acceso_24h?: boolean
          barrera_altura?: number | null
          fotos_urls?: string[]
          foto_principal?: string | null
          verificado?: boolean
          activo?: boolean
          con_descuento_furgocasa?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      areas_traducciones: {
        Row: {
          id: string
          area_id: string
          idioma: 'fr' | 'de' | 'it' | 'en' | 'pt' | 'nl'
          nombre: string | null
          descripcion: string
          direccion: string | null
          ciudad: string | null
          provincia: string | null
          comunidad: string | null
          pais: string | null
          modelo: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          area_id: string
          idioma: 'fr' | 'de' | 'it' | 'en' | 'pt' | 'nl'
          nombre?: string | null
          descripcion: string
          direccion?: string | null
          ciudad?: string | null
          provincia?: string | null
          comunidad?: string | null
          pais?: string | null
          modelo?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          area_id?: string
          idioma?: 'fr' | 'de' | 'it' | 'en' | 'pt' | 'nl'
          nombre?: string | null
          descripcion?: string
          direccion?: string | null
          ciudad?: string | null
          provincia?: string | null
          comunidad?: string | null
          pais?: string | null
          modelo?: string | null
          updated_at?: string
        }
      }
      favoritos: {
        Row: {
          id: string
          user_id: string
          area_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          area_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          area_id?: string
          created_at?: string
        }
      }
      valoraciones: {
        Row: {
          id: string
          user_id: string
          area_id: string
          rating: number
          comentario: string | null
          fotos: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          area_id: string
          rating: number
          comentario?: string | null
          fotos?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          area_id?: string
          rating?: number
          comentario?: string | null
          fotos?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      visitas: {
        Row: {
          id: string
          user_id: string
          area_id: string
          fecha_visita: string
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          area_id: string
          fecha_visita: string
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          area_id?: string
          fecha_visita?: string
          notas?: string | null
          created_at?: string
        }
      }
      user_analytics: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          event_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          event_data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          event_data?: Json
          created_at?: string
        }
      }
      rutas: {
        Row: {
          id: string
          user_id: string
          nombre: string
          descripcion: string | null
          origen: Json
          destino: Json
          paradas: Json
          distancia_km: number | null
          duracion_minutos: number | null
          geometria: Json | null
          areas_encontradas: Json | null
          favorito: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nombre: string
          descripcion?: string | null
          origen: Json
          destino: Json
          paradas?: Json
          distancia_km?: number | null
          duracion_minutos?: number | null
          geometria?: Json | null
          areas_encontradas?: Json | null
          favorito?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nombre?: string
          descripcion?: string | null
          origen?: Json
          destino?: Json
          paradas?: Json
          distancia_km?: number | null
          duracion_minutos?: number | null
          geometria?: Json | null
          areas_encontradas?: Json | null
          favorito?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Tipos auxiliares
export type Area = Database['public']['Tables']['areas']['Row']
export type AreaInsert = Database['public']['Tables']['areas']['Insert']
export type AreaUpdate = Database['public']['Tables']['areas']['Update']
export type AreaTraduccion = Database['public']['Tables']['areas_traducciones']['Row']

export type Favorito = Database['public']['Tables']['favoritos']['Row']
export type Valoracion = Database['public']['Tables']['valoraciones']['Row']
export type Visita = Database['public']['Tables']['visitas']['Row']
export type Ruta = Database['public']['Tables']['rutas']['Row']

export interface Servicios {
  agua: boolean
  electricidad: boolean
  vaciado_aguas_negras: boolean
  vaciado_aguas_grises: boolean
  wifi: boolean
  duchas: boolean
  wc: boolean
  lavanderia: boolean
  restaurante: boolean
  supermercado: boolean
  zona_mascotas: boolean
  [key: string]: boolean
}
