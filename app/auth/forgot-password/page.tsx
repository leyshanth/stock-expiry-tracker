"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/appwrite/auth-service";
import { useToast } from "@/components/ui/use-toast";
import AuthLayout from "@/components/auth/auth-layout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await authService.sendPasswordRecovery(email);
      setIsSubmitted(true);
      toast({
        title: "Success",
        description: "Password reset link has been sent to your email",
      });
    } catch (error) {
      console.error("Password recovery error:", error);
      toast({
        title: "Error",
        description: "Failed to send password reset link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout title="Check Your Email" subtitle="We've sent you a password reset link">
        <div className="text-center pt-10">
          <p className="text-gray-700 mb-6">
            We've sent a password reset link to <span className="font-semibold">{email}</span>.
            Please check your email and follow the instructions to reset your password.
          </p>
          <button 
            className="w-full p-4 bg-[#004BFE] text-white rounded-full font-medium text-xl"
            onClick={() => router.push('/auth/login')}
          >
            Back to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to reset your password">
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

        <button 
          type="submit" 
          className="w-full p-4 bg-[#004BFE] text-white rounded-full font-medium text-xl mt-6"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </button>

        <div className="mt-4 text-center">
          <p className="text-gray-700">
            <Link href="/auth/login" className="text-black underline">
              Back to Login
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
