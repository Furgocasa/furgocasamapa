'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaPremium({ position }: BannerProps) {
  const utmCampaign = `furgocasa_premium_${position}_area_detail`

  return (
    <div className="w-full max-w-[850px] mx-auto">
      <div className="relative bg-gradient-to-br from-[#1a5490] via-[#0d3a6b] to-[#1a5490] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.4)] hover:-translate-y-1">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <img 
            src="/images/furgocasa/camper-premium-1.jpg"
            alt="Camper Premium Furgocasa"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a5490]/95 via-[#0d3a6b]/90 to-[#1a5490]/95"></div>
        </div>
        
        {/* Efecto de brillo animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        
        <div className="relative p-8 md:p-12">
          <div className="text-center mb-8">
            <a
              href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="no-underline"
            >
              <div className="text-6xl mb-4 animate-bounce">🚐</div>
              <div className="text-4xl md:text-5xl font-black text-[#ff6b35] mb-3 tracking-tight">
                Furgocasa
              </div>
              <div className="text-lg md:text-xl text-white/95 mb-6 font-medium">
                Alquiler y Venta | Tu hotel sobre ruedas
              </div>
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center transition-all hover:bg-white/15 hover:scale-105">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-[#ff6b35] font-black text-xl">95€</div>
              <div className="text-white/80 text-xs">Desde/día</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center transition-all hover:bg-white/15 hover:scale-105">
              <div className="text-3xl mb-2">🏷️</div>
              <div className="text-[#ff6b35] font-black text-xl">49k€</div>
              <div className="text-white/80 text-xs">Venta desde</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center transition-all hover:bg-white/15 hover:scale-105">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-[#ff6b35] font-black text-xl">4.9</div>
              <div className="text-white/80 text-xs">Valoración</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center transition-all hover:bg-white/15 hover:scale-105">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-[#ff6b35] font-black text-xl">14+</div>
              <div className="text-white/80 text-xs">Años exp.</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-gradient-to-r from-[#ff6b35] to-[#ff8555] text-white px-10 py-4 rounded-xl font-black text-lg transition-all hover:scale-105 hover:shadow-[0_8px_32px_rgba(255,107,53,0.6)] shadow-[0_4px_16px_rgba(255,107,53,0.4)] no-underline"
            >
              Ver Campers Disponibles →
            </a>
            <div className="flex items-center gap-3 text-white/90 text-sm">
              <span className="inline-flex items-center gap-1">
                ✓ <span className="font-semibold">Cancelación flexible</span>
              </span>
              <span className="inline-flex items-center gap-1">
                ✓ <span className="font-semibold">Todo incluido</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  )
}
