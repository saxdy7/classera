import { razorpay, getTokenPackage } from '@/lib/razorpay';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import arcjet, { razorpayCheckoutRateLimit } from '@/lib/arcjet';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const decision = await arcjet.protect(request, {
      rate: razorpayCheckoutRateLimit,
    });

    if (decision.isDenied()) {
      return NextResponse.json(
        { error: 'Too many checkout requests. Please try again later.' },
        { status: 429 },
      );
    }

    const { packageId } = await request.json();

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    const pkg = getTokenPackage(packageId);
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(request.headers.get('authorization')?.replace('Bearer ', '') || '');

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Amount should be multiplied by 100 for Razorpay, meaning paise.
    const options = {
      amount: pkg.price * 100, 
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: user.id,
        packageId: packageId,
        tokens: pkg.tokens.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ orderId: order.id, amount: options.amount, currency: options.currency });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
