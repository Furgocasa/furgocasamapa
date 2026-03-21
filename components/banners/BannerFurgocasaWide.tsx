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
        <div className="relative rounded-2xl overflow-hidden h-[200px] md:h-[240px]">
          {/* Foto full-bleed */}
          <img
            src="/images/banners/camper-4.jpg"
            alt="Camper Premium Furgocasa España"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out"
          />

          {/* Overlay cinematográfico */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />

          {/* Contenido */}
          <div className="relative z-10 h-full flex items-center p-6 md:p-10">
            <div className="max-w-xl">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xs">🚐</div>
                <span className="text-white/80 font-semibold text-xs tracking-widest uppercase">Furgocasa</span>
                <span className="text-white/30 text-xs">·</span>
                <span className="text-white/50 text-xs font-medium">Alquiler y Venta de Campers de Gran Volumen</span>
              </div>

              <h3 className="text-white text-2xl md:text-3xl font-black tracking-tight leading-tight mb-3">
                La libertad de viajar a tu ritmo
              </h3>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-[#ff6b35] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 group-hover:bg-[#e85a25] transition-all">
                  Descubrir modelos →
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
                    <span className="text-[#ff6b35] font-bold text-sm">95€</span><span className="text-white/50 text-xs">/día</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
                    <span className="text-emerald-400 font-bold text-sm">49k€</span><span className="text-white/50 text-xs"> venta</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
