# 📋 Plan de Mejoras — Mapa Furgocasa

> Documento de seguimiento. Se actualiza conforme avanza la implementación.
> Iniciado: 28 julio 2026

## Estado general

| # | Mejora | Estado | Impacto |
|---|--------|--------|---------|
| 1 | Abrir el mapa sin login | ✅ Hecho | Crecimiento/SEO |
| 2 | Contribuciones de usuarios (verificar servicios/precio) | ✅ Hecho (fase 1) | Datos/foso competitivo |
| 3 | Internacionalización fase 1 (traducciones IA) | ✅ Hecho (fase 1) | Mercado x5 |
| 4 | Modo offline PWA | ✅ Hecho | Fidelidad |
| 5 | MapLibre por defecto | ✅ Hecho | Coste/mantenimiento |
| 6 | Higiene técnica | ✅ Hecho (fase 1) | Deuda técnica |
| 7 | Tío Viajero IA renovado | ✅ Hecho | Conversión/UX |
| 8 | Embudo de engagement + visibilidad furgo | ✅ Hecho (21 ago 2026) | Retención / adopción |
| 9 | Estética 3.0 (marca, basemap, móvil, filtros) | ✅ Hecho fase 1 (21 ago 2026) | Percepción de producto / UX |
| 10 | Mapa al servicio del alquiler (CTA ficha, banners, onboarding cliente) | 🔄 Ficha hecha (22 ago 2026) | Ingresos Furgocasa / marca |

---

## Mejora 1 — Abrir el mapa sin login

**Qué**: quitar el `LoginWall` y el blur de `/mapa`. El login se mantiene para
favoritos, rutas guardadas, perfil y vehículos.

**Por qué**: el mapa es la página principal; bloquearla antes de mostrar valor
mata conversión y SEO.

**Cambios**:
- [x] `app/(public)/mapa/page.tsx`: eliminado LoginWall, blur y bloqueo por authLoading (28 jul 2026)

---

## Mejora 2 — Contribuciones de usuarios

**Qué**: botón "¿Estuviste aquí?" en el detalle de área para confirmar
servicios, precio y plazas en 3 taps. Las contribuciones se guardan en una
tabla nueva; cuando 2+ usuarios coinciden en un dato, es candidato a aplicarse.

**Por qué**: convierte a los visitantes en el pipeline de verificación de
datos. Es el único activo que la competencia no puede copiar.

**Cambios**:
- [x] Migración SQL `supabase/migrations/20260728_area_contribuciones.sql` (con RLS, anti-spam 1/día) ✅ ejecutada
- [x] Componente `components/area/ConfirmarDatosArea.tsx` (inserción directa con RLS, sin API extra)
- [x] Integrado en la página de detalle de área, bajo los servicios
- [ ] (Fase 2, pendiente) Panel admin para revisar/aplicar contribuciones y aplicación automática con 2+ coincidencias

---

## Mejora 3 — Internacionalización (datos + UI selector)

**Qué**: tabla `areas_traducciones` (nombre, descripción, ubicación) + script OpenAI
(FR, DE, IT, EN) + selector de idioma en Navbar (mapa y ficha).

**Por qué**: el grueso del mercado europeo de autocaravanas no habla español.

**Cambios**:
- [x] Migración SQL `supabase/migrations/20260728_areas_traducciones.sql` ✅ ejecutada
- [x] Migración SQL `supabase/migrations/20260728_areas_traducciones_campos.sql` ✅ ejecutada
- [x] Script `npm run translate` (dry-run por defecto; `TRAD_RUN=1` para traducir; JSON multi-campo; reanudable)
- [x] `lib/i18n` + selector en Navbar + `/api/areas?lang=` + ficha de área
- [x] UI pública ampliada: home, footer, welcome, auth, landings chrome, InstallAppCTA (admin sigue en ES)
- [x] `/ruta`, LoginWall, PlanificadorRuta (chrome + modales)
- [x] `/perfil` + tabs (favoritos, rutas, valoraciones, visitas)
- [x] `/accidente` (formulario y mensajes; FAQ marketing residual en ES)
- [ ] Residuales: FAQs, vehículos, SEO landings, copy marketing accidente
- [ ] Reanudar `npm run translate` cuando haya cuota OpenAI (~1.6k pendientes)
- [ ] (Backlog) Rutas SEO i18n en Next (`/fr/aire-camping-car-...`)

