# 📋 CAMBIOS_CURSOR — Registro de cambios para verificación

> Documento para que el agente de Cursor verifique, paso a paso, todos los
> cambios realizados el **28 de julio de 2026** con Claude (Cowork).
> Cada bloque indica: qué se cambió, en qué archivos, y CÓMO verificarlo.
> Complementa a `PLAN_MEJORAS.md` (visión de producto y pasos manuales)
> y a `GUIA_ENGAGEMENT.md` (embudo, furgo/IA/QR, digest).

---

## BLOQUE 1 — Seguridad de claves API

### 1.1 Eliminado el bloque `env` de next.config.js
- **Qué**: se inyectaban `SUPABASE_SERVICE_ROLE_KEY` y `OPENAI_API_KEY` vía `env` (riesgo de acabar en el bundle del cliente).
- **Archivo**: `next.config.js`
- **Verificar**: no existe ningún bloque `env:` en next.config.js. Las API routes usan `process.env.*` directamente (Vercel las inyecta en runtime).

### 1.2 Eliminados fallbacks NEXT_PUBLIC_ de claves secretas
- **Qué**: el código aceptaba `NEXT_PUBLIC_OPENAI_API_KEY_ADMIN`, `NEXT_PUBLIC_SERPAPI_KEY_ADMIN` y `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (cualquier NEXT_PUBLIC_ viaja al navegador).
- **Archivos**: `app/api/chatbot/route.ts`, `lib/chatbot/functions.ts`, `lib/openai/model-validation.ts`, `app/api/admin/serpapi-proxy/route.ts`, `app/api/admin/enrich-description/route.ts`, `app/api/admin/scrape-services/route.ts`, `app/admin/configuracion/page.tsx`, `app/admin/areas/actualizar-servicios/page.tsx`, `scripts/verificar-chatbot-config.js`
- **Verificar**: `grep -r "NEXT_PUBLIC_OPENAI\|NEXT_PUBLIC_SERPAPI\|NEXT_PUBLIC_SUPABASE_SERVICE" app lib components hooks scripts` → 0 resultados.

### 1.3 Nuevo endpoint de estado de claves (solo servidor)
- **Qué**: las páginas admin ya no comprueban claves en el navegador; preguntan al servidor.
- **Archivo nuevo**: `app/api/admin/api-status/route.ts` (GET, con `?deep=1` valida contra OpenAI/SerpAPI reales).
- **Verificar**: `app/admin/configuracion/page.tsx` y `app/admin/areas/actualizar-servicios/page.tsx` hacen `fetch('/api/admin/api-status...')`.

### 1.4 Logs que volcaban variables de entorno eliminados
- **Qué**: el chatbot logueaba TODOS los nombres de env vars y los devolvía en errores/GET al cliente.
- **Archivo**: `app/api/chatbot/route.ts` (funciones `getSupabaseClient`, `getOpenAIClient`, GET simplificado sin bloque `debug`).
- **Verificar**: buscar `Object.keys(process.env)` en app/ → 0 resultados.

### 1.5 Optimizador de imágenes
- **Qué**: `images.remotePatterns` aceptaba `http://**`; se eliminó (solo HTTPS). Queda TODO pendiente de restringir a dominios concretos.
- **Archivo**: `next.config.js`
- ⚠️ **Acción manual pendiente (Vercel)**: borrar las 3 variables NEXT_PUBLIC_ citadas y ROTAR claves OpenAI y SerpAPI.

---

## BLOQUE 2 — Costes Google (solo pipeline/admin; el front de usuario NO se toca)

### 2.1 Place Details con campos mínimos (ahorro ~80% por búsqueda admin)
- **Qué**: se pedían `reviews,opening_hours,...` (SKU caro) sin usarse; ahora solo `website,formatted_phone_number,international_phone_number`.
- **Archivos**: `app/api/admin/search-places/route.ts` (línea con `detailsUrl.searchParams.append('fields', ...)`), `app/api/admin/search-places-map/route.ts` (ídem).
- **Verificar**: el parámetro `fields` de Place Details solo contiene esos 3 campos en ambos archivos.

### 2.2 Scripts de corrección de países → Nominatim (gratis)
- **Qué**: `reverseGeocode()` usaba Google Geocoding ($5/1000); ahora Nominatim (OpenStreetMap) con User-Agent propio y delay 1100ms (límite 1 req/s).
- **Archivos**: `scripts/fix-countries-with-geocoding.ts`, `scripts/fix-countries-today.ts`
- **Verificar**: ambos usan `nominatim.openstreetmap.org/reverse` y NO requieren `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; `delay(1100)`.

### 2.3 Freno de seguridad en script de pago
- **Qué**: `scripts/actualizar-websites-google.js` (Place Details de pago) ahora exige `--confirm` o sale sin gastar.
- **Verificar**: ejecutarlo sin flags imprime aviso y `process.exit(0)`.

### 2.4 Sin cambios en el front de usuario
- El mapa con Google, el autocompletado, el buscador y el planificador `/ruta` (Google Maps + Directions) quedan EXACTAMENTE igual. `/ruta` no pasa por `useMapConfig` (verificado: `components/ruta/PlanificadorRuta.tsx` instancia `google.maps.Map` directamente).

---

## BLOQUE 3 — Rendimiento del mapa

### 3.1 Endpoint cacheado de áreas
- **Archivo**: `app/api/areas/route.ts` — todas las áreas activas en 1 respuesta. Paginación estable por `id` (no por `nombre`).
- **Caché CDN (ago 2026)**: `s-maxage=30`, **sin** `stale-while-revalidate` (antes 10 min + 1 h de copia vieja). Un import masivo (p. ej. Gales) no se veía en el mapa hasta 70 min; ahora como máximo ~30 s + Ctrl+F5.
- Cabeceras: `Cache-Control`, `CDN-Cache-Control`, `Vercel-CDN-Cache-Control`. Soporta `?lang=` e `?v=` (el `v` invalida la clave de caché).
- **Verificar**: `curl -I https://www.mapafurgocasa.com/api/areas?v=20260821-wales2` → `s-maxage=30`; JSON `{ areas, total, generated_at }`. Tras Gales+huecos, `total` ≈ 6100 y `pais=Reino Unido` > 0.

