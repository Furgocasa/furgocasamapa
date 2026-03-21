'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaImageVenta({ position }: BannerProps) {
  const utmCampaign = `furgocasa_img_venta_${position}_area_detail`

  return (
    <div className="w-full max-w-[1400px] mx-auto my-8">
      <a
        href={`https://www.furgocasa.com/es/ventas?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline group"
      >
        <div className="relative rounded-2xl overflow-hidden h-[280px] md:h-[320px]">
          {/* Foto full-bleed */}
          <img
            src="/images/banners/camper-3.jpg"
            alt="Camper en venta Furgocasa"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out"
          />

          {/* Overlay con tono verde oscuro */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/85 via-emerald-950/50 to-emerald-950/15" />

          {/* Contenido sobre la foto */}
          <div className="relative z-10 h-full flex flex-col justify-between p-6 md:p-10">
            {/* Cabecera */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-sm">🏷️</div>
                <span className="text-white/90 font-semibold text-sm tracking-wide">Furgocasa · Venta de Campers de Gran Volumen</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-4 py-1.5">
                <span className="text-white font-bold text-sm">desde <span className="text-emerald-400">49.000€</span></span>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="max-w-lg">
              <h3 className="text-white text-3xl md:text-4xl font-black tracking-tight leading-[1.1] mb-3">
                Hazte con<br/>tu propia camper
              </h3>
              <p className="text-white/70 text-sm md:text-base leading-relaxed mb-5 max-w-md">
                Procedentes de nuestra flota de alquiler. Revisión mecánica completa, historial de mantenimiento y garantía de un año.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 group-hover:bg-emerald-600 transition-all">
                  Ver campers en venta →
                </div>
                <div className="hidden md:flex items-center gap-4 text-white/50 text-xs font-medium">
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400"></span>Garantía 1 año</span>
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400"></span>Financiación 120m</span>
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400"></span>Historial completo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
