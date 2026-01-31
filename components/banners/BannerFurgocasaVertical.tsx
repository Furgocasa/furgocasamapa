'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaVertical({ position }: BannerProps) {
  const utmCampaign = `furgocasa_vertical_${position}_area_detail`

  return (
    <div className="w-full max-w-[300px] mx-auto">
      <div className="bg-gradient-to-b from-[#1a5490] to-[#0d3a6b] rounded-[15px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-1">
        <a
          href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
          target="_blank"
          rel="noopener noreferrer sponsored nofollow"
          className="block no-underline text-white"
        >
          <div className="p-6 text-center">
            <div className="text-5xl mb-4 animate-pulse">🚐</div>
            <div className="text-2xl font-black text-[#ff6b35] mb-2 tracking-tight">
              Furgocasa
            </div>
            <div className="text-sm text-white/90 mb-4">
              Alquiler y Venta de Campers
            </div>
          </div>
        </a>
        
        <div className="px-6 pb-4 space-y-4">
          <a
            href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-start gap-3 mb-5 no-underline text-white"
          >
            <div className="text-2xl">💰</div>
            <div className="flex-1 text-left">
              <div className="text-xs text-white/70 mb-0.5">Desde</div>
              <div className="text-base font-bold text-[#ff6b35]">95€/día</div>
            </div>
          </a>

          <a
            href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-start gap-3 mb-5 no-underline text-white"
          >
            <div className="text-2xl">🚗</div>
            <div className="flex-1 text-left">
              <div className="text-xs text-white/70 mb-0.5">Kilómetros</div>
              <div className="text-base font-bold text-[#ff6b35]">Ilimitados</div>
            </div>
          </a>

          <a
            href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-start gap-3 mb-5 no-underline text-white"
          >
            <div className="text-2xl">⭐</div>
            <div className="flex-1 text-left">
              <div className="text-xs text-white/70 mb-0.5">Valoración</div>
              <div className="text-base font-bold text-[#ff6b35]">4.9 / 5.0</div>
            </div>
          </a>

          <a
            href={`https://www.furgocasa.com/es/ventas?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-start gap-3 mb-0 no-underline text-white"
          >
            <div className="text-2xl">🏷️</div>
            <div className="flex-1 text-left">
              <div className="text-xs text-white/70 mb-0.5">Venta desde</div>
              <div className="text-base font-bold text-[#ff6b35]">49.000€</div>
            </div>
          </a>
        </div>

        <div className="px-6 pb-6">
          <a
            href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="block bg-[#ff6b35] text-white p-4 rounded-[10px] font-extrabold text-base text-center transition-all duration-300 no-underline hover:bg-[#ff8555] hover:shadow-[0_4px_16px_rgba(255,107,53,0.4)]"
          >
            Reservar →
          </a>
        </div>
      </div>
    </div>
  )
}