### 3.2 El mapa consume el endpoint con fallback
- **Archivo**: `app/(public)/mapa/page.tsx` — `loadAreas()` hace `fetch('/api/areas?v=…', { cache: 'no-store' })` y, si falla, pagina directo a Supabase. Subir `v` después de un import grande.

### 3.3 console.log fuera de producción
- **Archivo**: `next.config.js` — `compiler.removeConsole` en producción (conserva error/warn).

---

## BLOQUE 4 — Pipeline de datos (auditoría + enriquecimiento)

### 4.1 Auditoría de calidad (coste 0€)
- **Archivo nuevo**: `scripts/audit-data-quality.js` | **Comando**: `npm run db:audit`
- Genera `scripts/audit-report.csv` con áreas con descripción vacía/placeholder/corta/dubitativa, sin servicios, sin precio, sin plazas, sin foto, y fotos servidas vía API de pago de Google.

### 4.2 bulk-enrich.js mejorado (descripciones)
- **Cambios**: `reasoning.effort` configurable (def **medium**, antes low fijo) y `tool_choice: 'required'` para forzar web_search (desactivable `BULK_FORCE_SEARCH=0`, con reintento automático sin tool_choice si la API lo rechaza).
- **Estado**: ~660 áreas pendientes de la ejecución pausada por falta de crédito (checkpoint intacto).

### 4.3 Enriquecimiento de datos estructurados (NUEVO)
- **Archivo nuevo**: `scripts/enrich-datos-estructurados.js` | **Comandos**: `npm run enrich:datos` (dry-run → CSV propuestas) / `npm run enrich:datos:apply`
- Investiga con OpenAI + web_search los servicios/precio/plazas que FALTAN. Default actual: `gpt-5.6-terra` (antes GPT-5.5). Con `--apply` solo escribe campos VACÍOS y solo con confianza "alta". Nunca sobreescribe datos existentes. Checkpoint propio.

### 4.4 Traducciones i18n (NUEVO)
- **Archivo nuevo**: `scripts/translate-descriptions.js` | **Comando**: `npm run translate` (dry-run; `TRAD_RUN=1` para ejecutar)
- Traduce nombre+descripción+ubicación a FR/DE/IT/EN → tabla `areas_traducciones`.
- **Migraciones**: `20260728_areas_traducciones.sql` + `20260728_areas_traducciones_campos.sql` ✅ ejecutadas.

---

## BLOQUE 5 — UX del mapa y PWA

### 5.1 Mapa público (sin muro de login)
- **Archivo**: `app/(public)/mapa/page.tsx` — eliminados `LoginWall`, blur y bloqueo por `authLoading`. El login queda solo en favoritos/rutas/perfil.
- **Verificar**: `grep LoginWall "app/(public)/mapa/page.tsx"` → 0 resultados; visitar /mapa en incógnito → mapa visible.

### 5.2 Estética /mapa (desktop + móvil)
- **Archivos**: `app/(public)/mapa/page.tsx` (skeleton modernizado, contador píldora translúcida, barra inferior móvil con efecto cristal + píldora activa + badge naranja de filtros activos), `components/mobile/BottomSheet.tsx` (animación de entrada + **FIX**: el gesto de arrastrar-para-cerrar no funcionaba porque `currentYRef` no se actualizaba en `handleTouchMove`), `tailwind.config.ts` (keyframes `slide-up`, `fade-in`).

### 5.3 Modo offline PWA
- **Archivo**: `next.config.js` — en `runtimeCaching`, ANTES de `/api/* NetworkOnly`: `/api/areas` **NetworkFirst** (con cobertura pide red; la copia local vale hasta 7 días **solo si no hay red**) + tiles MapTiler/OSM CacheFirst (30 días).
- No confundir con el CDN de Vercel (30 s). El SW no debe servir 7 días de lista si hay red.
- **Verificar**: `/api/areas(?:\?.*)?$` ANTES que `/api/.*`.

### 5.4 MapLibre como fallback por defecto
- **Archivo**: `hooks/useMapConfig.ts` — `DEFAULT_CONFIG.proveedor = 'maplibre'` (antes 'google'). El selector de /admin/configuracion sigue mandando; solo cambia el fallback si la BD no responde.

---

## BLOQUE 6 — Contribuciones de usuarios ("¿Has estado aquí?")

- **Migración**: `supabase/migrations/20260728_area_contribuciones.sql` ✅ ejecutada (tabla `area_contribuciones` + RLS: insert propio autenticado, select propio, admin select/update; anti-spam 1 contribución/usuario/área/día por índice único).
- **Componente nuevo**: `components/area/ConfirmarDatosArea.tsx` — chips de servicios, precio, plazas, comentario; inserción directa con RLS (sin API extra).
- **Integración**: `app/(public)/area/[slug]/page.tsx`, tras `ServiciosGrid`.
- **Verificar**: en una página de área, logueado, enviar contribución → fila en `area_contribuciones` con estado 'pendiente'. Segundo envío el mismo día → error controlado (código 23505).
- **Pendiente fase 2**: panel admin para aplicar contribuciones (2+ coincidencias → auto-aplicar).

---

## BLOQUE 7 — Tío Viajero IA (chatbot) renovado

