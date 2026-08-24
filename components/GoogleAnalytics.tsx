'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

const GA_ID = 'G-8E3JE5ZVET'

export default function GoogleAnalytics() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  )
}
