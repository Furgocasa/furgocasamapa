# 🎨 Sistema de Banners Rotativos - Casi Cinco & Furgocasa

Sistema inteligente de banners publicitarios que promocionan **Casi Cinco** (restaurantes, bares, hoteles) y **Furgocasa** (alquiler y venta de campers) en las páginas de detalle de áreas.

## 📋 Descripción

Este sistema muestra banners de **dos marcas** (Casi Cinco y Furgocasa) de forma **aleatoria y adaptativa** según el dispositivo del usuario, creando una experiencia dinámica que:

- ✅ **Mezcla aleatoria**: Banners de Casi Cinco y Furgocasa en la misma página
- ✅ **No repetición**: NUNCA se repite el mismo banner en la misma página
- ✅ **SEO-Friendly**: Todos los enlaces incluyen `rel="sponsored nofollow"` (directrices Google)
- ✅ **Evita banner blindness**: Variedad visual y rotación inteligente
- ✅ **A/B testing automático**: Diferentes diseños para optimizar conversión
- ✅ **Link building de calidad**: Cross-promotion entre propiedades web
- ✅ **Tracking completo**: UTM parameters por banner, posición y campaña
- ✅ **Imágenes reales**: Fotos de campers para mayor atractivo

---

## 🎯 Estrategia de Colocación

Los banners se muestran en **3 ubicaciones estratégicas** en cada página de área:

### 1. **Después de Información Básica** (`after-info`)
- **Contexto**: Usuario ya leyó info básica, está interesado
- **Estrategia**: `weighted` (70% determinista + 30% aleatorio)
- **Objetivo**: Captar atención temprana

### 2. **Después de Galería de Fotos** (`after-gallery`)
- **Contexto**: Usuario vio todo, está pensando en planificar ruta
- **Estrategia**: `weighted`
- **Objetivo**: Momento ideal para ofrecer planificador de rutas
- **Exclusión**: Banners móviles (ya no necesarios en este punto)

### 3. **Después de Áreas Relacionadas** (`after-related`)
- **Contexto**: Final de página, última oportunidad
- **Estrategia**: `deterministic` (mismo banner por área)
- **Objetivo**: Última llamada a la acción

---

## 📱 Banners Disponibles

### 🌟 **CASI CINCO** (12 banners)
Promocionan restaurantes, bares y hoteles con rating +4.7★

#### Mobile (< 768px)
- `BannerMobile` ⭐ **Peso: 1.5**
- `BannerCuadradoMedium` ⭐ **Peso: 1.3**
- `BannerVerticalSidebar` ⭐ **Peso: 1.2**
- `BannerHeroHorizontal` ⭐ **Peso: 0.8**
- Banners UltraWide (Bares, Hoteles, Restaurantes) ⭐ **Peso: 1.0**

#### Desktop (≥ 1024px)
- `BannerUltraWideBares/Hoteles/Restaurantes` ⭐ **Peso: 1.6** (categorías)
- `BannerPremiumAnimated` ⭐ **Peso: 1.4** (con animaciones)
- `BannerMegaWideSlider` ⭐ **Peso: 1.4** (slider)
- `BannerUltraWideModern` ⭐ **Peso: 1.3**
- `BannerWideCarousel` ⭐ **Peso: 1.3**
- `BannerVerticalSidebar` ⭐ **Peso: 1.1**
- `BannerLeaderboardFull` ⭐ **Peso: 0.9**
- `BannerHeroHorizontal` ⭐ **Peso: 0.8**

### 🚐 **FURGOCASA** (8 banners)
Promocionan alquiler (desde 95€/día) y venta (desde 49.000€) de campers

#### Mobile (< 768px)
- `BannerFurgocasaMobile` ⭐ **Peso: 1.5**
- `BannerFurgocasaHero` ⭐ **Peso: 1.3**
- `BannerFurgocasaVertical` ⭐ **Peso: 1.2**

#### Desktop (≥ 1024px)
- `BannerFurgocasaImageAlquiler` 📸 ⭐ **Peso: 1.7** (con foto real - ALQUILER)
- `BannerFurgocasaImageVenta` 📸 ⭐ **Peso: 1.7** (con foto real - VENTA)
- `BannerFurgocasaPremium` ⭐ **Peso: 1.6**
- `BannerFurgocasaWide` ⭐ **Peso: 1.5**
- `BannerFurgocasaLeaderboard` ⭐ **Peso: 1.4**
- `BannerFurgocasaHero` ⭐ **Peso: 1.3**
- `BannerFurgocasaVertical` ⭐ **Peso: 1.1**

> **Total: 20 banners** (12 Casi Cinco + 8 Furgocasa)  
> **Nota**: Mayor peso = mayor probabilidad de aparecer

---

## 🔧 Uso

### Básico

```tsx
import { BannerRotativo } from '@/components/banners/BannerRotativo'

<BannerRotativo 
  areaId={area.id} 
  position="after-info" 
/>
```

