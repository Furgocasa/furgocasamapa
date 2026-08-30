import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { normalizarProvincia } from '@/lib/areas/provincias'
import { MIN_TALLERES_LANDING_INDEX } from '@/lib/talleres/seo-snippet'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.mapafurgocasa.com'
  
  // Obtener todas las áreas activas desde Supabase (con paginación)
  const supabase = await createClient()
  const allAreas: Array<{ slug: string; updated_at: string | null }> = []
  const pageSize = 1000
  let page = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await (supabase as any)
      .from('areas')
      .select('slug, updated_at')
      .eq('activo', true)
      .order('updated_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('Error cargando áreas para sitemap:', error)
      break
    }

    if (data && data.length > 0) {
      allAreas.push(...data)
      page++
      if (data.length < pageSize) {
        hasMore = false
      }
    } else {
      hasMore = false
    }
  }

  const areas = allAreas

  // Landings por provincia (España): /areas + /areas/{provincia} (§15)
  const provinciaSlugs = new Set<string>()
  {
    let pageProv = 0
    let hasMoreProv = true
    while (hasMoreProv) {
      const { data, error } = await (supabase as any)
        .from('areas')
        .select('provincia')
        .eq('activo', true)
        .eq('pais', 'España')
        .range(pageProv * pageSize, (pageProv + 1) * pageSize - 1)
      if (error || !data || data.length === 0) break
      for (const row of data) {
        const prov = normalizarProvincia(row.provincia)
        if (prov) provinciaSlugs.add(prov.slug)
      }
      pageProv++
      if (data.length < pageSize) hasMoreProv = false
    }
  }

  const provinciaPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/areas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    ...[...provinciaSlugs].sort().map((slug) => ({
      url: `${baseUrl}/areas/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ]

  // URLs estáticas del sitio
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/mapa`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ruta`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sobre-nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/condiciones`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/valoracion-ia-vehiculos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sistema-reporte-accidentes`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // Landing pages SEO por país (16 Europa + 3 Sudamérica = 19 páginas)
  const paisesLandingPages: MetadataRoute.Sitemap = [
    // Europa (16 países) - autocaravanas
    {
      url: `${baseUrl}/mapa-autocaravanas-espana`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9, // España es el principal
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-francia`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-portugal`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-italia`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-alemania`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-paises-bajos`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-belgica`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-suiza`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-austria`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-noruega`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-suecia`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-dinamarca`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-luxemburgo`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.65,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-andorra`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-eslovenia`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-chequia`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/mapa-autocaravanas-reino-unido`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    // Sudamérica (3 países) - casas rodantes
    {
      url: `${baseUrl}/mapa-casas-rodantes-argentina`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mapa-casas-rodantes-chile`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mapa-casas-rodantes-uruguay`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // URLs dinámicas de áreas
  const areaPages: MetadataRoute.Sitemap = areas
    ? areas.map((area: any) => ({
        url: `${baseUrl}/area/${area.slug}`,
        lastModified: area.updated_at ? new Date(area.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    : []

  const allTalleres: Array<{ slug: string; updated_at: string | null; provincia: string | null }> = []
  {
    let pageT = 0
    let hasMoreT = true
    while (hasMoreT) {
      const { data, error } = await (supabase as any)
        .from('talleres')
        .select('slug, updated_at, provincia')
        .eq('activo', true)
        .range(pageT * pageSize, (pageT + 1) * pageSize - 1)
      if (error || !data || data.length === 0) break
      allTalleres.push(...data)
      pageT++
      if (data.length < pageSize) hasMoreT = false
    }
  }

  const tallerProvinciaConteo = new Map<string, number>()
  for (const row of allTalleres) {
    const prov = normalizarProvincia(row.provincia)
    if (prov) tallerProvinciaConteo.set(prov.slug, (tallerProvinciaConteo.get(prov.slug) || 0) + 1)
  }
  const tallerProvinciaSlugs = [...tallerProvinciaConteo.entries()]
    .filter(([, n]) => n >= MIN_TALLERES_LANDING_INDEX)
    .map(([slug]) => slug)
    .sort()

  const tallerPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/talleres`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...tallerProvinciaSlugs.map((slug) => ({
      url: `${baseUrl}/talleres/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...allTalleres.map((t) => ({
      url: `${baseUrl}/taller/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    })),
  ]

  return [...staticPages, ...paisesLandingPages, ...provinciaPages, ...areaPages, ...tallerPages]
}

