import { cache } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { normalizarProvincia } from '@/lib/areas/provincias'
import { TALLER_ICON_PATH, TALLER_PIN_COLOR } from '@/lib/talleres/types'
import {
  scoreValoracionTaller,
  sitioTaller,
  tituloTaller,
} from '@/lib/talleres/seo-snippet'

export const revalidate = 3600

const BASE_URL = 'https://www.mapafurgocasa.com'
const OG_IMAGE = `${BASE_URL}/og-image-v2.jpg`
const TOP_N = 10
const MIN_RESENAS_TOP = 20

type TallerTop = {
  nombre: string
  slug: string
  ciudad: string | null
  provincia: string | null
  foto_principal: string | null
  google_rating: number | null
  google_ratings_total: number | null
}

const getDirectorio = cache(async () => {
  const supabase = await createClient()
  const rows: TallerTop[] = []
  const slugsProv = new Set<string>()
  const pageSize = 1000
  for (let page = 0; ; page++) {
    const { data, error } = await (supabase as any)
      .from('talleres')
      .select('nombre, slug, ciudad, provincia, foto_principal, google_rating, google_ratings_total')
      .eq('activo', true)
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error || !data) break
    for (const row of data as TallerTop[]) {
      rows.push(row)
      const prov = normalizarProvincia(row.provincia)
      if (prov) slugsProv.add(prov.slug)
    }
    if (data.length < pageSize) break
  }

  const top = rows
    .filter((t) => (t.google_ratings_total || 0) >= MIN_RESENAS_TOP && (t.google_rating || 0) > 0)
    .sort((a, b) => {
      const sa = scoreValoracionTaller(a.google_rating, a.google_ratings_total)
      const sb = scoreValoracionTaller(b.google_rating, b.google_ratings_total)
      if (sb !== sa) return sb - sa
      return (b.google_ratings_total || 0) - (a.google_ratings_total || 0)
    })
    .slice(0, TOP_N)

  return { total: rows.length, provincias: slugsProv.size, top }
})

