'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService, AuthUser, authService } from '../appwrite/auth-service';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, storeName: string, address: string, phone: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        setLoading(true);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        // This error is expected when not logged in, so we don't need to show it as an error
        // Only log it in development
        if (process.env.NODE_ENV === 'development') {
          console.log('User not logged in yet');
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const loggedInUser = await authService.login(email, password);
      setUser(loggedInUser);
      router.push('/dashboard/home');
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to login. Please check your credentials.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      const newUser = await authService.createAccount(email, password, name);
      setUser(newUser);
      router.push('/dashboard/home');
    } catch (error) {
      console.error('Registration error:', error);
      setError('Failed to register. This email might already be in use.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout.');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (name: string, storeName: string, address: string, phone: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Update name
      const updatedUser = await authService.updateName(name);
      
      // Update store information
      await authService.updateStoreInfo(storeName, address, phone);
      
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      setError('Failed to update profile.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.sendVerificationEmail();
    } catch (error: any) {
      setError(error.message || 'Failed to send verification email');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    sendVerificationEmail
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
