"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  // Show button when page is scrolled down
  useEffect(() => {
    const toggleVisibility = () => {
      // If we're more than 300px from the top, show the button
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    // Add scroll event listener
    window.addEventListener("scroll", toggleVisibility)
    
    // Initial check in case page is already scrolled
    toggleVisibility()
    
    // Clean up event listener on unmount
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }

  return (
    <Button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-24 right-4 z-40 h-10 w-10 rounded-full p-0 shadow-md transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      size="icon"
      aria-label="Back to top"
    >
      <ChevronUp className="h-5 w-5" />
    </Button>
  )
}
