import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;

        const difficulty = searchParams.get('difficulty');
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        let query = supabase
            .from('projects')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (difficulty) query = query.eq('difficulty', difficulty);
        if (category) query = query.eq('category', category);
        if (search) query = query.ilike('title', `%${search}%`);

        const { data: projects, error } = await query;

        if (error) throw error;

        return NextResponse.json({ projects: projects || [] });

    } catch (error: any) {
        console.error('Error fetching projects:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch projects' },
            { status: 500 }
        );
    }
}

// POST /api/projects - Create new project (mentor only)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userData?.role !== 'mentor') {
            return NextResponse.json({ error: 'Only mentors can create projects' }, { status: 403 });
        }

        const body = await request.json();
        const { title, description, difficulty, category, estimated_hours, tags } = body;

        if (!title || !difficulty) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const { data: project, error } = await supabase
            .from('projects')
            .insert({
                title,
                slug,
                description,
                difficulty,
                category,
                estimated_hours,
                tags: tags || [],
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ project }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating project:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create project' },
            { status: 500 }
        );
    }
}
