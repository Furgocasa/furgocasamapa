import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MapPinIcon, StarIcon } from '@heroicons/react/24/solid'
import {
  PROVINCIAS_ES,
  provinciaPorSlug,
  valoresConsultaProvincia,
  type ProvinciaES,
} from '@/lib/areas/provincias'
import { resolverCtaAlquiler } from '@/lib/areas/cta-comercial'
import textosProvincias from '@/lib/areas/textos-provincias.json'

export const revalidate = 3600

const BASE_URL = 'https://www.mapafurgocasa.com'

interface AreaRow {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  tipo_area: 'publica' | 'privada' | 'camping'
  precio_noche: number | null
  foto_principal: string | null
  servicios: Record<string, boolean> | null
  google_rating: number | null
  google_ratings_total: number | null
  con_descuento_furgocasa: boolean
  plazas_totales: number | null
}

const getAreasProvincia = cache(async (prov: ProvinciaES): Promise<AreaRow[]> => {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('areas')
    .select(
      'id, nombre, slug, ciudad, tipo_area, precio_noche, foto_principal, servicios, google_rating, google_ratings_total, con_descuento_furgocasa, plazas_totales'
    )
    .eq('activo', true)
    .eq('pais', 'España')
    .in('provincia', valoresConsultaProvincia(prov))
    .order('google_rating', { ascending: false, nullsFirst: false })
  return (data || []) as AreaRow[]
})

function stats(areas: AreaRow[]) {
  const publicas = areas.filter((a) => a.tipo_area === 'publica')
  const privadas = areas.filter((a) => a.tipo_area === 'privada')
  const campings = areas.filter((a) => a.tipo_area === 'camping')
  const gratuitas = areas.filter((a) => a.precio_noche === 0)
  const precios = areas
    .map((a) => a.precio_noche)
    .filter((p): p is number => typeof p === 'number' && p > 0)
    .sort((a, b) => a - b)
  const conServicio = (key: string) => areas.filter((a) => a.servicios && a.servicios[key]).length
  return {
    total: areas.length,
    publicas,
    privadas,
    campings,
    gratuitas,
    precioMin: precios[0] ?? null,
    precioMax: precios.length ? precios[precios.length - 1] : null,
    agua: conServicio('agua'),
    electricidad: conServicio('electricidad'),
    vaciado: areas.filter(
      (a) => a.servicios && (a.servicios.vaciado_aguas_grises || a.servicios.vaciado_aguas_negras)
    ).length,
  }
}

function resumenProvincia(nombre: string, s: ReturnType<typeof stats>): string {
  const partes: string[] = []
  partes.push(
    `En ${nombre} hay ${s.total} sitios donde pernoctar en autocaravana: ${s.publicas.length} áreas públicas, ${s.privadas.length} áreas privadas y ${s.campings.length} campings que admiten autocaravanas.`
  )
  if (s.gratuitas.length > 0 && s.precioMin !== null) {
    partes.push(
      `${s.gratuitas.length} son gratuitos y el resto cuesta entre ${s.precioMin} y ${s.precioMax} € por noche.`
    )
  } else if (s.gratuitas.length > 0) {
    partes.push(`${s.gratuitas.length} son gratuitos.`)
  } else if (s.precioMin !== null) {
    partes.push(`Los precios van de ${s.precioMin} a ${s.precioMax} € por noche.`)
  }
  return partes.join(' ')
}

