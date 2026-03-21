'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaMobile({ position }: BannerProps) {
  const utmCampaign = `furgocasa_mobile_${position}_area_detail`

  return (
    <div className="w-full max-w-[320px] mx-auto my-8">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline"
      >
        <div className="bg-[#0b3c74] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
          {/* Imagen visible - 40% altura */}
          <div className="relative h-[160px] overflow-hidden">
            <img 
              src="/images/banners/camper-7.jpg"
              alt="Camper Furgocasa"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b3c74] via-transparent to-transparent"></div>
            <div className="absolute top-3 left-3">
              <span className="text-[9px] bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded uppercase font-bold tracking-wider">Patrocinado</span>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-5 text-center text-white relative z-10 -mt-8">
            <div className="flex items-center justify-center gap-1.5 mb-1 drop-shadow-md">
              <span className="text-xl">🚐</span>
              <div className="text-xl font-black text-[#ff6b35] tracking-tight">
                Furgocasa
              </div>
            </div>
            <p className="text-xs text-white/80 mb-4 font-medium">
              Alquiler y Venta de Campers Premium
            </p>
            
            <div className="flex justify-center gap-2 mb-4">
              <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex flex-col items-center flex-1">
                <div className="text-[#ff6b35] font-bold text-sm leading-none mb-1">95€</div>
                <div className="text-white/60 text-[9px] uppercase tracking-wider">Alquiler</div>
              </div>
              <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex flex-col items-center flex-1">
                <div className="text-[#4ade80] font-bold text-sm leading-none mb-1">49k</div>
                <div className="text-white/60 text-[9px] uppercase tracking-wider">Venta</div>
              </div>
            </div>
            
            <div className="bg-[#ff6b35] text-white w-full py-2.5 rounded-lg font-bold text-sm hover:bg-[#e85a25] transition-colors shadow-sm">
              Ver Campers →
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
