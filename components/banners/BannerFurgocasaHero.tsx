'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaHero({ position }: BannerProps) {
  const utmCampaign = `furgocasa_hero_${position}_area_detail`

  return (
    <div className="w-full max-w-[728px] mx-auto">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline"
      >
        <div className="bg-gradient-to-br from-[#003d7a] to-[#002855] rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,61,122,0.4)]">
          <div className="flex flex-col md:flex-row items-stretch h-auto md:h-[200px]">
            {/* Imagen visible - 35% del ancho */}
            <div className="w-full md:w-[35%] h-[180px] md:h-full flex-shrink-0">
              <img 
                src="/images/furgocasa/camper-hero-1.jpg"
                alt="Camper Premium Furgocasa"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Contenido */}
            <div className="flex-1 text-white p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="text-2xl md:text-3xl font-black text-[#ff6b35] mb-2">
                  🚐 Furgocasa
                </div>
                <p className="text-sm md:text-base text-white/95 mb-3 leading-relaxed">
                  <strong>Alquiler y Venta</strong> de Campers Premium<br/>
                  <span className="text-white/80">Desde 95€/día · KM ilimitados · 4.9★</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="bg-white text-[#003d7a] font-bold py-2.5 px-5 rounded-lg text-center hover:bg-gray-100 transition-colors text-sm inline-block">
                  Reservar Ahora →
                </div>
                <div className="border-2 border-white text-white font-semibold py-2.5 px-5 rounded-lg text-center hover:bg-white/10 transition-colors text-sm inline-block">
                  Ver Campers
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
