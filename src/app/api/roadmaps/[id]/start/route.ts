import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/roadmaps/[id]/start - Start a learning plan for a roadmap
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: roadmapId } = await params;
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            daily_time_minutes = 60,
            target_weeks,
            ai_generated = false
        } = body;

        // Check if roadmap exists
        const { data: roadmap, error: roadmapError } = await supabase
            .from('roadmaps')
            .select('*')
            .eq('id', roadmapId)
            .single();

        if (roadmapError || !roadmap) {
            return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
        }

        // Check if user already has an active plan for this roadmap
        const { data: existingPlan } = await supabase
            .from('learning_plans')
            .select('id, status')
            .eq('user_id', user.id)
            .eq('roadmap_id', roadmapId)
            .eq('status', 'active')
            .single();

        if (existingPlan) {
            return NextResponse.json(
                { error: 'You already have an active plan for this roadmap' },
                { status: 400 }
            );
        }

        // Calculate target end date
        const startDate = new Date();
        const weeksToComplete = target_weeks || roadmap.estimated_weeks || 12;
        const targetEndDate = new Date(startDate);
        targetEndDate.setDate(targetEndDate.getDate() + (weeksToComplete * 7));

        // Create learning plan
        const { data: plan, error: planError } = await supabase
            .from('learning_plans')
            .insert({
                user_id: user.id,
                roadmap_id: roadmapId,
                title: `${roadmap.title} Learning Plan`,
                start_date: startDate.toISOString().split('T')[0],
                target_end_date: targetEndDate.toISOString().split('T')[0],
                daily_time_minutes,
                ai_generated,
                status: 'active'
            })
            .select()
            .single();

        if (planError) throw planError;

        // Get all nodes for this roadmap
        const { data: nodes } = await supabase
            .from('roadmap_nodes')
            .select('*')
            .eq('roadmap_id', roadmapId)
            .order('order_index', { ascending: true });

        // Create initial progress entries for all nodes
        if (nodes && nodes.length > 0) {
            const progressEntries = nodes.map(node => ({
                user_id: user.id,
                roadmap_id: roadmapId,
                node_id: node.id,
                status: 'not_started'
            }));

            await supabase
                .from('roadmap_progress')
                .insert(progressEntries);

            // Generate daily tasks for the first week
            const tasksToCreate = [];
            const daysPerNode = Math.ceil((weeksToComplete * 7) / nodes.length);

            for (let i = 0; i < Math.min(nodes.length, 7); i++) {
                const node = nodes[i];
                const taskDate = new Date(startDate);
                taskDate.setDate(taskDate.getDate() + (i * daysPerNode));

                tasksToCreate.push({
                    plan_id: plan.id,
                    node_id: node.id,
                    scheduled_date: taskDate.toISOString().split('T')[0],
                    task_type: node.node_type === 'project' ? 'project' : 'learn',
                    title: node.title,
                    description: node.description,
                    estimated_minutes: Math.min(node.estimated_hours * 60, daily_time_minutes),
                    status: 'pending'
                });
            }

            if (tasksToCreate.length > 0) {
                await supabase
                    .from('plan_tasks')
                    .insert(tasksToCreate);
            }
        }

        return NextResponse.json({
            plan,
            message: 'Learning plan started successfully!'
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error starting learning plan:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to start learning plan' },
            { status: 500 }
        );
    }
}
