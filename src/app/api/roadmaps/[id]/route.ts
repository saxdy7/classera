import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/roadmaps/[id] - Get roadmap details with nodes
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const supabase = await createClient();

        // Fetch roadmap with creator info
        const { data: roadmap, error: roadmapError } = await supabase
            .from('roadmaps')
            .select(`
                *,
                creator:users!roadmaps_creator_id_fkey(id, full_name, avatar_url, role)
            `)
            .eq('id', id)
            .single();

        if (roadmapError) throw roadmapError;
        if (!roadmap) {
            return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
        }

        // Fetch all nodes for this roadmap
        const { data: nodes, error: nodesError } = await supabase
            .from('roadmap_nodes')
            .select('*')
            .eq('roadmap_id', id)
            .order('order_index', { ascending: true });

        if (nodesError) throw nodesError;

        // Get user progress if authenticated
        const { data: { user } } = await supabase.auth.getUser();
        let userProgress = null;

        if (user) {
            const { data: progress } = await supabase
                .from('roadmap_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('roadmap_id', id);

            userProgress = progress || [];
        }

        // Increment view count
        await supabase
            .from('roadmaps')
            .update({ views: (roadmap.views || 0) + 1 })
            .eq('id', id);

        return NextResponse.json({
            roadmap: {
                ...roadmap,
                nodes,
                userProgress
            }
        });

    } catch (error: any) {
        console.error('Error fetching roadmap:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch roadmap' },
            { status: 500 }
        );
    }
}

// PUT /api/roadmaps/[id] - Update roadmap (creator only)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is the creator
        const { data: roadmap } = await supabase
            .from('roadmaps')
            .select('creator_id')
            .eq('id', id)
            .single();

        if (!roadmap || roadmap.creator_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const updates = {
            ...body,
            updated_at: new Date().toISOString()
        };

        // Update roadmap
        const { data: updated, error } = await supabase
            .from('roadmaps')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ roadmap: updated });

    } catch (error: any) {
        console.error('Error updating roadmap:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update roadmap' },
            { status: 500 }
        );
    }
}

// DELETE /api/roadmaps/[id] - Delete roadmap (creator only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is the creator
        const { data: roadmap } = await supabase
            .from('roadmaps')
            .select('creator_id')
            .eq('id', id)
            .single();

        if (!roadmap || roadmap.creator_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete roadmap (cascade will delete nodes, progress, etc.)
        const { error } = await supabase
            .from('roadmaps')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ message: 'Roadmap deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting roadmap:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete roadmap' },
            { status: 500 }
        );
    }
}
