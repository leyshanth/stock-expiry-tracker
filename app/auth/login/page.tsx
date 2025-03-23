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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsLoading(true)
      await login(email, password)
      toast({
        title: "Success",
        description: "You have successfully logged in",
      })
      router.push("/dashboard/home")
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "Failed to login. Please check your credentials.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Login" subtitle="Good to see you back!">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email input */}
        <div>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-gray-50 border-none rounded-lg px-4 py-3 w-full text-gray-700 placeholder-gray-400"
          />
        </div>
        
        {/* Password input */}
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-gray-50 border-none rounded-lg px-4 py-3 w-full text-gray-700 placeholder-gray-400"
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
        
        {/* Login button */}
        <Button 
          type="submit" 
          className="w-full bg-[#004BFE] hover:bg-blue-600 text-white py-3 rounded-lg transition-colors mt-5" 
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>
        
        {/* Register and Forgot password links */}
        <div className="text-center text-sm mt-4">
          <div className="flex justify-center items-center space-x-1">
            <span className="text-gray-600">Don't have an account?</span>
            <Link href="/auth/register" className="text-[#004BFE] hover:underline font-medium">
              Register
            </Link>
          </div>
          <Link
            href="/auth/reset-password"
            className="text-[#004BFE] hover:underline block mt-2"
          >
            Forgot password?
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