---

## Mejora 4 — Modo offline PWA

**Qué**: cachear en el service worker el dataset de áreas (`/api/areas`) y los
tiles del mapa, para que la app funcione sin cobertura.

**Por qué**: el usuario nos necesita más justo cuando no tiene cobertura.

**Cambios**:
- [x] `next.config.js`: NetworkFirst para `/api/areas` (incluye `?lang=`; copia offline hasta 7 días solo sin red)
- [x] `next.config.js`: CacheFirst para tiles MapTiler y OpenStreetMap (30 días)
- [x] CDN Vercel de `/api/areas` bajado a **30 s** sin stale (ago 2026): un import se ve al recargar; antes 10 min + 1 h de lista vieja

---

## Mejora 5 — MapLibre por defecto

**Qué**: el fallback pasa de `google` a `maplibre`. El selector de admin sigue
funcionando (Google y Leaflet siguen disponibles).

**Por qué**: MapLibre es gratis; Google Maps JS factura por carga. Si la config
de BD falla, mejor caer en el gratuito.

**Cambios**:
- [x] `hooks/useMapConfig.ts`: DEFAULT_CONFIG.proveedor = 'maplibre' (solo el fallback; el selector admin sigue igual)
- [ ] (Decisión de negocio pendiente) retirar Google/Leaflet del todo

> ℹ️ El planificador `/ruta` usa Google Maps + Directions directamente y NO pasa
> por useMapConfig: **no se ve afectado** y se mantiene con Google a propósito
> (el cálculo de rutas de Google no tiene equivalente gratuito comparable).

---

## Mejora 6 — Higiene técnica

**Cambios**:
- [x] Eliminado `app/(public)/mapa/page.tsx.backup`
- [x] Verificación sintáctica de todos los archivos tocados
- [x] Eliminado fallback `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` en scripts
- [ ] ⚠️ PENDIENTE (manual): mover `usuarios-nuevos.csv/json/xlsx` (datos personales) fuera de la carpeta del proyecto
- [ ] (Backlog) Trocear page.tsx del mapa, tipar `any`, tests de filtros

---

## Mejora 7 — Tío Viajero IA renovado (28 jul 2026)

**Modelo** (21 ago 2026): `gpt-4o-mini` en `chatbot_config`. Se eligió para el chatbot por coste, latencia y compatibilidad directa con function calling; los agentes de enriquecimiento mantienen `gpt-5.6-terra`. Editable en `/admin/configuracion`.

**Motor** (`app/api/chatbot/route.ts` + `lib/chatbot/functions.ts`):
- [x] Migrado de la API obsoleta `functions` a la moderna `tools` con **bucle de hasta 4 rondas**: puede encadenar y combinar varias búsquedas en un mensaje ("compara áreas gratis en Granada y Sevilla")
- [x] Responde en el **idioma de la interfaz** del usuario (es/en/fr/de/it)
- [x] Nueva función `get_area_by_name` ("háblame del área de Ronda")
- [x] Nueva función `search_areas_along_route` (paradas entre dos ciudades, geocodificación Nominatim GRATIS, ordenadas origen→destino)
- [x] Nuevo filtro `valoracion_minima` en las búsquedas
- [x] Deduplicación de áreas entre búsquedas para las tarjetas

**Widget** (`components/chatbot/ChatbotWidget.tsx`):
- [x] **Abierto sin login** (rate limit por IP ya existente; con cuenta se guarda el historial)
- [x] **Tarjetas de áreas** con foto, precio, valoración ★ y distancia/desvío, enlazando a `/area/...` (antes: texto plano)
- [x] **Mensajes prefijados** (chips) al iniciar conversación, localizados en 5 idiomas
- [x] Bienvenida, placeholder y textos localizados según idioma de la web

