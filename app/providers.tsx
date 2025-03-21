'use client';

import React, { useEffect, useState } from 'react';
import { AuthProvider } from '@/lib/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  // Add this to prevent hydration mismatch during initial render
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <div suppressHydrationWarning>
          {children}
          <Toaster />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
