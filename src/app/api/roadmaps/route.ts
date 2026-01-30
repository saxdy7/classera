import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/roadmaps - Fetch all roadmaps with optional filters
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Get current user for university filtering
        const { data: { user } } = await supabase.auth.getUser();
        let universityId: string | null = null;

        if (user) {
            const { data: profile } = await supabase
                .from('users')
                .select('university_id')
                .eq('id', user.id)
                .single();
            universityId = profile?.university_id || null;
        }

        // Get filters
        const type = searchParams.get('type');
        const difficulty = searchParams.get('difficulty');
        const search = searchParams.get('search');

        let query = supabase
            .from('roadmaps')
            .select(`
                id,
                title,
                description,
                slug,
                type,
                difficulty,
                total_nodes,
                estimated_weeks,
                tags,
                average_rating,
                views,
                created_at
            `)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        // Apply filters
        if (type && type !== 'all') {
            query = query.eq('type', type);
        }
        if (difficulty && difficulty !== 'all') {
            query = query.eq('difficulty', difficulty);
        }
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data: roadmaps, error } = await query;

        if (error) throw error;

        return NextResponse.json({ roadmaps: roadmaps || [] });

    } catch (error: any) {
        console.error('Error fetching roadmaps:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch roadmaps' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Allow students to create roadmaps (for AI generation)
        // const { data: userData } = await supabase
        //     .from('users')
        //     .select('role')
        //     .eq('id', user.id)
        //     .single();

        // if (userData?.role !== 'mentor') {
        //     return NextResponse.json({ error: 'Only mentors can create roadmaps' }, { status: 403 });
        // }

        const body = await request.json();
        const {
            title,
            description,
            type = 'career',
            difficulty = 'beginner',
            tags,
            estimated_weeks,
            is_premium,
            nodes
        } = body;

        // Validate required fields
        if (!title) {
            return NextResponse.json(
                { error: 'Missing required field: title' },
                { status: 400 }
            );
        }

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(7);

        // Use Admin Client to bypass RLS
        const supabaseAdmin = createAdminClient();

        // 1. Create Roadmap
        const { data: roadmap, error: roadmapError } = await supabaseAdmin
            .from('roadmaps')
            .insert({
                title,
                slug,
                description,
                type,
                difficulty,
                created_by: 'community', // Valid values: 'system', 'mentor', 'community'
                creator_id: user.id,
                tags: tags || [],
                estimated_weeks,
                is_premium: is_premium || false,
                is_published: true
            })
            .select()
            .single();

        if (roadmapError) throw roadmapError;

        // 2. Create Nodes
        if (nodes && nodes.length > 0) {
            const nodesToInsert = nodes.map((node: any, index: number) => ({
                roadmap_id: roadmap.id,
                title: node.title,
                description: node.description,
                detailed_summary: node.detailed_summary || node.description, // Save AI-generated detailed content
                node_type: node.node_type || 'topic',
                estimated_hours: node.estimated_hours || 1,
                resources: node.resources || {},
                order_index: node.order_index || (index + 1),
                position_x: node.position_x || (100 + (index * 150)),
                position_y: node.position_y || 100,
                color: node.color || '#6366f1',
                icon: node.icon || null,
                is_optional: node.is_optional || false
            }));

            const { error: nodesError } = await supabaseAdmin
                .from('roadmap_nodes')
                .insert(nodesToInsert);

            if (nodesError) throw nodesError;
        }

        return NextResponse.json({ roadmap }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating roadmap:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create roadmap' },
            { status: 500 }
        );
    }
}