function faqsProvincia(nombre: string, s: ReturnType<typeof stats>) {
  const faqs: { pregunta: string; respuesta: string }[] = []
  faqs.push({
    pregunta: `¿Cuántas áreas de autocaravanas hay en ${nombre}?`,
    respuesta: `Hay ${s.total} sitios activos para autocaravanas en ${nombre}: ${s.publicas.length} áreas públicas, ${s.privadas.length} áreas privadas y ${s.campings.length} campings. Cada ficha incluye servicios, precio, fotos y ubicación exacta.`,
  })
  if (s.gratuitas.length > 0) {
    const top = s.gratuitas.slice(0, 3).map((a) => a.nombre)
    faqs.push({
      pregunta: `¿Hay áreas de autocaravanas gratuitas en ${nombre}?`,
      respuesta: `Sí, ${s.gratuitas.length} de las ${s.total} áreas de ${nombre} son gratuitas${top.length ? `, por ejemplo: ${top.join(', ')}` : ''}.`,
    })
  }
  if (s.precioMin !== null && s.precioMax !== null) {
    faqs.push({
      pregunta: `¿Cuánto cuesta pasar la noche en autocaravana en ${nombre}?`,
      respuesta: `En las áreas y campings de pago de ${nombre} la noche cuesta entre ${s.precioMin} y ${s.precioMax} €${s.gratuitas.length ? `, y ${s.gratuitas.length} áreas son gratuitas` : ''}. El precio exacto está en cada ficha.`,
    })
  }
  faqs.push({
    pregunta: `¿Se puede pernoctar en autocaravana en ${nombre}?`,
    respuesta: `Sí. Pernoctar (dormir dentro del vehículo estacionado correctamente) está permitido en las áreas habilitadas de ${nombre} que ves en esta página. Acampar fuera de ellas (sacar toldo, mesas o niveladores) lo regula cada municipio y puede estar sancionado.`,
  })
  return faqs
}

const TIPO_LABEL: Record<string, string> = {
  publica: 'Área pública',
  privada: 'Área privada',
  camping: 'Camping',
}

