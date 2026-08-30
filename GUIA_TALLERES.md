# Guía de talleres camper

> Capa propia en MapafurgoCasa. No es un cuarto tipo de área. Un taller
> camperiza o repara el habitáculo; un área es para dormir.
>
> Complementa a `README.md`, `GUIA_MAPA_ALQUILER.md` (CTA) y
> `GUIA_DISENO_V3.md` (pin ámbar). Inventario del taller: `MAPA-PROYECTOS.md`
> (ficha MapafurgoCasa). Bitácora: `RAID-CUENTAS-Y-STACK.md` (30 ago 2026).

**Corte 30 ago 2026:** **388** talleres activos. Solo España. Ficha molde:
[`/taller/petervan-camper-murcia`](https://www.mapafurgocasa.com/taller/petervan-camper-murcia).

---

## 1. Qué entra y qué no

| Entra | No entra |
|-------|----------|
| Camperizado (muebles, techo, agua, gas) | Alquiler / flota (competencia de Furgocasa) |
| Accesorios de habitáculo (calefacción, placas, nevera, claraboya, batería) | Neumáticos, Feu Vert, Norauto |
| Reparación del habitáculo o la autocaravana | Lunas / Carglass / Glassdrive |
| Homologación para ITV del camperizado | ITV, recambios, grúas |
| | Taller oficial de coche, Eurorepar |
| | Concesionarios (no viajan desde Furgocasa) |
| | Desguaces, lavaderos, «Nomad Clean» |

Filtro de código: `esAlquilerNoTaller()` en `lib/talleres/seo-snippet.ts`.
Se aplica en el hub, las relacionadas de ficha y el Tío. Indie Campers,
Yescapa, «empresa de alquiler», «apartado de reservas» (sin camperizado) = fuera.

**No es `tipo_area`.** Los tres tipos (`publica` | `privada` | `camping`)
siguen siendo solo de áreas. Un taller **no entra** en `areas`. Tabla propia:
`talleres`.

---

## 2. URLs

| Ruta | Qué es |
|------|--------|
| `/talleres` | Hub España. Top 10 (nota × reseñas, mín. 20). CTA al mapa. Sin grid de provincias. OG propio: `public/images/opengraph/opengraph_talleres.jpg` (taller de camperizado, no el pantallazo de rutas). |
| `/talleres/{provincia}` | Landing por provincia (`lib/areas/provincias.ts`). Listado agrupado por ciudad. FAQ + schema. |
| `/taller/{slug}` | Ficha. Molde visual de `/area/{slug}`. |
| `/mapa?capa=talleres` | Mapa con la capa Talleres. |
| `/mapa?capa=talleres&provincia=Murcia` | Capa + búsqueda de esa provincia. |

Slug: `nombre` + provincia si hace falta; colisión → `-2`, `-3`.
No concatenar país ni Place ID. Canonical: `https://www.mapafurgocasa.com/taller/{slug}`.

Furgocasa (`/es/autocaravanas`) ya no lista talleres: banner + CTA a
`mapafurgocasa.com/talleres`.

---

## 3. Capa del mapa

Dos catálogos. Nunca mezclados en el mismo zoom.

```
Áreas  →  GET /api/areas     →  pins de tipo_area
Talleres → GET /api/talleres →  pins ámbar (llave)
```

| Pieza | Dónde |
|-------|--------|
| Estado `capa`: `'areas' \| 'talleres'` | `app/(public)/mapa/page.tsx` |
| Query `?capa=talleres` | Al cargar y al conmutar (`history.replaceState`) |
| Conmutador Áreas \| Talleres | Esquina superior izquierda del mapa (ámbar `#B45309` activo) |
| Carga | `fetch('/api/talleres?t=…')` en cubos de 30 s, `cache: 'no-store'` |
| Adaptador | `tallerToMapPin()` en `lib/talleres/map-pin.ts` |
| API | `app/api/talleres/route.ts` — solo `activo = true`, campos `CAMPOS_MAPA_TALLER` |
| Caché CDN | `s-maxage=30`, sin `stale-while-revalidate` (mismo criterio que `/api/areas`) |

`tallerToMapPin()` pinta un `Area` falso para reutilizar pines, popup y lista.
Señales de que **no** es un área:

- `fichaBase: '/taller'`
- `tipo_area: 'privada'` solo como relleno (no filtrar por esto)
- `servicios: {}`, `precio_noche: null`

Detectar: `esPinTaller(pin)` / `fichaBaseDePin(pin)`.

### Qué filtra cada capa

| Filtro | Áreas | Talleres |
|--------|-------|----------|
| Texto (nombre, ciudad, provincia; sin tildes) | sí | sí |
| País / región | sí | sí (hoy casi todo es España) |
| Tipo pública / privada / camping | sí | no (el panel aún muestra las 3 tarjetas; no recortan el catálogo) |
| Precio, servicios, verificado, descuento | sí | no (el panel los enseña; el `useMemo` los ignora) |

Lista y mapa usan el **mismo** array (`areasParaLista === areasParaMapa`).
La lista recorta a 50; el mapa pinta todos.

### Tres proveedores

Google, MapLibre y Leaflet leen color / glifo / popup por `lib/talleres/map-pin.ts`
y `components/mapa/areaPopup.ts`. El CTA «Ver detalles» va a `/taller/{slug}`.

El popup de taller **aún** enseña Favorito y «Estuve aquí» (el HTML es el de
área). La ficha `/taller` no tiene corazón. No guardar un taller en `favoritos`
(esa tabla es de `area_id`).

El chatbot sobre el mapa (`furgocasa:select-area` / `?area=`) solo busca en
`areas`, no en `tallerPins`.

---

## 4. Pin y copy

| | |
|---|---|
| Color | `#B45309` (`TALLER_PIN_COLOR`) |
| Glifo | Llave, misma silueta gruesa que bandera / valla / tienda (`TALLER_ICON_PATH`) |
| Etiqueta | ES Taller · EN Workshop · FR Atelier · DE Werkstatt · IT Officina |

Navbar, filtros, leyenda y lista: claves `nav_talleres`, `type_taller`,
`type_taller_hint`, `search_placeholder_talleres`, `empty_talleres` en
`lib/i18n/ui.ts` (5 idiomas). Las landings `/talleres` y `/taller` están
solo en español.

---

## 5. Tabla `talleres`

Supabase del mapa (`dkqnemjcmcnyhuvstosf`, org Casi 5). **No** el MCP de otra
cuenta: `.env.local` + `SUPABASE_SERVICE_ROLE_KEY`.

`activo` = visibilidad pública (mapa, hub, landings, sitemap, Tío). Igual
que en áreas: inactivo no está borrado.

Campos que usa el producto:

| Campo | Uso |
|-------|-----|
| `nombre`, `slug` | Ficha y URL |
| `latitud`, `longitud` | Mapa y RPC `talleres_cerca` |
| `ciudad`, `provincia`, `comunidad`, `pais` | Sitio; `pais` hoy `España` |
| `direccion`, `codigo_postal`, `telefono`, `email`, `website` | Contacto |
| `google_place_id`, `google_maps_url`, `google_rating`, `google_ratings_total` | Identidad y ranking |
| `descripcion` | Texto propio (molde Petervan). No Camperizando |
| `foto_principal`, `fotos_urls` | Web oficial. No Google, no IA, no Instagram |
| `origen_id` | id en Furgocasa `motorhome_services` |
| `verificado` | Existe; el hub no lo usa como sello |

Ciudad sucia («nave 2», polígono, un número): `sitioTaller()` / `ciudadGrupoTaller()`
enseñan solo la provincia.

Ranking (hub, landing, Tío): `scoreValoracionTaller(rating, reviews)` —
Bayesiano, misma idea que el Tío: un 5 con 2 votos no gana a un 4,8 con 80.

---

## 6. SEO

| Página | Index | Sitemap |
|--------|-------|---------|
| `/talleres` | sí | sí (priority 0.8) |
| `/talleres/{prov}` con **≥ 3** activos | sí | sí |
| `/talleres/{prov}` con **1 o 2** | `noindex, follow` | no |
| `/taller/{slug}` activo | sí | sí (priority 0.65) |

Constante: `MIN_TALLERES_LANDING_INDEX = 3` (`lib/talleres/seo-snippet.ts`).
Molde de áreas: no pueblo con 1.

Schema:

- Hub: `BreadcrumbList` + `ItemList` (top 10)
- Provincia: breadcrumb + `FAQPage` + `ItemList`
- Ficha: `AutoRepair` + geo + `aggregateRating` si hay nota Google

Title ficha: `{Nombre} | Taller camper {ciudad, provincia}` (máx. 60).
Description: primer párrafo propio o plantilla + nota Google (máx. 155).

Open Graph del hub y de las provincias: `images/opengraph/opengraph_talleres.jpg`
(taller de camperizado, 1200×630). No reutilizar `og-image-v2.jpg` (pantallazo de `/ruta`).
Ficha: `foto_principal` si hay; si no, la misma OG de talleres.

---

## 7. Ficha `/taller/[slug]`

Reutiliza componentes de área con `variante="taller"` / `modo="taller"`:

| Bloque | Qué cambia |
|--------|------------|
| `DetalleAreaHeader` | Chip «Taller», sin corazón, sin precio |
| `InformacionBasica` | Sin cards de horario / precio / plazas / altura |
| `ContactoInfo` | WhatsApp si hay teléfono; título «Contacto» |
| `CtaAlquilerFurgocasa` | «¿Camperizar o probar primero?» — no «pásala por el taller» |
| `CtaCenaCerca` | Titular de salida del taller |
| `AreasRelacionadas` | `hrefBase="/taller"`, excluye alquiler / ruido |
| `GaleriaFotos` | Solo si hay más de una foto |

CTA Murcia: gran volumen, Casillas, desde 95 €/día.
`resolverCtaAlquilerTaller()` en `lib/areas/cta-comercial.ts`.
UTM landing provincia: `utm_medium=cta_talleres_provincia`.

---

## 8. Tío Viajero

| | |
|---|---|
| Detección | `pideTaller()` en `lib/chatbot/intencion.ts` (`taller`, `camperización`, `workshop`) |
| Tool | `search_talleres` — máx. 3 fichas |
| Código | `searchTalleres()` / `formatTallerParaChat()` en `lib/chatbot/functions.ts` |
| Forzado | Primera ronda: si `forzarTaller`, `tool_choice = search_talleres` |
| Cerca | GPS inyectado si no nombran ciudad (radio 50 km, RPC `talleres_cerca`) |
| Ciudad dicha | Gana al GPS (regla 1 de directorio) |
| Enlace | Solo `/taller/{slug}`. No Google Maps |
| Si hay fichas | Prohibido «no tengo» |
| Gasolinera | `buscar_info_viaje` (web). **Nunca** para talleres |
| Alquiler | `esAlquilerNoTaller` filtra el resultado |

El prompt de las seis reglas aún dice «solo `/area/{slug}`». La excepción
de talleres está en el bloque de calidad: «Taller camper: `search_talleres`.
Cita ficha y enlace `/taller/slug`».

---

## 9. Pipeline de datos

Credenciales: `.env.local` de este repo (destino) y, en el import, el de
`webfurgocasa` (origen). Windows + TLS: `$env:NODE_TLS_REJECT_UNAUTHORIZED="0"`.

### Import desde Furgocasa

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
node scripts/import-talleres-desde-furgocasa.mjs
```

Lee `motorhome_services` donde `category = taller_camper`. Concesionarios no
viajan. Upsert por `google_place_id` (fallback `slug`). Galicia «comunidad»
se corrige a provincia real. `activo` = `status=active` y
`operational_status=OPERATIONAL`. Descripción inicial de plantilla (luego
la pisa el enriquecido).

### Altas desde Camperizando (nombres, no textos)

```powershell
node scripts/import-talleres-camperizando.mjs          # dry-run
node scripts/import-talleres-camperizando.mjs --apply
```

Lista pública de [camperizando.es/camperizadores](https://camperizando.es/camperizadores/).
Ficha = Google Places. **No se copian** sus textos. 30 ago: 35 altas + 6
reactivados; 46 de su lista sin Place fiable (no se inventan).

### Auditoría (0 €)

```powershell
node scripts/enriquecer-talleres.mjs
```

Solo cuenta: descripción corta, sin foto, activas. No escribe.

### Textos (Terra)

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
node scripts/enriquecer-textos-talleres.mjs
# TXT_DRYRUN=1  TXT_LIMIT=15  TXT_CONCURRENCY=3  TXT_MODEL=gpt-5.6-terra
```

2–3 párrafos a partir de **su** web. No Camperizando, no horarios inventados,
no «destino ideal». Checkpoint: `scripts/talleres-textos-checkpoint.txt`.
Salta `petervan-camper-murcia` (molde a mano) y las que ya no son plantilla.

30 ago: **404/404** textos (el recorte a 388 activas es posterior; hay
inactivas enriquecidas).

### Fotos (web oficial)

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
npx ts-node --project tsconfig.scripts.json scripts/enriquecer-fotos-talleres.ts
# IMG_DRYRUN=1  IMG_LIMIT=20  IMG_MAX=4  IMG_CONCURRENCY=3
```

`scrapeFotosWebOficial()` (`lib/areas/scrape-official-images.ts`). No Google,
no logo, no Instagram, no IA. 30 ago: **246** con foto de **405** de entonces;
98 webs sin foto usable.

---

## 10. Qué no hay (a propósito)

- Panel admin de talleres (no está en `/admin`).
- Traducciones de hub / landing / ficha (solo el mapa y el Tío están i18n).
- Favoritos o «Estuve aquí» de verdad en la ficha.
- Talleres fuera de España.
- Cuarto tipo en `tipo_area` ni en `decidirUbicacion()`.
- Mezclar talleres en `/ruta` ni en el corredor de áreas.

---

## 11. Archivos

```
lib/talleres/types.ts              Taller, color, glifo, campos del mapa
lib/talleres/map-pin.ts            Adaptador + helpers de pin
lib/talleres/seo-snippet.ts        Title, ranking, qué no entra, sitio sucio
app/api/talleres/route.ts          Catálogo activo
app/(public)/mapa/page.tsx         Capa y conmutador
app/(public)/talleres/page.tsx     Hub
app/(public)/talleres/[provincia]/ Landing
app/(public)/taller/[slug]/        Ficha
app/sitemap.ts                     Hub + provincias ≥3 + fichas
components/mapa/*                  Pin, popup, lista, filtros
lib/chatbot/functions.ts           searchTalleres
lib/chatbot/intencion.ts           pideTaller
app/api/chatbot/route.ts           Tool + forzado
```

Tras un import grande: push a `main`, 2–3 min de Vercel, **Ctrl+F5**.
El cubo `?t=` de 30 s no exige bump manual.
