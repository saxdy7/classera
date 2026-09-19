import Razorpay from 'razorpay';

/**
 * Lazily construct the Razorpay client.
 *
 * This used to read the env vars and `throw` at module scope. Because the two
 * /api/razorpay routes import this file, that throw fired while Next collected
 * page data during `next build` - so a missing *optional* payment credential
 * failed the entire build, not just the payment routes.
 *
 * Deferring to call time follows the same shape as `createAdminClient()` in
 * `src/lib/supabase/admin.ts`: the app builds and boots without Razorpay
 * configured, and only an actual request to a payment route errors out.
 */
let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (client) return client;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required');
  }

  client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return client;
}
