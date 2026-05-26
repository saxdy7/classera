import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/projects/discover
 * Get publicly discoverable projects for the discovery page
 * Shows completed projects from all students
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get published/completed projects with creator info
    const { data: projects, error } = await supabase
      .from('project_assignments')
      .select(`
        id,
        title,
        description,
        tech_stack,
        github_repo_url,
        live_url,
        status,
        created_by,
        created_at,
        creator:users!project_assignments_created_by_fkey(
          id,
          full_name,
          avatar_url,
          email
        ),
        project_evaluations(overall_rating)
      `)
      .eq('status', 'completed')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    return NextResponse.json(projects || []);
  } catch (error) {
    console.error('Request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
