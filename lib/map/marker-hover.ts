/** Ratón/trackpad con hover fino (PC). En móvil táctil no aplica. */
let cachedFinePointer: boolean | null = null

export function hasFinePointer(): boolean {
  if (typeof window === 'undefined') return false
  if (cachedFinePointer === null) {
    cachedFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  }
  return cachedFinePointer
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatRating(rating?: number | null): string | null {
  const n = Number(rating)
  if (!Number.isFinite(n) || n <= 0) return null
  return n.toFixed(1)
}

function formatReviews(total?: number | null): string | null {
  const n = Number(total)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n).toLocaleString('es-ES')
}

export function buildMarkerTooltipHTML(
  nombre: string,
  rating?: number | null,
  ratingsTotal?: number | null
): string {
  const ratingLabel = formatRating(rating)
  const reviewsLabel = formatReviews(ratingsTotal)
  const ratingHtml = ratingLabel
    ? `<span class="map-marker-hover-tooltip-rating"><span class="map-marker-hover-tooltip-star">★</span>${ratingLabel}${
        reviewsLabel ? `<span class="map-marker-hover-tooltip-reviews">(${reviewsLabel})</span>` : ''
      }</span>`
    : ''

  return `<div class="map-marker-hover-tooltip"><span class="map-marker-hover-tooltip-name">${escapeHtml(nombre)}</span>${ratingHtml}</div>`
}

export const MARKER_TOOLTIP_CSS = `
  .map-marker-hover-tooltip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    color: #111827;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
    white-space: nowrap;
    max-width: 340px;
    pointer-events: none;
  }
  .map-marker-hover-tooltip-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .map-marker-hover-tooltip-rating {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 700;
    color: #b45309;
  }
  .map-marker-hover-tooltip-star {
    color: #f59e0b;
    font-size: 12px;
    line-height: 1;
  }
  .map-marker-hover-tooltip-reviews {
    font-weight: 600;
    color: #6b7280;
  }
  .maplibregl-popup.map-marker-tooltip-popup .maplibregl-popup-content {
    padding: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }
  .maplibregl-popup.map-marker-tooltip-popup .maplibregl-popup-tip {
    display: none;
  }
  .leaflet-tooltip.map-marker-hover-tooltip-leaflet {
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }
  .leaflet-tooltip.map-marker-hover-tooltip-leaflet::before {
    display: none;
  }
  .gm-style-iw:has(.map-marker-hover-tooltip) .gm-ui-hover-effect {
    display: none !important;
  }
  .gm-style-iw:has(.map-marker-hover-tooltip) .gm-style-iw-chr {
    display: none !important;
  }
  .gm-style-iw:has(.map-marker-hover-tooltip) .gm-style-iw-c {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18) !important;
    border-radius: 8px !important;
  }
`
