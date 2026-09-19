'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[rgba(239,68,68,0.12)]">
      <div className="max-w-md w-full bg-[var(--cl-surface-card)] rounded-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[rgba(239,68,68,0.12)] rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-[var(--cl-error)]" />
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-[var(--cl-ink)] mb-4">
          Something went wrong!
        </h2>

        <p className="text-[var(--cl-body)] mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="text-xs text-[var(--cl-muted)] mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <Button onClick={reset} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
