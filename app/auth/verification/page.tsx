"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Mail, ArrowRight } from "lucide-react"
import AuthLayout from "@/components/auth/auth-layout"

export default function VerificationPage() {
  const [isResending, setIsResending] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { sendVerificationEmail } = useAuth()

  const handleResendVerification = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You need to be logged in to resend verification email",
        variant: "destructive",
      })
      return
    }

    try {
      setIsResending(true)
      await sendVerificationEmail()
      toast({
        title: "Success",
        description: "Verification email has been resent. Please check your inbox.",
      })
    } catch (error) {
      console.error("Error resending verification email:", error)
      toast({
        title: "Error",
        description: "Failed to resend verification email",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout title="Verify Your Email" subtitle="Please check your inbox">
      <div className="flex flex-col items-center justify-center py-10 space-y-6">
        <div className="bg-blue-50 rounded-full p-6">
          <Mail className="h-16 w-16 text-[#004BFE]" />
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Verification Email Sent</h2>
          <p className="text-gray-600 max-w-md">
            We've sent a verification email to your inbox. Please check your email and click on the verification link to activate your account.
          </p>
        </div>
        
        <div className="space-y-4 w-full max-w-xs">
          <Button 
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full p-4 bg-[#004BFE] text-white rounded-full font-medium"
          >
            {isResending ? "Sending..." : "Resend Verification Email"}
          </Button>
          
          <Link href="/auth/login">
            <Button 
              variant="outline"
              className="w-full p-4 rounded-full font-medium flex items-center justify-center"
            >
              Continue to Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
