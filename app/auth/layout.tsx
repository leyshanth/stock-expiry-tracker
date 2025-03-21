import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[450px]">
        <div className="flex flex-col space-y-2 text-center mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Stock & Expiry Tracker
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your inventory and track expiry dates
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
