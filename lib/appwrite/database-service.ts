import { ID, Query } from 'appwrite';
import { databases, storage, DATABASE_ID, PRODUCTS_COLLECTION_ID, EXPIRY_COLLECTION_ID, BUCKET_ID } from './config';

// Product type definition
export interface Product {
  $id?: string;
  user_id: string;
  barcode: string;
  name: string;
  price: number;
  weight: string;
  category: string;
  image_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Expiry item type definition
export interface ExpiryItem {
  $id?: string;
  user_id: string;
  product_id: string;
  barcode: string;
  quantity: number;
  expiry_date: Date;
  created_at?: Date;
  is_deleted: boolean;
  deleted_at?: Date | null;
}

export class DatabaseService {
  // Products CRUD operations
  async createProduct(product: Omit<Product, '$id' | 'created_at' | 'updated_at'>): Promise<Product> {
    try {
      const now = new Date();
      
      // Store price as a float value
      const productData = {
        ...product,
        // Ensure price is a valid float
        price: Number(product.price),
        created_at: now,
        updated_at: now
      };
      
      console.log('Formatted product data for Appwrite:', productData);
      
      const result = await databases.createDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        ID.unique(),
        productData
      );
      return result as unknown as Product;
    } catch (error) {
      console.error('DatabaseService.createProduct error:', error);
      throw error;
    }
  }