### 7.1 Motor moderno (tools API + bucle)
- **Archivo**: `app/api/chatbot/route.ts`
- Migrado de `functions`/`function_call` (obsoleto, 1 sola búsqueda) a `tools`/`tool_calls` con **bucle de hasta 4 rondas** (`MAX_TOOL_ROUNDS`): encadena y combina búsquedas ("compara Granada y Sevilla"). Ejecuta múltiples tool_calls por ronda. Si agota rondas, hace una llamada de cierre sin tools.
- Deduplica áreas por id entre búsquedas para las tarjetas.
- Acepta `locale` en el body y añade instrucción de idioma al system prompt (responde en es/en/fr/de/it).

### 7.2 Nuevas herramientas de búsqueda
- **Archivo**: `lib/chatbot/functions.ts`
  - `buscarAreasPorNombre` expuesta al modelo como `get_area_by_name`.
  - `searchAreasAlongRoute(origen, destino, corredor_km)` → `search_areas_along_route`: geocodifica ambas ciudades con **Nominatim (gratis)**, filtra áreas por distancia al segmento de ruta (proyección equirectangular) y las ordena origen→destino con `desvio_km`.
  - `valoracion_minima` como filtro nuevo en `search_areas`.

### 7.3 Widget renovado
- **Archivo**: `components/chatbot/ChatbotWidget.tsx`
  - **Sin login**: eliminado el modal de bloqueo; funciona anónimo (rate limit por IP ya existente en la API); con cuenta se guarda historial (`userId` opcional).
  - **Tarjetas de áreas**: foto, precio, ★ rating, distancia/desvío, enlace a `/area/[slug]` (hasta 6).
  - **Mensajes prefijados** (chips) al inicio + bienvenida/placeholder localizados en 5 idiomas (constante `TEXTOS`).
  - Envía `locale` (de `useLanguage()`) a la API.

### 7.4 Registro de TODAS las respuestas
- **Migración**: `supabase/migrations/20260728_chatbot_respuestas_log.sql` ✅ ejecutada.
- **Archivo**: `app/api/chatbot/route.ts` — `logRespuesta()` (best-effort) guarda cada respuesta (también anónimas): pregunta, respuesta, `funciones` ejecutadas con args, `areas_ids`, tokens, modelo, duración, locale.
- **Página nueva**: `app/admin/chatbot-respuestas/page.tsx` — lista paginada, filtros pendientes/revisadas, detalle expandible, marcar revisada con nota. Con auth admin + Navbar. Enlace en `/admin`.

### 7.5 Agente revisor IA (respuesta a respuesta)
- **Migración**: `supabase/migrations/20260728_chatbot_evaluacion_ia.sql` — ✅ **aplicada en Supabase** (`valoracion_ia`, `motivo_ia`, `sugerencia_ia`, `evaluado_at`).
- **Script nuevo**: `scripts/evaluar-respuestas-chatbot.js` | **Comando**: `npm run evaluar:chatbot` (dry-run; `EVAL_RUN=1` ejecuta; `EVAL_LIMIT` def 200).
- Clasifica cada respuesta como correcta/mejorable/incorrecta, con motivo y sugerencia. **Verifica hechos contra los datos reales de las áreas en BD** (carga las áreas de `areas_ids` y compara precios/servicios). Cola = filas con `evaluado_at IS NULL` (reanudable, sin duplicados).
- La página `/admin/chatbot-respuestas` incluye filtros y badges por veredicto IA.
- **Flujo de afinado (círculo, 21 ago 2026)**: evaluar → corregir código/prompt → push a `main`. No quedarse en el informe. Regla: `.cursor/rules/chatbot-revision.mdc`.

### 7.8 Admin: tabla + quesito (21 ago 2026)
- **Archivos**: `app/admin/chatbot-respuestas/page.tsx`, `app/api/admin/chatbot-respuestas/route.ts`
- Tabla: Fecha, Usuario (nombre/email), Anónimo/Registrado, Mensaje, Respuesta, Categorización. Fila expandible con motivo IA y nota de revisión.
- Quesito Recharts (correctas / mejorables / incorrectas / sin evaluar) con %; clic en quesito o tarjeta filtra la tabla.
- La API enriquece `user_id` con nombre/email de Auth y devuelve `stats` globales (no solo la página).

### 7.9 Correcciones de calidad (21 ago 2026)
- **Archivos**: `lib/chatbot/functions.ts`, `app/api/chatbot/route.ts`, `components/chatbot/ChatbotWidget.tsx`
- `precio_noche` null ya no se pinta ni se filtra como Gratis. Gratis solo si `=== 0`.
- GPS inválido / Null Island (`0,0`) se ignora; sin ciudad/GPS/país no se lanza un ranking mundial.
- Búsqueda por nombre: alias (Massabielle → Lourdes, bolemdam → Volendam) + geocodificación Nominatim y radio (no ILIKE suelto tipo “Ajo” → Países Bajos).
- Prompt de calidad: no heredar filtros si solo nombran ciudad; no buscar gasolineras; idioma del último mensaje.

### 7.10 gpt-5.6-terra + tools (21 ago 2026)
- **Error**: `Function tools with reasoning_effort are not supported for gpt-5.6-terra in /v1/chat/completions`.
- **Fix**: `reasoning_effort: 'none'` en las llamadas del chatbot (`buildReasoningForTools`).
- **Decisión posterior**: el chatbot activo vuelve a `gpt-4o-mini` por coste, latencia y compatibilidad directa con tools. La protección se conserva si Terra vuelve a seleccionarse desde administración.

