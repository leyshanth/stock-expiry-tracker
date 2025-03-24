'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';

export default function Home() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading) {
      if (user) {
        window.location.href = '/dashboard/home';
      } else {
        window.location.href = '/auth/login';
      }
    }
  }, [user, loading]);
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Stock & Expiry Tracker</h1>
        <p className="mb-8">Redirecting you to the right place...</p>
        {loading ? (
          <div className="animate-pulse">Loading...</div>
        ) : null}
      </div>
    </main>
  );
}