  async getProduct(productId: string): Promise<Product> {
    try {
      const result = await databases.getDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        productId
      );
      return result as unknown as Product;
    } catch (error) {
      console.error('DatabaseService.getProduct error:', error);
      throw error;
    }
  }

  async getProductByBarcode(userId: string, barcode: string): Promise<Product | null> {
    try {
      console.log(`Checking for product with barcode ${barcode} for user ${userId}`);
      const result = await databases.listDocuments(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        [
          Query.equal('user_id', [userId]),  // Use array format for Query parameters
          Query.equal('barcode', [barcode])  // Use array format for Query parameters
        ]
      );
      
      if (result.documents.length > 0) {
        console.log('Found existing product with this barcode');
        return result.documents[0] as unknown as Product;
      }
      console.log('No existing product found with this barcode');
      return null;
    } catch (error) {
      console.error('DatabaseService.getProductByBarcode error:', error);
      // Return null instead of throwing error to avoid blocking product creation
      console.log('Continuing without checking barcode due to permission error');
      return null;
    }
  }

  async listProducts(userId: string): Promise<Product[]> {
    try {
      console.log(`Listing products for user ${userId}`);
      const result = await databases.listDocuments(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        [
          Query.equal('user_id', [userId]),  // Use array format for Query parameters
          Query.orderDesc('created_at')
        ]
      );
      console.log(`Found ${result.documents.length} products`);
      return result.documents as unknown as Product[];
    } catch (error) {
      console.error('DatabaseService.listProducts error:', error);
      // Return empty array instead of throwing error
      console.log('Returning empty products list due to error');
      return [];
    }
  }

  async updateProduct(productId: string, product: Partial<Omit<Product, '$id' | 'created_at' | 'user_id'>>): Promise<Product> {
    try {
      const now = new Date();
      const result = await databases.updateDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        productId,
        {
          ...product,
          updated_at: now
        }
      );
      return result as unknown as Product;
    } catch (error) {
      console.error('DatabaseService.updateProduct error:', error);
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        productId
      );
    } catch (error) {
      console.error('DatabaseService.deleteProduct error:', error);
      throw error;
    }
  }

  // Expiry items CRUD operations
  async createExpiryItem(expiryItem: Omit<ExpiryItem, '$id' | 'created_at' | 'is_deleted' | 'deleted_at'>): Promise<ExpiryItem> {
    try {
      const now = new Date();
      const result = await databases.createDocument(
        DATABASE_ID,
        EXPIRY_COLLECTION_ID,
        ID.unique(),
        {
          ...expiryItem,
          created_at: now,
          is_deleted: false,
          deleted_at: null
        }
      );
      return result as unknown as ExpiryItem;
    } catch (error) {
      console.error('DatabaseService.createExpiryItem error:', error);
      throw error;
    }
  }

  async getExpiryItem(expiryItemId: string): Promise<ExpiryItem> {
    try {
      const result = await databases.getDocument(
        DATABASE_ID,
        EXPIRY_COLLECTION_ID,
        expiryItemId
      );
      return result as unknown as ExpiryItem;
    } catch (error) {
      console.error('DatabaseService.getExpiryItem error:', error);
      throw error;
    }
  }

  async listExpiryItems(userId: string, includeDeleted: boolean = false): Promise<ExpiryItem[]> {
    try {
      console.log(`Listing expiry items for user ${userId}, includeDeleted: ${includeDeleted}`);
      const queries = [
        Query.equal('user_id', [userId]),  // Use array format for Query parameters
      ];
      
      if (!includeDeleted) {
        queries.push(Query.equal('is_deleted', [false]));  // Use array format for Query parameters
      }
      
      queries.push(Query.orderAsc('expiry_date'));
      
      const result = await databases.listDocuments(
        DATABASE_ID,
        EXPIRY_COLLECTION_ID,
        queries
      );
      console.log(`Found ${result.documents.length} expiry items`);
      return result.documents as unknown as ExpiryItem[];
    } catch (error) {
      console.error('DatabaseService.listExpiryItems error:', error);
      // Return empty array instead of throwing error
      console.log('Returning empty expiry items list due to error');
      return [];
    }
  }

  async listDeletedExpiryItems(userId: string): Promise<ExpiryItem[]> {
    try {
      console.log(`Listing deleted expiry items for user ${userId}`);
      const result = await databases.listDocuments(
        DATABASE_ID,
        EXPIRY_COLLECTION_ID,
        [
          Query.equal('user_id', [userId]),  // Use array format for Query parameters
          Query.equal('is_deleted', [true]),  // Use array format for Query parameters
          Query.orderDesc('deleted_at')
        ]
      );
      console.log(`Found ${result.documents.length} deleted expiry items`);
      return result.documents as unknown as ExpiryItem[];
    } catch (error) {
      console.error('DatabaseService.listDeletedExpiryItems error:', error);
      // Return empty array instead of throwing error
      console.log('Returning empty deleted items list due to error');
      return [];
    }
  }

  async markExpiryItemAsDeleted(expiryItemId: string): Promise<ExpiryItem> {
    try {
      const now = new Date();
      const result = await databases.updateDocument(
        DATABASE_ID,
        EXPIRY_COLLECTION_ID,
        expiryItemId,
        {
          is_deleted: true,
          deleted_at: now
        }
      );
      return result as unknown as ExpiryItem;
    } catch (error) {
      console.error('DatabaseService.markExpiryItemAsDeleted error:', error);
      throw error;
    }
  }

  async restoreExpiryItem(expiryItemId: string): Promise<ExpiryItem> {
    try {
      const result = await databases.updateDocument(
        DATABASE_ID,
        EXPIRY_COLLECTION_ID,
        expiryItemId,
        {
          is_deleted: false,
          deleted_at: null
        }
      );
      return result as unknown as ExpiryItem;
    } catch (error) {
      console.error('DatabaseService.restoreExpiryItem error:', error);
      throw error;
    }
  }

  async permanentlyDeleteExpiryItem(expiryItemId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        EXPIRY_COLLECTION_ID,
        expiryItemId
      );
    } catch (error) {
      console.error('DatabaseService.permanentlyDeleteExpiryItem error:', error);
      throw error;
    }
  }

  // File storage operations
  async uploadProductImage(file: File, userId: string): Promise<string> {
    try {
      // Generate a unique ID and log it to verify it's not the string 'unique()'
      const fileId = ID.unique();
      console.log(`Generated file ID: ${fileId}`);
      
      // Upload file without specifying permissions to use bucket default permissions
      const result = await storage.createFile(
        BUCKET_ID,
        fileId,
        file
      );
      
      // Log the result to verify the file was created successfully
      console.log(`File uploaded successfully with ID: ${result.$id}`);
      
      // Return the actual file ID from the result
      return result.$id;
    } catch (error) {
      console.error('DatabaseService.uploadProductImage error:', error);
      throw error;
    }
  }

  getFilePreview(fileId: string): string {
    if (!fileId || fileId === 'unique()') {
      console.log('Invalid file ID provided, returning placeholder');
      return '/placeholder-image.svg';
    }
    
    try {
      console.log(`Getting file preview for file ID: ${fileId}`);
      // Create the preview URL
      const previewUrl = storage.getFilePreview(
        BUCKET_ID,
        fileId,
        2000, // width
        2000, // height
        'center', // gravity
        100 // quality
      ).href;
      
      console.log(`Generated preview URL: ${previewUrl}`);
      return previewUrl;
    } catch (error) {
      console.error('Error generating file preview URL:', error);
      // Return a placeholder image URL if there's an error
      return '/placeholder-image.svg';
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await storage.deleteFile(BUCKET_ID, fileId);
    } catch (error) {
      console.error('DatabaseService.deleteFile error:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const databaseService = new DatabaseService();
