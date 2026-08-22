import { notFound, permanentRedirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import slugRedirects from '@/lib/areas/slug-redirects.json'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DetalleAreaHeader } from '@/components/area/DetalleAreaHeader'
import { ServiciosGrid } from '@/components/area/ServiciosGrid'
import { InformacionBasica } from '@/components/area/InformacionBasica'
import { MapaUbicacion } from '@/components/area/MapaUbicacion'
import { ContactoInfo } from '@/components/area/ContactoInfo'
import { GaleriaFotos } from '@/components/area/GaleriaFotos'
import { AreasRelacionadas } from '@/components/area/AreasRelacionadas'
import { ConfirmarDatosArea } from '@/components/area/ConfirmarDatosArea'
import { BackToTop } from '@/components/area/BackToTop'
import { CtaAlquilerFurgocasa } from '@/components/area/CtaAlquilerFurgocasa'
import { CtaCenaCerca } from '@/components/area/CtaCenaCerca'
import { LANG_COOKIE, isTranslationLocale, normalizeLocale } from '@/lib/i18n/config'
import { mergeAreaTranslation } from '@/lib/i18n/mergeAreaTranslation'
import { areaSeoSnippet } from '@/lib/areas/seo-snippet'
import { isEspana } from '@/lib/areas/cta-comercial'
import { normalizarProvincia } from '@/lib/areas/provincias'
import type { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'

interface PageProps {
  params: {
    slug: string
  }
}

function redirectIfLegacySlug(slug: string) {
  const dest = (slugRedirects as Record<string, string>)[slug]
  if (dest && dest !== slug) {
    permanentRedirect(`/area/${dest}`)
  }
}

// Generar metadata dinámica para SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  redirectIfLegacySlug(params.slug)
  const supabase = await createClient()

  const { data: area } = await (supabase as any)
    .from('areas')
    .select('*')
    .eq('slug', params.slug)
    .eq('activo', true)
    .single()

  if (!area) {
    return {
      title: 'Área no encontrada - Mapa Furgocasa',
    }
  }

  const snippet = areaSeoSnippet({
    nombre: area.nombre,
    ciudad: area.ciudad,
    provincia: area.provincia,
    tipo_area: area.tipo_area,
    precio_noche: area.precio_noche,
    precio_24h: area.precio_24h,
    acceso_24h: area.acceso_24h,
    servicios: area.servicios && typeof area.servicios === 'object' ? area.servicios : null,
  })

  return {
    title: snippet.title,
    description: snippet.description,
    openGraph: {
      title: snippet.title,
      description: snippet.description,
      images: area.foto_principal ? [area.foto_principal] : [],
    },
  }
}

