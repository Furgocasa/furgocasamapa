'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaVertical({ position }: BannerProps) {
  const utmCampaign = `furgocasa_vertical_${position}_area_detail`

  return (
    <div className="w-full max-w-[300px] mx-auto my-8">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline"
      >
        <div className="bg-[#0b3c74] rounded-2xl overflow-hidden shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl group">
          {/* Imagen visible - 45% altura */}
          <div className="relative h-[200px] overflow-hidden">
            <img 
              src="/images/banners/camper-9.jpg"
              alt="Camper Furgocasa"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b3c74] via-[#0b3c74]/40 to-transparent"></div>
            <div className="absolute top-3 left-3">
              <span className="text-[9px] bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded uppercase tracking-wider font-bold">Patrocinado</span>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-5 text-white text-center relative z-10 -mt-6">
            <div className="text-2xl font-black text-[#ff6b35] mb-1 flex items-center justify-center gap-1.5 tracking-tight drop-shadow-md">
              <span className="text-xl">🚐</span>
              Furgocasa
            </div>
            <p className="text-[11px] text-white/80 mb-5 font-medium uppercase tracking-wider">
              Alquiler y Venta de Campers
            </p>
          </div>

          <div className="px-5 pb-4 space-y-2">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-white hover:bg-white/10 transition-colors">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm">💰</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-[#ff6b35] leading-none mb-0.5">95€/día</div>
                <div className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Desde</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-white hover:bg-white/10 transition-colors">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm">🛣️</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-[#ff6b35] leading-none mb-0.5">Ilimitados</div>
                <div className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Kilómetros</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-white hover:bg-white/10 transition-colors">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm">🏷️</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-[#4ade80] leading-none mb-0.5">49.000€</div>
                <div className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Venta desde</div>
              </div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="block bg-[#ff6b35] text-white p-3 rounded-xl font-bold text-sm text-center shadow-sm group-hover:bg-[#e85a25] transition-colors">
              Reservar →
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
