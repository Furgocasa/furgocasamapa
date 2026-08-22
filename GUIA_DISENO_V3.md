# 🎨 Guía de Diseño — Estética 3.0

> Sistema visual de Mapa Furgocasa desde agosto 2026. Qué se cambió, dónde vive
> cada pieza y qué reglas seguir al tocar la estética a partir de ahora.
> Complementa a `README.md` (visión general) y `CAMBIOS_CURSOR.md` (verificación).

**Commits de la oleada** (21 ago 2026, orden cronológico):
`99df132` (fase 1: marca, tipografía, micro-animaciones) → `ad6883b` (basemap propio + entrada cinematográfica) → `581b0a9` (splash furgoneta) → `ce0a6b4` (agua clara, autofocus, z-index) → `9124956` (GPS/zoom solo icono) → `d6c52f9` (lupa plegable) → `ad06b32` (filtros 3.0) → `f586422` (lupa alineada).

---

## 1. Tokens de marca

Todo vive en `tailwind.config.ts`. **Nunca** volver a hardcodear `sky-*`, `blue-600`
o hex sueltos en componentes: usar los tokens.

### Paleta

| Token | Valor ancla | Uso |
|-------|-------------|-----|
| `primary-600` | `#0b3c74` (azul corporativo) | Botones primarios, títulos, marca |
| `primary-50…900` | Escala derivada del azul | Fondos suaves, hovers, bordes |
| `accent-500` | `#ff6b35` (naranja) | CTAs secundarios, badges, descuentos |
| `tipo.publica` | `#0284c7` | Pin y filtro de área pública |
| `tipo.privada` | `#FF6B35` | Pin y filtro de área privada |
| `tipo.camping` | `#52B788` | Pin y filtro de camping |

El color de tipo se obtiene siempre de `getTipoAreaColor()` (`lib/areas/tipo-area.ts`),
nunca a mano. El mismo color se usa en pines del mapa, leyenda y tarjetas de filtro:
es el hilo conductor visual de los tres tipos.

### Tipografía

| Familia | Variable CSS | Uso |
|---------|--------------|-----|
| **Inter** | `--font-inter` → `font-sans` | Texto general (body) |
| **Outfit** | `--font-outfit` → `font-heading` | `h1`–`h4` (automático vía `globals.css`) |

Se cargan con `next/font/google` en `app/layout.tsx` (self-hosted, `display: swap`).
No añadir `<link>` de Google Fonts ni otras familias.

### Sombras y radios

| Token | Uso |
|-------|-----|
| `shadow-card` | Tarjetas y secciones de ficha (sustituye a `shadow-mobile`, que queda como alias) |
| `shadow-overlay` | Bottom sheets, splash y capas flotantes |
| `rounded-2xl` | Secciones y tarjetas |
| `rounded-xl` | Botones y chips grandes |
| `border-radius: 999px` | Chips/píldoras (también en el HTML inline del popup) |

---

## 2. Basemap propio (MapLibre)

**Archivo**: `lib/map/brand-style.ts`.

`applyBrandTheme(map)` re-pinta **en runtime** las capas del estilo MapTiler ya
cargado (`setPaintProperty` / `setLayoutProperty` con try/catch por capa): tierra
arena, agua azul marca aclarada, verdes suaves, carreteras neutras y POIs
comerciales ocultos. Al no ser un JSON de estilo propio, sobrevive a updates de
MapTiler: si una capa no existe, se ignora.

- **Agua**: `#4d749e` = azul corporativo + ~25% de blanco. No oscurecer: el azul
  puro (`#12467e`) se confundía con las secciones de UI.
- **Se aplica en**: `MapLibreMap.tsx` (en el `load`, solo si `estilo === 'default'`)
  y en el mini-mapa de la ficha (`components/area/MapaUbicacion.tsx`).
- Los estilos alternativos (satélite, etc.) **no** se tematizan.

---

