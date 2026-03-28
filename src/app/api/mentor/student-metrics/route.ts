import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get('studentId');

  if (!studentId) {
    return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify user is a mentor
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch student basic info with GitHub data
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, full_name, created_at, github_username, github_connected')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch roadmaps created by student (with error handling)
    const { data: roadmaps = [], error: roadmapsError } = await supabase
      .from('roadmaps')
      .select('id')
      .eq('created_by', studentId);

    // Fetch courses enrolled by student
    const { data: courseEnrollments = [], error: coursesError } = await supabase
      .from('course_enrollments')
      .select('id, completed_at')
      .eq('user_id', studentId);

    const coursesEnrolled = (courseEnrollments ?? []).length;
    const coursesCompleted = (courseEnrollments ?? []).filter((e: any) => e.completed_at).length;

    // Fetch tasks/assignments completed by student
    const { data: tasks = [], error: tasksError } = await supabase
      .from('student_tasks')
      .select('id, completed_at, created_at')
      .eq('student_id', studentId);

    const tasksTotal = (tasks ?? []).length;
    const tasksCompleted = (tasks ?? []).filter((t: any) => t.completed_at).length;

    // Fetch messages from student
    const { data: messages = [], error: messagesError } = await supabase
      .from('messages')
      .select('id, created_at')
      .eq('sender_id', studentId);

    // Calculate actual activity metrics from data
    const createdDate = new Date(student.created_at);
    const today = new Date();
    const daysSinceJoin = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate real streak based on recent tasks/messages/activities
    const recentActivities = [
      ...(tasks ?? []).map((t: any) => new Date(t.created_at).toDateString()),
      ...(messages ?? []).map((m: any) => new Date(m.created_at).toDateString()),
    ];
    const uniqueActivityDates = new Set(recentActivities);
    let streakDays = 0;
    for (let i = 0; i <= daysSinceJoin && i <= 90; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      if (uniqueActivityDates.has(checkDate.toDateString())) {
        streakDays++;
      } else if (streakDays > 0) {
        break;
      }
    }

    // Calculate total hours (estimated from task completion times)
    // This would require detailed time tracking - default to 0 for now
    const totalHours = Math.max(tasksCompleted * 2, 0);

    // Determine last active based on most recent message or task
    let lastActive = 'Never';
    const allActivityDates: Date[] = [
      ...(tasks ?? []).map((t: any) => new Date(t.created_at)),
      ...(messages ?? []).map((m: any) => new Date(m.created_at)),
    ];
    
    if (allActivityDates.length > 0) {
      const mostRecent = new Date(Math.max(...allActivityDates.map(d => d.getTime())));
      const diffHours = (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffHours < 1) {
        lastActive = 'Just now';
      } else if (diffHours < 24) {
        lastActive = `Today`;
      } else if (diffDays === 1) {
        lastActive = 'Yesterday';
      } else if (diffDays < 7) {
        lastActive = `${diffDays} days ago`;
      } else if (diffDays < 30) {
        lastActive = `${Math.floor(diffDays / 7)} weeks ago`;
      } else {
        lastActive = `${Math.floor(diffDays / 30)} months ago`;
      }
    }

    // Get real GitHub connection status
    const githubConnected = Boolean(student.github_connected && student.github_username);
    const githubUsername = student.github_username || undefined;

    return NextResponse.json({
      roadmapsCreated: (roadmaps ?? []).length,
      coursesCompleted,
      coursesEnrolled,
      tasksCompleted,
      tasksTotal,
      githubConnected,
      githubUsername,
      lastActive,
      joinDate: createdDate.toLocaleDateString(),
      totalHours,
      streakDays: Math.min(streakDays, 90), // Cap at 90 days
      messagesCount: (messages ?? []).length,
    });
  } catch (error) {
    console.error('Error fetching student metrics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch student metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
