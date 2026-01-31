'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaHero({ position }: BannerProps) {
  const utmCampaign = `furgocasa_hero_${position}_area_detail`

  return (
    <div className="w-full max-w-[728px] mx-auto">
      <div className="bg-gradient-to-br from-[#1a5490] to-[#0d3a6b] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        <div className="flex items-center justify-between p-5 md:p-8 gap-5 md:flex-row flex-col text-center md:text-left">
          <a
            href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex-1 no-underline text-white"
          >
            <div className="text-3xl font-extrabold text-[#ff6b35] mb-2 tracking-tight">
              🚐 Furgocasa
            </div>
            <div className="text-sm text-white/90 mb-1">
              Alquiler y Venta de Campers Premium | Desde 95€/día
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-[#ff6b35] font-semibold">
              <span className="text-[#ff6b35]">★★★★★</span>
              <span>4.9 valoración | KM ilimitados | Venta desde 49.000€</span>
            </div>
          </a>
          <a
            href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="bg-[#ff6b35] text-white px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all hover:bg-[#ff8555] hover:scale-105 no-underline"
          >
            Reservar Ahora →
          </a>
        </div>
      </div>
    </div>
  )
}
