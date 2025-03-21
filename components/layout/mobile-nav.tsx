"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Package, Calendar, Trash2, Settings } from "lucide-react"
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
      href: "/dashboard/products",
      icon: Package,
      label: "Products",
    },
    {
      href: "/dashboard/expiry",
      icon: Calendar,
      label: "Expiry",
    },
    {
      href: "/dashboard/deleted",
      icon: Trash2,
      label: "Deleted",
    },
    {
      href: "/settings/profile",
      icon: Settings,
      label: "Settings",
    },
  ]

  // Style for the mobile navigation
  const navStyle = {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '95%',
    maxWidth: '450px',
    height: '64px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'var(--background)',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 50,
    border: '1px solid var(--border)'
  } as React.CSSProperties

  // Don't render until client-side to avoid hydration issues
  if (!isMounted) return null

  return (
    <div style={navStyle}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center p-2 text-xs transition-colors",
            pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <item.icon className="h-6 w-6" />
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  )
}
