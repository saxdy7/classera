-- ============================================
-- AI Token System Tables
-- ============================================

-- Create ai_tool_tokens table for user token balances
CREATE TABLE IF NOT EXISTS public.ai_tool_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 5, -- 5 free tokens initially
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create ai_token_transactions table for audit trail
CREATE TABLE IF NOT EXISTS public.ai_token_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'purchase', 'usage', 'refund', 'admin_adjustment'
  amount INTEGER NOT NULL, -- positive for credit, negative for debit
  balance_after INTEGER NOT NULL,
  description TEXT,
  stripe_session_id VARCHAR(255),
  ai_tool_id VARCHAR(255), -- which AI tool was used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_tool_tokens_user_id ON public.ai_tool_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_token_transactions_user_id ON public.ai_token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_token_transactions_created_at ON public.ai_token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_token_transactions_stripe_session ON public.ai_token_transactions(stripe_session_id);

-- Enable Row Level Security
ALTER TABLE public.ai_tool_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_token_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own token data
DROP POLICY IF EXISTS "Users can view their own token balance" ON public.ai_tool_tokens;
CREATE POLICY "Users can view their own token balance"
  ON public.ai_tool_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own token transactions" ON public.ai_token_transactions;
CREATE POLICY "Users can view their own token transactions"
  ON public.ai_token_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can do anything (for webhooks)
DROP POLICY IF EXISTS "Service role can manage token data" ON public.ai_tool_tokens;
CREATE POLICY "Service role can manage token data"
  ON public.ai_tool_tokens
  FOR ALL
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "Service role can manage token transactions" ON public.ai_token_transactions;
CREATE POLICY "Service role can manage token transactions"
  ON public.ai_token_transactions
  FOR ALL
  TO service_role
  USING (true);

-- Create function to deduct tokens (used by AI tools)
CREATE OR REPLACE FUNCTION deduct_ai_tokens(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, message TEXT) AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM ai_tool_tokens
  WHERE user_id = p_user_id;

  -- If no record exists, user gets 5 free tokens
  IF v_current_balance IS NULL THEN
    INSERT INTO ai_tool_tokens (user_id, balance)
    VALUES (p_user_id, 5);
    v_current_balance := 5;
  END IF;

  -- Check if user has enough tokens
  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT false, v_current_balance, 'Insufficient tokens'::TEXT;
  ELSE
    -- Deduct tokens
    UPDATE ai_tool_tokens
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Record transaction
    INSERT INTO ai_token_transactions (user_id, type, amount, balance_after, description)
    VALUES (p_user_id, 'usage', -p_amount, v_current_balance - p_amount, 'AI tool usage');

    RETURN QUERY SELECT true, v_current_balance - p_amount, 'Tokens deducted successfully'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to add bonus tokens (for referrals, etc.)
CREATE OR REPLACE FUNCTION add_bonus_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Bonus tokens'
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER) AS $$
BEGIN
  -- Ensure record exists
  INSERT INTO ai_tool_tokens (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = ai_tool_tokens.balance + p_amount,
      updated_at = NOW();

  -- Record transaction
  INSERT INTO ai_token_transactions (user_id, type, amount, balance_after, description)
  VALUES (
    p_user_id,
    'admin_adjustment',
    p_amount,
    (SELECT balance FROM ai_tool_tokens WHERE user_id = p_user_id),
    p_description
  );

  RETURN QUERY SELECT true, (SELECT balance FROM ai_tool_tokens WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION deduct_ai_tokens(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_bonus_tokens(UUID, INTEGER, TEXT) TO authenticated;
