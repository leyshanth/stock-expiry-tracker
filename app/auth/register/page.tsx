"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff } from "lucide-react"
import AuthLayout from "@/components/auth/auth-layout"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }
    
    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsLoading(true)
      await register(email, password, name)
      toast({
        title: "Success",
        description: "Account created successfully",
      })
      router.push("/dashboard/home")
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Error",
        description: "Failed to create account. This email might already be in use.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Register" subtitle="Create a new account">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Store Name input */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Store Name
            </label>
            <div className="relative">
              <Input
                id="name"
                type="text"
                placeholder="Your Store Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-full focus:ring-[#004BFE] focus:border-[#004BFE]"
              />
            </div>
          </div>
          
          {/* Email input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-full focus:ring-[#004BFE] focus:border-[#004BFE]"
              />
            </div>
          </div>
          
          {/* Password input */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-full focus:ring-[#004BFE] focus:border-[#004BFE]"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Must be at least 8 characters long
            </p>
          </div>
          
          {/* Confirm Password input */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-full focus:ring-[#004BFE] focus:border-[#004BFE]"
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Register button */}
        <Button 
          type="submit" 
          className="w-full bg-[#004BFE] hover:bg-blue-700 text-white py-2 rounded-lg transition-colors" 
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Register"}
        </Button>
        
        {/* Login link */}
        <div className="text-center text-sm mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#004BFE] hover:underline font-medium">
            Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
