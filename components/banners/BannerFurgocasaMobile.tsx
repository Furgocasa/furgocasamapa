'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaMobile({ position }: BannerProps) {
  const utmCampaign = `furgocasa_mobile_${position}_area_detail`

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline"
      >
        <div className="bg-gradient-to-br from-[#003d7a] to-[#002855] rounded-xl overflow-hidden shadow-2xl hover:shadow-[0_15px_40px_rgba(0,61,122,0.4)] transition-all">
          {/* Imagen visible - 40% altura */}
          <div className="relative h-[200px] overflow-hidden">
            <img 
              src="/images/furgocasa/camper-mobile-1.jpg"
              alt="Camper Furgocasa"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#002855]/60 via-transparent to-transparent"></div>
            <div className="absolute top-3 left-3">
              <span className="text-xs bg-white/90 text-[#003d7a] px-2 py-1 rounded-full font-bold">Publicidad</span>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-5 text-center text-white">
            <div className="text-2xl font-black text-[#ff6b35] mb-1">
              🚐 Furgocasa
            </div>
            <p className="text-xs text-white/90 mb-3">
              Alquiler y Venta de Campers Premium
            </p>
            
            <div className="flex justify-center gap-3 mb-4 text-xs">
              <div className="bg-white/10 px-3 py-2 rounded-lg">
                <div className="text-[#ff6b35] font-bold">95€/día</div>
                <div className="text-white/70">Alquiler</div>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-lg">
                <div className="text-[#ff6b35] font-bold">49k€</div>
                <div className="text-white/70">Venta</div>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-lg">
                <div className="text-[#ff6b35] font-bold">4.9★</div>
                <div className="text-white/70">Rating</div>
              </div>
            </div>
            
            <div className="bg-white text-[#003d7a] px-6 py-3 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors">
              Ver Campers →
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
