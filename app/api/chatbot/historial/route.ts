/**
 * API ROUTE: HISTORIAL DEL CHATBOT
 * ================================
 * Devuelve la última conversación del usuario AUTENTICADO (identificado por
 * su cookie de sesión, nunca por parámetros) con sus últimos mensajes, para
 * que el widget restaure la conversación al recargar la página.
 *
 * Anónimos: devuelve vacío (su conversación vive en localStorage).
 */

import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Identificar al usuario por su sesión (cookies) — seguro
    const supabaseAuth = await createServerClient()
    const { data: { user } } = await (supabaseAuth as any).auth.getUser()

    if (!user) {
      return NextResponse.json({ conversacionId: null, messages: [] })
    }

    // 2. Leer con service role (las tablas del chatbot no tienen select público)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ conversacionId: null, messages: [] })
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Última conversación del usuario
    const { data: conversacion } = await supabase
      .from('chatbot_conversaciones')
      .select('id')
      .eq('user_id', user.id)
      .order('ultimo_mensaje_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    if (!conversacion) {
      return NextResponse.json({ conversacionId: null, messages: [] })
    }

    // Últimos 30 mensajes en orden cronológico
    const { data: mensajes } = await supabase
      .from('chatbot_mensajes')
      .select('rol, contenido, created_at')
      .eq('conversacion_id', conversacion.id)
      .order('created_at', { ascending: false })
      .limit(30)

    const messages = (mensajes || [])
      .reverse()
      .filter((m: any) => m.rol === 'user' || m.rol === 'assistant')
      .map((m: any) => ({ rol: m.rol, contenido: m.contenido }))

    return NextResponse.json({ conversacionId: conversacion.id, messages })
  } catch (e: any) {
    console.error('Error recuperando historial del chatbot:', e?.message)
    return NextResponse.json({ conversacionId: null, messages: [] })
  }
}
