import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET user's current credit balance
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user's token balance
    let { data: tokens, error: getError } = await supabase
      .from('ai_tool_tokens')
      .select('balance, updated_at')
      .eq('user_id', user.id)
      .single();

    if (getError && getError.code !== 'PGRST116') {
      throw getError;
    }

    // If user has no token record, create one with 5 free tokens
    if (!tokens) {
      const { data: newTokens, error: insertError } = await supabase
        .from('ai_tool_tokens')
        .insert([{ user_id: user.id, balance: 5 }])
        .select('balance, updated_at')
        .single();

      if (insertError) throw insertError;
      tokens = newTokens;
    }

    // Get transaction history
    const { data: transactions, error: txError } = await supabase
      .from('ai_token_transactions')
      .select('type, amount, balance_after, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (txError) throw txError;

    return NextResponse.json({
      balance: tokens.balance,
      updatedAt: tokens.updated_at,
      transactions: transactions || [],
    });
  } catch (error) {
    console.error('Credits fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch credits' },
      { status: 500 },
    );
  }
}
