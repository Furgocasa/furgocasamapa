import { notFound } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MapaUbicacion } from '@/components/area/MapaUbicacion'
import { CtaAlquilerFurgocasa } from '@/components/area/CtaAlquilerFurgocasa'
import { BackToTop } from '@/components/area/BackToTop'
import { normalizarProvincia } from '@/lib/areas/provincias'
import { tallerSeoSnippet } from '@/lib/talleres/seo-snippet'
import type { Taller } from '@/lib/talleres/types'
import { PhoneIcon, GlobeAltIcon, MapPinIcon, StarIcon } from '@heroicons/react/24/outline'

const BASE = 'https://www.mapafurgocasa.com'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getTaller(slug: string): Promise<Taller | null> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('talleres')
    .select('*')
    .eq('slug', slug)
    .eq('activo', true)
    .maybeSingle()
  return data || null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const taller = await getTaller(slug)
  if (!taller) return { title: 'Taller no encontrado - Mapa Furgocasa' }
  const snippet = tallerSeoSnippet(taller)
  return {
    title: snippet.title,
    description: snippet.description,
    alternates: { canonical: `${BASE}/taller/${taller.slug}` },
    openGraph: {
      title: snippet.title,
      description: snippet.description,
      url: `${BASE}/taller/${taller.slug}`,
    },
  }
}

export default async function TallerPage({ params }: PageProps) {
  const { slug } = await params
  const taller = await getTaller(slug)
  if (!taller) notFound()

  const supabase = await createClient()
  const { data: relacionados } = await (supabase as any)
    .from('talleres')
    .select('id, nombre, slug, ciudad, provincia, google_rating')
    .eq('provincia', taller.provincia)
    .eq('activo', true)
    .neq('id', taller.id)
    .order('google_rating', { ascending: false, nullsFirst: false })
    .limit(4)

  const provinciaLanding = normalizarProvincia(taller.provincia)
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: taller.nombre,
    description: taller.descripcion || `Taller de campers en ${taller.ciudad || taller.provincia}`,
    url: `${BASE}/taller/${taller.slug}`,
    telephone: taller.telefono || undefined,
    email: taller.email || undefined,
    url_web: taller.website || undefined,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: taller.latitud,
      longitude: taller.longitud,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: taller.direccion || '',
      addressLocality: taller.ciudad,
      addressRegion: taller.provincia,
      postalCode: taller.codigo_postal,
      addressCountry: 'ES',
    },
    ...(taller.google_rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: taller.google_rating,
            bestRating: '5',
            ratingCount: taller.google_ratings_total || 1,
          },
        }
      : {}),
  }

  return (
    <>
      <Script id="schema-taller" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-[#0b3c74] text-white">
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
            <Link href="/mapa?capa=talleres" className="text-sm text-white/70 hover:text-white">
              ← Talleres en el mapa
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-amber-300">Taller camper</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-1">{taller.nombre}</h1>
            <p className="mt-2 text-white/80 flex items-center gap-2">
              <MapPinIcon className="w-5 h-5" />
              {[taller.ciudad, taller.provincia].filter(Boolean).join(', ')}
            </p>
            {taller.google_rating ? (
              <p className="mt-2 flex items-center gap-1 text-amber-200">
                <StarIcon className="w-5 h-5" />
                {Number(taller.google_rating).toFixed(1)}
                {taller.google_ratings_total ? (
                  <span className="text-white/70">({taller.google_ratings_total} reseñas Google)</span>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div className="w-full lg:w-[60%] space-y-8">
              <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">El taller</h2>
                <p className="text-gray-700 leading-relaxed">{taller.descripcion}</p>
                {taller.direccion ? (
                  <p className="mt-4 text-sm text-gray-500">{taller.direccion}</p>
                ) : null}
              </section>

              <CtaAlquilerFurgocasa
                area={{
                  id: taller.id,
                  slug: taller.slug,
                  pais: taller.pais,
                  ciudad: taller.ciudad,
                  provincia: taller.provincia,
                  comunidad: taller.comunidad,
                }}
              />

              {relacionados?.length ? (
                <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Otros talleres en {taller.provincia}</h2>
                  <ul className="space-y-3">
                    {relacionados.map((r: { slug: string; nombre: string; ciudad: string | null; google_rating: number | null }) => (
                      <li key={r.slug}>
                        <Link href={`/taller/${r.slug}`} className="block rounded-xl border border-gray-100 px-4 py-3 hover:border-[#0b3c74]">
                          <span className="font-semibold text-gray-900">{r.nombre}</span>
                          <span className="block text-sm text-gray-500">
                            {r.ciudad}
                            {r.google_rating ? ` · ${Number(r.google_rating).toFixed(1)}★` : ''}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {provinciaLanding ? (
                <Link
                  href={`/talleres/${provinciaLanding.slug}`}
                  className="block bg-white rounded-2xl p-5 text-center font-semibold text-[#0b3c74] hover:bg-[#EEF4FB]"
                >
                  Ver todos los talleres de {provinciaLanding.nombre} →
                </Link>
              ) : null}
            </div>

            <div className="w-full lg:w-[40%]">
              <div className="sticky top-24 space-y-8">
                <MapaUbicacion
                  latitud={Number(taller.latitud)}
                  longitud={Number(taller.longitud)}
                  nombre={taller.nombre}
                />
                <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 space-y-3">
                  <h2 className="text-xl font-bold text-gray-900">Contacto</h2>
                  {taller.telefono ? (
                    <a href={`tel:${taller.telefono.replace(/\s/g, '')}`} className="flex items-center gap-2 text-[#0b3c74] font-medium">
                      <PhoneIcon className="w-5 h-5" />
                      {taller.telefono}
                    </a>
                  ) : null}
                  {taller.website ? (
                    <a href={taller.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#0b3c74] font-medium">
                      <GlobeAltIcon className="w-5 h-5" />
                      Web
                    </a>
                  ) : null}
                  {taller.google_maps_url ? (
                    <a href={taller.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 underline">
                      Abrir en Google Maps
                    </a>
                  ) : null}
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <BackToTop />
    </>
  )
}
