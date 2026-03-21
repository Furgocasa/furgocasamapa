'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaHero({ position }: BannerProps) {
  const utmCampaign = `furgocasa_hero_${position}_area_detail`

  return (
    <div className="w-full max-w-[1400px] mx-auto my-8">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline group"
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-gray-100 transition-all hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1">
          <div className="flex flex-col md:flex-row items-stretch h-auto md:h-[180px]">
            
            {/* Foto limpia a un lado */}
            <div className="w-full md:w-[35%] h-[180px] md:h-full flex-shrink-0 relative overflow-hidden group">
              <img 
                src="/images/banners/camper-5.jpg"
                alt="Camper Premium Furgocasa"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Contenido sobre fondo blanco */}
            <div className="flex-1 p-5 md:p-6 lg:p-8 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚐</span>
                  <div className="text-sm font-bold text-[#0b3c74] tracking-tight uppercase">Furgocasa</div>
                </div>
                <div className="bg-[#ff6b35] text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md group-hover:bg-[#e85a25] transition-colors whitespace-nowrap hidden md:block">
                  Ver campers →
                </div>
              </div>

              <h3 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
                Campers de Gran Volumen totalmente equipadas
              </h3>
              
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-slate-500 text-[11px] md:text-xs font-medium uppercase tracking-wider mb-4 md:mb-0">
                <span className="flex items-center gap-1.5"><span className="text-[#ff6b35] font-black text-sm">95€/día</span></span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1">KM ilimitados</span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1"><span className="text-[#fbbf24] text-sm">★</span> 4.9 Google</span>
              </div>

              <div className="md:hidden mt-2">
                <div className="bg-[#0b3c74] text-white px-5 py-3 rounded-lg font-bold text-sm shadow-md text-center">
                  Ver disponibilidad →
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
