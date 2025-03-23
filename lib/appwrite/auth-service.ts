import { ID, Models } from 'appwrite';
import { account } from './config';

export type AuthUser = Models.User<Models.Preferences>;

export class AuthService {
  // Register a new user
  async createAccount(email: string, password: string, name: string): Promise<AuthUser> {
    try {
      // Create the user account
      const user = await account.create(
        ID.unique(),
        email,
        password,
        name
      );
      
      if (user) {
        // Login the user immediately after registration
        await account.createEmailSession(email, password);
        
        // Wait a moment to ensure the session is created before sending verification email
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Send verification email - this is critical for account security
        await this.sendVerificationEmail();
        
        return user;
      } else {
        throw Error('User registration failed');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Registration error:', error);
      }
      throw error;
    }
  }

  // Login a user
  async login(email: string, password: string): Promise<AuthUser> {
    try {
      // Check if there's already an active session
      try {
        const currentUser = await this.getCurrentUser();
        // If we get here, user is already logged in
        if (process.env.NODE_ENV === 'development') {
          console.log('User already has an active session');
        }
        return currentUser;
      } catch (sessionError) {
        // No active session, proceed with login
        await account.createEmailSession(email, password);
      }
      
      return await this.getCurrentUser();
    } catch (error) {
      console.error('AuthService.login error:', error);
      throw error;
    }
  }

  // Get the current logged-in user
  async getCurrentUser(): Promise<AuthUser> {
    try {
      return await account.get();
    } catch (error) {
      // Only log detailed errors in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Not logged in or session expired');
      }
      throw error;
    }
  }

  // Logout the current user
  async logout(): Promise<void> {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('AuthService.logout error:', error);
      throw error;
    }
  }

  // Send verification email to the current user
  async sendVerificationEmail(): Promise<void> {
    try {
      const redirectUrl = `${window.location.origin}/auth/verify`;
      
      console.log(`Sending verification email with redirect URL: ${redirectUrl}`);
      
      // Force a delay to ensure Appwrite has processed the user creation
      // This is important for the verification email to work properly
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Send the verification email
      const result = await account.createVerification(redirectUrl);
      
      console.log('Verification email sent successfully', result);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw error; // We now throw the error to properly handle it in the UI
    }
  }

  // Verify user's email with the verification token
  async verifyEmail(userId: string, secret: string): Promise<void> {
    try {
      await account.updateVerification(userId, secret);
    } catch (error) {
      console.error('AuthService.verifyEmail error:', error);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordRecovery(email: string): Promise<void> {
    try {
      await account.createRecovery(
        email,
        `${window.location.origin}/auth/reset-password`
      );
    } catch (error) {
      console.error('AuthService.sendPasswordRecovery error:', error);
      throw error;
    }
  }

  // Reset user's password with recovery token
  async resetPassword(userId: string, secret: string, password: string, confirmPassword: string): Promise<void> {
    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      await account.updateRecovery(userId, secret, password, confirmPassword);
    } catch (error) {
      console.error('AuthService.resetPassword error:', error);
      throw error;
    }
  }

  // Update user's name
  async updateName(name: string): Promise<AuthUser> {
    try {
      return await account.updateName(name);
    } catch (error) {
      console.error('AuthService.updateName error:', error);
      throw error;
    }
  }

  // Update user's store information in preferences
  async updateStoreInfo(storeName: string, address: string, phone: string): Promise<AuthUser> {
    try {
      return await account.updatePrefs({
        storeName,
        address,
        phone
      });
    } catch (error) {
      console.error('AuthService.updateStoreInfo error:', error);
      throw error;
    }
  }

  // Get user's store information from preferences
  async getStoreInfo(): Promise<{
    storeName?: string;
    address?: string;
    phone?: string;
  }> {
    try {
      const user = await this.getCurrentUser();
      return user.prefs || {};
    } catch (error) {
      console.error('AuthService.getStoreInfo error:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const authService = new AuthService();