### 7.6 Conexión chatbot → mapa (tarjetas de área)
- **Qué**: al clicar una tarjeta de área en el chat, ya NO se abre `/area/[slug]` en pestaña nueva; ahora lleva AL MAPA con esa área seleccionada (centrada y con popup abierto). El chat se minimiza para poder retomarlo. Desde el popup del mapa el usuario ya tiene "Ver detalles".
- **Archivos**:
  - `components/chatbot/ChatbotWidget.tsx`: tarjeta convertida de `<Link target="_blank">` a `<button onClick={irAlMapa(slug)}>`. Nueva función `irAlMapa`: si `pathname === '/mapa'` dispara el evento `furgocasa:select-area` (CustomEvent con `{slug}`); si no, `router.push('/mapa?area=slug')` en la misma pestaña. Emite evento analytics `chatbot_area_to_map`.
  - `app/(public)/mapa/page.tsx`: nuevo `selectAreaBySlug(slug)` (busca por slug o id y llama a `handleAreaClick`, que ya ajusta el filtro de país si hace falta). Dos disparadores: (1) al cargar las áreas lee `?area=` de la URL (con ref anti-doble-ejecución, delay 400ms para que el mapa esté montado, y limpieza de la URL con `history.replaceState`); (2) listener del evento `furgocasa:select-area` para cuando el chat está abierto sobre el propio mapa.
- **NO se tocaron los 3 componentes de mapa**: MapLibre/Google/Leaflet ya centran y abren el popup cuando cambia la prop `areaSeleccionada` (verificado en `MapLibreMap.tsx` líneas ~310-332), así que se respeta la regla de sincronización de `.cursor/rules/mapas.mdc`.
- **Verificar**:
  1. En cualquier página (p.ej. home), preguntar al chatbot por áreas → clic en tarjeta → navega a `/mapa`, el mapa se centra en el área y abre su popup; la URL queda limpia (`/mapa` sin query).
  2. Con el chat abierto YA en `/mapa` → clic en tarjeta → el mapa se centra sin recargar la página y el chat queda minimizado.
  3. Funciona con los 3 proveedores de mapa (cambiar en /admin/configuracion).

### 7.7 Persistencia de la conversación + botón "Nueva conversación"
- **Problema**: al refrescar la página o reabrir el chat, la conversación se reseteaba aunque el histórico existiera en BD.
- **Archivos**:
  - `app/api/chatbot/historial/route.ts` (NUEVO): GET que identifica al usuario por su COOKIE de sesión (nunca por parámetros → un usuario no puede leer conversaciones ajenas) y devuelve su última conversación con los últimos 30 mensajes (lectura con service role).
  - `components/chatbot/ChatbotWidget.tsx`:
    - Al montar, restaura la conversación: 1º desde localStorage (`fc_chat_msgs` + `fc_chat_conv_id`, funciona también para anónimos); 2º si no hay nada local y el usuario está logueado, desde `/api/chatbot/historial`.
    - Persiste automáticamente los últimos 30 mensajes y el conversacionId en localStorage en cada cambio (solo si hay conversación real, no la bienvenida sola).
    - Botón **↻ "Nueva conversación"** en la cabecera: limpia la vista y el localStorage y pone conversacionId a null (la siguiente pregunta crea conversación nueva). **NO borra nada de la base de datos**: las conversaciones anteriores permanecen en `chatbot_conversaciones`/`chatbot_mensajes`.
- **Verificar**:
  1. Conversar con el chatbot → F5 → al reabrir el chat, la conversación sigue ahí (logueado y anónimo).
  2. Logueado, borrar localStorage → F5 → la conversación se recupera desde BD.
  3. Botón ↻ → la vista se resetea con bienvenida; comprobar en Supabase que las filas de la conversación anterior siguen existiendo; el siguiente mensaje crea un conversacionId nuevo.
  4. Seguridad: `/api/chatbot/historial` sin sesión devuelve `{conversacionId: null, messages: []}`.

---

## BLOQUE 8 — Higiene

- Eliminado `app/(public)/mapa/page.tsx.backup`.
- `README.md` actualizado (sección de auditoría/datos y política de costes).
- `scripts/*.log` añadidos a `.gitignore`.
- ⚠️ Pendiente manual: sacar `usuarios-nuevos.csv/json/xlsx` (datos personales) fuera de la carpeta del proyecto (están gitignored, pero mejor fuera).

---

## BLOQUE 9 — Analytics: pestaña RUTAS remozada (29 jul 2026)

- **Qué**: los 6 gráficos de la pestaña Rutas de `/admin/analytics` eran divs
  caseros sin ejes y con alturas distorsionadas (mínimo 40% para cualquier
  valor > 0, lo que hacía que un día con 1 evento pareciera casi igual que uno
  con 20). Sustituidos por gráficos recharts reales.
- **Archivo nuevo**: `components/admin/AnalyticsCharts.tsx` — componentes
  reutilizables: `ChartCard`, `SerieDiaria` (área con degradado, ejes, tooltip
  y línea de media), `BarrasMensuales` (barras + línea de km en eje secundario),
  `DonutDistribucion`, `KpiCard`. Usables desde cualquier otra pestaña.
- **Archivo**: `app/admin/analytics/page.tsx` — reescrito el bloque
  `{activeTab === 'rutas'}` (antes líneas ~2498-2779):
  - Fila de 4 KPIs nuevos: cálculos de ruta, rutas guardadas, distancia total
    y rutas/usuario, con hoy/semana/mes y **tasa de conversión cálculo→guardado**.
  - 4 series diarias (cálculos, guardadas, visitas, IA) ahora en grid 2×2 con
    ejes reales, tooltip y media de referencia.
  - 2 gráficos mensuales combinados: barras (conteo) + línea (km) con doble eje.
  - 2 donuts NUEVOS con datos que ya se calculaban pero no se mostraban:
    `rutasPorNumeroPuntos` y `distribucionDistancias`.