export default async function AreaPage({ params }: PageProps) {
  redirectIfLegacySlug(params.slug)
  const supabase = await createClient()
  const cookieStore = await cookies()
  const locale = normalizeLocale(cookieStore.get(LANG_COOKIE)?.value)

  // Obtener datos del área
  const { data: areaRaw, error } = await (supabase as any)
    .from('areas')
    .select('*')
    .eq('slug', params.slug)
    .eq('activo', true)
    .single()

  if (error || !areaRaw) {
    notFound()
  }

  let area = areaRaw
  if (isTranslationLocale(locale)) {
    const { data: trad } = await (supabase as any)
      .from('areas_traducciones')
      .select('nombre, descripcion, direccion, ciudad, provincia, comunidad, pais')
      .eq('area_id', areaRaw.id)
      .eq('idioma', locale)
      .maybeSingle()
    area = mergeAreaTranslation(areaRaw, trad, locale)
  }

  // Obtener áreas relacionadas (misma provincia)
  let areasRelacionadasQuery = (supabase as any)
    .from('areas')
    .select('id, nombre, slug, ciudad, provincia, tipo_area, precio_noche, foto_principal, google_rating')
    .eq('provincia', areaRaw.provincia)
    .eq('activo', true)
    .neq('id', area.id)
    .order('google_rating', { ascending: false, nullsFirst: false })
    .limit(4)

  const { data: areasRelacionadasRaw } = await areasRelacionadasQuery
  let areasRelacionadas = areasRelacionadasRaw
  if (isTranslationLocale(locale) && areasRelacionadasRaw?.length) {
    const ids = areasRelacionadasRaw.map((a: any) => a.id)
    const { data: trads } = await (supabase as any)
      .from('areas_traducciones')
      .select('area_id, nombre, ciudad, provincia')
      .eq('idioma', locale)
      .in('area_id', ids)
    const byId = new Map<string, { nombre?: string; ciudad?: string; provincia?: string }>(
      (trads || []).map((t: any) => [t.area_id as string, t])
    )
    areasRelacionadas = areasRelacionadasRaw.map((a: any) => {
      const tr = byId.get(a.id)
      if (!tr) return a
      return { ...a, nombre: tr.nombre || a.nombre, ciudad: tr.ciudad || a.ciudad, provincia: tr.provincia || a.provincia }
    })
  }

  // Preparar datos estructurados (JSON-LD)
  const schemaData = {
    "@context": "https://schema.org",
    "@type": area.tipo_area === 'camping' ? "Campground" : "ParkingFacility",
    "name": area.nombre,
    "description": area.descripcion || `Área para autocaravanas en ${area.ciudad}`,
    "url": `https://www.mapafurgocasa.com/area/${area.slug}`,
    "image": area.foto_principal || "https://www.mapafurgocasa.com/og-image-v2.jpg",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": area.latitud,
      "longitude": area.longitud
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": area.ciudad,
      "addressRegion": area.provincia,
      "addressCountry": area.pais,
      "streetAddress": area.direccion || ""
    },
    ...(area.google_rating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": area.google_rating,
        "bestRating": "5",
        "ratingCount": area.google_ratings_total || 1
      }
    }),
    ...(area.precio_noche !== null && {
      "offers": {
        "@type": "Offer",
        "price": area.precio_noche,
        "priceCurrency": "EUR"
      }
    })
  }

  const ctaArea = {
    id: String(area.id),
    slug: String(area.slug || ''),
    pais: area.pais,
    ciudad: area.ciudad,
    provincia: area.provincia,
    comunidad: area.comunidad,
  }

  // Landing SEO de la provincia (§15): interlinking ficha → /areas/{provincia}
  const provinciaLanding = isEspana(areaRaw.pais) ? normalizarProvincia(areaRaw.provincia) : null

  return (
    <>
      {/* Schema.org JSON-LD para SEO */}
      <Script
        id="schema-area"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <Navbar />

      <div className="min-h-screen bg-gray-50">
        <DetalleAreaHeader area={area} />

        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div className="w-full lg:w-[60%] space-y-8">
              <InformacionBasica area={area} />

              <CtaAlquilerFurgocasa area={ctaArea} />

              {area.servicios && (
                <ServiciosGrid servicios={area.servicios as any} />
              )}

              <ConfirmarDatosArea
                areaId={area.id}
                serviciosActuales={area.servicios as any}
                precioActual={area.precio_noche}
                plazasActuales={area.plazas_totales}
              />

              {(() => {
                let fotos = area.fotos_urls
                if (typeof fotos === 'string' && fotos.trim()) {
                  try {
                    fotos = JSON.parse(fotos)
                  } catch {
                    fotos = fotos.split(',').map((url: string) => url.trim()).filter((url: string) => url)
                  }
                }
                if (fotos && Array.isArray(fotos) && fotos.length > 0) {
                  return <GaleriaFotos fotos={fotos} nombre={area.nombre} />
                }
                return null
              })()}

              {areasRelacionadas && areasRelacionadas.length > 0 && (
                <AreasRelacionadas areas={areasRelacionadas} />
              )}

              {provinciaLanding && (
                <Link
                  href={`/areas/${provinciaLanding.slug}`}
                  className="block bg-white rounded-2xl shadow-card p-5 text-center font-semibold text-[#0b3c74] hover:bg-[#EEF4FB] transition-colors"
                >
                  Ver todas las áreas de autocaravanas en {provinciaLanding.nombre} →
                </Link>
              )}

              <CtaCenaCerca area={ctaArea} />
            </div>

            <div className="w-full lg:w-[40%] relative">
              <div className="sticky top-24 space-y-8">
                <MapaUbicacion
                  latitud={Number(area.latitud)}
                  longitud={Number(area.longitud)}
                  nombre={area.nombre}
                />
                <ContactoInfo area={area} />
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
