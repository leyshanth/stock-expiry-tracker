'use client';

import { Account, Client, Databases, Storage } from 'appwrite';

// Initialize the Appwrite client
let appwriteClient: Client;
let account: Account;
let databases: Databases;
let storage: Storage;

// Initialize Appwrite only on the client side
if (typeof window !== 'undefined') {
  appwriteClient = new Client();
  
  // Set the endpoint and project ID from environment variables
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  
  appwriteClient
    .setEndpoint(endpoint)
    .setProject(projectId);
    
  // For self-hosted instances, you may need to configure your Appwrite server
  // to accept connections from your client origin
  
  // Initialize Appwrite services
  account = new Account(appwriteClient);
  databases = new Databases(appwriteClient);
  storage = new Storage(appwriteClient);
  
  // For debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Appwrite initialized with:', { endpoint, projectId });
  }
} else {
  // Server-side placeholder to prevent errors
  appwriteClient = {} as Client;
  account = {} as Account;
  databases = {} as Databases;
  storage = {} as Storage;
}

// Database and collection IDs
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
export const PRODUCTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID || '';
export const EXPIRY_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_EXPIRY_COLLECTION_ID || '';
export const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || '';

// Export the services
export { appwriteClient, account, databases, storage };
