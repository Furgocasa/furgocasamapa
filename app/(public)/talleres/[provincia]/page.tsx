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
  normalizarProvincia,
  provinciaPorSlug,
  valoresConsultaProvincia,
  type ProvinciaES,
} from '@/lib/areas/provincias'
import { resolverCtaAlquilerTaller } from '@/lib/areas/cta-comercial'
import { TALLER_PIN_COLOR } from '@/lib/talleres/types'
import {
  ciudadGrupoTaller,
  MIN_TALLERES_LANDING_INDEX,
  scoreValoracionTaller,
  sitioTaller,
  tituloTaller,
} from '@/lib/talleres/seo-snippet'

export const revalidate = 3600

const BASE_URL = 'https://www.mapafurgocasa.com'
const OG_IMAGE = `${BASE_URL}/og-image-v2.jpg`

type TallerRow = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  foto_principal: string | null
  google_rating: number | null
  google_ratings_total: number | null
}

function nota(t: TallerRow): number | null {
  if (t.google_rating == null) return null
  const n = Number(t.google_rating)
  return Number.isFinite(n) ? n : null
}

function ordenValoracion(a: TallerRow, b: TallerRow): number {
  const sa = scoreValoracionTaller(a.google_rating, a.google_ratings_total)
  const sb = scoreValoracionTaller(b.google_rating, b.google_ratings_total)
  if (sb !== sa) return sb - sa
  return (b.google_ratings_total || 0) - (a.google_ratings_total || 0)
}

const getTalleres = cache(async (prov: ProvinciaES): Promise<TallerRow[]> => {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('talleres')
    .select('id, nombre, slug, ciudad, foto_principal, google_rating, google_ratings_total')
    .eq('activo', true)
    .in('provincia', valoresConsultaProvincia(prov))
  return ((data || []) as TallerRow[]).sort(ordenValoracion)
})

const getSlugsConTalleres = cache(async () => {
  const supabase = await createClient()
  const slugs = new Set<string>()
  const pageSize = 1000
  for (let page = 0; ; page++) {
    const { data, error } = await (supabase as any)
      .from('talleres')
      .select('provincia')
      .eq('activo', true)
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error || !data) break
    for (const row of data) {
      const p = normalizarProvincia(row.provincia)
      if (p) slugs.add(p.slug)
    }
    if (data.length < pageSize) break
  }
  return slugs
})

function stats(talleres: TallerRow[], nombreProv: string) {
  const conNota = talleres.filter((t) => nota(t) != null)
  const media =
    conNota.length > 0
      ? conNota.reduce((acc, t) => acc + (nota(t) || 0), 0) / conNota.length
      : null
  const reseñas = talleres.reduce((acc, t) => acc + (t.google_ratings_total || 0), 0)
  const ciudades = new Map<string, TallerRow[]>()
  for (const t of talleres) {
    const key = ciudadGrupoTaller(t.ciudad, nombreProv) || nombreProv
    const list = ciudades.get(key) || []
    list.push(t)
    ciudades.set(key, list)
  }
  const grupos = [...ciudades.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'es'))
  const top = talleres[0] || null
  return { total: talleres.length, media, reseñas, grupos, top }
}

function resumenProvincia(nombre: string, s: ReturnType<typeof stats>): string {
  const ciudades = s.grupos.map(([c]) => c).filter((c) => c !== nombre).slice(0, 4)
  const sitios = ciudades.length
    ? ` Están en ${ciudades.join(', ')}${s.grupos.length > ciudades.length + 1 ? ' y más localidades' : ''}.`
    : ''
  const mejor = s.top
    ? ` El de más peso por nota y reseñas es ${tituloTaller(s.top.nombre)}${
        s.top.google_ratings_total
          ? ` (${Number(s.top.google_rating).toFixed(1)}★, ${s.top.google_ratings_total} reseñas)`
          : ''
      }.`
    : ''
  return `En ${nombre} hay ${s.total} ${s.total === 1 ? 'taller' : 'talleres'} de camperizado y accesorios.${sitios}${mejor}`
}

