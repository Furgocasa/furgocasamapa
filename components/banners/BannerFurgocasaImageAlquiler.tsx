'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaImageAlquiler({ position }: BannerProps) {
  const utmCampaign = `furgocasa_img_alquiler_${position}_area_detail`

  return (
    <div className="w-full max-w-[1400px] mx-auto my-8">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline group"
      >
        <div className="relative rounded-2xl overflow-hidden h-[280px] md:h-[320px]">
          {/* Foto full-bleed */}
          <img
            src="/images/banners/camper-1.jpg"
            alt="Camper Furgocasa en ruta"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out"
          />

          {/* Overlay cinematográfico */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-slate-950/20" />

          {/* Contenido sobre la foto */}
          <div className="relative z-10 h-full flex flex-col justify-between p-6 md:p-10">
            {/* Cabecera */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-sm">🚐</div>
                <span className="text-white/90 font-semibold text-sm tracking-wide">Furgocasa</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-4 py-1.5">
                <span className="text-white font-bold text-sm">desde <span className="text-[#ff6b35]">95€</span>/día</span>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="max-w-lg">
              <h3 className="text-white text-3xl md:text-4xl font-black tracking-tight leading-[1.1] mb-3">
                Tu hotel<br/>sobre ruedas
              </h3>
              <p className="text-white/70 text-sm md:text-base leading-relaxed mb-5 max-w-md">
                Campers de gran volumen totalmente equipadas. Kilómetros ilimitados y seguro a todo riesgo incluido.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-[#ff6b35] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 group-hover:bg-[#e85a25] transition-all">
                  Ver disponibilidad →
                </div>
                <div className="hidden md:flex items-center gap-4 text-white/50 text-xs font-medium">
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#ff6b35]"></span>KM Ilimitados</span>
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#ff6b35]"></span>4.9★ Google</span>
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#ff6b35]"></span>14+ años</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
