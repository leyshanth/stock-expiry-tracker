import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/appwrite/database-service';
import { authService } from '@/lib/appwrite/auth-service';

// GET /api/expiry - Get all expiry items for the authenticated user
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
      const expiryItems = await databaseService.listExpiryItems(userId, includeDeleted);
      
      return NextResponse.json({ expiryItems });
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching expiry items:', error);
    return NextResponse.json({ error: 'Failed to fetch expiry items' }, { status: 500 });
  }
}

// POST /api/expiry - Create a new expiry item
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
      if (!data.product_id || !data.expiry_date) {
        return NextResponse.json({ error: 'Product ID and expiry date are required' }, { status: 400 });
      }
      
      // Create the expiry item
      const expiryItem = await databaseService.createExpiryItem({
        user_id: userId,
        product_id: data.product_id,
        barcode: data.barcode || '',
        expiry_date: data.expiry_date,
        quantity: data.quantity || 1
      });
      
      return NextResponse.json({ expiryItem }, { status: 201 });
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating expiry item:', error);
    return NextResponse.json({ error: 'Failed to create expiry item' }, { status: 500 });
  }
}
