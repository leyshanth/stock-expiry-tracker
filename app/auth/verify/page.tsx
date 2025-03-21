"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/appwrite/auth-service";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

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

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === "loading" && "Verifying your email address..."}
            {status === "success" && "Your email has been verified!"}
            {status === "error" && "Email verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          {status === "loading" && (
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {status === "success" && (
            <CheckCircle className="w-16 h-16 text-green-500" />
          )}
          {status === "error" && (
            <XCircle className="w-16 h-16 text-red-500" />
          )}
          
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {status === "loading" && "Please wait while we verify your email address..."}
            {status === "success" && "Thank you for verifying your email address. You can now use all features of the application."}
            {status === "error" && errorMessage}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          {status === "loading" ? (
            <Button disabled>Please wait...</Button>
          ) : (
            <Button asChild>
              <Link href={status === "success" ? "/dashboard/home" : "/auth/login"}>
                {status === "success" ? "Go to Dashboard" : "Back to Login"}
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
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
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>Verifying your email address...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Please wait while we verify your email address...
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button disabled>Please wait...</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
