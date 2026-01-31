'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaLeaderboard({ position }: BannerProps) {
  const utmCampaign = `furgocasa_leaderboard_${position}_area_detail`

  return (
    <div className="w-full max-w-[970px] mx-auto">
      <div className="relative bg-gradient-to-r from-[#1a5490] via-[#0d3a6b] to-[#1a5490] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] hover:-translate-y-0.5">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <img 
            src="/images/furgocasa/camper-leaderboard-1.jpg"
            alt="Camper Furgocasa"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a5490]/95 via-[#0d3a6b]/90 to-[#1a5490]/95"></div>
        </div>

        <div className="relative flex items-center justify-between p-5 md:p-8 lg:p-10 gap-8 md:flex-row flex-col text-center md:text-left">
          <div className="flex items-center gap-5 md:gap-8 md:flex-row flex-col">
            <a
              href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="no-underline"
            >
              <div className="text-5xl md:text-6xl animate-pulse">🚐</div>
            </a>
            <div className="flex-1">
              <a
                href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="no-underline"
              >
                <div className="text-3xl md:text-4xl font-black text-[#ff6b35] mb-1 tracking-tighter">
                  Furgocasa
                </div>
                <div className="text-sm md:text-base text-white/95 mb-2">
                  Alquiler y Venta de Campers Premium | KM Ilimitados
                </div>
              </a>
              <div className="flex gap-5 items-center justify-center md:justify-start flex-wrap">
                <div className="flex items-center gap-1.5 text-[13px] text-white/85">
                  <span className="text-lg">💰</span>
                  <span>
                    Desde <span className="text-[#ff6b35] font-bold">95€/día</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[13px] text-white/85">
                  <span className="text-lg">⭐</span>
                  <span>
                    <span className="text-[#ff6b35] font-bold">4.9</span> valoración
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[13px] text-white/85">
                  <span className="text-lg">🏷️</span>
                  <span>
                    Venta desde <span className="text-[#ff6b35] font-bold">49.000€</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 items-center md:items-end w-full md:w-auto">
            <a
              href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[#ff6b35] text-white px-8 py-4 rounded-xl font-extrabold text-base whitespace-nowrap transition-all hover:bg-[#ff8555] hover:scale-105 hover:shadow-[0_6px_20px_rgba(255,107,53,0.5)] shadow-[0_4px_12px_rgba(255,107,53,0.3)] no-underline w-full md:w-auto text-center"
            >
              Reservar Ahora →
            </a>
            <div className="text-xs text-white/70">
              <span className="text-[#ff6b35] font-bold">14+ años</span> de experiencia
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
