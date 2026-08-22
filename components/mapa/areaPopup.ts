import type { Area } from '@/types/database.types'
import type { Locale } from '@/lib/i18n/config'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { getServicioLabel, getTipoAreaLabel, SERVICIO_ICONS } from '@/lib/i18n/labels'
import { t } from '@/lib/i18n/ui'
import { getTipoAreaIconSvg } from '@/lib/areas/tipo-area'
import { createClient } from '@/lib/supabase/client'
import {
  hasLocalFavorite,
  addLocalFavorite,
  removeLocalFavorite,
  setPendingAction,
} from '@/lib/favoritos/local'
import { track } from '@/lib/analytics/track'

const INVALID_COVER = /PhotoService\.GetPhoto|maps\.googleapis\.com\/maps\/api\/place\/js/i

function isUsableCoverUrl(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith('http') && !INVALID_COVER.test(url)
}

/** Portada del área: foto_principal, o la primera de fotos_urls si hace falta. */
export function getAreaCoverUrl(area: Pick<Area, 'foto_principal'> & { fotos_urls?: Area['fotos_urls'] | string | null }): string | null {
  if (isUsableCoverUrl(area.foto_principal)) return area.foto_principal

  const extras = area.fotos_urls
  if (Array.isArray(extras)) {
    const found = extras.find(isUsableCoverUrl)
    if (found) return found
  } else if (typeof extras === 'string') {
    const found = extras.split(',').map((s) => s.trim()).find(isUsableCoverUrl)
    if (found) return found
  }

  return null
}

// ---------------------------------------------------------------------------
// Acciones del popup (Favorito / Estuve aquí)
// El contenido del popup es HTML plano, así que las acciones van por
// delegación de eventos a nivel de documento (fase de captura, para que
// Leaflet/MapLibre no se traguen el clic antes de que llegue aquí).
// ---------------------------------------------------------------------------

function paintFavButtons(areaId: string, isFav: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-popup-action="fav"][data-area-id="${areaId}"]`)
    .forEach((btn) => {
      btn.setAttribute('data-fav', isFav ? '1' : '0')
      btn.style.background = isFav ? '#FDF2F8' : '#fff'
      btn.style.borderColor = isFav ? '#F9A8D4' : '#D1D5DB'
      btn.style.color = isFav ? '#BE185D' : '#374151'
      const svg = btn.querySelector('svg')
      if (svg) svg.setAttribute('fill', isFav ? '#EC4899' : 'none')
      const label = btn.querySelector('[data-fav-label]')
      if (label) {
        label.textContent = isFav
          ? btn.getAttribute('data-label-on') || ''
          : btn.getAttribute('data-label-off') || ''
      }
    })
}

async function toggleFavorite(btn: HTMLElement, areaId: string): Promise<void> {
  const wasFav = btn.getAttribute('data-fav') === '1'
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      if (wasFav) {
        const { error } = await (supabase as any)
          .from('favoritos')
          .delete()
          .eq('user_id', session.user.id)
          .eq('area_id', areaId)
        if (error) throw error
        track('area_unfavorite', { area_id: areaId })
      } else {
        const { error } = await (supabase as any)
          .from('favoritos')
          .insert({ user_id: session.user.id, area_id: areaId })
        if (error && error.code !== '23505') throw error
        track('area_favorite', { area_id: areaId })
      }
    } else if (wasFav) {
      removeLocalFavorite(areaId)
      track('area_unfavorite', { area_id: areaId, event_data: { modo: 'local' } })
    } else {
      addLocalFavorite(areaId)
      track('area_favorite', { area_id: areaId, event_data: { modo: 'local' } })
    }

    paintFavButtons(areaId, !wasFav)
  } catch (error) {
    console.error('Error al actualizar favorito desde el popup:', error)
  }
}

let popupActionsBound = false

function ensureAreaPopupActions(): void {
  if (typeof window === 'undefined' || popupActionsBound) return
  popupActionsBound = true

  document.addEventListener(
    'click',
    (event) => {
      const target = (event.target as HTMLElement | null)?.closest?.(
        '[data-popup-action]'
      ) as HTMLElement | null
      if (!target) return

      event.preventDefault()
      event.stopPropagation()

      const action = target.getAttribute('data-popup-action')
      const areaId = target.getAttribute('data-area-id') || ''
      if (!areaId) return

      if (action === 'visit') {
        // Mismo flujo que "Estuve aquí" en la ficha: se guarda la intención
        // y al llegar (o tras login) se abre el modal de visita+valoración.
        setPendingAction({ type: 'estuve_aqui', areaId })
        const slug = target.getAttribute('data-area-slug') || ''
        window.location.href = `/area/${slug}#valoraciones`
        return
      }

      if (action === 'fav') {
        void toggleFavorite(target, areaId)
      }
    },
    true
  )
}

