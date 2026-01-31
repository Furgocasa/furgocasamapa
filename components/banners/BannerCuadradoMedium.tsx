'use client'

interface BannerCuadradoMediumProps {
  position: string
}

export function BannerCuadradoMedium({ position }: BannerCuadradoMediumProps) {
  return (
    <div className="w-full flex justify-center my-8 px-4">
      <div className="w-full max-w-[350px] aspect-square bg-gradient-to-br from-[#063971] to-[#052d5a] rounded-3xl overflow-hidden relative shadow-[0_10px_40px_rgba(0,0,0,0.3)] transition-all duration-300 hover:translate-y-[-6px] hover:shadow-[0_16px_50px_rgba(0,0,0,0.4)]">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255, 217, 53, 0.1) 0%, transparent 70%)' }} />
        
        <a
          href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=cuadrado_medium"
          target="_blank"
          rel="noopener noreferrer sponsored nofollow"
          className="relative flex flex-col items-center justify-center h-full p-5 md:p-8 no-underline text-white z-[1] text-center gap-4 md:gap-6"
        >
          {/* Logo Section */}
          <div className="flex flex-col items-center gap-2 md:gap-3">
            <div className="text-4xl md:text-5xl lg:text-6xl animate-glow">⭐</div>
            <div className="text-2xl md:text-3xl lg:text-[40px] font-black text-[#ffd935] drop-shadow-[2px_2px_10px_rgba(0,0,0,0.4)] tracking-[-1px] leading-none">
              Casi Cinco
            </div>
          </div>
          
          {/* Tagline */}
          <div className="text-xs md:text-sm lg:text-[15px] text-[rgba(255,255,255,0.95)] leading-[1.5] font-medium max-w-[260px]">
            Los mejores lugares + Planificador de Rutas IA
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 w-full">
            <div className="flex flex-col items-center gap-0.5 md:gap-1">
              <span className="text-base md:text-lg lg:text-[22px] font-black text-[#ffd935] leading-none">+3500</span>
              <span className="text-[8px] md:text-[10px] text-[rgba(255,255,255,0.7)] uppercase tracking-[0.5px]">Lugares</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 md:gap-1">
              <span className="text-base md:text-lg lg:text-[22px] font-black text-[#ffd935] leading-none">4.7★</span>
              <span className="text-[8px] md:text-[10px] text-[rgba(255,255,255,0.7)] uppercase tracking-[0.5px]">Mínimo</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 md:gap-1">
              <span className="text-base md:text-lg lg:text-[22px] font-black text-[#ffd935] leading-none">50+</span>
              <span className="text-[8px] md:text-[10px] text-[rgba(255,255,255,0.7)] uppercase tracking-[0.5px]">Ciudades</span>
            </div>
          </div>
          
          {/* CTA Button */}
          <div className="bg-gradient-to-br from-[#ffd935] to-[#ffe566] text-[#063971] px-6 md:px-10 py-3 md:py-4 rounded-[14px] font-black text-sm md:text-base transition-all duration-300 shadow-[0_6px_20px_rgba(255,217,53,0.4)] relative overflow-hidden inline-block group hover:translate-y-[-3px] hover:shadow-[0_10px_30px_rgba(255,217,53,0.6)]">
            <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.4)] to-transparent transition-[left] duration-500 group-hover:left-[100%]" />
            Descubrir
            <span className="inline-block ml-1.5 transition-transform duration-300 group-hover:translate-x-1">→</span>
          </div>
        </a>

        <style jsx>{`
          @keyframes glow {
            0%, 100% { 
              filter: drop-shadow(0 0 15px rgba(255, 217, 53, 0.6));
              transform: scale(1);
            }
            50% { 
              filter: drop-shadow(0 0 30px rgba(255, 217, 53, 0.9));
              transform: scale(1.05);
            }
          }
          .animate-glow {
            animation: glow 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  )
}
