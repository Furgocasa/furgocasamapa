'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

function conNegrita(texto: string, key: { n: number }): ReactNode[] {
  const partes = String(texto).split(/(\*\*[^*]+?\*\*)/g)
  return partes.map((parte) => {
    const negrita = parte.match(/^\*\*([^*]+)\*\*$/)
    if (negrita) {
      return (
        <strong key={key.n++} className="font-semibold">
          {negrita[1]}
        </strong>
      )
    }
    return <span key={key.n++}>{parte}</span>
  })
}

/** Mismo pintado que ve el usuario en el Tío Viajero: enlaces, /area, negritas. */
export function ChatMensajeTexto({
  texto,
  onInternalNavigate,
}: {
  texto: string
  onInternalNavigate?: () => void
}) {
  const sinImagenes = String(texto || '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/(^|\n)\s*[-*]\s+/g, '$1• ')
  const tokenRegex =
    /(\[[^\]]+\]\([^)]+\))|(Ver en Google Maps:\s*https?:\/\/[^\s)]+)|(\/area\/[a-z0-9\-]+)|(\/ruta(?:\?[^\s]*)?)|(https?:\/\/[^\s)]+)/gi

  const nodes: ReactNode[] = []
  const key = { n: 0 }
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(sinImagenes)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...conNegrita(sinImagenes.slice(lastIndex, match.index), key))
    }

    const token = match[0]
    const md = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (md) {
      const [, label, href] = md
      if (href.startsWith('/')) {
        nodes.push(
          <Link
            key={key.n++}
            href={href}
            onClick={onInternalNavigate}
            className="text-sky-700 hover:text-sky-900 underline font-medium"
          >
            {label}
          </Link>
        )
      } else {
        nodes.push(
          <a key={key.n++} href={href} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:text-sky-900 underline font-medium">
            {label}
          </a>
        )
      }
    } else if (/^Ver en Google Maps:/i.test(token)) {
      const url = token.replace(/^Ver en Google Maps:\s*/i, '')
      nodes.push(
        <a key={key.n++} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 underline font-medium">
          🗺️ Ver en Google Maps
        </a>
      )
    } else if (/^\/area\//i.test(token) || /^\/ruta/i.test(token)) {
      nodes.push(
        <Link
          key={key.n++}
          href={token}
          onClick={onInternalNavigate}
          className="text-sky-700 hover:text-sky-900 underline font-medium"
        >
          {token.startsWith('/area/') ? 'Ver área →' : 'Planificador de rutas →'}
        </Link>
      )
    } else if (/^https?:\/\//i.test(token)) {
      const esMaps = /google\.com\/maps|maps\.google\.com/i.test(token)
      nodes.push(
        <a key={key.n++} href={token} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:text-sky-900 underline font-medium break-all">
          {esMaps ? '🗺️ Google Maps' : token}
        </a>
      )
    } else {
      nodes.push(...conNegrita(token, key))
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < sinImagenes.length) {
    nodes.push(...conNegrita(sinImagenes.slice(lastIndex), key))
  }

  return <span className="whitespace-pre-wrap">{nodes.length ? nodes : sinImagenes || '—'}</span>
}
