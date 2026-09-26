import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { BookOpen, Trophy, Users, Calendar, Star, CheckCircle, Clock, GitBranch, Briefcase, MapPin, Mail as MailIcon, ExternalLink, Github, Linkedin } from 'lucide-react';
import GitHubConnectButton from '@/components/projects/GitHubConnectButton';
import ActivityHeatmap from '@/components/projects/ActivityHeatmap';
import { extractGithubUsername, getGithubUser, getTopRepositories, buildLinkedInProfileUrl } from '@/lib/github';

export const dynamic = 'force-dynamic';

export default async function StudentProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(name, logo_url)')
    .eq('id', user.id)
    .single();

  if (!profile?.full_name || !profile?.university_id) redirect('/onboarding/student');

  // Enrolled courses
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('id, progress, enrolled_at, completed_at, course:mentor_courses(id, title, thumbnail_url, difficulty)')
    .eq('student_id', user.id)
    .order('enrolled_at', { ascending: false })
    .limit(6);

  // Test submissions
  const { data: testSubmissions } = await supabase
    .from('test_submissions')
    .select('id, score, max_score, percentage, submitted_at, test:tests(id, title)')
    .eq('student_id', user.id)
    .order('submitted_at', { ascending: false })
    .limit(8);

  // Community memberships — schema uses student_id (not user_id)
  const { data: memberships } = await supabase
    .from('community_members')
    .select('id, joined_at, community:communities(id, name, avatar_url)')
    .eq('student_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(6);

  // Compute aggregate stats
  const coursesEnrolled = enrollments?.length ?? 0;
  const coursesCompleted = enrollments?.filter(e => e.completed_at).length ?? 0;
  const testsTaken = testSubmissions?.length ?? 0;
  const avgScore = testsTaken > 0
    ? Math.round((testSubmissions!.reduce((sum, t) => sum + (t.percentage ?? 0), 0) / testsTaken))
    : null;
  const communitiesJoined = memberships?.length ?? 0;

  // GitHub connection
  const admin = createAdminClient();
  const { data: githubConnection } = await admin
    .from('github_connections')
    .select('github_username, github_avatar_url, github_name, public_repos')
    .eq('user_id', user.id)
    .single();

  // Fallback: fetch GitHub data from profile URL if not connected via OAuth
  let githubUrlData = null;
  if (!githubConnection && profile.github_url) {
    const username = extractGithubUsername(profile.github_url);
    if (username) {
      try {
        githubUrlData = await getGithubUser(username);
      } catch (err) {
        console.error('Failed to fetch GitHub user from URL:', err);
      }
    }
  }

  // Aggregate daily activity from all analyzed repos belonging to this student
  const { data: analyticsRows } = await admin
    .from('repo_analytics')
    .select('daily_activity, overall_score, languages')
    .eq('student_id', user.id)
    .order('analyzed_at', { ascending: false })
    .limit(10);

  const mergedDailyActivity: Record<string, number> = {};
  analyticsRows?.forEach((row) => {
    if (row.daily_activity && typeof row.daily_activity === 'object') {
      Object.entries(row.daily_activity as Record<string, number>).forEach(([date, count]) => {
        mergedDailyActivity[date] = (mergedDailyActivity[date] ?? 0) + count;
      });
    }
  });

  const avgPlatformScore = analyticsRows?.length
    ? Math.round(analyticsRows.reduce((s, r) => s + (r.overall_score ?? 0), 0) / analyticsRows.length)
    : null;

  // Top languages across all repos
  const langTotals: Record<string, number> = {};
  analyticsRows?.forEach((row) => {
    if (row.languages && typeof row.languages === 'object') {
      Object.entries(row.languages as Record<string, number>).forEach(([lang, bytes]) => {
        langTotals[lang] = (langTotals[lang] ?? 0) + bytes;
      });
    }
  });
  const topLanguages = Object.entries(langTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([lang]) => lang);

  const initials = profile.full_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const difficultyColor: Record<string, string> = {
    beginner:     'bg-green-500/10 text-green-600',
    intermediate: 'bg-amber-500/10 text-amber-600',
    advanced:     'bg-destructive/10 text-destructive',
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-6 md:p-8">
          <div className="max-w-5xl mx-auto space-y-8">

            {/* ── Profile Card ── */}
            <div className="bg-card rounded-xl overflow-hidden border border-border">
              {/* Banner */}
              <div className="h-32 bg-primary" />
              <div className="px-8 pb-8 -mt-14">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div className="flex items-end gap-5">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-24 h-24 rounded-xl border-4 border-white object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl border-4 border-white flex items-center justify-center text-white text-2xl font-semibold bg-primary">
                        {initials}
                      </div>
                    )}
                    <div className="pb-1">
                      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{profile.full_name}</h1>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        {profile.specialization_board || 'Student'} · {(profile.universities as any)?.name || 'University'}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/student/settings"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground/80 hover:bg-muted/40 transition-colors"
                  >
                    Edit Profile
                  </Link>
                </div>

                {profile.bio && (
                  <p className="mt-5 text-foreground/80 text-sm max-w-2xl leading-relaxed">{profile.bio}</p>
                )}

                {/* Quick stats row */}
                <div className="mt-6 flex flex-wrap gap-6">
                  <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <BookOpen className="w-4 h-4 text-accent-purple" />
                    <span><strong className="text-foreground">{coursesEnrolled}</strong> courses enrolled</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span><strong className="text-foreground">{testsTaken}</strong> tests taken</span>
                  </div>
                  {avgScore !== null && (
                    <div className="flex items-center gap-2 text-sm text-foreground/80">
                      <Star className="w-4 h-4 text-amber-600" />
                      <span><strong className="text-foreground">{avgScore}%</strong> avg score</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <Users className="w-4 h-4 text-green-600" />
                    <span><strong className="text-foreground">{communitiesJoined}</strong> communities</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Two column grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Enrolled Courses */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-accent-purple" />
                    Enrolled Courses
                  </h2>
                  <Link href="/dashboard/student/courses" className="text-xs font-medium text-accent-purple hover:underline">
                    View all
                  </Link>
                </div>
                {(enrollments?.length ?? 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground/70">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No courses enrolled yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrollments!.map(e => {
                      const course = (e as any).course;
                      const diff = course?.difficulty ?? 'beginner';
                      return (
                        <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-accent-purple" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{course?.title ?? 'Course'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${e.progress ?? 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground/70 flex-shrink-0">{e.progress ?? 0}%</span>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${difficultyColor[diff] ?? 'bg-muted text-foreground/80'}`}>
                            {diff}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Test Results */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    Test Results
                  </h2>
                  <Link href="/dashboard/student/tests" className="text-xs font-medium text-accent-purple hover:underline">
                    View all
                  </Link>
                </div>
                {(testSubmissions?.length ?? 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground/70">
                    <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No tests taken yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {testSubmissions!.map(sub => {
                      const pct = sub.percentage ?? 0;
                      const passed = pct >= 50;
                      const test = (sub as any).test;
                      return (
                        <div key={sub.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${passed ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                            {passed
                              ? <CheckCircle className="w-5 h-5 text-green-600" />
                              : <Trophy className="w-5 h-5 text-destructive" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{test?.title ?? 'Test'}</p>
                            <p className="text-xs text-muted-foreground/70 mt-0.5">
                              {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <span className={`text-sm font-semibold flex-shrink-0 ${passed ? 'text-green-600' : 'text-destructive'}`}>
                            {Math.round(pct)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Communities */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    Communities
                  </h2>
                  <Link href="/dashboard/student/communities" className="text-xs font-medium text-accent-purple hover:underline">
                    View all
                  </Link>
                </div>
                {(memberships?.length ?? 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground/70">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Not a member of any community yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {memberships!.map(m => {
                      const community = (m as any).community;
                      return (
                        <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-green-600 overflow-hidden">
                            {community?.avatar_url
                              ? <img src={community.avatar_url} alt={community.name} className="w-full h-full object-cover" />
                              : community?.name?.[0]?.toUpperCase() ?? 'C'
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{community?.name ?? 'Community'}</p>
                            <p className="text-xs text-muted-foreground/70 mt-0.5">
                              Joined {new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Activity Summary */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent-purple" />
                  Activity Summary
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: BookOpen, label: 'Enrolled', value: coursesEnrolled, color: '', text: 'text-accent-purple' },
                    { icon: CheckCircle, label: 'Completed', value: coursesCompleted, color: '', text: 'text-green-600' },
                    { icon: Trophy, label: 'Tests Taken', value: testsTaken, color: '', text: 'text-amber-600' },
                    { icon: Star, label: 'Avg Score', value: avgScore !== null ? `${avgScore}%` : '—', color: '', text: 'text-amber-600' },
                  ].map(({ icon: Icon, label, value, color, text }) => (
                    <div key={label} className={`rounded-lg p-4 ${color}`}>
                      <Icon className={`w-5 h-5 ${text} mb-2`} />
                      <p className={`text-2xl font-semibold ${text}`}>{value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ── GitHub & LinkedIn Profiles ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GitHub Section */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Github className="w-4 h-4 text-foreground" />
                  GitHub Profile
                </h2>
              </div>

              <GitHubConnectButton
                connected={!!githubConnection}
                username={githubConnection?.github_username ?? null}
                avatarUrl={githubConnection?.github_avatar_url ?? null}
              />

              {(githubConnection || githubUrlData) && (
                <div className="mt-5 space-y-4">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 pb-4 border-b border-border">
                    {(githubConnection?.github_avatar_url || githubUrlData?.avatar_url) && (
                      <img 
                        src={githubConnection?.github_avatar_url || githubUrlData?.avatar_url || ''} 
                        alt="GitHub" 
                        className="w-12 h-12 rounded-full border border-border"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">@{githubConnection?.github_username || githubUrlData?.login}</p>
                      {githubUrlData?.name && <p className="text-xs text-foreground/80">{githubUrlData.name}</p>}
                      {githubUrlData?.bio && <p className="text-xs text-muted-foreground mt-0.5">{githubUrlData.bio}</p>}
                    </div>
                  </div>

                  {/* Key Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/40 rounded-lg p-3 text-center">
                      <p className="text-lg font-semibold text-foreground">{githubUrlData?.public_repos || 0}</p>
                      <p className="text-xs text-foreground/80">Public Repos</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3 text-center">
                      <p className="text-lg font-semibold text-foreground">{githubUrlData?.followers || 0}</p>
                      <p className="text-xs text-foreground/80">Followers</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3 text-center">
                      <p className="text-lg font-semibold text-foreground">{githubUrlData?.following || 0}</p>
                      <p className="text-xs text-foreground/80">Following</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-2">
                    {githubUrlData?.company && (
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <Briefcase className="w-4 h-4 text-muted-foreground/70" />
                        <span>{githubUrlData.company}</span>
                      </div>
                    )}
                    {githubUrlData?.location && (
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <MapPin className="w-4 h-4 text-muted-foreground/70" />
                        <span>{githubUrlData.location}</span>
                      </div>
                    )}
                    {githubUrlData?.blog && (
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <ExternalLink className="w-4 h-4 text-muted-foreground/70" />
                        <a href={githubUrlData.blog} target="_blank" rel="noreferrer" className="text-accent-purple hover:underline">
                          Personal Website
                        </a>
                      </div>
                    )}
                    {githubUrlData?.created_at && (
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <Clock className="w-4 h-4 text-muted-foreground/70" />
                        <span>Joined {new Date(githubUrlData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>

                  {/* Platform stats */}
                  {avgPlatformScore !== null && githubConnection && (
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-foreground/80 uppercase">Consistency Score</span>
                        <span className="text-sm font-semibold text-accent-purple">{avgPlatformScore}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${avgPlatformScore}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Activity heatmap */}
                  {githubConnection && Object.keys(mergedDailyActivity).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground/80 uppercase mb-2">Coding Activity (26 weeks)</p>
                      <ActivityHeatmap dailyActivity={mergedDailyActivity} weeks={26} />
                    </div>
                  )}

                  {/* Languages */}
                  {Object.keys(langTotals).length > 0 && (() => {
                    const topLangs = Object.entries(langTotals)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5);
                    const total = topLangs.reduce((s, [, v]) => s + v, 0);
                    const LANG_COLORS: Record<string, string> = {
                      TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
                      Rust: '#dea584', Go: '#00ADD8', Java: '#b07219',
                      CSS: '#563d7c', HTML: '#e34c26', 'C++': '#f34b7d', C: '#555555',
                      default: '#8b5cf6',
                    };
                    return (
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs font-semibold text-foreground/80 uppercase mb-2">Top Languages</p>
                        <div className="space-y-2">
                          {topLangs.map(([lang, bytes]) => (
                            <div key={lang}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-foreground/80">{lang}</span>
                                <span className="text-xs text-muted-foreground">{Math.round((bytes / total) * 100)}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div style={{ width: `${(bytes/total)*100}%`, backgroundColor: LANG_COLORS[lang] || LANG_COLORS.default }} className="h-full" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* LinkedIn Section */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-accent-purple" />
                  LinkedIn Profile
                </h2>
              </div>

              {profile.linkedin_url ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-border">
                    <div className="w-12 h-12 rounded-full bg-accent-purple/10 flex items-center justify-center">
                      <Linkedin className="w-6 h-6 text-accent-purple" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">LinkedIn Profile</p>
                      <a 
                        href={profile.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-accent-purple hover:underline flex items-center gap-1 mt-1"
                      >
                        View Profile <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="bg-accent-purple/10 rounded-lg p-4 border border-accent-purple">
                    <p className="text-sm text-foreground/80">
                      Connect with {profile.full_name} on LinkedIn to see detailed career information, endorsements, and recommendations.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/40 rounded-lg p-3 text-center">
                      <MailIcon className="w-4 h-4 text-muted-foreground/70 mx-auto mb-2" />
                      <p className="text-xs font-medium text-foreground/80">Connect</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3 text-center">
                      <Users className="w-4 h-4 text-muted-foreground/70 mx-auto mb-2" />
                      <p className="text-xs font-medium text-foreground/80">Network</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground/70">
                  <Linkedin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">LinkedIn not connected</p>
                  <p className="text-xs mt-1">Add LinkedIn profile in settings to showcase professional experience</p>
                </div>
              )}
            </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
