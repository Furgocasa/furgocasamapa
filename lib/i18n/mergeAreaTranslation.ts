import type { Area, AreaTraduccion } from '@/types/database.types'
import type { Locale } from './config'
import { isTranslationLocale } from './config'

/** Sobrescribe campos de texto del área con la traducción (fallback al español). */
export function mergeAreaTranslation<T extends Partial<Area>>(
  area: T,
  trad: Pick<
    AreaTraduccion,
    'nombre' | 'descripcion' | 'direccion' | 'ciudad' | 'provincia' | 'comunidad' | 'pais'
  > | null | undefined,
  locale: Locale
): T {
  if (!trad || !isTranslationLocale(locale)) return area
  return {
    ...area,
    nombre: trad.nombre || area.nombre,
    descripcion: trad.descripcion || area.descripcion,
    direccion: trad.direccion || area.direccion,
    ciudad: trad.ciudad || area.ciudad,
    provincia: trad.provincia || area.provincia,
    comunidad: trad.comunidad || area.comunidad,
    pais: trad.pais || area.pais,
  }
}
