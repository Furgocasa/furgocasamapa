# 🎨 Sistema de Banners Rotativos Casi Cinco

Sistema inteligente de banners publicitarios que promocionan **Casi Cinco** en las páginas de detalle de áreas de **Furgocasa**.

## 📋 Descripción

Este sistema muestra banners de forma **aleatoria y adaptativa** según el dispositivo del usuario, creando una experiencia dinámica que:

- ✅ Evita la ceguera publicitaria (banner blindness)
- ✅ Realiza A/B testing automático
- ✅ Maximiza el engagement con variedad visual
- ✅ Genera link building de calidad entre propiedades web
- ✅ Ofrece tracking detallado con UTM parameters

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

## 📱 Banners por Dispositivo

### **MÓVIL** (< 768px)
- `BannerMobile` - Compacto 320x100px ⭐ **Peso: 1.0**
- `BannerHeroHorizontal` - También responsive ⭐ **Peso: 0.5**

### **TABLET** (768px - 1024px)
- `BannerHeroHorizontal` - 728x90px ⭐ **Peso: 1.0**
- `BannerCuadradoMedium` - 300x250px ⭐ **Peso: 1.0**
- `BannerLeaderboardFull` - 970x90px ⭐ **Peso: 1.0**

### **DESKTOP** (> 1024px)
- `BannerPremiumAnimated` - 600x400px ⭐ **Peso: 1.5** (favorito)
- `BannerWideCarousel` - 1200px ⭐ **Peso: 1.2**
- `BannerUltraWideModern` - 1400px ⭐ **Peso: 1.3**
- `BannerVerticalSidebar` - 300x600px ⭐ **Peso: 1.0**
- `BannerLeaderboardFull` - Desktop también ⭐ **Peso: 0.8**
- `BannerCuadradoMedium` - Desktop también ⭐ **Peso: 0.7**

> **Nota**: Los pesos determinan la frecuencia de aparición. Mayor peso = más frecuente.

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

## 🌐 SEO y Link Building

### Ventajas SEO:

1. **Link Juice**: Enlaces desde Furgocasa (tu propio sitio) hacia Casi Cinco
2. **Relevancia temática**: Ambos sitios relacionados con viajes
3. **Anchor text variado**: Diferentes textos de enlace en cada banner
4. **DoFollow links**: Pasan autoridad de dominio
5. **Enlaces contextuales**: Dentro de contenido relevante

### Mejores Prácticas:

- ✅ **No saturar**: Máximo 2-3 banners por página
- ✅ **Variar diseños**: Rotar cada 2-3 semanas
- ✅ **A/B Testing**: Probar versiones y medir CTR
- ✅ **Monitorear Analytics**: Ajustar según datos reales

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

## 📈 Roadmap Futuro

- [ ] Añadir banners temáticos por categoría (Restaurantes, Bares, Hoteles)
- [ ] Implementar rotación temporal (cambiar cada X días)
- [ ] Sistema de A/B testing con métricas en tiempo real
- [ ] Dashboard interno para ver performance de banners
- [ ] Integración con Google Optimize para experimentos
- [ ] Banners personalizados por ubicación del usuario

---

## 📞 Soporte

**Proyecto**: Mapa Furgocasa  
**Promociona**: Casi Cinco (www.casicinco.com)  
**Objetivo**: Link building + cross-promotion + mejor UX para usuarios

---

## 📝 Licencia

© 2025 Furgocasa & Casi Cinco - Todos los derechos reservados

---

**🚀 ¡Sistema de Banners Implementado con Éxito!**
