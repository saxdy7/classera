import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/achievements
 * Get user's achievements and game stats
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's achievements
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id);

    // Get user's game stats (from leaderboard)
    const { data: stats } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get user's completed projects
    const { data: projects } = await supabase
      .from('project_assignments')
      .select('status')
      .eq('created_by', user.id);

    const completedCount = projects?.filter(p => p.status === 'completed').length || 0;

    // Map achievements with unlock status
    const baseAchievements = [
      {
        id: 'first_project',
        title: 'First Steps',
        description: 'Complete your first project',
        icon: '🚀',
        points: 100,
        unlocked: completedCount >= 1,
      },
      {
        id: 'five_projects',
        title: 'Project Master',
        description: 'Complete 5 projects',
        icon: '🎯',
        points: 250,
        unlocked: completedCount >= 5,
      },
      {
        id: 'github_master',
        title: 'GitHub Expert',
        description: 'Link GitHub and complete a project',
        icon: '🐱',
        points: 150,
        unlocked: achievements?.some(a => a.achievement_id === 'github_master'),
      },
      {
        id: 'code_reviewer',
        title: 'Code Reviewer',
        description: 'Receive an AI code review score of 80+',
        icon: '👀',
        points: 200,
        unlocked: achievements?.some(a => a.achievement_id === 'code_reviewer'),
      },
      {
        id: 'tech_stack_master',
        title: 'Tech Stack Master',
        description: 'Use 10 different technologies',
        icon: '⚙️',
        points: 300,
        unlocked: achievements?.some(a => a.achievement_id === 'tech_stack_master'),
      },
      {
        id: 'portfolio_star',
        title: 'Portfolio Star',
        description: 'Get 100 portfolio views',
        icon: '⭐',
        points: 250,
        unlocked: achievements?.some(a => a.achievement_id === 'portfolio_star'),
      },
      {
        id: 'consistent',
        title: 'Consistent Coder',
        description: 'Maintain a 7-day commit streak',
        icon: '🔥',
        points: 175,
        unlocked: achievements?.some(a => a.achievement_id === 'consistent'),
      },
      {
        id: 'collaborator',
        title: 'Collaborator',
        description: 'Work on a collaborative project',
        icon: '🤝',
        points: 200,
        unlocked: achievements?.some(a => a.achievement_id === 'collaborator'),
      },
    ];

    const gameStats = {
      total_points: stats?.points || 0,
      level: Math.floor((stats?.points || 0) / 1000) + 1,
      current_xp: (stats?.points || 0) % 1000,
      next_level_xp: 1000,
      achievements_unlocked: baseAchievements.filter(a => a.unlocked).length,
      total_achievements: baseAchievements.length,
      streak_days: stats?.streak_days || 0,
    };

    return NextResponse.json({
      achievements: baseAchievements,
      stats: gameStats,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}
