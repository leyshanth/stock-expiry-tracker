'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If user is not logged in, redirect to login page
    if (!user && !isLoading) {
      router.push('/auth/login');
      return;
    }

    // Load user data
    if (user) {
      setName(user.name || '');
      
      // Load store information from preferences
      if (user.prefs) {
        setStoreName(user.prefs.storeName || '');
        setAddress(user.prefs.address || '');
        setPhone(user.prefs.phone || '');
      }
    }
  }, [user, router, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      await updateProfile(name, storeName, address, phone);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Update failed',
        description: 'There was an error updating your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Store Profile</CardTitle>
          <CardDescription>
            Update your store information and preferences
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                placeholder="Store Name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Store Address</Label>
              <Input
                id="address"
                placeholder="Store Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input
                id="phone"
                placeholder="Contact Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => router.push('/dashboard/home')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
