'use client'

interface BannerProps {
  position: string
}

export function BannerUltraWideModern({ position }: BannerProps) {
  const utmCampaign = `ultra_wide_modern_${position}_area_detail`

  return (
    <div className="w-full max-w-[1400px] mx-auto">
      <div className="relative bg-[#063971] rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        {/* Gradiente animado de fondo */}
        <div
          className="absolute top-0 left-0 right-0 bottom-0 animate-gradient"
          style={{
            background:
              'linear-gradient(135deg, #063971 0%, #052d5a 25%, #042143 50%, #052d5a 75%, #063971 100%)',
            backgroundSize: '400% 400%',
          }}
        />

        {/* Elementos decorativos flotantes */}
        <div className="absolute w-[100px] h-[100px] rounded-full bg-[#ffd935]/10 top-[20%] left-[10%] animate-float" />
        <div className="absolute w-[150px] h-[150px] rounded-full bg-[#ffd935]/10 top-[60%] right-[15%] animate-float-delayed" />
        <div className="absolute w-[80px] h-[80px] rounded-full bg-[#ffd935]/10 bottom-[20%] left-[50%] animate-float-slow" />

        <div className="relative z-10 p-12 md:p-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Sección Izquierda */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="text-7xl animate-pulse-slow">⭐</div>
              <div className="flex flex-col gap-2">
                <a
                  href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="text-6xl font-black text-[#ffd935] leading-none tracking-[-2px] no-underline hover:text-[#ffe566] transition-colors"
                >
                  Casi Cinco
                </a>
                <span className="inline-block bg-[#ffd935]/20 border-2 border-[#ffd935] px-3 py-1 rounded-2xl text-xs font-bold text-[#ffd935] uppercase tracking-widest">
                  Verificado por Google
                </span>
              </div>
            </div>

            <div className="text-xl text-white/95 leading-relaxed font-medium">
              Descubre los mejores restaurantes, bares y hoteles de España. Solo lugares con
              +4.7★ en Google Maps.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <a
                href={`https://www.casicinco.com/ruta?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="flex items-center gap-3 bg-white/6 backdrop-blur-sm border border-white/10 p-5 rounded-2xl transition-all hover:bg-[#ffd935]/10 hover:border-[#ffd935]/30 hover:translate-x-2 no-underline"
              >
                <div className="text-3xl">🛣️</div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-white mb-0.5">
                    Planificador de Rutas
                  </div>
                  <div className="text-xs text-white/70">Crea tu itinerario perfecto</div>
                </div>
              </a>

              <a
                href={`https://www.casicinco.com/mapa?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="flex items-center gap-3 bg-white/6 backdrop-blur-sm border border-white/10 p-5 rounded-2xl transition-all hover:bg-[#ffd935]/10 hover:border-[#ffd935]/30 hover:translate-x-2 no-underline"
              >
                <div className="text-3xl">🤖</div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-white mb-0.5">Chat IA</div>
                  <div className="text-xs text-white/70">Recomendaciones personalizadas</div>
                </div>
              </a>

              <a
                href={`https://www.casicinco.com/mapa?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="flex items-center gap-3 bg-white/6 backdrop-blur-sm border border-white/10 p-5 rounded-2xl transition-all hover:bg-[#ffd935]/10 hover:border-[#ffd935]/30 hover:translate-x-2 no-underline"
              >
                <div className="text-3xl">🗺️</div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-white mb-0.5">Mapa Interactivo</div>
                  <div className="text-xs text-white/70">Explora por ubicación</div>
                </div>
              </a>

              <a
                href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="flex items-center gap-3 bg-white/6 backdrop-blur-sm border border-white/10 p-5 rounded-2xl transition-all hover:bg-[#ffd935]/10 hover:border-[#ffd935]/30 hover:translate-x-2 no-underline"
              >
                <div className="text-3xl">⭐</div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-white mb-0.5">+3500 Lugares</div>
                  <div className="text-xs text-white/70">Solo +4.7★ verificados</div>
                </div>
              </a>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <a
                href={`https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="relative bg-gradient-to-br from-[#ffd935] to-[#ffe566] text-[#063971] px-14 py-6 rounded-2xl font-black text-2xl transition-all hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(255,217,53,0.7)] shadow-[0_8px_32px_rgba(255,217,53,0.5)] no-underline"
              >
                <span className="relative z-10">Explorar Ahora →</span>
              </a>
              <div className="text-sm text-white/80 flex items-center gap-2">
                <span>🔥</span>
                <span>
                  <span className="text-lg font-bold text-[#ffd935]">+3500</span> lugares
                  verificados
                </span>
              </div>
            </div>
          </div>

          {/* Sección Derecha - Showcase */}
          <div className="flex flex-col gap-4">
            <div className="text-[#ffd935] text-base font-bold uppercase tracking-widest mb-2">
              🌟 Lugares Destacados
            </div>
            <div className="grid grid-cols-2 gap-4">
              <a
                href={`https://www.casicinco.com/restaurante/madrid?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl p-5 transition-all hover:bg-white/14 hover:border-[#ffd935]/40 hover:-translate-y-1.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] no-underline"
              >
                <div className="text-4xl mb-3">🍽️</div>
                <div className="text-base font-bold text-white mb-1.5">DiverXO</div>
                <div className="text-xs text-white/60 mb-2">📍 Madrid</div>
                <div className="flex items-center gap-2">
                  <span className="text-[#ffd935] text-sm">★★★★★</span>
                  <span className="text-lg font-extrabold text-[#ffd935]">4.9</span>
                  <span className="text-[11px] text-white/50">(1.2k)</span>
                </div>
              </a>

              <a
                href={`https://www.casicinco.com/bar/barcelona?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl p-5 transition-all hover:bg-white/14 hover:border-[#ffd935]/40 hover:-translate-y-1.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] no-underline"
              >
                <div className="text-4xl mb-3">🍺</div>
                <div className="text-base font-bold text-white mb-1.5">Bobby's Free</div>
                <div className="text-xs text-white/60 mb-2">📍 Barcelona</div>
                <div className="flex items-center gap-2">
                  <span className="text-[#ffd935] text-sm">★★★★★</span>
                  <span className="text-lg font-extrabold text-[#ffd935]">4.8</span>
                  <span className="text-[11px] text-white/50">(856)</span>
                </div>
              </a>

              <a
                href={`https://www.casicinco.com/hotel/barcelona?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl p-5 transition-all hover:bg-white/14 hover:border-[#ffd935]/40 hover:-translate-y-1.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] no-underline"
              >
                <div className="text-4xl mb-3">🏨</div>
                <div className="text-base font-bold text-white mb-1.5">Hotel Arts</div>
                <div className="text-xs text-white/60 mb-2">📍 Barcelona</div>
                <div className="flex items-center gap-2">
                  <span className="text-[#ffd935] text-sm">★★★★★</span>
                  <span className="text-lg font-extrabold text-[#ffd935]">4.9</span>
                  <span className="text-[11px] text-white/50">(2.3k)</span>
                </div>
              </a>

              <a
                href={`https://www.casicinco.com/restaurante/valencia?utm_source=furgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl p-5 transition-all hover:bg-white/14 hover:border-[#ffd935]/40 hover:-translate-y-1.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] no-underline"
              >
                <div className="text-4xl mb-3">🍽️</div>
                <div className="text-base font-bold text-white mb-1.5">Quique Dacosta</div>
                <div className="text-xs text-white/60 mb-2">📍 Valencia</div>
                <div className="flex items-center gap-2">
                  <span className="text-[#ffd935] text-sm">★★★★★</span>
                  <span className="text-lg font-extrabold text-[#ffd935]">4.8</span>
                  <span className="text-[11px] text-white/50">(980)</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes gradient {
            0%,
            100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          .animate-gradient {
            animation: gradient 15s ease infinite;
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
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float 6s ease-in-out infinite 2s;
          }
          .animate-float-slow {
            animation: float 6s ease-in-out infinite 4s;
          }
          .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
          }
          @keyframes pulse-slow {
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
        `}</style>
      </div>
    </div>
  )
}
