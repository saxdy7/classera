'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Plus, Zap } from 'lucide-react';
import { tokenPackages } from '@/lib/tokens';

interface CreditsDisplayProps {
  balance?: number | null;
  onTopUpClick?: () => void;
}

export function CreditsDisplay({ balance, onTopUpClick }: CreditsDisplayProps) {
  const [localBalance, setLocalBalance] = useState<number | null>(balance ?? null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (balance !== undefined && balance !== null) {
      setLocalBalance(balance);
    }
  }, [balance]);

  const handleTopUp = async () => {
    setLoading(true);
    // Redirect to package selection modal
    router.push(`/ai-tools?modal=credits`);
    if (onTopUpClick) {
      onTopUpClick();
    }
    setLoading(false);
  };

  return (
    <Card className="border-[var(--cl-info)] bg-[rgba(13,116,206,0.12)]">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[rgba(13,116,206,0.12)] rounded-lg">
              <Zap className="w-5 h-5 text-[var(--cl-info)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--cl-body)] font-medium">AI Tool Credits</p>
              <p className="text-2xl font-semibold text-[var(--cl-ink)]">
                {localBalance ?? 0}
              </p>
            </div>
          </div>
          <Button
            onClick={handleTopUp}
            disabled={loading}
            className="gap-2 bg-[var(--cl-info)] hover:bg-[var(--cl-info)]"
          >
            <Plus className="w-4 h-4" />
            Top Up
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CreditsModal({ onClose }: { onClose: () => void }) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (packageId: string) => {
    setLoading(true);
    setError(null);

    const res = await loadRazorpayScript();
    if (!res) {
      setError('Razorpay SDK failed to load. Are you online?');
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Create Razorpay order
      const response = await fetch('/api/razorpay/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SVkKpvA0gfDTu1',
        amount: data.amount,
        currency: data.currency,
        name: 'Classera',
        description: 'AI Credits Purchase',
        order_id: data.orderId,
        handler: async function (response: any) {
          // Verify payment
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              window.location.reload();
            } else {
              setError('Payment verification failed');
            }
          } catch (err) {
            setError('Error verifying payment');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#2563eb'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-[var(--cl-ink)] mb-2">Purchase AI Credits</h2>
        <p className="text-[var(--cl-body)]">Choose a package to add more credits to your account</p>
      </div>

      {error && (
        <div className="p-4 bg-[rgba(239,68,68,0.12)] border border-[var(--cl-error)] rounded-lg">
          <p className="text-[var(--cl-error)] text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {tokenPackages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`cursor-pointer transition-all ${
              selectedPackage === pkg.id
                ? 'ring-2 ring-[var(--cl-info)] border-[var(--cl-info)]'
                : 'hover:border-blue-300'
            }`}
            onClick={() => setSelectedPackage(pkg.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-[var(--cl-ink)]">{pkg.tokens}</p>
                  <p className="text-xs text-[var(--cl-muted)]">Credits</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg text-[var(--cl-ink)]">₹{(pkg.price / 100).toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-[var(--cl-body)] line-clamp-2">{pkg.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={() => selectedPackage && handleCheckout(selectedPackage)}
          disabled={!selectedPackage || loading}
          className="flex-1 gap-2 bg-[var(--cl-info)] hover:bg-[var(--cl-info)]"
        >
          <CreditCard className="w-4 h-4" />
          {loading ? 'Processing...' : 'Checkout'}
        </Button>
      </div>
    </div>
  );
}
