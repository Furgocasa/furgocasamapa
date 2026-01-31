'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaWide({ position }: BannerProps) {
  const utmCampaign = `furgocasa_wide_${position}_area_detail`

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <div className="relative bg-gradient-to-br from-[#1a5490] via-[#0d3a6b] to-[#1a5490] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
        
        <div className="relative p-6 md:p-10">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <a href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                 target="_blank" rel="noopener noreferrer sponsored nofollow" className="no-underline">
                <div className="text-[42px] font-black text-[#ff6b35] mb-2 tracking-[-1px] drop-shadow-[2px_2px_8px_rgba(0,0,0,0.3)]">
                  🚐 Furgocasa
                </div>
                <div className="text-lg text-white/95 mb-4 font-medium">
                  Alquiler y Venta de Campers de Gran Volumen
                </div>
              </a>
              
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-6">
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="text-[#ff6b35] font-bold text-lg">95€/día</div>
                  <div className="text-white/80 text-xs">Alquiler</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="text-[#ff6b35] font-bold text-lg">49.000€</div>
                  <div className="text-white/80 text-xs">Venta desde</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="text-[#ff6b35] font-bold text-lg">4.9★</div>
                  <div className="text-white/80 text-xs">Valoración</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="text-[#ff6b35] font-bold text-lg">14+</div>
                  <div className="text-white/80 text-xs">Años exp.</div>
                </div>
              </div>

              <a href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                 target="_blank" rel="noopener noreferrer sponsored nofollow"
                 className="bg-gradient-to-r from-[#ff6b35] to-[#ff8555] text-white px-12 py-5 rounded-2xl font-black text-lg transition-all duration-300 shadow-[0_6px_24px_rgba(255,107,53,0.4)] hover:shadow-[0_10px_36px_rgba(255,107,53,0.6)] hover:translate-y-[-3px] no-underline inline-block">
                Ver Campers Disponibles →
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
              <a href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                 target="_blank" rel="noopener noreferrer sponsored nofollow"
                 className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-5 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,107,53,0.1)] hover:border-[rgba(255,107,53,0.3)] hover:translate-y-[-4px] no-underline text-center">
                <div className="text-3xl mb-2">🏕️</div>
                <div className="text-white/90 text-sm font-semibold">Kit Camping</div>
              </a>
              <a href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                 target="_blank" rel="noopener noreferrer sponsored nofollow"
                 className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-5 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,107,53,0.1)] hover:border-[rgba(255,107,53,0.3)] hover:translate-y-[-4px] no-underline text-center">
                <div className="text-3xl mb-2">🍳</div>
                <div className="text-white/90 text-sm font-semibold">Cocina Completa</div>
              </a>
              <a href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                 target="_blank" rel="noopener noreferrer sponsored nofollow"
                 className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-5 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,107,53,0.1)] hover:border-[rgba(255,107,53,0.3)] hover:translate-y-[-4px] no-underline text-center">
                <div className="text-3xl mb-2">🚿</div>
                <div className="text-white/90 text-sm font-semibold">Ducha Interior</div>
              </a>
              <a href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                 target="_blank" rel="noopener noreferrer sponsored nofollow"
                 className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-5 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,107,53,0.1)] hover:border-[rgba(255,107,53,0.3)] hover:translate-y-[-4px] no-underline text-center">
                <div className="text-3xl mb-2">🤖</div>
                <div className="text-white/90 text-sm font-semibold">IA Rutas</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
