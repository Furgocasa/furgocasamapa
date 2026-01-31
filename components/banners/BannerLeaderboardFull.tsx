'use client'

interface BannerProps {
  position: string
}

export function BannerLeaderboardFull({ position }: BannerProps) {
  const utmCampaign = `leaderboard_full_${position}_area_detail`

  return (
    <div className="w-full max-w-[970px] mx-auto">
      <div className="bg-gradient-to-r from-[#063971] via-[#052d5a] to-[#063971] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] hover:-translate-y-0.5">
        <div className="flex items-center justify-between p-5 md:p-8 lg:p-10 gap-8 md:flex-row flex-col text-center md:text-left">
          <div className="flex items-center gap-5 md:gap-8 md:flex-row flex-col">
            <a
              href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="no-underline"
            >
              <div className="text-5xl md:text-6xl animate-pulse">⭐</div>
            </a>
            <div className="flex-1">
              <a
                href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="no-underline"
              >
                <div className="text-3xl md:text-4xl font-black text-[#ffd935] mb-1 tracking-tighter">
                  Casi Cinco
                </div>
                <div className="text-sm md:text-base text-white/95 mb-2">
                  Descubre los mejores restaurantes, bares y hoteles de España
                </div>
              </a>
              <div className="flex gap-5 items-center justify-center md:justify-start flex-wrap">
                <div className="flex items-center gap-1.5 text-[13px] text-white/85">
                  <span className="text-lg">★</span>
                  <span>
                    Solo <span className="text-[#ffd935] font-bold">+4.7</span> estrellas
                  </span>
                </div>
                <a
                  href={`https://www.casicinco.com/ruta?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="flex items-center gap-1.5 text-[13px] text-white/85 no-underline hover:text-[#ffd935] transition-colors"
                >
                  <span className="text-lg">🛣️</span>
                  <span>
                    Planificador de <span className="text-[#ffd935] font-bold">Rutas</span>
                  </span>
                </a>
                <div className="flex items-center gap-1.5 text-[13px] text-white/85">
                  <span className="text-lg">📍</span>
                  <span>
                    <span className="text-[#ffd935] font-bold">+3500</span> lugares
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 items-center md:items-end w-full md:w-auto">
            <a
              href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[#ffd935] text-[#063971] px-8 py-4 rounded-xl font-extrabold text-base whitespace-nowrap transition-all hover:bg-[#ffe566] hover:scale-105 hover:shadow-[0_6px_20px_rgba(255,217,53,0.5)] shadow-[0_4px_12px_rgba(255,217,53,0.3)] no-underline w-full md:w-auto text-center"
            >
              Explorar Ahora →
            </a>
            <div className="text-xs text-white/70">
              Verificados con <span className="text-[#ffd935] font-bold">Google Maps</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
