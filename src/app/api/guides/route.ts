import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/guides - Fetch all guides with optional filters
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        const difficulty = searchParams.get('difficulty');
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        let query = supabase
            .from('guides')
            .select(`
                id,
                title,
                slug,
                excerpt,
                difficulty,
                category,
                tags,
                reading_time_minutes,
                views,
                likes,
                created_at,
                author:users!guides_author_id_fkey(id, full_name, avatar_url)
            `)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (difficulty && difficulty !== 'all') {
            query = query.eq('difficulty', difficulty);
        }
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }
        if (search) {
            query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
        }

        const { data: guides, error } = await query;
        if (error) throw error;

        return NextResponse.json({ guides: guides || [] });

    } catch (error: any) {
        console.error('Error fetching guides:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch guides' },
            { status: 500 }
        );
    }
}

// POST /api/guides - Create new guide
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            title,
            content,
            topic,
            difficulty = 'beginner',
            category,
            tags = [],
            ai_generated = false
        } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Missing required fields: title, content' },
                { status: 400 }
            );
        }

        // Generate slug
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(7);

        // Extract excerpt (first 200 chars)
        const excerpt = content.substring(0, 200).replace(/[#*`]/g, '') + '...';

        // Estimate reading time (200 words per minute)
        const wordCount = content.split(/\s+/).length;
        const reading_time_minutes = Math.ceil(wordCount / 200);

        // Use Admin Client to bypass RLS
        const supabaseAdmin = createAdminClient();

        const { data: guide, error } = await supabaseAdmin
            .from('guides')
            .insert({
                title,
                slug,
                content,
                excerpt,
                difficulty,
                category: category || topic || 'General',
                tags,
                author_id: user.id,
                reading_time_minutes,
                is_published: true
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ guide }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating guide:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create guide' },
            { status: 500 }
        );
    }
}
