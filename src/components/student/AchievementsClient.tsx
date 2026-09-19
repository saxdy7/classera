'use client';

import { useEffect, useState } from 'react';
import { Trophy, Award, Zap, Star, Target, BookOpen, Code2, Flame } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  earned_date?: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface GameStats {
  total_points: number;
  level: number;
  current_xp: number;
  next_level_xp: number;
  achievements_unlocked: number;
  total_achievements: number;
  streak_days: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_project',
    title: 'First Steps',
    description: 'Complete your first project',
    icon: '🚀',
    points: 100,
    unlocked: false,
  },
  {
    id: 'five_projects',
    title: 'Project Master',
    description: 'Complete 5 projects',
    icon: '🎯',
    points: 250,
    unlocked: false,
  },
  {
    id: 'github_master',
    title: 'GitHub Expert',
    description: 'Link GitHub and complete a project',
    icon: '🐱',
    points: 150,
    unlocked: false,
  },
  {
    id: 'code_reviewer',
    title: 'Code Reviewer',
    description: 'Receive an AI code review score of 80+',
    icon: '👀',
    points: 200,
    unlocked: false,
  },
  {
    id: 'tech_stack_master',
    title: 'Tech Stack Master',
    description: 'Use 10 different technologies across projects',
    icon: '⚙️',
    points: 300,
    unlocked: false,
  },
  {
    id: 'portfolio_star',
    title: 'Portfolio Star',
    description: 'Get 100 portfolio views',
    icon: '⭐',
    points: 250,
    unlocked: false,
  },
  {
    id: 'consistent',
    title: 'Consistent Coder',
    description: 'Maintain a 7-day commit streak',
    icon: '🔥',
    points: 175,
    unlocked: false,
  },
  {
    id: 'collaborator',
    title: 'Collaborator',
    description: 'Work on a real-time collaborative project',
    icon: '🤝',
    points: 200,
    unlocked: false,
  },
];

export function AchievementsClient() {
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/achievements');
      if (response.ok) {
        const data = await response.json();
        setAchievements(data.achievements || ACHIEVEMENTS);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalPoints = achievements.reduce((sum, a) => (a.unlocked ? sum + a.points : sum), 0);

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[var(--cl-ink)] mb-2 flex items-center gap-3">
            <Trophy size={32} className="text-[var(--cl-warning)]" />
            Achievements & Badges
          </h1>
          <p className="text-[var(--cl-body)]">
            Unlock achievements and earn points as you progress through projects
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Level */}
            <div className="bg-[var(--cl-surface-card)] rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[var(--cl-body)]">Level</h3>
                <Zap className="text-[var(--cl-warning)]" size={20} />
              </div>
              <div className="text-3xl font-semibold text-[var(--cl-ink)]">{stats.level}</div>
              <div className="mt-3 w-full bg-[var(--cl-surface-strong)] rounded-full h-2">
                <div
                  className="bg-[var(--cl-warning)] h-2 rounded-full transition-all"
                  style={{
                    width: `${(stats.current_xp / stats.next_level_xp) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-[var(--cl-muted)] mt-2">
                {stats.current_xp} / {stats.next_level_xp} XP
              </p>
            </div>

            {/* Points */}
            <div className="bg-[var(--cl-surface-card)] rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[var(--cl-body)]">Total Points</h3>
                <Star className="text-[var(--cl-info)]" size={20} />
              </div>
              <div className="text-3xl font-semibold text-[var(--cl-ink)]">{stats.total_points}</div>
              <p className="text-xs text-[var(--cl-muted)] mt-4">Lifetime points earned</p>
            </div>

            {/* Achievements */}
            <div className="bg-[var(--cl-surface-card)] rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[var(--cl-body)]">Achievements</h3>
                <Award className="text-[var(--cl-success)]" size={20} />
              </div>
              <div className="text-3xl font-semibold text-[var(--cl-ink)]">
                {stats.achievements_unlocked}/{stats.total_achievements}
              </div>
              <p className="text-xs text-[var(--cl-muted)] mt-4">Badges collected</p>
            </div>

            {/* Streak */}
            <div className="bg-[var(--cl-surface-card)] rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[var(--cl-body)]">Streak</h3>
                <Flame className="text-[var(--cl-error)]" size={20} />
              </div>
              <div className="text-3xl font-semibold text-[var(--cl-ink)]">{stats.streak_days}</div>
              <p className="text-xs text-[var(--cl-muted)] mt-4">Days in a row</p>
            </div>
          </div>
        )}

        {/* Achievements Grid */}
        <div className="bg-[var(--cl-surface-card)] rounded-lg p-8">
          <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-6">All Achievements</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cl-info)]"></div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-6 rounded-lg border-2 transition ${
                    achievement.unlocked
                      ? 'border-[var(--cl-warning)] bg-[rgba(171,100,0,0.12)]'
                      : 'bg-[var(--cl-canvas-soft)] border-[var(--cl-hairline)] opacity-60'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`text-4xl mb-3 ${
                      achievement.unlocked ? 'opacity-100' : 'opacity-30 grayscale'
                    }`}
                  >
                    {achievement.icon}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-[var(--cl-ink)] mb-1">{achievement.title}</h3>
                  <p className="text-xs text-[var(--cl-body)] mb-3">{achievement.description}</p>

                  {/* Points */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--cl-body)]">
                      +{achievement.points} points
                    </span>
                    {achievement.unlocked && (
                      <span className="inline-block px-2.5 py-1 bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] rounded text-xs font-semibold">
                        Unlocked
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  {achievement.progress !== undefined && achievement.maxProgress && (
                    <div className="mt-3">
                      <div className="w-full bg-[var(--cl-surface-strong)] rounded-full h-2">
                        <div
                          className="bg-[var(--cl-info)] h-2 rounded-full transition-all"
                          style={{
                            width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-[var(--cl-muted)] mt-1">
                        {achievement.progress} / {achievement.maxProgress}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard Link */}
        <div className="mt-8 rounded-lg p-8 text-[var(--cl-on-dark)] text-center bg-[var(--cl-info)]">
          <h3 className="text-2xl font-semibold mb-2">Compete on the Leaderboard</h3>
          <p className="mb-4 text-[var(--cl-info)]">
            Compare your progress with other students and see who's at the top
          </p>
          <a
            href="/dashboard/student/leaderboard"
            className="inline-block px-6 py-3 bg-[var(--cl-surface-card)] text-[var(--cl-info)] font-semibold rounded-lg hover:bg-[rgba(13,116,206,0.12)] transition"
          >
            View Leaderboard
          </a>
        </div>
      </div>
    </>
  );
}