- **Verificar**:
  1. `npm run type-check` y `npm run build` (el sandbox local no pudo ejecutar
     tsc en esta sesión; verificar antes de push).
  2. `/admin/analytics` → pestaña Rutas: KPIs arriba, 4 series diarias con ejes,
     2 mensuales con línea de km, 2 donuts. Tooltips al pasar el ratón.
  3. Las demás pestañas (general, áreas, usuarios, tops, vehículos, engagement)
     quedan EXACTAMENTE igual — solo se tocó el bloque de rutas + 1 import.

---

## CHECKLIST DE VERIFICACIÓN RÁPIDA (para el agente)

1. `npm run type-check` → sin errores.
2. `npm run build` → compila.
3. Grep de seguridad (debe dar 0): `NEXT_PUBLIC_OPENAI|NEXT_PUBLIC_SERPAPI|NEXT_PUBLIC_SUPABASE_SERVICE` en `app/ lib/ components/ hooks/ scripts/`.
4. `next.config.js`: sin bloque `env:`, con `removeConsole`, y regla `/api/areas(?:\?.*)?$` ANTES de `/api/.*` en runtimeCaching.
5. `/mapa` accesible sin login y carga desde `/api/areas?v=` (Network: `s-maxage=30`, `total` ≈ 6100, hay `Reino Unido`).
6. Chatbot: funciona sin login; pregunta "voy de Madrid a Valencia, ¿dónde paro?" → usa `search_areas_along_route` y muestra tarjetas; cada respuesta crea fila en `chatbot_respuestas_log`.
7. Página de área: componente "¿Has estado aquí?" visible y funcional.
8. ~~Migraciones Supabase + backfill ratings~~ — **hechas** (`chatbot_evaluacion_ia`, `google_ratings_total`; ~4932 áreas con total; residual opcional ~306 con place_id y NULL).
9. Deploy: push a `main` → Vercel. Antes/después: limpiar/rotar claves en Vercel (Bloque 1.5).

---

## BLOQUE EXTRA — Reino Unido / piloto Gales (ago 2026)

- **Qué**: primer lote UK. En Gales no hay “área municipal” al uso: se importan **aires**, **stopovers**, **CL (Certified Locations)** y **touring/campsites**.
- **Resultado**: ~480 áreas, `pais=Reino Unido`, `comunidad=Gales`. Place Details recorta spillover de Inglaterra.
- **Tipos**: `publica` = aire/service point; `parking` = stopover; `privada` = CL; `camping` = touring park. Google `rv_park` ≠ área pública (en UK son holiday parks).
- **Archivos**: `scripts/scripts_empresas/import-wales-pilot.ts`, `config/paises-seo.ts` (`reino-unido`), `app/(public)/mapa-autocaravanas-reino-unido/page.tsx`, `app/sitemap.ts`.
- **Comandos**: `npm run import:wales:pilot` (dry-run) → `npm run import:wales:from-report`.
- **Verificar**: `/mapa?pais=Reino%20Unido` y landing `/mapa-autocaravanas-reino-unido`. Si no hay pines y el badge no suma las ~480, invalidar caché (`?v=` + Ctrl+F5).

---

## BLOQUE EXTRA — Huecos de cobertura península (ago 2026)

- **Qué**: detectar celdas de la península (sin islas) a más de **25 km** de cualquier área, agruparlas, y disparar Places (40 km) en los centroides.
- **Método**: malla 0,20° × 0,25° (~22 km) + haversine + componentes conexos. 16 huecos útiles (Alentejo, Arribes, Sierra Morena, Cuenca, Monegros, etc.).
- **Import**: ~169 fichas nuevas (España + Portugal). Términos ES (`área autocaravanas`) y PT (`parque de campismo`, `aire camping-car`).
- **Archivos**: `scripts/scripts_empresas/import-iberia-gaps.ts`.
- **Comandos**: `npm run import:iberia:gaps` → `npm run import:iberia:gaps -- --from-report --import`.
- **Verificar**: filtro España/Portugal más denso en Alentejo e interior; no debe haber pines en Canarias por este script.

---

## BLOQUE EXTRA — Huecos Italia (ago 2026)

- **Qué**: malla 25 km sobre península + Sicilia + Cerdeña. 914 soste previas, todas públicas.
- **Huecos**: Sicilia (sur/SE/Madonie), Cerdeña (Barbagia/Sarrabus/Nurra), Marche, Emilia, Valtellina, Verbano, Sannio, Apenino, Ossola, Tavoliere, Gargano, Basilicata.
- **Términos**: area sosta camper, sosta camper, campeggio camper. Sosta = área pública.
- **Comandos**: `npm run import:italia:gaps` → `--from-report --import`.

---

## BLOQUE EXTRA — Huecos Francia (ago 2026)

- **Qué**: malla 25 km sobre metrópoli + Córcega. 1192 aires previas, todas públicas.
- **Huecos**: Perche, Ardenas, Finistère, Béarn, Córcega, Lorena, Ariège, Poitou, Livradois, Gers, Bessin, Bugey, Beauce, Diois.
- **Términos**: aire camping-car, aire de service, camping camping-car. Camping-Car Park = privada.
- **Comandos**: `npm run import:francia:gaps` → `--from-report --import`.

---

## BLOQUE EXTRA — Huecos Alemania (ago 2026)

- **Qué**: misma malla 25 km. 395 áreas previas (todas públicas); ~47 % celdas vacías.
- **Huecos**: Brandeburgo/Prignitz/Fläming, Alto Palatinado, Bosque Bávaro, Sarre, Emsland, Selva Negra, Turingia, Rügen, Fehmarn, Frisia Norte, Sauerland, Teutoburgo, Holstein, Eifel.
- **Términos**: Wohnmobilstellplatz, Stellplatz Wohnmobil, Campingplatz Wohnmobil. Stellplatz = área (no stopover UK).
- **Comandos**: `npm run import:alemania:gaps` → `--from-report --import`.

