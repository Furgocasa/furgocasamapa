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
        <div className="relative rounded-2xl overflow-hidden h-[320px]">
          {/* Foto full-bleed */}
          <img
            src="/images/banners/camper-7.jpg"
            alt="Camper Furgocasa"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out"
          />

          {/* Overlay de abajo a arriba */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />

          {/* Contenido abajo */}
          <div className="relative z-10 h-full flex flex-col justify-end p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[10px]">🚐</div>
              <span className="text-white font-black text-lg tracking-tight">Furgocasa</span>
            </div>

            <p className="text-white/60 text-xs mb-3 font-medium">
              Campers de gran volumen · Todo incluido
            </p>

            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
                <span className="text-[#ff6b35] font-bold text-sm">95€</span><span className="text-white/40 text-[10px]">/día</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
                <span className="text-emerald-400 font-bold text-sm">49k€</span><span className="text-white/40 text-[10px]"> venta</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
                <span className="text-white font-bold text-sm">4.9★</span>
              </div>
            </div>

            <div className="bg-[#ff6b35] text-white w-full py-3 rounded-xl font-bold text-sm text-center shadow-lg shadow-orange-500/25 group-hover:bg-[#e85a25] transition-colors">
              Ver campers →
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
