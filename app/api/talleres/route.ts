import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CAMPOS_MAPA_TALLER } from '@/lib/talleres/types'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function fetchAllPages(supabase: any, columns: string) {
  const all: any[] = []
  const pageSize = 1000
  let page = 0
  for (;;) {
    const { data, error } = await supabase
      .from('talleres')
      .select(columns)
      .eq('activo', true)
      .order('id')
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) throw error
    if (!data?.length) break
    all.push(...data)
    if (data.length < pageSize) break
    page++
  }
  return all
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, anonKey, {
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
      },
    })
    const talleres = await fetchAllPages(supabase, CAMPOS_MAPA_TALLER)
    return NextResponse.json(
      { talleres, total: talleres.length, generated_at: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=0, must-revalidate',
        },
      }
    )
  } catch (err: any) {
    console.error('Error cargando talleres:', err?.message)
    return NextResponse.json({ error: 'Error cargando talleres' }, { status: 500 })
  }
}
