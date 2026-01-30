import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/planner/complete-task - Mark a task as complete
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { task_id, actual_minutes, notes } = body;

        if (!task_id) {
            return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
        }

        // Update task
        const { data: task, error: taskError } = await supabase
            .from('plan_tasks')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                actual_minutes: actual_minutes || null,
                notes: notes || null
            })
            .eq('id', task_id)
            .select()
            .single();

        if (taskError) throw taskError;

        // Update roadmap progress if task has a node
        if (task.node_id) {
            const { data: progress } = await supabase
                .from('roadmap_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('node_id', task.node_id)
                .single();

            if (progress && progress.status !== 'completed') {
                await supabase
                    .from('roadmap_progress')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        time_spent_minutes: (progress.time_spent_minutes || 0) + (actual_minutes || 0)
                    })
                    .eq('id', progress.id);
            }
        }

        return NextResponse.json({
            task,
            message: 'Task completed successfully!'
        });

    } catch (error: any) {
        console.error('Error completing task:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to complete task' },
            { status: 500 }
        );
    }
}
