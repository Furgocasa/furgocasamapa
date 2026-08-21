'use client'

/**
 * Sincroniza los favoritos guardados en localStorage (usuario anónimo)
 * con la cuenta cuando el usuario inicia sesión o vuelve autenticado
 * (p. ej. tras confirmar el email o el OAuth de Google).
 *
 * Montado globalmente en app/layout.tsx. No renderiza nada salvo el toast
 * de confirmación cuando sincroniza algo.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getLocalFavorites, syncLocalFavoritesToAccount } from '@/lib/favoritos/local'

export default function FavoritosSync() {
  const [syncedCount, setSyncedCount] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const trySync = async (userId: string) => {
      if (getLocalFavorites().length === 0) return
      const n = await syncLocalFavoritesToAccount(supabase, userId)
      if (!cancelled && n > 0) {
        setSyncedCount(n)
        setTimeout(() => setSyncedCount(null), 6000)
      }
    }

    // Caso 1: ya hay sesión al cargar la página (vuelta de OAuth/confirmación)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) trySync(user.id)
    })

    // Caso 2: login durante la sesión de navegación (AuthModal, /auth/login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          trySync(session.user.id)
        }
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  if (syncedCount === null) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-green-50 border border-green-200 text-green-800 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
      ❤️ {syncedCount === 1
        ? 'Tu área guardada ya está en tu cuenta'
        : `Tus ${syncedCount} áreas guardadas ya están en tu cuenta`}
    </div>
  )
}
