'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  snapPoints?: ('full' | 'half' | 'peek')[]
  initialSnap?: 'full' | 'half' | 'peek'
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = ['full'],
  initialSnap = 'full'
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<number>(0)
  const currentYRef = useRef<number>(0)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartRef.current = e.touches[0].clientY
    currentYRef.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY
    currentYRef.current = currentY // FIX: sin esto el gesto de cerrar nunca funcionaba
    const diff = currentY - dragStartRef.current

    // Solo permitir arrastrar hacia abajo
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = currentYRef.current - dragStartRef.current

    if (sheetRef.current) {
      sheetRef.current.style.transform = ''
    }

    // Si se arrastra más de 100px hacia abajo, cerrar
    if (diff > 100) {
      onClose()
    }
  }

  if (!isOpen) return null

  const getHeightClass = () => {
    if (snapPoints.includes('full')) return 'h-[90vh]'
    if (snapPoints.includes('half')) return 'h-[60vh]'
    return 'h-[40vh]'
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transition-transform duration-300 ease-out md:hidden flex flex-col animate-slide-up ${getHeightClass()}`}
      >
        {/* Drag Handle */}
        <div
          className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>
      </div>
    </>
  )
}

