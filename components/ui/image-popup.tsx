"use client"

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImagePopupProps {
  src: string
  alt: string
  onClose: () => void
}

export function ImagePopup({ src, alt, onClose }: ImagePopupProps) {
  // Handle escape key press to close the popup
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-0">
      <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70 rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        
        <div className="relative max-h-[90vh] max-w-full overflow-hidden rounded-lg">
          <img 
            src={src} 
            alt={alt} 
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  )
}