### Con Opciones Avanzadas

```tsx
<BannerRotativo 
  areaId={area.id} 
  position="after-gallery" 
  strategy="weighted"           // 'random' | 'deterministic' | 'weighted'
  exclude={['mobile']}          // Excluir ciertos banners
/>
```

---

## ⚙️ Estrategias de Selección

### 1. **`random`** - Completamente Aleatorio
Cada carga muestra un banner diferente al azar.

```tsx
<BannerRotativo strategy="random" />
```

### 2. **`deterministic`** - Basado en ID
La misma área siempre muestra el mismo banner (útil para consistencia).

```tsx
<BannerRotativo areaId={123} strategy="deterministic" />
```

### 3. **`weighted`** - Ponderado Inteligente ⭐ (Recomendado)
70% determinista + 30% aleatorio con pesos.

```tsx
<BannerRotativo areaId={123} strategy="weighted" />
```

---

## 📊 Tracking y Analytics

Cada banner incluye **UTM parameters únicos** para tracking en Google Analytics:

### Formato de UTM

```
utm_source=furgocasa
utm_medium=banner
utm_campaign={banner_type}_{position}_area_detail
```

### Ejemplos de Campaigns

- `hero_horizontal_after-info_area_detail`
- `premium_animated_after-gallery_area_detail`
- `ultra_wide_modern_after-related_area_detail`

### Analizar en Google Analytics

1. Ve a **Google Analytics** → **Adquisición** → **Campañas**
2. Busca campañas que contengan `area_detail`
3. Compara métricas:
   - **CTR**: Clics / Impresiones
   - **Conversiones**: Usuarios que llegaron a Casi Cinco
   - **Engagement**: Tiempo en sitio, páginas vistas

### Métricas Clave a Monitorizar

| Métrica | Qué Mide |
|---------|----------|
| **CTR por banner** | Qué diseño genera más clicks |
| **CTR por posición** | Qué ubicación funciona mejor |
| **Conversiones** | Cuántos usuarios exploran Casi Cinco |
| **Bounce rate** | Calidad del tráfico generado |

---

## 🎨 Características de los Banners

### Todos los Banners Incluyen:

