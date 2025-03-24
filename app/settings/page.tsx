'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is not logged in, redirect to login page
    if (!user && !loading) {
      router.push('/auth/login');
    }
  }, [user, router, loading]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your store settings and preferences
        </p>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure general application settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This section will contain general application settings in future updates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
