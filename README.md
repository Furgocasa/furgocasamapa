# 🚐 Mapa Furgocasa

**Plataforma de Áreas para Autocaravanas en Europa y Latinoamérica**

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat&logo=vercel)](https://www.mapafurgocasa.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)](https://supabase.com)

---

## 🌐 Producción

| | |
|---|---|
| **URL** | https://www.mapafurgocasa.com |
| **Hosting** | Vercel |
| **Deploy** | Automático (push a `main`) |
| **Repositorio** | GitHub - Furgocasa/furgocasamapa |

---

## ✨ Características

### Mapa Interactivo
- 🗺️ **3 proveedores intercambiables**: Google Maps, MapLibre GL, Leaflet
- 🔵 **Clustering inteligente** con Supercluster (agrupa marcadores por zoom)
- 🎯 **Zoom inteligente** por región/país (Europa, Sudamérica, Centroamérica)
- 🔍 **Filtros avanzados**: servicios, precio, país, región, GPS
- 📍 **Búsqueda geográfica** con autocompletado Google Places
- 📱 **Responsive** adaptado a móvil y desktop

### Para Usuarios
- 🛣️ **Planificador de rutas** con paradas intermedias (guardar + volcar áreas a favoritos)
- 🤖 **Chatbot IA "Tío Viajero"** — áreas, corazón en cards, atajos a tasación IA y QR
- ❤️ **Favoritos sin cuenta** (localStorage) y sync al crear sesión
- ⭐ **Estuve aquí**: visita + valoración de área en un solo modal
- 👤 **Home logada**: sitios guardados + última ruta + bloque furgo
- 🚐 **Gestión de vehículos** con valoración automática IA
- 🚨 **Sistema de alertas QR** para accidentes (visible en ficha, home y navbar)
- ⬆️ **Botón Back to Top** en páginas de detalle

Guía de producto y técnica del embudo: **[GUIA_ENGAGEMENT.md](./GUIA_ENGAGEMENT.md)**.

### Para Administradores
- ⚙️ **Panel de administración** completo (`/admin`)
- 📊 **Analytics por pestañas**: usuarios, áreas, rutas, engagement
- 🤖 **Editor de prompts IA** configurable
- 🧑‍⚖️ **Respuestas del Tío Viajero** (`/admin/chatbot-respuestas`): tabla + quesito de calidad (correcta / mejorable / incorrecta)
- 🖼️ **Sistema de banners** con alternancia inteligente CasiCinco/Furgocasa
- 🗺️ **Selector de proveedor de mapa** (Google/MapLibre/Leaflet)

### Sistema de Banners Publicitarios
- 🎯 **Alternancia inteligente**: Garantiza balance 50/50 entre CasiCinco y Furgocasa
- 🚫 **Sin repeticiones**: No se repite el mismo banner en una página
- 📱 **8 formatos diferentes**: Hero, Mobile, Wide, Leaderboard, Vertical, Premium, + 2 con imágenes
- 🖼️ **Imágenes protagonistas**: Fotos reales ocupan 30-45% del banner (100% visibles)
- 🎨 **Diseño publicitario**: Estilo banner profesional, no página web
- 🔄 **Responsive**: Adaptados automáticamente según dispositivo
- 📁 **Archivos HTML**: Ejemplos editables en `banners/banners_furgocasa/`

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Frontend | Next.js 14, React 18, TypeScript 5 |
| Estilos | Tailwind CSS |
| Base de Datos | Supabase (PostgreSQL + RLS) |
| Autenticación | Supabase Auth (Google OAuth, Email) |
| Mapas | Google Maps API, MapLibre GL JS, Leaflet |
| Clustering | Supercluster |
| IA (texto) | OpenAI `gpt-5.6-terra` |
| IA (imágenes) | OpenAI `gpt-image-2` / `gpt-image-1` / `dall-e-3` |
| Búsqueda Web (textos) | OpenAI `web_search` (Terra) |
| Hosting | Vercel |

---

## 📁 Estructura

```
├── app/
│   ├── (public)/          # Páginas públicas
│   │   ├── mapa/          # Mapa principal
│   │   ├── ruta/          # Planificador de rutas
│   │   ├── area/[slug]/   # Detalle de área
│   │   ├── perfil/        # Dashboard usuario
│   │   └── mis-autocaravanas/
│   ├── admin/             # Panel administración
│   └── api/               # API Routes (incl. /api/cron/digest-semanal)
├── components/
│   ├── mapa/              # MapaInteractivoGoogle, MapLibreMap, LeafletMap
│   ├── banners/           # Sistema de banners CasiCinco + Furgocasa
│   ├── perfil/            # Tabs del dashboard
│   └── ui/                # Componentes reutilizables
├── banners/
│   ├── banners_furgocasa/ # Archivos HTML editables de banners
│   └── banners_casicinco/ # Archivos HTML editables de banners
├── hooks/                 # useMapConfig, useToast, etc.
├── lib/                   # Supabase, i18n, analytics, favoritos/local.ts
├── supabase/migrations/   # Migraciones SQL
├── types/                 # Tipos TypeScript
├── GUIA_ENGAGEMENT.md     # Embudo: favoritos, auth, furgo, digest
├── PLAN_MEJORAS.md        # Seguimiento de producto
├── CAMBIOS_CURSOR.md      # Registro de cambios verificables
└── .cursor/rules/         # Reglas (tipos, activo, Supabase vía .env.local)
```

---

## 🚀 Desarrollo

```bash
# Clonar
git clone https://github.com/Furgocasa/furgocasamapa.git
cd furgocasamapa

# Instalar
npm install

# Configurar (copiar y editar con tus API keys)
cp .env.example .env.local

# Deploy a producción
git add . && git commit -m "feat: descripción" && git push origin main
# Vercel despliega automáticamente en 2-3 minutos
```

### Variables de Entorno Requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
OPENAI_API_KEY=
SERPAPI_KEY=

# Digest semanal de favoritos (opcional; sin esto el cron no envía)
RESEND_API_KEY=
EMAIL_FROM=Mapa Furgocasa <hola@mapafurgocasa.com>
CRON_SECRET=
```

Detalle del cron y del embudo: [GUIA_ENGAGEMENT.md](./GUIA_ENGAGEMENT.md) §5.

---

## 📊 Estadísticas

Cifras de producción (agosto 2026; crecen con cada import):

| Región | Países (SEO / filtro) | Áreas (aprox.) |
|--------|----------------------|----------------|
| 🇪🇺 Europa | 17 landings SEO (incl. Reino Unido) | ~5.500 |
| 🌎 Sudamérica | Argentina, Chile, Uruguay… | ~400 |
| 🌴 México / Centroamérica | trailer parks y RV parks | ~400 |
| **Total activas** | | **~6.100** |

Destacados recientes:

- **Reino Unido (piloto Gales)**: ~480 sitios. No son “áreas ES/FR”: aires, stopovers, CL y touring parks.
- **Península**: España ~1.100, Portugal ~130. En agosto 2026 se taparon 16 huecos interiores (Alentejo, Arribes, Sierra Morena, Cuenca…) con ~169 fichas nuevas.

Landings: `/mapa-autocaravanas-reino-unido`, `/mapa-autocaravanas-espana`, `/mapa-casas-rodantes-mexico`, etc. (`config/paises-seo.ts`).

---

## 🗺️ Sistema de Mapas

Los 3 proveedores de mapa comparten **funcionalidad idéntica**:

| Característica | Google | MapLibre | Leaflet |
|----------------|--------|----------|---------|
| Clustering | ✅ | ✅ | ✅ |
| Popups | ✅ | ✅ | ✅ |
| Zoom inteligente | ✅ | ✅ | ✅ |
| GPS usuario | ✅ | ✅ | ✅ |
| Búsqueda | ✅ | ✅ | ✅ |

El admin puede cambiar el proveedor desde `/admin/configuracion`.

---

## 🖼️ Sistema de Banners

### Alternancia Inteligente

El sistema garantiza que **nunca aparecen 3 banners del mismo anunciante** en una misma página:

```typescript
// Ejemplo en página de área con 3 banners:
Banner 1 (after-info):     CasiCinco   → Count: CC=1, FC=0
Banner 2 (after-services): Furgocasa   → Count: CC=1, FC=1  
Banner 3 (after-gallery):  CasiCinco   → Count: CC=2, FC=1
```

### Características

| Aspecto | Descripción |
|---------|-------------|
| **Alternancia** | Balance automático 50/50 entre CasiCinco y Furgocasa |
| **Sin repetición** | Cada banner se muestra solo una vez por página |
| **Imágenes** | Fotos reales visibles (30-45% del espacio) |
| **Formatos** | 8 tamaños: 320px, 728px, 850px, 970px, 1100px, 1200px |
| **Responsive** | Adaptación automática móvil/tablet/desktop |
| **Colores** | Azul navy (#003d7a) para Furgocasa, neutros para CasiCinco |

### Banners Furgocasa

1. **BannerFurgocasaHero** - 728px × 200px (horizontal)
2. **BannerFurgocasaMobile** - 320px × 380px (vertical móvil)
3. **BannerFurgocasaWide** - 1200px × 280px (ancho premium)
4. **BannerFurgocasaLeaderboard** - 970px × 140px (compacto)
5. **BannerFurgocasaVertical** - 300px × 600px (sidebar)
6. **BannerFurgocasaPremium** - 850px × 380px (grid 4x)
7. **BannerFurgocasaImageAlquiler** - 1100px × 320px (2 fotos alquiler)
8. **BannerFurgocasaImageVenta** - 1100px × 320px (2 fotos venta)

Todos los banners tienen:
- ✅ Imágenes reales de campers Furgocasa
- ✅ Sin opacidad (fotos 100% visibles)
- ✅ Gradientes mínimos solo para legibilidad
- ✅ Efectos hover interactivos
- ✅ Ejemplos HTML editables en `banners/banners_furgocasa/`

---

## 🤖 Agentes de IA

El modelo de texto por defecto es **`gpt-5.6-terra`** ([docs OpenAI](https://developers.openai.com/api/docs/models/gpt-5.6-terra)): equilibrio entre inteligencia y coste (tier mini de GPT-5.6). Constante en `lib/openai/model-validation.ts` (`DEFAULT_OPENAI_MODEL`). Se configura en producción desde `/admin/configuracion` y se guarda en Supabase.

| Agente | Origen de la config | Modelo actual |
|--------|---------------------|---------------|
| Chatbot **Tío Viajero** | `chatbot_config.modelo` | `gpt-5.6-terra` |
| Valoración de vehículos | `ia_config.valoracion_vehiculos` | `gpt-5.6-terra` |
| Enriquecer descripciones | `ia_config.enrich_description` | `gpt-5.6-terra` |
| Auditar servicios de áreas | `ia_config.scrape_services` | `gpt-5.6-terra` |
| Extraer anuncios (datos mercado) | `DEFAULT_OPENAI_MODEL` en código | `gpt-5.6-terra` |
| Scripts masivos (enrich, traducir, evaluar chatbot) | env opcional o default | `gpt-5.6-terra` |
| Imágenes de áreas | `lib/areas/generate-area-image.ts` | `gpt-image-2` (fallback `gpt-image-1`, `dall-e-3`) |

Terra cubre Chat Completions, Responses, function calling y `web_search`. Las fotos **no** usan Terra.

> 💰 El Tío Viajero es el agente de más volumen. Vigilar coste OpenAI: si sube demasiado, se puede bajar solo el chatbot desde `/admin/configuracion` sin tocar el resto.

### Tío Viajero: calidad y revisión

Cada respuesta (también anónima) se guarda en `chatbot_respuestas_log`. El admin las ve en [https://www.mapafurgocasa.com/admin/chatbot-respuestas](https://www.mapafurgocasa.com/admin/chatbot-respuestas): tabla (fecha, usuario, anónimo/registrado, mensaje, respuesta, categorización) y quesito de porcentajes.

Revisor automático (clasifica correcta / mejorable / incorrecta y escribe `motivo_ia` + `sugerencia_ia`):

```powershell
npm run evaluar:chatbot
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"; $env:EVAL_RUN="1"; npm run evaluar:chatbot
```

**Círculo revisión → corrección** (regla `.cursor/rules/chatbot-revision.mdc`): al pedir “revisa el chatbot” no basta el informe; hay que parchear prompt o código (`lib/chatbot/functions.ts`, `app/api/chatbot/route.ts`) y pushear a `main`. Las filas viejas del admin no se reescriben.

Reglas de datos que el bot debe cumplir:

- `precio_noche` null → “Precio no disponible”, nunca Gratis. Gratis solo si el precio es `0`.
- GPS `0,0` / Null Island se ignora; sin ubicación no se busca en todo el mundo.
- Ciudad o “Ajo, Cantabria” se geocodifica (Nominatim) y se busca por radio.
- POI conocidos: Massabielle → Lourdes; bolemdam → Volendam.
- Ciudad suelta no hereda filtros (mascotas, luz, gratis) del turno anterior.

---

## 🤖 Enriquecimiento de Descripciones (IA)

Las descripciones de las áreas se generan/mejoran en lote con OpenAI (`gpt-5.6-terra` + búsqueda web) mediante el script `scripts/bulk-enrich.js`. El proceso es **reanudable**: cada área completada se guarda en `scripts/enrich-checkpoint.txt` y se salta en ejecuciones posteriores.

### Estado actual (17 jun 2026)

| Métrica | Valor |
|---------|-------|
| Áreas activas totales | **4.962** |
| Procesadas (checkpoint) | **873** |
| **Pendientes de enriquecer** | **660** |

> ⏸️ **Proceso pausado**: se agotó el crédito de OpenAI durante la última ejecución. Al recargar la cuenta, **relanzar** el script: gracias al checkpoint continuará automáticamente por las **660 áreas pendientes** sin repetir las ya hechas.

### Cómo relanzar (PowerShell)

```powershell
# Contar pendientes sin gastar crédito (dry-run)
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"; $env:BULK_DRYRUN="1"; node scripts/bulk-enrich.js

# Lanzar el enriquecimiento real (reanuda desde el checkpoint)
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"; node scripts/bulk-enrich.js
```

Variables opcionales: `BULK_MODE` (`critical` | `all` | `everything`), `BULK_CONCURRENCY` (def 6), `BULK_LIMIT` (0 = todas), `BULK_MODEL` (def `gpt-5.6-terra`), `BULK_DRYRUN` (1 = solo contar), `BULK_EFFORT` (def `medium`), `BULK_FORCE_SEARCH` (def 1 = web search obligatoria).

### Auditoría y datos estructurados (jul 2026)

| Comando | Qué hace | Coste |
|---------|----------|-------|
| `npm run db:audit` | Informe de calidad: textos incompletos, sin servicios/precio/plazas/foto → `scripts/audit-report.csv` | **0€** |
| `npm run enrich:datos` | Investiga con `gpt-5.6-terra` + web search los datos estructurados que faltan → CSV de propuestas (no toca la BD) | Solo OpenAI |
| `npm run enrich:datos:apply` | Aplica las propuestas de confianza alta SOLO en campos vacíos | Solo OpenAI |
| `npm run enrich:textos` | Alias de `bulk-enrich.js` (descripciones) | Solo OpenAI |

> 💰 **Política de costes**: el pipeline de enriquecimiento NO usa APIs de pago de Google. Los scripts de corrección de países usan Nominatim (OpenStreetMap, gratis). `actualizar-websites-google.js` y los **imports por Places** (México, Gales, huecos península) sí facturan a Google: dry-run primero, `--import` solo al revisar el informe.

---

## 🏷️ Tipo de ubicación

Campo `areas.tipo_area`: `publica` | `privada` | `camping` | `parking`.
En el mapa, `parking` se muestra como **Stopover**. Código y colores: `lib/areas/tipo-area.ts`.

Solo entra lo que encaja en **una de estas cuatro**. El nombre local (aire, sosta, Stellplatz, CL, RV park) es etiqueta, no un tipo extra.

| Código | Lo que ve el usuario | Qué es | Ejemplos locales |
|--------|----------------------|--------|------------------|
| `publica` | Área pública | Área de autocaravanas de un ayuntamiento u organismo | Área municipal, aire communale, sosta comunale, Stellplatz kommunal, council aire |
| `privada` | Área privada | Área de autocaravanas de empresa o particular (casi siempre de cobro) | Camper park, aire privée, CL británico, Stellplatz privat |
| `camping` | Camping | Recinto: valla, parcela, a menudo tiendas, bungalows, duchas | Camping, campeggio, campingplatz, touring/holiday/caravan park, RV/trailer park |
| `parking` | Stopover | Pernocta de paso **ofrecida** (1 noche): pub, tienda, granja. Puede no tener vaciado ni agua | Stopover UK, parking de passage, Weingut / chez l’habitant |

**Criterio:** ¿es un área municipal, un área empresarial privada, un camping o un stopover que se ofrece como tal? Si no, **no entra**. No hay quinto tipo.

**Qué no entra** (aunque alguien haya dormido ahí): parking del polideportivo, solar, arcén, “pernocta reportada” de apps sociales, zona de acampada, aire naturelle de campo, wild camp, bivouac. Un stopover **puede no tener servicios**; no se excluye por eso. Se excluye el sitio que **no es** una de las cuatro.

**No usar el JSON `servicios` para admitir o ocultar.** Casi todo el inventario lo tiene vacío (dato pendiente). No es el tema ahora. `esPernoctaSinServicio()` rechaza por nombre / naturaleza del lugar, no por ficha vacía.

Clasificar (`classifyTipoArea`) solo corre **después** de admitir el sitio. Recategorizar tipos: `scripts/scripts_empresas/reclassify-tipos.ts`. Ocultar lo que no encaja (zona de acampada / wild camp): el mismo script con `--ocultar-sin-servicio`.

Admin: al editar, el valor `parking` sigue saliendo como “Parking”; en el mapa público es Stopover.

---

## 🌍 Cobertura e imports geográficos

El mapa carga **todas** las áreas activas desde `GET /api/areas` (CDN Vercel **30 s**, sin `stale-while-revalidate`). El cliente usa `cache: 'no-store'` y `?v=` para invalidar el CDN tras un import masivo. Tras un lote grande: push a `main`, esperar deploy, **Ctrl+F5**.

Cada país se trata como mercado propio (terminología + tipo de sitio), no como un clon de España:

| Mercado | Qué se busca | Script | Comandos |
|---------|--------------|--------|----------|
| México | trailer / RV park | `scripts/scripts_empresas/import-mexico-pilot.ts` | `npm run import:mexico:pilot` (dry-run) → `--from-report --import` |
| Reino Unido / Gales | motorhome aire, stopover, CL, touring park | `scripts/scripts_empresas/import-wales-pilot.ts` | `npm run import:wales:pilot` → `npm run import:wales:from-report` |
| Huecos península | malla 25 km + Places 40 km en centroides vacíos | `scripts/scripts_empresas/import-iberia-gaps.ts` | `npm run import:iberia:gaps` → `--from-report --import` |
| Islas Baleares | 0 áreas previas; 13 disparos (Mallorca, Menorca, Ibiza, Formentera) | mismo script `--region=baleares` | `npm run import:baleares:gaps` → `--from-report --import` |
| Huecos Alemania | malla 25 km; 16 huecos (Brandeburgo, Baviera este, Emsland, Rügen…) | mismo script `--region=alemania` | `npm run import:alemania:gaps` → `--from-report --import` |
| Huecos Francia | malla 25 km; 16 huecos (Perche, Ardenas, Finistère, Pirineos, Córcega…) | mismo script `--region=francia` | `npm run import:francia:gaps` → `--from-report --import` |

**Huecos (península):** rejilla ~22 km; celda vacía = ninguna área a 25 km; celdas vecinas = un hueco; el centroide es el disparo. No incluye islas. **Baleares:** 0 áreas previas → 13 disparos; Formentera no devolvió ficha útil. En Windows, si falla TLS: `$env:NODE_TLS_REJECT_UNAUTHORIZED="0"`.

---

## 👨‍💻 Autor

**Narciso Pardo Buendía**

### Historial de Versiones

| Versión | Fecha | Cambios principales |
|---------|-------|---------------------|
| v4.6 | 21 ago 2026 | Tipo de ubicación: 4 categorías; zona de acampada / wild camp fuera; servicios vacíos ≠ ocultar |
| v4.5 | 21 ago 2026 | Embudo de engagement: favoritos locales, AuthModal, Estuve aquí, furgo visible en ficha/home, digest semanal |
| v4.4 | 21 ago 2026 | Admin Tío Viajero (tabla + quesito), ciclo revisión-corrección, null ≠ gratis, geo Nominatim |
| v4.3 | Agosto 2026 | Piloto Gales (~480), huecos península (~169), caché `/api/areas` a 30 s |
| v4.2 | Agosto 2026 | Agentes de texto unificados en `gpt-5.6-terra` |
| v4.1 | Enero 2026 | Sistema de banners con alternancia inteligente CasiCinco/Furgocasa |
| v4.0 | Enero 2026 | Migración Vercel, MapLibre/Leaflet, clustering Supercluster |
| v3.7 | Nov 2025 | Limpieza BD automática, PDF valoración |
| v3.0 | Nov 2025 | Analytics avanzado por pestañas |
| v2.0 | Nov 2025 | Gestión vehículos, alertas QR, valoración IA |
| v1.0 | Oct 2025 | Lanzamiento inicial |

---

**🚐 ¡Feliz viaje!**
