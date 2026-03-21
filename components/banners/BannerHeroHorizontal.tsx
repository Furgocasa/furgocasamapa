'use client'

interface BannerProps {
  position: string
}

export function BannerHeroHorizontal({ position }: BannerProps) {
  const utmCampaign = `hero_horizontal_${position}_area_detail`

  return (
    <div className="w-full max-w-[1400px] mx-auto my-8">
      <div className="bg-[#0b3c74] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
        <div className="flex items-center justify-between p-5 md:p-6 gap-5 md:flex-row flex-col text-center md:text-left">
          <a
            href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex-1 no-underline text-white flex flex-col md:flex-row md:items-center gap-4"
          >
            <div className="text-2xl font-black text-[#ffd935] tracking-tight whitespace-nowrap">
              ⭐ Casi Cinco
            </div>
            <div className="hidden md:block w-px h-8 bg-white/20"></div>
            <div>
              <div className="text-sm text-white/90 mb-1 font-medium">
                Los mejores restaurantes, bares y hoteles + Planificador de Rutas IA
              </div>
              <div className="inline-flex items-center gap-2 text-[11px] text-white/60 uppercase tracking-wider font-bold">
                <span className="text-[#ffd935]">★★★★★</span>
                <span>+3500 lugares | Solo +4.7 estrellas</span>
              </div>
            </div>
          </a>
          <a
            href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="bg-[#ffd935] text-[#0b3c74] px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all hover:bg-[#ffe566] no-underline w-full md:w-auto text-center"
          >
            Descubrir Ahora →
          </a>
        </div>
      </div>
    </div>
  )
}
