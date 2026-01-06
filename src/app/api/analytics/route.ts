import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const isStudent = profile.role === 'student';

    // Student Analytics
    if (isStudent) {
      // Test Performance
      const { data: submissions } = await supabase
        .from('test_submissions')
        .select('score, max_score, percentage, submitted_at')
        .eq('student_id', user.id)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: true });

      // Course Progress
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:mentor_courses(title, total_lessons)
        `)
        .eq('student_id', user.id);

      // Community Activity
      const { data: communities } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id)
        .eq('status', 'approved');

      const { data: messages } = await supabase
        .from('community_messages')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate metrics
      const avgScore = submissions && submissions.length > 0
        ? submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / submissions.length
        : 0;

      const totalCourses = enrollments?.length || 0;
      const completedCourses = enrollments?.filter(e => e.progress === 100).length || 0;

      return NextResponse.json({
        analytics: {
          testPerformance: {
            totalTests: submissions?.length || 0,
            averageScore: Math.round(avgScore * 10) / 10,
            submissions: submissions || [],
            trend: calculateTrend(submissions || []),
          },
          courseProgress: {
            totalEnrolled: totalCourses,
            completed: completedCourses,
            inProgress: totalCourses - completedCourses,
            enrollments: enrollments || [],
          },
          communityActivity: {
            totalCommunities: communities?.length || 0,
            messagesThisMonth: messages?.length || 0,
          },
          timeAnalysis: generateTimeAnalysis(submissions || [], messages || []),
        },
      });
    }

    // Mentor Analytics
    const { data: mentorTests } = await supabase
      .from('tests')
      .select(`
        id,
        title,
        test_submissions(score, max_score, percentage, submitted_at)
      `)
      .eq('mentor_id', user.id);

    const { data: mentorCommunities } = await supabase
      .from('communities')
      .select(`
        id,
        name,
        community_members(status)
      `)
      .eq('mentor_id', user.id);

    const { data: mentorCourses } = await supabase
      .from('mentor_courses')
      .select(`
        id,
        title,
        course_enrollments(student_id, progress)
      `)
      .eq('instructor_id', user.id);

    const totalSubmissions = mentorTests?.reduce((sum, t: any) => 
      sum + (t.test_submissions?.length || 0), 0) || 0;

    const totalStudents = new Set(
      mentorTests?.flatMap((t: any) => 
        t.test_submissions?.map((s: any) => s.student_id) || []
      ) || []
    ).size;

    return NextResponse.json({
      analytics: {
        testManagement: {
          totalTests: mentorTests?.length || 0,
          totalSubmissions,
          uniqueStudents: totalStudents,
          tests: mentorTests || [],
        },
        communityManagement: {
          totalCommunities: mentorCommunities?.length || 0,
          totalMembers: mentorCommunities?.reduce((sum: number, c: any) => 
            sum + (c.community_members?.filter((m: any) => m.status === 'approved').length || 0), 0) || 0,
          communities: mentorCommunities || [],
        },
        courseManagement: {
          totalCourses: mentorCourses?.length || 0,
          totalEnrollments: mentorCourses?.reduce((sum: number, c: any) => 
            sum + (c.course_enrollments?.length || 0), 0) || 0,
          courses: mentorCourses || [],
        },
      },
    });

  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateTrend(submissions: any[]) {
  if (submissions.length < 2) return 0;
  
  const recent = submissions.slice(-5);
  const older = submissions.slice(0, Math.min(5, submissions.length - 5));
  
  if (older.length === 0) return 0;
  
  const recentAvg = recent.reduce((sum, s) => sum + (s.percentage || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, s) => sum + (s.percentage || 0), 0) / older.length;
  
  return Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
}

function generateTimeAnalysis(submissions: any[], messages: any[]) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  return last7Days.map(date => ({
    date,
    tests: submissions.filter(s => s.submitted_at?.startsWith(date)).length,
    messages: messages.filter(m => m.created_at?.startsWith(date)).length,
  }));
}
