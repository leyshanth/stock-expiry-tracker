"use client"

import { useState } from "react"
import Link from "next/link"
import { EyeOff, Eye } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top curved shape */}
      <div className="relative h-72 bg-blue-600 rounded-bl-[40%]">
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white text-center">
            Stock & Expiry
            <br />
            Tracker
          </h1>
        </div>
      </div>

      {/* Bottom right curved shape */}
      <div className="absolute right-0 top-1/2 w-24 h-32 bg-blue-600 rounded-tl-full" />

      {/* Light blue decorative shape */}
      <div className="absolute left-0 bottom-0 w-64 h-64 bg-blue-100 rounded-tr-full opacity-50" />

      {/* Login content */}
      <div className="flex-1 px-8 pt-12 z-10">
        <h2 className="text-5xl font-bold mb-2">Login</h2>
        <p className="text-gray-700 mb-8">Good to see you back!</p>

        <form className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-100 rounded-full text-gray-700 focus:outline-none"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <button type="submit" className="w-full p-4 bg-blue-600 text-white rounded-full font-medium text-xl mt-8">
            Login
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-700">
            Don't have an account?{" "}
            <Link href="#" className="text-black underline">
              Register
            </Link>
          </p>
          <p className="mt-2">
            <Link href="#" className="text-gray-700">
              Forgot password?
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom indicator */}
      <div className="flex justify-center pb-6">
        <div className="w-12 h-1 bg-black rounded-full"></div>
      </div>
    </div>
  )
}

