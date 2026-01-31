'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaWide({ position }: BannerProps) {
  const utmCampaign = `furgocasa_wide_${position}_area_detail`

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline"
      >
        <div className="bg-gradient-to-br from-[#003d7a] to-[#002855] rounded-2xl overflow-hidden shadow-2xl transition-all hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(0,61,122,0.4)]">
          <div className="flex flex-col lg:flex-row items-stretch h-auto lg:h-[280px]">
            {/* Imagen visible - 40% del ancho */}
            <div className="w-full lg:w-[40%] h-[220px] lg:h-full flex-shrink-0">
              <img 
                src="/images/furgocasa/camper-wide-1.jpg"
                alt="Camper Premium Furgocasa España"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Contenido */}
            <div className="flex-1 text-white p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="text-3xl md:text-4xl font-black text-[#ff6b35] mb-3 flex items-center gap-2">
                  🚐 <span>Furgocasa</span>
                </div>
                <p className="text-base md:text-lg text-white/95 mb-4 leading-relaxed">
                  <strong>Alquiler y Venta</strong> de Campers de Gran Volumen<br/>
                  <span className="text-white/80">Tu hotel sobre ruedas · Todo incluido</span>
                </p>
                
                <div className="flex flex-wrap gap-3 mb-5">
                  <div className="bg-white/10 px-4 py-2 rounded-lg">
                    <div className="text-[#ff6b35] font-bold">95€/día</div>
                    <div className="text-white/70 text-xs">Alquiler</div>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-lg">
                    <div className="text-[#ff6b35] font-bold">49.000€</div>
                    <div className="text-white/70 text-xs">Venta</div>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-lg">
                    <div className="text-[#ff6b35] font-bold">4.9★</div>
                    <div className="text-white/70 text-xs">Rating</div>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-lg">
                    <div className="text-[#ff6b35] font-bold">14+</div>
                    <div className="text-white/70 text-xs">Años</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white text-[#003d7a] font-bold py-3 px-8 rounded-lg text-center hover:bg-gray-100 transition-colors">
                  Ver Campers Disponibles →
                </div>
                <div className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg text-center hover:bg-white/10 transition-colors">
                  Reservar Ahora
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
