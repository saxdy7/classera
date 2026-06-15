import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase service role configuration is missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token to verify identity
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error('RAZORPAY_KEY_SECRET environment variable is required');
    }
    
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Fetch order details to know how many tokens to add
      const order = await razorpay.orders.fetch(razorpay_order_id);
      
      if (!order || !order.notes) {
          return NextResponse.json({ error: 'Order not found or missing notes' }, { status: 404 });
      }

      const userIdFromNote = order.notes.userId as string;
      const tokens = parseInt(order.notes.tokens as string);
      
      // Ensure the order belongs to the user who is verifying it
      if (userIdFromNote !== user.id) {
          return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 });
      }

      // Check if this order was already processed to prevent duplicate credits
      const { data: existingTx } = await supabase
        .from('ai_token_transactions')
        .select('*')
        .eq('stripe_session_id', razorpay_order_id)
        .maybeSingle(); // maybeSingle doesn't throw if no row found
        
      if (existingTx) {
          console.log(`[Razorpay Verify] Order ${razorpay_order_id} already processed. Skipping.`);
          return NextResponse.json({ success: true, message: 'Already processed' });
      }

      // Use the SECURITY DEFINER RPC to add tokens safely
      console.log(`[Razorpay Verify] Adding ${tokens} credits for user ${user.id}`);
      const { data: rpcData, error: rpcError } = await supabase.rpc('add_bonus_tokens', {
          p_user_id: user.id,
          p_amount: tokens,
          p_description: `Razorpay Purchase: ${razorpay_order_id}`
      });

      if (rpcError) {
          console.error('[Razorpay Verify] RPC Error:', rpcError);
          throw new Error('Failed to update balance via RPC: ' + rpcError.message);
      }
      
      // Update the transaction record with the razorpay order id so we don't double count next time
      // The add_bonus_tokens RPC already adds a transaction record, but it might not set stripe_session_id.
      // Let's manually update that transaction or just rely on the RPC.
      // Actually, my RPC (Step 514) doesn't accept stripe_session_id.
      // I will update the RPC-created transaction to include the order ID.
      await supabase
        .from('ai_token_transactions')
        .update({ stripe_session_id: razorpay_order_id })
        .eq('user_id', user.id)
        .eq('stripe_session_id', null) // Target the one we just created
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('[Razorpay Verify] Success!');
      return NextResponse.json({ success: true });
    } else {
      console.warn('[Razorpay Verify] Invalid signature for order:', razorpay_order_id);
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Razorpay Verify API error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: err?.message || 'Verification failed' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
