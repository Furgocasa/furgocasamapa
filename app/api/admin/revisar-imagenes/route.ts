import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  altoUrlsOf,
  flagImages,
  removeUrlsFromArea,
  uniqueUrlsOf,
  type AreaImagenMin,
} from '@/lib/areas/image-copyright'
import { generateAndStoreAreaImage } from '@/lib/areas/generate-area-image'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user || !session.user.user_metadata?.is_admin) {
    return null
  }
  return session.user
}

async function fetchAllAreas(service: ReturnType<typeof createServiceClient>): Promise<AreaImagenMin[]> {
  const all: AreaImagenMin[] = []
  const pageSize = 1000
  let page = 0
  while (true) {
    const { data, error } = await (service as any)
      .from('areas')
      .select('id,nombre,slug,ciudad,provincia,pais,tipo_area,foto_principal,fotos_urls')
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

export async function GET() {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const service = createServiceClient()
    const areas = await fetchAllAreas(service)
    const flagged = flagImages(areas)
    const alto = flagged.filter((f) => f.riesgo === 'ALTO')
    const medio = flagged.filter((f) => f.riesgo === 'MEDIO')
    const sinFoto = areas.filter((a) => uniqueUrlsOf(a).length === 0).length
    const porClase: Record<string, number> = {}
    for (const f of alto) {
      porClase[f.clasificacion] = (porClase[f.clasificacion] || 0) + 1
    }

    return NextResponse.json({
      totalAreas: areas.length,
      conFoto: areas.length - sinFoto,
      sinFoto,
      flaggedAlto: alto.length,
      flaggedMedio: medio.length,
      porClase,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error listando imágenes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const action = body?.action as string
    const service = createServiceClient()

    if (action === 'delete') {
      const removals = (body.removals || []) as Array<{ areaId: string; url: string }>
      if (!removals.length) {
        return NextResponse.json({ error: 'No hay imágenes que borrar' }, { status: 400 })
      }

      const byArea = new Map<string, Set<string>>()
      for (const item of removals) {
        if (!item.areaId || !item.url) continue
        if (!byArea.has(item.areaId)) byArea.set(item.areaId, new Set())
        byArea.get(item.areaId)!.add(item.url)
      }

      let areasUpdated = 0
      let imagesRemoved = 0
      let leftEmpty = 0

      for (const [areaId, urls] of byArea.entries()) {
        const { data: area, error } = await (service as any)
          .from('areas')
          .select('id,foto_principal,fotos_urls')
          .eq('id', areaId)
          .single()
        if (error || !area) continue
        const next = removeUrlsFromArea(area, urls)
        const { error: updateError } = await (service as any)
          .from('areas')
          .update({
            foto_principal: next.foto_principal,
            fotos_urls: next.fotos_urls,
            updated_at: new Date().toISOString(),
          })
          .eq('id', areaId)
        if (updateError) throw updateError
        areasUpdated++
        imagesRemoved += next.removed
        if (!next.foto_principal) leftEmpty++
      }

      return NextResponse.json({ success: true, areasUpdated, imagesRemoved, leftEmpty })
    }

    if (action === 'purge_alto') {
      const areas = await fetchAllAreas(service)
      const alto = altoUrlsOf(areas)
      let areasUpdated = 0
      let imagesRemoved = 0
      const emptiedIds: string[] = []

      for (const area of areas) {
        const next = removeUrlsFromArea(area, alto)
        if (next.removed === 0) continue
        const { error: updateError } = await (service as any)
          .from('areas')
          .update({
            foto_principal: next.foto_principal,
            fotos_urls: next.fotos_urls,
            updated_at: new Date().toISOString(),
          })
          .eq('id', area.id)
        if (updateError) throw updateError
        areasUpdated++
        imagesRemoved += next.removed
        if (!next.foto_principal) emptiedIds.push(area.id)
      }

      return NextResponse.json({
        success: true,
        areasUpdated,
        imagesRemoved,
        leftEmpty: emptiedIds.length,
        emptiedIds,
      })
    }

    if (action === 'generate') {
      const areaId = body.areaId as string
      if (!areaId) {
        return NextResponse.json({ error: 'areaId es requerido' }, { status: 400 })
      }
      const { data: area, error } = await (service as any)
        .from('areas')
        .select('id,nombre,slug,ciudad,provincia,pais,tipo_area,foto_principal,fotos_urls')
        .eq('id', areaId)
        .single()
      if (error || !area) {
        return NextResponse.json({ error: 'Área no encontrada' }, { status: 404 })
      }

      const result = await generateAndStoreAreaImage(service as any, area)
      return NextResponse.json({ success: true, ...result })
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  } catch (error: any) {
    console.error('[revisar-imagenes]', error)
    return NextResponse.json({ error: error.message || 'Error procesando imágenes' }, { status: 500 })
  }
}
