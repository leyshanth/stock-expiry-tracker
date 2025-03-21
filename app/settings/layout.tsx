"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, loading } = useAuth();
  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <Link
            href="/dashboard/home"
            className="flex items-center text-sm font-medium text-muted-foreground mb-6 hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <nav className="flex flex-col space-y-2">
            <Link
              href="/settings/profile"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-secondary"
            >
              <User className="mr-2 h-4 w-4" />
              Store Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-secondary"
            >
              <Settings className="mr-2 h-4 w-4" />
              General Settings
            </Link>
            
            <div className="pt-6 mt-6 border-t border-border">
              <Button 
                variant="destructive" 
                className="w-full justify-start" 
                onClick={logout}
                disabled={loading}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </nav>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
