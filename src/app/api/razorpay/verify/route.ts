import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(request.headers.get('authorization')?.replace('Bearer ', '') || '');

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || '2YxWmjow6x17AdLTnyH7g42b';
    
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Fetch order details to know how many tokens to add
      const order = await razorpay.orders.fetch(razorpay_order_id);
      
      if (!order || !order.notes) {
         return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const userId = order.notes.userId as string;
      const tokens = parseInt(order.notes.tokens as string);
      
      // Prevent granting tokens twice for the same order
      // Using stripe_session_id to store razorpay_order_id without altering DB
      const { data: existingTx } = await supabase
        .from('ai_token_transactions')
        .select('*')
        .eq('stripe_session_id', razorpay_order_id)
        .single();
        
      if (existingTx) {
          return NextResponse.json({ success: true, message: 'Already processed' });
      }

      const { data: existingRec } = await supabase
        .from('ai_tool_tokens')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const currentBalance = existingRec?.balance || 0;
      const newBalance = currentBalance + tokens;

      const { error: updateError } = await supabase
        .from('ai_tool_tokens')
        .upsert({
          user_id: userId,
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error('Failed to update balance');
      }

      await supabase.from('ai_token_transactions').insert({
        user_id: userId,
        type: 'purchase',
        amount: tokens,
        balance_after: newBalance,
        stripe_session_id: razorpay_order_id, 
      });
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
