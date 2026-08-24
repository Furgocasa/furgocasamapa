import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description:
    'Información sobre las cookies que utilizamos en mapafurgocasa.com. Tipos de cookies, finalidad y cómo gestionar tus preferencias.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
