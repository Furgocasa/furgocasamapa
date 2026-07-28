/**
 * API ROUTE: LISTADO COMPLETO DE ÁREAS PARA EL MAPA (CACHEADO EN CDN)
 * ===================================================================
 * Devuelve todas las áreas activas en una sola respuesta comprimida.
 * Soporta ?lang=fr|de|it|en para sobrescribir textos traducidos.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_LOCALE, isTranslationLocale, normalizeLocale } from '@/lib/i18n/config'

export const dynamic = 'force-dynamic'

const CAMPOS_MAPA =
  'id, nombre, slug, latitud, longitud, ciudad, provincia, pais, tipo_area, precio_noche, foto_principal, servicios, plazas_totales, plazas_camper, acceso_24h, barrera_altura, google_rating, google_maps_url, verificado, con_descuento_furgocasa'

const CAMPOS_TRAD =
  'area_id, nombre, ciudad, provincia, pais'

async function fetchAllPages(
  supabase: any,
  table: string,
  columns: string,
  filters?: (q: any) => any
) {
  const all: any[] = []
  const pageSize = 1000
  let page = 0
  let hasMore = true

  while (hasMore) {
    let query = supabase.from(table).select(columns).range(page * pageSize, (page + 1) * pageSize - 1)
    if (filters) query = filters(query)
    const { data, error } = await query
    if (error) throw error
    if (data && data.length > 0) {
      all.push(...data)
      page++
      if (data.length < pageSize) hasMore = false
    } else {
      hasMore = false
    }
  }
  return all
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 })
    }

    const langParam = request.nextUrl.searchParams.get('lang')
    const locale = normalizeLocale(langParam)
    const supabase = createClient(supabaseUrl, anonKey)

    const allAreas = await fetchAllPages(supabase, 'areas', CAMPOS_MAPA, (q) =>
      q.eq('activo', true).order('nombre')
    )

    if (isTranslationLocale(locale)) {
      try {
        const traducciones = await fetchAllPages(supabase, 'areas_traducciones', CAMPOS_TRAD, (q) =>
          q.eq('idioma', locale)
        )
        const byArea = new Map(traducciones.map((t) => [t.area_id, t]))
        for (const area of allAreas) {
          const t = byArea.get(area.id)
          if (!t) continue
          if (t.nombre) area.nombre = t.nombre
          if (t.ciudad) area.ciudad = t.ciudad
          if (t.provincia) area.provincia = t.provincia
          if (t.pais) area.pais = t.pais
        }
      } catch (e: any) {
        // Si la tabla aún no existe, devolver español
        console.warn('Traducciones no disponibles:', e?.message)
      }
    }

    return NextResponse.json(
      {
        areas: allAreas,
        total: allAreas.length,
        lang: locale || DEFAULT_LOCALE,
        generated_at: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
          Vary: 'Accept-Encoding',
        },
      }
    )
  } catch (err: any) {
    console.error('Error cargando áreas:', err?.message)
    return NextResponse.json({ error: 'Error cargando áreas' }, { status: 500 })
  }
}
