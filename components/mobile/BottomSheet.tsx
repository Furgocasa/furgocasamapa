'use client'

import { useEffect, ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'

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
  const dragControls = useDragControls()

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

  const getHeightClass = () => {
    if (snapPoints.includes('full')) return 'h-[90dvh]'
    if (snapPoints.includes('half')) return 'h-[60dvh]'
    return 'h-[40dvh]'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              // Si se arrastra más de 100px hacia abajo, cerrar
              if (info.offset.y > 100) onClose()
            }}
            className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-overlay z-50 md:hidden flex flex-col pb-[env(safe-area-inset-bottom)] ${getHeightClass()}`}
          >
            {/* Drag Handle */}
            <div
              className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => dragControls.start(e)}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
