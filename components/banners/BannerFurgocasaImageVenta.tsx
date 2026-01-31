'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaImageVenta({ position }: BannerProps) {
  const utmCampaign = `furgocasa_img_venta_${position}_area_detail`

  return (
    <div className="w-full max-w-[1100px] mx-auto">
      <a
        href={`https://www.furgocasa.com/es/ventas?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline"
      >
        <div className="relative bg-gradient-to-br from-[#2c5f2d] to-[#1e4620] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.4)] hover:-translate-y-1">
          
          {/* Imagen de fondo */}
          <div className="absolute inset-0">
            <img 
              src="/images/furgocasa/camper-venta-bg.jpg"
              alt="Venta Campers Furgocasa"
              className="w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#2c5f2d]/95 via-[#1e4620]/85 to-[#2c5f2d]/95"></div>
          </div>

          <div className="relative p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              
              {/* Contenido izquierdo */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-[#4ade80]/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4">
                  <span className="text-2xl">🏷️</span>
                  <span className="text-white font-bold text-sm">VENTA DE CAMPERS</span>
                </div>
                
                <h3 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
                  Tu Camper Para Siempre
                </h3>
                
                <p className="text-white/90 text-base md:text-lg mb-6 max-w-xl">
                  Campers de nuestra flota de alquiler. Revisados, garantizados y con historial completo. Desde <span className="text-[#4ade80] font-bold">49.000€</span>.
                </p>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-6">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-xl">✓</span>
                    <span className="text-white text-sm">Historial Completo</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-xl">✓</span>
                    <span className="text-white text-sm">Garantía Incluida</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-xl">✓</span>
                    <span className="text-white text-sm">Financiación 120m</span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#1e4620] px-8 py-4 rounded-xl font-black text-lg shadow-[0_4px_20px_rgba(74,222,128,0.5)] hover:shadow-[0_8px_32px_rgba(74,222,128,0.7)] hover:scale-105 transition-all">
                  Ver Campers en Venta
                  <span className="text-2xl">→</span>
                </div>
              </div>

              <div className="w-full md:w-[320px] lg:w-[400px]">
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                  <img 
                    src="/images/furgocasa/camper-venta-1.jpg"
                    alt="Camper en Venta Furgocasa"
                    className="w-full h-[240px] object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="text-white font-bold text-sm">10 vehículos disponibles</div>
                    <div className="text-white/80 text-xs">Desde 49.000€</div>
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
