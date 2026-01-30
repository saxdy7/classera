import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        const msg = '❌ CRITICAL CONFIG ERROR: NEXT_PUBLIC_SUPABASE_URL is missing in process.env';
        console.error(msg);
        throw new Error(msg);
    }
    if (!serviceRoleKey) {
        const msg = '❌ CRITICAL CONFIG ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in process.env. Please add it to .env.local and RESTART the server.';
        console.error(msg);
        throw new Error(msg);
    }

    return createClient(
        supabaseUrl,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}
