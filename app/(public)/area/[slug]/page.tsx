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

  return (
    <BannerProvider>
      {/* Navbar */}
      <Navbar />

      <div className="min-h-screen bg-gray-50">
        {/* Header con imagen y acciones */}
        <DetalleAreaHeader area={area} />

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

          {/* Información básica */}
          <InformacionBasica area={area} />

          {/* 🎯 Banner 1: Después de info básica - Usuario ya está interesado */}
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
            // Normalizar fotos_urls por si viene como string en lugar de array
            let fotos = area.fotos_urls
            if (typeof fotos === 'string' && fotos.trim()) {
              try {
                fotos = JSON.parse(fotos)
              } catch {
                // Si no es JSON válido, intentar dividir por comas
                fotos = fotos.split(',').map((url: string) => url.trim()).filter((url: string) => url)
              }
            }

            // Verificar que sea un array válido y con elementos
            if (fotos && Array.isArray(fotos) && fotos.length > 0) {
              return <GaleriaFotos fotos={fotos} nombre={area.nombre} />
            }
            return null
          })()}

          {/* 🎯 Banner 2: Después de galería - Usuario ya vio todo, pensando en ruta */}
          <BannerRotativo
            areaId={area.id}
            position="after-gallery"
            strategy="weighted"
            exclude={['mobile']}
            priority={2}
          />

          {/* Mapa de ubicación */}
          <MapaUbicacion
            latitud={Number(area.latitud)}
            longitud={Number(area.longitud)}
            nombre={area.nombre}
          />

          {/* Información de contacto */}
          <ContactoInfo area={area} />

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

          {/* 🎯 Banner 3: Al final - Última oportunidad de engagement */}
          <BannerRotativo
            areaId={area.id}
            position="after-related"
            strategy="deterministic"
            priority={3}
          />
        </div>
      </div>

      {/* Footer - Solo en páginas de detalle para SEO */}
      <Footer />

      {/* Botón volver arriba */}
      <BackToTop />
    </BannerProvider>
  )
}
