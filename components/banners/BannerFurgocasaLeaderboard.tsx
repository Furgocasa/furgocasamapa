'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaLeaderboard({ position }: BannerProps) {
  const utmCampaign = `furgocasa_leaderboard_${position}_area_detail`

  return (
    <div className="w-full max-w-[1400px] mx-auto my-8">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline group"
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-gray-100 transition-all hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1">
          <div className="flex flex-col md:flex-row items-stretch h-auto md:h-[120px]">
            
            {/* Foto limpia */}
            <div className="w-full md:w-[25%] h-[140px] md:h-full flex-shrink-0 relative overflow-hidden group">
              <img 
                src="/images/banners/camper-6.jpg"
                alt="Camper Furgocasa Pirineos"
                className="w-full h-full object-cover object-[center_40%] group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Contenido compacto */}
            <div className="flex-1 flex items-center justify-between p-4 md:px-8 gap-4 md:gap-6 bg-white">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚐</span>
                  <span className="text-slate-900 font-extrabold text-lg tracking-tight">Furgocasa</span>
                </div>
                
                <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                
                <div className="flex flex-wrap items-center gap-4 text-slate-500 text-xs font-medium">
                  <span className="uppercase tracking-wider">Campers de Gran Volumen</span>
                  <span className="hidden lg:inline text-slate-300">|</span>
                  <span className="flex items-baseline gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100"><span className="text-[#0b3c74] font-black text-sm">95€</span>/día</span>
                </div>
              </div>
              
              <div className="bg-[#0b3c74] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md group-hover:bg-[#154b8a] transition-colors whitespace-nowrap text-center">
                Reservar →
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
