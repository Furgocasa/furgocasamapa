'use client'

interface BannerPremiumAnimatedProps {
  position: string
}

export function BannerPremiumAnimated({ position }: BannerPremiumAnimatedProps) {
  return (
    <div className="w-full max-w-[1200px] mx-auto my-8">
      <div className="bg-gradient-to-br from-[#063971] via-[#052d5a] to-[#042143] rounded-3xl overflow-hidden relative shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
        {/* Efecto de brillo animado */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-shine pointer-events-none"
          style={{ background: 'linear-gradient(45deg, transparent 30%, rgba(255, 217, 53, 0.1) 50%, transparent 70%)' }} />

        <div className="relative z-[1] p-[40px_50px] flex items-center gap-12 flex-col lg:flex-row">
          {/* Sección Izquierda */}
          <div className="flex-1 flex flex-col gap-6">
            <a href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=premium_animated"
              target="_blank" rel="noopener noreferrer sponsored nofollow" className="no-underline">
              <div className="flex items-center gap-4">
                <div className="text-[56px] animate-float-banner">⭐</div>
                <div className="flex flex-col gap-1">
                  <div className="text-[42px] font-black text-[#ffd935] drop-shadow-[2px_2px_8px_rgba(0,0,0,0.3)] tracking-[-1px] leading-none">
                    Casi Cinco
                  </div>
                  <span className="inline-block bg-[rgba(255,217,53,0.2)] border border-[#ffd935] px-3 py-1 rounded-xl text-xs font-bold text-[#ffd935] uppercase">
                    Premium Selection
                  </span>
                </div>
              </div>
            </a>

            <div className="text-lg text-[rgba(255,255,255,0.95)] leading-relaxed">
              Descubre los <span className="text-[#ffd935] font-bold">mejores restaurantes, bares y hoteles</span> de España.
              Solo lugares con +4.7★ en Google Maps.
            </div>

            <div className="flex gap-6 flex-wrap">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#ffd935]">+3500</span>
                <span className="text-sm text-[rgba(255,255,255,0.8)]">Lugares</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#ffd935]">4.7★</span>
                <span className="text-sm text-[rgba(255,255,255,0.8)]">Mínimo</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#ffd935]">50+</span>
                <span className="text-sm text-[rgba(255,255,255,0.8)]">Ciudades</span>
              </div>
            </div>
          </div>

          {/* Sección Derecha */}
          <div className="flex flex-col gap-4 w-full lg:w-auto">
            <a href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=premium_animated"
              target="_blank" rel="noopener noreferrer sponsored nofollow"
              className="bg-gradient-to-r from-[#ffd935] to-[#ffe566] text-[#063971] px-12 py-5 rounded-2xl font-black text-xl text-center transition-all duration-300 shadow-[0_8px_24px_rgba(255,217,53,0.5)] hover:shadow-[0_12px_36px_rgba(255,217,53,0.7)] hover:translate-y-[-4px] no-underline group">
              <span className="relative z-[1]">Explorar Lugares →</span>
            </a>
            <div className="text-center text-sm text-[rgba(255,255,255,0.7)]">
              🎯 Planificador de rutas con IA incluido
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes shine {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
          }
          @keyframes float-banner {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .animate-shine {
            animation: shine 3s infinite;
          }
          .animate-float-banner {
            animation: float-banner 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  )
}
