/**
 * API Route: Grant Test Tokens (Development Only)
 * 
 * This endpoint is ONLY available in development/offline mode for testing.
 * 
 * POST /api/test/grant-tokens
 * Body: { amount: 100 }
 * 
 * Example:
 * curl -X POST http://localhost:3000/api/test/grant-tokens \
 *   -H "Content-Type: application/json" \
 *   -d '{"amount": 100}'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoints are not available in production' },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const amount = body.amount || 100;

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be positive number.' },
        { status: 400 }
      );
    }

    // Grant tokens via RPC
    const { data, error } = await supabase.rpc('add_bonus_tokens', {
      p_user_id: user.id,
      p_amount: amount,
      p_description: `Test grant via API: +${amount} tokens`,
    });

    if (error) {
      console.error('Token grant error:', error);
      return NextResponse.json(
        { error: `Failed to grant tokens: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Granted ${amount} tokens to ${user.email}`,
      newBalance: data?.[0]?.new_balance,
      userId: user.id,
      userEmail: user.email,
    });
  } catch (error: any) {
    console.error('Grant tokens error:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoints are not available in production' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    info: 'Test Token Grant Endpoint (Development Only)',
    usage: 'POST /api/test/grant-tokens with body { amount: 100 }',
    examples: {
      curl: 'curl -X POST http://localhost:3000/api/test/grant-tokens -H "Content-Type: application/json" -d \'{"amount": 100}\'',
      fetch:
        'fetch("/api/test/grant-tokens", { method: "POST", body: JSON.stringify({ amount: 100 }) })',
    },
  });
}
