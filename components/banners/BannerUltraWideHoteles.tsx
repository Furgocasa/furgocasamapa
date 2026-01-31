'use client'

interface BannerUltraWideHotelesProps {
  position: string
}

export function BannerUltraWideHoteles({ position }: BannerUltraWideHotelesProps) {
  return (
    <div className="w-full max-w-[1400px] mx-auto rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative">
      {/* Gradiente animado de fondo - tonos elegantes para hoteles */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #063971 25%, #16213e 50%, #0f3460 75%, #063971 100%)',
          backgroundSize: '400% 400%',
        }}
      />

      {/* Elementos decorativos flotantes - estrellas doradas */}
      <div className="absolute w-[120px] h-[120px] top-[15%] left-[8%] rounded-full animate-float-glow" style={{ background: 'radial-gradient(circle, rgba(255, 217, 53, 0.2) 0%, transparent 70%)' }} />
      <div className="absolute w-[180px] h-[180px] top-[65%] right-[12%] rounded-full animate-float-glow-delayed-2" style={{ background: 'radial-gradient(circle, rgba(255, 217, 53, 0.2) 0%, transparent 70%)' }} />
      <div className="absolute w-[90px] h-[90px] bottom-[15%] left-[55%] rounded-full animate-float-glow-delayed-4" style={{ background: 'radial-gradient(circle, rgba(255, 217, 53, 0.2) 0%, transparent 70%)' }} />

      <div className="relative z-10 p-6 md:p-12 lg:p-[50px_60px] grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-[60px] items-center">
        {/* Sección Izquierda */}
        <div className="flex flex-col gap-6">
          <a
            href="https://www.casicinco.com/hotel?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_hoteles"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="no-underline text-inherit"
          >
            <div className="flex items-center gap-4">
              <div className="text-6xl animate-glow-pulse">🏨</div>
              <div>
                <h1 className="text-[52px] font-black text-[#ffd935] m-0 leading-none tracking-[-2px] drop-shadow-[3px_3px_12px_rgba(0,0,0,0.4)]">
                  Casi Cinco
                </h1>
                <span className="inline-block bg-[rgba(218,165,32,0.3)] border-2 border-[#daa520] px-3 py-1 rounded-2xl text-xs font-bold text-[#ffd700] uppercase mt-2 tracking-wider">
                  ✨ Hoteles Premium
                </span>
              </div>
            </div>
          </a>

          <div className="text-xl text-[rgba(255,255,255,0.95)] leading-relaxed font-medium">
            Descubre los <span className="text-[#ffd935] font-bold">mejores hoteles de España</span>. Alojamiento
            excepcional verificado con +4.7★ en Google Maps.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://www.casicinco.com/hotel?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_hoteles"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-4 rounded-2xl flex items-center gap-3 transition-all duration-300 hover:bg-[rgba(218,165,32,0.15)] hover:border-[rgba(218,165,32,0.4)] hover:translate-x-2 no-underline text-inherit"
            >
              <div className="text-[28px] flex-shrink-0">⭐</div>
              <div className="flex-1">
                <div className="text-[15px] font-bold text-white mb-0.5">+800 Hoteles</div>
                <div className="text-xs text-[rgba(255,255,255,0.7)]">Solo +4.7 estrellas</div>
              </div>
            </a>
            <a
              href="https://www.casicinco.com/hotel?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_hoteles"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-4 rounded-2xl flex items-center gap-3 transition-all duration-300 hover:bg-[rgba(218,165,32,0.15)] hover:border-[rgba(218,165,32,0.4)] hover:translate-x-2 no-underline text-inherit"
            >
              <div className="text-[28px] flex-shrink-0">💎</div>
              <div className="flex-1">
                <div className="text-[15px] font-bold text-white mb-0.5">Boutique & Lujo</div>
                <div className="text-xs text-[rgba(255,255,255,0.7)]">Experiencias únicas</div>
              </div>
            </a>
            <a
              href="https://www.casicinco.com/mapa?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_hoteles"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-4 rounded-2xl flex items-center gap-3 transition-all duration-300 hover:bg-[rgba(218,165,32,0.15)] hover:border-[rgba(218,165,32,0.4)] hover:translate-x-2 no-underline text-inherit"
            >
              <div className="text-[28px] flex-shrink-0">🗺️</div>
              <div className="flex-1">
                <div className="text-[15px] font-bold text-white mb-0.5">Todas las Ciudades</div>
                <div className="text-xs text-[rgba(255,255,255,0.7)]">Madrid, Barcelona, Valencia...</div>
              </div>
            </a>
            <a
              href="https://www.casicinco.com/ruta?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_hoteles"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-4 rounded-2xl flex items-center gap-3 transition-all duration-300 hover:bg-[rgba(218,165,32,0.15)] hover:border-[rgba(218,165,32,0.4)] hover:translate-x-2 no-underline text-inherit"
            >
              <div className="text-[28px] flex-shrink-0">🛣️</div>
              <div className="flex-1">
                <div className="text-[15px] font-bold text-white mb-0.5">Planifica tu Viaje</div>
                <div className="text-xs text-[rgba(255,255,255,0.7)]">Ruta + alojamiento perfecto</div>
              </div>
            </a>
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <a
              href="https://www.casicinco.com/hotel?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_hoteles"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="inline-block bg-gradient-to-br from-[#ffd935] to-[#daa520] text-[#1a1a2e] px-12 py-5 rounded-2xl font-black text-xl no-underline transition-all duration-[0.4s] shadow-[0_8px_32px_rgba(218,165,32,0.5)] relative overflow-hidden hover:translate-y-[-4px] hover:shadow-[0_12px_48px_rgba(218,165,32,0.7)] group"
            >
              <span className="relative z-[1]">Ver Hoteles →</span>
              <span className="absolute top-1/2 left-1/2 w-0 h-0 rounded-full bg-[rgba(255,255,255,0.3)] -translate-x-1/2 -translate-y-1/2 transition-all duration-[0.6s] group-hover:w-[400px] group-hover:h-[400px]" />
            </a>
            <div className="text-sm text-[rgba(255,255,255,0.8)] flex items-center gap-1.5">
              <span>✨</span>
              <span>
                <span className="text-lg font-bold text-[#ffd935]">+800</span> hoteles premium
              </span>
            </div>
          </div>
        </div>

        {/* Sección Derecha - Showcase */}
        <div className="flex flex-col gap-4">
          <div className="text-base text-[#ffd935] font-bold uppercase tracking-wide mb-2 text-center">
            🌟 Hoteles Destacados
          </div>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="https://www.casicinco.com/hotel/barcelona?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_hoteles"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.12)] rounded-[20px] p-5 transition-all duration-300 hover:bg-[rgba(255,255,255,0.14)] hover:border-[rgba(218,165,32,0.5)] hover:translate-y-[-6px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] no-underline text-inherit block animate-fadeInUp"
            >
              <div className="text-4xl mb-3">🏨</div>
              <div className="text-base font-bold text-white mb-1.5">Hotel Arts Barcelona</div>
              <div className="text-xs text-[rgba(255,255,255,0.6)] mb-2">📍 Barcelona</div>
              <div className="inline-block bg-[rgba(218,165,32,0.2)] border border-[rgba(218,165,32,0.4)] px-2.5 py-1 rounded-xl text-[10px] text-[#ffd700] font-semibold mb-2">
                5 Estrellas ⭐⭐⭐⭐⭐
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ffd935] text-sm">★★★★★</span>
                <span className="text-lg font-extrabold text-[#ffd935]">4.9</span>
                <span className="text-[11px] text-[rgba(255,255,255,0.5)]">(2.3k)</span>
              </div>
            </a>

            <a
              href="https://www.casicinco.com/hotel/madrid?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_hoteles"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.12)] rounded-[20px] p-5 transition-all duration-300 hover:bg-[rgba(255,255,255,0.14)] hover:border-[rgba(218,165,32,0.5)] hover:translate-y-[-6px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] no-underline text-inherit block animate-fadeInUp"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="text-4xl mb-3">💎</div>
              <div className="text-base font-bold text-white mb-1.5">Gran Hotel Inglés</div>
              <div className="text-xs text-[rgba(255,255,255,0.6)] mb-2">📍 Madrid</div>
              <div className="inline-block bg-[rgba(218,165,32,0.2)] border border-[rgba(218,165,32,0.4)] px-2.5 py-1 rounded-xl text-[10px] text-[#ffd700] font-semibold mb-2">
                5 Estrellas ⭐⭐⭐⭐⭐
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ffd935] text-sm">★★★★★</span>
                <span className="text-lg font-extrabold text-[#ffd935]">4.8</span>
                <span className="text-[11px] text-[rgba(255,255,255,0.5)]">(892)</span>
              </div>
            </a>

            <a
              href="https://www.casicinco.com/hotel/sevilla?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_hoteles"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.12)] rounded-[20px] p-5 transition-all duration-300 hover:bg-[rgba(255,255,255,0.14)] hover:border-[rgba(218,165,32,0.5)] hover:translate-y-[-6px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] no-underline text-inherit block animate-fadeInUp"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="text-4xl mb-3">🏰</div>
              <div className="text-base font-bold text-white mb-1.5">Hotel Alfonso XIII</div>
              <div className="text-xs text-[rgba(255,255,255,0.6)] mb-2">📍 Sevilla</div>
              <div className="inline-block bg-[rgba(218,165,32,0.2)] border border-[rgba(218,165,32,0.4)] px-2.5 py-1 rounded-xl text-[10px] text-[#ffd700] font-semibold mb-2">
                5 Estrellas ⭐⭐⭐⭐⭐
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ffd935] text-sm">★★★★★</span>
                <span className="text-lg font-extrabold text-[#ffd935]">4.7</span>
                <span className="text-[11px] text-[rgba(255,255,255,0.5)]">(1.8k)</span>
              </div>
            </a>

            <a
              href="https://www.casicinco.com/hotel/valencia?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_hoteles"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.12)] rounded-[20px] p-5 transition-all duration-300 hover:bg-[rgba(255,255,255,0.14)] hover:border-[rgba(218,165,32,0.5)] hover:translate-y-[-6px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] no-underline text-inherit block animate-fadeInUp"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="text-4xl mb-3">🌟</div>
              <div className="text-base font-bold text-white mb-1.5">Las Arenas Balneario</div>
              <div className="text-xs text-[rgba(255,255,255,0.6)] mb-2">📍 Valencia</div>
              <div className="inline-block bg-[rgba(218,165,32,0.2)] border border-[rgba(218,165,32,0.4)] px-2.5 py-1 rounded-xl text-[10px] text-[#ffd700] font-semibold mb-2">
                5 Estrellas ⭐⭐⭐⭐⭐
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ffd935] text-sm">★★★★★</span>
                <span className="text-lg font-extrabold text-[#ffd935]">4.8</span>
                <span className="text-[11px] text-[rgba(255,255,255,0.5)]">(1.4k)</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes float-glow {
          0%,
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-30px) scale(1.15);
            opacity: 1;
          }
        }
        @keyframes glow-pulse {
          0%,
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 10px rgba(255, 217, 53, 0.5));
          }
          50% {
            transform: scale(1.08);
            filter: drop-shadow(0 0 25px rgba(255, 217, 53, 0.8));
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-gradient-shift {
          animation: gradient-shift 15s ease infinite;
        }
        .animate-float-glow {
          animation: float-glow 6s ease-in-out infinite;
        }
        .animate-float-glow-delayed-2 {
          animation: float-glow 6s ease-in-out infinite 2s;
        }
        .animate-float-glow-delayed-4 {
          animation: float-glow 6s ease-in-out infinite 4s;
        }
        .animate-glow-pulse {
          animation: glow-pulse 3s ease-in-out infinite;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease backwards;
        }
      `}</style>
    </div>
  )
}
