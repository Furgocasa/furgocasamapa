/**
 * Fotos de la web oficial del taller. Molde Petervan: no Google, no logo, no Instagram, no IA.
 *
 *   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"
 *   npx ts-node --project tsconfig.scripts.json scripts/enriquecer-fotos-talleres.ts
 *
 * Dry-run: IMG_DRYRUN=1
 * Lote: IMG_LIMIT=20
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { scrapeFotosWebOficial } from '../lib/areas/scrape-official-images'
import { generateAndStoreTallerImage } from '../lib/areas/generate-area-image'

const DRY = /^(1|true|yes)$/i.test(process.env.IMG_DRYRUN || '')
const LIMIT = Math.max(0, parseInt(process.env.IMG_LIMIT || '0', 10) || 0)
const MAX_FOTOS = Math.max(1, parseInt(process.env.IMG_MAX || '4', 10) || 4)
const CONCURRENCY = Math.max(1, parseInt(process.env.IMG_CONCURRENCY || '3', 10) || 3)

const RED_SOCIAL =
  /instagram\.com|facebook\.com|fb\.com|tiktok\.com|twitter\.com|x\.com|youtube\.com|wa\.me|api\.whatsapp/i

const EXTRA = [
  '/galeria',
  '/galeria/',
  '/fotos',
  '/trabajos',
  '/proyectos',
  '/camperizacion',
  '/camperización',
  '/realizaciones',
  '/portfolio',
]

type Row = {
  id: string
  nombre: string
  slug: string
  website: string | null
  foto_principal: string | null
  fotos_urls?: string[] | null
  ciudad?: string | null
  provincia?: string | null
  pais?: string | null
  latitud?: number | null
  longitud?: number | null
}

async function main() {
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
  )
  const all: Row[] = []
  for (let page = 0; ; page++) {
    const { data, error } = await supa
      .from('talleres')
      .select('id,nombre,slug,website,foto_principal,fotos_urls,ciudad,provincia,pais,latitud,longitud')
      .eq('activo', true)
      .is('foto_principal', null)
      .order('nombre')
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (error) throw error
    if (!data?.length) break
    all.push(...(data as Row[]))
    if (data.length < 1000) break
  }

  const targets = all.filter((t) => {
    const w = (t.website || '').trim()
    return w && !RED_SOCIAL.test(w)
  })
  const lote = LIMIT ? targets.slice(0, LIMIT) : targets

  console.log(`🧭 ${all.length} sin foto, ${targets.length} con web usable, lote ${lote.length}`)
  if (DRY) {
    lote.forEach((t) => console.log(' -', t.nombre, t.website))
    return
  }

  let ok = 0
  let miss = 0
  const cola = lote.slice()
  const workers = Array.from({ length: Math.min(CONCURRENCY, lote.length) }, async () => {
    while (cola.length) {
      const t = cola.shift()
      if (!t) break
      const fotos = await scrapeFotosWebOficial(t.website!, MAX_FOTOS, {
        skipRecintoFilter: true,
        extraPaths: EXTRA,
      })
      if (!fotos.length) {
        miss++
        console.log(`↷ ${t.nombre}`)
        continue
      }
      const { error } = await supa
        .from('talleres')
        .update({
          foto_principal: fotos[0],
          fotos_urls: fotos,
          updated_at: new Date().toISOString(),
        })
        .eq('id', t.id)
      if (error) {
        miss++
        console.log(`✗ ${t.nombre} ${error.message}`)
        continue
      }
      ok++
      console.log(`✓ ${t.nombre} (${fotos.length}) ${fotos[0].slice(0, 90)}`)
    }
  })
  await Promise.all(workers)
  console.log(`\nOficial: ${ok} con foto, ${miss} sin usable, de ${lote.length}`)

  const { data: siguen } = await supa
    .from('talleres')
    .select('id,nombre,slug,website,foto_principal,fotos_urls,ciudad,provincia,pais,latitud,longitud')
    .eq('activo', true)
    .is('foto_principal', null)
  const sinFoto = (siguen || []) as Row[]
  const iaLote = LIMIT ? sinFoto.slice(0, Math.max(0, LIMIT - ok)) : sinFoto
  console.log(`🎨 IA para ${iaLote.length} sin foto (${sinFoto.length} pendientes)`)
  let iaOk = 0
  let iaFail = 0
  const colaIa = iaLote.slice()
  const workersIa = Array.from({ length: Math.min(CONCURRENCY, iaLote.length || 1) }, async () => {
    while (colaIa.length) {
      const t = colaIa.shift()
      if (!t) break
      try {
        await generateAndStoreTallerImage(supa, t)
        iaOk++
        console.log(`✓ IA ${t.nombre}`)
      } catch (e: any) {
        iaFail++
        console.log(`✗ IA ${t.nombre} ${e?.message || e}`)
      }
    }
  })
  if (iaLote.length) await Promise.all(workersIa)
  console.log(`\nRESUMEN: ${ok} oficiales, ${iaOk} IA, ${iaFail} fallos IA`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
