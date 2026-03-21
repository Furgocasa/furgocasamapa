'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaVertical({ position }: BannerProps) {
  const utmCampaign = `furgocasa_vertical_${position}_area_detail`

  return (
    <div className="w-full max-w-[300px] mx-auto my-8">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline group"
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-gray-100 transition-all hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1">
          {/* Foto limpia arriba */}
          <div className="relative h-[160px] overflow-hidden">
            <img
              src="/images/banners/camper-9.jpg"
              alt="Camper Furgocasa"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-800 text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
              Alquiler
            </div>
          </div>

          {/* Panel inferior blanco */}
          <div className="p-5">
            <div className="flex flex-col items-center mb-4 text-center">
              <span className="text-xl mb-1">🚐</span>
              <span className="text-[#0b3c74] font-black text-xl tracking-tight leading-none mb-2">Furgocasa</span>
              <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                Alquiler y venta de campers de gran volumen
              </p>
            </div>

            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                <span className="text-slate-500 text-xs font-medium">Desde</span>
                <span className="text-[#ff6b35] font-black text-sm">95€/día</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                <span className="text-slate-500 text-xs font-medium">Venta</span>
                <span className="text-[#0b3c74] font-black text-sm">49k€</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                <span className="text-slate-500 text-xs font-medium">Rating</span>
                <span className="text-slate-800 font-black text-sm">4.9★</span>
              </div>
            </div>

            <div className="bg-[#0b3c74] text-white w-full py-3 rounded-xl font-bold text-sm text-center shadow-md group-hover:bg-[#154b8a] transition-colors">
              Ver fechas libres →
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
