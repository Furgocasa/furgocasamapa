'use client'

interface BannerCuadradoMediumProps {
  position: string
}

export function BannerCuadradoMedium({ position }: BannerCuadradoMediumProps) {
  return (
    <div className="w-full flex justify-center my-8 px-4">
      <div className="w-full max-w-[350px] aspect-square bg-[#0b3c74] rounded-2xl overflow-hidden relative shadow-sm transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl group">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 pointer-events-none opacity-50 transition-opacity duration-500 group-hover:opacity-100" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 70%)' }} />
        
        <a
          href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=cuadrado_medium"
          target="_blank"
          rel="noopener noreferrer sponsored nofollow"
          className="relative flex flex-col items-center justify-between h-full p-6 no-underline text-white z-[1] text-center"
        >
          {/* Logo Section */}
          <div className="flex flex-col items-center gap-1 mt-2">
            <div className="text-4xl animate-pulse">⭐</div>
            <div className="text-2xl font-black text-[#ffd935] tracking-tight leading-none">
              Casi Cinco
            </div>
            <div className="text-xs text-white/80 font-medium max-w-[200px] mt-2">
              Los mejores lugares + Planificador IA
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 w-full bg-white/5 rounded-xl p-3">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-[#ffd935] leading-none">+3500</span>
              <span className="text-[9px] text-white/60 uppercase tracking-wider mt-1">Lugares</span>
            </div>
            <div className="flex flex-col items-center border-x border-white/10">
              <span className="text-lg font-bold text-[#ffd935] leading-none">4.7★</span>
              <span className="text-[9px] text-white/60 uppercase tracking-wider mt-1">Mínimo</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-[#ffd935] leading-none">50+</span>
              <span className="text-[9px] text-white/60 uppercase tracking-wider mt-1">Ciudades</span>
            </div>
          </div>
          
          {/* CTA Button */}
          <div className="w-full bg-[#ffd935] text-[#0b3c74] px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 hover:bg-[#ffe566]">
            Descubrir →
          </div>
        </a>
      </div>
    </div>
  )
}
