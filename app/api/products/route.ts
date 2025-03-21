import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/appwrite/database-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/products - Get all products for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const products = await databaseService.getProducts(userId);
    
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
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
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