**Pendiente (fase 2)**: streaming de respuestas (SSE) para percepción de velocidad.

**Auditoría de respuestas** (28 jul 2026 + 21 ago 2026):
- [x] Migración `20260728_chatbot_respuestas_log.sql` ✅ ejecutada
- [x] TODAS las respuestas (también de anónimos) se registran con pregunta, respuesta, búsquedas ejecutadas, tokens, modelo y duración
- [x] Página `/admin/chatbot-respuestas`: tabla (fecha, usuario, tipo, mensaje, respuesta, categorización), quesito de %, detalle expandible, marcar revisada
- [x] Círculo revisión → corrección (regla `.cursor/rules/chatbot-revision.mdc`): evaluar no cierra el ciclo; hay que parchear y pushear

**Agente revisor IA** (28 jul 2026):
- [x] Código y script listos (`npm run evaluar:chatbot`)
- [x] Migración `20260728_chatbot_evaluacion_ia.sql` — **ya aplicada en Supabase** (columnas `valoracion_ia`, etc. verificadas)
- [x] `/admin/chatbot-respuestas`: filtros por veredicto IA, badges y bloque con motivo/sugerencia
- [x] Calidad (21 ago): null ≠ Gratis; GPS 0,0 ignorado; geo por Nominatim; alias POI; prompt no hereda filtros de ciudad suelta

---

## Mejora 8 — Embudo de engagement + visibilidad de furgo (21 ago 2026)

**Guía completa**: [GUIA_ENGAGEMENT.md](./GUIA_ENGAGEMENT.md)

**Qué**: el tráfico aterriza en fichas de área y se va. Favoritos, visitas,
valoraciones, tasación IA, registro de vehículo y QR casi no se usaban
porque pedían login demasiado pronto o porque no se veían.

**Cambios**:
- [x] Favoritos locales (`lib/favoritos/local.ts`) + sync al login (`FavoritosSync`)
- [x] `AuthModal` inline (Google + email mínimo); `?next=` en login clásico
- [x] `WelcomeModal` solo en `/`
- [x] “Estuve aquí”: visita + estrellas en un modal (`ValoracionesCompleto`)
- [x] Planificador: login inline al guardar; ofrecer áreas de la ruta como favoritos
- [x] Home logada: sitios + última ruta; visitante: bloque furgo bajo el hero
- [x] Chatbot: corazón en cards + chips tasación IA / QR
- [x] Bloque “Tu furgo también vive aquí” en cada ficha (`HerramientasVehiculo`)
- [x] Navbar: acceso visible a `/mis-autocaravanas` si hay sesión
- [x] Cron digest semanal `GET /api/cron/digest-semanal` (Resend; skip si no hay key)
- [x] Tracking `area_favorite`, `area_rate`, `area_visit_register`, `route_save`

**Pendiente (manual, Vercel)**:
- [ ] `RESEND_API_KEY` + dominio verificado; opcional `EMAIL_FROM`, `CRON_SECRET`
- [ ] Maquetar el HTML del digest según `mail_mapas/REGLAS_MAQUETACION_EMAILS.md` (Outlook)

---

## Mejora 9 — Admin 3.0 con sidebar (22 ago 2026)

**Qué**: el panel `/admin` era una parrilla plana de 15 tarjetas y cada página
montaba el Navbar público por su cuenta; funciones de áreas (nueva, búsqueda
masiva, enriquecer…) aparecían sueltas al mismo nivel que Usuarios o Analíticas.

**Cambios** (commit `2bcc421`; detalle en `CAMBIOS_CURSOR.md` → «Admin 3.0»):
- [x] `app/admin/layout.tsx`: sidebar oscuro con grupos desplegables (Áreas /
  IA y Chatbot / Datos y análisis / Sistema), topbar con «Ver web», usuario +
  logout, hamburguesa móvil. Navegación en el array `NAV`.
