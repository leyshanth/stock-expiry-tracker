"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Package, Calendar, Trash2, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const pathname = usePathname()

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

  return (
    <div className="mobile-nav">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "mobile-nav-item",
            pathname === item.href && "active"
          )}
        >
          <item.icon className="h-6 w-6" />
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  )
}
