# 🚐 Mapa Furgocasa - Plataforma de Áreas para Autocaravanas en Europa y LATAM

**Versión: 3.7.1 - PRODUCCIÓN** 🎉✅

> 🔴 **ENTORNO DE PRODUCCIÓN ACTIVA**
>
> - **URL:** https://www.mapafurgocasa.com
> - **Hosting:** Vercel ⚡
> - **Repositorio:** GitHub (Furgocasa/furgocasamapa)
> - **Deploy automático:** Cada push a `main` → Despliega a Vercel automáticamente
> - **NO hay entorno de desarrollo local** - Se trabaja directamente en producción

Plataforma web interactiva totalmente funcional para descubrir y gestionar áreas de autocaravanas, campers y vehículos recreativos en **Europa y Latinoamérica** (España, Portugal, Francia, Italia, Alemania, Argentina, Chile, Uruguay, Brasil, Colombia, Perú y más).

**Estado:** 🟢 **100% OPERATIVO** - Sistema COMPLETO en producción con todas las funcionalidades deseadas implementadas.

**Última actualización:** 17 de Noviembre 2025 - 🚀 **v3.7.1 - MANTENIMIENTO INTELIGENTE** 🚀

- ✅ **Script de Limpieza BD Automático** - Elimina duplicados, archiva antiguos, marca sospechosos
- ✅ **PDF de Valoración Rediseñado** - Formato corporativo profesional con colores de marca
- ✅ **Página 404 Personalizada** - UX mejorada para enlaces rotos
- ✅ **Columna "Vendidos" en Admin** - Seguimiento de ventas por marca/modelo
- ✅ **Comparables IA Corregidos** - Solo datos reales (sin auto-inflación)
- ✅ **Extracción de Precios Mejorada** - Regex flexible con logging detallado
- ✅ **Carga de Fotos en PDF** - Sistema robusto con manejo de errores
- ✅ **Optimización de carga del mapa** - Cache localStorage (carga instantánea <500ms)
- ✅ **Singleton Pattern Supabase** - Sin warnings, mejor rendimiento
- ✅ **Sistema de kilometraje corregido** - Fuente única desde vehiculo_kilometraje
- ✅ **Impuesto de matriculación** - Normalización PVP para valoración IA precisa
- 🎯 3 categorías completas al 100%: Mapa, Gestión Vehículos, Alertas

---

## 🌟 Características Principales

### Para Usuarios

- 🗺️ **Mapa Interactivo** con todas las áreas disponibles (Google Maps API)
- 🔍 **Búsqueda y Filtros** avanzados (servicios, precio, ubicación)
- 📍 **Información Detallada** de cada área (servicios, fotos, contacto)
- ⭐ **Sistema de Valoraciones** y comentarios
- 📝 **Registro de Visitas** con notas personales
- 💙 **Favoritos** para guardar tus áreas preferidas
- 🗺️ **Planificador de Rutas** 🔒 - La herramienta más potente (requiere registro)
- 💾 **Rutas Guardadas** - Guarda y reutiliza tus rutas favoritas
- 📥 **Exportar a GPX** ✨ **NUEVO v3.5** - Descarga rutas para GPS (Garmin, TomTom, etc.)
- 🔄 **Drag-and-Drop Paradas** ✨ **NUEVO v3.5** - Reordena paradas arrastrando
- 🤖 **"Tío Viajero IA" - Chatbot Inteligente** 🔒 ✅ - Búsqueda conversacional con IA, Function Calling y geolocalización (requiere registro)
- 👤 **Dashboard de Perfil** completo con:
  - Mis Visitas (con mapa interactivo)
  - Mis Valoraciones
  - Mis Favoritos
  - Mis Rutas Guardadas
  - 🚐 **Mi Autocaravana** ✨ **NUEVO v2.0** - Registro y gestión de vehículos
  - 📋 **Mis Reportes** ✨ **NUEVO v2.0** - Sistema de alertas de accidentes
  - 💰 **Valoración Automática** ✨ **NUEVO v2.0** - ¿Por cuánto puedo vender?
  - 📊 **Histórico de Valoraciones** ✨ **NUEVO v2.0** - Evolución del valor con gráficos
  - 💸 **Gastos Adicionales** ✨ **NUEVO v3.5** - Control de seguros, impuestos, peajes, etc.
- 📱 **Responsive Design** - Funciona en móvil, tablet y desktop
- 🌐 **Acceso Público** - Mapa y áreas sin registro, herramientas avanzadas con registro
- 🔔 **Notificaciones Toast** - Feedback elegante en todas las acciones
- 🚨 **Sistema de Alertas de Accidentes** ✨ **NUEVO v2.0** - QR único por vehículo, reportes públicos
- 🚐 **Gestión Completa de Vehículos** ✨ **v2.0** - Mantenimientos, averías, mejoras, kilometraje
- 💶 **Valoración Automática con IA** ✨ **v2.0** - Algoritmo propio de valoración de mercado
- 📈 **Análisis Económico** ✨ **v2.0** - Control financiero completo del vehículo
- 💸 **Gastos Adicionales** ✨ **v3.5** - Seguros, impuestos, parkings, peajes
- 🔄 **Drag-and-Drop Paradas** ✨ **v3.5** - Reordena waypoints arrastrando
- 📥 **Exportar GPX** ✨ **v3.5** - Rutas para GPS externos
- 📸 **Subida Directa de Fotos** ✨ **NUEVO v2.1** - Supabase Storage directo, bypass AWS Amplify, sin errores 403
- 🗑️ **Gestión Completa de Fotos** ✨ **NUEVO v2.1** - Subir, borrar y gestionar fotos en reportes y vehículos

### Para Administradores

