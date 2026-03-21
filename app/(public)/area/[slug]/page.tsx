import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DetalleAreaHeader } from '@/components/area/DetalleAreaHeader'
import { ServiciosGrid } from '@/components/area/ServiciosGrid'
import { InformacionBasica } from '@/components/area/InformacionBasica'
import { MapaUbicacion } from '@/components/area/MapaUbicacion'
import { ContactoInfo } from '@/components/area/ContactoInfo'
import { GaleriaFotos } from '@/components/area/GaleriaFotos'
import { ValoracionesCompleto } from '@/components/area/ValoracionesCompleto'
import { AreasRelacionadas } from '@/components/area/AreasRelacionadas'
import { BackToTop } from '@/components/area/BackToTop'
import { BannerRotativo } from '@/components/banners/BannerRotativo'
import { BannerProvider } from '@/components/banners/BannerContext'
import type { Metadata } from 'next'
import Script from 'next/script'

interface PageProps {
  params: {
    slug: string
  }
}

// Generar metadata dinámica para SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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

  return {
    title: `${area.nombre} - ${area.ciudad} | Mapa Furgocasa`,
    description: area.descripcion || `Área para autocaravanas en ${area.ciudad}, ${area.provincia}. ${area.tipo_area} con servicios completos.`,
    openGraph: {
      title: area.nombre,
      description: area.descripcion || `Área para autocaravanas en ${area.ciudad}`,
      images: area.foto_principal ? [area.foto_principal] : [],
    },
  }
}

export default async function AreaPage({ params }: PageProps) {
  const supabase = await createClient()

  // Obtener datos del área
  const { data: area, error } = await (supabase as any)
    .from('areas')
    .select('*')
    .eq('slug', params.slug)
    .eq('activo', true)
    .single()

  if (error || !area) {
    notFound()
  }

  // Obtener valoraciones del área
  const { data: valoraciones } = await (supabase as any)
    .from('valoraciones')
    .select('*')
    .eq('area_id', area.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Obtener áreas relacionadas (misma provincia)
  const { data: areasRelacionadas } = await (supabase as any)
    .from('areas')
    .select('id, nombre, slug, ciudad, provincia, tipo_area, precio_noche, foto_principal, google_rating')
    .eq('provincia', area.provincia)
    .eq('activo', true)
    .neq('id', area.id)
    .order('google_rating', { ascending: false, nullsFirst: false })
    .limit(4)

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

  return (
    <BannerProvider>
      {/* Schema.org JSON-LD para SEO */}
      <Script
        id="schema-area"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      {/* Navbar */}
      <Navbar />

      <div className="min-h-screen bg-gray-50">
        {/* Header con imagen y acciones */}
        <DetalleAreaHeader area={area} />

        {/* Contenido principal */}
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Columna Izquierda (Principal) - 65% */}
            <div className="w-full lg:w-[65%] space-y-8">
              {/* Información básica */}
              <InformacionBasica area={area} />

              {/* 🎯 Banner 1: Después de info básica */}
              <BannerRotativo
                areaId={area.id}
                position="after-info"
                strategy="weighted"
                priority={1}
              />

              {/* Servicios */}
              {area.servicios && (
                <ServiciosGrid servicios={area.servicios as any} />
              )}

              {/* Galería de fotos */}
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

              {/* 🎯 Banner 2: Después de galería */}
              <BannerRotativo
                areaId={area.id}
                position="after-gallery"
                strategy="weighted"
                exclude={['mobile']}
                priority={2}
              />

              {/* Valoraciones */}
              <ValoracionesCompleto
                areaId={area.id}
                areaNombre={area.nombre}
                valoraciones={valoraciones || []}
              />

              {/* Áreas relacionadas */}
              {areasRelacionadas && areasRelacionadas.length > 0 && (
                <AreasRelacionadas areas={areasRelacionadas} />
              )}

              {/* 🎯 Banner 3: Al final */}
              <BannerRotativo
                areaId={area.id}
                position="after-related"
                strategy="deterministic"
                priority={3}
              />
            </div>

            {/* Columna Derecha (Sticky) - 35% */}
            <div className="w-full lg:w-[35%] relative">
              <div className="sticky top-24 space-y-6">
                {/* Mapa de ubicación */}
                <MapaUbicacion
                  latitud={Number(area.latitud)}
                  longitud={Number(area.longitud)}
                  nombre={area.nombre}
                />

                {/* Información de contacto */}
                <ContactoInfo area={area} />
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Footer - Solo en páginas de detalle para SEO */}
      <Footer />

      {/* Botón volver arriba */}
      <BackToTop />
    </BannerProvider>
  )
}
