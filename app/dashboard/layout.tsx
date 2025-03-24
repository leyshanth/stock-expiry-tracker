"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { MobileNav } from "@/components/layout/mobile-nav"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If not loading and user is authenticated, show the dashboard
  if (user) {
    return (
      <div className="flex min-h-screen flex-col pb-16">
        <main className="flex-1 p-4">{children}</main>
        <MobileNav />
      </div>
    )
  }

  // This will only show briefly before the redirect happens
  return null
}
