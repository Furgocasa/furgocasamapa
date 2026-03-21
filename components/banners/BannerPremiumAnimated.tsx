'use client'

interface BannerProps {
  position: string
}

export function BannerPremiumAnimated({ position }: BannerProps) {
  const utmCampaign = `premium_animated_${position}_area_detail`

  return (
    <div className="w-full max-w-[1400px] mx-auto my-8">
      <div className="bg-[#0b3c74] rounded-2xl overflow-hidden relative shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
        {/* Efecto de brillo animado sutil */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-shine pointer-events-none opacity-50" 
             style={{ background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%)' }} />

        <div className="relative z-[1] p-6 md:p-8 flex items-center justify-between gap-8 flex-col lg:flex-row">
          {/* Sección Izquierda */}
          <div className="flex-1 flex flex-col gap-4">
            <a href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
               target="_blank" rel="noopener noreferrer sponsored nofollow" className="no-underline">
              <div className="flex items-center gap-3">
                <div className="text-3xl animate-pulse">⭐</div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-black text-[#ffd935] tracking-tight">
                    Casi Cinco
                  </div>
                  <span className="inline-block bg-white/10 px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                    Premium Selection
                  </span>
                </div>
              </div>
            </a>

            <div className="text-sm text-white/80 leading-relaxed max-w-2xl">
              Descubre los <span className="text-[#ffd935] font-semibold">mejores restaurantes, bares y hoteles</span> de España. 
              Solo lugares verificados con +4.7★ en Google Maps.
            </div>

            <div className="flex gap-4 flex-wrap">
              <div className="flex items-baseline gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg">
                <span className="text-lg font-bold text-[#ffd935]">+3500</span>
                <span className="text-xs text-white/60 uppercase tracking-wider">Lugares</span>
              </div>
              <div className="flex items-baseline gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg">
                <span className="text-lg font-bold text-[#ffd935]">4.7★</span>
                <span className="text-xs text-white/60 uppercase tracking-wider">Mínimo</span>
              </div>
              <div className="flex items-baseline gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg">
                <span className="text-lg font-bold text-[#ffd935]">50+</span>
                <span className="text-xs text-white/60 uppercase tracking-wider">Ciudades</span>
              </div>
            </div>
          </div>

          {/* Sección Derecha */}
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <a href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
               target="_blank" rel="noopener noreferrer sponsored nofollow"
               className="bg-[#ffd935] text-[#0b3c74] px-8 py-3.5 rounded-lg font-bold text-sm text-center transition-all hover:bg-[#ffe566] no-underline whitespace-nowrap shadow-md hover:shadow-lg">
              Explorar Lugares →
            </a>
            <div className="text-center text-xs text-white/60 flex items-center justify-center gap-1.5">
              <span>🎯</span> Planificador de rutas IA incluido
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes shine {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
          }
          .animate-shine {
            animation: shine 6s infinite linear;
          }
        `}</style>
      </div>
    </div>
  )
}
