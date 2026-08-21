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

export function buildMarkerTooltipHTML(nombre: string): string {
  return `<div class="map-marker-hover-tooltip">${escapeHtml(nombre)}</div>`
}

export const MARKER_TOOLTIP_CSS = `
  .map-marker-hover-tooltip {
    padding: 6px 10px;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    color: #111827;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
    white-space: nowrap;
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
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
