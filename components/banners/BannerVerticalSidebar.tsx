'use client'

interface BannerVerticalSidebarProps {
  position: string
}

export function BannerVerticalSidebar({ position }: BannerVerticalSidebarProps) {
  return (
    <div className="w-full max-w-[300px] mx-auto my-8">
      <div className="bg-gradient-to-b from-[#063971] to-[#042143] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-transform duration-300 hover:scale-[1.02]">
        <a
          href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=vertical_sidebar"
          target="_blank"
          rel="noopener noreferrer sponsored nofollow"
          className="block no-underline text-white"
        >
          <div className="bg-[#ffd935] p-6 text-center">
            <div className="text-[32px] font-black text-[#063971] mb-2">⭐ Casi Cinco</div>
            <div className="text-[13px] text-[#063971] font-semibold uppercase tracking-[0.5px]">
              Los Mejores de España
            </div>
          </div>
        </a>

        <div className="p-[30px_24px]">
          <a
            href="https://www.casicinco.com/restaurante?utm_source=furgocasa&utm_medium=banner&utm_campaign=vertical_sidebar"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-start gap-3 mb-5 no-underline text-white"
          >
            <div className="text-2xl flex-shrink-0">🍽️</div>
            <div className="flex-1">
              <div className="text-[15px] font-bold mb-1 text-[#ffd935]">Restaurantes</div>
              <div className="text-[13px] text-[rgba(255,255,255,0.85)] leading-[1.4]">
                Gastronomía de +4.7★
              </div>
            </div>
          </a>

          <a
            href="https://www.casicinco.com/bar?utm_source=furgocasa&utm_medium=banner&utm_campaign=vertical_sidebar"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-start gap-3 mb-5 no-underline text-white"
          >
            <div className="text-2xl flex-shrink-0">🍺</div>
            <div className="flex-1">
              <div className="text-[15px] font-bold mb-1 text-[#ffd935]">Bares</div>
              <div className="text-[13px] text-[rgba(255,255,255,0.85)] leading-[1.4]">
                Ambiente y calidad
              </div>
            </div>
          </a>

          <a
            href="https://www.casicinco.com/hotel?utm_source=furgocasa&utm_medium=banner&utm_campaign=vertical_sidebar"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-start gap-3 mb-5 no-underline text-white"
          >
            <div className="text-2xl flex-shrink-0">🏨</div>
            <div className="flex-1">
              <div className="text-[15px] font-bold mb-1 text-[#ffd935]">Hoteles</div>
              <div className="text-[13px] text-[rgba(255,255,255,0.85)] leading-[1.4]">
                Alojamiento premium
              </div>
            </div>
          </a>

          <a
            href="https://www.casicinco.com/ruta?utm_source=furgocasa&utm_medium=banner&utm_campaign=vertical_sidebar"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-start gap-3 mb-0 no-underline text-white"
          >
            <div className="text-2xl flex-shrink-0">🛣️</div>
            <div className="flex-1">
              <div className="text-[15px] font-bold mb-1 text-[#ffd935]">Planificador Rutas</div>
              <div className="text-[13px] text-[rgba(255,255,255,0.85)] leading-[1.4]">
                Crea tu itinerario
              </div>
            </div>
          </a>
        </div>

        <div className="px-6 pb-8">
          <a
            href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=vertical_sidebar"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="block bg-[#ffd935] text-[#063971] p-4 rounded-[10px] font-extrabold text-base text-center transition-all duration-300 no-underline hover:bg-[#ffe566] hover:shadow-[0_4px_16px_rgba(255,217,53,0.4)]"
          >
            Explorar Lugares →
          </a>
          <div className="text-center mt-4 text-xs text-[rgba(255,255,255,0.7)]">
            <span className="text-xl font-extrabold text-[#ffd935] block mb-1">+3500</span>
            Lugares verificados
          </div>
        </div>
      </div>
    </div>
  )
}
