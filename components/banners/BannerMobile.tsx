'use client'

interface BannerMobileProps {
  position: string
}

export function BannerMobile({ position }: BannerMobileProps) {
  return (
    <div className="w-full max-w-[320px] mx-auto my-8">
      <div className="bg-gradient-to-br from-[#063971] to-[#042143] rounded-xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-300 hover:shadow-[0_6px_24px_rgba(0,0,0,0.3)] hover:scale-[1.02]">
        <div className="flex items-center justify-between p-4 gap-4">
          <a
            href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=mobile"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-center gap-3 flex-1 no-underline text-white"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="text-4xl animate-rotate-mobile">⭐</div>
              <div className="flex-1">
                <div className="text-lg font-black text-[#ffd935] mb-0.5 leading-none">Casi Cinco</div>
                <div className="text-[11px] text-[rgba(255,255,255,0.9)] leading-[1.3] mb-1">
                  +3500 lugares + Rutas IA
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#ffd935] font-semibold">
                  <span>★★★★★</span>
                  <span>+4.7 rating</span>
                </div>
              </div>
            </div>
          </a>
          <a
            href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=mobile"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="bg-[#ffd935] text-[#063971] px-4 py-2.5 rounded-lg font-extrabold text-[13px] whitespace-nowrap transition-all duration-300 shadow-[0_2px_8px_rgba(255,217,53,0.3)] hover:bg-[#ffe566] hover:scale-105 no-underline"
          >
            Ver →
          </a>
        </div>

        <style jsx>{`
          @keyframes rotate {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg); }
            75% { transform: rotate(10deg); }
          }
          .animate-rotate-mobile {
            animation: rotate 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  )
}
