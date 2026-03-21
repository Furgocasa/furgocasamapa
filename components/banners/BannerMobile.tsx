'use client'

interface BannerMobileProps {
  position: string
}

export function BannerMobile({ position }: BannerMobileProps) {
  return (
    <div className="w-full max-w-[320px] mx-auto my-8">
      <div className="bg-[#0b3c74] rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-center justify-between p-4 gap-3">
          <a
            href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=mobile"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-center gap-3 flex-1 no-underline text-white"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="text-3xl animate-pulse">⭐</div>
              <div className="flex-1">
                <div className="text-lg font-black text-[#ffd935] mb-0.5 leading-none tracking-tight">Casi Cinco</div>
                <div className="text-[11px] text-white/80 leading-[1.3] mb-1 font-medium">
                  +3500 lugares + Rutas IA
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/60 font-bold uppercase tracking-wider">
                  <span className="text-[#ffd935]">★</span>
                  <span>+4.7 rating</span>
                </div>
              </div>
            </div>
          </a>
          <a
            href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=mobile"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="bg-[#ffd935] text-[#0b3c74] px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all duration-300 hover:bg-[#ffe566] no-underline shadow-sm"
          >
            Ver →
          </a>
        </div>
      </div>
    </div>
  )
}