- [x] Auth admin centralizada en el layout (antes 4 páginas sin check de cliente)
- [x] Las 17 páginas admin sin `Navbar` público
- [x] Dashboard `/admin`: contadores en vivo (activas / inactivas / sin texto)
  + accesos agrupados
- [x] Tokens de marca (`primary`/`accent`) en layout y dashboard

**Pendiente (cosmético, sin prisa)**: migrar el `sky-*` legado del interior de
las páginas admin a tokens cuando se toquen por otro motivo.

---

## Mejora 10 — Mapa al servicio del alquiler (22 ago 2026)

**Guía**: [GUIA_MAPA_ALQUILER.md](./GUIA_MAPA_ALQUILER.md)

**Qué**: el mapa nació para el viajero de Furgocasa y para llevar tráfico al
alquiler. La ficha SEO hoy sortea banners 50/50 con CasiCinco y empuja IA/QR.
El CTA de dinero es `furgocasa.com/es` genérico.

**Ficha (hecho, 22 ago 2026):** CTA de alquiler con banner de foto
Furgocasa, solo España; Casi Cinco como banner de restaurantes al final,
solo España. Onboarding del que ya pagó: pendiente.

**Leads a dueños (documentado, no implementar aún):** §12 de
`GUIA_MAPA_ALQUILER.md`. España tiene 850 privadas+campings activas, 772
con teléfono. Mercado = WhatsApp/lead, no OTA.

---

## Pasos manuales pendientes (Narciso)

1. ~~**Supabase SQL Editor**: migraciones `chatbot_evaluacion_ia` y `google_ratings_total`~~ — **hechas** (verificado en BD). Backfill ratings casi completo (~4.9k con valor; residual opcional ~300 con `place_id` y total NULL).
2. **Vercel**: borrar variables `NEXT_PUBLIC_OPENAI_API_KEY_ADMIN`,
   `NEXT_PUBLIC_SERPAPI_KEY_ADMIN` y `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
   si existen, y rotar las claves de OpenAI y SerpAPI.
3. Tras recargar crédito OpenAI: `npm run enrich:textos` (660 áreas pendientes)
   y después `npm run translate` con `TRAD_RUN=1`.
4. Mover `usuarios-nuevos.*` fuera del proyecto.
5. Tras ejecutar la migración del revisor: `EVAL_RUN=1 npm run evaluar:chatbot`.
6. **Vercel (engagement)**: `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET` para el digest de favoritos. Sin la key no se envía nada. Ver `GUIA_ENGAGEMENT.md` §5.

---

## Historial de avances

- **28 jul 2026**: Creado el plan. Sesión previa: seguridad de claves,
  reducción de costes Google en pipeline, caché CDN de áreas, auditoría de
  datos (`npm run db:audit`), enriquecimiento estructurado
  (`npm run enrich:datos`), mejoras estéticas de /mapa.
- **28 jul 2026 (tarde)**: Tío Viajero renovado (tools + bucle, sin login,
  tarjetas, ruta Nominatim), auditoría de respuestas, agente revisor IA
  (código listo; migración de columnas pendiente), enlace admin, PWA con `?lang=`.
- **21 ago 2026**: Agentes de texto unificados en `gpt-5.6-terra`
  (chatbot, valoración, enrich, scrape, scripts). Imágenes siguen en
  `gpt-image-2`. Vigilar coste del Tío Viajero.
- **21 ago 2026 (cobertura)**: piloto Gales (~480 aires/stopovers/CL/touring);
  detección de huecos en península (radio 25 km) + import Places (~169);
  Baleares (0 previas → 20: Mallorca/Menorca/Ibiza);
  huecos Alemania (395 → 770 stellplätze/campings);
  huecos Francia (1192 → 1572 aires/campings);
  huecos Italia (914 → 1170 soste/campeggi);
  caché `/api/areas` a 30 s (`s-maxage=30`, sin SWR) para que los lotes
  salgan en el mapa al hacer Ctrl+F5. Landing `/mapa-autocaravanas-reino-unido`.
- **21 ago 2026 (Tío Viajero)**: admin tabla + quesito; primera evaluación
  (~53% incorrectas, casi todas por “Gratis” con precio null); parches de
  precio/geo/GPS/prompt; regla de círculo revisión-corrección.
- **21 ago 2026 (engagement)**: favoritos sin cuenta, AuthModal, Estuve aquí,
  home logada, digest cron, y bloque furgo/IA/QR en ficha + navbar + chatbot.
  Guía: `GUIA_ENGAGEMENT.md`.
- **21 ago 2026 (estética 3.0)**: tokens de marca (azul `#0b3c74` + naranja),
  Inter/Outfit, basemap propio en runtime, entrada cinematográfica, splash con
  furgoneta, móvil descongestionado (lupa plegable, GPS/zoom solo icono,
  z-index sane), filtros táctiles sin cabecera duplicada. Pendiente fase 2:
  pines silueta furgo + card flotante, transición card → ficha.
  Guía: `GUIA_DISENO_V3.md`.
