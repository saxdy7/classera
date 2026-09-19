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
      <div className="min-h-screen p-8 bg-[rgba(239,68,68,0.12)]">
        <div className="max-w-md mx-auto bg-[var(--cl-surface-card)] rounded-lg p-8 text-center">
          <h1 className="text-2xl font-semibold text-[var(--cl-error)] mb-4">❌ Access Denied</h1>
          <p className="text-[var(--cl-body)]">Test endpoints are not available in production.</p>
          <Link
            href="/"
            className="mt-6 inline-block px-6 py-2 bg-[var(--cl-info)] text-[var(--cl-on-dark)] rounded-lg hover:bg-[var(--cl-info)]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-[rgba(13,116,206,0.12)]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-[var(--cl-surface-card)] rounded-lg p-8 mb-6">
          <h1 className="text-3xl font-semibold text-[var(--cl-ink)] mb-2">⚡ AI Token Grant Tool</h1>
          <p className="text-[var(--cl-body)]">Development/Testing Mode - Grant yourself AI tokens for testing</p>
        </div>

        {/* Grant Form */}
        <div className="bg-[var(--cl-surface-card)] rounded-lg p-8 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--cl-body)] mb-2">
              Tokens to Grant
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-[var(--cl-hairline-strong)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cl-info)] disabled:bg-[var(--cl-canvas-soft)]"
                placeholder="100"
              />
              <button
                onClick={handleGrant}
                disabled={loading}
                className="px-6 py-2 bg-[var(--cl-info)] text-[var(--cl-on-dark)] rounded-lg hover:bg-[var(--cl-info)] disabled:bg-[var(--cl-surface-strong)] font-medium transition"
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
                className="px-4 py-2 bg-[var(--cl-surface-strong)] hover:bg-[var(--cl-surface-strong)] rounded-lg text-sm font-medium transition"
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Success Result */}
        {result && (
          <div className="bg-[rgba(22,163,74,0.12)] border border-[var(--cl-success)] rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-[var(--cl-success)] mb-2">✅ Success!</h3>
            <div className="space-y-2 text-sm text-[var(--cl-success)]">
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
          <div className="bg-[rgba(239,68,68,0.12)] border border-[var(--cl-error)] rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-[var(--cl-error)] mb-2">❌ Error</h3>
            <p className="text-sm text-[var(--cl-error)]">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-[rgba(13,116,206,0.12)] border border-[var(--cl-info)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--cl-info)] mb-3">📚 Alternative Methods</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-[var(--cl-info)]">1. Via Script (bun):</p>
              <pre className="bg-[var(--cl-surface-inverse)] text-[var(--cl-muted-soft)] p-3 rounded mt-1 text-xs overflow-x-auto">
                bun grant-tokens.ts user@example.com 100
              </pre>
            </div>
            <div>
              <p className="font-medium text-[var(--cl-info)]">2. Via cURL:</p>
              <pre className="bg-[var(--cl-surface-inverse)] text-[var(--cl-muted-soft)] p-3 rounded mt-1 text-xs overflow-x-auto">
                curl -X POST http://localhost:3000/api/test/grant-tokens \
  -H "Content-Type: application/json" \
  -d '{"'{amount: 100}"}'
              </pre>
            </div>
            <div>
              <p className="font-medium text-[var(--cl-info)]">3. Via JavaScript:</p>
              <pre className="bg-[var(--cl-surface-inverse)] text-[var(--cl-muted-soft)] p-3 rounded mt-1 text-xs overflow-x-auto">
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
          <Link href="/" className="text-[var(--cl-info)] hover:text-[var(--cl-info)] font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
