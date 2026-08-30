import { notFound } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MapaUbicacion } from '@/components/area/MapaUbicacion'
import { CtaAlquilerFurgocasa } from '@/components/area/CtaAlquilerFurgocasa'
import { ContactoInfo } from '@/components/area/ContactoInfo'
import { BackToTop } from '@/components/area/BackToTop'
import { normalizarProvincia } from '@/lib/areas/provincias'
import {
  direccionVisible,
  mapsUrlTaller,
  tallerSeoSnippet,
  tituloTaller,
} from '@/lib/talleres/seo-snippet'
import type { Taller } from '@/lib/talleres/types'
import type { Area } from '@/types/database.types'
import { MapPinIcon, StarIcon } from '@heroicons/react/24/outline'

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

function parrafos(texto: string | null): string[] {
  if (!texto?.trim()) return []
  return texto
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const taller = await getTaller(slug)
  if (!taller) return { title: 'Taller no encontrado - Mapa Furgocasa' }
  const snippet = tallerSeoSnippet({ ...taller, nombre: tituloTaller(taller.nombre) })
  return {
    title: snippet.title,
    description: snippet.description,
    alternates: { canonical: `${BASE}/taller/${taller.slug}` },
    openGraph: {
      title: snippet.title,
      description: snippet.description,
      url: `${BASE}/taller/${taller.slug}`,
      images: taller.foto_principal ? [taller.foto_principal] : [`${BASE}/og-image-v2.jpg`],
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

  const nombre = tituloTaller(taller.nombre)
  const direccion = direccionVisible(taller.direccion)
  const maps = mapsUrlTaller(taller)
  const provinciaLanding = normalizarProvincia(taller.provincia)
  const sitio = [taller.ciudad, taller.provincia].filter(Boolean).join(', ')
  const bloques = parrafos(taller.descripcion)

  const contactoArea = {
    id: taller.id,
    nombre,
    slug: taller.slug,
    telefono: taller.telefono,
    email: taller.email,
    website: taller.website,
    google_maps_url: maps,
    pais: taller.pais || 'España',
    tipo_area: 'publica',
  } as Area

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: nombre,
    description: bloques[0] || `Taller en ${sitio}`,
    url: `${BASE}/taller/${taller.slug}`,
    image: taller.foto_principal || `${BASE}/og-image-v2.jpg`,
    telephone: taller.telefono || undefined,
    email: taller.email || undefined,
    sameAs: taller.website ? [taller.website] : undefined,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: Number(taller.latitud),
      longitude: Number(taller.longitud),
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: direccion || '',
      addressLocality: taller.ciudad,
      addressRegion: taller.provincia,
      postalCode: taller.codigo_postal,
      addressCountry: 'ES',
    },
    ...(taller.google_rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(taller.google_rating),
            bestRating: 5,
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
            <nav className="text-sm text-white/70 flex flex-wrap gap-x-2 gap-y-1">
              <Link href="/talleres" className="hover:text-white">Talleres</Link>
              {provinciaLanding ? (
                <>
                  <span>/</span>
                  <Link href={`/talleres/${provinciaLanding.slug}`} className="hover:text-white">
                    {provinciaLanding.nombre}
                  </Link>
                </>
              ) : null}
              <span>/</span>
              <span className="text-white/90">{nombre}</span>
            </nav>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-amber-300">Taller</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-1">{nombre}</h1>
            <p className="mt-2 text-white/80 flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 shrink-0" />
              {direccion || sitio}
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
            <Link
              href="/mapa?capa=talleres"
              className="inline-block mt-5 text-sm font-semibold text-white/90 underline hover:text-white"
            >
              Ver en el mapa de talleres
            </Link>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div className="w-full lg:w-[60%] space-y-8">
              <section className="bg-white rounded-3xl shadow-[0_2px_24px_-8px_rgba(0,0,0,0.08)] border border-gray-100 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">El taller</h2>
                {bloques.length ? (
                  <div className="space-y-4 text-gray-700 leading-relaxed">
                    {bloques.map((p) => (
                      <p key={p.slice(0, 40)}>{p}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    Taller en {sitio}. Ficha en MapafurgoCasa: dirección, teléfono y mapa.
                  </p>
                )}
                {direccion ? (
                  <p className="mt-6 text-sm text-gray-500 flex items-start gap-2">
                    <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0" />
                    {direccion}
                  </p>
                ) : null}
              </section>

              <CtaAlquilerFurgocasa
                variante="taller"
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
                <section className="bg-white rounded-3xl shadow-[0_2px_24px_-8px_rgba(0,0,0,0.08)] border border-gray-100 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Otros talleres en {taller.provincia}</h2>
                  <ul className="space-y-3">
                    {relacionados.map((r: { slug: string; nombre: string; ciudad: string | null; google_rating: number | null }) => (
                      <li key={r.slug}>
                        <Link href={`/taller/${r.slug}`} className="block rounded-xl border border-gray-100 px-4 py-3 hover:border-[#0b3c74]">
                          <span className="font-semibold text-gray-900">{tituloTaller(r.nombre)}</span>
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
                  Talleres en {provinciaLanding.nombre} →
                </Link>
              ) : null}
            </div>

            <div className="w-full lg:w-[40%]">
              <div className="sticky top-24 space-y-8">
                <MapaUbicacion
                  latitud={Number(taller.latitud)}
                  longitud={Number(taller.longitud)}
                  nombre={nombre}
                />
                <ContactoInfo area={contactoArea} modo="taller" />
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