export async function generateMetadata(): Promise<Metadata> {
  const { total } = await getDirectorio()
  const title = `Talleres camper en España: mapa de ${total} talleres`
  const description = `Mapa de ${total} talleres de camperizado y accesorios en España. Ficha, teléfono y cómo llegar. Áreas y talleres, cada uno en su capa.`
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/talleres` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/talleres`,
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

export default async function TalleresIndexPage() {
  const { total, provincias, top } = await getDirectorio()

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
        '@type': 'ItemList',
        name: 'Talleres camper mejor valorados en España',
        numberOfItems: top.length,
        itemListElement: top.map((t, i) => ({
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
      <Script id="schema-talleres-index" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-[#0b3c74] via-[#0d4a8f] to-[#7c3d0e] text-white">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 md:py-16">
            <nav aria-label="Breadcrumb" className="text-sm text-white/70 mb-5">
              <ol className="flex gap-1">
                <li>
                  <Link href="/" className="hover:text-white">Inicio</Link>
                  <span className="mx-1">/</span>
                </li>
                <li className="text-white font-medium">Talleres</li>
              </ol>
            </nav>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                style={{ backgroundColor: TALLER_PIN_COLOR }}
                aria-hidden
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                  <path d={TALLER_ICON_PATH} />
                </svg>
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Capa Talleres</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-5 tracking-tight">
              Talleres de camperizado en España
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl">
              {total} talleres en el mismo mapa que las áreas, cada uno en su capa.
              Camperizado, accesorios y habitáculo. Ficha con dirección, teléfono y cómo llegar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/mapa?capa=talleres"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-white text-[#0b3c74] rounded-xl font-bold hover:bg-gray-100 shadow-lg"
              >
                Abrir el mapa de talleres
              </Link>
              {top.length ? (
                <a
                  href="#destacados"
                  className="inline-flex items-center justify-center px-7 py-3.5 bg-white/10 text-white rounded-xl font-bold ring-1 ring-white/30 hover:bg-white/20"
                >
                  Ver el top {top.length}
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-12 space-y-12">
          <section className="grid md:grid-cols-3 gap-4">
            {[
              { t: 'Camperizado', d: 'Distribución a medida, muebles, techo, agua y gas. De mini camper a gran volumen.' },
              { t: 'Accesorios', d: 'Calefacción, placas, nevera, claraboya, batería. Lo que se instala en el habitáculo.' },
              { t: 'Arreglo y papeles', d: 'Reparación de lo que ya rueda y homologación para pasar la ITV.' },
            ].map((c) => (
              <div key={c.t} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_24px_-8px_rgba(0,0,0,0.08)] p-6">
                <h2 className="text-lg font-bold text-[#0b3c74] mb-2">{c.t}</h2>
                <p className="text-gray-600 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </section>

          <section className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-[#0b3c74] mb-3">El listado vive en el mapa</h2>
              <p className="text-gray-600 leading-relaxed">
                Aquí no hay 405 nombres en fila. Buscas ciudad, te acercas y abres la ficha.
                El conmutador Áreas | Talleres cambia de capa: un taller no es un sitio para dormir.
                El Tío también distingue: si pides taller, busca talleres.
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Cobertura en {provincias} provincias. Hay provincias con uno o dos.
                El mapa no oculta el hueco.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-[#0b3c74] mb-3">Qué no entra</h2>
              <ul className="space-y-2 text-gray-600">
                <li>Neumáticos, Feu Vert, Norauto</li>
                <li>Lunas y Carglass</li>
                <li>ITV, recambios, grúas</li>
                <li>Taller oficial de coche o Eurorepar</li>
              </ul>
              <p className="mt-4 text-sm text-gray-500">
                Pueden tocar un Ducato. No son taller camper.
              </p>
            </div>
          </section>

          {top.length ? (
            <section id="destacados">
              <h2 className="text-2xl md:text-3xl font-bold text-[#0b3c74] mb-2">
                Los {top.length} con más peso
              </h2>
              <p className="text-gray-500 mb-6">
                Nota de Google × número de reseñas. Un 5 con dos votos no entra.
                El resto está en el mapa.
              </p>
              <ol className="space-y-3">
                {top.map((t, i) => {
                  const nombre = tituloTaller(t.nombre)
                  const sitio = sitioTaller(t.ciudad, t.provincia)
                  const nota = t.google_rating != null ? Number(t.google_rating) : null
                  const reseñas = t.google_ratings_total || 0
                  return (
                    <li key={t.slug}>
                      <Link
                        href={`/taller/${t.slug}`}
                        className="group flex items-center gap-4 bg-white rounded-2xl border-2 border-gray-200 px-4 py-4 hover:border-[#B45309] hover:shadow-lg transition-all"
                      >
                        <span
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold shrink-0"
                          style={{ backgroundColor: TALLER_PIN_COLOR }}
                        >
                          {i + 1}
                        </span>
                        {t.foto_principal ? (
                          <span className="relative hidden sm:block w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                            <Image
                              src={t.foto_principal}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </span>
                        ) : null}
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold text-gray-900 group-hover:text-[#B45309] transition-colors">
                            {nombre}
                          </span>
                          {sitio ? (
                            <span className="block text-sm text-gray-500 mt-0.5">{sitio}</span>
                          ) : null}
                        </span>
                        {nota != null && Number.isFinite(nota) ? (
                          <span className="text-right shrink-0">
                            <span className="block font-extrabold text-gray-900">
                              {nota.toFixed(1)}★
                            </span>
                            <span className="block text-xs text-gray-500">
                              {reseñas.toLocaleString('es-ES')} reseñas
                            </span>
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </section>
          ) : null}

          <div className="rounded-2xl p-6 md:p-8 text-center text-white" style={{ backgroundColor: TALLER_PIN_COLOR }}>
            <p className="font-semibold text-lg mb-4">
              {total} talleres en el mapa, con la capa ya puesta.
            </p>
            <Link
              href="/mapa?capa=talleres"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-white text-[#7c3d0e] rounded-xl font-bold hover:bg-amber-50"
            >
              Ver el mapa de talleres
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
