import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/appwrite/database-service';
import { authService } from '@/lib/appwrite/auth-service';

// GET /api/products - Get all products for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get the current user from Appwrite
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const userId = user.$id;
      const { searchParams } = new URL(request.url);
      const includeDeleted = searchParams.get('includeDeleted') === 'true';
      
      // Use the existing method from DatabaseService
      const products = await databaseService.listProducts(userId);
      
      return NextResponse.json({ products });
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    // Get the current user from Appwrite
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const userId = user.$id;
      const data = await request.json();
      
      // Validate required fields
      if (!data.barcode || !data.name) {
        return NextResponse.json({ error: 'Barcode and name are required' }, { status: 400 });
      }
      
      // Check if product with this barcode already exists
      const existingProduct = await databaseService.getProductByBarcode(userId, data.barcode);
      if (existingProduct) {
        return NextResponse.json({ error: 'A product with this barcode already exists' }, { status: 409 });
      }
      
      // Create the product
      const product = await databaseService.createProduct({
        user_id: userId,
        barcode: data.barcode,
        name: data.name,
        price: data.price || 0,
        weight: data.weight || '',
        category: data.category || '',
        image_id: data.image_id,
      });
      
      return NextResponse.json({ product }, { status: 201 });
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
