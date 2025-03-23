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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Store Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-4 bg-gray-100 rounded-full text-gray-700 focus:outline-none"
          />
        </div>

        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-4 bg-gray-100 rounded-full text-gray-700 focus:outline-none"
          />
        </div>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-4 bg-gray-100 rounded-full text-gray-700 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <p className="text-xs text-gray-500 -mt-1 ml-4">
          Must be at least 8 characters long
        </p>

        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full p-4 bg-gray-100 rounded-full text-gray-700 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button 
          type="submit" 
          className="w-full p-4 bg-[#004BFE] text-white rounded-full font-medium text-xl mt-8"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Register"}
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-700">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-black underline">
              Login
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}
