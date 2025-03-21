import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/appwrite/database-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/expiry - Get all expiry items for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, expired, all
    
    const expiryItems = await databaseService.getExpiryItems(userId, status || 'all');
    
    return NextResponse.json({ expiryItems });
  } catch (error) {
    console.error('Error fetching expiry items:', error);
    return NextResponse.json({ error: 'Failed to fetch expiry items' }, { status: 500 });
  }
}

// POST /api/expiry - Create a new expiry item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const data = await request.json();
    
    // Validate required fields
    if (!data.product_id || !data.expiry_date) {
      return NextResponse.json({ error: 'Product ID and expiry date are required' }, { status: 400 });
    }
    
    // Create the expiry item
    const expiryItem = await databaseService.createExpiryItem({
      user_id: userId,
      product_id: data.product_id,
      expiry_date: data.expiry_date,
      quantity: data.quantity || 1,
      notes: data.notes || '',
    });
    
    return NextResponse.json({ expiryItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating expiry item:', error);
    return NextResponse.json({ error: 'Failed to create expiry item' }, { status: 500 });
  }
}
