import { Metadata } from 'next'
import { PaisLandingPage } from '@/components/mapa/PaisLandingPage'
import { PAISES_SEO_CONFIG } from '@/config/paises-seo'

const pais = PAISES_SEO_CONFIG['reino-unido']

export const metadata: Metadata = {
  title: pais.metaTitle,
  description: pais.metaDescription,
  keywords: pais.keywords,
  openGraph: {
    title: pais.metaTitle,
    description: pais.metaDescription,
    url: `https://www.mapafurgocasa.com${pais.urlSlug}`,
    siteName: 'Mapa Furgocasa',
    type: 'website',
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: pais.metaTitle,
    description: pais.metaDescription,
  },
  alternates: {
    canonical: `https://www.mapafurgocasa.com${pais.urlSlug}`,
  },
}

export default function ReinoUnidoPage() {
  return <PaisLandingPage pais={pais} />
}
