'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaLeaderboard({ position }: BannerProps) {
  const utmCampaign = `furgocasa_leaderboard_${position}_area_detail`

  return (
    <div className="w-full max-w-[1400px] mx-auto my-8">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline"
      >
        <div className="bg-[#0b3c74] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="flex flex-col md:flex-row items-stretch h-auto md:h-[120px]">
            {/* Imagen visible - 25% del ancho */}
            <div className="w-full md:w-[25%] h-[140px] md:h-full flex-shrink-0 relative group">
              <img 
                src="/images/banners/camper-6.jpg"
                alt="Camper Furgocasa Pirineos"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-transparent to-[#0b3c74]"></div>
            </div>

            {/* Contenido */}
            <div className="flex-1 text-white p-4 md:p-6 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🚐</span>
                  <div className="text-xl font-black text-[#ff6b35] tracking-tight">Furgocasa</div>
                </div>
                <p className="text-sm font-bold text-white mb-2">
                  Alquiler y Venta de Campers Premium
                </p>
                <div className="flex flex-wrap gap-3 text-[11px] text-white/60 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">💰 Alquiler <span className="text-[#ff6b35]">95€/día</span></span>
                  <span className="flex items-center gap-1">🏷️ Venta <span className="text-[#ff6b35]">49k€</span></span>
                  <span className="flex items-center gap-1">⭐ <span className="text-[#ff6b35]">4.9</span> rating</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 items-end">
                <div className="bg-[#ff6b35] text-white font-bold py-2.5 px-6 rounded-lg text-center hover:bg-[#e85a25] transition-colors text-sm whitespace-nowrap shadow-sm">
                  Descubrir →
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
