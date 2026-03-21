import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import WelcomeModal from '@/components/ui/WelcomeModal'
import ChatbotWidget from '@/components/chatbot/ChatbotWidget'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mapafurgocasa.com'),
  title: 'Mapa Furgocasa - Áreas Autocaravanas + Gestión Inteligente con IA | +3600 Ubicaciones',
  description: '🚐 Descubre +3600 áreas para autocaravanas en Europa y LATAM. 🤖 Gestión inteligente con IA: valoración automática GPT-4, control de mantenimiento, gastos, ROI. 📍 Sistema QR anti-robos. 🗺️ Planifica rutas. ¡100% GRATIS!',
  keywords: [
    'áreas autocaravanas',
    'mapa autocaravanas',
    'gestión autocaravanas',
    'valoración autocaravana IA',
    'GPT-4 autocaravanas',
    'inteligencia artificial autocaravanas',
    'control mantenimiento autocaravana',
    'QR antirrobo autocaravana',
    'sistema alertas accidentes',
    'parkings autocaravanas',
    'camping autocaravanas',
    'pernocta autocaravanas',
    'rutas autocaravanas',
    'áreas autocaravanas europa',
    'áreas autocaravanas latinoamérica',
    'furgocasa',
    'autocaravanas españa',
    'chatbot autocaravanas',
    'valoración automática vehículo',
    'precio mercado autocaravana'
  ],
  authors: [{ name: 'Furgocasa' }],
  manifest: '/manifest.json',
  themeColor: '#0b3c74',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Furgocasa',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://www.mapafurgocasa.com',
    title: '🚐 Mapa Furgocasa - Áreas + Gestión Inteligente IA | +3600 Ubicaciones',
    description: '🤖 Gestión inteligente con IA GPT-4: valoración automática, control total de mantenimiento, gastos, ROI. 📍 +3600 áreas verificadas en Europa y LATAM. 🔒 Sistema QR anti-robos. ¡100% GRATIS!',
    siteName: 'Mapa Furgocasa',
    images: [{
      url: 'https://www.mapafurgocasa.com/og-image-v2.jpg',
      width: 1200,
      height: 630,
      alt: 'Mapa Furgocasa - Gestión Inteligente con IA + Áreas para Autocaravanas'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '🚐 Mapa Furgocasa - IA + Áreas Autocaravanas',
    description: '🤖 Valoración automática GPT-4 | 📍 +3600 áreas verificadas | 🔒 Sistema QR antirrobo | 🗺️ Planificador rutas | ¡GRATIS!',
    images: ['https://www.mapafurgocasa.com/og-image-v2.jpg'],
    creator: '@furgocasa',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0b3c74',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        {/* Favicons adicionales para máxima compatibilidad */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        {/* Meta tag moderno para reemplazar el deprecado apple-mobile-web-app-capable */}
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8E3JE5ZVET"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8E3JE5ZVET');
          `}
        </Script>

        {/* Google Maps Places API - Necesario para el buscador geográfico */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=es`}
          strategy="lazyOnload"
        />

        <WelcomeModal />
        <ChatbotWidget />
        {children}
      </body>
    </html>
  )
}
