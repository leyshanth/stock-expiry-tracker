"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/appwrite/auth-service";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import AuthLayout from "@/components/auth/auth-layout";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    if (!userId || !secret) {
      setStatus("error");
      setErrorMessage("Invalid verification link. Missing required parameters.");
      return;
    }

    const verifyEmail = async () => {
      try {
        await authService.verifyEmail(userId, secret);
        setStatus("success");
      } catch (error) {
        console.error("Email verification error:", error);
        setStatus("error");
        setErrorMessage("Failed to verify your email. The link may have expired or is invalid.");
      }
    };

    verifyEmail();
  }, [searchParams]);

  const title = 
    status === "loading" ? "Email Verification" :
    status === "success" ? "Email Verified!" :
    "Verification Failed";
    
  const subtitle = 
    status === "loading" ? "Verifying your email address..." :
    status === "success" ? "Your email has been successfully verified" :
    "Email verification failed";
    
  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <div className="flex flex-col items-center justify-center py-8 space-y-6">
        {status === "loading" && (
          <div className="w-16 h-16 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#004BFE] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {status === "success" && (
          <CheckCircle className="w-20 h-20 text-green-500" />
        )}
        {status === "error" && (
          <XCircle className="w-20 h-20 text-red-500" />
        )}
        
        <p className="text-center text-sm text-gray-600 max-w-md">
          {status === "loading" && "Please wait while we verify your email address..."}
          {status === "success" && "Thank you for verifying your email address. You can now use all features of the application."}
          {status === "error" && errorMessage}
        </p>
        
        {status === "loading" ? (
          <Button 
            disabled 
            className="w-full bg-[#004BFE] opacity-70 text-white py-2 rounded-lg mt-4"
          >
            Please wait...
          </Button>
        ) : (
          <Button 
            asChild
            className="w-full bg-[#004BFE] hover:bg-blue-700 text-white py-2 rounded-lg transition-colors mt-4"
          >
            <Link href={status === "success" ? "/dashboard/home" : "/auth/login"}>
              {status === "success" ? "Go to Dashboard" : "Back to Login"}
            </Link>
          </Button>
        )}
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailFallback() {
  return (
    <AuthLayout title="Email Verification" subtitle="Verifying your email address...">
      <div className="flex flex-col items-center justify-center py-8 space-y-6">
        <div className="w-16 h-16 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#004BFE] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-center text-sm text-gray-600">
          Please wait while we verify your email address...
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
