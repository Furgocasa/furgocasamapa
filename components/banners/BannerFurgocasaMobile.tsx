'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaMobile({ position }: BannerProps) {
  const utmCampaign = `furgocasa_mobile_${position}_area_detail`

  return (
    <div className="w-full max-w-[360px] mx-auto my-8">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline group"
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-gray-100 transition-all hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1">
          {/* Foto limpia */}
          <div className="relative h-[180px] overflow-hidden">
            <img
              src="/images/banners/camper-7.jpg"
              alt="Camper Furgocasa"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-800 text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
              Alquiler de Campers
            </div>
          </div>

          {/* Contenido abajo en blanco */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🚐</span>
              <span className="text-[#0b3c74] font-black text-lg tracking-tight">Furgocasa</span>
            </div>

            <p className="text-slate-600 text-xs mb-4 font-medium leading-relaxed">
              Campers de gran volumen totalmente equipadas. Tu hotel sobre ruedas.
            </p>

            <div className="flex items-center gap-2 mb-4">
              <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 flex-1 text-center">
                <div className="text-[#ff6b35] font-black text-lg leading-none mb-0.5">95€</div>
                <div className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">por día</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 flex-1 text-center">
                <div className="text-slate-800 font-black text-lg leading-none mb-0.5">4.9★</div>
                <div className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">google</div>
              </div>
            </div>

            <div className="bg-[#0b3c74] text-white w-full py-3 rounded-xl font-bold text-sm text-center shadow-md group-hover:bg-[#154b8a] transition-colors">
              Ver disponibilidad →
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