---

## BLOQUE EXTRA — Caché del listado de áreas (ago 2026)

- **Qué**: `/api/areas` devolvía 6118 (sin Baleares) con `x-vercel-cache: MISS` porque Next 14 cacheaba el `fetch` interno a Supabase.
- **Fix**: `fetchCache = 'force-no-store'` + `cache: 'no-store'` en el cliente Supabase del API. El mapa usa `?t=` cada 30 s (sin bump manual).
- **PWA**: timeout NetworkFirst 5 s → 20 s (si no, servía el dataset viejo de 7 días).
- **Latencia esperada**: un área nueva en BD aparece en el mapa en **≤ 30 s**. No hace falta pedir un deploy.
- **Verificar**: `/api/areas` `total` ≥ 6138 y pines en Mallorca/Menorca/Ibiza.

---

## BLOQUE EXTRA — Tipos de ubicación (ago 2026)

- **Qué**: 4 tipos claros en mapa y filtro: **área pública** (municipal), **área privada**, **camping**, **stopover** (`parking` en BD).
- **Colores**: azul / naranja / verde / violeta.
- **Datos**: recategorización por nombre en ES, PT y LatAm (~1620). UK se dejó (Gales ya venía clasificado). FR/IT/DE no se tocan.
- **UI**: filtro «Tipo de ubicación» en el panel izquierdo.
- **Archivos**: `lib/areas/tipo-area.ts`, `components/mapa/FiltrosMapa.tsx`, `hooks/usePersistentFilters.ts`.
- **Verificar**: `/mapa?v=20260821-tipos` + Ctrl+F5; España ya no es todo azul.

---

## BLOQUE EXTRA — Islas Baleares (ago 2026)

- **Qué**: misma fórmula de huecos. En BD había **0** áreas en Mallorca, Menorca, Ibiza y Formentera.
- **Método**: 13 disparos Places (~25 km de tierra, radio 40 km) + filtro islas. Se excluyen alquileres/agencias.
- **Import**: 20 fichas (Mallorca 9, Menorca 8, Ibiza 3). Formentera: Google no devolvió área/camping útil.
- **Archivos**: `scripts/scripts_empresas/import-iberia-gaps.ts` (`--region=baleares`).
- **Comandos**: `npm run import:baleares:gaps` → `--from-report --import`.
- **Verificar**: `/mapa` centrado en Baleares; `?v=20260821-baleares` + Ctrl+F5.

---

## BLOQUE EXTRA — México (trailer / RV parks)

- **Qué**: apertura de México en BD (~395 áreas) + agente `import-mexico-pilot.ts` + UI/SEO.
- **Import**: fase 1 Baja+Jalisco (232) desde informe; fase 2 Sonora/Nayarit/Sinaloa/Yucatán/Q.Roo/Guanajuato (163).
- **Archivos**: `scripts/scripts_empresas/import-mexico-pilot.ts`, `app/(public)/mapa/page.tsx`, mapas (zoom México), `config/paises-seo.ts`, `app/(public)/mapa-casas-rodantes-mexico/page.tsx`, chatbot stats LatAm.
- **Verificar**: filtro país México en `/mapa` muestra ~395 pins; landing `/mapa-casas-rodantes-mexico`.

---

## BLOQUE — Indie Campers → datos de mercado (valoración)

- **Qué**: ingesta de ~693 precios de flota Indie Campers en `datos_mercado_autocaravanas` para nutrir el paso 2B de valoración IA.
- **Criterio fiscal**: el precio listado trae IVA del **país de matriculación**. Se guarda `precio` = **neto sin IVA** (`bruto / (1+IVA)`). IVA usados: DE 19%, IT 22%, PT 23%, ES/BE 21%, FR 20%.
- **Metadatos por fila**:
  - `origen` = `Indie Campers`
  - `tipo_dato` = `venta_anuncio`
  - `pais` = país de matriculación
  - `region` = `IVA xx% | bruto xxxx€ | VIN …` (auditoría)
  - `verificado` = true, `estado` = Usado
- **Sesgo**: son precios de **salida de flota de alquiler** (km altos), no particular retail puro. La IA los ve etiquetados como flota / neto sin IVA.
- **Archivos**:
  - `scripts/parse-indie-campers-pdf.py` — parseo PDF → `scripts/data/indie-campers-fleet.json`
  - `scripts/import-indie-campers-mercado.js` — dry-run / `--confirm` (dedupe por VIN)
  - `app/api/vehiculos/[id]/ia-valoracion/route.ts` — etiquetado de comparables Indie en título/fuente/nota
  - npm: `parse:indie-campers`, `import:indie-campers`, `import:indie-campers:confirm`
- **Lote importado (2026-08-11)**: 693 filas (VW 330, Weinsberg 281, Mercedes 32, Trigano/Carado/Etrusco/Pilote…). Países: DE 542, IT 59, PT 41, BE 26, ES 21, FR 4. Neto medio ~41.656 €.
- **Verificar**:
  1. En Supabase: `select count(*) from datos_mercado_autocaravanas where origen = 'Indie Campers'` → 693.
  2. Re-ejecutar `npm run import:indie-campers` → 0 nuevos (idempotente).
  3. Lanzar valoración IA de un Weinsberg/VW California y comprobar comparables con fuente Indie Campers.

---

## BLOQUE — Agente de textos sin SerpAPI (21 ago 2026)

