"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { BackToTop } from "@/components/ui/back-to-top"
import { Settings, User, Store, Info, LogOut } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  
  const handleLogout = async () => {
    await logout()
    router.push("/auth/login")
  }
  
  return (
    <div className="pb-8">
      <BackToTop />
      
      {/* Blue Header with White Text */}
      <div className="bg-[#004BFE] text-white p-4 pt-6 pb-16 rounded-b-3xl">
        <h1 className="text-xl font-bold">General Settings</h1>
        <p className="text-white/80 mt-1">Manage your application settings</p>
      </div>
      
      <div className="container mx-auto max-w-4xl -mt-10">
        {/* Settings Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/dashboard/settings" className="block">
            <Card className="h-full hover:shadow-md transition-shadow border-primary/20 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <Settings className="h-5 w-5 mr-2 text-primary" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manage app preferences and account settings
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/settings/profile" className="block">
            <Card className="h-full hover:shadow-md transition-shadow bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Store Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Update your store information and profile
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/about" className="block">
            <Card className="h-full hover:shadow-md transition-shadow bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <Info className="h-5 w-5 mr-2 text-primary" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Learn more about Stock Expiry Tracker
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
        
        {/* Main Settings */}
        <Card className="mb-4 bg-white">
          <CardHeader>
            <CardTitle>Application Settings</CardTitle>
            <CardDescription>Manage your application preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Enable dark mode for the application</p>
              </div>
              <Switch 
                id="dark-mode" 
                checked={darkMode} 
                onCheckedChange={setDarkMode} 
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="font-medium">Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications for expiring items</p>
              </div>
              <Switch 
                id="notifications" 
                checked={notifications} 
                onCheckedChange={setNotifications} 
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Account Section */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="font-medium">Email</Label>
              <p className="text-sm">{user?.email || "Not available"}</p>
            </div>
            
            <div>
              <Label className="font-medium">Account Created</Label>
              <p className="text-sm">
                {user?.registration ? new Date(user.registration * 1000).toLocaleDateString() : "Not available"}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full sm:w-auto"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
