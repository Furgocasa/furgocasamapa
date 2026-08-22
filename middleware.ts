import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import slugRedirects from '@/lib/areas/slug-redirects.json'

const SLUG_REDIRECTS = slugRedirects as Record<string, string>

export async function middleware(request: NextRequest) {
  // CRÍTICO: Excluir rutas API ANTES DE CUALQUIER PROCESAMIENTO
  const pathname = request.nextUrl.pathname

  // EXCLUSIÓN ABSOLUTA DE RUTAS API - RETORNAR INMEDIATAMENTE
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/area/')) {
    const slug = pathname.slice('/area/'.length).replace(/\/$/, '')
    const dest = slug && !slug.includes('/') ? SLUG_REDIRECTS[slug] : null
    if (dest && dest !== slug) {
      const url = request.nextUrl.clone()
      url.pathname = `/area/${dest}`
      return NextResponse.redirect(url, 301)
    }
  }

  // Lista completa de otras rutas a excluir
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Detectar HTTPS para producción
          const isHttps = request.headers.get('x-forwarded-proto') === 'https' ||
                          request.nextUrl.protocol === 'https:'

          // Mejorar opciones de cookies para móviles con maxAge explícito
          const cookieOptions = {
            name,
            value,
            ...options,
            path: options.path || '/',
            sameSite: (options.sameSite || 'lax') as 'lax' | 'strict' | 'none',
            secure: isHttps,
            httpOnly: options.httpOnly !== false,
            maxAge: options.maxAge || 31536000, // 1 año por defecto - CRÍTICO para móviles
          }

          request.cookies.set(cookieOptions)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set(cookieOptions)
        },
        remove(name: string, options: CookieOptions) {
          const cookieOptions = {
            name,
            value: '',
            ...options,
            path: options.path || '/',
            maxAge: 0,
          }

          request.cookies.set(cookieOptions)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set(cookieOptions)
        },
      },
    }
  )

  // Refrescar sesión si es necesario
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * CRÍTICO: NUNCA ejecutar middleware en rutas /api/*
     * Solo ejecutar en rutas de páginas que necesitan autenticación
     */
    '/((?!api/|_next/static|_next/image|favicon.ico).*)',
  ],
}
