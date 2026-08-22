/** Servicios que el viajero puede confirmar o corregir en la ficha. */
export const SERVICIO_IDS = [
  'agua',
  'electricidad',
  'vaciado_aguas_negras',
  'vaciado_aguas_grises',
  'wifi',
  'duchas',
  'wc',
  'lavanderia',
  'restaurante',
  'supermercado',
  'zona_mascotas',
] as const

export type ServicioId = (typeof SERVICIO_IDS)[number]
export type ServiciosMap = Record<string, boolean | null | undefined>

function asNum(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function servicioMarcado(servicios: ServiciosMap | null | undefined, id: string): boolean {
  return servicios?.[id] === true
}

/** Solo las claves true del viajero. */
export function serviciosPropuestos(servicios: ServiciosMap | null | undefined): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const id of SERVICIO_IDS) {
    if (servicioMarcado(servicios, id)) out[id] = true
  }
  return out
}

export type DiffServicio = {
  id: ServicioId
  accion: 'anade' | 'quita'
}

export type DiffContribucion = {
  esCorreccion: boolean
  servicios: DiffServicio[]
  precio: { de: number | null; a: number | null } | null
  plazas: { de: number | null; a: number | null } | null
}

export function diffContribucion(
  actual: {
    servicios?: ServiciosMap | null
    precio_noche?: number | null
    plazas_totales?: number | null
  },
  propuesta: {
    servicios?: ServiciosMap | null
    precio_noche?: number | null
    plazas_totales?: number | null
  }
): DiffContribucion {
  const servicios: DiffServicio[] = []
  for (const id of SERVICIO_IDS) {
    const era = servicioMarcado(actual.servicios, id)
    const queda = servicioMarcado(propuesta.servicios, id)
    if (era !== queda) {
      servicios.push({ id, accion: queda ? 'anade' : 'quita' })
    }
  }

  const precioActual = asNum(actual.precio_noche)
  const precioNuevo = asNum(propuesta.precio_noche)
  const precio =
    precioNuevo !== null && precioNuevo !== precioActual
      ? { de: precioActual, a: precioNuevo }
      : null

  const plazasActual = asNum(actual.plazas_totales)
  const plazasNuevas = asNum(propuesta.plazas_totales)
  const plazas =
    plazasNuevas !== null && plazasNuevas !== plazasActual
      ? { de: plazasActual, a: plazasNuevas }
      : null

  return {
    esCorreccion: servicios.length > 0 || precio !== null || plazas !== null,
    servicios,
    precio,
    plazas,
  }
}

/**
 * Aplica el mapa de servicios del viajero sobre el actual.
 * - Marcado true → true
 * - Estaba true y el viajero no lo marca → false (dice que ya no está)
 * - El resto se deja como estaba (null / ausente)
 */
export function mergeServicios(
  actual: ServiciosMap | null | undefined,
  propuesto: ServiciosMap | null | undefined
): Record<string, boolean | null> {
  const base: Record<string, boolean | null> = {}
  const src = actual && typeof actual === 'object' ? actual : {}
  for (const [k, v] of Object.entries(src)) {
    if (v === true || v === false || v === null) base[k] = v
  }
  for (const id of SERVICIO_IDS) {
    const queda = servicioMarcado(propuesto, id)
    const era = servicioMarcado(actual, id)
    if (queda) base[id] = true
    else if (era) base[id] = false
  }
  return base
}
