'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaHero({ position }: BannerProps) {
  const utmCampaign = `furgocasa_hero_${position}_area_detail`

  return (
    <div className="w-full max-w-[1400px] mx-auto my-8">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline group"
      >
        <div className="relative rounded-2xl overflow-hidden h-[180px] md:h-[200px]">
          {/* Foto full-bleed */}
          <img
            src="/images/banners/camper-5.jpg"
            alt="Camper Premium Furgocasa"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-transparent" />

          {/* Contenido */}
          <div className="relative z-10 h-full flex items-center p-6 md:p-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[10px]">🚐</div>
                <span className="text-white/80 font-semibold text-xs tracking-widest uppercase">Furgocasa</span>
              </div>
              <h3 className="text-white text-xl md:text-2xl font-black tracking-tight leading-tight mb-2">
                Campers Premium · Tu aventura empieza aquí
              </h3>
              <div className="flex items-center gap-3 text-white/50 text-xs font-medium">
                <span>Desde <span className="text-[#ff6b35] font-bold">95€/día</span></span>
                <span className="text-white/20">·</span>
                <span>KM ilimitados</span>
                <span className="text-white/20">·</span>
                <span><span className="text-[#ff6b35] font-bold">4.9★</span> Google</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-[#ff6b35] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 group-hover:bg-[#e85a25] transition-all whitespace-nowrap">
                Ver campers →
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
