'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaPremium({ position }: BannerProps) {
  const utmCampaign = `furgocasa_premium_${position}_area_detail`

  return (
    <div className="w-full max-w-[850px] mx-auto my-8">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline"
      >
        <div className="bg-[#0b3c74] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
          {/* Imagen visible - arriba */}
          <div className="relative h-[220px] overflow-hidden group">
            <img 
              src="/images/banners/camper-8.jpg"
              alt="Camper Premium Furgocasa"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b3c74] via-[#0b3c74]/20 to-transparent"></div>
            <div className="absolute top-4 left-4">
              <span className="text-[10px] bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded uppercase tracking-wider font-bold">Patrocinado</span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="text-3xl font-black text-[#ff6b35] flex items-center gap-2 tracking-tight">
                🚐 Furgocasa
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6 md:p-8 text-white relative z-10 -mt-2">
            <p className="text-sm md:text-base text-white/80 mb-6 text-center font-medium">
              Alquiler y Venta · Tu hotel sobre ruedas totalmente equipado
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
                <div className="text-[#ff6b35] font-black text-xl leading-none mb-1">95€</div>
                <div className="text-white/60 text-[10px] uppercase tracking-wider font-bold">Alquiler/día</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
                <div className="text-[#4ade80] font-black text-xl leading-none mb-1">49k€</div>
                <div className="text-white/60 text-[10px] uppercase tracking-wider font-bold">Venta desde</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
                <div className="text-[#ff6b35] font-black text-xl leading-none mb-1">4.9★</div>
                <div className="text-white/60 text-[10px] uppercase tracking-wider font-bold">Valoración</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
                <div className="text-[#ff6b35] font-black text-xl leading-none mb-1">14+</div>
                <div className="text-white/60 text-[10px] uppercase tracking-wider font-bold">Años exp.</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <div className="bg-[#ff6b35] text-white px-8 py-3 rounded-lg font-bold text-sm text-center hover:bg-[#e85a25] transition-colors shadow-sm">
                Ver Campers Disponibles →
              </div>
              <div className="flex items-center gap-3 text-xs text-white/60 font-medium">
                <span className="flex items-center gap-1"><span>✓</span> Seguro Todo Riesgo</span>
                <span className="flex items-center gap-1"><span>✓</span> KM Ilimitados</span>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
