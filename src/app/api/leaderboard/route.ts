import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's university
    const { data: profile } = await supabase
      .from('users')
      .select('university_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'all_time'; // all_time, monthly, weekly
    const limit = parseInt(searchParams.get('limit') || '50');

    // Calculate leaderboard based on test scores
    const { data: leaderboard, error } = await supabase.rpc('calculate_leaderboard', {
      p_university_id: profile.university_id,
      p_period: period,
      p_limit: limit,
    });

    if (error) {
      console.error('Error fetching leaderboard:', error);
      
      // Fallback: Calculate manually if RPC doesn't exist
      const { data: submissions } = await supabase
        .from('test_submissions')
        .select(`
          student_id,
          score,
          max_score,
          percentage,
          submitted_at,
          student:users!test_submissions_student_id_fkey(
            id,
            full_name,
            avatar_url,
            degree_type,
            current_semester
          )
        `)
        .not('submitted_at', 'is', null);

      // Group by student and calculate average
      const studentStats: any = {};
      submissions?.forEach((sub: any) => {
        if (!studentStats[sub.student_id]) {
          studentStats[sub.student_id] = {
            student: sub.student,
            total_score: 0,
            total_tests: 0,
            avg_percentage: 0,
          };
        }
        studentStats[sub.student_id].total_score += sub.percentage || 0;
        studentStats[sub.student_id].total_tests += 1;
      });

      const leaderboardData = Object.values(studentStats)
        .map((stat: any) => ({
          ...stat.student,
          total_tests: stat.total_tests,
          avg_percentage: stat.total_score / stat.total_tests,
        }))
        .sort((a: any, b: any) => b.avg_percentage - a.avg_percentage)
        .slice(0, limit);

      return NextResponse.json({ leaderboard: leaderboardData });
    }

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error in leaderboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
