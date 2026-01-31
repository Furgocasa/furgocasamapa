# 🎨 Sistema de Banners Dual: Casi Cinco + Furgocasa

**Fecha**: 31 Enero 2026  
**Versión**: 2.0  
**Estado**: ✅ En Producción

---

## 📋 Resumen Ejecutivo

Sistema de banners publicitarios que promociona **dos marcas** (Casi Cinco y Furgocasa) en las páginas de detalle de áreas de Mapa Furgocasa, con rotación inteligente y cumplimiento total de directrices SEO de Google.

### KPIs del Sistema

| Métrica | Valor |
|---------|-------|
| **Total Banners** | 20 (12 Casi Cinco + 8 Furgocasa) |
| **Banners por Página** | 3 (sin repetición) |
| **Combinaciones Posibles** | 1,140 |
| **Imágenes Reales** | 4 (campers Furgocasa) |
| **Enlaces SEO-Safe** | 69 (todos con sponsored+nofollow) |
| **Dispositivos** | Mobile, Tablet, Desktop |
| **Marcas Promocionadas** | 2 |

---

## 🌟 Marca 1: Casi Cinco

### Qué promociona
- **Restaurantes** con rating +4.7★
- **Bares** verificados con Google Maps
- **Hoteles** de alta calidad
- **Planificador de Rutas IA**
- **+3,500 lugares** en España

### Banners (12 tipos)
1. `BannerHeroHorizontal` - Compacto horizontal
2. `BannerCuadradoMedium` - Cuadrado mediano
3. `BannerLeaderboardFull` - Leaderboard completo
4. `BannerPremiumAnimated` - Premium con animaciones
5. `BannerVerticalSidebar` - Sidebar vertical
6. `BannerMobile` - Optimizado móvil
7. `BannerWideCarousel` - Carrusel categorías
8. `BannerUltraWideModern` - Ultra ancho moderno
9. `BannerUltraWideBares` - Específico bares
10. `BannerUltraWideHoteles` - Específico hoteles
11. `BannerUltraWideRestaurantes` - Específico restaurantes
12. `BannerMegaWideSlider` - Mega slider

### Colores de Marca
- **Primario**: `#063971` (azul oscuro)
- **Secundario**: `#ffd935` (amarillo dorado)

### URL Destino
```
https://www.casicinco.com
utm_source=furgocasa
utm_medium=banner
utm_campaign={banner}_{position}_area_detail
```

---

## 🚐 Marca 2: Furgocasa

### Qué promociona
- **Alquiler de Campers**: Desde 95€/día con KM ilimitados
- **Venta de Campers**: Desde 49.000€ (10 vehículos disponibles)
- **Flota Premium**: Campers gran volumen
- **4.9★ Valoración**
- **14+ años experiencia**

### Banners (8 tipos)
1. `BannerFurgocasaHero` - Compacto horizontal
2. `BannerFurgocasaLeaderboard` - Leaderboard completo
3. `BannerFurgocasaVertical` - Sidebar vertical
4. `BannerFurgocasaMobile` - Optimizado móvil
5. `BannerFurgocasaWide` - Ancho con servicios
6. `BannerFurgocasaPremium` - Premium con animaciones
7. `BannerFurgocasaImageAlquiler` 📸 - Con imagen real ALQUILER
8. `BannerFurgocasaImageVenta` 📸 - Con imagen real VENTA

### Colores de Marca
- **Alquiler**: `#1a5490` (azul Furgocasa) + `#ff6b35` (naranja)
- **Venta**: `#2c5f2d` (verde oscuro) + `#4ade80` (verde claro)

### URLs Destino
```
Alquiler: https://www.furgocasa.com/es
Venta: https://www.furgocasa.com/es/ventas
utm_source=mapafurgocasa
utm_medium=banner
utm_campaign={banner}_{position}_area_detail
```

### Imágenes Utilizadas
- `camper-exterior-1.jpg` - Exterior camper (alquiler fondo)
- `camper-interior-1.jpg` - Interior camper (alquiler destacada)
- `camper-venta-bg.jpg` - Camper venta (fondo)
- `camper-venta-1.jpg` - Camper venta (destacada)

---

## 🎲 Sistema de Rotación

### Características Clave

1. **Mezcla Aleatoria**: Cada carga puede mostrar diferentes combinaciones de marcas
2. **No Repetición**: GARANTIZA que el mismo banner no aparece 2 veces en la misma página
3. **Pesos Inteligentes**: Banners premium tienen mayor probabilidad de aparecer
4. **Responsive**: Diferentes pools de banners por dispositivo

### Algoritmo de Selección

```typescript
// 1. Detectar dispositivo (mobile/tablet/desktop)
const deviceType = getDeviceType()
const bannerPool = BANNERS_CONFIG[deviceType]

// 2. Filtrar banners ya usados
const availableBanners = bannerPool.filter(
  b => !usedBanners.includes(b.id)
)

// 3. Seleccionar según estrategia
switch (strategy) {
  case 'weighted':
    // 70% determinista (hash) + 30% aleatorio con pesos
  case 'deterministic':
    // Hash de areaId + position + usedBanners
  case 'random':
    // Aleatorio puro
}

// 4. Marcar como usado
markBannerAsUsed(selected.id)
```

