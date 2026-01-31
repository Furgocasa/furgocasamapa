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

        <div className="relative z-[1] p-[40px_50px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-col md:flex-row gap-6">
            <div className="flex-1">
              <a href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=wide_carousel"
                target="_blank" rel="noopener noreferrer sponsored nofollow" className="no-underline">
                <div className="text-[42px] font-black text-[#ffd935] mb-2 tracking-[-1px] drop-shadow-[2px_2px_8px_rgba(0,0,0,0.3)]">
                  ⭐ Casi Cinco
                </div>
                <div className="text-lg text-[rgba(255,255,255,0.95)] mb-3">
                  Los mejores lugares + Planificador de Rutas IA
                </div>
                <div className="flex gap-6 flex-wrap">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[28px] font-black text-[#ffd935]">+3500</span>
                    <span className="text-[13px] text-[rgba(255,255,255,0.8)]">lugares</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[28px] font-black text-[#ffd935]">4.7★</span>
                    <span className="text-[13px] text-[rgba(255,255,255,0.8)]">mínimo</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[28px] font-black text-[#ffd935]">50+</span>
                    <span className="text-[13px] text-[rgba(255,255,255,0.8)]">ciudades</span>
                  </div>
                </div>
              </a>
            </div>

            <div className="text-center">
              <a href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=wide_carousel"
                target="_blank" rel="noopener noreferrer sponsored nofollow"
                className="bg-gradient-to-r from-[#ffd935] to-[#ffe566] text-[#063971] px-12 py-5 rounded-2xl font-black text-lg transition-all duration-300 shadow-[0_6px_24px_rgba(255,217,53,0.4)] hover:shadow-[0_10px_36px_rgba(255,217,53,0.6)] hover:translate-y-[-3px] no-underline inline-block">
                Descubrir →
              </a>
              <div className="text-xs text-[rgba(255,255,255,0.6)] mt-3">Gratis · Sin registro</div>
            </div>
          </div>

          {/* Categorías */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="https://www.casicinco.com/restaurante?utm_source=furgocasa&utm_medium=banner&utm_campaign=wide_carousel"
              target="_blank" rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-5 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,217,53,0.1)] hover:border-[rgba(255,217,53,0.3)] hover:translate-y-[-4px] no-underline text-center">
              <div className="text-4xl mb-2">🍽️</div>
              <div className="text-base font-bold text-white mb-1">Restaurantes</div>
              <div className="text-xs text-[rgba(255,255,255,0.7)]">+2000 lugares</div>
            </a>

            <a href="https://www.casicinco.com/bar?utm_source=furgocasa&utm_medium=banner&utm_campaign=wide_carousel"
              target="_blank" rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-5 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,217,53,0.1)] hover:border-[rgba(255,217,53,0.3)] hover:translate-y-[-4px] no-underline text-center">
              <div className="text-4xl mb-2">🍺</div>
              <div className="text-base font-bold text-white mb-1">Bares</div>
              <div className="text-xs text-[rgba(255,255,255,0.7)]">+700 lugares</div>
            </a>

            <a href="https://www.casicinco.com/hotel?utm_source=furgocasa&utm_medium=banner&utm_campaign=wide_carousel"
              target="_blank" rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-5 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,217,53,0.1)] hover:border-[rgba(255,217,53,0.3)] hover:translate-y-[-4px] no-underline text-center">
              <div className="text-4xl mb-2">🏨</div>
              <div className="text-base font-bold text-white mb-1">Hoteles</div>
              <div className="text-xs text-[rgba(255,255,255,0.7)]">+800 lugares</div>
            </a>

            <a href="https://www.casicinco.com/ruta?utm_source=furgocasa&utm_medium=banner&utm_campaign=wide_carousel"
              target="_blank" rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-5 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,217,53,0.1)] hover:border-[rgba(255,217,53,0.3)] hover:translate-y-[-4px] no-underline text-center">
              <div className="text-4xl mb-2">🛣️</div>
              <div className="text-base font-bold text-white mb-1">Rutas IA</div>
              <div className="text-xs text-[rgba(255,255,255,0.7)]">Planificador</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
