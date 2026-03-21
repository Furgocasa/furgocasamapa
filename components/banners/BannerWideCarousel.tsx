'use client'

interface BannerWideCarouselProps {
  position: string
}

export function BannerWideCarousel({ position }: BannerWideCarouselProps) {
  return (
    <div className="w-full max-w-[1200px] mx-auto my-8">
      <div className="bg-gradient-to-br from-[#063971] via-[#052d5a] to-[#042143] rounded-3xl overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.3)] relative">
        {/* Efecto de partículas de fondo */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(255, 217, 53, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255, 217, 53, 0.1) 0%, transparent 50%)'
        }} />

        <div className="relative z-10 p-[24px_32px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-col md:flex-row gap-4">
            <div className="flex-1">
              <a href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=wide_carousel"
                 target="_blank" rel="noopener noreferrer sponsored nofollow" className="no-underline">
                <div className="text-3xl font-black text-[#ffd935] mb-1.5 tracking-tight drop-shadow-sm">
                  ⭐ Casi Cinco
                </div>
                <div className="text-sm text-[rgba(255,255,255,0.95)] mb-2">
                  Los mejores lugares + Planificador de Rutas IA
                </div>
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-[#ffd935]">+3500</span>
                    <span className="text-[11px] text-[rgba(255,255,255,0.8)]">lugares</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-[#ffd935]">4.7★</span>
                    <span className="text-[11px] text-[rgba(255,255,255,0.8)]">mínimo</span>
                  </div>
                </div>
              </a>
            </div>

            <div className="text-center">
              <a href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=wide_carousel"
                 target="_blank" rel="noopener noreferrer sponsored nofollow"
                 className="bg-gradient-to-r from-[#ffd935] to-[#ffe566] text-[#063971] px-8 py-3 rounded-xl font-black text-sm transition-all duration-300 shadow-[0_4px_16px_rgba(255,217,53,0.3)] hover:shadow-[0_6px_20px_rgba(255,217,53,0.5)] hover:translate-y-[-2px] no-underline inline-block">
                Descubrir →
              </a>
            </div>
          </div>

          {/* Categorías */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=wide_carousel"
               target="_blank" rel="noopener noreferrer sponsored nofollow"
               className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-3 rounded-xl transition-all duration-300 hover:bg-[rgba(255,217,53,0.1)] hover:border-[rgba(255,217,53,0.3)] hover:-translate-y-1 no-underline text-center">
              <div className="text-2xl mb-1">🍽️</div>
              <div className="text-xs font-bold text-white mb-0.5">Restaurantes</div>
              <div className="text-[10px] text-[rgba(255,255,255,0.7)]">+2000 lugares</div>
            </a>

            <a href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=wide_carousel"
               target="_blank" rel="noopener noreferrer sponsored nofollow"
               className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-3 rounded-xl transition-all duration-300 hover:bg-[rgba(255,217,53,0.1)] hover:border-[rgba(255,217,53,0.3)] hover:-translate-y-1 no-underline text-center">
              <div className="text-2xl mb-1">🍺</div>
              <div className="text-xs font-bold text-white mb-0.5">Bares</div>
              <div className="text-[10px] text-[rgba(255,255,255,0.7)]">+700 lugares</div>
            </a>

            <a href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=wide_carousel"
               target="_blank" rel="noopener noreferrer sponsored nofollow"
               className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-3 rounded-xl transition-all duration-300 hover:bg-[rgba(255,217,53,0.1)] hover:border-[rgba(255,217,53,0.3)] hover:-translate-y-1 no-underline text-center">
              <div className="text-2xl mb-1">🏨</div>
              <div className="text-xs font-bold text-white mb-0.5">Hoteles</div>
              <div className="text-[10px] text-[rgba(255,255,255,0.7)]">+800 lugares</div>
            </a>

            <a href="https://www.casicinco.com/ruta?utm_source=furgocasa&utm_medium=banner&utm_campaign=wide_carousel"
               target="_blank" rel="noopener noreferrer sponsored nofollow"
               className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-3 rounded-xl transition-all duration-300 hover:bg-[rgba(255,217,53,0.1)] hover:border-[rgba(255,217,53,0.3)] hover:-translate-y-1 no-underline text-center">
              <div className="text-2xl mb-1">🛣️</div>
              <div className="text-xs font-bold text-white mb-0.5">Rutas IA</div>
              <div className="text-[10px] text-[rgba(255,255,255,0.7)]">Planificador</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
