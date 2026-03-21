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
        <div className="relative rounded-2xl overflow-hidden">
          {/* Foto full-bleed arriba */}
          <div className="relative h-[200px] overflow-hidden">
            <img
              src="/images/banners/camper-9.jpg"
              alt="Camper Furgocasa"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent" />

            <div className="absolute bottom-3 left-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[10px]">🚐</div>
              <span className="text-white font-black text-lg tracking-tight drop-shadow-lg">Furgocasa</span>
            </div>
          </div>

          {/* Panel inferior */}
          <div className="bg-[#0a1628] p-5">
            <p className="text-white/50 text-xs mb-4 font-medium text-center">
              Alquiler y venta de campers premium
            </p>

            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
                <span className="text-white/50 text-xs font-medium">Alquiler</span>
                <span className="text-[#ff6b35] font-bold text-sm">desde 95€/día</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
                <span className="text-white/50 text-xs font-medium">Venta</span>
                <span className="text-emerald-400 font-bold text-sm">desde 49.000€</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
                <span className="text-white/50 text-xs font-medium">Valoración</span>
                <span className="text-white font-bold text-sm">4.9★ Google</span>
              </div>
            </div>

            <div className="bg-[#ff6b35] text-white w-full py-3 rounded-xl font-bold text-sm text-center shadow-lg shadow-orange-500/20 group-hover:bg-[#e85a25] transition-colors">
              Reservar →
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
