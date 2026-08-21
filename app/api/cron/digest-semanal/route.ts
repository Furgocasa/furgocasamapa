import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Digest semanal: email a los usuarios que tienen sitios guardados.
 *
 * "Tus 5 sitios · ¿Has estado ya en alguno?" — solo a quien ya tiene
 * mochila (≥1 favorito). A quien solo miró, no se le escribe.
 *
 * Ejecutado por Vercel Cron (viernes 9:00 UTC, ver vercel.json).
 * Requiere:
 *   - RESEND_API_KEY   (si falta, el endpoint no hace nada y lo indica)
 *   - EMAIL_FROM       (opcional, por defecto hola@mapafurgocasa.com)
 *   - CRON_SECRET      (Vercel lo envía como Authorization: Bearer ...)
 */
export async function GET(request: Request) {
  // Autorización del cron
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({
      skipped: true,
      reason: 'RESEND_API_KEY no configurada: no se envían emails',
    })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // 1. Favoritos con sus áreas, agrupados por usuario
  const { data: favoritos, error } = await (supabase as any)
    .from('favoritos')
    .select('user_id, created_at, areas ( nombre, slug, ciudad, pais )')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const porUsuario = new Map<string, any[]>()
  for (const fav of favoritos || []) {
    if (!fav.user_id || !fav.areas) continue
    if (!porUsuario.has(fav.user_id)) porUsuario.set(fav.user_id, [])
    porUsuario.get(fav.user_id)!.push(fav.areas)
  }

  const from = process.env.EMAIL_FROM || 'Mapa Furgocasa <hola@mapafurgocasa.com>'
  const resultados = { enviados: 0, errores: 0, sin_email: 0 }

  for (const [userId, areas] of porUsuario) {
    // 2. Email del usuario (auth admin)
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId)
    const email = userData?.user?.email
    if (userError || !email) {
      resultados.sin_email++
      continue
    }

    const lista = areas
      .slice(0, 8)
      .map(
        (a: any) =>
          `<li style="margin-bottom:8px;"><a href="https://www.mapafurgocasa.com/area/${a.slug}" style="color:#0b3c74;font-weight:600;text-decoration:none;">${a.nombre}</a> <span style="color:#64748b;font-size:13px;">— ${a.ciudad}, ${a.pais}</span></li>`
      )
      .join('')

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#0b3c74;">Tus sitios guardados en Mapa Furgocasa</h2>
        <p style="color:#334155;line-height:1.6;">
          Tienes <strong>${areas.length}</strong> ${areas.length === 1 ? 'área guardada' : 'áreas guardadas'} para tu próximo viaje:
        </p>
        <ul style="color:#334155;line-height:1.6;padding-left:20px;">${lista}</ul>
        <p style="color:#334155;line-height:1.6;">
          ¿Has estado ya en alguna? Entra en la ficha y pulsa
          <strong>“Estuve aquí”</strong>: tu valoración ayuda a miles de autocaravanistas.
        </p>
        <a href="https://www.mapafurgocasa.com/mapa"
           style="display:inline-block;background:#0b3c74;color:#ffffff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:8px;">
          Abrir el mapa
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:32px;">
          Recibes este email porque tienes áreas guardadas en
          <a href="https://www.mapafurgocasa.com" style="color:#94a3b8;">mapafurgocasa.com</a>.
        </p>
      </div>`

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: `❤️ Tus ${areas.length === 1 ? 'sitio guardado' : `${areas.length} sitios guardados`} · ¿Has estado ya en alguno?`,
          html,
        }),
      })
      if (res.ok) resultados.enviados++
      else resultados.errores++
    } catch {
      resultados.errores++
    }
  }

  return NextResponse.json({ ok: true, usuarios_con_favoritos: porUsuario.size, ...resultados })
}
