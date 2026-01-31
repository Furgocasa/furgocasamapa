'use client'

interface BannerProps {
  position: string
}

export function BannerHeroHorizontal({ position }: BannerProps) {
  const utmCampaign = `hero_horizontal_${position}_area_detail`

  return (
    <div className="w-full max-w-[728px] mx-auto">
      <div className="bg-gradient-to-br from-[#063971] to-[#052d5a] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        <div className="flex items-center justify-between p-5 md:p-8 gap-5 md:flex-row flex-col text-center md:text-left">
          <a
            href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex-1 no-underline text-white"
          >
            <div className="text-3xl font-extrabold text-[#ffd935] mb-2 tracking-tight">
              ⭐ Casi Cinco
            </div>
            <div className="text-sm text-white/90 mb-1">
              Los mejores restaurantes, bares y hoteles + Planificador de Rutas IA
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-[#ffd935] font-semibold">
              <span className="text-[#ffd935]">★★★★★</span>
              <span>+3500 lugares | Solo +4.7 estrellas</span>
            </div>
          </a>
          <a
            href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="bg-[#ffd935] text-[#063971] px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all hover:bg-[#ffe566] hover:scale-105 no-underline"
          >
            Descubrir Ahora →
          </a>
        </div>
      </div>
    </div>
  )
}
