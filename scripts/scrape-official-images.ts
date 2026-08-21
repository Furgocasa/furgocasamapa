/**
 * Fotos: web oficial del recinto. Si no hay, IA propia.
 * No usa Google ni directorios de terceros.
 *
 * Uso (PowerShell):
 *   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"
 *   $env:IMG_PAIS="España"
 *   $env:IMG_PROVINCIA="Murcia"
 *   $env:IMG_TIPO="camping"
 *   npx ts-node --project tsconfig.scripts.json scripts/scrape-official-images.ts
 *
 * Dry-run: IMG_DRYRUN=1
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { isImagenIA } from '../lib/areas/image-copyright'
import { scrapeFotosWebOficial } from '../lib/areas/scrape-official-images'
import { generateAndStoreAreaImage } from '../lib/areas/generate-area-image'

const PAIS = (process.env.IMG_PAIS || '').trim()
const PROVINCIA = (process.env.IMG_PROVINCIA || '').trim()
const TIPO = (process.env.IMG_TIPO || '').trim()
const NOMBRE = (process.env.IMG_NOMBRE || '').trim()
const DRY = /^(1|true|yes)$/i.test(process.env.IMG_DRYRUN || '')
const FORCE = /^(1|true|yes)$/i.test(process.env.IMG_FORCE || '')

async function main() {
  const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const all: any[] = []
  let page = 0
  while (true) {
    let q = supa
      .from('areas')
      .select('id,nombre,ciudad,provincia,tipo_area,website,foto_principal,fotos_urls')
      .eq('activo', true)
      .order('nombre')
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (PAIS) q = q.eq('pais', PAIS)
    if (PROVINCIA) q = q.eq('provincia', PROVINCIA)
    if (TIPO) q = q.eq('tipo_area', TIPO)
    if (NOMBRE) q = q.ilike('nombre', `%${NOMBRE}%`)
    const { data, error } = await q
    if (error) throw error
    if (!data?.length) break
    all.push(...data)
    if (data.length < 1000) break
    page++
  }

  const targets = all.filter((a) => {
    if (FORCE) return true
    if (a.website) return isImagenIA(a.foto_principal) || !a.foto_principal
    return !a.foto_principal
  })

  console.log(`🧭 ${PAIS || 'todos'} ${PROVINCIA || ''} ${TIPO || ''} | ${all.length} áreas, ${targets.length} a rascar`)
  if (DRY) {
    targets.forEach((a) => console.log(' -', a.nombre, a.website))
    return
  }

  let ok = 0
  let miss = 0
  for (const area of targets) {
    const fotos = area.website ? await scrapeFotosWebOficial(area.website, 7) : []
    if (!fotos.length) {
      try {
        const ia = await generateAndStoreAreaImage(supa, area)
        ok++
        console.log(`🛋️ ${area.nombre} -> IA ${ia.foto_principal.slice(0, 80)}`)
      } catch (e: any) {
        miss++
        console.log(`✗ ${area.nombre} -> sin web oficial y falló IA: ${e.message}`)
      }
      continue
    }
    const { error } = await supa
      .from('areas')
      .update({
        foto_principal: fotos[0],
        fotos_urls: fotos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', area.id)
    if (error) {
      miss++
      console.log(`✗ ${area.nombre} -> DB ${error.message}`)
      continue
    }
    ok++
    console.log(`✓ ${area.nombre} (${fotos.length}) ${fotos[0].slice(0, 90)}`)
  }
  console.log(`\nRESUMEN: ${ok} OK, ${miss} sin foto, de ${targets.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
