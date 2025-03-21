import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/appwrite/database-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/products/barcode?code=123456789 - Get a product by barcode
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
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
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
