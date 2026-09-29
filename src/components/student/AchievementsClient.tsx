'use client';

import { useEffect, useState } from 'react';
import { Trophy, Award, Zap, Star, Target, BookOpen, Code2, Flame } from 'lucide-react';
import { Stat } from '@/components/shell';

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
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2 flex items-center gap-3">
            <Trophy size={32} className="text-amber-600" />
            Achievements & Badges
          </h1>
          <p className="text-foreground/80">
            Unlock achievements and earn points as you progress through projects
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Stat
              label="Level"
              value={stats.level}
              icon={Zap}
              hint={
                <>
                  <span className="mb-1 block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-foreground transition-[width] duration-500"
                      style={{ width: `${Math.min((stats.current_xp / stats.next_level_xp) * 100, 100)}%` }}
                    />
                  </span>
                  {stats.current_xp} / {stats.next_level_xp} XP
                </>
              }
            />
            <Stat label="Total points" value={stats.total_points} icon={Star} hint="Lifetime points earned" />
            <Stat
              label="Achievements"
              value={`${stats.achievements_unlocked}/${stats.total_achievements}`}
              icon={Award}
              hint="Badges collected"
            />
            <Stat label="Streak" value={stats.streak_days} icon={Flame} hint="Days in a row" />
          </div>
        )}

        {/* Achievements Grid */}
        <div className="bg-card rounded-lg p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">All Achievements</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple"></div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-6 rounded-lg border-2 transition ${
                    achievement.unlocked
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'bg-muted/40 border-border opacity-60'
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
                  <h3 className="font-semibold text-foreground mb-1">{achievement.title}</h3>
                  <p className="text-xs text-foreground/80 mb-3">{achievement.description}</p>

                  {/* Points */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground/80">
                      +{achievement.points} points
                    </span>
                    {achievement.unlocked && (
                      <span className="inline-block px-2.5 py-1 bg-green-500/10 text-green-600 rounded text-xs font-semibold">
                        Unlocked
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  {achievement.progress !== undefined && achievement.maxProgress && (
                    <div className="mt-3">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-accent-purple h-2 rounded-full transition-all"
                          style={{
                            width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
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
        <div className="mt-8 rounded-lg p-8 text-white text-center bg-accent-purple">
          <h3 className="text-2xl font-semibold mb-2">Compete on the Leaderboard</h3>
          <p className="mb-4 text-accent-purple">
            Compare your progress with other students and see who's at the top
          </p>
          <a
            href="/dashboard/student/leaderboard"
            className="inline-block px-6 py-3 bg-card text-accent-purple font-semibold rounded-lg hover:bg-accent-purple/10 transition"
          >
            View Leaderboard
          </a>
        </div>
      </div>
    </>
  );
}
