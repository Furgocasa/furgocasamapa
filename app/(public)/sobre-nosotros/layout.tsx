import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre Nosotros - Mapa Furgocasa | El Mapa de Áreas para Autocaravanas',
  description: 'Conoce Mapa Furgocasa, una herramienta creada por Furgocasa para la comunidad autocaravanista. +3600 áreas verificadas en Europa y Latinoamérica, planificador de rutas y gestión inteligente con IA.',
  keywords: [
    'mapa furgocasa',
    'sobre mapa furgocasa',
    'furgocasa',
    'comunidad autocaravanas',
    'mapa áreas autocaravanas',
    'gestión autocaravanas'
  ],
  openGraph: {
    title: 'Sobre Mapa Furgocasa - Tu Compañero de Viaje en Autocaravana',
    description: 'Conoce nuestra historia y misión: una plataforma creada para la comunidad autocaravanista, con +3600 áreas verificadas e IA para gestionar tu vehículo.',
    url: 'https://www.mapafurgocasa.com/sobre-nosotros',
  },
}

export default function SobreNosotrosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

