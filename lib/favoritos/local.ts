/**
 * Favoritos locales (sin cuenta) + sincronización al iniciar sesión.
 *
 * - Un usuario anónimo puede guardar áreas en localStorage ("Mis sitios").
 * - Al iniciar sesión / registrarse, los favoritos locales se vuelcan a la
 *   tabla `favoritos` y se limpia el almacenamiento local.
 * - También gestiona una "acción pendiente" (p. ej. valorar un área) para
 *   retomarla tras el login.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const LOCAL_FAVS_KEY = 'mf_favoritos_local'
const PENDING_ACTION_KEY = 'mf_accion_pendiente'

export interface PendingAction {
  type: 'estuve_aqui' | 'guardar_ruta'
  areaId?: string
  path?: string
  createdAt: number
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function getLocalFavorites(): string[] {
  if (typeof window === 'undefined') return []
  const ids = safeParse<string[]>(localStorage.getItem(LOCAL_FAVS_KEY), [])
  return Array.isArray(ids) ? ids : []
}

export function hasLocalFavorite(areaId: string): boolean {
  return getLocalFavorites().includes(areaId)
}

export function addLocalFavorite(areaId: string): number {
  if (typeof window === 'undefined') return 0
  const ids = getLocalFavorites()
  if (!ids.includes(areaId)) ids.push(areaId)
  try {
    localStorage.setItem(LOCAL_FAVS_KEY, JSON.stringify(ids))
  } catch {
    /* modo privado / sin espacio */
  }
  return ids.length
}

export function removeLocalFavorite(areaId: string): number {
  if (typeof window === 'undefined') return 0
  const ids = getLocalFavorites().filter((id) => id !== areaId)
  try {
    localStorage.setItem(LOCAL_FAVS_KEY, JSON.stringify(ids))
  } catch {
    /* noop */
  }
  return ids.length
}

export function clearLocalFavorites(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LOCAL_FAVS_KEY)
  } catch {
    /* noop */
  }
}

/**
 * Vuelca los favoritos locales a la cuenta del usuario.
 * Ignora duplicados (si el área ya era favorita en la cuenta).
 * Devuelve cuántos se han sincronizado.
 */
export async function syncLocalFavoritesToAccount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const ids = getLocalFavorites()
  if (ids.length === 0) return 0

  let synced = 0
  for (const areaId of ids) {
    const { error } = await (supabase as any)
      .from('favoritos')
      .insert({ user_id: userId, area_id: areaId })
    // 23505 = ya existía; cualquier otro error lo ignoramos para no bloquear
    if (!error) synced++
    else if (error.code === '23505') synced++
  }

  clearLocalFavorites()
  return synced
}

// ---------------------------------------------------------------------------
// Acción pendiente (retomar tras login)
// ---------------------------------------------------------------------------

export function setPendingAction(action: Omit<PendingAction, 'createdAt'>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      PENDING_ACTION_KEY,
      JSON.stringify({ ...action, createdAt: Date.now() })
    )
  } catch {
    /* noop */
  }
}

/** Lee y consume la acción pendiente (si no ha caducado: 30 min). */
export function consumePendingAction(): PendingAction | null {
  if (typeof window === 'undefined') return null
  const action = safeParse<PendingAction | null>(
    localStorage.getItem(PENDING_ACTION_KEY),
    null
  )
  try {
    localStorage.removeItem(PENDING_ACTION_KEY)
  } catch {
    /* noop */
  }
  if (!action) return null
  if (Date.now() - action.createdAt > 30 * 60 * 1000) return null
  return action
}
