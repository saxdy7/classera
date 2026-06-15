import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface CollaborationRequest {
  projectId: string;
  collaboratorEmail: string;
  role?: 'editor' | 'viewer';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body: CollaborationRequest = await request.json();

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('project_assignments')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to manage collaborators' },
        { status: 403 }
      );
    }

    // Create collaboration invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('collaboration_invites')
      .insert({
        project_id: projectId,
        inviter_id: user.id,
        invitee_email: body.collaboratorEmail,
        role: body.role || 'editor',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // TODO: Send email invitation to collaborator

    return NextResponse.json({
      success: true,
      invitation,
    });
  } catch (error) {
    console.error('Error inviting collaborator:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get all collaborators for this project
    const { data: collaborators, error: collabError } = await supabase
      .from('collaboration_members')
      .select('*, users(id, email, user_metadata)')
      .eq('project_id', projectId);

    if (collabError) {
      return NextResponse.json(
        { error: 'Failed to fetch collaborators' },
        { status: 500 }
      );
    }

    // Get pending invitations
    const { data: invitations, error: inviteError } = await supabase
      .from('collaboration_invites')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'pending');

    if (inviteError) {
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      collaborators,
      pendingInvitations: invitations,
    });
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collaboratorId = searchParams.get('collaboratorId');
    const { id: projectId } = await params;

    if (!collaboratorId) {
      return NextResponse.json(
        { error: 'collaboratorId required' },
        { status: 400 }
      );
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('project_assignments')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to remove collaborators' },
        { status: 403 }
      );
    }

    // Remove collaborator
    const { error: deleteError } = await supabase
      .from('collaboration_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', collaboratorId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to remove collaborator' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
