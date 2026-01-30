import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/planner/today - Get today's tasks
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date().toISOString().split('T')[0];

        // Get active learning plan
        const { data: plan } = await supabase
            .from('learning_plans')
            .select('id, roadmap_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (!plan) {
            return NextResponse.json({
                tasks: [],
                message: 'No active learning plan'
            });
        }

        // Get today's tasks
        const { data: tasks, error: tasksError } = await supabase
            .from('plan_tasks')
            .select(`
                *,
                node:roadmap_nodes(
                    id,
                    title,
                    description,
                    node_type,
                    resources
                )
            `)
            .eq('plan_id', plan.id)
            .eq('scheduled_date', today)
            .order('priority', { ascending: false });

        if (tasksError) throw tasksError;

        // Get overdue tasks
        const { data: overdueTasks } = await supabase
            .from('plan_tasks')
            .select('*')
            .eq('plan_id', plan.id)
            .lt('scheduled_date', today)
            .neq('status', 'completed')
            .neq('status', 'skipped');

        // Calculate daily stats
        const totalTasks = tasks?.length || 0;
        const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
        const totalMinutes = tasks?.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0) || 0;
        const completedMinutes = tasks?.filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + (t.actual_minutes || t.estimated_minutes || 0), 0) || 0;

        return NextResponse.json({
            tasks: tasks || [],
            overdueTasks: overdueTasks || [],
            stats: {
                totalTasks,
                completedTasks,
                pendingTasks: totalTasks - completedTasks,
                totalMinutes,
                completedMinutes,
                progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            }
        });

    } catch (error: any) {
        console.error('Error fetching today\'s tasks:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch tasks' },
            { status: 500 }
        );
    }
}
