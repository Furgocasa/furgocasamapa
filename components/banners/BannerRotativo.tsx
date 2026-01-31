'use client'

import { useEffect, useState, useRef } from 'react'
// Banners Casi Cinco
import { BannerHeroHorizontal } from './BannerHeroHorizontal'
import { BannerCuadradoMedium } from './BannerCuadradoMedium'
import { BannerLeaderboardFull } from './BannerLeaderboardFull'
import { BannerPremiumAnimated } from './BannerPremiumAnimated'
import { BannerVerticalSidebar } from './BannerVerticalSidebar'
import { BannerMobile } from './BannerMobile'
import { BannerWideCarousel } from './BannerWideCarousel'
import { BannerUltraWideModern } from './BannerUltraWideModern'
import { BannerUltraWideBares } from './BannerUltraWideBares'
import { BannerUltraWideHoteles } from './BannerUltraWideHoteles'
import { BannerUltraWideRestaurantes } from './BannerUltraWideRestaurantes'
import { BannerMegaWideSlider } from './BannerMegaWideSlider'
// Banners Furgocasa
import { BannerFurgocasaHero } from './BannerFurgocasaHero'
import { BannerFurgocasaLeaderboard } from './BannerFurgocasaLeaderboard'
import { BannerFurgocasaVertical } from './BannerFurgocasaVertical'
import { BannerFurgocasaMobile } from './BannerFurgocasaMobile'
import { BannerFurgocasaWide } from './BannerFurgocasaWide'
import { BannerFurgocasaPremium } from './BannerFurgocasaPremium'
import { BannerFurgocasaImageAlquiler } from './BannerFurgocasaImageAlquiler'
import { BannerFurgocasaImageVenta } from './BannerFurgocasaImageVenta'
import { useBannerContext } from './BannerContext'

interface BannerConfig {
  id: string
  component: React.ComponentType<{ position: string }>
  weight: number
}

const BANNERS_CONFIG = {
  mobile: [
    // Casi Cinco
    { id: 'banner-mobile', component: BannerMobile, weight: 1.5 },
    { id: 'cuadrado-medium-mobile', component: BannerCuadradoMedium, weight: 1.3 },
    { id: 'vertical-sidebar-mobile', component: BannerVerticalSidebar, weight: 1.2 },
    { id: 'hero-horizontal-mobile', component: BannerHeroHorizontal, weight: 0.8 },
    { id: 'ultra-wide-bares-mobile', component: BannerUltraWideBares, weight: 1 },
    { id: 'ultra-wide-hoteles-mobile', component: BannerUltraWideHoteles, weight: 1 },
    { id: 'ultra-wide-restaurantes-mobile', component: BannerUltraWideRestaurantes, weight: 1 },
    // Furgocasa
    { id: 'furgocasa-mobile', component: BannerFurgocasaMobile, weight: 1.5 },
    { id: 'furgocasa-hero-mobile', component: BannerFurgocasaHero, weight: 1.3 },
    { id: 'furgocasa-vertical-mobile', component: BannerFurgocasaVertical, weight: 1.2 },
  ] as BannerConfig[],
  tablet: [
    // Casi Cinco
    { id: 'cuadrado-medium-tablet', component: BannerCuadradoMedium, weight: 1.3 },
    { id: 'hero-horizontal', component: BannerHeroHorizontal, weight: 1 },
    { id: 'leaderboard-full', component: BannerLeaderboardFull, weight: 1 },
    { id: 'ultra-wide-bares-tablet', component: BannerUltraWideBares, weight: 1.4 },
    { id: 'ultra-wide-hoteles-tablet', component: BannerUltraWideHoteles, weight: 1.4 },
    { id: 'ultra-wide-restaurantes-tablet', component: BannerUltraWideRestaurantes, weight: 1.4 },
    { id: 'wide-carousel-tablet', component: BannerWideCarousel, weight: 1.2 },
    // Furgocasa
    { id: 'furgocasa-hero-tablet', component: BannerFurgocasaHero, weight: 1.4 },
    { id: 'furgocasa-leaderboard-tablet', component: BannerFurgocasaLeaderboard, weight: 1.4 },
    { id: 'furgocasa-wide-tablet', component: BannerFurgocasaWide, weight: 1.3 },
    { id: 'furgocasa-premium-tablet', component: BannerFurgocasaPremium, weight: 1.3 },
    { id: 'furgocasa-img-alquiler-tablet', component: BannerFurgocasaImageAlquiler, weight: 1.5 },
  ] as BannerConfig[],
  desktop: [
    // 🎯 Casi Cinco - Banners específicos por categoría
    { id: 'ultra-wide-bares-desktop', component: BannerUltraWideBares, weight: 1.6 },
    { id: 'ultra-wide-hoteles-desktop', component: BannerUltraWideHoteles, weight: 1.6 },
    { id: 'ultra-wide-restaurantes-desktop', component: BannerUltraWideRestaurantes, weight: 1.6 },
    
    // 🎨 Casi Cinco - Banners premium con animaciones
    { id: 'premium-animated-desktop', component: BannerPremiumAnimated, weight: 1.4 },
    { id: 'mega-wide-slider-desktop', component: BannerMegaWideSlider, weight: 1.4 },
    { id: 'ultra-wide-modern-desktop', component: BannerUltraWideModern, weight: 1.3 },
    { id: 'wide-carousel-desktop', component: BannerWideCarousel, weight: 1.3 },
    
    // 📐 Casi Cinco - Banners estándar
    { id: 'vertical-sidebar-desktop', component: BannerVerticalSidebar, weight: 1.1 },
    { id: 'leaderboard-full-desktop', component: BannerLeaderboardFull, weight: 0.9 },
    { id: 'hero-horizontal-desktop', component: BannerHeroHorizontal, weight: 0.8 },
    { id: 'cuadrado-medium-desktop', component: BannerCuadradoMedium, weight: 0.8 },
    
    // 🚐 Furgocasa - Banners premium (mismo peso que Casi Cinco para 50/50)
    { id: 'furgocasa-img-alquiler-desktop', component: BannerFurgocasaImageAlquiler, weight: 1.7 },
    { id: 'furgocasa-img-venta-desktop', component: BannerFurgocasaImageVenta, weight: 1.7 },
    { id: 'furgocasa-premium-desktop', component: BannerFurgocasaPremium, weight: 1.6 },
    { id: 'furgocasa-wide-desktop', component: BannerFurgocasaWide, weight: 1.5 },
    { id: 'furgocasa-leaderboard-desktop', component: BannerFurgocasaLeaderboard, weight: 1.4 },
    { id: 'furgocasa-hero-desktop', component: BannerFurgocasaHero, weight: 1.3 },
    { id: 'furgocasa-vertical-desktop', component: BannerFurgocasaVertical, weight: 1.1 },
  ] as BannerConfig[],
}

