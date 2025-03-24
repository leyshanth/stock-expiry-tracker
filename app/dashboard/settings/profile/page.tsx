"use client"

import { useState } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { BackToTop } from "@/components/ui/back-to-top"
import { Settings, User, Store, Info, Save } from "lucide-react"
import Link from "next/link"

export default function StoreProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  // Store profile form state
  const [storeProfile, setStoreProfile] = useState({
    name: "My Store",
    address: "123 Main Street, City, Country",
    phone: "+1 234 567 8901",
    email: user?.email || "",
    description: "A retail store specializing in groceries and household items."
  })
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setStoreProfile(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSaveProfile = async () => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: "Profile Updated",
      description: "Your store profile has been updated successfully.",
    })
    
    setIsLoading(false)
  }
  
  return (
    <div className="pb-8">
      <BackToTop />
      
      {/* Blue Header with White Text */}
      <div className="bg-[#004BFE] text-white p-4 pt-6 pb-16 rounded-b-3xl">
        <h1 className="text-xl font-bold">Store Profile</h1>
        <p className="text-white/80 mt-1">Manage your store information</p>
      </div>
      
      <div className="container mx-auto max-w-4xl -mt-10">
        {/* Settings Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/dashboard/settings" className="block">
            <Card className="h-full hover:shadow-md transition-shadow bg-white">
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
            <Card className="h-full hover:shadow-md transition-shadow border-primary/20 bg-white">
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
        
        {/* Store Profile Form */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>Update your store details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Store Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={storeProfile.name} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={storeProfile.phone} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                value={storeProfile.email} 
                onChange={handleInputChange} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Store Address</Label>
              <Input 
                id="address" 
                name="address" 
                value={storeProfile.address} 
                onChange={handleInputChange} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Store Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                rows={4} 
                value={storeProfile.description} 
                onChange={handleInputChange} 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveProfile} 
              disabled={isLoading}
              className="bg-[#004BFE] hover:bg-[#004BFE]/90 rounded-full"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
