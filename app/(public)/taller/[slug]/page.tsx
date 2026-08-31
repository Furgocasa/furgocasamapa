import { notFound } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DetalleAreaHeader } from '@/components/area/DetalleAreaHeader'
import { InformacionBasica } from '@/components/area/InformacionBasica'
import { MapaUbicacion } from '@/components/area/MapaUbicacion'
import { CtaAlquilerFurgocasa } from '@/components/area/CtaAlquilerFurgocasa'
import { CtaCenaCerca } from '@/components/area/CtaCenaCerca'
import { ContactoInfo } from '@/components/area/ContactoInfo'
import { GaleriaFotos } from '@/components/area/GaleriaFotos'
import { AreasRelacionadas } from '@/components/area/AreasRelacionadas'
import { BackToTop } from '@/components/area/BackToTop'
import { isEspana } from '@/lib/areas/cta-comercial'
import { normalizarProvincia } from '@/lib/areas/provincias'
import {
  direccionVisible,
  admiteTallerCamper,
  h1Taller,
  mapsUrlTaller,
  tallerSeoSnippet,
  tituloTaller,
} from '@/lib/talleres/seo-snippet'
import type { Taller } from '@/lib/talleres/types'
import type { Area } from '@/types/database.types'

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

function areaDesdeTaller(
  taller: Taller,
  nombre: string,
  direccion: string | null,
  maps: string | null
): Area {
  const ratingRaw = taller.google_rating != null ? Number(taller.google_rating) : null
  const rating = ratingRaw != null && Number.isFinite(ratingRaw) ? ratingRaw : null
  const sitio = [taller.ciudad, taller.provincia].filter(Boolean).join(', ')
  return {
    id: taller.id,
    nombre,
    slug: taller.slug,
    descripcion:
      taller.descripcion ||
      `Taller en ${sitio || 'España'}. Ficha en MapafurgoCasa: dirección, teléfono y mapa.`,
    latitud: Number(taller.latitud),
    longitud: Number(taller.longitud),
    direccion: direccion || taller.direccion,
    codigo_postal: taller.codigo_postal,
    ciudad: taller.ciudad,
    provincia: taller.provincia,
    comunidad: taller.comunidad,
    comunidad_autonoma: taller.comunidad,
    pais: taller.pais || 'España',
    telefono: taller.telefono,
    email: taller.email,
    website: taller.website,
    google_maps_url: maps,
    google_place_id: taller.google_place_id,
    google_rating: rating,
    google_ratings_total: taller.google_ratings_total,
    google_types: taller.google_types,
    servicios: {},
    tipo_area: 'publica',
    precio_noche: null,
    precio_24h: false,
    plazas_totales: null,
    plazas_camper: null,
    acceso_24h: false,
    barrera_altura: null,
    fotos_urls: Array.isArray(taller.fotos_urls) ? taller.fotos_urls : [],
    foto_principal: taller.foto_principal,
    verificado: taller.verificado,
    activo: taller.activo,
    con_descuento_furgocasa: false,
    created_at: taller.created_at,
    updated_at: taller.updated_at,
    created_by: null,
  }
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
      images: taller.foto_principal ? [taller.foto_principal] : [`${BASE}/images/opengraph/opengraph_talleres_card.jpg`],
    },
  }
}

export default async function TallerPage({ params }: PageProps) {
  const { slug } = await params
  const taller = await getTaller(slug)
  if (!taller) notFound()

  const supabase = await createClient()
  const { data: relacionadosRaw } = await (supabase as any)
    .from('talleres')
    .select('id, nombre, slug, ciudad, provincia, descripcion, foto_principal, google_rating')
    .eq('provincia', taller.provincia)
    .eq('activo', true)
    .neq('id', taller.id)
    .order('google_rating', { ascending: false, nullsFirst: false })
    .limit(12)
  const relacionados = (relacionadosRaw || [])
    .filter(
      (r: { nombre: string; descripcion?: string | null }) =>
        admiteTallerCamper(r, { exigirSenal: false })
    )
    .slice(0, 4)

  const nombre = tituloTaller(taller.nombre)
  const h1 = h1Taller(taller)
  const direccion = direccionVisible(taller.direccion)
  const maps = mapsUrlTaller(taller)
  const area = areaDesdeTaller(taller, nombre, direccion, maps)
  const provinciaLanding = isEspana(taller.pais) ? normalizarProvincia(taller.provincia) : null
  const sitio = [taller.ciudad, taller.provincia].filter(Boolean).join(', ')
  const fotos = [
    taller.foto_principal,
    ...(Array.isArray(taller.fotos_urls) ? taller.fotos_urls : []),
  ].filter((u, i, arr): u is string => Boolean(u) && arr.indexOf(u) === i)

  const ctaArea = {
    id: taller.id,
    slug: taller.slug,
    pais: taller.pais,
    ciudad: taller.ciudad,
    provincia: taller.provincia,
    comunidad: taller.comunidad,
  }

  const talleresRelacionados = (relacionados || []).map((r: {
    id: string
    nombre: string
    slug: string
    ciudad: string | null
    provincia: string | null
    foto_principal: string | null
    google_rating: number | null
  }) => {
    const rating = r.google_rating != null ? Number(r.google_rating) : null
    return {
      id: r.id,
      nombre: tituloTaller(r.nombre),
      slug: r.slug,
      ciudad: r.ciudad,
      provincia: r.provincia,
      foto_principal: r.foto_principal,
      google_rating: rating != null && Number.isFinite(rating) ? rating : null,
      precio_noche: null,
    }
  })

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: nombre,
    alternateName: h1,
    description: area.descripcion || h1,
    url: `${BASE}/taller/${taller.slug}`,
    image: taller.foto_principal || `${BASE}/images/opengraph/opengraph_talleres_card.jpg`,
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
        <DetalleAreaHeader area={area} variante="taller" />

        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div className="w-full lg:w-[60%] space-y-8">
              <InformacionBasica area={area} variante="taller" titulo={h1} />

              <CtaAlquilerFurgocasa variante="taller" area={ctaArea} />

              {fotos.length > 1 ? <GaleriaFotos fotos={fotos} nombre={nombre} /> : null}

              {talleresRelacionados.length > 0 && (
                <AreasRelacionadas
                  areas={talleresRelacionados}
                  hrefBase="/taller"
                  titulo={
                    taller.provincia
                      ? `Otros talleres camper en ${taller.provincia}`
                      : 'Otros talleres camper'
                  }
                />
              )}

              {provinciaLanding && (
                <Link
                  href={`/talleres/${provinciaLanding.slug}`}
                  className="block bg-white rounded-2xl shadow-card p-5 text-center font-semibold text-[#0b3c74] hover:bg-[#EEF4FB] transition-colors"
                >
                  Ver todos los talleres en {provinciaLanding.nombre} →
                </Link>
              )}

              <CtaCenaCerca area={ctaArea} variante="taller" />
            </div>

            <div className="w-full lg:w-[40%] relative">
              <div className="sticky top-24 space-y-8">
                <MapaUbicacion
                  latitud={Number(taller.latitud)}
                  longitud={Number(taller.longitud)}
                  nombre={nombre}
                />
                <ContactoInfo area={area} modo="taller" />
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
