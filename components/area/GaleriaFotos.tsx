'use client'

import Image from 'next/image'
import { useState } from 'react'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, PhotoIcon } from '@heroicons/react/24/outline'

interface Props {
  fotos: string[]
  nombre: string
}

export function GaleriaFotos({ fotos, nombre }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
    document.body.style.overflow = 'hidden' // Prevenir scroll
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
    document.body.style.overflow = '' // Restaurar scroll
  }

  const nextPhoto = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % fotos.length)
    }
  }

  const prevPhoto = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + fotos.length) % fotos.length)
    }
  }

  if (!fotos || fotos.length === 0) {
    return null
  }

  return (
    <>
      <section className="bg-white rounded-lg shadow-mobile p-6 border-t-4 border-[#0b3c74]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#0b3c74] to-[#0d4a8f] p-2 rounded-lg shadow-lg">
              <PhotoIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0b3c74]">Galería de Imágenes</h2>
              <p className="text-sm text-gray-600 font-medium">{fotos.length} {fotos.length === 1 ? 'imagen' : 'imágenes'}</p>
            </div>
          </div>
        </div>

        {/* Grid de fotos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {fotos.map((foto: any, index: any) => (
            <button
              key={index}
              onClick={() => openLightbox(index)}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
            >
              <Image
                src={foto}
                alt={`${nombre} - Foto ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Botón cerrar */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors safe-top"
            aria-label="Cerrar"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>

          {/* Contador */}
          <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-semibold safe-top">
            {selectedIndex + 1} / {fotos.length}
          </div>

          {/* Botón anterior */}
          {fotos.length > 1 && (
            <button
              onClick={prevPhoto}
              className="absolute left-4 z-10 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeftIcon className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Imagen actual */}
          <div className="relative w-full h-full max-w-6xl max-h-screen p-4 md:p-8">
            <div className="relative w-full h-full">
              <Image
                src={fotos[selectedIndex]}
                alt={`${nombre} - Foto ${selectedIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </div>

          {/* Botón siguiente */}
          {fotos.length > 1 && (
            <button
              onClick={nextPhoto}
              className="absolute right-4 z-10 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRightIcon className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Miniaturas (desktop) */}
          {fotos.length > 1 && (
            <div className="hidden md:block absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 safe-bottom">
              <div className="flex gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2 max-w-screen overflow-x-auto">
                {fotos.map((foto: any, index: any) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className={`relative w-16 h-16 rounded flex-shrink-0 overflow-hidden ${
                      index === selectedIndex ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={foto}
                      alt={`Miniatura ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
