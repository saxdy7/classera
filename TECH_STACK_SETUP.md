# Tech Stack Implementation Guide

This document outlines all the new services installed and configured for Classera.

## 📦 Installed Packages

### Data Fetching & Caching
- **@tanstack/react-query** (v5.95.2) - Client-side data fetching and caching
- **@tanstack/react-query-devtools** - DevTools for debugging React Query
- **@upstash/redis** (v1.37.0) - Redis client for Upstash

### Background Jobs & Tasks
- **inngest** (v4.1.0) - Reliable background job processing

### Payments & Tokens
- **stripe** (v21.0.0) - Payment processing for AI tool tokens

### Security & Rate Limiting
- **arcjet** (v1.3.0) - API rate limiting and DDoS protection

---

## 🔧 Configuration Required

### 1. **Upstash Redis** (Optional but recommended)
**Purpose:** Cache community feed data, user sessions, hot data

**Setup:**
1. Go to https://console.upstash.com/redis
2. Create a new Redis database
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.local`

**Features:**
- Community post feed caching (5 min TTL)
- User session data caching (30 min TTL)
- Automatic cache invalidation on new posts/comments
- See: `src/lib/redis.ts`

### 2. **Inngest** (For notifications)
**Purpose:** Reliable background jobs for notifications, mentions, cleanup

**Setup:**
1. Go to https://app.inngest.com
2. Create a new app
3. Copy event key to `.env.local`

**Implemented Functions:**
- `mention-notification` - Triggered when user is @mentioned
- `new-post-notification` - Triggered when new post in community
- `new-comment-notification` - Triggered when comment on your post

**API Endpoint:** `POST /api/inngest` (auto-configured)

**Usage in routes:**
```typescript
import { inngest } from '@/inngest/client';

// Trigger a notification
await inngest.send({
  name: 'community/mention.created',
  data: {
    mentionedUserId: 'user-123',
    postId: 'post-456',
    mentionedByUserId: 'user-789',
  },
});
```

### 3. **Stripe** (For AI token payments)
**Purpose:** Monetize AI tools with token-based payment system

**Setup:**
1. Go to https://dashboard.stripe.com/apikeys
2. Copy `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` to `.env.local`
3. Set up webhook in Stripe dashboard:
   - Event types to listen: `checkout.session.completed`, `payment_intent.payment_failed`
   - Endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`

**Token Packages:**
- 10 tokens: $2.99
- 50 tokens: $9.99 (20% bonus)
- 100 tokens: $17.99 (10% bonus)
- 500 tokens: $79.99 (11% bonus)

**Components/Usage:**
- Create checkout: `src/app/api/stripe/checkout` (POST)
- Handle payments: `src/app/api/stripe/webhook` (POST)
- Deduct tokens: `deduct_ai_tokens()` RPC function
- React hook: `useCreateCheckoutSession()` in `useAITokens.ts`

**Database Schema:**
```
ai_tool_tokens:
  - user_id (PK)
  - balance (current token count)
  - created_at, updated_at

ai_token_transactions:
  - id (PK)
  - user_id (FK)
  - type ('purchase', 'usage', 'refund')
  - amount (+ or -)
  - balance_after
  - stripe_session_id
  - created_at
```

### 4. **Arcjet** (Rate limiting & security)
**Purpose:** Prevent abuse, DDoS protection, enforce rate limits

**Setup:**
1. Go to https://app.arcjet.com
2. Create a new site/project
3. Copy `ARCJET_KEY` to `.env.local`

**Default Rate Limits:**
- Community posts: 5 per hour per user
- Community comments: 10 per hour per user
- Community messages: 20 per hour per user
- AI tool calls: 50 per hour per user
- Stripe checkouts: 2 per hour per user

**Implementation:**
See `src/lib/arcjet.ts` and integration in your API routes.

---

## 🎯 React Query Integration

### Setup (Already Done)
- React Query provider in `src/app/providers.tsx`
- Wrapped RootLayout with `<Providers>` component
- Dev tools available in development mode

### Custom Hooks

