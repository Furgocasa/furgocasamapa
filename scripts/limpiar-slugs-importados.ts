/**
 * Sustituye slugs de import (nombre-es-AbC123xy) por nombre-ciudad.
 * Escribe lib/areas/slug-redirects.json para las 301.
 *
 *   npx ts-node --project tsconfig.scripts.json scripts/limpiar-slugs-importados.ts
 *   npx ts-node --project tsconfig.scripts.json scripts/limpiar-slugs-importados.ts --apply
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { baseAreaSlug, isImportedUglySlug, uniqueAreaSlug } from '../lib/areas/slug'

if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

dotenv.config({ path: '.env.local' })

const APPLY = process.argv.includes('--apply')
const REDIRECTS_PATH = path.join(__dirname, '..', 'lib', 'areas', 'slug-redirects.json')
const CONCURRENCY = 8

type AreaRow = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  provincia: string | null
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function loadAreas(): Promise<AreaRow[]> {
  const rows: AreaRow[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('areas')
      .select('id,nombre,slug,ciudad,provincia')
      .range(from, from + 999)
    if (error) throw error
    if (!data?.length) break
    rows.push(...(data as AreaRow[]))
    if (data.length < 1000) break
    from += 1000
  }
  return rows
}

function mergeRedirects(
  existing: Record<string, string>,
  mappings: Array<{ oldSlug: string; newSlug: string }>
): Record<string, string> {
  const next = { ...existing }
  for (const { oldSlug, newSlug } of mappings) {
    if (oldSlug === newSlug) continue
    next[oldSlug] = newSlug
    for (const [from, to] of Object.entries(next)) {
      if (to === oldSlug) next[from] = newSlug
    }
  }
  return next
}

async function mapPool<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  concurrency: number
) {
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      await fn(items[idx])
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
}

async function main() {
  const areas = await loadAreas()
  const ugly = areas.filter((a) => isImportedUglySlug(a.slug))
  const taken = new Set(areas.map((a) => a.slug))
  for (const a of ugly) taken.delete(a.slug)

  const mappings = ugly.map((a) => {
    const next = uniqueAreaSlug(baseAreaSlug(a.nombre, a.ciudad, a.provincia), taken)
    taken.add(next)
    return { id: a.id, oldSlug: a.slug, newSlug: next, nombre: a.nombre }
  })

  const changed = mappings.filter((m) => m.oldSlug !== m.newSlug)
  console.log(`Áreas: ${areas.length}`)
  console.log(`Slugs de import a limpiar: ${ugly.length}`)
  console.log(`Cambios: ${changed.length}`)
  console.log('Ejemplos:')
  for (const m of changed.slice(0, 8)) {
    console.log(`  ${m.oldSlug}  →  ${m.newSlug}`)
  }

  const existingRedirects = JSON.parse(fs.readFileSync(REDIRECTS_PATH, 'utf8') || '{}') as Record<
    string,
    string
  >
  const redirects = mergeRedirects(existingRedirects, changed)

  if (!APPLY) {
    console.log('\nDRY RUN. Para escribir: --apply')
    return
  }

  let phase1 = 0
  await mapPool(
    changed,
    async (m) => {
      const { error } = await supabase
        .from('areas')
        .update({ slug: `tmp-mig-${m.id}`, updated_at: new Date().toISOString() })
        .eq('id', m.id)
      if (error) throw new Error(`tmp ${m.oldSlug}: ${error.message}`)
      phase1++
      if (phase1 % 200 === 0) console.log(`  tmp ${phase1}/${changed.length}`)
    },
    CONCURRENCY
  )
  console.log(`Fase 1 (tmp): ${phase1}`)

  let phase2 = 0
  const failed: string[] = []
  await mapPool(
    changed,
    async (m) => {
      const { error } = await supabase
        .from('areas')
        .update({ slug: m.newSlug, updated_at: new Date().toISOString() })
        .eq('id', m.id)
      if (error) {
        failed.push(`${m.oldSlug} → ${m.newSlug}: ${error.message}`)
        return
      }
      phase2++
      if (phase2 % 200 === 0) console.log(`  final ${phase2}/${changed.length}`)
    },
    CONCURRENCY
  )
  console.log(`Fase 2 (final): ${phase2}`)
  if (failed.length) {
    console.error('Fallos:', failed.slice(0, 20))
    throw new Error(`${failed.length} slugs no se pudieron escribir`)
  }

  fs.writeFileSync(REDIRECTS_PATH, `${JSON.stringify(redirects, null, 0)}\n`)
  console.log(`Redirects: ${Object.keys(redirects).length} → ${REDIRECTS_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
