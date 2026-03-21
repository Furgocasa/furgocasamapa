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
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] border border-gray-100 transition-all hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1">
          <div className="flex flex-col md:flex-row-reverse items-stretch">
            
            {/* Foto limpia a un lado */}
            <div className="w-full md:w-[45%] lg:w-[40%] relative overflow-hidden h-[200px] md:h-auto">
              <img
                src="/images/banners/camper-3.jpg"
                alt="Camper en venta Furgocasa"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                En Venta
              </div>
            </div>

            {/* Contenido sobre fondo blanco */}
            <div className="flex-1 p-6 md:p-8 lg:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🏷️</span>
                <span className="text-[#0b3c74] font-bold text-sm tracking-wide">Furgocasa</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 text-sm font-medium">Venta de Campers de Gran Volumen</span>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
                Hazte con tu propia camper
              </h3>
              
              <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-6 max-w-xl">
                Procedentes de nuestra flota. Revisión mecánica completa, historial de mantenimiento y garantía de un año para tu tranquilidad.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Precio desde</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#0b3c74] leading-none">49.000€</span>
                  </div>
                </div>
                
                <div className="bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-md group-hover:bg-emerald-600 transition-colors whitespace-nowrap">
                  Ver modelos →
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100 text-slate-500 text-xs font-medium">
                <span className="flex items-center gap-1.5"><span className="text-[#4ade80]">✓</span> Garantía 1 año</span>
                <span className="flex items-center gap-1.5"><span className="text-[#4ade80]">✓</span> Historial completo</span>
                <span className="flex items-center gap-1.5"><span className="text-[#4ade80]">✓</span> Financiación 120m</span>
              </div>
            </div>

          </div>
        </div>
      </a>
    </div>
  )
}
