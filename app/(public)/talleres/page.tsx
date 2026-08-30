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
      .from('talleres')
      .select('provincia')
      .eq('activo', true)
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
  const title = `Talleres camper en España: mapa de ${total} talleres`
  const description = `Mapa de ${total} talleres de campers y autocaravanas en España. Ficha, teléfono y cómo llegar. Áreas y talleres, cada uno en su capa.`
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/talleres` },
    openGraph: { title, description, url: `${BASE_URL}/talleres` },
  }
}

export default async function TalleresIndexPage() {
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
          { '@type': 'ListItem', position: 2, name: 'Talleres camper en España', item: `${BASE_URL}/talleres` },
        ],
      },
      {
        '@type': 'WebPage',
        name: 'Talleres camper en España',
        url: `${BASE_URL}/talleres`,
        description: `Directorio en mapa de ${total} talleres de campers y autocaravanas en España.`,
      },
    ],
  }

  return (
    <>
      <Script id="schema-talleres-index" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-[#0b3c74] text-white">
          <div className="max-w-[800px] mx-auto px-4 md:px-8 py-12 md:py-16">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-3">MapafurgoCasa</p>
            <h1 className="text-3xl md:text-5xl font-bold mb-5">Talleres de campers en España</h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              {total} talleres en el mismo mapa que las áreas. Cada uno con ficha: dónde está, cómo llamar y cómo llegar.
            </p>
            <div className="mt-8">
              <Link
                href="/mapa?capa=talleres"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-white text-[#0b3c74] rounded-xl font-bold hover:bg-gray-100"
              >
                Abrir el mapa de talleres
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-[800px] mx-auto px-4 md:px-8 py-12 space-y-10 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-[#0b3c74] mb-4">Un directorio, no una guía de páginas amarillas</h2>
            <p>
              El listado no vive aquí. Vive en el mapa, en la capa <strong>Talleres</strong>, junto a las áreas pero sin mezclar pines.
              Buscas ciudad, te acercas y abres la ficha. Igual que un área: contacto, valoración de Google y enlace a la web del taller si la tiene.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#0b3c74] mb-4">Qué hay dentro</h2>
            <p>
              Solo talleres de camperizado, instalación de accesorios (techo, calefacción, placas, agua, gas) y reparación
              del habitáculo o la autocaravana. No entran neumáticos, lunas, ITV, recambios ni el taller de coche genérico.
            </p>
            <p className="mt-4">
              Hoy hay cobertura en {provincias.length} provincias. Murcia, Barcelona, Alicante y Madrid concentran más puntos;
              hay provincias con uno o dos. El mapa no oculta el hueco.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#0b3c74] mb-4">Áreas y talleres, cada uno lo suyo</h2>
            <p>
              En <Link href="/mapa" className="text-[#0b3c74] font-semibold underline">/mapa</Link> el conmutador
              Áreas | Talleres cambia de capa. Un taller no es un sitio para dormir. Un área no cambia ruedas.
              El Tío también distingue: si pides taller, busca talleres.
            </p>
          </section>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 text-center">
            <p className="text-gray-900 font-semibold mb-4">
              El directorio está en el mapa, con la capa de talleres puesta.
            </p>
            <Link
              href="/mapa?capa=talleres"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-[#B45309] text-white rounded-xl font-bold hover:opacity-90"
            >
              Ver {total} talleres en el mapa
            </Link>
          </div>

          <section>
            <h2 className="text-xl font-bold text-[#0b3c74] mb-3">Por provincia</h2>
            <p className="text-sm text-gray-500 mb-4">
              Landings para quien busca «taller camper» y una provincia. El uso diario es el mapa.
            </p>
            <div className="flex flex-wrap gap-2">
              {provincias.map((p) => (
                <Link
                  key={p.slug}
                  href={`/talleres/${p.slug}`}
                  className="text-sm text-[#0b3c74] bg-white border border-gray-200 rounded-full px-3 py-1 hover:border-[#0b3c74]"
                >
                  {p.nombre}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  )
}