- **22 ago 2026 (splash)**: el van del modal de carga es un Ducato H2 L3
  camperizado (caja alta, sin raya suelta) y el texto avisa de más de 9.000
  áreas en más de 25 países, con frases rotatorias. Guía: `GUIA_DISENO_V3.md` §3.
- **22 ago 2026 (URLs)**: slugs de área limpios (`/area/{nombre}-{ciudad}`, sin
  país ni Place ID), `lib/areas/slug.ts` + redirects 301 en middleware, script
  `npm run slugs:clean`. Regla: `.cursor/rules/url-slugs.mdc`.
- **22 ago 2026 (Admin 3.0)**: panel `/admin` remontado con sidebar lateral
  agrupado, layout propio, auth centralizada y dashboard con contadores.
  Ver Mejora 9 y `GUIA_DISENO_V3.md` §9.
- **22 ago 2026 (alquiler)**: criterio escrito. El mapa vuelve al job original
  (soporte al cliente Furgocasa + SEO hacia reserva). Guía:
  `GUIA_MAPA_ALQUILER.md`.
- **22 ago 2026 (CTA ficha)**: `/area` sin banners 50/50 ni IA/QR. CTA de
  alquiler contextual solo en España; Casi Cinco solo «cena cerca» al final,
  solo España. `lib/areas/cta-comercial.ts`.
- **22 ago 2026 (leads)**: documentado el tercer cliente (campings/privadas
  ES, WhatsApp, no Booking). Inventario: 850 bookable, 772 con teléfono.
  `GUIA_MAPA_ALQUILER.md` §12. Sin código de producto.
- **22 ago 2026 (CTR)**: title/description de `/area` dejan de ser
  «nombre | Mapa Furgocasa» + tocho. Plantilla con tipo, ciudad, precio y
  servicios. `lib/areas/seo-snippet.ts`. Google tarda días en recrawlear.
- **22 ago 2026 (leads medibles)**: WhatsApp «¿Hay plaza?» en
  privada/camping ES; clics `plaza_*` en analytics. Destacar ≠ cobrar por
  existir. `con_descuento_furgocasa` es el gancho (0 áreas ahora).
  `GUIA_MAPA_ALQUILER.md` §14.
- **22 ago 2026 (landings provincia)**: fase 1 del §15. `/areas` +
  `/areas/{provincia}` (~50, servidor, ISR 1h): H1 exacto, resumen con
  datos vivos, listado por tipo, FAQs con schema, vecinas, destacadas
  `con_descuento_furgocasa` arriba. Limpieza de `areas.provincia`
  (`scripts/fix-provincias.js`, dry-run + apply). Interlinking: ficha →
  provincia, landing España → provincias, sitemap. Quitadas keywords
  ocultas de las landings país. Pendiente: fase 1b (texto editorial
  único), fase 2 (zonas), fase 3 (ciudades ≥3).