/** Corrige el estado inicial del corazón para usuarios con cuenta (async). */
function hydrateFavState(areaId: string): void {
  if (typeof window === 'undefined') return
  window.setTimeout(async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { data } = await (supabase as any)
        .from('favoritos')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('area_id', areaId)
        .maybeSingle()
      if (data) paintFavButtons(areaId, true)
    } catch {
      /* sin red o sin sesión: se queda el estado local */
    }
  }, 150)
}

/**
 * Contenido HTML compartido del popup/InfoWindow que aparece al hacer clic
 * sobre un área en el mapa. Es la ÚNICA fuente de verdad para los 3 proveedores
 * (Google Maps, MapLibre y Leaflet), de modo que el popup sea idéntico en todos.
 */
export function buildAreaPopupHTML(
  area: Area,
  getColor: (tipo: string) => string,
  imageMargin: number = 0,
  locale: Locale = DEFAULT_LOCALE
): string {
  ensureAreaPopupActions()

  const esc = (value: unknown): string =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const color = getColor(area.tipo_area)
  const tipo = getTipoAreaLabel(area.tipo_area, locale)
  const ubicacion = [area.ciudad, area.provincia].filter(Boolean).map((v) => esc(v)).join(', ')
  const mapsUrl =
    area.google_maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${area.latitud},${area.longitud}`

  const serviciosDisponibles =
    area.servicios && typeof area.servicios === 'object'
      ? Object.entries(area.servicios as Record<string, unknown>)
          .filter(([key, value]) => value === true && (SERVICIO_ICONS[key] || getServicioLabel(key, locale)))
          .map(([key]) => ({
            icon: SERVICIO_ICONS[key] || '✓',
            label: getServicioLabel(key, locale),
          }))
      : []
  const mostrarServicios = serviciosDisponibles.slice(0, 6)
  const serviciosRestantes = serviciosDisponibles.length - mostrarServicios.length

  const chip = (html: string, accent = false): string =>
    `<span style="display:inline-flex;align-items:center;gap:4px;background:${
      accent ? '#FFF4EE' : '#F3F4F6'
    };color:${accent ? '#C44317' : '#374151'};${
      accent ? 'border:1px solid #FFC9AD;' : ''
    }padding:5px 10px;border-radius:999px;font-size:12px;font-weight:600;line-height:1;">${html}</span>`

  const reviewsTotal = area.google_ratings_total ?? 0
  const ratingLine = area.google_rating
    ? `<div style="display:flex;align-items:center;gap:8px;">
        <span style="display:inline-flex;align-items:center;gap:4px;">
          <span style="color:#facc15;font-size:15px;line-height:1;">★</span>
          <span style="font-weight:700;font-size:14px;color:#111827;">${esc(area.google_rating)}</span>
        </span>
        ${
          reviewsTotal > 0
            ? `<span style="font-size:12px;font-weight:400;color:#6b7280;">${esc(
                reviewsTotal.toLocaleString(locale)
              )} ${esc(t(locale, 'reviews'))}</span>`
            : ''
        }
      </div>`
    : ''

  // Píldora de tipo (como la card de la lista) + resto de chips
  const chips: string[] = [
    `<span style="display:inline-flex;align-items:center;background:${color}20;color:${color};padding:5px 10px;border-radius:999px;font-size:12px;font-weight:600;line-height:1;">${esc(tipo)}</span>`,
  ]
  if (area.precio_noche !== null && area.precio_noche !== undefined) {
    chips.push(
      area.precio_noche === 0
        ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;padding:5px 10px;border-radius:999px;font-size:12px;font-weight:700;line-height:1;">${esc(t(locale, 'free'))}</span>`
        : chip(`${area.precio_noche}€<span style="font-weight:500;opacity:0.85;">${esc(t(locale, 'per_night'))}</span>`, true)
    )
  }
  if (area.plazas_totales) chips.push(chip(`🚐 ${area.plazas_totales} ${esc(t(locale, 'spots'))}`))
  if (area.acceso_24h) chips.push(chip(`🕒 24h`))
  if (area.barrera_altura) chips.push(chip(`📏 ${area.barrera_altura} m`))

  const coverUrl = getAreaCoverUrl(area)
  const imageBlock = coverUrl
    ? `
      <div style="position:relative;margin:${imageMargin}px ${imageMargin}px 0 ${imageMargin}px;height:136px;background:#e5e7eb;overflow:hidden;">
        <img src="${esc(coverUrl)}" alt="${esc(area.nombre)}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.style.display='none';"/>
      </div>`
    : ''

  // Icono redondo del tipo (misma leyenda que los pines y la lista)
  const tipoIcon = `<span style="width:34px;height:34px;border-radius:999px;background:${color};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,0.18);">${getTipoAreaIconSvg(area.tipo_area, 18)}</span>`

  const isFavInicial = typeof window !== 'undefined' && hasLocalFavorite(area.id)
  const favLabelOff = t(locale, 'favorite')
  const favLabelOn = t(locale, 'favorite_saved')

  const btnOutline =
    'display:flex;align-items:center;justify-content:center;gap:6px;background:#fff;border:1px solid #D1D5DB;color:#374151;padding:10px;border-radius:12px;text-decoration:none;font-weight:600;font-size:13px;line-height:1;cursor:pointer;font-family:inherit;'

  const favButton = `<button type="button" data-popup-action="fav" data-area-id="${esc(area.id)}" data-fav="${isFavInicial ? '1' : '0'}" data-label-on="${esc(favLabelOn)}" data-label-off="${esc(favLabelOff)}" style="${btnOutline}${
    isFavInicial ? 'background:#FDF2F8;border-color:#F9A8D4;color:#BE185D;' : ''
  }">
      <svg style="width:15px;height:15px;flex-shrink:0;" fill="${isFavInicial ? '#EC4899' : 'none'}" stroke="#EC4899" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
      <span data-fav-label>${esc(isFavInicial ? favLabelOn : favLabelOff)}</span>
    </button>`

  const visitButton = `<button type="button" data-popup-action="visit" data-area-id="${esc(area.id)}" data-area-slug="${esc(area.slug)}" style="${btnOutline}">
      <svg style="width:15px;height:15px;flex-shrink:0;" fill="none" stroke="#16a34a" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      <span>${esc(t(locale, 'been_here'))}</span>
    </button>`

  if (typeof window !== 'undefined') hydrateFavState(area.id)

  return `
    <div style="width:318px;max-width:88vw;font-family:inherit;color:#1f2937;">
      ${imageBlock}
      <div style="padding:12px 14px 14px 14px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px;">
          <div style="flex:1;min-width:0;">
            <h3 style="margin:0 0 4px 0;font-size:16px;font-weight:600;color:#111827;line-height:1.3;${coverUrl ? '' : 'padding-right:24px;'}">${esc(area.nombre)}</h3>
            ${ratingLine}
          </div>
          ${tipoIcon}
        </div>
        ${
          ubicacion
            ? `<div style="display:flex;align-items:center;gap:5px;color:#6B7280;font-size:13px;margin-bottom:10px;">
                <svg style="width:14px;height:14px;flex-shrink:0;color:#9CA3AF;" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>
                <span>${ubicacion}</span>
              </div>`
            : ''
        }
        ${
          chips.length
            ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">${chips.join('')}</div>`
            : ''
        }
        ${
          area.con_descuento_furgocasa
            ? `<div style="display:flex;align-items:center;gap:6px;background:#FFF4EE;border:1px solid #FFC9AD;color:#C44317;padding:8px 10px;border-radius:12px;font-size:12px;font-weight:700;margin-bottom:10px;">🎁 ${esc(t(locale, 'discount_exclusive'))}</div>`
            : ''
        }
        ${
          mostrarServicios.length
            ? `<div style="margin-bottom:12px;">
                <p style="margin:0 0 6px 0;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#9CA3AF;">${esc(t(locale, 'services'))}</p>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  ${mostrarServicios
                    .map(
                      (s) =>
                        `<span style="display:inline-flex;align-items:center;gap:4px;background:#F1F5F9;border:1px solid #E2E8F0;color:#334155;padding:5px 10px;border-radius:999px;font-size:12px;font-weight:600;line-height:1;">${s.icon} ${esc(s.label)}</span>`
                    )
                    .join('')}
                  ${
                    serviciosRestantes > 0
                      ? `<span style="display:inline-flex;align-items:center;background:#EEF4FB;color:#0b3c74;padding:5px 10px;border-radius:999px;font-size:12px;font-weight:700;line-height:1;">+${serviciosRestantes}</span>`
                      : ''
                  }
                </div>
              </div>`
            : `<p style="margin:0 0 12px 0;font-size:12px;color:#9CA3AF;font-style:italic;">${esc(t(locale, 'services_none'))}</p>`
        }
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <a href="/area/${esc(area.slug)}" style="display:flex;align-items:center;justify-content:center;gap:6px;background:#0b3c74;color:#fff;padding:10px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;line-height:1;box-shadow:0 2px 6px rgba(11,60,116,0.35);">
            ${esc(t(locale, 'view_details'))}
          </a>
          <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="${btnOutline}">
            <svg style="width:15px;height:15px;flex-shrink:0;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
            ${esc(t(locale, 'how_to_get'))}
          </a>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${favButton}
          ${visitButton}
        </div>
      </div>
    </div>
  `
}

/**
 * Offset de cámara (px desde el centro del mapa) al enfocar un área.
 * Y negativo = el marcador queda por encima del centro, con hueco para la card debajo.
 */
export function getAreaFocusCameraOffset(
  containerHeight: number,
  containerWidth = 1024
): [number, number] {
  if (!containerHeight || containerHeight < 120) return [0, -90]

  const isNarrow = containerWidth < 768
  const topSafe = isNarrow ? 104 : 86
  const cardSpace = isNarrow
    ? Math.round(Math.min(430, containerHeight * 0.7))
    : 450
  const preferredY = isNarrow ? topSafe : Math.round(containerHeight * 0.3)
  const markerY = Math.max(topSafe, Math.min(preferredY, containerHeight - cardSpace))

  return [0, Math.round(markerY - containerHeight / 2)]
}
