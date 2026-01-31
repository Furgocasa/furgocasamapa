"use client";

interface BannerUltraWideBaresProps {
  position: string;
}

export function BannerUltraWideBares({ position }: BannerUltraWideBaresProps) {
  return (
    <div className="w-full max-w-[1400px] mx-auto rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative">
      {/* Gradiente animado de fondo - tonos vibrantes para bares */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background:
            "linear-gradient(135deg, #4a0e4e 0%, #063971 25%, #8b0a50 50%, #052d5a 75%, #063971 100%)",
          backgroundSize: "400% 400%",
        }}
      />

      {/* Elementos decorativos flotantes */}
      <div className="absolute w-[100px] h-[100px] top-[20%] left-[10%] rounded-full bg-[rgba(255,217,53,0.1)] animate-float" />
      <div className="absolute w-[150px] h-[150px] top-[60%] right-[15%] rounded-full bg-[rgba(255,217,53,0.1)] animate-float-delayed-2" />
      <div className="absolute w-[80px] h-[80px] bottom-[20%] left-[50%] rounded-full bg-[rgba(255,217,53,0.1)] animate-float-delayed-4" />

      <div className="relative z-10 p-6 md:p-12 lg:p-[50px_60px] grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-[60px] items-center">
        {/* Sección Izquierda */}
        <div className="flex flex-col gap-4 md:gap-6">
          <a
            href="https://www.casicinco.com/bar?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_bares"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="no-underline text-inherit"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div className="text-4xl md:text-5xl lg:text-6xl animate-rotate-pulse">
                🍺
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-[52px] font-black text-[#ffd935] m-0 leading-none tracking-[-1px] md:tracking-[-2px] drop-shadow-[3px_3px_12px_rgba(0,0,0,0.4)]">
                  Casi Cinco
                </h1>
                <span className="inline-block bg-[rgba(218,112,214,0.3)] border border-[#da70d6] md:border-2 px-2 md:px-3 py-0.5 md:py-1 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold text-[#ee82ee] uppercase mt-1 md:mt-2 tracking-wide md:tracking-wider">
                  🎉 Los Mejores Bares
                </span>
              </div>
            </div>
          </a>

          <div className="text-sm md:text-base lg:text-xl text-[rgba(255,255,255,0.95)] leading-relaxed font-medium">
            Descubre los{" "}
            <span className="text-[#ffd935] font-bold">
              mejores bares de España
            </span>
            . Ambiente único y calidad excepcional verificada con +4.7★ en
            Google Maps.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://www.casicinco.com/bar?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_bares"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-4 rounded-2xl flex items-center gap-3 transition-all duration-300 hover:bg-[rgba(218,112,214,0.15)] hover:border-[rgba(218,112,214,0.4)] hover:translate-x-2 no-underline text-inherit"
            >
              <div className="text-[28px] flex-shrink-0">⭐</div>
              <div className="flex-1">
                <div className="text-[15px] font-bold text-white mb-0.5">
                  +700 Bares
                </div>
                <div className="text-xs text-[rgba(255,255,255,0.7)]">
                  Solo +4.7 estrellas
                </div>
              </div>
            </a>
            <a
              href="https://www.casicinco.com/bar?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_bares"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-4 rounded-2xl flex items-center gap-3 transition-all duration-300 hover:bg-[rgba(218,112,214,0.15)] hover:border-[rgba(218,112,214,0.4)] hover:translate-x-2 no-underline text-inherit"
            >
              <div className="text-[28px] flex-shrink-0">🍸</div>
              <div className="flex-1">
                <div className="text-[15px] font-bold text-white mb-0.5">
                  Todos los Estilos
                </div>
                <div className="text-xs text-[rgba(255,255,255,0.7)]">
                  Cócteles, Tapas, Cervecerías...
                </div>
              </div>
            </a>
            <a
              href="https://www.casicinco.com/mapa?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_bares"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-4 rounded-2xl flex items-center gap-3 transition-all duration-300 hover:bg-[rgba(218,112,214,0.15)] hover:border-[rgba(218,112,214,0.4)] hover:translate-x-2 no-underline text-inherit"
            >
              <div className="text-[28px] flex-shrink-0">🗺️</div>
              <div className="flex-1">
                <div className="text-[15px] font-bold text-white mb-0.5">
                  Búsqueda por Zona
                </div>
                <div className="text-xs text-[rgba(255,255,255,0.7)]">
                  Encuentra cerca de ti
                </div>
              </div>
            </a>
            <a
              href="https://www.casicinco.com/ruta?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_bares"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] p-4 rounded-2xl flex items-center gap-3 transition-all duration-300 hover:bg-[rgba(218,112,214,0.15)] hover:border-[rgba(218,112,214,0.4)] hover:translate-x-2 no-underline text-inherit"
            >
              <div className="text-[28px] flex-shrink-0">🛣️</div>
              <div className="flex-1">
                <div className="text-[15px] font-bold text-white mb-0.5">
                  Ruta de Bares
                </div>
                <div className="text-xs text-[rgba(255,255,255,0.7)]">
                  Planifica tu tour de copas
                </div>
              </div>
            </a>
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <a
              href="https://www.casicinco.com/bar?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_bares"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="inline-block bg-gradient-to-br from-[#ffd935] to-[#ffe566] text-[#063971] px-12 py-5 rounded-2xl font-black text-xl no-underline transition-all duration-[0.4s] shadow-[0_8px_32px_rgba(255,217,53,0.5)] relative overflow-hidden hover:translate-y-[-4px] hover:shadow-[0_12px_48px_rgba(255,217,53,0.7)] group"
            >
              <span className="relative z-[1]">Ver Bares →</span>
              <span className="absolute top-1/2 left-1/2 w-0 h-0 rounded-full bg-[rgba(255,255,255,0.3)] -translate-x-1/2 -translate-y-1/2 transition-all duration-[0.6s] group-hover:w-[400px] group-hover:h-[400px]" />
            </a>
            <div className="text-sm text-[rgba(255,255,255,0.8)] flex items-center gap-1.5">
              <span>🍻</span>
              <span>
                <span className="text-lg font-bold text-[#ffd935]">+700</span>{" "}
                bares de ambiente
              </span>
            </div>
          </div>
        </div>

        {/* Sección Derecha - Showcase */}
        <div className="flex flex-col gap-4">
          <div className="text-base text-[#ffd935] font-bold uppercase tracking-wide mb-2 text-center">
            🌟 Bares Destacados
          </div>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="https://www.casicinco.com/bar/barcelona?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_bares"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.12)] rounded-[20px] p-5 transition-all duration-300 hover:bg-[rgba(255,255,255,0.14)] hover:border-[rgba(255,217,53,0.4)] hover:translate-y-[-6px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] no-underline text-inherit block animate-fadeInUp"
            >
              <div className="text-[36px] mb-3">🍸</div>
              <div className="text-base font-bold text-white mb-1.5">
                Bobby's Free
              </div>
              <div className="text-xs text-[rgba(255,255,255,0.6)] mb-2">
                📍 Barcelona
              </div>
              <div className="inline-block bg-[rgba(218,112,214,0.2)] border border-[rgba(218,112,214,0.4)] px-2.5 py-1 rounded-xl text-[10px] text-[#ee82ee] font-semibold mb-2">
                Cóctelería
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ffd935] text-sm">★★★★★</span>
                <span className="text-lg font-extrabold text-[#ffd935]">
                  4.8
                </span>
                <span className="text-[11px] text-[rgba(255,255,255,0.5)]">
                  (856)
                </span>
              </div>
            </a>

            <a
              href="https://www.casicinco.com/bar/madrid?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_bares"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.12)] rounded-[20px] p-5 transition-all duration-300 hover:bg-[rgba(255,255,255,0.14)] hover:border-[rgba(255,217,53,0.4)] hover:translate-y-[-6px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] no-underline text-inherit block animate-fadeInUp"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="text-[36px] mb-3">🍹</div>
              <div className="text-base font-bold text-white mb-1.5">
                Salmon Guru
              </div>
              <div className="text-xs text-[rgba(255,255,255,0.6)] mb-2">
                📍 Madrid
              </div>
              <div className="inline-block bg-[rgba(218,112,214,0.2)] border border-[rgba(218,112,214,0.4)] px-2.5 py-1 rounded-xl text-[10px] text-[#ee82ee] font-semibold mb-2">
                Bar de Copas
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ffd935] text-sm">★★★★★</span>
                <span className="text-lg font-extrabold text-[#ffd935]">
                  4.7
                </span>
                <span className="text-[11px] text-[rgba(255,255,255,0.5)]">
                  (1.5k)
                </span>
              </div>
            </a>

            <a
              href="https://www.casicinco.com/bar/sevilla?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_bares"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.12)] rounded-[20px] p-5 transition-all duration-300 hover:bg-[rgba(255,255,255,0.14)] hover:border-[rgba(255,217,53,0.4)] hover:translate-y-[-6px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] no-underline text-inherit block animate-fadeInUp"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="text-[36px] mb-3">🍺</div>
              <div className="text-base font-bold text-white mb-1.5">
                La Rebotica
              </div>
              <div className="text-xs text-[rgba(255,255,255,0.6)] mb-2">
                📍 Sevilla
              </div>
              <div className="inline-block bg-[rgba(218,112,214,0.2)] border border-[rgba(218,112,214,0.4)] px-2.5 py-1 rounded-xl text-[10px] text-[#ee82ee] font-semibold mb-2">
                Tapas & Vinos
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ffd935] text-sm">★★★★★</span>
                <span className="text-lg font-extrabold text-[#ffd935]">
                  4.9
                </span>
                <span className="text-[11px] text-[rgba(255,255,255,0.5)]">
                  (723)
                </span>
              </div>
            </a>

            <a
              href="https://www.casicinco.com/bar/valencia?utm_source=furgocasa&utm_medium=banner&utm_campaign=ultra_wide_bares"
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.12)] rounded-[20px] p-5 transition-all duration-300 hover:bg-[rgba(255,255,255,0.14)] hover:border-[rgba(255,217,53,0.4)] hover:translate-y-[-6px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] no-underline text-inherit block animate-fadeInUp"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="text-[36px] mb-3">🥃</div>
              <div className="text-base font-bold text-white mb-1.5">
                Café de las Horas
              </div>
              <div className="text-xs text-[rgba(255,255,255,0.6)] mb-2">
                📍 Valencia
              </div>
              <div className="inline-block bg-[rgba(218,112,214,0.2)] border border-[rgba(218,112,214,0.4)] px-2.5 py-1 rounded-xl text-[10px] text-[#ee82ee] font-semibold mb-2">
                Bar Histórico
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ffd935] text-sm">★★★★★</span>
                <span className="text-lg font-extrabold text-[#ffd935]">
                  4.7
                </span>
                <span className="text-[11px] text-[rgba(255,255,255,0.5)]">
                  (980)
                </span>
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
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.1);
          }
        }
        @keyframes rotate-pulse {
          0%,
          100% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(-15deg) scale(1.1);
          }
          75% {
            transform: rotate(15deg) scale(1.1);
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
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed-2 {
          animation: float 6s ease-in-out infinite 2s;
        }
        .animate-float-delayed-4 {
          animation: float 6s ease-in-out infinite 4s;
        }
        .animate-rotate-pulse {
          animation: rotate-pulse 4s ease-in-out infinite;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease backwards;
        }
      `}</style>
    </div>
  );
}
