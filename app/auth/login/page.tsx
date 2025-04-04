"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, Loader2 } from "lucide-react"
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
      <form onSubmit={handleSubmit} className="space-y-4 pt-10">
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
            className="w-full p-4 bg-gray-100 rounded-full text-gray-700 focus:outline-none password-field"
            autoComplete="off"
            aria-autocomplete="none"
            spellCheck="false"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>

        <button 
          type="submit" 
          className="w-full p-4 bg-[#004BFE] text-white rounded-full font-medium text-xl mt-6 flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>

        <div className="mt-4 text-center">
          <p className="text-gray-700">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-black underline">
              Register
            </Link>
          </p>
          <p className="mt-1">
            <Link href="/auth/forgot-password" className="text-gray-700">
              Forgot password?
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}