function faqsProvincia(nombre: string, s: ReturnType<typeof stats>) {
  const faqs: { pregunta: string; respuesta: string }[] = []
  faqs.push({
    pregunta: `¿Cuántos talleres camper hay en ${nombre}?`,
    respuesta: `Hay ${s.total} talleres de camperizado, accesorios y habitáculo activos en ${nombre}. No entran neumáticos, lunas, ITV ni el taller de coche genérico. Cada ficha tiene dirección, teléfono y mapa.`,
  })
  const otras = s.grupos.filter(([c]) => c !== nombre)
  if (otras.length) {
    const topCiudades = otras.slice(0, 5).map(([c, list]) => `${c} (${list.length})`)
    faqs.push({
      pregunta: `¿Dónde hay talleres de camperizado en ${nombre}?`,
      respuesta: `Los puntos están en ${topCiudades.join(', ')}${otras.length > 5 ? ' y otras localidades' : ''}. El listado de esta página y la capa Talleres del mapa son el mismo directorio.`,
    })
  }
  if (s.top && s.top.google_rating) {
    faqs.push({
      pregunta: `¿Cuál es el taller camper mejor valorado en ${nombre}?`,
      respuesta: `Por nota de Google y número de reseñas, ahora mismo ${tituloTaller(s.top.nombre)} (${Number(s.top.google_rating).toFixed(1)}★${s.top.google_ratings_total ? `, ${s.top.google_ratings_total} reseñas` : ''}). El ranking cambia cuando Google actualiza las opiniones.`,
    })
  }
  faqs.push({
    pregunta: `¿Un taller camper en ${nombre} es lo mismo que un área?`,
    respuesta: `No. El taller camperiza o repara el habitáculo. El área es para dormir. En el mapa de MapafurgoCasa van en capas distintas: Áreas y Talleres.`,
  })
  return faqs
}

