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
          <Button 
            asChild 
            className="w-full bg-[#004BFE] hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
          >
            <Link href="/auth/login">Back to Login</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your new password below to reset your account password.">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* New Password input */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-full focus:ring-[#004BFE] focus:border-[#004BFE]"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                disabled={isLoading}
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
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-full focus:ring-[#004BFE] focus:border-[#004BFE]"
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                disabled={isLoading}
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
        
        {/* Reset Password button */}
        <Button 
          type="submit" 
          className="w-full bg-[#004BFE] hover:bg-blue-700 text-white py-2 rounded-lg transition-colors" 
          disabled={isLoading}
        >
          {isLoading ? "Resetting Password..." : "Reset Password"}
        </Button>
        
        {/* Login link */}
        <div className="text-center text-sm mt-6">
          <Link href="/auth/login" className="text-[#004BFE] hover:underline font-medium">
            Back to Login
          </Link>
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
      <div className="flex flex-col items-center justify-center py-8 space-y-6">
        <div className="w-12 h-12 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#004BFE] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-center text-sm text-gray-500">
          Please wait while we load the reset password form...
        </p>
        <Button 
          disabled 
          className="w-full bg-[#004BFE] opacity-70 text-white py-2 rounded-lg"
        >
          Please wait...
        </Button>
      </div>
    </AuthLayout>
  );
}
