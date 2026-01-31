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
- 🛣️ **Planificador de rutas** con paradas intermedias
- 🤖 **Chatbot IA "Tío Viajero"** - búsqueda conversacional
- 👤 **Dashboard personal**: visitas, favoritos, rutas guardadas
- 🚐 **Gestión de vehículos** con valoración automática IA
- 🚨 **Sistema de alertas QR** para accidentes
- ⬆️ **Botón Back to Top** en páginas de detalle

### Para Administradores
- ⚙️ **Panel de administración** completo (`/admin`)
- 📊 **Analytics por pestañas**: usuarios, áreas, rutas, engagement
- 🤖 **Editor de prompts IA** configurable
- 🖼️ **Sistema de banners** para publicidad
- 🗺️ **Selector de proveedor de mapa** (Google/MapLibre/Leaflet)

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
| IA | OpenAI GPT-4 / GPT-4o-mini |
| Búsqueda Web | SerpAPI |
| Hosting | Vercel |

---

## 📁 Estructura

```
├── app/
│   ├── (public)/          # Páginas públicas
│   │   ├── mapa/          # Mapa principal
│   │   ├── ruta/          # Planificador de rutas
│   │   ├── area/[slug]/   # Detalle de área
│   │   └── perfil/        # Dashboard usuario
│   ├── admin/             # Panel administración
│   └── api/               # API Routes
├── components/
│   ├── mapa/              # MapaInteractivoGoogle, MapLibreMap, LeafletMap
│   ├── perfil/            # Tabs del dashboard
│   └── ui/                # Componentes reutilizables
├── hooks/                 # useMapConfig, useToast, etc.
├── lib/                   # Supabase clients, utilidades
├── supabase/migrations/   # Migraciones SQL
├── types/                 # Tipos TypeScript
└── .cursor/rules/         # Reglas del proyecto
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
```

---

## 📊 Estadísticas

| Región | Países | Áreas |
|--------|--------|-------|
| 🇪🇺 Europa | 16 | ~4,500 |
| 🌎 Sudamérica | 7 | ~400 |
| 🌴 Centroamérica | 3 | ~100 |
| **Total** | **26** | **~5,000** |

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

## 👨‍💻 Autor

**Narciso Pardo Buendía**

### Historial de Versiones

| Versión | Fecha | Cambios principales |
|---------|-------|---------------------|
| v4.0 | Enero 2026 | Migración Vercel, MapLibre/Leaflet, clustering Supercluster |
| v3.7 | Nov 2025 | Limpieza BD automática, PDF valoración |
| v3.0 | Nov 2025 | Analytics avanzado por pestañas |
| v2.0 | Nov 2025 | Gestión vehículos, alertas QR, valoración IA |
| v1.0 | Oct 2025 | Lanzamiento inicial |

---

**🚐 ¡Feliz viaje!**
