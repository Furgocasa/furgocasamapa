'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaMobile({ position }: BannerProps) {
  const utmCampaign = `furgocasa_mobile_${position}_area_detail`

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <div className="bg-gradient-to-br from-[#1a5490] to-[#0d3a6b] rounded-xl overflow-hidden shadow-lg">
        <a
          href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
          target="_blank"
          rel="noopener noreferrer sponsored nofollow"
          className="block no-underline"
        >
          <div className="p-5 text-center">
            <div className="text-4xl mb-3 animate-bounce">🚐</div>
            <div className="text-2xl font-black text-[#ff6b35] mb-2">
              Furgocasa
            </div>
            <div className="text-xs text-white/90 mb-3">
              Alquiler y Venta de Campers
            </div>
            <div className="flex justify-center gap-3 mb-4 text-xs text-white/85">
              <div className="text-center">
                <div className="text-[#ff6b35] font-bold">95€/día</div>
                <div>Alquiler</div>
              </div>
              <div className="text-center">
                <div className="text-[#ff6b35] font-bold">49k€</div>
                <div>Venta</div>
              </div>
              <div className="text-center">
                <div className="text-[#ff6b35] font-bold">4.9★</div>
                <div>Rating</div>
              </div>
            </div>
            <div className="bg-[#ff6b35] text-white px-6 py-3 rounded-lg font-bold text-sm inline-block transition-all hover:bg-[#ff8555]">
              Ver Campers →
            </div>
          </div>
        </a>
      </div>
    </div>
  )
}
