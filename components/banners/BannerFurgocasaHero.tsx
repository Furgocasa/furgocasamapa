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
        className="block no-underline"
      >
        <div className="bg-[#0b3c74] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="flex flex-col md:flex-row items-stretch h-auto md:h-[180px]">
            {/* Imagen visible - 35% del ancho */}
            <div className="w-full md:w-[35%] h-[180px] md:h-full flex-shrink-0 relative group">
              <img 
                src="/images/banners/camper-5.jpg"
                alt="Camper Premium Furgocasa"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-transparent to-[#0b3c74]"></div>
            </div>

            {/* Contenido */}
            <div className="flex-1 text-white p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🚐</span>
                  <div className="text-xl font-black text-[#ff6b35] tracking-tight">Furgocasa</div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                  Alquiler y Venta de Campers Premium
                </h3>
                <p className="text-sm text-white/80 mb-3">
                  Tu hotel sobre ruedas totalmente equipado con seguro a todo riesgo.
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider text-white/60 mb-2">
                  <span className="bg-white/5 px-2 py-1 rounded">Desde <span className="text-[#ff6b35]">95€/día</span></span>
                  <span className="bg-white/5 px-2 py-1 rounded">KM Ilimitados</span>
                  <span className="bg-white/5 px-2 py-1 rounded"><span className="text-[#ff6b35]">4.9★</span> Google</span>
                </div>
              </div>

              <div className="flex items-center">
                <div className="text-[#ff6b35] font-bold text-sm hover:text-[#e85a25] transition-colors flex items-center gap-1">
                  Ver Campers Disponibles <span>→</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