### Contexto Global (BannerProvider)

```tsx
<BannerProvider>
  {/* Garantiza no repetición en toda la página */}
  <BannerRotativo position="after-info" priority={1} />
  <BannerRotativo position="after-gallery" priority={2} />
  <BannerRotativo position="after-related" priority={3} />
</BannerProvider>
```

---

## 📊 Ejemplos de Distribución

### Ejemplo 1: Mix Equilibrado
```
Banner 1 (after-info):     🚐 Furgocasa Image Alquiler
Banner 2 (after-gallery):  🍽️ Casi Cinco Restaurantes
Banner 3 (after-related):  🚐 Furgocasa Image Venta
```

### Ejemplo 2: Casi Cinco Predominante
```
Banner 1 (after-info):     ⭐ Casi Cinco Premium Animated
Banner 2 (after-gallery):  🍺 Casi Cinco Bares Ultra Wide
Banner 3 (after-related):  🚐 Furgocasa Hero
```

### Ejemplo 3: Furgocasa Predominante
```
Banner 1 (after-info):     🚐 Furgocasa Premium
Banner 2 (after-gallery):  🏨 Casi Cinco Hoteles
Banner 3 (after-related):  🚐 Furgocasa Wide
```

---

## 🛡️ SEO y Cumplimiento

### Atributos Correctos (TODOS los enlaces)

```html
<a href="..." 
   target="_blank" 
   rel="noopener noreferrer sponsored nofollow">
```

| Atributo | Google requiere | Implementado |
|----------|----------------|--------------|
| `sponsored` | ✅ SÍ (publicidad) | ✅ SÍ |
| `nofollow` | ✅ SÍ (no PageRank) | ✅ SÍ |
| `noopener` | ⭐ Recomendado | ✅ SÍ |
| `noreferrer` | ⭐ Recomendado | ✅ SÍ |

### Protección

- ✅ **Mapa Furgocasa**: Protegido contra penalización por venta de enlaces
- ✅ **Casi Cinco**: Protegido contra penalización por participar en esquemas
- ✅ **Furgocasa**: Protegido (enlaces propios bien marcados)

---

## 📈 Tracking y Analytics

### UTM Parameters

Cada banner incluye tracking completo:

**Casi Cinco:**
```
https://www.casicinco.com?
  utm_source=furgocasa&
  utm_medium=banner&
  utm_campaign=ultra_wide_bares_after-gallery_area_detail
```

**Furgocasa:**
```
https://www.furgocasa.com/es?
  utm_source=mapafurgocasa&
  utm_medium=banner&
  utm_campaign=furgocasa_img_alquiler_after-info_area_detail
```

### Métricas Clave a Monitorizar

| Métrica | Qué Mide | Objetivo |
|---------|----------|----------|
| **CTR por banner** | Qué diseño convierte más | >2% |
| **CTR por marca** | Casi Cinco vs Furgocasa | Equilibrado 50/50 |
| **CTR por posición** | Qué ubicación funciona mejor | after-info > rest |
| **Conversiones** | Reservas/ventas generadas | Medir ROI |
| **Bounce Rate** | Calidad del tráfico | <60% |

### Google Analytics

1. **Adquisición** → **Campañas**
2. Filtrar: `area_detail`
3. Comparar: `furgocasa` vs `mapafurgocasa` (utm_source)

---

## 🚀 Despliegue y Estado

### Commit
```
feat: añadir banners de Furgocasa y mejorar SEO de publicidad

- 8 banners nuevos de Furgocasa (alquiler + venta)
- 69 enlaces con rel="sponsored nofollow"
- 4 imágenes reales de campers
- Sistema de rotación sin repetición
- Mezcla aleatoria Casi Cinco + Furgocasa
```

### Repositorio
```
https://github.com/Furgocasa/furgocasamapa.git
Branch: main
```

### Producción
- ✅ **Desplegado**: 31 Enero 2026
- ✅ **Vercel**: Auto-deploy activado
- ✅ **URL**: https://www.mapafurgocasa.com

---

## 📝 Próximos Pasos

### Corto Plazo (1-2 semanas)
- [ ] Monitorizar CTR de cada banner
- [ ] A/B testing: Furgocasa Image vs Text-only
- [ ] Verificar que no hay errores 404 en imágenes

### Medio Plazo (1-2 meses)
- [ ] Dashboard de analytics interno
- [ ] Más variaciones de banners con imágenes
- [ ] Banners temáticos por temporada (verano/invierno)

### Largo Plazo (3-6 meses)
- [ ] Geo-targeting: banners según ubicación del usuario
- [ ] Personalización: según historial de navegación
- [ ] Integración con Google Optimize

---

**Documentación creada**: 31 Enero 2026  
**Última actualización**: 31 Enero 2026  
**Responsable**: Sistema de Banners Mapa Furgocasa
