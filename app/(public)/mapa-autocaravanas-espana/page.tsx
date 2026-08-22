import { Metadata } from 'next'
import { PaisLandingPage, ProvinciaLanding } from '@/components/mapa/PaisLandingPage'
import { PAISES_SEO_CONFIG } from '@/config/paises-seo'
import { createClient } from '@/lib/supabase/server'
import { PROVINCIAS_ES, normalizarProvincia } from '@/lib/areas/provincias'

export const revalidate = 3600

const pais = PAISES_SEO_CONFIG['espana']

export const metadata: Metadata = {
  title: pais.metaTitle,
  description: pais.metaDescription,
  keywords: pais.keywords,
  openGraph: {
    title: pais.metaTitle,
    description: pais.metaDescription,
    url: `https://www.mapafurgocasa.com${pais.urlSlug}`,
    siteName: 'Mapa Furgocasa',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: pais.metaTitle,
    description: pais.metaDescription,
  },
  alternates: {
    canonical: `https://www.mapafurgocasa.com${pais.urlSlug}`,
  },
}

export default async function EspanaPage() {
  // Conteo por provincia para el bloque de interlinking hacia /areas/{provincia}
  const supabase = await createClient()
  const conteos = new Map<string, number>()
  const pageSize = 1000
  for (let page = 0; ; page++) {
    const { data, error } = await (supabase as any)
      .from('areas')
      .select('provincia')
      .eq('activo', true)
      .eq('pais', 'España')
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error || !data || data.length === 0) break
    for (const row of data) {
      const prov = normalizarProvincia(row.provincia)
      if (prov) conteos.set(prov.slug, (conteos.get(prov.slug) || 0) + 1)
    }
    if (data.length < pageSize) break
  }

  const provincias: ProvinciaLanding[] = PROVINCIAS_ES
    .map((p) => ({ slug: p.slug, nombre: p.nombre, total: conteos.get(p.slug) || 0 }))
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total)

  return <PaisLandingPage pais={pais} provincias={provincias} />
}



