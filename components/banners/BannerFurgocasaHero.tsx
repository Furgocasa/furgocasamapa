'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaHero({ position }: BannerProps) {
  const utmCampaign = `furgocasa_hero_${position}_area_detail`

  return (
    <div className="w-full max-w-[728px] mx-auto">
      <div className="relative bg-gradient-to-br from-[#1a5490] to-[#0d3a6b] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <img 
            src="/images/furgocasa/camper-hero-1.jpg"
            alt="Camper Furgocasa"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a5490]/95 via-[#0d3a6b]/85 to-[#1a5490]/95"></div>
        </div>

        <div className="relative flex items-center justify-between p-5 md:p-8 gap-5 md:flex-row flex-col text-center md:text-left">
          <a
            href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex-1 no-underline text-white"
          >
            <div className="text-3xl font-extrabold text-[#ff6b35] mb-2 tracking-tight drop-shadow-lg">
              🚐 Furgocasa
            </div>
            <div className="text-sm text-white/95 mb-1 font-medium drop-shadow-md">
              Alquiler y Venta de Campers Premium | Desde 95€/día
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-[#ff6b35] font-semibold drop-shadow-md">
              <span className="text-[#ff6b35]">★★★★★</span>
              <span>4.9 valoración | KM ilimitados | Venta desde 49.000€</span>
            </div>
          </a>
          <a
            href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="bg-[#ff6b35] text-white px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all hover:bg-[#ff8555] hover:scale-105 shadow-lg no-underline"
          >
            Reservar Ahora →
          </a>
        </div>
      </div>
    </div>
  )
}
