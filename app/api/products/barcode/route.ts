import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/appwrite/database-service';
import { authService } from '@/lib/appwrite/auth-service';

// GET /api/products/barcode?code=123456789 - Get a product by barcode
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
      const barcode = searchParams.get('code');
      
      if (!barcode) {
        return NextResponse.json({ error: 'Barcode parameter is required' }, { status: 400 });
      }
      
      const product = await databaseService.getProductByBarcode(userId, barcode);
      
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      
      return NextResponse.json({ product });
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
