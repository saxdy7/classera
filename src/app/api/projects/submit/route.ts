import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/projects/submit - Submit a project
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            project_id,
            github_url,
            demo_url,
            description
        } = body;

        if (!project_id || !github_url) {
            return NextResponse.json(
                { error: 'project_id and github_url are required' },
                { status: 400 }
            );
        }

        // Create submission
        const { data: submission, error } = await supabase
            .from('project_submissions')
            .insert({
                user_id: user.id,
                project_id,
                github_url,
                demo_url,
                description,
                status: 'submitted'
            })
            .select()
            .single();

        if (error) throw error;

        // Update project submission count
        const { data: project } = await supabase
            .from('projects')
            .select('total_submissions')
            .eq('id', project_id)
            .single();

        if (project) {
            await supabase
                .from('projects')
                .update({ total_submissions: (project.total_submissions || 0) + 1 })
                .eq('id', project_id);
        }

        return NextResponse.json({
            submission,
            message: 'Project submitted successfully!'
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error submitting project:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to submit project' },
            { status: 500 }
        );
    }
}
