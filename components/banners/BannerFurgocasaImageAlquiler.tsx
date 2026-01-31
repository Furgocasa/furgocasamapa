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
        <div className="relative bg-gradient-to-br from-[#1a5490] to-[#0d3a6b] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.4)] hover:-translate-y-1">
          
          {/* Imagen de fondo */}
          <div className="absolute inset-0">
            <img 
              src="/images/furgocasa/camper-exterior-1.jpg"
              alt="Alquiler Campers Furgocasa"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a5490]/95 via-[#0d3a6b]/80 to-[#1a5490]/95"></div>
          </div>

          <div className="relative p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              
              {/* Contenido izquierdo */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-[#ff6b35]/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4">
                  <span className="text-2xl">🚐</span>
                  <span className="text-white font-bold text-sm">ALQUILER DE CAMPERS</span>
                </div>
                
                <h3 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
                  Tu Próxima Aventura
                </h3>
                
                <p className="text-white/90 text-base md:text-lg mb-6 max-w-xl">
                  Campers de gran volumen con todo incluido. Desde <span className="text-[#ff6b35] font-bold">95€/día</span> con kilómetros ilimitados.
                </p>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-6">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-xl">✓</span>
                    <span className="text-white text-sm">KM Ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-xl">✓</span>
                    <span className="text-white text-sm">Todo Equipado</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-xl">✓</span>
                    <span className="text-white text-sm">4.9★ Rating</span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#ff6b35] to-[#ff8555] text-white px-8 py-4 rounded-xl font-black text-lg shadow-[0_4px_20px_rgba(255,107,53,0.5)] hover:shadow-[0_8px_32px_rgba(255,107,53,0.7)] hover:scale-105 transition-all">
                  Ver Campers Disponibles
                  <span className="text-2xl">→</span>
                </div>
              </div>

              <div className="w-full md:w-[320px] lg:w-[400px] space-y-3">
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                  <img 
                    src="/images/furgocasa/camper-interior-1.jpg"
                    alt="Interior Camper Furgocasa"
                    className="w-full h-[180px] object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <div className="text-white font-bold text-xs">Interior Equipado</div>
                    <div className="text-white/80 text-xs">Todo incluido</div>
                  </div>
                </div>
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                  <img 
                    src="/images/furgocasa/camper-exterior-2.jpg"
                    alt="Exterior Camper Furgocasa"
                    className="w-full h-[140px] object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <div className="text-white font-bold text-xs">Gran Volumen</div>
                    <div className="text-white/80 text-xs">Desde 95€/día</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
