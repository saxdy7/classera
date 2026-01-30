import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/planner/my-plan - Get user's active learning plan
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get active learning plan
        const { data: plan, error: planError } = await supabase
            .from('learning_plans')
            .select(`
                *,
                roadmap:roadmaps(
                    id,
                    title,
                    description,
                    type,
                    difficulty,
                    total_nodes,
                    estimated_weeks
                )
            `)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (planError && planError.code !== 'PGRST116') {
            throw planError;
        }

        if (!plan) {
            return NextResponse.json({
                plan: null,
                message: 'No active learning plan found'
            });
        }

        // Get progress for this plan
        const { data: progress } = await supabase
            .from('roadmap_progress')
            .select(`
                *,
                node:roadmap_nodes(*)
            `)
            .eq('user_id', user.id)
            .eq('roadmap_id', plan.roadmap_id);

        // Get upcoming tasks
        const today = new Date().toISOString().split('T')[0];
        const { data: upcomingTasks } = await supabase
            .from('plan_tasks')
            .select('*')
            .eq('plan_id', plan.id)
            .gte('scheduled_date', today)
            .order('scheduled_date', { ascending: true })
            .limit(10);

        // Calculate statistics
        const totalNodes = progress?.length || 0;
        const completedNodes = progress?.filter(p => p.status === 'completed').length || 0;
        const completionPercentage = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

        return NextResponse.json({
            plan: {
                ...plan,
                progress,
                upcomingTasks,
                stats: {
                    totalNodes,
                    completedNodes,
                    completionPercentage,
                    daysActive: Math.ceil((new Date().getTime() - new Date(plan.start_date).getTime()) / (1000 * 60 * 60 * 24))
                }
            }
        });

    } catch (error: any) {
        console.error('Error fetching learning plan:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch learning plan' },
            { status: 500 }
        );
    }
}