- ✅ **Diseño responsive** completo
- ✅ **Animaciones CSS** (hover, pulse, float)
- ✅ **Enlaces UTM** para tracking
- ✅ **Target="_blank"** (nueva pestaña)
- ✅ **rel="noopener noreferrer sponsored nofollow"** (seguridad + SEO publicidad)
- ✅ **Glassmorphism** y efectos modernos
- ✅ **Transiciones suaves** 
- ✅ **Colores de marca** Casi Cinco (#063971, #ffd935)

### Características Especiales:

- **BannerWideCarousel**: Carrusel infinito animado de lugares
- **BannerPremiumAnimated**: Grid de features con hover interactivo
- **BannerUltraWideModern**: Gradiente animado + elementos flotantes
- **BannerVerticalSidebar**: Navegación por categorías (Restaurantes, Bares, Hoteles)
- **BannerMobile**: Icono rotatorio animado

---

## 🌐 SEO y Cumplimiento Google

### ✅ Atributos SEO Correctos

**TODOS los enlaces publicitarios incluyen:**
```html
rel="noopener noreferrer sponsored nofollow"
```

| Atributo | Propósito |
|----------|-----------|
| `noopener` | Seguridad: previene ataques tabnabbing |
| `noreferrer` | No envía cabecera HTTP Referer |
| `sponsored` | **CRÍTICO**: Indica a Google que es publicidad |
| `nofollow` | **CRÍTICO**: No transfiere PageRank |

### 🛡️ Protección contra Penalizaciones

Según las [directrices de Google sobre esquemas de enlaces](https://developers.google.com/search/docs/essentials/spam-policies#link-spam):

- ❌ **SIN estos atributos**: Riesgo de penalización por "venta de enlaces" no declarados
- ✅ **CON estos atributos**: Cumplimiento total de las políticas de Google

### 🔗 Ventajas SEO

1. **Cross-promotion legítima**: Entre propiedades relacionadas con viajes
2. **Anchor text variado**: Diferentes textos de enlace en cada banner
3. **Enlaces contextuales**: Dentro de contenido relevante para el usuario
4. **Tráfico de calidad**: Usuarios interesados en viajes y áreas de autocaravanas

### 📊 Mejores Prácticas

- ✅ **3 banners por página**: Balance perfecto sin saturar
- ✅ **No repetir**: Sistema garantiza variedad en cada página
- ✅ **Mezcla de marcas**: Casi Cinco + Furgocasa para diversidad
- ✅ **Tracking UTM**: Medir conversiones y ajustar estrategia
- ✅ **Imágenes reales**: Mayor CTR con fotos de productos reales

---

## 🔄 Actualización de Banners

Para añadir un nuevo banner:

### 1. Crear Componente

```tsx
// components/banners/BannerNuevo.tsx
'use client'

interface BannerProps {
  position: string
}

export function BannerNuevo({ position }: BannerProps) {
  const utmCampaign = `nuevo_banner_${position}_area_detail`

  return (
    <div className="w-full max-w-[1000px] mx-auto">
      {/* Tu diseño aquí */}
      <a
        href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
      >
        {/* Contenido del banner */}
      </a>
    </div>
  )
}
```

### 2. Registrar en BannerRotativo

```tsx
// components/banners/BannerRotativo.tsx

import { BannerNuevo } from './BannerNuevo'

const BANNERS_CONFIG = {
  desktop: [
    // ... otros banners
    { id: 'nuevo-banner', component: BannerNuevo, weight: 1.0 },
  ],
}
```

---

## 🐛 Troubleshooting

### Banner no se muestra

1. ✅ Verifica que el componente esté importado en `BannerRotativo.tsx`
2. ✅ Comprueba que esté en el pool correcto (mobile/tablet/desktop)
3. ✅ Revisa la consola del navegador por errores

### Banner se ve mal en móvil

1. ✅ Añade media queries para responsive
2. ✅ Usa clases de Tailwind responsive (`md:`, `lg:`)
3. ✅ Prueba con DevTools en diferentes tamaños

### Tracking no funciona

1. ✅ Verifica que los UTM parameters estén bien formateados
2. ✅ Comprueba en Google Analytics → Tiempo Real
3. ✅ Usa extensiones como "Google Analytics Debugger"

---

## 🎯 Distribución en Páginas

Cada página de detalle de área muestra **3 banners**:

| Posición | Estrategia | Marcas Posibles | Ejemplo |
|----------|-----------|-----------------|---------|
| **Banner 1** (after-info) | `weighted` | Casi Cinco o Furgocasa | Furgocasa Premium |
| **Banner 2** (after-gallery) | `weighted` | Casi Cinco o Furgocasa | Casi Cinco Bares |
| **Banner 3** (after-related) | `deterministic` | Casi Cinco o Furgocasa | Furgocasa Venta |

### Ejemplos Reales de Distribución

**Ejemplo 1: Equilibrado**
- 🚐 Furgocasa Alquiler (con imagen)
- 🍽️ Casi Cinco Restaurantes
- 🚐 Furgocasa Venta (con imagen)

**Ejemplo 2: Casi Cinco predominante**
- ⭐ Casi Cinco Premium Animated
- 🍺 Casi Cinco Bares
- 🚐 Furgocasa Hero

**Ejemplo 3: Furgocasa predominante**
- 🚐 Furgocasa Wide
- ⭐ Casi Cinco Hoteles
- 🚐 Furgocasa Leaderboard

## 📈 Roadmap Futuro

- [x] ✅ Banners temáticos por categoría (Restaurantes, Bares, Hoteles)
- [x] ✅ Banners de Furgocasa (alquiler + venta)
- [x] ✅ Sistema de no repetición en misma página
- [x] ✅ Banners con imágenes reales
- [x] ✅ Atributos SEO correctos (sponsored nofollow)
- [ ] Dashboard interno para ver performance de banners
- [ ] Integración con Google Optimize para experimentos
- [ ] Banners personalizados por ubicación del usuario (geo-targeting)
- [ ] Más banners con imágenes de diferentes campers

---

## 📞 Información del Proyecto

**Proyecto**: Mapa Furgocasa (www.mapafurgocasa.com)  
**Promociona**:
- 🌟 **Casi Cinco** (www.casicinco.com) - Restaurantes, bares y hoteles +4.7★
- 🚐 **Furgocasa** (www.furgocasa.com/es) - Alquiler y venta de campers

**Objetivos**:
- ✅ Cross-promotion entre propiedades relacionadas con viajes
- ✅ Mejor UX: ofrecer valor adicional al usuario (dónde comer, alquilar camper)
- ✅ Monetización: conversiones de alquiler y venta de campers
- ✅ SEO: cumplimiento de directrices Google con enlaces sponsored
- ✅ Métricas: tracking completo con UTM para optimización continua

## 📊 Estadísticas del Sistema

- **Total banners**: 20 (12 Casi Cinco + 8 Furgocasa)
- **Banners por página**: 3 (sin repetición)
- **Combinaciones posibles**: 1,140 (20 × 19 × 18 / 6)
- **Imágenes reales**: 4 (campers de Furgocasa)
- **Enlaces actualizados**: 69 (todos con rel="sponsored nofollow")
- **Dispositivos soportados**: Mobile, Tablet, Desktop
- **Marcas promocionadas**: 2 (Casi Cinco + Furgocasa)

---

## 📝 Licencia

© 2025 Furgocasa & Casi Cinco - Todos los derechos reservados

---

**🚀 ¡Sistema de Banners Implementado con Éxito!**
