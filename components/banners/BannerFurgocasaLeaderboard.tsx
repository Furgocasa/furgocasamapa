'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaLeaderboard({ position }: BannerProps) {
  const utmCampaign = `furgocasa_leaderboard_${position}_area_detail`

  return (
    <div className="w-full max-w-[970px] mx-auto">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline"
      >
        <div className="bg-gradient-to-r from-[#003d7a] to-[#002855] rounded-xl overflow-hidden shadow-2xl transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,61,122,0.4)]">
          <div className="flex flex-col md:flex-row items-stretch h-auto md:h-[140px]">
            {/* Imagen visible - 30% del ancho */}
            <div className="w-full md:w-[30%] h-[160px] md:h-full flex-shrink-0">
              <img 
                src="/images/furgocasa/camper-leaderboard-1.jpg"
                alt="Camper Furgocasa Pirineos"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Contenido */}
            <div className="flex-1 text-white p-4 md:p-6 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-2xl md:text-3xl font-black text-[#ff6b35] mb-1 flex items-center gap-2">
                  🚐 <span>Furgocasa</span>
                </div>
                <p className="text-sm md:text-base text-white/95 mb-2">
                  <strong>Alquiler y Venta</strong> de Campers Premium
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-white/85">
                  <span>💰 Desde <strong className="text-[#ff6b35]">95€/día</strong></span>
                  <span>⭐ <strong className="text-[#ff6b35]">4.9</strong> valoración</span>
                  <span>🏷️ Venta desde <strong className="text-[#ff6b35]">49.000€</strong></span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="bg-white text-[#003d7a] font-bold py-2.5 px-6 rounded-lg text-center hover:bg-gray-100 transition-colors text-sm whitespace-nowrap">
                  Reservar Ahora →
                </div>
                <div className="text-xs text-white/70 text-center">
                  <strong className="text-[#ff6b35]">14+ años</strong> de experiencia
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
