"use client"

import React, { createContext, useState, useContext, ReactNode } from 'react'
import { ImagePopup } from './image-popup'

interface ImagePopupContextType {
  openImage: (src: string, alt: string) => void
  closeImage: () => void
}

const ImagePopupContext = createContext<ImagePopupContextType | undefined>(undefined)

export function useImagePopup() {
  const context = useContext(ImagePopupContext)
  if (context === undefined) {
    throw new Error('useImagePopup must be used within an ImagePopupProvider')
  }
  return context
}

interface ImagePopupProviderProps {
  children: ReactNode
}

export function ImagePopupProvider({ children }: ImagePopupProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState('')
  const [imageAlt, setImageAlt] = useState('')

  const openImage = (src: string, alt: string) => {
    setImageSrc(src)
    setImageAlt(alt)
    setIsOpen(true)
  }

  const closeImage = () => {
    setIsOpen(false)
  }

  return (
    <ImagePopupContext.Provider value={{ openImage, closeImage }}>
      {children}
      {isOpen && (
        <ImagePopup 
          src={imageSrc} 
          alt={imageAlt} 
          onClose={closeImage} 
        />
      )}
    </ImagePopupContext.Provider>
  )
}
