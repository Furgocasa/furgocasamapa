# 📋 CAMBIOS_CURSOR — Registro de cambios para verificación

> Documento para que el agente de Cursor verifique, paso a paso, todos los
> cambios realizados el **28 de julio de 2026** con Claude (Cowork).
> Cada bloque indica: qué se cambió, en qué archivos, y CÓMO verificarlo.
> Complementa a `PLAN_MEJORAS.md` (visión de producto y pasos manuales).

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
- **Archivo nuevo**: `app/api/areas/route.ts` — devuelve todas las áreas activas en 1 respuesta con `Cache-Control: public, s-maxage=600, stale-while-revalidate=3600` (CDN de Vercel; Supabase se consulta ~1 vez/10min en vez de 5-6 queries por visitante). Soporta `?lang=`.
- **Verificar**: `curl -I https://www.mapafurgocasa.com/api/areas` → cabecera Cache-Control presente; JSON con `{ areas: [...], total }`.

### 3.2 El mapa consume el endpoint con fallback
- **Archivo**: `app/(public)/mapa/page.tsx` — `loadAreas()` intenta `fetch('/api/areas')` y, si falla, cae al método anterior (paginación directa Supabase). No se rompe nada si el endpoint no está.

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
- Investiga con GPT-5.5 + web_search los servicios/precio/plazas que FALTAN. Con `--apply` solo escribe campos VACÍOS y solo con confianza "alta". Nunca sobreescribe datos existentes. Checkpoint propio.

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
- **Archivo**: `next.config.js` — en `runtimeCaching`, ANTES de la regla genérica `/api/* NetworkOnly`: `/api/areas` NetworkFirst (incluye `?lang=`, 1 semana) + tiles MapTiler y OpenStreetMap CacheFirst (30 días).
- **Verificar**: el orden de las reglas importa; `/api/areas(?:\?.*)?$` debe ir antes que `/api/.*`.

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
- **Migración**: `supabase/migrations/20260728_chatbot_evaluacion_ia.sql` — ⚠️ **PENDIENTE de ejecutar en Supabase** (añade `valoracion_ia`, `motivo_ia`, `sugerencia_ia`, `evaluado_at`).
- **Script nuevo**: `scripts/evaluar-respuestas-chatbot.js` | **Comando**: `npm run evaluar:chatbot` (dry-run; `EVAL_RUN=1` ejecuta; `EVAL_LIMIT` def 200).
- Clasifica cada respuesta como correcta/mejorable/incorrecta, con motivo y sugerencia. **Verifica hechos contra los datos reales de las áreas en BD** (carga las áreas de `areas_ids` y compara precios/servicios). Cola = filas con `evaluado_at IS NULL` (reanudable, sin duplicados).
- La página `/admin/chatbot-respuestas` incluye filtros y badges por veredicto IA.
- **Flujo de afinado**: evaluar → filtrar incorrectas → aplicar sugerencias al system prompt (editable en /admin) → repetir y comparar %.

---

## BLOQUE 8 — Higiene

- Eliminado `app/(public)/mapa/page.tsx.backup`.
- `README.md` actualizado (sección de auditoría/datos y política de costes).
- `scripts/*.log` añadidos a `.gitignore`.
- ⚠️ Pendiente manual: sacar `usuarios-nuevos.csv/json/xlsx` (datos personales) fuera de la carpeta del proyecto (están gitignored, pero mejor fuera).

---

## CHECKLIST DE VERIFICACIÓN RÁPIDA (para el agente)

1. `npm run type-check` → sin errores.
2. `npm run build` → compila.
3. Grep de seguridad (debe dar 0): `NEXT_PUBLIC_OPENAI|NEXT_PUBLIC_SERPAPI|NEXT_PUBLIC_SUPABASE_SERVICE` en `app/ lib/ components/ hooks/ scripts/`.
4. `next.config.js`: sin bloque `env:`, con `removeConsole`, y regla `/api/areas(?:\?.*)?$` ANTES de `/api/.*` en runtimeCaching.
5. `/mapa` accesible sin login y carga desde `/api/areas` (ver Network).
6. Chatbot: funciona sin login; pregunta "voy de Madrid a Valencia, ¿dónde paro?" → usa `search_areas_along_route` y muestra tarjetas; cada respuesta crea fila en `chatbot_respuestas_log`.
7. Página de área: componente "¿Has estado aquí?" visible y funcional.
8. Migraciones pendientes en Supabase SQL Editor:
   - `20260728_chatbot_evaluacion_ia.sql` (si aún no)
   - `20260728_google_ratings_total.sql` (nº de reseñas para ranking ponderado del chat)
   Tras la de ratings: `npm run backfill:ratings` (dry) y luego `npm run backfill:ratings:run` (Google de pago, por lotes).
9. Deploy: push a `main` → Vercel. Antes/después: limpiar/rotar claves en Vercel (Bloque 1.5).

---

## BLOQUE EXTRA — México (trailer / RV parks)

- **Qué**: apertura de México en BD (~395 áreas) + agente `import-mexico-pilot.ts` + UI/SEO.
- **Import**: fase 1 Baja+Jalisco (232) desde informe; fase 2 Sonora/Nayarit/Sinaloa/Yucatán/Q.Roo/Guanajuato (163).
- **Archivos**: `scripts/scripts_empresas/import-mexico-pilot.ts`, `app/(public)/mapa/page.tsx`, mapas (zoom México), `config/paises-seo.ts`, `app/(public)/mapa-casas-rodantes-mexico/page.tsx`, chatbot stats LatAm.
- **Verificar**: filtro país México en `/mapa` muestra ~395 pins; landing `/mapa-casas-rodantes-mexico`.
