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
        className="block no-underline group"
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-gray-100 transition-all hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1">
          <div className="flex flex-col lg:flex-row items-stretch">
            
            {/* Contenido sobre fondo blanco */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center order-2 lg:order-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🚐</span>
                <span className="text-[#0b3c74] font-bold text-xs tracking-widest uppercase">Furgocasa</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Alquiler y Venta de Campers de Gran Volumen</span>
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2">
                La libertad de viajar a tu ritmo
              </h3>
              
              <p className="text-slate-600 text-sm leading-relaxed mb-5 max-w-xl">
                Tu hotel sobre ruedas totalmente equipado. Disfruta de la libertad con nuestras campers premium.
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="bg-[#ff6b35] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md group-hover:bg-[#e85a25] transition-colors whitespace-nowrap">
                  Descubrir modelos →
                </div>
                
                <div className="flex items-center gap-4 bg-slate-50 rounded-lg px-4 py-2 border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Alquiler</span>
                    <span className="text-[#ff6b35] font-black leading-none">95€<span className="text-slate-500 text-xs font-medium">/día</span></span>
                  </div>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Venta</span>
                    <span className="text-emerald-500 font-black leading-none">49k€</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Foto limpia */}
            <div className="w-full lg:w-[35%] relative overflow-hidden h-[180px] lg:h-auto order-1 lg:order-2">
              <img
                src="/images/banners/camper-4.jpg"
                alt="Camper Premium Furgocasa España"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            
          </div>
        </div>
      </a>
    </div>
  )
}
