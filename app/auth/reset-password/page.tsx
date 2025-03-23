"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/appwrite/auth-service";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/auth/auth-layout";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [userId, setUserId] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidLink, setIsValidLink] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  useEffect(() => {
    const userIdParam = searchParams.get("userId");
    const secretParam = searchParams.get("secret");

    if (!userIdParam || !secretParam) {
      setIsValidLink(false);
      toast({
        title: "Invalid reset link",
        description: "The password reset link is invalid or has expired.",
        variant: "destructive",
      });
      return;
    }

    setUserId(userIdParam);
    setSecret(secretParam);
  }, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(userId, secret, password, confirmPassword);
      
      toast({
        title: "Password reset successful",
        description: "Your password has been reset successfully. You can now log in with your new password.",
      });
      
      router.push("/auth/login");
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Password reset failed",
        description: "Failed to reset your password. The link may have expired or is invalid.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidLink) {
    return (
      <AuthLayout title="Invalid Reset Link" subtitle="The password reset link is invalid or has expired.">
        <div className="mt-6">
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
    <AuthLayout title="Reset Password" subtitle="Enter your new password below">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="w-full p-4 bg-gray-100 rounded-full text-gray-700 focus:outline-none"
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
            disabled={isLoading}
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
            disabled={isLoading}
            className="w-full p-4 bg-gray-100 rounded-full text-gray-700 focus:outline-none"
          />
          <button 
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
            disabled={isLoading}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        
        <button 
          type="submit" 
          className="w-full p-4 bg-[#004BFE] text-white rounded-full font-medium text-xl mt-8"
          disabled={isLoading}
        >
          {isLoading ? "Resetting Password..." : "Reset Password"}
        </button>
        
        <div className="mt-6 text-center">
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordFallback() {
  return (
    <AuthLayout title="Reset Password" subtitle="Loading reset password form...">
      <div className="flex flex-col items-center justify-center py-6 space-y-5">
        <div className="w-16 h-16 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#004BFE] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-center text-gray-700">
          Please wait while we load the reset password form...
        </p>
        <button 
          disabled 
          className="w-full p-4 bg-[#004BFE] opacity-70 text-white rounded-full font-medium text-xl mt-4"
        >
          Please wait...
        </button>
      </div>
    </AuthLayout>
  );
}