function AreaCard({ area, provincia }: { area: AreaRow; provincia: string }) {
  const serviciosTop: string[] = []
  const s = area.servicios || {}
  if (s.agua) serviciosTop.push('Agua')
  if (s.electricidad) serviciosTop.push('Electricidad')
  if (s.vaciado_aguas_grises || s.vaciado_aguas_negras) serviciosTop.push('Vaciado')
  if (s.duchas) serviciosTop.push('Duchas')
  if (s.wc) serviciosTop.push('WC')

  return (
    <Link
      href={`/area/${area.slug}`}
      className="group bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-[#0b3c74] transition-all flex flex-col"
    >
      <div className="relative w-full h-44 bg-gray-200">
        {area.foto_principal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={area.foto_principal}
            alt={`Área de autocaravanas ${area.nombre}${area.ciudad ? ` en ${area.ciudad}` : ''}, ${provincia}`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <MapPinIcon className="w-12 h-12" />
          </div>
        )}
        {area.con_descuento_furgocasa && (
          <div className="absolute top-2 left-2 bg-[#C44317] text-white text-xs font-bold px-2 py-1 rounded-full shadow">
            🎁 Descuento Furgocasa
          </div>
        )}
        {area.google_rating && (
          <div className="absolute top-2 right-2 flex items-center bg-white px-2 py-1 rounded-full shadow-md">
            <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
            <span className="text-sm font-semibold text-gray-900">{area.google_rating}</span>
          </div>
        )}
      </div>
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-[#0b3c74] transition-colors">
          {area.nombre}
        </h4>
        <div className="flex items-center text-sm text-gray-600">
          <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{[area.ciudad, provincia].filter(Boolean).join(', ')}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EEF4FB] text-[#0b3c74]">
            {TIPO_LABEL[area.tipo_area] || area.tipo_area}
          </span>
          {area.precio_noche !== null && area.precio_noche !== undefined && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {area.precio_noche === 0 ? 'Gratis' : `${area.precio_noche} €/noche`}
            </span>
          )}
          {serviciosTop.slice(0, 3).map((sv) => (
            <span
              key={sv}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-50 border border-gray-200 text-gray-600"
            >
              {sv}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

interface PageProps {
  params: Promise<{ provincia: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { provincia } = await params
  const prov = provinciaPorSlug(provincia)
  if (!prov) return { title: 'Provincia no encontrada - Mapa Furgocasa' }
  const areas = await getAreasProvincia(prov)
  if (!areas.length) return { title: 'Provincia no encontrada - Mapa Furgocasa' }
  const s = stats(areas)

  const title = `Áreas de autocaravanas en ${prov.nombre}: ${s.total} áreas y campings`
  const trozos: string[] = [
    `${s.total} áreas para autocaravanas en ${prov.nombre}: ${s.publicas.length} públicas`,
  ]
  if (s.gratuitas.length) trozos.push(`${s.gratuitas.length} gratuitas`)
  trozos.push(`${s.privadas.length} privadas y ${s.campings.length} campings`)
  const description = `${trozos.join(', ')}. Precios, servicios, fotos y mapa de cada área.`

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/areas/${prov.slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/areas/${prov.slug}`,
      siteName: 'Mapa Furgocasa',
      type: 'website',
      locale: 'es_ES',
    },
  }
}

export default async function ProvinciaPage({ params }: PageProps) {
  const { provincia } = await params
  const prov = provinciaPorSlug(provincia)
  if (!prov) notFound()

  const areas = await getAreasProvincia(prov)
  if (!areas.length) notFound()

  const s = stats(areas)
  const resumen = resumenProvincia(prov.nombre, s)
  const faqs = faqsProvincia(prov.nombre, s)
  const destacadas = areas.filter((a) => a.con_descuento_furgocasa)

  // Ciudades con conteo (texto, fase 3 las enlazará)
  const ciudades = new Map<string, number>()
  for (const a of areas) {
    const c = (a.ciudad || '').trim()
    if (c) ciudades.set(c, (ciudades.get(c) || 0) + 1)
  }
  const ciudadesTop = [...ciudades.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24)

  const vecinas = prov.vecinas
    .map((slug) => PROVINCIAS_ES.find((p) => p.slug === slug))
    .filter((p): p is ProvinciaES => Boolean(p))

  // Texto editorial único por provincia (fase 1b del §15). Si no existe aún,
  // la página vive del resumen dinámico; nunca párrafo clonado.
  const textoEditorial: string[] | null =
    (textosProvincias as Record<string, string[]>)[prov.slug] || null

  const cta = resolverCtaAlquiler({
    id: prov.slug,
    slug: `areas-${prov.slug}`,
    pais: 'España',
    provincia: prov.nombre,
  })
  const ctaUrl = cta
    ? `https://www.furgocasa.com${cta.basePath}?utm_source=mapafurgocasa&utm_medium=cta_areas_provincia&utm_campaign=alquiler&utm_content=areas-${prov.slug}`
    : null

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Áreas de autocaravanas en España', item: `${BASE_URL}/areas` },
          { '@type': 'ListItem', position: 3, name: prov.nombre, item: `${BASE_URL}/areas/${prov.slug}` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.pregunta,
          acceptedAnswer: { '@type': 'Answer', text: f.respuesta },
        })),
      },
      {
        '@type': 'ItemList',
        name: `Áreas de autocaravanas en ${prov.nombre}`,
        numberOfItems: s.total,
        itemListElement: areas.map((a, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: a.nombre,
          url: `${BASE_URL}/area/${a.slug}`,
        })),
      },
    ],
  }

  const grupos: { titulo: string; areas: AreaRow[] }[] = [
    { titulo: `Áreas públicas de autocaravanas en ${prov.nombre}`, areas: s.publicas },
    { titulo: `Áreas privadas y camper parks en ${prov.nombre}`, areas: s.privadas },
    { titulo: `Campings que admiten autocaravanas en ${prov.nombre}`, areas: s.campings },
  ].filter((g) => g.areas.length > 0)

  return (
    <>
      <Script
        id="schema-provincia"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Navbar />

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0b3c74] to-[#0d4a8f] text-white">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 md:py-14">
            <nav aria-label="Breadcrumb" className="text-sm text-white/70 mb-4">
              <ol className="flex flex-wrap gap-1">
                <li>
                  <Link href="/" className="hover:text-white">Inicio</Link>
                  <span className="mx-1">/</span>
                </li>
                <li>
                  <Link href="/areas" className="hover:text-white">Áreas en España</Link>
                  <span className="mx-1">/</span>
                </li>
                <li className="text-white font-medium">{prov.nombre}</li>
              </ol>
            </nav>

            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Áreas de autocaravanas en {prov.nombre}
            </h1>
            <p className="text-base md:text-xl text-white/90 max-w-3xl leading-relaxed">{resumen}</p>

            {/* Chips de datos rápidos */}
            <div className="flex flex-wrap gap-2 mt-6">
              {[
                [`${s.total} en total`, true],
                [`${s.publicas.length} públicas`, s.publicas.length > 0],
                [`${s.privadas.length} privadas`, s.privadas.length > 0],
                [`${s.campings.length} campings`, s.campings.length > 0],
                [`${s.gratuitas.length} gratuitas`, s.gratuitas.length > 0],
                [`${s.agua} con agua`, s.agua > 0],
                [`${s.electricidad} con electricidad`, s.electricidad > 0],
                [`${s.vaciado} con vaciado`, s.vaciado > 0],
              ]
                .filter(([, show]) => show)
                .map(([label]) => (
                  <span
                    key={label as string}
                    className="bg-white/15 border border-white/25 rounded-full px-3 py-1.5 text-sm font-medium"
                  >
                    {label}
                  </span>
                ))}
            </div>

            <div className="mt-8">
              <Link
                href={`/mapa?provincia=${encodeURIComponent(prov.nombre)}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#0b3c74] rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg"
              >
                Ver {prov.nombre} en el mapa
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 space-y-12">
          {/* Destacadas (escaparate comercial) */}
          {destacadas.length > 0 && (
            <section>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0b3c74] mb-2">
                Áreas destacadas en {prov.nombre}
              </h2>
              <p className="text-gray-600 mb-6">
                Con descuento para usuarios de Mapa Furgocasa: di el código de la ficha al llegar.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {destacadas.map((a) => (
                  <AreaCard key={a.id} area={a} provincia={prov.nombre} />
                ))}
              </div>
            </section>
          )}

          {/* Listado completo por tipo */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0b3c74] mb-6">
              Todas las áreas de autocaravanas en {prov.nombre}
            </h2>
            <div className="space-y-10">
              {grupos.map((g) => (
                <div key={g.titulo}>
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                    {g.titulo} ({g.areas.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {g.areas.map((a) => (
                      <AreaCard key={a.id} area={a} provincia={prov.nombre} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Por localidad */}
          {ciudadesTop.length > 1 && (
            <section>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0b3c74] mb-4">
                Áreas por localidad en {prov.nombre}
              </h2>
              <div className="flex flex-wrap gap-2">
                {ciudadesTop.map(([ciudad, n]) => (
                  <span
                    key={ciudad}
                    className="bg-white border border-gray-200 rounded-full px-3 py-1.5 text-sm text-gray-700"
                  >
                    {ciudad} ({n})
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Texto editorial (fase 1b) */}
          {textoEditorial && (
            <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-[#0b3c74] mb-5">
                Pernoctar en autocaravana en {prov.nombre}: lo que hay que saber
              </h2>
              <div className="space-y-4 max-w-3xl">
                {textoEditorial.map((parrafo, i) => (
                  <p key={i} className="text-gray-700 leading-relaxed">
                    {parrafo}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* FAQs */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0b3c74] mb-6">
              Preguntas frecuentes
            </h2>
            <div className="space-y-4">
              {faqs.map((f) => (
                <div key={f.pregunta} className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">{f.pregunta}</h3>
                  <p className="text-gray-700 leading-relaxed">{f.respuesta}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Provincias vecinas */}
          {vecinas.length > 0 && (
            <section>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0b3c74] mb-4">
                Áreas en provincias cercanas
              </h2>
              <div className="flex flex-wrap gap-2">
                {vecinas.map((v) => (
                  <Link
                    key={v.slug}
                    href={`/areas/${v.slug}`}
                    className="bg-white border-2 border-gray-200 hover:border-[#0b3c74] rounded-full px-4 py-2 text-sm font-medium text-gray-800 hover:text-[#0b3c74] transition-all"
                  >
                    Áreas en {v.nombre}
                  </Link>
                ))}
                <Link
                  href="/areas"
                  className="bg-[#EEF4FB] border-2 border-transparent rounded-full px-4 py-2 text-sm font-semibold text-[#0b3c74]"
                >
                  Todas las provincias
                </Link>
              </div>
            </section>
          )}

          {/* CTA alquiler discreto (mismo criterio que la ficha: solo España, al final) */}
          {cta && ctaUrl && (
            <section className="bg-white rounded-2xl border-2 border-[#0b3c74]/10 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{cta.titulo}</h2>
              <p className="text-gray-600 mb-4">{cta.cuerpo}</p>
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#0b3c74] text-white rounded-xl font-bold hover:bg-[#0d4a8f] transition-all"
              >
                {cta.boton}
              </a>
            </section>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
