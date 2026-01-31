'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaPremium({ position }: BannerProps) {
  const utmCampaign = `furgocasa_premium_${position}_area_detail`

  return (
    <div className="w-full max-w-[850px] mx-auto">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline"
      >
        <div className="bg-gradient-to-br from-[#003d7a] to-[#002855] rounded-2xl overflow-hidden shadow-2xl transition-all hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(0,61,122,0.4)]">
          {/* Imagen visible - arriba */}
          <div className="relative h-[220px] overflow-hidden">
            <img 
              src="/images/furgocasa/camper-premium-1.jpg"
              alt="Camper Premium Furgocasa A Coruña"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#002855]/80 via-transparent to-transparent"></div>
            <div className="absolute top-4 left-4">
              <span className="text-xs bg-white/90 text-[#003d7a] px-3 py-1 rounded-full font-bold">Publicidad</span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="text-4xl font-black text-[#ff6b35] flex items-center gap-2">
                🚐 <span>Furgocasa</span>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6 md:p-8 text-white">
            <p className="text-lg md:text-xl text-white/95 mb-6 text-center">
              <strong>Alquiler y Venta</strong> · Tu hotel sobre ruedas
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/10 rounded-lg p-3 text-center hover:bg-white/15 transition-colors">
                <div className="text-2xl mb-1">💰</div>
                <div className="text-[#ff6b35] font-black text-lg">95€</div>
                <div className="text-white/70 text-xs">Desde/día</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center hover:bg-white/15 transition-colors">
                <div className="text-2xl mb-1">🏷️</div>
                <div className="text-[#ff6b35] font-black text-lg">49k€</div>
                <div className="text-white/70 text-xs">Venta desde</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center hover:bg-white/15 transition-colors">
                <div className="text-2xl mb-1">⭐</div>
                <div className="text-[#ff6b35] font-black text-lg">4.9</div>
                <div className="text-white/70 text-xs">Valoración</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center hover:bg-white/15 transition-colors">
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-[#ff6b35] font-black text-lg">14+</div>
                <div className="text-white/70 text-xs">Años exp.</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <div className="bg-white text-[#003d7a] px-8 py-3 rounded-lg font-bold text-base text-center hover:bg-gray-100 transition-colors">
                Ver Campers Disponibles →
              </div>
              <div className="flex items-center justify-center gap-3 text-sm text-white/80">
                <span>✓ Cancelación flexible</span>
                <span>✓ Todo incluido</span>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