- ⚙️ **Panel de Administración** completo en `/admin`
- ➕ **Crear, Editar y Borrar** áreas
- 🔍 **Búsqueda Multi-campo** - Buscar por nombre, ciudad, dirección, provincia, país
- 🌍 **Filtros por País** - Sistema global con 25+ países normalizados
- 📊 **Ordenación de Columnas** - Click para ordenar cualquier columna
- 🔍 **Búsqueda Masiva** - Importar múltiples áreas desde Google Places
- 🛡️ **Detección Inteligente de Duplicados** - 7 criterios (GPS, nombre, dirección, fuzzy matching)
- 🤖 **Actualización Automática de Servicios** con IA (OpenAI + SerpAPI)
- ✨ **Enriquecimiento de Textos** con IA para descripciones (200+ caracteres)
- 📸 **Búsqueda Automática de Imágenes** para cada área
- 🎨 **Editor de Prompts IA** ✅ - Configuración visual de los 3 agentes de IA desde `/admin/configuracion`
- 💬 **Configuración del Chatbot** ✅ - Editor completo de prompts múltiples para el Tío Viajero IA
- 📊 **Analytics Avanzado** ✨ **NUEVO v3.0** - Sistema completo por pestañas con análisis detallado
- 👥 **Gestión de Usuarios Mejorada** - Tabla optimizada con iconos de proveedor y ordenación inteligente
- 🗄️ **Base de Datos Normalizada** - 100% áreas con país y región/CCAA correctos
- 🚫 **Sin Caché** - Datos siempre actualizados en panel admin

---

## 🛠️ Tecnologías

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Estilos:** Tailwind CSS
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Mapas:** Google Maps API (con Directions API para rutas)
- **IA:** OpenAI GPT-4o-mini (Chatbot + Function Calling), GPT-4 (Valoraciones IA)
- **Búsqueda Web:** SerpAPI (Enriquecimiento de áreas + Búsqueda de comparables para valoraciones)
- **Lugares:** Google Places API
- **Almacenamiento:** Supabase Storage (fotos directas)

---

## 🚀 Instalación Rápida

### 1. Prerrequisitos

- Node.js 18+
- Cuenta de Supabase
- Google Maps API Key (requerido)
- (Opcional) API Keys: OpenAI, SerpAPI, Google Places

### 2. Directorio del Proyecto

**Ruta completa del proyecto:**

```
E:\Acttax Dropbox\Narciso Pardo\Acttax\EI - FURGOCASA\1 - ADMINISTRACION\7 - ACTIVOS\6 - MAPA FURGOCASA\NEW MAPA FURGOCASA
```

**IMPORTANTE:** Todos los comandos deben ejecutarse desde este directorio raíz del proyecto.

```powershell
cd "E:\Acttax Dropbox\Narciso Pardo\Acttax\EI - FURGOCASA\1 - ADMINISTRACION\7 - ACTIVOS\6 - MAPA FURGOCASA\NEW MAPA FURGOCASA"
```

### 3. Instalar Dependencias

```powershell
npm install
```

### 4. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz:

```env
# Supabase (Requerido)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Google Maps (Requerido)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key

# Google Geocoding (Requerido para Chatbot - convierte GPS a ciudad/provincia)
GOOGLE_MAPS_API_KEY=tu_google_maps_api_key

# Google Places (Opcional - para búsqueda de lugares)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=tu_google_places_key

# OpenAI (Opcional - para funciones de IA)
OPENAI_API_KEY=tu_openai_api_key

# SerpAPI (Opcional - para búsqueda web)
SERPAPI_KEY=tu_serpapi_key
```

### 5. Configurar Base de Datos

Ejecuta el schema SQL en Supabase:

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Abre **SQL Editor**
3. Ejecuta los siguientes scripts en orden:

```bash
# 1. Schema principal (obligatorio)
supabase/schema.sql

# 2. Tabla de rutas (obligatorio para el planificador)
supabase/add-rutas-table.sql

# 3. Permisos de administrador (obligatorio si usarás /admin)
supabase/FIX-admin-permisos-v3-SIMPLE.sql

# 4. Sistema de Gestión de Vehículos ✨ NUEVO v2.0
# Ejecutar en orden del 01 al 12:
reportes/01_crear_tablas.sql
reportes/02_crear_triggers.sql
reportes/03_configurar_rls.sql
reportes/04_funciones_auxiliares.sql
reportes/05_gestion_vehiculos_tablas.sql
reportes/06_gestion_vehiculos_triggers.sql
reportes/07_gestion_vehiculos_rls.sql
reportes/08_valoracion_economica.sql
reportes/09_valoracion_economica_triggers.sql
reportes/10_valoracion_economica_rls.sql
reportes/11_funciones_analisis_economico.sql
reportes/12_funciones_admin.sql
```

**📖 Guía completa:** Consulta `reportes/README_GESTION_VEHICULOS.md` para instrucciones detalladas.

### 6. Crear Usuario Administrador

En Supabase Dashboard:

1. Ve a **Authentication** → **Users**
2. Crea un nuevo usuario o selecciona uno existente
3. Edita el usuario y añade en **User Metadata**:

```json
{
  "is_admin": true
}
```

### 7. Flujo de Trabajo de Desarrollo

**IMPORTANTE:** Esta aplicación NO se ejecuta localmente. Todo el desarrollo se hace directamente en producción en Vercel.

#### Workflow:

```bash
# 1. Hacer cambios en el código localmente
# 2. Commit de los cambios
git add .
git commit -m "descripción de cambios"

# 3. Push a GitHub (rama main)
git push origin main

# 4. Vercel detecta el push automáticamente
# 5. Build y deploy se ejecutan en Vercel (2-3 minutos)
# 6. Cambios visibles en https://www.mapafurgocasa.com
```

#### Ver Logs de Deploy:

1. Ve a Vercel Dashboard → tu proyecto
2. Selecciona la pestaña **Deployments**
3. Click en el deployment para ver los logs en tiempo real

#### Variables de Entorno en Vercel:

Las variables `.env.local` deben configurarse en Vercel:

1. Vercel Dashboard → Tu proyecto
2. **Settings** → **Environment Variables**
3. Añade las mismas variables que en `.env.local`
4. Asegúrate de aplicarlas a **Production**, **Preview** y **Development**

