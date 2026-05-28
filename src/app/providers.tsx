'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createClient } from '@/lib/supabase/client';

// Create a client for each user request to avoid cross-request state pollution
// https://tanstack.com/query/latest/docs/framework/react/ssr
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default stale time
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      },
    },
  });
}

let clientQueryClientInstance: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient();
  } else {
    // Browser: make a query client once and reuse it
    if (!clientQueryClientInstance) clientQueryClientInstance = createQueryClient();
    return clientQueryClientInstance;
  }
}

// Simple hook to get the current user from Supabase
export function useSession() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Failed to get user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  return { user, loading };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
