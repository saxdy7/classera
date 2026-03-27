import { useEffect, useState } from 'react';
import { useAuth } from '@supabase/auth-helpers-react';

export interface CreditsData {
  balance: number;
  updatedAt: string;
  transactions: Array<{
    type: 'purchase' | 'usage' | 'refund' | 'admin_adjustment';
    amount: number;
    balance_after: number;
    description: string;
    created_at: string;
  }>;
}

export function useCredits() {
  const { session } = useAuth();
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetch, setRefetch] = useState(0);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/credits', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch credits');
        }

        const data = await response.json();
        setCredits(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [session?.access_token, refetch]);

  return {
    credits,
    loading,
    error,
    balance: credits?.balance ?? 0,
    refresh: () => setRefetch((prev) => prev + 1),
  };
}
