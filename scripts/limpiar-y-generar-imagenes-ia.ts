/**
 * Purga imágenes de riesgo alto (A+B) y genera una ilustración propia
 * para las áreas que se queden sin foto por esa limpieza.
 *
 * Uso (PowerShell):
 *   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"
 *   npx ts-node --project tsconfig.scripts.json scripts/limpiar-y-generar-imagenes-ia.ts
 *
 * Solo generar (si la purga ya se hizo):
 *   ... -- --solo-ia
 *
 * Solo purgar:
 *   ... -- --solo-purga
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import {
  altoUrlsOf,
  isImagenIA,
  removeUrlsFromArea,
  uniqueUrlsOf,
  type AreaImagenMin,
} from '../lib/areas/image-copyright'
import { applyAiWatermark, generateAndStoreAreaImage } from '../lib/areas/generate-area-image'
import fs from 'fs'
import path from 'path'

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const args = process.argv.slice(2)
const SOLO_IA = args.includes('--solo-ia')
const SOLO_PURGA = args.includes('--solo-purga')
const REWATERMARK = args.includes('--rewatermark')
const REGENERATE = args.includes('--regenerate')
const DELETE_GENERATED = args.includes('--delete-generated')
const LIMIT_ONE = args.includes('--una')
const limitArg = args.find((a) => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.slice('--limit='.length), 10) : 0
const idsFileArg = args.find((a) => a.startsWith('--ids-file='))
const IDS_FILE = idsFileArg ? idsFileArg.slice('--ids-file='.length) : ''
const previewsDirArg = args.find((a) => a.startsWith('--previews-dir='))
const PREVIEWS_DIR = previewsDirArg ? previewsDirArg.slice('--previews-dir='.length) : ''
const CHECKPOINT = path.join(__dirname, 'imagenes-ia-checkpoint.txt')

async function fetchAllAreas(supa: any): Promise<AreaImagenMin[]> {
  const all: AreaImagenMin[] = []
  const pageSize = 1000
  let page = 0
  while (true) {
    const { data, error } = await supa
      .from('areas')
      .select('id,nombre,slug,ciudad,provincia,pais,tipo_area,latitud,longitud,foto_principal,fotos_urls')
      .eq('activo', true)
      .order('id')
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
    page++
  }
  return all
}

function loadCheckpoint(): Set<string> {
  if (!fs.existsSync(CHECKPOINT)) return new Set()
  return new Set(fs.readFileSync(CHECKPOINT, 'utf8').split(/\r?\n/).filter(Boolean))
}

function appendCheckpoint(id: string) {
  fs.appendFileSync(CHECKPOINT, id + '\n', 'utf8')
}

function removeFromCheckpoint(ids: Set<string>) {
  if (!fs.existsSync(CHECKPOINT)) return
  const remaining = fs
    .readFileSync(CHECKPOINT, 'utf8')
    .split(/\r?\n/)
    .filter((id) => id && !ids.has(id))
  fs.writeFileSync(CHECKPOINT, remaining.length ? `${remaining.join('\n')}\n` : '', 'utf8')
}

function storagePathFromPublicUrl(url: string): string | null {
  const marker = '/storage/v1/object/public/areas/'
  const index = url.indexOf(marker)
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length))
}

async function main() {
  if (!SUPA_URL || !SUPA_KEY) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  const supabase = createClient(SUPA_URL, SUPA_KEY)

  if (REWATERMARK) {
    console.log('💧 Reaplicando marca AI Generated Image en fotos IA...')
    const { data: files, error } = await supabase.storage.from('areas').list('ia', { limit: 1000 })
    if (error) throw error
    let ok = 0
    for (const file of files || []) {
      if (!file.name || file.name.endsWith('/')) continue
      const pathInBucket = `ia/${file.name}`
      const { data, error: dlError } = await supabase.storage.from('areas').download(pathInBucket)
      if (dlError || !data) {
        console.log('  skip', file.name, dlError?.message)
        continue
      }
      const input = Buffer.from(await data.arrayBuffer())
      const marked = await applyAiWatermark(input)
      const { error: upError } = await supabase.storage
        .from('areas')
        .upload(pathInBucket, marked, { contentType: 'image/jpeg', upsert: true })
      if (upError) {
        console.log('  error', file.name, upError.message)
        continue
      }
      ok++
      console.log(`  OK ${file.name}`)
    }
    console.log(`💧 Listo: ${ok} imágenes marcadas`)
    return
  }

  console.log('📦 Cargando áreas...')
  let areas = await fetchAllAreas(supabase)
  console.log(`   ${areas.length} áreas activas`)

  let emptiedIds: string[] = []

  if (IDS_FILE) {
    const raw = fs.readFileSync(path.resolve(IDS_FILE), 'utf8')
    emptiedIds = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    console.log(`🎨 Modo lista: ${emptiedIds.length} ids en ${IDS_FILE}`)
  } else if (SOLO_IA) {
    emptiedIds = areas.filter((a) => uniqueUrlsOf(a).length === 0).map((a) => a.id)
    console.log(`🎨 Modo solo IA: ${emptiedIds.length} áreas sin foto`)
  } else {
    const alto = altoUrlsOf(areas)
    console.log(`\n🗑️ URLs de riesgo alto: ${alto.size}`)
    let areasUpdated = 0
    let imagesRemoved = 0
    for (const area of areas) {
      const next = removeUrlsFromArea(area, alto)
      if (next.removed === 0) continue
      const { error } = await supabase
        .from('areas')
        .update({
          foto_principal: next.foto_principal,
          fotos_urls: next.fotos_urls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', area.id)
      if (error) throw error
      areasUpdated++
      imagesRemoved += next.removed
      if (!next.foto_principal) emptiedIds.push(area.id)
    }
    console.log(`✅ Purga: ${imagesRemoved} fotos quitadas en ${areasUpdated} áreas`)
    console.log(`   Áreas que quedan vacías por la purga: ${emptiedIds.length}`)
    areas = await fetchAllAreas(supabase)
  }

  if (DELETE_GENERATED) {
    const targetIds = new Set(emptiedIds)
    let deletedImages = 0
    let updatedAreas = 0

    for (const area of areas.filter((item) => targetIds.has(item.id))) {
      const currentUrls = uniqueUrlsOf(area)
      const aiUrls = currentUrls.filter((url) => isImagenIA(url))
      if (!aiUrls.length) continue

      const remainingUrls = currentUrls.filter((url) => !isImagenIA(url))
      const storagePaths = aiUrls
        .map(storagePathFromPublicUrl)
        .filter((value): value is string => Boolean(value))
      if (storagePaths.length) {
        const { error } = await supabase.storage.from('areas').remove(storagePaths)
        if (error) throw error
      }

      const { error } = await supabase
        .from('areas')
        .update({
          foto_principal: remainingUrls[0] || null,
          fotos_urls: remainingUrls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', area.id)
      if (error) throw error
      updatedAreas++
      deletedImages += aiUrls.length
    }

    removeFromCheckpoint(targetIds)
    console.log(`🗑️ Eliminadas ${deletedImages} imágenes IA en ${updatedAreas} áreas`)
    console.log(`🔄 ${targetIds.size} áreas retiradas del checkpoint y listas para regenerar`)
    return
  }

  if (SOLO_PURGA) {
    console.log('Fin (solo purga).')
    return
  }

  const done = loadCheckpoint()
  let pendientes = REGENERATE ? emptiedIds : emptiedIds.filter((id) => !done.has(id))
  if (LIMIT_ONE) pendientes = pendientes.slice(0, 1)
  else if (LIMIT > 0) pendientes = pendientes.slice(0, LIMIT)
  console.log(`\n🎨 Generar IA: ${pendientes.length} pendientes (${done.size} ya hechas)`)

  let ok = 0
  let fail = 0
  if (PREVIEWS_DIR) fs.mkdirSync(path.resolve(PREVIEWS_DIR), { recursive: true })
  for (let i = 0; i < pendientes.length; i++) {
    const id = pendientes[i]
    const area = areas.find((a) => a.id === id)
    if (!area) {
      appendCheckpoint(id)
      continue
    }
    process.stdout.write(`  [${i + 1}/${pendientes.length}] ${area.nombre} ... `)
    try {
      const result = await generateAndStoreAreaImage(supabase as any, area)
      if (!done.has(id)) appendCheckpoint(id)
      if (PREVIEWS_DIR) {
        const response = await fetch(result.publicUrl)
        if (!response.ok) throw new Error(`No se pudo descargar la previsualización (${response.status})`)
        fs.writeFileSync(
          path.join(path.resolve(PREVIEWS_DIR), `${String(i + 1).padStart(2, '0')}-${area.id}.jpg`),
          Buffer.from(await response.arrayBuffer())
        )
      }
      ok++
      console.log('OK')
    } catch (e: any) {
      fail++
      console.log('ERROR', e?.message || e)
    }
  }

  console.log(`\n✅ IA: ${ok} generadas, ${fail} errores`)
}

main().catch((e) => {
  console.error('ERROR FATAL:', e)
  process.exit(1)
})
