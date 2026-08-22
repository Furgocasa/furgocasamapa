/**
 * URL pública de un área: /area/{slug}
 *
 * Formato: nombre + ciudad (si no va ya en el nombre).
 * Si choca, -2, -3… Nunca país ni trozo de Place ID de Google.
 */

const IMPORT_COUNTRY_SUFFIX_RE =
  /-(es|pt|fr|de|it|nl|be|lu|ch|at|dk|se|no|uk|gb|mx|cl|ar|uy|ec|cr|co|pa|si|ad|pr)-[A-Za-z0-9_-]{6,14}$/

export function slugify(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function cleanLocality(value?: string | null): string {
  if (!value) return ''
  return slugify(value.replace(/^\d{4,6}\s+/, '').trim())
}

export function baseAreaSlug(
  nombre: string,
  ciudad?: string | null,
  provincia?: string | null
): string {
  const name = slugify(nombre)
  if (!name) return 'area'
  const city = cleanLocality(ciudad)
  if (city && !name.includes(city)) return `${name}-${city}`
  if (!city) {
    const province = cleanLocality(provincia)
    if (province && !name.includes(province)) return `${name}-${province}`
  }
  return name
}

export function uniqueAreaSlug(base: string, taken: Set<string>): string {
  const root = base || 'area'
  if (!taken.has(root)) return root
  let n = 2
  while (taken.has(`${root}-${n}`)) n += 1
  return `${root}-${n}`
}

export function isImportedUglySlug(slug: string): boolean {
  if (!slug) return false
  if (/[A-Z]/.test(slug)) return true
  if (!IMPORT_COUNTRY_SUFFIX_RE.test(slug)) return false
  const tail = slug.split('-').pop() || ''
  return /[0-9_]/.test(tail)
}
