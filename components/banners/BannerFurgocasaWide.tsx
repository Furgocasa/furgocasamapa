'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaWide({ position }: BannerProps) {
  const utmCampaign = `furgocasa_wide_${position}_area_detail`

  return (
    <div className="w-full max-w-[1400px] mx-auto my-8">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline"
      >
        <div className="bg-[#0b3c74] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative">
          <div className="flex flex-col lg:flex-row items-stretch h-auto lg:h-[220px]">
            {/* Contenido - 60% */}
            <div className="flex-1 text-white p-6 md:p-8 flex flex-col justify-between z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🚐</span>
                  <span className="text-[#ff6b35] font-black text-xl tracking-tight">Furgocasa</span>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                  Alquiler y Venta de Campers
                </h3>
                <p className="text-white/80 text-sm mb-4 leading-relaxed max-w-xl">
                  Tu hotel sobre ruedas totalmente equipado. Disfruta de la libertad con nuestras campers de gran volumen premium.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-0">
                  <div className="bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <div className="text-[#ff6b35] font-bold text-sm">95€/día</div>
                    <div className="text-white/60 text-[10px] uppercase tracking-wider">Alquiler</div>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <div className="text-[#4ade80] font-bold text-sm">49.000€</div>
                    <div className="text-white/60 text-[10px] uppercase tracking-wider">Venta</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Imagen visible con gradiente de fusión - 40% */}
            <div className="w-full lg:w-[40%] h-[200px] lg:h-full flex-shrink-0 relative group">
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0b3c74] via-[#0b3c74]/60 to-transparent z-[1]" />
              <img 
                src="/images/banners/camper-4.jpg"
                alt="Camper Premium Furgocasa España"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 object-center"
              />
              <div className="absolute bottom-4 right-4 z-[2]">
                <div className="bg-[#ff6b35] text-white px-5 py-2.5 rounded-lg font-bold text-sm text-center shadow-lg group-hover:bg-[#e85a25] transition-colors">
                  Descubrir Modelos →
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
