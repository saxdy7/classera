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

// PATCH /api/projects/[id] - Update project details
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Check if user is the project creator
        const { data: project, error: getError } = await supabase
            .from('projects')
            .select('created_by')
            .eq('id', id)
            .single();

        if (getError || !project || project.created_by !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update project
        const { data: updated, error } = await supabase
            .from('projects')
            .update({
                title: body.title,
                description: body.description,
                tech_stack: body.tech_stack,
                github_repo_url: body.github_repo_url,
                live_url: body.live_url,
                additional_notes: body.additional_notes,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(updated);

    } catch (error: any) {
        console.error('Error updating project:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update project' },
            { status: 500 }
        );
    }
}
