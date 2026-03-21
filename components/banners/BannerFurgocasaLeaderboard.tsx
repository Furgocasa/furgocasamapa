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
        <div className="relative rounded-2xl overflow-hidden h-[120px] md:h-[140px]">
          {/* Foto full-bleed */}
          <img
            src="/images/banners/camper-6.jpg"
            alt="Camper Furgocasa en ruta"
            className="absolute inset-0 w-full h-full object-cover object-[center_40%] group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40" />

          {/* Contenido compacto */}
          <div className="relative z-10 h-full flex items-center justify-between px-6 md:px-10 gap-6">
            <div className="flex items-center gap-5 flex-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xs">🚐</div>
                <span className="text-white font-black text-lg tracking-tight">Furgocasa</span>
              </div>
              <div className="hidden md:block w-px h-8 bg-white/15"></div>
              <div className="hidden md:flex items-center gap-4 text-white/50 text-xs font-medium">
                <span>Alquiler <span className="text-[#ff6b35] font-bold">95€/día</span></span>
                <span className="text-white/20">·</span>
                <span>Venta <span className="text-emerald-400 font-bold">49k€</span></span>
                <span className="text-white/20">·</span>
                <span><span className="text-[#ff6b35] font-bold">4.9★</span></span>
              </div>
            </div>
            <div className="bg-[#ff6b35] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 group-hover:bg-[#e85a25] transition-all whitespace-nowrap">
              Descubrir →
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