---

## 📁 Estructura del Proyecto

```
NEW MAPA FURGOCASA/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Rutas públicas
│   │   ├── mapa/                 # Mapa principal
│   │   ├── ruta/                 # Planificador de rutas
│   │   ├── area/[slug]/          # Detalle de área
│   │   ├── auth/                 # Login, registro, etc.
│   │   ├── perfil/               # Perfil de usuario
│   │   └── reporte/[qr_id]/     # ✨ NUEVO v2.0 - Página pública de reporte de accidentes
│   ├── admin/                    # Panel de administración
│   │   ├── areas/                # Gestión de áreas
│   │   ├── analytics/            # Estadísticas
│   │   └── users/                # Gestión de usuarios
│   ├── api/                      # API Routes
│   │   ├── admin/                # Endpoints de admin
│   │   ├── reportes/             # ✨ NUEVO v2.0 - API de reportes de accidentes
│   │   └── vehiculos/            # ✨ NUEVO v2.0 - API de gestión de vehículos
│   ├── globals.css               # Estilos globales + animaciones toast
│   └── layout.tsx                # Layout principal
├── components/                   # Componentes React
│   ├── admin/                    # Componentes de admin
│   ├── area/                     # Componentes de área
│   │   └── ValoracionesCompleto.tsx  # Sistema completo visitas + valoraciones
│   ├── layout/                   # Navbar, Footer
│   ├── mapa/                     # Componentes del mapa (Google Maps)
│   ├── perfil/                   # Componentes del dashboard de perfil
│   │   ├── DashboardStats.tsx    # Estadísticas del usuario
│   │   ├── VisitasTab.tsx        # Tab de visitas con mapa
│   │   ├── MapaVisitas.tsx       # Mapa interactivo de visitas
│   │   ├── ValoracionesTab.tsx   # Tab de valoraciones
│   │   ├── FavoritosTab.tsx      # Tab de favoritos
│   │   ├── RutasTab.tsx          # Tab de rutas guardadas
│   │   ├── MiAutocaravanaTab.tsx # ✨ NUEVO v2.0 - Registro y gestión de vehículos
│   │   ├── MisReportesTab.tsx    # ✨ NUEVO v2.0 - Gestión de reportes de accidentes
│   │   └── vehiculo/             # ✨ NUEVO v2.0 - Componentes de gestión de vehículos
│   │       ├── DashboardVehiculo.tsx      # Dashboard principal del vehículo
│   │       ├── ValoracionVenta.tsx        # Valoración automática con IA
│   │       └── HistoricoValoracion.tsx    # Histórico con gráficos
│   ├── ruta/                     # Componentes del planificador
│   │   └── PlanificadorRuta.tsx  # Planificador completo con guardar rutas
│   └── ui/                       # Componentes UI reutilizables
│       └── Toast.tsx             # Sistema de notificaciones
├── hooks/                        # Custom React Hooks
│   └── useToast.ts               # Hook para notificaciones toast
├── lib/                          # Librerías y utilidades
│   └── supabase/                 # Clientes de Supabase
├── supabase/                     # Scripts SQL
│   ├── schema.sql                # Schema principal
│   ├── add-rutas-table.sql       # Tabla de rutas
│   ├── ROLLBACK-COMPLETO.sql     # Restaurar políticas
│   └── FIX-admin-permisos-v3-SIMPLE.sql  # Permisos admin
├── reportes/                     # ✨ NUEVO v2.0 - Scripts SQL de gestión de vehículos
│   ├── 01_crear_tablas.sql       # Tablas de reportes de accidentes
│   ├── 02_crear_triggers.sql     # Triggers automáticos
│   ├── 03_configurar_rls.sql     # Políticas de seguridad
│   ├── 04_funciones_auxiliares.sql # Funciones auxiliares
│   ├── 05_gestion_vehiculos_tablas.sql      # Tablas de gestión
│   ├── 06_gestion_vehiculos_triggers.sql    # Triggers de gestión
│   ├── 07_gestion_vehiculos_rls.sql         # RLS de gestión
│   ├── 08_valoracion_economica.sql          # Tablas económicas
│   ├── 09_valoracion_economica_triggers.sql # Triggers económicos
│   ├── 10_valoracion_economica_rls.sql      # RLS económicos
│   ├── 11_funciones_analisis_economico.sql  # Funciones de análisis
│   ├── 12_funciones_admin.sql               # Funciones de administración
│   └── README_GESTION_VEHICULOS.md          # Guía de implementación
├── types/                        # Tipos TypeScript
│   ├── database.types.ts         # Tipos de BD (incluye Ruta)
│   ├── ia-config.types.ts       # Tipos de config IA
│   ├── reportes.types.ts        # ✨ NUEVO v2.0 - Tipos de reportes
│   └── gestion-vehiculos.types.ts # ✨ NUEVO v2.0 - Tipos de gestión de vehículos
├── public/                       # Archivos estáticos
└── docs/                         # Documentación
    ├── SOLUCION_ADMIN_AREAS_FINAL.md
    ├── INSTALACION_RAPIDA.md
    ├── COMANDOS_UTILES.md
    ├── SISTEMA_VALORACION_VENTA.md          # ✨ NUEVO v2.0 - Guía completa de valoración
    └── PANEL_ADMIN_VEHICULOS.md             # ✨ NUEVO v2.0 - Panel de administración
```

---

## 🔐 Roles y Permisos

### Usuario Público (Sin Autenticación)

- ✅ Ver mapa con todas las áreas activas
- ✅ Ver detalles de áreas
- ✅ Usar filtros y búsqueda
- 🔒 **PLANIFICADOR DE RUTAS BLOQUEADO** - Requiere registro (la herramienta más potente)
- ❌ No puede valorar, favoritar, registrar visitas o guardar rutas

### Usuario Registrado

