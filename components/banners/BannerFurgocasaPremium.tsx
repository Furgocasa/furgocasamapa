'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaPremium({ position }: BannerProps) {
  const utmCampaign = `furgocasa_premium_${position}_area_detail`

  return (
    <div className="w-full max-w-[900px] mx-auto my-8">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline group"
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-gray-100 transition-all hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1">
          {/* Foto limpia */}
          <div className="relative h-[200px] overflow-hidden">
            <img
              src="/images/banners/camper-8.jpg"
              alt="Camper Premium Furgocasa"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-slate-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Alquiler
            </div>
          </div>

          {/* Panel inferior blanco */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🚐</span>
                <span className="text-[#0b3c74] font-black text-xl tracking-tight">Furgocasa</span>
              </div>
              <p className="text-slate-500 text-xs md:text-sm font-medium">
                Alquiler y venta de campers de gran volumen · Tu hotel sobre ruedas
              </p>
            </div>

            {/* Stats en fila */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-center w-[120px]">
                <div className="text-[#ff6b35] font-black text-lg leading-none mb-1">95€</div>
                <div className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">por día</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-center w-[120px]">
                <div className="text-[#0b3c74] font-black text-lg leading-none mb-1">49k€</div>
                <div className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">venta</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-center w-[120px]">
                <div className="text-slate-800 font-black text-lg leading-none mb-1">4.9★</div>
                <div className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">google</div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="bg-[#0b3c74] text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-md group-hover:bg-[#154b8a] transition-all">
                Ver campers disponibles →
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
