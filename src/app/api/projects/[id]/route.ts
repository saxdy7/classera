import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects/[id] - Get project details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const supabase = await createClient();

        const { data: project, error } = await supabase
            .from('projects')
            .select(`
                *,
                creator:users!projects_created_by_fkey(id, full_name, avatar_url)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Get user's submission if authenticated
        const { data: { user } } = await supabase.auth.getUser();
        let userSubmission = null;

        if (user) {
            const { data: submission } = await supabase
                .from('project_submissions')
                .select('*')
                .eq('user_id', user.id)
                .eq('project_id', id)
                .order('submitted_at', { ascending: false })
                .limit(1)
                .single();

            userSubmission = submission;
        }

        return NextResponse.json({
            project,
            userSubmission
        });

    } catch (error: any) {
        console.error('Error fetching project:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch project' },
            { status: 500 }
        );
    }
}