- ✅ Todo lo anterior
- ✅ **Acceso completo al Planificador de Rutas** 🎉
- ✅ Guardar rutas personalizadas
- ✅ Crear valoraciones y comentarios
- ✅ Guardar áreas favoritas
- ✅ Registrar visitas con notas
- ✅ Dashboard de perfil completo con estadísticas
- ✅ Ver historial de visitas en mapa
- ✅ Recargar rutas guardadas

### Administrador (`is_admin: true`)

- ✅ Todo lo anterior
- ✅ Acceso al panel `/admin`
- ✅ Crear, editar y borrar áreas
- ✅ Ver áreas inactivas
- ✅ Usar funciones de IA
- ✅ Ver analytics
- ✅ Gestionar usuarios

---

## 🗺️ Planificador de Rutas (NUEVO) 🔒

**La herramienta más potente de la app - Requiere registro gratuito**

### Características

- 📍 **Origen, Destino y Paradas** - Planifica rutas complejas
- 🔍 **Búsqueda de Áreas** - Encuentra áreas a X km de tu ruta
- 📏 **Radio Configurable** - 5, 10, 20 o 50 km
- 💾 **Guardar Rutas** - Guarda tus rutas con nombre y descripción
- 🗂️ **Ver Rutas Guardadas** - Accede desde tu perfil
- 🔄 **Recargar Rutas** - Abre cualquier ruta guardada en el mapa
- 📊 **Información Detallada** - Distancia, duración, paradas
- 🗺️ **Google Maps Directions** - Rutas optimizadas
- 🔒 **Acceso Exclusivo** - Solo para usuarios registrados

### Cómo Usar

1. **Regístrate gratis** en la plataforma (si no lo has hecho)
2. Ve a `/ruta`
3. Introduce origen y destino (usa el autocompletado)
4. (Opcional) Añade paradas intermedias
5. Ajusta el radio de búsqueda
6. Haz clic en "Calcular Ruta"
7. Revisa las áreas encontradas en la ruta
8. (Opcional) Guarda la ruta para uso futuro
9. Desde tu perfil, puedes recargar cualquier ruta guardada

### ¿Por qué requiere registro?

- 💾 Guardar tus rutas personalizadas
- 📊 Acceso a estadísticas de uso
- 🎯 Mejor experiencia personalizada
- 🔄 Sincronización entre dispositivos

---

## 🤖 Tío Viajero IA - Asistente Chatbot (NUEVO) 🔒

**Búsqueda inteligente en lenguaje natural - Requiere registro gratuito**

### Características Principales

- 💬 **Conversación Natural** - Pregunta en español como a un amigo
- 🔍 **Búsqueda Inteligente** - Encuentra áreas con IA (OpenAI GPT-4o-mini)
- 📍 **Geolocalización GPS** - Busca "áreas cerca de mí" con tu ubicación real
- 🌍 **Geocoding Automático** - Convierte tu GPS en ciudad/provincia
- 🧠 **Memoria de Conversación** - Recuerda lo que hablasteis antes
- 🎯 **Recomendaciones Personalizadas** - Basadas en tus necesidades
- 🌍 **Búsqueda por País** - "¿Qué hay en Portugal?"
- 💡 **Respuestas Instantáneas** - 24/7 disponible
- 📱 **Botón Flotante** - Accesible desde cualquier página
- 🔒 **Acceso Exclusivo** - Solo para usuarios registrados

### Tecnología Avanzada

- **Function Calling de OpenAI** - La IA decide qué funciones usar
- **Geocoding Reverso** - GPS → Ciudad automáticamente (Google Maps API)
- **Historial Contextual** - Carga últimos 10 mensajes de la conversación
- **Estadísticas en Tiempo Real** - Sabe cuántas áreas hay en cada país
- **Contexto Enriquecido** - Ubicación del usuario, estadísticas de BD, historial

### Lo que PUEDE hacer

- ✅ Buscar áreas por ubicación específica
- ✅ Recomendar áreas según servicios (agua, electricidad, WiFi, etc.)
- ✅ Filtrar por precio ("áreas gratuitas", "máximo 10€")
- ✅ Listar mejores áreas de un país
- ✅ Obtener detalles completos de un área
- ✅ Responder preguntas sobre servicios

### Lo que NO hace (usa el Planificador de Rutas para esto)

- ❌ NO planifica rutas entre ciudades
- ❌ NO calcula distancias
- ❌ NO encuentra áreas a lo largo de una ruta
- 🔀 **Redirige** al Planificador de Rutas cuando preguntas sobre rutas

### Ejemplos de Preguntas

- "Áreas cerca de Barcelona con electricidad"
- "Busco áreas gratuitas en Portugal"
- "¿Qué hay cerca de mí?"
- "Mejores áreas de España"
- "Áreas con WiFi y mascotas permitidas"
- "Cuéntame sobre el Área Camping del Mar"

### ¿Por qué requiere registro?

- 💬 Historial de conversaciones
- 📍 Geolocalización personalizada
- 🎯 Recomendaciones basadas en tu perfil
- 💾 Guardar áreas recomendadas como favoritas
- 🔄 Sincronización entre dispositivos

---

## 👤 Dashboard de Perfil

### Mis Visitas

- Lista completa de áreas visitadas
- Mapa interactivo mostrando todas tus visitas
- Fecha de visita y notas personales
- Estadística total de visitas

### Mis Valoraciones

- Todas tus valoraciones y comentarios
- Puntuación dada a cada área
- Fecha de valoración
- Contador total

### Mis Favoritos

- Áreas marcadas como favoritas
- Acceso rápido a información
- Botón para quitar de favoritos
- Contador total

### Mis Rutas

- Todas tus rutas guardadas
- Información completa (origen, destino, paradas)
- Distancia y duración
- **Botón "Ver en Mapa"** - Recarga la ruta completa
- Marcar como favorita
- Eliminar rutas
- Contador total

### 🚐 Mi Autocaravana ✨ **NUEVO v2.0**

