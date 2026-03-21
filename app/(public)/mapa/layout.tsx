import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mapa Interactivo de Áreas para Autocaravanas | Mapa Furgocasa',
  description: 'Explora más de 3600 áreas para autocaravanas en un mapa interactivo. Filtra por servicios, precio y ubicación en Europa, América y resto del mundo. Encuentra tu próxima parada con información actualizada en tiempo real.',
  keywords: [
    'mapa áreas autocaravanas',
    'mapa interactivo autocaravanas',
    'encontrar áreas autocaravanas',
    'mapa parkings autocaravanas',
    'áreas ac cerca de mi',
    'mapa campings autocaravanas'
  ],
  openGraph: {
    title: 'Mapa Interactivo - +3600 Áreas para Autocaravanas',
    description: 'Encuentra y filtra áreas para autocaravanas en todo el mundo. Información actualizada de servicios, precios y ubicaciones.',
    url: 'https://www.mapafurgocasa.com/mapa',
  },
}

export default function MapaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

