import { cache } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PROVINCIAS_ES, normalizarProvincia } from '@/lib/areas/provincias'

export const revalidate = 3600

const BASE_URL = 'https://www.mapafurgocasa.com'

const getConteos = cache(async () => {
  const supabase = await createClient()
  const conteos = new Map<string, number>()
  let total = 0
  const pageSize = 1000
  for (let page = 0; ; page++) {
    const { data, error } = await (supabase as any)
      .from('areas')
      .select('provincia')
      .eq('activo', true)
      .eq('pais', 'España')
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error || !data) break
    for (const row of data) {
      total++
      const prov = normalizarProvincia(row.provincia)
      if (prov) conteos.set(prov.slug, (conteos.get(prov.slug) || 0) + 1)
    }
    if (data.length < pageSize) break
  }
  return { conteos, total }
})

export async function generateMetadata(): Promise<Metadata> {
  const { total } = await getConteos()
  const title = `Áreas de autocaravanas en España por provincia: ${total} áreas`
  const description = `Las ${total} áreas de autocaravanas y campings de España organizadas por provincia. Públicas, privadas y campings con precios, servicios y mapa.`
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/areas` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/areas`,
      siteName: 'Mapa Furgocasa',
      type: 'website',
      locale: 'es_ES',
    },
  }
}

export default async function AreasIndexPage() {
  const { conteos, total } = await getConteos()

  const provincias = PROVINCIAS_ES
    .map((p) => ({ ...p, total: conteos.get(p.slug) || 0 }))
    .filter((p) => p.total > 0)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Áreas de autocaravanas en España', item: `${BASE_URL}/areas` },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Áreas de autocaravanas en España por provincia',
        numberOfItems: provincias.length,
        itemListElement: provincias.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `Áreas de autocaravanas en ${p.nombre}`,
          url: `${BASE_URL}/areas/${p.slug}`,
        })),
      },
    ],
  }

  return (
    <>
      <Script
        id="schema-areas-index"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Navbar />

      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-[#0b3c74] to-[#0d4a8f] text-white">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 md:py-14">
            <nav aria-label="Breadcrumb" className="text-sm text-white/70 mb-4">
              <ol className="flex gap-1">
                <li>
                  <Link href="/" className="hover:text-white">Inicio</Link>
                  <span className="mx-1">/</span>
                </li>
                <li className="text-white font-medium">Áreas en España</li>
              </ol>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Áreas de autocaravanas en España
            </h1>
            <p className="text-base md:text-xl text-white/90 max-w-3xl leading-relaxed">
              {total} áreas y campings para autocaravanas en España, organizados por provincia:
              áreas públicas, privadas y campings con servicios, precios, fotos y ubicación exacta.
            </p>
            <div className="mt-8">
              <Link
                href="/mapa"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#0b3c74] rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg"
              >
                Ver todas en el mapa
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0b3c74] mb-6">
            Elige provincia
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {provincias.map((p) => (
              <Link
                key={p.slug}
                href={`/areas/${p.slug}`}
                className="group bg-white border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-[#0b3c74] hover:shadow-lg transition-all"
              >
                <span className="block font-semibold text-gray-900 group-hover:text-[#0b3c74] transition-colors">
                  {p.nombre}
                </span>
                <span className="block text-sm text-gray-500">{p.total} áreas</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