- **Registro de Vehículos** - Añade tu autocaravana con matrícula, marca, modelo
- **QR Único** - Genera un código QR para pegar en tu vehículo
- **Gestión Completa** - Historial de mantenimientos, averías, documentos, mejoras
- **Control de Kilometraje** - Registro de consumo y kilometraje
- **Ficha Técnica** - Datos técnicos completos del vehículo
- **Dashboard del Vehículo** - Vista completa con estadísticas y accesos rápidos

### 📋 Mis Reportes ✨ **NUEVO v2.0**

- **Sistema de Alertas** - Recibe notificaciones cuando alguien reporta un accidente
- **Reportes Recibidos** - Lista completa de reportes de testigos
- **Información del Testigo** - Contacto directo con quien reportó
- **Ubicación en Mapa** - Visualiza dónde ocurrió el accidente
- **Gestión de Estado** - Marca como leído o cierra reportes
- **Página Pública** - Cualquiera puede reportar accediendo al QR de tu vehículo

### 🤖 Valoración con IA ✨ **NUEVO v3.1**

- **Informe Profesional Generado por IA** - GPT-4 analiza tu vehículo y genera un informe detallado de 400-700 palabras estructurado profesionalmente
- **3 Precios Estratégicos** - Precio de salida (para negociación), precio objetivo (realista), precio mínimo (límite absoluto)
- **Búsqueda Automática de Comparables** - SerpAPI busca automáticamente anuncios similares en portales de venta (Milanuncios, Wallapop, Autoscout24, etc.)
- **Análisis de Mercado Completo** - Compara tu vehículo con anuncios reales actualmente en venta
- **Histórico de Valoraciones** - Guarda todas las valoraciones con fecha para ver evolución del valor en el tiempo
- **Informe Estructurado en Markdown** - Incluye: introducción, análisis de depreciación, valor de extras, comparación con mercado, precios recomendados, y conclusiones
- **Nivel de Confianza** - Alta/Media/Baja según cantidad y calidad de comparables encontrados
- **Enlaces a Comparables** - Acceso directo a los anuncios usados como referencia
- **Descarga en PDF** - Exporta el informe completo con fotos del vehículo
- **Gestión Graceful** - Si SerpAPI no está disponible, usa solo datos internos de GPT-4
- **Prompts Configurables** - Administradores pueden ajustar el comportamiento de la IA desde `/admin/configuracion`

### 📊 Histórico de Valoraciones ✨ **NUEVO v2.0**

- **Evolución Temporal** - Gráfico interactivo del valor en el tiempo
- **Estadísticas de Cambio** - Valor inicial, actual, variación total
- **Valoraciones Manuales** - Añade tasaciones externas (concesionarios, peritos)
- **Comparativa Visual** - Ve cómo evoluciona tu inversión
- **Múltiples Fuentes** - Automático (IA), manual, tasación externa

---

## 🤖 Funciones de IA

### 1. Actualizar Servicios (`/admin/areas/actualizar-servicios`)

- Busca información en web sobre cada área (SerpAPI)
- Analiza los resultados con IA (OpenAI)
- Detecta servicios disponibles automáticamente
- Actualiza la base de datos

### 2. Enriquecer Textos (`/admin/areas/enriquecer-textos`)

- Genera descripciones detalladas y atractivas
- Incluye información turística de la zona
- Estilo natural y profesional
- 400-600 palabras por descripción

### 3. Enriquecer Imágenes (`/admin/areas/enriquecer-imagenes`)

- Busca imágenes de Google para cada área
- Selecciona las mejores fotos
- Las añade automáticamente a la galería
- Hasta 7 imágenes por área

**Configuración:**
Todas las funciones de IA son configurables desde `/admin/configuracion` con prompts flexibles.

---

## 🗺️ Características del Mapa

- **Mapa Base:** Google Maps
- **Marcadores Personalizados** según tipo de área
- **InfoWindows** con información detallada y fotos
- **Geolocalización** del usuario
- **Búsqueda por Ubicación**
- **Filtros en Tiempo Real**
- **Directions API** para rutas optimizadas
- **Lugares API** para autocompletado de direcciones

---

## 📊 Base de Datos

### Tablas Principales

- **areas** - Información de áreas para autocaravanas
- **valoraciones** - Comentarios y puntuaciones
- **favoritos** - Áreas favoritas de usuarios
- **visitas** - Registro de visitas con notas
- **rutas** - Rutas guardadas por usuarios
- **ia_config** - Configuración de agentes IA
- **user_analytics** - Eventos y estadísticas

### 🚐 Sistema de Gestión de Vehículos ✨ **NUEVO v2.0**

- **vehiculos_registrados** - Autocaravanas registradas por usuarios
- **reportes_accidentes** - Reportes de accidentes de testigos
- **notificaciones_reportes** - Historial de notificaciones
- **mantenimientos** - Historial completo de mantenimiento (ITV, aceite, revisiones)
- **averias** - Registro y seguimiento de averías e incidencias
- **vehiculo_documentos** - Biblioteca digital de documentos importantes
- **vehiculo_mejoras** - Registro de mejoras y personalizaciones
- **vehiculo_kilometraje** - Control de consumo y kilometraje
- **vehiculo_ficha_tecnica** - Datos técnicos completos del vehículo

### 💰 Sistema de Valoración Económica ✨ **NUEVO v2.0**

- **vehiculo_valoracion_economica** - Control financiero completo
- **datos_mercado_autocaravanas** - Base de datos pública de precios (anónima)
- **historico_precios_usuario** - Evolución del valor en el tiempo
- **gastos_adicionales** - Seguros, impuestos, parking, etc.

### 🤖 Sistema de Valoración IA ✨ **NUEVO v2.1**

- **valoracion_ia_informes** - Historial completo de valoraciones IA con fecha
  - Cada valoración incluye: 3 precios, informe completo (Markdown), comparables usados (JSON)
  - Métricas: nivel de confianza, precio base mercado, depreciación aplicada
  - Se vincula al vehículo por UUID (no por matrícula, para mantener historial)
  - Trigger automático actualiza `vehiculo_valoracion_economica` con última valoración
  - RLS: usuarios ven solo sus valoraciones, admins ven todas

