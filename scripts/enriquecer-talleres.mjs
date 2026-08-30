/**
 * Cola de enriquecido de talleres (molde áreas).
 * El import ya dejó una descripción única (nombre + sitio + nota Google).
 * Este script solo informa huecos; el texto IA largo se hace luego como áreas.
 *
 * Uso: node scripts/enriquecer-talleres.mjs
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)

const { data, error } = await sb.from('talleres').select('id, descripcion, foto_principal, activo')
if (error) {
  console.error(error)
  process.exit(1)
}
const rows = data || []
const vacias = rows.filter((r) => !r.descripcion || r.descripcion.length < 40)
const sinFoto = rows.filter((r) => !r.foto_principal)
const activas = rows.filter((r) => r.activo)
console.log(JSON.stringify({
  total: rows.length,
  activas: activas.length,
  descripcionCorta: vacias.length,
  sinFoto: sinFoto.length,
  nota: 'Descripción inicial ya escrita en el import. Foto = misma cola que áreas (web oficial, no Google).',
}, null, 2))
