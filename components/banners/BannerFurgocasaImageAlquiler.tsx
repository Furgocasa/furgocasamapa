'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaImageAlquiler({ position }: BannerProps) {
  const utmCampaign = `furgocasa_img_alquiler_${position}_area_detail`

  return (
    <div className="w-full max-w-[1100px] mx-auto">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline"
      >
        <div className="bg-gradient-to-br from-[#003d7a] to-[#002855] rounded-2xl overflow-hidden shadow-2xl transition-all hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(0,61,122,0.4)]">
          <div className="flex flex-col md:flex-row items-stretch h-auto md:h-[320px]">
            
            {/* Columna de imágenes - 45% del ancho */}
            <div className="w-full md:w-[45%] flex-shrink-0 grid grid-rows-2 gap-1 h-[400px] md:h-full">
              <div className="relative overflow-hidden">
                <img 
                  src="/images/furgocasa/camper-interior-1.jpg"
                  alt="Interior Camper Furgocasa"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 left-2 bg-[#ff6b35] text-white text-xs font-bold px-2 py-1 rounded">
                  Interior Equipado
                </div>
              </div>
              <div className="relative overflow-hidden">
                <img 
                  src="/images/furgocasa/camper-exterior-2.jpg"
                  alt="Exterior Camper Furgocasa"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 left-2 bg-[#ff6b35] text-white text-xs font-bold px-2 py-1 rounded">
                  Gran Volumen
                </div>
              </div>
            </div>

            {/* Contenido - 55% del ancho */}
            <div className="flex-1 text-white p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#ff6b35]/20 px-3 py-1.5 rounded-full mb-3">
                  <span className="text-xl">🚐</span>
                  <span className="text-white font-bold text-xs">ALQUILER DE CAMPERS</span>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3">
                  Tu Próxima Aventura
                </h3>
                
                <p className="text-white/90 text-sm md:text-base mb-5 leading-relaxed">
                  Campers de <strong>gran volumen</strong> con todo incluido.<br/>
                  Desde <span className="text-[#ff6b35] font-bold text-lg">95€/día</span> con kilómetros ilimitados.
                </p>

                <div className="flex flex-wrap gap-2 mb-5">
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg text-sm">
                    <span>✓</span>
                    <span>KM Ilimitados</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg text-sm">
                    <span>✓</span>
                    <span>Todo Equipado</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg text-sm">
                    <span>✓</span>
                    <span>4.9★ Rating</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white text-[#003d7a] px-6 py-3 rounded-lg font-bold text-base text-center hover:bg-gray-100 transition-colors">
                  Ver Campers Disponibles →
                </div>
                <div className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold text-base text-center hover:bg-white/10 transition-colors">
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