**Row Level Security (RLS):**

- ✅ Habilitado en todas las tablas
- ✅ Políticas optimizadas para rendimiento
- ✅ Acceso público controlado
- ✅ Los usuarios solo ven sus propios datos privados

---

## 🎨 Sistema de Notificaciones

### Toast Notifications

- ✅ Notificaciones elegantes en la interfaz
- ✅ 3 tipos: success, error, info
- ✅ Auto-cierre a los 3 segundos
- ✅ Cierre manual con botón X
- ✅ Animaciones suaves (fade in/out)
- ❌ Sin más `alert()` del sistema

**Uso en el código:**

```typescript
import { useToast } from "@/hooks/useToast";

const { showToast } = useToast();
showToast("Mensaje exitoso", "success");
showToast("Ocurrió un error", "error");
```

---

## 🚨 Troubleshooting

### Las áreas no se ven en el mapa

**Solución:** Verifica que las áreas tengan `activo = true` en Supabase

### No puedo acceder a /admin

**Solución:** Verifica que tu usuario tenga `is_admin: true` en User Metadata

### Error al borrar/editar áreas

**Solución:** Ejecuta `supabase/FIX-admin-permisos-v3-SIMPLE.sql`

### Las funciones de IA no funcionan

**Solución:** Verifica que tienes las API Keys configuradas en `.env.local`

### El mapa no carga

**Solución:** Verifica que `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` esté configurada correctamente

### No puedo guardar rutas

**Solución:** Ejecuta `supabase/add-rutas-table.sql` en tu base de datos

### Las visitas no aparecen en mi perfil

**Solución:** Verifica que estés autenticado y que las RLS policies estén correctas

---

## 📝 Scripts Útiles

**IMPORTANTE:** Ejecutar desde el directorio del proyecto:

```powershell
cd "E:\Acttax Dropbox\Narciso Pardo\Acttax\EI - FURGOCASA\1 - ADMINISTRACION\7 - ACTIVOS\6 - MAPA FURGOCASA\NEW MAPA FURGOCASA"
```

Luego ejecutar los comandos:

```powershell
# Desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar producción
npm start

# Linting
npm run lint

# Verificar tipos TypeScript
npx tsc --noEmit
```

---

## 🔄 Migración desde SQLite

Si tienes datos en SQLite local, usa los scripts de migración:

```powershell
cd "E:\Acttax Dropbox\Narciso Pardo\Acttax\EI - FURGOCASA\1 - ADMINISTRACION\7 - ACTIVOS\6 - MAPA FURGOCASA\NEW MAPA FURGOCASA"
node scripts/migrate-to-supabase.js      # Migrar áreas
node scripts/migrate-users-to-supabase.js # Migrar usuarios
```

---

## 📚 Documentación

### 🎯 Guía Rápida de Documentación

**NUEVO:** Consulta el **[📋 Índice Completo de Documentación](./INDICE_DOCUMENTACION.md)** para navegar toda la documentación organizada por categorías.

### Documentos Esenciales

#### Instalación y Setup

- **[INSTALACION_RAPIDA.md](./INSTALACION_RAPIDA.md)** - Guía de instalación en 5 pasos
- **[COMANDOS_UTILES.md](./COMANDOS_UTILES.md)** - Comandos frecuentes de desarrollo
- **[docs/configuracion/CONFIGURACION_SUPABASE_URLS.md](./docs/configuracion/CONFIGURACION_SUPABASE_URLS.md)** - Configurar OAuth y URLs
- **[docs/configuracion/CONFIGURACION_SEO.md](./docs/configuracion/CONFIGURACION_SEO.md)** - 🆕 SEO, Sitemap XML y Robots.txt

#### Deployment y SEO

- **[docs/deployment/GUIA_DEPLOYMENT_AWS.md](./docs/deployment/GUIA_DEPLOYMENT_AWS.md)** - Guía completa de deployment en AWS Amplify
- **[docs/configuracion/GUIA_GOOGLE_SEARCH_CONSOLE.md](./docs/configuracion/GUIA_GOOGLE_SEARCH_CONSOLE.md)** - 🆕 Configuración paso a paso de Google Search Console
- **[docs/temporales/FIX_IA_PRODUCCION.md](./docs/temporales/FIX_IA_PRODUCCION.md)** - Solución de funciones IA en producción

#### Sistemas Principales

- **[docs/temporales/SISTEMA_VISITAS_VALORACIONES_COMPLETO.md](./docs/temporales/SISTEMA_VISITAS_VALORACIONES_COMPLETO.md)** - Visitas y valoraciones
- **[docs/temporales/SISTEMA_DETECCION_DUPLICADOS.md](./docs/temporales/SISTEMA_DETECCION_DUPLICADOS.md)** - 7 criterios anti-duplicados
- **[docs/temporales/BUSQUEDA_MASIVA_AREAS.md](./docs/temporales/BUSQUEDA_MASIVA_AREAS.md)** - Importación masiva desde Google Places
- **[docs/temporales/SISTEMA_PROMPTS_FLEXIBLE.md](./docs/temporales/SISTEMA_PROMPTS_FLEXIBLE.md)** - Configuración de IA

#### Soluciones Aplicadas

- **[docs/temporales/SOLUCION_ADMIN_AREAS_FINAL.md](./docs/temporales/SOLUCION_ADMIN_AREAS_FINAL.md)** - Permisos de administrador
- **[docs/temporales/SOLUCION_FUNCIONES_IA_ADMIN.md](./docs/temporales/SOLUCION_FUNCIONES_IA_ADMIN.md)** - Funciones de IA
- **[docs/temporales/OAUTH_GOOGLE_SOLUCION_FINAL.md](./docs/temporales/OAUTH_GOOGLE_SOLUCION_FINAL.md)** - OAuth redirect a producción

#### Debugging

