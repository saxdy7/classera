'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Fetch token balance
export function useAITokenBalance(userId: string) {
  return useQuery({
    queryKey: ['ai-tokens', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('ai_tool_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found
        throw error;
      }

      return data || { user_id: userId, balance: 5 }; // 5 free tokens initially
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch token transaction history
export function useTokenTransactionHistory(userId: string) {
  return useQuery({
    queryKey: ['token-transactions', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('ai_token_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create checkout session
export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (packageId: string) => {
      const response = await fetch('/api/razorpay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      return response.json();
    },
    // onSuccess logic is now moved to CreditsDisplay.tsx where we trigger the Razorpay popup
  });
}

// Deduct tokens from user balance (for AI tool usage)
export function useDeductTokens() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const { data, error } = await supabase.rpc('deduct_ai_tokens', {
        p_user_id: userId,
        p_amount: amount,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate token balance cache
      queryClient.invalidateQueries({ queryKey: ['ai-tokens', variables.userId] });
      // Invalidate transaction history
      queryClient.invalidateQueries({ queryKey: ['token-transactions', variables.userId] });
    },
  });
}

// Check if user has enough tokens
export function useHasTokens(userId: string, required: number = 1) {
  const { data: tokenData } = useAITokenBalance(userId);
  return (tokenData?.balance || 0) >= required;
}
