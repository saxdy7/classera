import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/skills - List all skills
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;

        const category = searchParams.get('category');
        const search = searchParams.get('search');

        let query = supabase
            .from('skills')
            .select('*')
            .order('category', { ascending: true })
            .order('difficulty_level', { ascending: true });

        if (category) query = query.eq('category', category);
        if (search) query = query.ilike('name', `%${search}%`);

        const { data: skills, error } = await query;

        if (error) throw error;

        // Group by category
        const grouped = skills?.reduce((acc: any, skill) => {
            if (!acc[skill.category]) {
                acc[skill.category] = [];
            }
            acc[skill.category].push(skill);
            return acc;
        }, {});

        return NextResponse.json({
            skills: skills || [],
            grouped: grouped || {},
            categories: Object.keys(grouped || {})
        });

    } catch (error: any) {
        console.error('Error fetching skills:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch skills' },
            { status: 500 }
        );
    }
}