interface BannerRotativoProps {
  position: 'after-info' | 'after-services' | 'after-gallery' | 'after-related'
  areaId?: number
  strategy?: 'random' | 'deterministic' | 'weighted'
  exclude?: string[]
  priority?: number // 1 = primero, 2 = segundo, 3 = tercero
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// 🎯 Hash simple para generar índice determinístico
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// 🎯 Detectar el anunciante del banner (CasiCinco o Furgocasa)
function getAdvertiser(bannerId: string): 'casicinco' | 'furgocasa' {
  return bannerId.includes('furgocasa') ? 'furgocasa' : 'casicinco'
}

// 🎯 Contar cuántos banners de cada anunciante ya están usados
function countAdvertiserUsage(usedBannerIds: string[]): { casicinco: number; furgocasa: number } {
  const count = { casicinco: 0, furgocasa: 0 }
  usedBannerIds.forEach(id => {
    const advertiser = getAdvertiser(id)
    count[advertiser]++
  })
  return count
}

function selectBanner(
  banners: BannerConfig[],
  areaId: number,
  position: string,
  strategy: 'random' | 'deterministic' | 'weighted',
  exclude: string[],
  usedBannerIds: string[] // Cambiado de Set a array para ser serializable
): BannerConfig | null {
  // Validación: si no hay banners, retornar null
  if (!banners || banners.length === 0) {
    return null
  }

  // 🎯 PASO 1: Determinar qué anunciante debe mostrarse ahora para mantener alternancia
  const advertiserCount = countAdvertiserUsage(usedBannerIds)
  const totalUsed = advertiserCount.casicinco + advertiserCount.furgocasa
  
  // Determinar el anunciante preferido para esta posición
  let preferredAdvertiser: 'casicinco' | 'furgocasa' | null = null
  
  if (totalUsed > 0) {
    // Si hay desbalance de más de 1 banner, forzar el anunciante menos usado
    const difference = Math.abs(advertiserCount.casicinco - advertiserCount.furgocasa)
    
    if (difference > 0) {
      // Preferir el anunciante que tiene menos banners mostrados
      preferredAdvertiser = advertiserCount.casicinco < advertiserCount.furgocasa ? 'casicinco' : 'furgocasa'
    } else {
      // Si están balanceados, alternar basado en el último banner usado
      const lastBannerId = usedBannerIds[usedBannerIds.length - 1]
      const lastAdvertiser = getAdvertiser(lastBannerId)
      preferredAdvertiser = lastAdvertiser === 'casicinco' ? 'furgocasa' : 'casicinco'
    }
  }

  // 🎯 FILTRO 1: Excluir banners ya usados en esta página
  const notUsedBanners = banners.filter((b) => !usedBannerIds.includes(b.id))
  
  // 🎯 FILTRO 2: Excluir banners específicos (parámetro exclude)
  let availableBanners = notUsedBanners.filter((b) => !exclude.includes(b.id))
  
  // 🎯 FILTRO 3: Preferir banners del anunciante correcto para mantener alternancia
  if (preferredAdvertiser && availableBanners.length > 0) {
    const preferredBanners = availableBanners.filter((b) => getAdvertiser(b.id) === preferredAdvertiser)
    
    // Si hay banners del anunciante preferido disponibles, usarlos
    if (preferredBanners.length > 0) {
      availableBanners = preferredBanners
    }
    // Si no hay del preferido, continuar con los disponibles (fallback)
  }
  
  // Si todos están excluidos/usados, usar los no usados (ignorar exclude)
  // Si todos fueron usados, resetear y usar todos
  const finalBanners = 
    availableBanners.length > 0 ? availableBanners :
    notUsedBanners.length > 0 ? notUsedBanners :
    banners
  
  // Validación final
  if (finalBanners.length === 0) {
    return null
  }

  let selectedBanner = finalBanners[0]

  try {
    // 🎯 CLAVE: Usar hash determinístico basado en areaId + position + usedBanners
    // Esto garantiza que cada posición seleccione un banner diferente
    const seed = `${areaId}-${position}-${usedBannerIds.join(',')}`
    const hash = simpleHash(seed)
    const deterministicIndex = hash % finalBanners.length
    
    switch (strategy) {
      case 'random': {
        // Aún así usar seed para que sea predecible en SSR
        selectedBanner = finalBanners[deterministicIndex] || finalBanners[0]
        break
      }

      case 'deterministic': {
        selectedBanner = finalBanners[deterministicIndex] || finalBanners[0]
        break
      }

      case 'weighted': {
        // Usar el hash para decidir si randomizar
        const shouldRandomize = (hash % 100) < 30

        if (shouldRandomize) {
          const totalWeight = finalBanners.reduce((sum: any, b: any) => sum + (b.weight || 1), 0)
          let random = (hash % 1000) / 1000 * totalWeight

          for (const banner of finalBanners) {
            random -= (banner.weight || 1)
            if (random <= 0) {
              selectedBanner = banner
              break
            }
          }
        } else {
          selectedBanner = finalBanners[deterministicIndex] || finalBanners[0]
        }
        break
      }
    }
  } catch (error) {
    console.error('Error selecting banner:', error)
    selectedBanner = finalBanners[0]
  }

  return selectedBanner || null
}

/**
 * Componente que rota banners inteligentemente según el dispositivo
 * ✅ ALTERNANCIA: Alterna entre banners de Casi Cinco y Furgocasa
 * ✅ NO REPETIR: Garantiza que no se repita el mismo banner en la misma página
 * ✅ BALANCEO: Mantiene un equilibrio 50/50 entre ambos anunciantes
 * 
 * Ejemplo: Si hay 3 posiciones de banners en una página:
 * - Posición 1: CasiCinco
 * - Posición 2: Furgocasa
 * - Posición 3: CasiCinco (o Furgocasa si ya hay 2 de CasiCinco)
 */
export function BannerRotativo({
  position,
  areaId = 0,
  strategy = 'weighted',
  exclude = [],
  priority = 1,
}: BannerRotativoProps) {
  const { usedBanners, markBannerAsUsed } = useBannerContext()
  const [mounted, setMounted] = useState(false)
  const [SelectedBanner, setSelectedBanner] = useState<React.ComponentType<{ position: string }> | null>(null)
  const [bannerId, setBannerId] = useState<string>('loading')

  useEffect(() => {
    setMounted(true)
    
    try {
      const deviceType = getDeviceType()
      const bannerPool = BANNERS_CONFIG[deviceType]
      
      if (!bannerPool || bannerPool.length === 0) {
        console.error('No banner pool found for device type:', deviceType)
        return
      }
      
      // 🎯 Convertir Set a array para pasar a la función
      const usedBannerIds = Array.from(usedBanners)
      
      // 🎯 Selección determinística basada en areaId + position + banners ya usados
      const selected = selectBanner(bannerPool, areaId, position, strategy, exclude, usedBannerIds)
      
      if (!selected || !selected.component || !selected.id) {
        console.error('Invalid banner selected:', selected)
        return
      }
      
      const advertiserCount = countAdvertiserUsage(usedBannerIds)
      const selectedAdvertiser = getAdvertiser(selected.id)
      console.log(`[Priority ${priority} - ${position}] Selected: ${selected.id} (${selectedAdvertiser}), Count: CC=${advertiserCount.casicinco} FC=${advertiserCount.furgocasa}`)
      
      // ✅ Marcar este banner como usado
      markBannerAsUsed(selected.id)
      
      setSelectedBanner(() => selected.component)
      setBannerId(selected.id)
    } catch (error) {
      console.error('Error in useEffect:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Durante SSR y primera carga, mostrar BannerHeroHorizontal por defecto
  if (!mounted || !SelectedBanner) {
    return (
      <div className="casi-cinco-banner-wrapper my-8" data-position={position}>
        <BannerHeroHorizontal position={position} />
      </div>
    )
  }

  return (
    <div
      className="casi-cinco-banner-wrapper my-8"
      data-position={position}
      data-banner-id={bannerId}
    >
      <SelectedBanner position={position} />
    </div>
  )
}