## 3. Entrada cinematográfica y splash

### Vuelo de entrada (`MapLibreMap.tsx`)

El mapa arranca con vista amplia de Europa y hace `flyTo` hacia el destino una
sola vez por sesión (guard `hasFlownRef`). Los marcadores entran con caída
escalonada (keyframes `fc-marker-drop` + `animation-delay` por índice, en el
`style jsx` del componente).

### Splash de carga (`app/(public)/mapa/page.tsx`, `SplashFurgo`)

Ya **no** hay pantalla completa que bloquee: el mapa se renderiza debajo desde el
primer frame. Mientras `initialLoading`, flota una tarjeta translúcida
(`bg-white/95 backdrop-blur-md`, `shadow-overlay`, `pointer-events-none`) con:

- Silueta de **Fiat Ducato H2 L3** camperizado (caja alta, batalla larga, morro
  corto). La franja naranja va recortada al cuerpo y para en el pilar A: no se
  sale del morro ni del portón.
- Textos i18n (`splash_title`, `splash_body`, `splash_joke_*`, `splash_found`)
  en `lib/i18n/ui.ts`. El cuerpo avisa de más de 9.000 áreas en más de 25
  países; debajo rotan tres frases cortas.
- Barra indeterminada (`fc-bar-slide`). El van bota (`fc-van-bob`).
- Contador en vivo cuando ya hay áreas (`splash_found`).

No usar una carretera azul del color de la carrocería: se lee como una raya
suelta del chasis. Las marcas de asfalto van en gris, solo bajo la batalla.

Los keyframes viven en `app/globals.css`. Entrada/salida con `AnimatePresence`
de Framer Motion.

---

## 4. Popup de área (`components/mapa/areaPopup.ts`)

HTML inline (no React), así que los colores van en hex — son los mismos tokens:

- Chips (rating, gratis, descuento): píldoras `999px`, naranja acento
  `#FFF4EE` / `#C44317` / borde `#FFC9AD`.
- Botón «Ver área»: `#0b3c74`, radio `12px`.
- `font-family: inherit` para heredar Inter del documento.

Si se cambia la paleta en Tailwind, **actualizar aquí a mano**.

---

## 5. Móvil: fila superior del mapa y controles

Regla de oro: en móvil el mapa se ve, no se tapa.

### Fila superior (una sola línea)

| Elemento | Posición | Archivo |
|----------|----------|---------|
| Contador «N áreas» | `top-3 left-3`, `z-10` | `app/(public)/mapa/page.tsx` |
| Lupa plegada | misma fila, `ml-auto` (entre contador y zooms) | `BuscadorGeografico.tsx` |
| Zooms MapLibre | `top-right` nativo | — |

- El **buscador plegado** es un círculo `w-11 h-11 bg-white/90 backdrop-blur-md
  ring-1` (mismo estilo que el contador). Al tocarlo (`openMobileSearch`) se
  despliega el campo completo **con foco**: aquí el teclado sí es intencionado.
  Se repliega al cerrar o perder foco sin texto.
- El wrapper del buscador (en los 3 proveedores: `MapLibreMap`,
  `MapaInteractivoGoogle`, `LeafletMap`) lleva `pointer-events-none`; solo la
  lupa y el campo llevan `pointer-events-auto`. Así la franja vacía no bloquea
  el arrastre del mapa.
- En desktop el buscador sigue arriba centrado (`md:w-80`), sin plegado.

### Botones GPS y Restablecer zoom

Solo icono en móvil (círculo `p-3`, texto `hidden md:inline`, con `aria-label`).
Igual en los 3 proveedores.

### Convención de z-index (¡respetarla!)

| Capa | z |
|------|---|
| Contador de áreas | `z-10` |
| Controles del mapa (buscador, GPS, reset) | `z-30` |
| Bottom nav móvil | `z-40` |
| Bottom sheets / modales | por encima (contexto propio) |
| Dropdown del buscador | `z-[10001]` (dentro de su contenedor) |