- **[docs/temporales/GUIA_DEBUGGING_IA.md](./docs/temporales/GUIA_DEBUGGING_IA.md)** - Debugging de funciones IA paso a paso
- **[docs/diagnosticos/DIAGNOSTICO_GOOGLE_PLACES_API.md](./docs/diagnosticos/DIAGNOSTICO_GOOGLE_PLACES_API.md)** - Diagnóstico de Google Places API

### 📋 Otros Documentos

Para ver **TODA la documentación organizada** consulta:  
👉 **[INDICE_DOCUMENTACION.md](./INDICE_DOCUMENTACION.md)**

Incluye:

- 30+ documentos organizados por categoría
- Búsqueda por tema
- Flujos de trabajo comunes
- Estado y vigencia de cada documento

---

## 🎉 Novedades en v3.0 (Noviembre 2025) 📊

### 📊 Sistema de Analytics Avanzado por Pestañas

**Panel de administración completamente renovado** (`/admin/analytics`) con análisis detallado por categorías.

#### 🎯 Navegación por Pestañas

- **General** - Vista resumen con KPIs principales
- **Áreas** - Métricas de áreas, distribución, popularidad
- **Usuarios** - Análisis de usuarios, crecimiento, actividad
- **Rutas** - Estadísticas de rutas, distancias, patrones de uso
- **Vehículos** - Análisis financiero, mercado, valoraciones IA
- **Engagement** - Comportamiento de usuarios, sesiones, dispositivos
- **Tops** - Rankings de áreas más populares, visitadas, valoradas

#### 📈 Métricas Temporales Completas

- **Diarias** - Rutas, visitas, IA, actividad hoy
- **Semanales** - Comparativa últimos 7 días
- **Mensuales** - Evolución últimos 30 días
- **Anuales** - Crecimiento últimos 12 meses
- **Gráficos interactivos** - Barras verticales con altura mínima visible

#### 🚐 Análisis de Vehículos

- **Datos Históricos de Usuarios** - Precios de compra reales, inversión total
- **Base de Datos de Mercado (IA)** - Datos scrapeados de anuncios
- **Valoraciones IA** - Vehículos valorados, precios estimados, en venta
- **Distribuciones** - Por precio, año, kilometraje
- **Top 5** - Vehículos más caros/baratos (usuarios vs mercado)
- **Marcas y Modelos** - Más populares en el mercado
- **Registros Mensuales** - Evolución de vehículos registrados

#### 🗺️ Análisis de Rutas

- **Estadísticas básicas** - Total, hoy, semana, mes
- **Distancias** - Promedio, más larga, más corta
- **Distribución** - Por número de puntos, por rango de km
- **Usuarios** - Rutas por usuario, distancia por usuario
- **Evolución** - Rutas y distancia por mes últimos 12 meses

#### 👥 Análisis de Usuarios

- **Usuarios activos** - Hoy, semana, mes
- **Crecimiento** - Nuevos usuarios por mes últimos 12 meses
- **Conversión** - Tasa de registro
- **Retención** - Usuarios recurrentes vs nuevos

#### 💬 Engagement

- **Sesiones** - Total, hoy, semana
- **Métricas de calidad** - Tiempo promedio, páginas por sesión, tasa de rebote
- **Búsquedas** - Total, hoy, semana
- **Vistas de áreas** - Total, hoy, semana
- **Dispositivos** - Distribución por tipo (móvil, desktop, tablet)
- **Actividad por hora** - Patrón de uso durante el día
- **Eventos comunes** - Acciones más frecuentes

#### 🏆 Tops

- **Áreas más visitadas** - Top 10 con foto, ubicación y contador
- **Áreas más valoradas** - Top 10 con promedio de estrellas
- **Áreas en más favoritos** - Top 10 más guardadas
- **Gráficos de barra** - Visualización horizontal con % y gradientes

#### 🎨 Mejoras UI/UX

- **Sticky navigation** - Pestañas siempre visibles al hacer scroll
- **Gráficos mejorados** - Altura mínima 40% para valores, 15% para ceros
- **Colores diferenciados** - Gradientes distintos por sección
- **Iconos representativos** - Cada métrica con su icono
- **Responsive** - Adaptado a móvil y desktop
- **Loading states** - Estados de carga elegantes

---

## 🎉 Novedades en v2.0 (Noviembre 2025) ✨

### 🚐 Sistema Completo de Gestión de Vehículos

1. **Registro de Autocaravanas**

   - Registra tu vehículo con matrícula, marca, modelo, año
   - Genera QR único para pegar en el vehículo
   - Múltiples vehículos por usuario

2. **Sistema de Alertas de Accidentes** 🚨

   - QR único por vehículo para reportes públicos
   - Página pública `/reporte/[qr-id]` para testigos
   - Notificaciones automáticas al propietario
   - Geolocalización automática del accidente
   - Información del testigo (contacto directo)
   - Gestión completa desde el perfil

3. **Gestión Integral del Vehículo**

   - **Mantenimientos:** ITV, cambios de aceite, revisiones periódicas
   - **Averías:** Registro completo con costes y resolución
   - **Documentos:** Biblioteca digital (ITV, seguro, ficha técnica)
   - **Mejoras:** Personalizaciones y mejoras instaladas
   - **Kilometraje:** Control de consumo y kilometraje
   - **Ficha Técnica:** Datos técnicos completos

4. **Valoración Automática con IA** 💶

   - Algoritmo propio de valoración basado en mercado real
   - Comparativa con vehículos similares vendidos
   - 3 rangos de precio: venta rápida, justo, óptimo
   - Ajustes automáticos por kilometraje, estado, averías
   - Nivel de confianza según datos disponibles
   - Poner vehículo en venta con un clic

5. **Análisis Económico Completo** 📊

   - Control financiero total (compra, gastos, venta)
   - Histórico de valoraciones con gráficos interactivos
   - Comparativa con mercado en tiempo real
   - Proyección de costes anuales
   - Análisis de consumo de combustible
   - ROI y ganancia/pérdida calculados automáticamente

