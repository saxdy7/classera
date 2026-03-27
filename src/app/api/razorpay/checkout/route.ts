import { razorpay } from '@/lib/razorpay';
import { getTokenPackage } from '@/lib/tokens';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    const pkg = getTokenPackage(packageId);
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are missing');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get token from Authorization header if present
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // If no token, return 401
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized. Please login again.' }, { status: 401 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Session expired. Please login again.' }, { status: 401 });
    }

    // Amount is in paise
    const options = {
      amount: pkg.price, 
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: user.id,
        packageId: packageId,
        tokens: pkg.tokens.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ 
      orderId: order.id, 
      amount: options.amount, 
      currency: options.currency 
    });
  } catch (error: any) {
    console.error('Checkout API error:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || 'Failed to create checkout session' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
