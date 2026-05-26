#!/usr/bin/env node
/**
 * Test Helper: Grant AI Tool Tokens
 * Usage: bun grant-tokens.ts <user-id> [amount]
 * 
 * Examples:
 *   bun grant-tokens.ts user@email.com 100
 *   bun grant-tokens.ts 550e8400-e29b-41d4-a716-446655440000 50
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function grantTokens() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
📋 Usage: bun grant-tokens.ts <user-id-or-email> [amount]

Examples:
  bun grant-tokens.ts user@example.com 100
  bun grant-tokens.ts 550e8400-e29b-41d4-a716-446655440000 50

Default amount: 100 tokens
    `);
    process.exit(0);
  }

  const userIdentifier = args[0];
  const amount = args[1] ? parseInt(args[1], 10) : 100;

  if (isNaN(amount) || amount <= 0) {
    console.error('❌ Amount must be a positive number');
    process.exit(1);
  }

  try {
    console.log(`⏳ Granting ${amount} tokens to ${userIdentifier}...`);

    // First, try to find the user
    let userId = userIdentifier;

    // If it looks like an email, find the user ID
    if (userIdentifier.includes('@')) {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;

      const user = data.users.find((u) => u.email === userIdentifier);
      if (!user) {
        console.error(`❌ User not found: ${userIdentifier}`);
        process.exit(1);
      }
      userId = user.id;
      console.log(`✅ Found user: ${userIdentifier} (ID: ${userId})`);
    }

    // Call the add_bonus_tokens RPC function
    const { data, error } = await supabase.rpc('add_bonus_tokens', {
      p_user_id: userId,
      p_amount: amount,
      p_description: `Test grant: +${amount} tokens for development/testing`,
    });

    if (error) {
      console.error('❌ Error granting tokens:', error.message);
      process.exit(1);
    }

    console.log(`✅ Successfully granted ${amount} tokens!`);
    console.log(`📊 New balance: ${data?.[0]?.new_balance || 'unknown'} tokens`);
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

grantTokens();