**AI Token Management:**
```typescript
import { useAITokenBalance, useCreateCheckoutSession, useDeductTokens } from '@/hooks/useAITokens';

// Get user's token balance
const { data: tokenData } = useAITokenBalance(userId);

// Create checkout session
const { mutate: checkout } = useCreateCheckoutSession();
const handleBuyTokens = () => checkout('tokens-50');

// Deduct tokens when using AI tool
const { mutate: deductTokens } = useDeductTokens();
```

**Community Data:**
```typescript
import { useCommunityPostsFeed, useCommunityPostComments, useCreatePost } from '@/hooks/useCommunityQuery';

// Fetch paginated feed
const { data, fetchNextPage } = useCommunityPostsFeed(communityId);

// Fetch comments
const { data: comments } = useCommunityPostComments(postId);

// Create post
const { mutate: createPost } = useCreatePost(communityId);
createPost({ title: 'New Post', content: 'Content here' });
```

---

## 🗄️ Database Migrations

### Applied
1. `004_FIX_COMMUNITY_POSTS_RLS.sql` - Community feature RLS policies
2. `005_ADD_AI_TOKEN_SYSTEM.sql` - AI token tables and functions

### To Deploy
Run `supabase db push` to apply migration 005 to your database.

---

## 🚀 Next Steps (Optional Enhancements)

1. **Implement Redis Caching**
   - Configure Upstash Redis in `.env.local`
   - Caching automatically activates when configured

2. **Enable Inngest Notifications**
   - Configure Inngest event key in `.env.local`
   - Add event triggers in API routes (see examples below)

3. **Deploy Stripe Integration**
   - Configure Stripe keys in `.env.local`
   - Set up webhook in Stripe dashboard
   - Deploy migration 005 to activate token system

4. **Test Rate Limiting**
   - Configure Arcjet key in `.env.local`
   - Test with: `cur https://yourdomain.com/api/stripe/checkout` (rapid requests)

---

## 📊 Monitoring & Debugging

### React Query DevTools
Available in dev mode (bottom-right corner).

### Stripe Dashboard
https://dashboard.stripe.com/payments - View all transactions

### Inngest Dashboard
https://app.inngest.com - Monitor background jobs

### Upstash Redis Console
https://console.upstash.com/redis - View cache stats

### Arcjet Dashboard
https://app.arcjet.com - Monitor rate limits and attacks

---

## 🔐 Environment Variables Checklist

```bash
# Required for Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional but recommended
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
INNGEST_EVENT_KEY=...
ARCJET_KEY=...
```

---

## 💡 Common Tasks

### Manually add tokens to user
```typescript
// In a server action or API route
import { supabase } from '@/lib/supabase/server';

await supabase.rpc('add_bonus_tokens', {
  p_user_id: 'user-123',
  p_amount: 10,
  p_description: 'Referral bonus'
});
```

### Check user token balance
```typescript
const { data } = await supabase
  .from('ai_tool_tokens')
  .select('*')
  .eq('user_id', userId)
  .single();

console.log(data.balance); // Current token balance
```

### View token transactions
```typescript
const { data } = await supabase
  .from('ai_token_transactions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

---

## ⚠️ Important Notes

- **Redis caching is optional** - If not configured, app works fine without it
- **Inngest is optional** - Notifications can still be sent synchronously
- **Stripe webhook** - Must be publicly accessible for payments to work
- **Rate limits** - Can be adjusted in `src/lib/arcjet.ts`
- **Free tokens** - Users get 5 free AI tokens on signup (hardcoded in migration)

---

## Support & Troubleshooting

**Stripe payments not working?**
- Check webhook endpoint is public
- Verify webhook secret in `.env.local`
- Check Stripe dashboard for failed events

**Redis not caching?**
- Check `UPSTASH_REDIS_REST_URL` is set
- Check logs for Redis connection errors
- Caching will silently fail if not configured

**Inngest jobs not running?**
- Check event key in `.env.local`
- Verify function definitions in `src/inngest/functions.ts`
- Check Inngest dashboard for job status

**Rate limiting too strict?**
- Adjust limits in `src/lib/arcjet.ts`
- User limits are per-IP by default