function TallerFila({ t, provincia }: { t: TallerRow; provincia: string }) {
  const n = nota(t)
  const sitio = sitioTaller(t.ciudad, provincia)
  return (
    <Link
      href={`/taller/${t.slug}`}
      className="group flex items-center gap-4 bg-white border-2 border-gray-200 rounded-xl px-4 py-4 hover:border-[#B45309] hover:shadow-lg transition-all"
    >
      {t.foto_principal ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={t.foto_principal}
          alt=""
          className="hidden sm:block w-16 h-16 rounded-xl object-cover shrink-0"
        />
      ) : (
        <span className="hidden sm:flex w-16 h-16 rounded-xl bg-amber-50 text-[#B45309] items-center justify-center shrink-0">
          <MapPinIcon className="w-7 h-7" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-gray-900 group-hover:text-[#B45309] transition-colors">
          {tituloTaller(t.nombre)}
        </span>
        {sitio ? <span className="block text-sm text-gray-500 mt-0.5">{sitio}</span> : null}
      </span>
      {n != null ? (
        <span className="text-right shrink-0">
          <span className="inline-flex items-center gap-1 font-extrabold text-gray-900">
            <StarIcon className="w-4 h-4 text-amber-500" />
            {n.toFixed(1)}
          </span>
          {t.google_ratings_total ? (
            <span className="block text-xs text-gray-500">
              {t.google_ratings_total.toLocaleString('es-ES')} reseñas
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  )
}

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
  const s = stats(talleres, prov.nombre)
  const indexable = s.total >= MIN_TALLERES_LANDING_INDEX
  const title = `Talleres camper en ${prov.nombre}: ${s.total}`
  const ciudades = s.grupos.map(([c]) => c).filter((c) => c !== prov.nombre).slice(0, 3)
  const description = [
    `${s.total} talleres de camperizado y accesorios en ${prov.nombre}`,
    ciudades.length ? ciudades.join(', ') : null,
    s.media != null ? `nota media ${s.media.toFixed(1)}★` : null,
    'Ficha, teléfono y mapa. No neumáticos ni ITV.',
  ]
    .filter(Boolean)
    .join('. ')
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/talleres/${prov.slug}` },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/talleres/${prov.slug}`,
      siteName: 'Mapa Furgocasa',
      type: 'website',
      locale: 'es_ES',
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE],
    },
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
  const [talleres, slugsConTalleres] = await Promise.all([
    getTalleres(prov),
    getSlugsConTalleres(),
  ])
  if (!talleres.length) notFound()

  const s = stats(talleres, prov.nombre)
  const resumen = resumenProvincia(prov.nombre, s)
  const faqs = faqsProvincia(prov.nombre, s)
  const destacados = talleres.slice(0, Math.min(3, talleres.length))
  const indexable = s.total >= MIN_TALLERES_LANDING_INDEX

  const vecinas = prov.vecinas.flatMap((slug) => {
    const found = PROVINCIAS_ES.find((x) => x.slug === slug)
    return found && slugsConTalleres.has(found.slug) ? [found] : []
  })

  const cta = resolverCtaAlquilerTaller({
    id: prov.slug,
    slug: `talleres-${prov.slug}`,
    pais: 'España',
    provincia: prov.nombre,
  })
  const ctaUrl = cta
    ? `https://www.furgocasa.com${cta.basePath}?utm_source=mapafurgocasa&utm_medium=cta_talleres_provincia&utm_campaign=alquiler&utm_content=talleres-${prov.slug}`
    : null

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Talleres camper en España', item: `${BASE_URL}/talleres` },
          { '@type': 'ListItem', position: 3, name: prov.nombre, item: `${BASE_URL}/talleres/${prov.slug}` },
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
        name: `Talleres camper en ${prov.nombre}`,
        numberOfItems: s.total,
        itemListElement: talleres.map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: tituloTaller(t.nombre),
          url: `${BASE_URL}/taller/${t.slug}`,
        })),
      },
    ],
  }

  return (
    <>
      <Script id="schema-talleres-prov" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-[#0b3c74] via-[#0d4a8f] to-[#7c3d0e] text-white">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 md:py-14">
            <nav aria-label="Breadcrumb" className="text-sm text-white/70 mb-4">
              <ol className="flex flex-wrap gap-1">
                <li>
                  <Link href="/" className="hover:text-white">Inicio</Link>
                  <span className="mx-1">/</span>
                </li>
                <li>
                  <Link href="/talleres" className="hover:text-white">Talleres</Link>
                  <span className="mx-1">/</span>
                </li>
                <li className="text-white font-medium">{prov.nombre}</li>
              </ol>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Talleres camper en {prov.nombre}
            </h1>
            <p className="text-base md:text-xl text-white/90 max-w-3xl leading-relaxed">{resumen}</p>
            <div className="flex flex-wrap gap-2 mt-6">
              {[
                [`${s.total} ${s.total === 1 ? 'taller' : 'talleres'}`, true],
                [`${s.grupos.length} ${s.grupos.length === 1 ? 'localidad' : 'localidades'}`, s.grupos.length > 1],
                [s.media != null ? `Media ${s.media.toFixed(1)}★` : '', s.media != null],
                [s.reseñas > 0 ? `${s.reseñas.toLocaleString('es-ES')} reseñas` : '', s.reseñas > 0],
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
                href={`/mapa?capa=talleres&provincia=${encodeURIComponent(prov.nombre)}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#0b3c74] rounded-xl font-bold hover:bg-gray-100 shadow-lg"
              >
                Ver {prov.nombre} en el mapa
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 space-y-12">
          {destacados.length > 1 && indexable ? (
            <section>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0b3c74] mb-2">
                Mejor valorados en {prov.nombre}
              </h2>
              <p className="text-gray-600 mb-6">
                Nota de Google × número de reseñas. Un 5 con dos votos no gana.
              </p>
              <div className="space-y-3">
                {destacados.map((t) => (
                  <TallerFila key={t.id} t={t} provincia={prov.nombre} />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0b3c74] mb-6">
              Todos los talleres camper en {prov.nombre}
            </h2>
            <div className="space-y-10">
              {s.grupos.map(([ciudad, list]) => (
                <div key={ciudad}>
                  {s.grupos.length > 1 ? (
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                      Talleres en {ciudad} ({list.length})
                    </h3>
                  ) : null}
                  <div className="space-y-3">
                    {list.map((t) => (
                      <TallerFila key={t.id} t={t} provincia={prov.nombre} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-[#0b3c74] mb-3">
              Qué cuenta como taller camper en {prov.nombre}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Camperizado, instalación de accesorios (techo, calefacción, placas, agua, gas)
              y reparación del habitáculo o la autocaravana. En {prov.nombre} no listamos
              neumáticos, Feu Vert, Norauto, lunas, ITV, recambios, grúas ni el taller oficial de coche.
            </p>
          </section>

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

          {vecinas.length > 0 ? (
            <section>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0b3c74] mb-4">
                Talleres en provincias cercanas
              </h2>
              <div className="flex flex-wrap gap-2">
                {vecinas.map((v) => (
                  <Link
                    key={v.slug}
                    href={`/talleres/${v.slug}`}
                    className="bg-white border-2 border-gray-200 hover:border-[#B45309] rounded-full px-4 py-2 text-sm font-medium text-gray-800 hover:text-[#B45309] transition-all"
                  >
                    Talleres en {v.nombre}
                  </Link>
                ))}
                <Link
                  href="/talleres"
                  className="bg-amber-50 border-2 border-transparent rounded-full px-4 py-2 text-sm font-semibold text-[#7c3d0e]"
                >
                  Mapa de talleres
                </Link>
              </div>
            </section>
          ) : null}

          {cta && ctaUrl ? (
            <section className="bg-white rounded-2xl border-2 border-[#0b3c74]/10 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{cta.titulo}</h2>
              <p className="text-gray-600 mb-4">{cta.cuerpo}</p>
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#0b3c74] text-white rounded-xl font-bold hover:bg-[#0d4a8f]"
              >
                {cta.boton}
              </a>
            </section>
          ) : null}

          <div className="rounded-2xl p-6 md:p-8 text-center text-white" style={{ backgroundColor: TALLER_PIN_COLOR }}>
            <p className="font-semibold text-lg mb-4">
              {s.total} {s.total === 1 ? 'taller' : 'talleres'} de {prov.nombre} en el mapa.
            </p>
            <Link
              href={`/mapa?capa=talleres&provincia=${encodeURIComponent(prov.nombre)}`}
              className="inline-flex items-center justify-center px-7 py-3.5 bg-white text-[#7c3d0e] rounded-xl font-bold hover:bg-amber-50"
            >
              Abrir la capa Talleres
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
