"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/appwrite/auth-service";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [userId, setUserId] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidLink, setIsValidLink] = useState<boolean>(true);

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
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invalid Reset Link</CardTitle>
          <CardDescription>
            The password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/auth/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your new password below to reset your account password.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Resetting Password..." : "Reset Password"}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full" 
            asChild
            disabled={isLoading}
          >
            <Link href="/auth/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
