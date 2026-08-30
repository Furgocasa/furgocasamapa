import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { StarIcon, MapPinIcon } from '@heroicons/react/24/solid'
import {
  PROVINCIAS_ES,
  provinciaPorSlug,
  valoresConsultaProvincia,
  type ProvinciaES,
} from '@/lib/areas/provincias'

export const revalidate = 3600

const BASE_URL = 'https://www.mapafurgocasa.com'

type TallerRow = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  direccion: string | null
  google_rating: number | null
  google_ratings_total: number | null
}

const getTalleres = cache(async (prov: ProvinciaES): Promise<TallerRow[]> => {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('talleres')
    .select('id, nombre, slug, ciudad, direccion, google_rating, google_ratings_total')
    .eq('activo', true)
    .in('provincia', valoresConsultaProvincia(prov))
    .order('google_rating', { ascending: false, nullsFirst: false })
  return (data || []) as TallerRow[]
})

export function generateStaticParams() {
  return PROVINCIAS_ES.map((p) => ({ provincia: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provincia: string }>
}): Promise<Metadata> {
  const { provincia } = await params
  const prov = provinciaPorSlug(provincia)
  if (!prov) return { title: 'Provincia no encontrada' }
  const talleres = await getTalleres(prov)
  if (!talleres.length) return { title: `Talleres camper en ${prov.nombre}` }
  const title = `Talleres camper en ${prov.nombre}: ${talleres.length}`
  const description = `${talleres.length} talleres de campers y autocaravanas en ${prov.nombre}. Ficha, mapa y contacto.`
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/talleres/${prov.slug}` },
  }
}

export default async function TalleresProvinciaPage({
  params,
}: {
  params: Promise<{ provincia: string }>
}) {
  const { provincia } = await params
  const prov = provinciaPorSlug(provincia)
  if (!prov) notFound()
  const talleres = await getTalleres(prov)
  if (!talleres.length) notFound()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Talleres camper en ${prov.nombre}`,
    numberOfItems: talleres.length,
    itemListElement: talleres.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.nombre,
      url: `${BASE_URL}/taller/${t.slug}`,
    })),
  }

  return (
    <>
      <Script id="schema-talleres-prov" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-[#0b3c74] text-white">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10">
            <nav className="text-sm text-white/70 mb-4">
              <Link href="/talleres" className="hover:text-white">Talleres</Link>
              <span className="mx-1">/</span>
              <span className="text-white">{prov.nombre}</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Talleres camper en {prov.nombre}</h1>
            <p className="text-white/90">{talleres.length} talleres de campers y autocaravanas.</p>
            <Link
              href="/mapa?capa=talleres"
              className="inline-block mt-6 px-5 py-2.5 bg-white text-[#0b3c74] rounded-xl font-bold"
            >
              Ver en el mapa
            </Link>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 space-y-3">
          {talleres.map((t) => (
            <Link
              key={t.id}
              href={`/taller/${t.slug}`}
              className="block bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-[#0b3c74]"
            >
              <span className="font-semibold text-gray-900">{t.nombre}</span>
              <span className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {t.ciudad || prov.nombre}
                </span>
                {t.google_rating ? (
                  <span className="inline-flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-amber-500" />
                    {Number(t.google_rating).toFixed(1)}
                    {t.google_ratings_total ? ` (${t.google_ratings_total})` : ''}
                  </span>
                ) : null}
              </span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