6. **Panel de Administración Avanzado** 👨‍💼
   - Analytics de vehículos registrados
   - Análisis por marca/modelo
   - Distribución económica
   - Análisis de siniestralidad
   - Tendencias de mercado
   - Averías recurrentes
   - Mejoras populares
   - Consumo real vs oficial

### 📈 Potencial de Monetización

El sistema genera datos únicos y valiosos:

- Base de datos de mercado español de autocaravanas
- Precios reales de compra/venta
- Costes reales de mantenimiento
- Problemas recurrentes por modelo
- Consumo real vs oficial
- Depreciación real por marca/modelo

**Vías de monetización identificadas:**

- Informes corporativos (aseguradoras, fabricantes)
- Suscripciones B2B (concesionarios)
- API de valoraciones (webs externas)
- Usuarios premium (5-10€/mes)
- Marketplace de servicios (comisiones)

---

## 🎉 Novedades en v1.1 (Noviembre 2025)

### ✨ Panel de Administración Optimizado

1. **Gestión de Usuarios Mejorada** 👥

   - Tabla reorganizada con columnas separadas: Tipo | Nombre | Email | ID | Rol | Fecha | Último Acceso | Estado
   - Iconos visuales de proveedor (Google OAuth / Email)
   - Ordenación inteligente: usuarios más recientes primero por defecto
   - Todas las columnas ordenables individualmente
   - Datos en tiempo real desde Supabase Auth API
   - Sin caché: siempre muestra datos actualizados

2. **Analytics en Tiempo Real** 📊

   - Usuarios reales desde Supabase Auth (no hardcodeado)
   - **Nueva métrica**: Rutas Calculadas 🗺️
   - **Nueva métrica**: Distancia Total de rutas 🛣️ (en km)
   - **Nueva métrica**: Interacciones con IA 🤖 (mensajes chatbot)
   - Métricas de uso completas: ahora se mide TODO

3. **Sistema Sin Caché** 🚫
   - PWA configurado para no cachear APIs de admin
   - Headers HTTP de no-cache en todas las respuestas
   - Botón de recarga manual de datos
   - Página de limpieza de caché (`/clear-cache.html`)
   - Visualización de fecha Y hora en último acceso

### ✨ Características Anteriores (BETA 1.0)

1. **Planificador de Rutas Completo**

   - Integración con Google Maps Directions API
   - Búsqueda de áreas cercanas a la ruta
   - Guardar y recargar rutas

2. **Dashboard de Perfil de Usuario**

   - Vista completa de visitas con mapa
   - Gestión de valoraciones
   - Lista de favoritos
   - Rutas guardadas con recarga

3. **Sistema de Notificaciones Toast**

   - Notificaciones elegantes sin `alert()`
   - Feedback visual mejorado
   - Animaciones suaves

4. **Mejoras en el Mapa**

   - Migración completa a Google Maps API
   - InfoWindows mejoradas con fotos
   - Mejor rendimiento y UX

5. **Sistema Completo de Visitas y Valoraciones**
   - Registro de visitas con notas
   - Valoraciones con comentarios
   - Historial completo en perfil

---

## 🤝 Contribuir

Este es un proyecto personal, pero si encuentras bugs o tienes sugerencias:

1. Abre un Issue
2. Describe el problema o mejora
3. (Opcional) Envía un Pull Request

---

## 📄 Licencia

Este proyecto es de uso personal y educativo.

---

## 👨‍💻 Autor

**Narciso Pardo Buendía**

- Versión 3.0 - Noviembre 2025 (Sistema de Analytics Avanzado por pestañas)
- Versión 2.1 - Noviembre 2025 (Sistema de valoración con IA - GPT-4 + SerpAPI)
- Versión 2.0 - Noviembre 2025 (Sistema completo de gestión de vehículos)
- Versión 1.1 - Noviembre 2025 (Optimizaciones panel admin)
- Versión BETA 1.0 - Octubre 2025

---

## 🙏 Agradecimientos

- Google Maps por la plataforma de mapas y rutas
- Supabase por la infraestructura
- OpenAI por las capacidades de IA
- La comunidad de autocaravanistas

---

## 📊 Estadísticas del Sistema

### Base de Datos Global

- 🌍 **25+ países** con áreas normalizadas
- 🗺️ **100+ regiones** administrativas mapeadas (CCAA, Länder, Regioni, States, etc.)
- 📍 **13,850+ áreas** con datos geográficos estructurados
- ✅ **100% cobertura** de país y región para todas las áreas activas

### Países Incluidos

**🇪🇺 Europa:** España, Francia, Alemania, Italia, Portugal, Austria, Suiza, Bélgica, Países Bajos, Reino Unido, Polonia, Chequia, Croacia, Noruega, Suecia, Dinamarca, Grecia, Eslovenia, y más

**🌎 América:** Estados Unidos, México, Argentina, Chile, Brasil, Colombia, Perú

**🌏 Oceanía:** Australia, Nueva Zelanda

**🌍 África:** Marruecos

---

## 📚 Documentación Completa

Para más información, consulta:

- **[INDICE_DOCUMENTACION.md](./INDICE_DOCUMENTACION.md)** - Índice completo de 30+ documentos
- **[CHANGELOG.md](./CHANGELOG.md)** - Registro detallado de cambios
- **[docs/mejoras/MEJORAS_FILTROS_Y_NORMALIZACION.md](./docs/mejoras/MEJORAS_FILTROS_Y_NORMALIZACION.md)** - Última actualización (29-oct-2025)

---

## 📞 Soporte

Para dudas o problemas:

- Revisa la **[documentación completa](./INDICE_DOCUMENTACION.md)**
- Consulta los scripts SQL en `/supabase`
- Verifica la consola del navegador (F12)

---

**¡Feliz viaje! 🚐✨**

_Mapa Furgocasa - v3.0.0 - Sistema Global con Analytics Avanzado en Producción_