- **Qué**: el agente de descripciones queda como el lote de España de hoy: `gpt-5.6-terra` + `web_search` obligatoria, `reasoning.effort` medium. Se elimina el refuerzo SerpAPI (snippets genéricos del pueblo).
- **Prompt**: busca el recinto (ayto, Park4night, web del camping), cifras y topónimos; prohíbe el molde viejo («encantador municipio», «no hay información», «aquí tienes una guía»).
- **Archivos**: `app/api/admin/enrich-description/route.ts`, `app/api/admin/ia-config/route.ts`, `scripts/bulk-enrich.js`, `app/admin/areas/enriquecer-textos/page.tsx`.
- **Producción**: `ia_config.enrich_description` actualizado (prompts + effort medium).
- **Verificar**: `/admin/configuracion` → Enriquecer Textos: effort medium y el prompt nuevo. Regenerar un área vieja tipo Yanguas/Baralla y comparar.

---

## BLOQUE — Unificación de modelos de texto a GPT-5.6 Terra (21 ago 2026)

- **Qué**: todos los agentes de texto pasan a `gpt-5.6-terra` (equilibrio inteligencia/coste). Las imágenes de áreas siguen en `gpt-image-2`.
- **Producción (Supabase, efecto inmediato)**:
  - `chatbot_config` (Tío Viajero): `gpt-4o-mini` → `gpt-5.6-terra` (cambio histórico; el modelo activo volvió a `gpt-4o-mini` el 21 ago 2026)
  - `ia_config.valoracion_vehiculos`: `gpt-5.4-mini` → `gpt-5.6-terra`
  - `ia_config.enrich_description`: `gpt-5.5` → `gpt-5.6-terra`
  - `ia_config.scrape_services`: `gpt-5.5` → `gpt-5.6-terra`
- **Código**: constante `DEFAULT_OPENAI_MODEL` en `lib/openai/model-validation.ts`. Defaults de admin, extract de anuncios y scripts (`bulk-enrich`, `enrich-datos-estructurados`, `translate-descriptions`, `evaluar-respuestas-chatbot`, etc.) alineados.
- **Coste**: scrape/enrich deberían bajar (salían de `gpt-5.5`). El Tío Viajero sube de precio (alto volumen; vigilar factura). Si hace falta, bajar solo el chatbot desde `/admin/configuracion`.
- **Verificar**:
  1. `/admin/configuracion`: modelo `gpt-4o-mini` en chatbot; `gpt-5.6-terra` en valoración, enrich y scrape.
  2. Una pregunta al Tío Viajero → `chatbot_respuestas_log.modelo` = `gpt-4o-mini`.
  3. Una valoración IA o un enrich de área usa Terra (campo `modelo` en la respuesta/log).

---

## BLOQUE — Embudo de engagement (21 ago 2026)

> Guía: `GUIA_ENGAGEMENT.md`. Checklist de verificación en su §6.

### Favoritos sin cuenta + sync
- **Archivos**: `lib/favoritos/local.ts`, `components/ui/FavoritosSync.tsx` (layout), `components/area/DetalleAreaHeader.tsx`
- **Verificar**: incógnito, corazón en una ficha → badge + banner. Tras login, fila en `favoritos` y toast de sync.

### AuthModal y WelcomeModal
- **Archivos**: `components/ui/AuthModal.tsx`, `components/ui/WelcomeModal.tsx`, `app/(public)/auth/login/page.tsx`
- **Verificar**: WelcomeModal solo en `/`. En `/area/...` no aparece. Estuve aquí / guardar ruta abren modal, no redirigen a `/auth/login` perdiendo contexto. Login clásico honra `?next=`.

### Estuve aquí
- **Archivo**: `components/area/ValoracionesCompleto.tsx`
- **Verificar**: un botón; estrellas + Publicar → `visitas` + `valoraciones`. Sin “Registrar visita” y “Escribir valoración” separados.

### Planificador
- **Archivo**: `components/ruta/PlanificadorRuta.tsx`
- **Verificar**: guardar sin sesión abre AuthModal (ruta no se pierde). Tras guardar, si hay áreas, modal para añadirlas a favoritos.

### Home + ficha + navbar (furgo visible)
- **Archivos**: `components/ui/HerramientasVehiculo.tsx`, `app/page.tsx`, `app/(public)/area/[slug]/page.tsx`, `components/layout/Navbar.tsx`, `lib/i18n/ui.ts` (`nav_furgo`)
- **Verificar**: bloque de 3 tarjetas en ficha (bajo valoraciones) y bajo el hero de la home. Con sesión, icono camión en navbar → `/mis-autocaravanas`.

### Chatbot
- **Archivo**: `components/chatbot/ChatbotWidget.tsx`
- **Verificar**: corazón en cards; “Guardar estas N áreas”; chips a `/valoracion-ia-vehiculos` y `/sistema-reporte-accidentes`.

### Digest semanal
- **Archivos**: `app/api/cron/digest-semanal/route.ts`, `vercel.json` (`0 9 * * 5`)
- **Verificar**: sin `RESEND_API_KEY` → `{ skipped: true }`. Con key + favoritos → email. Variables documentadas en `.env.example` y `GUIA_ENGAGEMENT.md` §5.

### Tracking
- **Archivo**: `lib/analytics/track.ts` (tipos ya existían; ahora se disparan)
- **Verificar**: en `user_interactions`, eventos `area_favorite`, `area_rate`, `area_visit_register`, `route_save` tras usar esas acciones.

---

## BLOQUE — Estética 3.0 (21 ago 2026)

> Guía completa del sistema visual: `GUIA_DISENO_V3.md`. Commits: `99df132`,
> `ad6883b`, `581b0a9`, `ce0a6b4`, `9124956`, `d6c52f9`, `ad06b32`, `f586422`.

