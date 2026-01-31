'use client'

interface BannerMegaWideSliderProps {
  position: string
}

export function BannerMegaWideSlider({ position }: BannerMegaWideSliderProps) {
  return (
    <div className="w-full max-w-[1400px] mx-auto my-8">
      <div className="bg-gradient-to-br from-[#063971] to-[#052d5a] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 217, 53, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255, 217, 53, 0.08) 0%, transparent 50%)'
        }} />

        <div className="relative z-[1] p-[40px_50px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-col lg:flex-row gap-6">
            <div className="flex items-center gap-5">
              <div className="text-[56px] animate-glow-mega">⭐</div>
              <div>
                <h1 className="text-5xl font-black text-[#ffd935] m-0 leading-none tracking-[-2px] drop-shadow-[2px_2px_8px_rgba(0,0,0,0.3)]">
                  Casi Cinco
                </h1>
                <div className="text-sm text-[rgba(255,255,255,0.8)] mt-1.5">
                  La mejor selección gastronómica y de ocio de España
                </div>
              </div>
            </div>

            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-4xl font-black text-[#ffd935] leading-none mb-1">+3500</div>
                <div className="text-xs text-[rgba(255,255,255,0.7)] uppercase">Lugares</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-[#ffd935] leading-none mb-1">4.7★</div>
                <div className="text-xs text-[rgba(255,255,255,0.7)] uppercase">Mínimo</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-[#ffd935] leading-none mb-1">50+</div>
                <div className="text-xs text-[rgba(255,255,255,0.7)] uppercase">Ciudades</div>
              </div>
            </div>
          </div>

          {/* Categorías Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <a href="https://www.casicinco.com/restaurante?utm_source=furgocasa&utm_medium=banner&utm_campaign=mega_wide"
               target="_blank" rel="noopener noreferrer sponsored nofollow"
               className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.12)] p-6 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,255,255,0.14)] hover:border-[rgba(255,217,53,0.4)] hover:translate-y-[-6px] no-underline">
              <div className="text-5xl mb-3">🍽️</div>
              <div className="text-xl font-bold text-white mb-2">Restaurantes</div>
              <div className="text-sm text-[rgba(255,255,255,0.8)] mb-2">Gastronomía excepcional verificada</div>
              <div className="text-xs text-[#ffd935] font-semibold">+2000 lugares →</div>
            </a>

            <a href="https://www.casicinco.com/bar?utm_source=furgocasa&utm_medium=banner&utm_campaign=mega_wide"
               target="_blank" rel="noopener noreferrer sponsored nofollow"
               className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.12)] p-6 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,255,255,0.14)] hover:border-[rgba(255,217,53,0.4)] hover:translate-y-[-6px] no-underline">
              <div className="text-5xl mb-3">🍺</div>
              <div className="text-xl font-bold text-white mb-2">Bares</div>
              <div className="text-sm text-[rgba(255,255,255,0.8)] mb-2">Ambiente único y calidad</div>
              <div className="text-xs text-[#ffd935] font-semibold">+700 lugares →</div>
            </a>

            <a href="https://www.casicinco.com/hotel?utm_source=furgocasa&utm_medium=banner&utm_campaign=mega_wide"
               target="_blank" rel="noopener noreferrer sponsored nofollow"
               className="bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.12)] p-6 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,255,255,0.14)] hover:border-[rgba(255,217,53,0.4)] hover:translate-y-[-6px] no-underline col-span-2 md:col-span-1">
              <div className="text-5xl mb-3">🏨</div>
              <div className="text-xl font-bold text-white mb-2">Hoteles</div>
              <div className="text-sm text-[rgba(255,255,255,0.8)] mb-2">Alojamiento premium</div>
              <div className="text-xs text-[#ffd935] font-semibold">+800 lugares →</div>
            </a>
          </div>

          {/* CTA */}
          <div className="text-center">
            <a href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=mega_wide"
               target="_blank" rel="noopener noreferrer sponsored nofollow"
               className="inline-block bg-gradient-to-r from-[#ffd935] to-[#ffe566] text-[#063971] px-16 py-6 rounded-2xl font-black text-2xl transition-all duration-300 shadow-[0_10px_40px_rgba(255,217,53,0.5)] hover:shadow-[0_15px_50px_rgba(255,217,53,0.7)] hover:translate-y-[-4px] no-underline">
              Explorar Casi Cinco →
            </a>
            <div className="text-sm text-[rgba(255,255,255,0.7)] mt-4">
              🎯 Incluye Planificador de Rutas con IA · Gratis · Sin registro
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes glow-mega {
            0%, 100% { 
              filter: drop-shadow(0 0 10px rgba(255, 217, 53, 0.5));
            }
            50% { 
              filter: drop-shadow(0 0 25px rgba(255, 217, 53, 0.8));
            }
          }
          .animate-glow-mega {
            animation: glow-mega 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  )
}

