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

### Usuarios
- 🗺️ Mapa interactivo con clustering inteligente
- 🔍 Filtros avanzados (servicios, precio, país/región)
- 📍 Búsqueda geográfica con autocompletado
- 🛣️ Planificador de rutas con paradas
- 🤖 Chatbot IA "Tío Viajero"
- 👤 Dashboard personal (visitas, favoritos, rutas)
- 🚐 Gestión de vehículos con valoración IA

### Administradores
- ⚙️ Panel de administración completo
- 📊 Analytics por pestañas
- 🤖 Editor de prompts IA
- 🗺️ **3 proveedores de mapa** intercambiables:
  - Google Maps
  - MapLibre GL
  - Leaflet

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Frontend | Next.js 14, React, TypeScript |
| Estilos | Tailwind CSS |
| Base de Datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth (Google OAuth) |
| Mapas | Google Maps / MapLibre / Leaflet |
| IA | OpenAI GPT-4 |
| Búsqueda Web | SerpAPI |
| Hosting | Vercel |

---

## 📁 Estructura

```
├── app/                    # Next.js App Router
│   ├── (public)/           # Páginas públicas (mapa, rutas, áreas)
│   ├── admin/              # Panel de administración
│   └── api/                # API Routes
├── components/             # Componentes React
│   └── mapa/               # Mapas (Google, MapLibre, Leaflet)
├── docs/                   # Documentación
├── hooks/                  # Custom hooks
├── lib/                    # Utilidades y clientes
├── supabase/               # Migraciones SQL
└── types/                  # Tipos TypeScript
```

---

## 🚀 Desarrollo

```bash
# Clonar repositorio
git clone https://github.com/Furgocasa/furgocasamapa.git

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus API keys

# Desarrollo local (opcional)
npm run dev

# Deploy a producción
git add . && git commit -m "descripción" && git push origin main
# Vercel despliega automáticamente en 2-3 minutos
```

---

## 📊 Estadísticas

- 🌍 **26 países** con áreas
- 📍 **5,000+ áreas** activas
- 🇪🇺 **16 países** en Europa
- 🌎 **7 países** en Sudamérica
- 🌴 **3 países** en Centroamérica/Caribe

---

## 📚 Documentación

La documentación completa está en `/docs/`:

| Carpeta | Contenido |
|---------|-----------|
| `docs/configuracion/` | SEO, Supabase, Google Console |
| `docs/deployment/` | Guías de deploy |
| `docs/diagnosticos/` | Solución de problemas |
| `docs/mejoras/` | Mejoras implementadas |
| `docs/archivo/` | Documentos históricos |

---

## 👨‍💻 Autor

**Narciso Pardo Buendía**

- v4.0 - Enero 2026 (Migración a Vercel, MapLibre/Leaflet)
- v3.7 - Noviembre 2025 (Mantenimiento inteligente)
- v3.0 - Noviembre 2025 (Analytics avanzado)
- v2.0 - Noviembre 2025 (Gestión de vehículos)
- v1.0 - Octubre 2025 (Lanzamiento inicial)

---

**🚐 ¡Feliz viaje!**