**Nunca** volver a `z-[1000]` en controles del mapa: tapaban sheets y modales.

### autoFocus

Prohibido en inputs dentro de modales/sheets en móvil (el teclado tapa las
opciones). Excepción: cuando el usuario toca explícitamente un control de
búsqueda (la lupa), ahí el foco es la acción esperada.

---

## 6. Filtros 3.0 (`components/mapa/FiltrosMapa.tsx`)

Sin checkboxes de 16px: todo control es táctil, mínimo ~40px.

- **Cabecera interna solo en desktop** (`hidden md:flex`). En móvil el
  `BottomSheet` ya pone título y X — era la causa del doble «Filtros».
  En desktop muestra una bolita `accent-500` con el nº de filtros activos.
- **Tipo de ubicación**: 3 tarjetas botón con el color de `getTipoAreaColor()`
  (borde + fondo al 8% + check al activarse). Mismo lenguaje que los pines.
- **Servicios**: rejilla de chips a 2 columnas con icono; activo =
  `border-primary-600 bg-primary-50`.
- **Precio**: botones segmentados 2×2; activo relleno `bg-primary-600` blanco.
- **Características**: chips full-width en acento naranja.
- **Footer**:
  - Móvil: botón primario `«Ver resultados (N)»` → llama a `onClose` (cierra la
    hoja; el filtrado ya es en vivo). Solo se pinta si hay `onClose`.
  - `«Limpiar filtros (n)»` con contador `filtrosActivos`, deshabilitado a 0.
- **i18n**: clave `show_results` en ES/EN/FR/DE/IT (`lib/i18n/ui.ts`). Cualquier
  texto nuevo de filtros debe entrar en los 5 idiomas.

---

## 7. Resto de piezas 3.0

| Pieza | Archivo | Qué es |
|-------|---------|--------|
| Bottom sheets con muelle y arrastre | `components/mobile/BottomSheet.tsx` | Framer Motion (`useDragControls`), `shadow-overlay` |
| Corazón favorito con «pop» | `components/area/DetalleAreaHeader.tsx` | `motion.span` con spring al togglear |
| Secciones de ficha unificadas | `GaleriaFotos`, `Valoraciones*`, `MapaUbicacion`, `AreasRelacionadas` | `rounded-2xl shadow-card p-6`, sin `border-t-4` |
| Logo blanco en footer | `components/layout/Footer.tsx` | `/logo-blanco-500.png` sobre fondo oscuro |

---

## 8. Pendientes de la estética 3.0 (fase siguiente)

1. **Pines con silueta de furgo + card flotante deslizable**: sustituir popups
   por un carrusel de tarjetas sobre el mapa (probar densidad/rendimiento con
   ~9.000 áreas antes de publicar).
2. **Transición card → ficha**: shared element al navegar del mapa al detalle.

---

## 9. Checklist al tocar la estética

- [ ] ¿Colores desde tokens (`primary`, `accent`, `tipo`) o `getTipoAreaColor()`?
- [ ] ¿Radios y sombras del sistema (`rounded-2xl`/`xl`, `shadow-card`/`overlay`)?
- [ ] ¿Texto nuevo traducido en los 5 idiomas de `lib/i18n/ui.ts`?
- [ ] ¿Cambiaste el popup? Recuerda que sus hex van a mano (`areaPopup.ts`).
- [ ] ¿Nuevo control sobre el mapa? Respeta la tabla de z-index y hazlo
      solo-icono en móvil si ocupa.
- [ ] ¿Cambio en un proveedor de mapa? Replícalo en los 3 (`MapLibreMap`,
      `MapaInteractivoGoogle`, `LeafletMap`).
- [ ] Sin `autoFocus` en modales móviles.
- [ ] `npx tsc --noEmit` limpio → commit → push a `main` → Ctrl+F5 tras deploy.
