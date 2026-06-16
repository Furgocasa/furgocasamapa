import type { Area } from '@/types/database.types'

/**
 * Contenido HTML compartido del popup/InfoWindow que aparece al hacer clic
 * sobre un área en el mapa. Es la ÚNICA fuente de verdad para los 3 proveedores
 * (Google Maps, MapLibre y Leaflet), de modo que el popup sea idéntico en todos.
 *
 * @param area        Datos del área seleccionada.
 * @param getColor    Función que devuelve el color asociado al tipo de área.
 * @param imageMargin Margen negativo (px) que necesita la imagen para sangrar
 *                    hasta los bordes según el padding del contenedor del popup
 *                    (-15 en MapLibre/Leaflet, -20 en Google).
 */
export function buildAreaPopupHTML(
  area: Area,
  getColor: (tipo: string) => string,
  imageMargin: number = -15
): string {
  const tipoLabels: Record<string, string> = {
    publica: 'Pública',
    privada: 'Privada',
    camping: 'Camping',
    parking: 'Parking',
  }

  const serviciosIconos: Record<string, { icon: string; label: string }> = {
    agua: { icon: '💧', label: 'Agua' },
    electricidad: { icon: '⚡', label: 'Luz' },
    vaciado_quimico: { icon: '🚽', label: 'Vaciado WC' },
    vaciado_aguas_negras: { icon: '♻️', label: 'Vaciado' },
    vaciado_aguas_grises: { icon: '🚰', label: 'Aguas grises' },
    wifi: { icon: '📶', label: 'WiFi' },
    duchas: { icon: '🚿', label: 'Duchas' },
    wc: { icon: '🚻', label: 'WC' },
    lavanderia: { icon: '🧺', label: 'Lavandería' },
    restaurante: { icon: '🍽️', label: 'Restaurante' },
    oferta_restauracion: { icon: '🍽️', label: 'Restauración' },
    supermercado: { icon: '🛒', label: 'Súper' },
    zona_mascotas: { icon: '🐾', label: 'Mascotas' },
  }

  const esc = (value: unknown): string =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const color = getColor(area.tipo_area)
  const tipo = tipoLabels[area.tipo_area] || 'Pública'
  const ubicacion = [area.ciudad, area.provincia].filter(Boolean).map((v) => esc(v)).join(', ')
  const mapsUrl =
    area.google_maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${area.latitud},${area.longitud}`

  const serviciosDisponibles =
    area.servicios && typeof area.servicios === 'object'
      ? Object.entries(area.servicios as Record<string, unknown>)
          .filter(([key, value]) => value === true && serviciosIconos[key])
          .map(([key]) => serviciosIconos[key])
      : []
  const mostrarServicios = serviciosDisponibles.slice(0, 6)
  const serviciosRestantes = serviciosDisponibles.length - mostrarServicios.length

  // Chips informativos (precio, plazas, acceso 24h, altura de barrera)
  const chip = (html: string, accent = false): string =>
    `<span style="display:inline-flex;align-items:center;gap:4px;background:${
      accent ? '#FFF7ED' : '#F3F4F6'
    };color:${accent ? '#C2410C' : '#374151'};${
      accent ? 'border:1px solid #FED7AA;' : ''
    }padding:5px 10px;border-radius:8px;font-size:12px;font-weight:600;line-height:1;">${html}</span>`

  const chips: string[] = []
  if (area.google_rating) {
    chips.push(
      `<span style="display:inline-flex;align-items:center;gap:4px;background:#FEF9C3;color:#854D0E;border:1px solid #FDE68A;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:700;line-height:1;">⭐ ${area.google_rating}</span>`
    )
  }
  if (area.precio_noche !== null && area.precio_noche !== undefined) {
    chips.push(
      area.precio_noche === 0
        ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:700;line-height:1;">Gratis</span>`
        : chip(`${area.precio_noche}€<span style="font-weight:500;opacity:0.85;">/noche</span>`, true)
    )
  }
  if (area.plazas_totales) chips.push(chip(`🚐 ${area.plazas_totales} plazas`))
  if (area.acceso_24h) chips.push(chip(`🕒 24h`))
  if (area.barrera_altura) chips.push(chip(`📏 ${area.barrera_altura} m`))

  // El botón de cerrar (×) del mapa va arriba a la derecha: dejamos esa esquina libre.
  const imageBlock = area.foto_principal
    ? `
      <div style="position:relative;margin:${imageMargin}px ${imageMargin}px 0 ${imageMargin}px;height:172px;background:#e5e7eb;">
        <img src="${esc(area.foto_principal)}" alt="${esc(area.nombre)}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none'"/>
        <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.12) 42%, rgba(0,0,0,0) 62%);"></div>
        <span style="position:absolute;bottom:38px;left:14px;background:${color};color:#fff;padding:4px 11px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.3px;box-shadow:0 2px 6px rgba(0,0,0,0.25);">${tipo}</span>
        <h3 style="position:absolute;left:14px;right:14px;bottom:10px;margin:0;color:#fff;font-size:18px;font-weight:800;line-height:1.25;text-shadow:0 1px 4px rgba(0,0,0,0.6);">${esc(area.nombre)}</h3>
      </div>`
    : `
      <div style="margin:2px 4px 4px 4px;">
        <span style="display:inline-block;background:${color};color:#fff;padding:4px 11px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.3px;margin-bottom:6px;">${tipo}</span>
        <h3 style="margin:0;font-size:18px;font-weight:800;color:#111827;line-height:1.25;padding-right:24px;">${esc(area.nombre)}</h3>
      </div>`

  return `
    <div style="width:318px;max-width:88vw;font-family:system-ui,-apple-system,sans-serif;color:#1f2937;">
      ${imageBlock}
      <div style="padding:12px 4px 2px 4px;">
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
            ? `<div style="display:flex;align-items:center;gap:6px;background:#FFF1EC;border:1px solid #FFD9CC;color:#C2410C;padding:8px 10px;border-radius:9px;font-size:12px;font-weight:700;margin-bottom:10px;">🎁 Descuento exclusivo Furgocasa</div>`
            : ''
        }
        ${
          mostrarServicios.length
            ? `<div style="margin-bottom:12px;">
                <p style="margin:0 0 6px 0;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#9CA3AF;">Servicios</p>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  ${mostrarServicios
                    .map(
                      (s) =>
                        `<span style="display:inline-flex;align-items:center;gap:4px;background:#F1F5F9;border:1px solid #E2E8F0;color:#334155;padding:5px 10px;border-radius:7px;font-size:12px;font-weight:600;line-height:1;">${s.icon} ${s.label}</span>`
                    )
                    .join('')}
                  ${
                    serviciosRestantes > 0
                      ? `<span style="display:inline-flex;align-items:center;background:#EFF6FF;color:#0284c7;padding:5px 10px;border-radius:7px;font-size:12px;font-weight:700;line-height:1;">+${serviciosRestantes}</span>`
                      : ''
                  }
                </div>
              </div>`
            : `<p style="margin:0 0 12px 0;font-size:12px;color:#9CA3AF;font-style:italic;">Servicios no especificados</p>`
        }
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px;">
          <a href="/area/${esc(area.slug)}" style="display:flex;align-items:center;justify-content:center;gap:6px;background:#0284c7;color:#fff;padding:11px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13.5px;box-shadow:0 2px 6px rgba(2,132,199,0.35);">
            <svg style="width:16px;height:16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            Ver detalles
          </a>
          <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:center;gap:6px;background:#16a34a;color:#fff;padding:11px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13.5px;box-shadow:0 2px 6px rgba(22,163,74,0.35);">
            <svg style="width:16px;height:16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
            Cómo llegar
          </a>
        </div>
      </div>
    </div>
  `
}
