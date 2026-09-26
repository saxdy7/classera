/**
 * Test Page: AI Token Grant UI
 * Available at /test/tokens (development only)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function GrantTokensPage() {
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGrant = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const numAmount = parseInt(amount, 10);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Amount must be a positive number');
      }

      const response = await fetch('/api/test/grant-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`);
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen p-8 bg-destructive/10">
        <div className="max-w-md mx-auto bg-card rounded-lg p-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground text-destructive mb-4">❌ Access Denied</h1>
          <p className="text-foreground/80">Test endpoints are not available in production.</p>
          <Link
            href="/"
            className="mt-6 inline-block px-6 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-accent-purple/10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-lg p-8 mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">⚡ AI Token Grant Tool</h1>
          <p className="text-foreground/80">Development/Testing Mode - Grant yourself AI tokens for testing</p>
        </div>

        {/* Grant Form */}
        <div className="bg-card rounded-lg p-8 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Tokens to Grant
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cl-info)] disabled:bg-muted/40"
                placeholder="100"
              />
              <button
                onClick={handleGrant}
                disabled={loading}
                className="px-6 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple disabled:bg-muted font-medium transition"
              >
                {loading ? '⏳ Granting...' : '✅ Grant'}
              </button>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="flex gap-2 flex-wrap">
            {[10, 50, 100, 500, 1000].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val.toString())}
                className="px-4 py-2 bg-muted hover:bg-muted rounded-lg text-sm font-medium transition"
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Success Result */}
        {result && (
          <div className="bg-green-500/10 border border-green-600 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-600 mb-2">✅ Success!</h3>
            <div className="space-y-2 text-sm text-green-600">
              <p>
                <strong>Message:</strong> {result.message}
              </p>
              <p>
                <strong>New Balance:</strong> {result.newBalance} tokens
              </p>
              <p>
                <strong>User Email:</strong> {result.userEmail}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">❌ Error</h3>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-accent-purple/10 border border-accent-purple rounded-lg p-6">
          <h3 className="text-lg font-semibold text-accent-purple mb-3">📚 Alternative Methods</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-accent-purple">1. Via Script (bun):</p>
              <pre className="bg-neutral-900 text-muted-foreground/70 p-3 rounded mt-1 text-xs overflow-x-auto">
                bun grant-tokens.ts user@example.com 100
              </pre>
            </div>
            <div>
              <p className="font-medium text-accent-purple">2. Via cURL:</p>
              <pre className="bg-neutral-900 text-muted-foreground/70 p-3 rounded mt-1 text-xs overflow-x-auto">
                curl -X POST http://localhost:3000/api/test/grant-tokens \
  -H "Content-Type: application/json" \
  -d '{"'{amount: 100}"}'
              </pre>
            </div>
            <div>
              <p className="font-medium text-accent-purple">3. Via JavaScript:</p>
              <pre className="bg-neutral-900 text-muted-foreground/70 p-3 rounded mt-1 text-xs overflow-x-auto">
                {`fetch('/api/test/grant-tokens', {
  method: 'POST',
  body: JSON.stringify({ amount: 100 })
})`}
              </pre>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-accent-purple hover:text-accent-purple font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
