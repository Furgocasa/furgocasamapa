'use client'

interface BannerProps {
  position: string
}

export function BannerLeaderboardFull({ position }: BannerProps) {
  const utmCampaign = `leaderboard_full_${position}_area_detail`

  return (
    <div className="w-full max-w-[1400px] mx-auto my-8">
      <div className="bg-[#0b3c74] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
        <div className="flex items-center justify-between p-6 md:p-8 gap-8 md:flex-row flex-col text-center md:text-left">
          <div className="flex items-center gap-6 md:flex-row flex-col">
            <a
              href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="no-underline"
            >
              <div className="text-4xl">⭐</div>
            </a>
            <div className="flex-1">
              <a
                href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="no-underline"
              >
                <div className="text-2xl font-black text-[#ffd935] mb-1 tracking-tight">
                  Casi Cinco
                </div>
                <div className="text-sm text-white/80 mb-3">
                  Descubre los mejores restaurantes, bares y hoteles de España. Solo +4.7 estrellas.
                </div>
              </a>
              <div className="flex gap-4 items-center justify-center md:justify-start flex-wrap">
                <a
                  href={`https://www.casicinco.com/ruta?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg no-underline hover:bg-white/20 transition-colors"
                >
                  <span className="text-sm">🛣️</span>
                  <span>Planificador de Rutas IA</span>
                </a>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg">
                  <span className="text-sm">📍</span>
                  <span><span className="text-[#ffd935]">+3500</span> Lugares Verificados</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-center md:items-end w-full md:w-auto">
            <a
              href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[#ffd935] text-[#0b3c74] px-8 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all hover:bg-[#ffe566] no-underline w-full md:w-auto text-center"
            >
              Explorar Ahora →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