### Tokens de marca y tipografía
- **Qué**: paleta corporativa (`primary` azul `#0b3c74`, `accent` naranja `#ff6b35`, `tipo.*`), fuentes Inter/Outfit vía `next/font`, sombras `card`/`overlay`.
- **Archivos**: `tailwind.config.ts`, `app/layout.tsx`, `app/globals.css`
- **Verificar**: `h1`–`h4` renderizan en Outfit; `grep -r "sky-" components/mapa` no devuelve estilos activos en los controles renovados.

### Basemap propio + entrada cinematográfica
- **Qué**: `applyBrandTheme()` re-pinta el estilo MapTiler en runtime (agua `#4d749e` = azul + 25% blanco); vuelo inicial desde Europa una vez (`hasFlownRef`); marcadores con caída escalonada.
- **Archivos**: `lib/map/brand-style.ts` (nuevo), `components/mapa/MapLibreMap.tsx`, `components/area/MapaUbicacion.tsx`
- **Verificar**: en `/mapa` con MapLibre el agua es azul claro de marca y los POIs comerciales no salen; el mini-mapa de una ficha comparte tema.

### Splash de carga
- **Qué**: sustituye la pantalla completa bloqueante por tarjeta flotante translúcida. El van es un Ducato H2 L3 (`SplashFurgo`), no un cuña; bota con `fc-van-bob`. Textos en `lib/i18n/ui.ts` (`splash_*`). Barra `fc-bar-slide`. El mapa se ve y se mueve debajo.
- **Archivos**: `app/(public)/mapa/page.tsx`, `lib/i18n/ui.ts`, `app/globals.css`
- **Verificar**: al cargar `/mapa` el mapa es visible tras el splash; la furgo tiene caja alta y morro corto, sin raya azul suelta; el texto habla de +9.000 áreas en +25 países; el splash se desvanece al llegar las áreas.

### Móvil: controles del mapa
- **Qué**: GPS y Restablecer zoom solo-icono (texto `hidden md:inline` + `aria-label`); buscador plegado a lupa circular alineada con el contador (fila `top-3`), se expande con foco al tocarla; wrapper con `pointer-events-none` para no bloquear el arrastre; z-index de controles bajado de `z-[1000]` a `z-30`; sin `autoFocus` en el buscador de país.
- **Archivos**: `components/mapa/BuscadorGeografico.tsx`, `MapLibreMap.tsx`, `MapaInteractivoGoogle.tsx`, `LeafletMap.tsx`, `FiltrosMapa.tsx`
- **Verificar**: en móvil la fila superior es contador + lupa + zooms en una línea; al abrir un sheet nada del mapa lo tapa; abrir filtro de país no levanta el teclado.

### Filtros 3.0
- **Qué**: cabecera interna solo desktop (adiós doble «Filtros + X» en móvil); tipos como tarjetas con color de `getTipoAreaColor()`; servicios en chips 2 col; precio segmentado; características en acento; footer con «Ver resultados (N)» (cierra sheet) y «Limpiar filtros (n)» deshabilitado a 0; clave i18n `show_results` en 5 idiomas.
- **Archivos**: `components/mapa/FiltrosMapa.tsx`, `lib/i18n/ui.ts`
- **Verificar**: en móvil el sheet de filtros muestra una sola cabecera; tocar «Área pública» enciende la tarjeta en azul `#0284c7`; «Ver resultados» cierra la hoja.

### Micro-interacciones y ficha
- **Qué**: BottomSheet con Framer Motion + arrastre para cerrar; corazón favorito con pop; secciones de ficha unificadas (`rounded-2xl shadow-card`); popup del mapa con chips píldora y botones de marca; logo blanco en footer.
- **Archivos**: `components/mobile/BottomSheet.tsx`, `components/area/DetalleAreaHeader.tsx`, `components/area/GaleriaFotos.tsx` (+ resto de secciones), `components/mapa/areaPopup.ts`, `components/layout/Footer.tsx`
- **Verificar**: arrastrar el sheet hacia abajo lo cierra con muelle; togglear favorito hace pop; el popup de un área usa botón azul `#0b3c74` y chips redondos.

### Pendiente (fase siguiente)
- Pines con silueta de furgo + card flotante deslizable; transición card → ficha. Detalle en `GUIA_DISENO_V3.md` §8.

---

## BLOQUE — Splash Ducato (22 ago 2026)

### Perfil H2 L3 y copy de espera
- **Qué**: se redibujó el SVG del splash (nave/cuña → Ducato H2 L3 camperizado) y se cambió el texto a “más de 9.000 áreas en más de 25 países” + frases rotatorias. Se quitó la carretera azul que se confundía con el chasis.
- **Archivos**: `app/(public)/mapa/page.tsx` (`SplashFurgo`), `lib/i18n/ui.ts` (claves `splash_*` en ES/EN/FR/DE/IT)
- **Verificar**: Ctrl+F5 en `/mapa`. Caja alta, batalla larga, parabrisas y toldo visibles; ninguna línea sale del morro ni del portón; copy y chistes en el idioma activo.

---

## BLOQUE — Buscadores sin tildes (22 ago 2026)

### Matching insensible a acentos
- **Qué**: `rio` encuentra `Río`, `cordoba` encuentra `Córdoba`. Aplica al filtro «Buscar área, ciudad…», al buscador «¿A dónde ir?» y al buscador de país. Helper `sinTildes()` en `lib/areas/slug.ts` (NFD + quitar diacríticos).
- **Archivos**: `lib/areas/slug.ts`, `app/(public)/mapa/page.tsx`, `components/mapa/BuscadorGeografico.tsx`, `components/mapa/FiltrosMapa.tsx`
- **Verificar**: en `/mapa` escribir `rio` o `murcia rio` y ver «Área Camper Murcia Río» en Lugares y en el desplegable del mapa. `mexico` debe listar México en País / Región.
