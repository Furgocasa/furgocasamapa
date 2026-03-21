'use client'

interface BannerVerticalSidebarProps {
  position: string
}

export function BannerVerticalSidebar({ position }: BannerVerticalSidebarProps) {
  return (
    <div className="w-full max-w-[300px] mx-auto my-8">
      <div className="bg-[#0b3c74] rounded-2xl overflow-hidden shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
        <a
          href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=vertical_sidebar"
          target="_blank"
          rel="noopener noreferrer sponsored nofollow"
          className="block no-underline text-white relative"
        >
          <div className="bg-[#ffd935] p-5 text-center">
            <div className="text-2xl font-black text-[#0b3c74] mb-1 tracking-tight">⭐ Casi Cinco</div>
            <div className="text-[11px] text-[#0b3c74]/80 font-bold uppercase tracking-wider">
              Los Mejores de España
            </div>
          </div>
        </a>

        <div className="p-6">
          <a
            href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=vertical_sidebar"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-center gap-3 mb-4 no-underline text-white group"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl group-hover:bg-white/10 transition-colors">🍽️</div>
            <div className="flex-1">
              <div className="text-sm font-bold mb-0.5 text-white group-hover:text-[#ffd935] transition-colors">Restaurantes</div>
              <div className="text-[11px] text-white/60 uppercase tracking-wider font-medium">
                Gastronomía de +4.7★
              </div>
            </div>
          </a>

          <a
            href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=vertical_sidebar"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-center gap-3 mb-4 no-underline text-white group"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl group-hover:bg-white/10 transition-colors">🍺</div>
            <div className="flex-1">
              <div className="text-sm font-bold mb-0.5 text-white group-hover:text-[#ffd935] transition-colors">Bares</div>
              <div className="text-[11px] text-white/60 uppercase tracking-wider font-medium">
                Ambiente y calidad
              </div>
            </div>
          </a>

          <a
            href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=vertical_sidebar"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-center gap-3 mb-4 no-underline text-white group"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl group-hover:bg-white/10 transition-colors">🏨</div>
            <div className="flex-1">
              <div className="text-sm font-bold mb-0.5 text-white group-hover:text-[#ffd935] transition-colors">Hoteles</div>
              <div className="text-[11px] text-white/60 uppercase tracking-wider font-medium">
                Alojamiento premium
              </div>
            </div>
          </a>

          <a
            href="https://www.casicinco.com/ruta?utm_source=furgocasa&utm_medium=banner&utm_campaign=vertical_sidebar"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-center gap-3 mb-0 no-underline text-white group"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl group-hover:bg-white/10 transition-colors">🛣️</div>
            <div className="flex-1">
              <div className="text-sm font-bold mb-0.5 text-white group-hover:text-[#ffd935] transition-colors">Planificador Rutas</div>
              <div className="text-[11px] text-white/60 uppercase tracking-wider font-medium">
                Crea tu itinerario
              </div>
            </div>
          </a>
        </div>

        <div className="px-5 pb-6">
          <a
            href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=vertical_sidebar"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="block bg-[#ffd935] text-[#0b3c74] p-3.5 rounded-xl font-bold text-sm text-center transition-all duration-300 no-underline hover:bg-[#ffe566] shadow-sm hover:shadow-md"
          >
            Explorar Lugares →
          </a>
          <div className="text-center mt-4 text-[10px] text-white/60 uppercase tracking-wider font-bold">
            <span className="text-lg font-black text-[#ffd935] block mb-0.5 leading-none">+3500</span>
            Lugares verificados
          </div>
        </div>
      </div>
    </div>
  )
}
