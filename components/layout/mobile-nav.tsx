"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Package, Calendar, Trash2, Settings, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export function MobileNav() {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  
  // Only show the navigation after component is mounted to avoid hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const navItems = [
    {
      href: "/dashboard/home",
      icon: Home,
      label: "Home",
    },
    {
      href: "/dashboard/expiry",
      icon: Calendar,
      label: "Expiry",
    },
    {
      href: "/settings/profile",
      icon: Settings,
      label: "Settings",
    },
  ]

  // No longer using inline styles, using Tailwind classes instead

  // Don't render until client-side to avoid hydration issues
  if (!isMounted) return null

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "mobile-nav-item",
            pathname === item.href ? "active" : ""
          )}
        >
          <item.icon className="mobile-nav-icon" />
          <span className="text-xs">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
