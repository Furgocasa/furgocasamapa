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
- [x] Migración SQL `supabase/migrations/20260728_area_contribuciones.sql` (con RLS, anti-spam 1/día) — **ejecutar en Supabase SQL Editor**
- [x] Componente `components/area/ConfirmarDatosArea.tsx` (inserción directa con RLS, sin API extra)
- [x] Integrado en la página de detalle de área, bajo los servicios
- [ ] (Fase 2, pendiente) Panel admin para revisar/aplicar contribuciones y aplicación automática con 2+ coincidencias

---

## Mejora 3 — Internacionalización (datos + UI selector)

**Qué**: tabla `areas_traducciones` (nombre, descripción, ubicación) + script OpenAI
(FR, DE, IT, EN) + selector de idioma en Navbar (mapa y ficha).

**Por qué**: el grueso del mercado europeo de autocaravanas no habla español.

**Cambios**:
- [x] Migración SQL `supabase/migrations/20260728_areas_traducciones.sql`
- [x] Migración SQL `supabase/migrations/20260728_areas_traducciones_campos.sql` — **ejecutar en Supabase SQL Editor**
- [x] Script `npm run translate` (dry-run por defecto; `TRAD_RUN=1` para traducir; JSON multi-campo; reanudable)
- [x] `lib/i18n` + selector en Navbar + `/api/areas?lang=` + ficha de área
- [ ] (Backlog) Rutas SEO i18n en Next (`/fr/aire-camping-car-...`)

---

## Mejora 4 — Modo offline PWA

**Qué**: cachear en el service worker el dataset de áreas (`/api/areas`) y los
tiles del mapa, para que la app funcione sin cobertura.

**Por qué**: el usuario nos necesita más justo cuando no tiene cobertura.

**Cambios**:
- [x] `next.config.js`: NetworkFirst para `/api/areas` (última descarga disponible sin cobertura, 1 semana)
- [x] `next.config.js`: CacheFirst para tiles MapTiler y OpenStreetMap (30 días)

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
- [ ] ⚠️ PENDIENTE (manual): mover `usuarios-nuevos.csv/json/xlsx` (datos personales) fuera de la carpeta del proyecto
- [ ] (Backlog) Trocear page.tsx del mapa, tipar `any`, tests de filtros

---

## Pasos manuales pendientes (Narciso)

1. **Supabase SQL Editor**: ejecutar las migraciones nuevas:
   - `supabase/migrations/20260728_area_contribuciones.sql`
   - `supabase/migrations/20260728_areas_traducciones.sql`
   - `supabase/migrations/20260728_areas_traducciones_campos.sql`
2. **Vercel**: borrar variables `NEXT_PUBLIC_OPENAI_API_KEY_ADMIN`,
   `NEXT_PUBLIC_SERPAPI_KEY_ADMIN` y `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
   si existen, y rotar las claves de OpenAI y SerpAPI.
3. **Deploy**: `git add . && git commit -m "feat: mejoras plan v5" && git push origin main`
4. Tras recargar crédito OpenAI: `npm run enrich:textos` (660 áreas pendientes)
   y después `npm run translate` con `TRAD_RUN=1`.
5. Mover `usuarios-nuevos.*` fuera del proyecto.

---

## Historial de avances

- **28 jul 2026**: Creado el plan. Sesión previa: seguridad de claves,
  reducción de costes Google en pipeline, caché CDN de áreas, auditoría de
  datos (`npm run db:audit`), enriquecimiento estructurado
  (`npm run enrich:datos`), mejoras estéticas de /mapa.
