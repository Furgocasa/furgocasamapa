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
        <div className="relative rounded-2xl overflow-hidden">
          {/* Foto full-bleed */}
          <div className="relative h-[240px] overflow-hidden">
            <img
              src="/images/banners/camper-8.jpg"
              alt="Camper Premium Furgocasa"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/30 to-transparent" />

            {/* Logo sobre la imagen */}
            <div className="absolute bottom-4 left-6 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-sm">🚐</div>
              <span className="text-white font-black text-2xl tracking-tight">Furgocasa</span>
            </div>
          </div>

          {/* Panel inferior */}
          <div className="bg-[#0a1628] p-6 md:p-8">
            <p className="text-white/60 text-sm mb-5 text-center font-medium">
              Alquiler y venta de campers de gran volumen · Tu hotel sobre ruedas
            </p>

            {/* Stats en fila */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="text-center">
                <div className="text-[#ff6b35] font-black text-xl leading-none mb-1">95€</div>
                <div className="text-white/40 text-[10px] uppercase tracking-wider font-bold">por día</div>
              </div>
              <div className="text-center border-x border-white/5">
                <div className="text-emerald-400 font-black text-xl leading-none mb-1">49k€</div>
                <div className="text-white/40 text-[10px] uppercase tracking-wider font-bold">venta</div>
              </div>
              <div className="text-center border-r border-white/5">
                <div className="text-[#ff6b35] font-black text-xl leading-none mb-1">4.9★</div>
                <div className="text-white/40 text-[10px] uppercase tracking-wider font-bold">google</div>
              </div>
              <div className="text-center">
                <div className="text-white font-black text-xl leading-none mb-1">14+</div>
                <div className="text-white/40 text-[10px] uppercase tracking-wider font-bold">años</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="bg-[#ff6b35] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 group-hover:bg-[#e85a25] transition-all">
                Ver campers disponibles →
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
