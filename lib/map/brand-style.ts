/**
 * Tema de marca Furgocasa para el basemap de MapLibre.
 *
 * En lugar de mantener un style JSON propio (frágil ante cambios de MapTiler),
 * re-pintamos las capas del estilo ya cargado por categoría: terreno arena,
 * agua en azul corporativo, carreteras suaves y etiquetas cálidas.
 * Cada cambio va protegido individualmente: si una capa no existe o no admite
 * la propiedad, se ignora y el mapa sigue siendo 100% funcional.
 */

const BRAND = {
  land: '#f5efe4',        // terreno base (arena clara)
  landAlt: '#efe7d6',     // usos urbanos / industriales
  green: '#e2e9d4',       // bosques, parques, vegetación
  sand: '#f3e6c9',        // playas y arenales
  water: '#4d749e',       // agua: azul corporativo aclarado con ~25% de blanco
  building: '#e9dfca',
  buildingOutline: '#dcd0b6',
  roadCasing: '#e6dcc5',
  road: '#ffffff',
  roadMajor: '#f6cf95',   // autovías / autopistas en ámbar suave
  rail: '#d9cdb2',
  boundary: '#bfb197',
  text: '#4d4636',        // etiquetas sobre terreno claro
  textHalo: 'rgba(245, 239, 228, 0.92)',
  waterText: '#f2f7fd',   // etiquetas sobre agua
  waterTextHalo: 'rgba(45, 84, 128, 0.55)',
}

type AnyMap = {
  getStyle: () => { layers?: { id: string; type: string }[] } | undefined
  setPaintProperty: (layerId: string, prop: string, value: unknown) => void
  setLayoutProperty: (layerId: string, prop: string, value: unknown) => void
}

function safePaint(map: AnyMap, layerId: string, prop: string, value: unknown) {
  try {
    map.setPaintProperty(layerId, prop, value)
  } catch {
    /* la capa no admite esta propiedad: ignorar */
  }
}

function safeLayout(map: AnyMap, layerId: string, prop: string, value: unknown) {
  try {
    map.setLayoutProperty(layerId, prop, value)
  } catch {
    /* ignorar */
  }
}

/** Aplica el tema de marca sobre el estilo cargado. Idempotente. */
export function applyBrandTheme(map: AnyMap) {
  const layers = map.getStyle()?.layers ?? []

  for (const layer of layers) {
    const id = layer.id.toLowerCase()

    switch (layer.type) {
      case 'background':
        safePaint(map, layer.id, 'background-color', BRAND.land)
        break

      case 'fill': {
        if (id.includes('water')) {
          safePaint(map, layer.id, 'fill-color', BRAND.water)
          safePaint(map, layer.id, 'fill-outline-color', BRAND.water)
        } else if (/wood|forest|park|grass|meadow|landcover|vegetation|scrub|golf|garden|cemetery|zoo/.test(id)) {
          safePaint(map, layer.id, 'fill-color', BRAND.green)
        } else if (/sand|beach/.test(id)) {
          safePaint(map, layer.id, 'fill-color', BRAND.sand)
        } else if (id.includes('building')) {
          safePaint(map, layer.id, 'fill-color', BRAND.building)
          safePaint(map, layer.id, 'fill-outline-color', BRAND.buildingOutline)
        } else if (/residential|landuse|industrial|commercial|school|hospital|stadium|pitch|track|airport|aeroway|suburb/.test(id)) {
          safePaint(map, layer.id, 'fill-color', BRAND.landAlt)
        }
        break
      }

      case 'fill-extrusion':
        if (id.includes('building')) {
          safePaint(map, layer.id, 'fill-extrusion-color', BRAND.building)
        }
        break

      case 'line': {
        if (id.includes('water')) {
          safePaint(map, layer.id, 'line-color', BRAND.water)
        } else if (id.includes('boundary') || id.includes('admin')) {
          safePaint(map, layer.id, 'line-color', BRAND.boundary)
        } else if (/rail|transit/.test(id)) {
          safePaint(map, layer.id, 'line-color', BRAND.rail)
        } else if (/casing|outline/.test(id)) {
          safePaint(map, layer.id, 'line-color', BRAND.roadCasing)
        } else if (/motorway|trunk/.test(id)) {
          safePaint(map, layer.id, 'line-color', BRAND.roadMajor)
        } else if (/road|highway|street|bridge|tunnel|path|pedestrian|footway|cycleway|minor|major|service|link/.test(id)) {
          safePaint(map, layer.id, 'line-color', BRAND.road)
        }
        break
      }

      case 'symbol': {
        // Ocultar POIs comerciales: limpia el mapa y da protagonismo a las áreas
        if (id.startsWith('poi') || id.includes('poi_') || id.includes('poi-')) {
          safeLayout(map, layer.id, 'visibility', 'none')
          break
        }
        if (/water|ocean|sea|marine/.test(id)) {
          safePaint(map, layer.id, 'text-color', BRAND.waterText)
          safePaint(map, layer.id, 'text-halo-color', BRAND.waterTextHalo)
        } else {
          safePaint(map, layer.id, 'text-color', BRAND.text)
          safePaint(map, layer.id, 'text-halo-color', BRAND.textHalo)
        }
        break
      }
    }
  }
}
