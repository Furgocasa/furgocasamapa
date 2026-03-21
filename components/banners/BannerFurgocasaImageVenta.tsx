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
        className="block no-underline"
      >
        <div className="bg-[#2c5f2d] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="flex flex-col md:flex-row items-stretch h-auto md:h-[220px]">
            
            {/* Columna de imágenes - 40% del ancho */}
            <div className="w-full md:w-[40%] flex-shrink-0 grid grid-rows-2 md:grid-rows-1 md:grid-cols-2 gap-0.5 h-[300px] md:h-full">
              <div className="relative overflow-hidden group">
                <img 
                  src="/images/banners/camper-3.jpg"
                  alt="Camper en Venta Furgocasa"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-2 left-2 bg-[#4ade80]/90 backdrop-blur-sm text-[#1e4620] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  En Venta
                </div>
              </div>
              <div className="relative overflow-hidden group">
                <img 
                  src="/images/banners/camper-4.jpg"
                  alt="Camper Garantizada"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-2 left-2 bg-[#4ade80]/90 backdrop-blur-sm text-[#1e4620] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Garantía 1 Año
                </div>
              </div>
            </div>

            {/* Contenido - 60% del ancho */}
            <div className="flex-1 text-white p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                  <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                    <span className="text-lg">🏷️</span>
                    <span className="text-white font-bold text-[11px] tracking-widest uppercase">Venta de Campers</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">Desde</div>
                    <div className="text-[#4ade80] font-black text-2xl leading-none">49.000€</div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                  Hazte con tu Propia Camper
                </h3>
                
                <p className="text-white/80 text-sm mb-4 leading-relaxed max-w-xl">
                  Campers procedentes de nuestra flota de alquiler. Revisadas meticulosamente por nuestros mecánicos, con historial de mantenimiento y garantía de un año.
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs text-white/90 bg-white/5 px-2 py-1 rounded">✓ Historial Completo</span>
                  <span className="text-xs text-white/90 bg-white/5 px-2 py-1 rounded">✓ 1 Año Garantía</span>
                  <span className="text-xs text-white/90 bg-white/5 px-2 py-1 rounded">✓ Financiación 120m</span>
                  <span className="text-xs text-white/90 bg-white/5 px-2 py-1 rounded">✓ Transferencia Incluida</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-[#4ade80] text-[#1e4620] px-6 py-2.5 rounded-lg font-bold text-sm text-center hover:bg-[#22c55e] transition-colors">
                  Ver Campers en Venta →
                </div>
              </div>
            </div>

          </div>
        </div>
      </a>
    </div>
  )
}
