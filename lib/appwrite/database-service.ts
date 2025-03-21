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
      const result = await databases.createDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        ID.unique(),
        {
          ...product,
          created_at: now,
          updated_at: now
        }
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
      const result = await databases.listDocuments(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.equal('barcode', barcode)
        ]
      );
      
      if (result.documents.length > 0) {
        return result.documents[0] as unknown as Product;
      }
      return null;
    } catch (error) {
      console.error('DatabaseService.getProductByBarcode error:', error);
      throw error;
    }
  }

  async listProducts(userId: string): Promise<Product[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.orderDesc('created_at')
        ]
      );
      return result.documents as unknown as Product[];
    } catch (error) {
      console.error('DatabaseService.listProducts error:', error);
      throw error;
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
      const queries = [
        Query.equal('user_id', userId),
      ];
      
      if (!includeDeleted) {
        queries.push(Query.equal('is_deleted', false));
      }
      
      queries.push(Query.orderAsc('expiry_date'));
      
      const result = await databases.listDocuments(
        DATABASE_ID,
        EXPIRY_COLLECTION_ID,
        queries
      );
      return result.documents as unknown as ExpiryItem[];
    } catch (error) {
      console.error('DatabaseService.listExpiryItems error:', error);
      throw error;
    }
  }

  async listDeletedExpiryItems(userId: string): Promise<ExpiryItem[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        EXPIRY_COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.equal('is_deleted', true),
          Query.orderDesc('deleted_at')
        ]
      );
      return result.documents as unknown as ExpiryItem[];
    } catch (error) {
      console.error('DatabaseService.listDeletedExpiryItems error:', error);
      throw error;
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
      const fileId = ID.unique();
      await storage.createFile(
        BUCKET_ID,
        fileId,
        file,
        [`user:${userId}`] // Set permissions for the file
      );
      return fileId;
    } catch (error) {
      console.error('DatabaseService.uploadProductImage error:', error);
      throw error;
    }
  }

  getFilePreview(fileId: string): string {
    return storage.getFilePreview(
      BUCKET_ID,
      fileId,
      2000, // width
      2000, // height
      'center', // gravity
      100 // quality
    ).href;
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
