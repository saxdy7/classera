import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // Mock endpoint for saving preferences
    // In a real app, this would upsert to 'notification_preferences' table
    return NextResponse.json({ success: true });
}
