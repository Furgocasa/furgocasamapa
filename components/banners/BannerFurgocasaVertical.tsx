'use client'

interface BannerProps {
  position: string
}

export function BannerFurgocasaVertical({ position }: BannerProps) {
  const utmCampaign = `furgocasa_vertical_${position}_area_detail`

  return (
    <div className="w-full max-w-[300px] mx-auto">
      <a
        href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        className="block no-underline"
      >
        <div className="bg-gradient-to-b from-[#003d7a] to-[#002855] rounded-xl overflow-hidden shadow-2xl transition-all hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,61,122,0.4)]">
          {/* Imagen visible - 45% altura */}
          <div className="relative h-[240px] overflow-hidden">
            <img 
              src="/images/furgocasa/camper-vertical-1.jpg"
              alt="Camper Furgocasa Gandía"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#002855]/70 via-transparent to-transparent"></div>
            <div className="absolute top-3 left-3">
              <span className="text-xs bg-white/90 text-[#003d7a] px-2 py-1 rounded-full font-bold">Publicidad</span>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-5 text-white text-center">
            <div className="text-2xl font-black text-[#ff6b35] mb-1 flex items-center justify-center gap-2">
              🚐 <span>Furgocasa</span>
            </div>
            <p className="text-xs text-white/90 mb-4">
              Alquiler y Venta de Campers
            </p>
          </div>
        
        <div className="px-5 pb-4 space-y-3">
          <a
            href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-lg no-underline text-white hover:bg-white/15 transition-colors"
          >
            <div className="text-2xl">💰</div>
            <div className="flex-1">
              <div className="text-base font-bold text-[#ff6b35]">95€/día</div>
              <div className="text-xs text-white/70">Desde</div>
            </div>
          </a>

          <a
            href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-lg no-underline text-white hover:bg-white/15 transition-colors"
          >
            <div className="text-2xl">🚗</div>
            <div className="flex-1">
              <div className="text-base font-bold text-[#ff6b35]">Ilimitados</div>
              <div className="text-xs text-white/70">Kilómetros</div>
            </div>
          </a>

          <a
            href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-lg no-underline text-white hover:bg-white/15 transition-colors"
          >
            <div className="text-2xl">⭐</div>
            <div className="flex-1">
              <div className="text-base font-bold text-[#ff6b35]">4.9 / 5.0</div>
              <div className="text-xs text-white/70">Valoración</div>
            </div>
          </a>

          <a
            href={`https://www.furgocasa.com/es/ventas?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-lg no-underline text-white hover:bg-white/15 transition-colors"
          >
            <div className="text-2xl">🏷️</div>
            <div className="flex-1">
              <div className="text-base font-bold text-[#ff6b35]">49.000€</div>
              <div className="text-xs text-white/70">Venta desde</div>
            </div>
          </a>
        </div>

        <div className="px-5 pb-5">
          <a
            href={`https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=${utmCampaign}`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="block bg-white text-[#003d7a] p-3 rounded-lg font-bold text-base text-center no-underline hover:bg-gray-100 transition-colors"
          >
            Reservar →
          </a>
        </div>
      </a>
    </div>
  )
}
