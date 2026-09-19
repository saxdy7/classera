import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Mail, GraduationCap, BookOpen, ArrowLeft, MessageSquare, GitBranch, Github, Linkedin, Briefcase, MapPin, ExternalLink, Clock } from 'lucide-react';
import Link from 'next/link';
import { extractGithubUsername, getGithubUser, buildLinkedInProfileUrl } from '@/lib/github';

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // Get current user's profile
  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile?.university_id || !profile?.full_name) {
    redirect('/onboarding/mentor');
  }

  // Get student profile
  const { data: student } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', id)
    .eq('role', 'student')
    .single();

  if (!student) {
    redirect('/dashboard/mentor/students');
  }

  // Calculate real stats from database
  const { data: courseProgress } = await supabase
    .from('course_progress')
    .select('course_id')
    .eq('student_id', id);
  const enrolledCourses = courseProgress?.length || 0;

  // Calculate total study hours from course progress and test submissions
  const { data: testSubmissions } = await supabase
    .from('test_submissions')
    .select('started_at, submitted_at, tests!inner(duration_minutes)')
    .eq('student_id', id)
    .not('submitted_at', 'is', null);
  
  let totalMinutes = 0;
  testSubmissions?.forEach((sub: any) => {
    if (sub.tests?.duration_minutes) {
      totalMinutes += sub.tests.duration_minutes;
    }
  });
  const totalHours = Math.round(totalMinutes / 60);

  // Count completed test submissions
  const { count: completedAssignments } = await supabase
    .from('test_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', id)
    .not('submitted_at', 'is', null);

  // GitHub stats
  const admin = createAdminClient();
  const { data: githubConn } = await admin
    .from('github_connections')
    .select('github_username, github_avatar_url, public_repos, followers, following')
    .eq('user_id', id)
    .single();

  // Fallback: fetch GitHub data from profile URL if not connected via OAuth
  let githubUrlData = null;
  if (!githubConn && student.github_url) {
    const username = extractGithubUsername(student.github_url);
    if (username) {
      try {
        githubUrlData = await getGithubUser(username);
      } catch (err) {
        console.error('Failed to fetch GitHub user from URL:', err);
      }
    }
  }

  const { data: analyticsRows } = githubConn
    ? await admin
        .from('repo_analytics')
        .select('overall_score, languages, total_commits')
        .eq('student_id', id)
        .order('analyzed_at', { ascending: false })
        .limit(10)
    : { data: null };

  const avgPlatformScore = analyticsRows?.length
    ? Math.round(analyticsRows.reduce((s, r) => s + (r.overall_score ?? 0), 0) / analyticsRows.length)
    : null;
  const totalPlatformCommits = analyticsRows?.reduce((s, r) => s + (r.total_commits ?? 0), 0) ?? 0;

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

  return (
    <div className="min-h-screen bg-[var(--cl-surface-card)]">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-6 md:p-12 lg:px-16 cl-main">
          <div className="max-w-[1400px] mx-auto">
            {/* Back Button */}
            <Link
              href="/dashboard/mentor/students"
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-[var(--cl-body)] hover:text-[var(--cl-primary)] hover:bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Students</span>
            </Link>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] overflow-hidden sticky top-8">
                  {/* Profile Header */}
                  <div className="relative h-32 bg-[var(--cl-primary)]">
                    <div className="absolute inset-0 bg-black/5"></div>
                  </div>
                  
                  <div className="px-6 pb-6">
                    {/* Avatar */}
                    <div className="relative -mt-16 mb-4">
                      {student.avatar_url ? (
                        <Image
                          src={student.avatar_url}
                          alt={student.full_name}
                          className="w-28 h-28 rounded-[var(--cl-r-xl)] border-4 border-[var(--cl-on-dark)] object-cover"
                          width={112}
                          height={112}
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-[var(--cl-r-xl)] border-4 border-[var(--cl-on-dark)] flex items-center justify-center text-[var(--cl-on-dark)] text-3xl font-semibold bg-[var(--cl-primary)]">
                          {student.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 w-6 h-6 bg-[var(--cl-success)] border-4 border-[var(--cl-on-dark)] rounded-full"></div>
                    </div>

                    {/* Name & Title */}
                    <h1 className="text-2xl font-semibold text-[var(--cl-ink)] mb-1">{student.full_name}</h1>
                    <p className="text-[var(--cl-primary)] font-medium mb-4">{student.specialization_board || 'Student'}</p>
                    
                    {/* Action Button */}
                    <Link
                      href={`/dashboard/mentor/messages?userId=${student.id}`}
                      className="w-full px-4 py-3 text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-medium transition-all flex items-center justify-center gap-2 mb-6 bg-[var(--cl-primary)]"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Send Message
                    </Link>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 p-4 rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] bg-[var(--cl-canvas)]">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-[var(--cl-ink)]">{enrolledCourses}</div>
                        <div className="text-xs text-[var(--cl-body)]">Courses</div>
                      </div>
                      <div className="text-center border-x border-[var(--cl-hairline)]">
                        <div className="text-2xl font-semibold text-[var(--cl-ink)]">{totalHours}h</div>
                        <div className="text-xs text-[var(--cl-body)]">Hours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-[var(--cl-ink)]">{completedAssignments}</div>
                        <div className="text-xs text-[var(--cl-body)]">Projects</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-5 border border-[var(--cl-hairline)] transition-shadow">
                    <div className="w-12 h-12 rounded-[var(--cl-r-xl)] flex items-center justify-center mb-3 bg-[var(--cl-info)]">
                      <Mail className="w-6 h-6 text-[var(--cl-on-dark)]" />
                    </div>
                    <div className="text-xs text-[var(--cl-muted)] mb-1 uppercase tracking-wide font-semibold">Email Address</div>
                    <div className="text-sm text-[var(--cl-ink)] font-medium break-all">{student.email}</div>
                  </div>

                  <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-5 border border-[var(--cl-hairline)] transition-shadow">
                    <div className="w-12 h-12 rounded-[var(--cl-r-xl)] flex items-center justify-center mb-3 bg-[var(--cl-primary)]">
                      <GraduationCap className="w-6 h-6 text-[var(--cl-on-dark)]" />
                    </div>
                    <div className="text-xs text-[var(--cl-muted)] mb-1 uppercase tracking-wide font-semibold">University</div>
                    <div className="text-sm text-[var(--cl-ink)] font-medium">{student.universities?.name || student.university}</div>
                  </div>

                  <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-5 border border-[var(--cl-hairline)] transition-shadow">
                    <div className="w-12 h-12 rounded-[var(--cl-r-xl)] flex items-center justify-center mb-3 bg-[var(--cl-primary)]">
                      <BookOpen className="w-6 h-6 text-[var(--cl-on-dark)]" />
                    </div>
                    <div className="text-xs text-[var(--cl-muted)] mb-1 uppercase tracking-wide font-semibold">Field of Study</div>
                    <div className="text-sm text-[var(--cl-ink)] font-medium">{student.specialization_board || 'Not specified'}</div>
                  </div>
                </div>

                {/* About Section */}
                <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 md:p-8 border border-[var(--cl-hairline)]">
                  <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--cl-primary-soft)] rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-[var(--cl-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    About
                  </h2>
                  <p className="text-[var(--cl-body)] leading-relaxed">
                    Student at <span className="font-semibold text-[var(--cl-ink)]">{student.universities?.name || student.university}</span> studying <span className="font-semibold text-[var(--cl-ink)]">{student.specialization_board || 'various subjects'}</span>.
                    Actively engaged in learning and seeking mentorship opportunities to excel in academic and professional pursuits.
                  </p>
                </div>

                {/* Learning Progress */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-[var(--cl-r-xl)] p-6 text-[var(--cl-on-dark)] bg-[var(--cl-info)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-[var(--cl-info)]">Study Hours</div>
                      <svg className="w-5 h-5 text-[var(--cl-info)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-semibold mb-1">{totalHours}h</p>
                    <p className="text-xs text-[var(--cl-info)]">Total learning time</p>
                  </div>

                  <div className="rounded-[var(--cl-r-xl)] p-6 text-[var(--cl-on-dark)] bg-[var(--cl-primary)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-[var(--cl-primary)]">Assignments</div>
                      <svg className="w-5 h-5 text-[var(--cl-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-semibold mb-1">{completedAssignments}</p>
                    <p className="text-xs text-[var(--cl-primary)]">Completed tasks</p>
                  </div>

                  <div className="rounded-[var(--cl-r-xl)] p-6 text-[var(--cl-on-dark)] bg-[var(--cl-primary)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-[var(--cl-primary)]">Achievements</div>
                      <svg className="w-5 h-5 text-[var(--cl-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-semibold mb-1">0</p>
                    <p className="text-xs text-[var(--cl-primary)]">Badges earned</p>
                  </div>
                </div>

                {/* Enrolled Courses */}
                <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 md:p-8 border border-[var(--cl-hairline)]">
                  <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--cl-primary-soft)] rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-[var(--cl-primary)]" />
                    </div>
                    Enrolled Courses
                  </h2>
                  <div className="text-center py-12 rounded-[var(--cl-r-xl)] border-2 border-dashed border-[var(--cl-hairline)] bg-[var(--cl-canvas)]">
                    <div className="w-16 h-16 bg-[var(--cl-surface-strong)] rounded-[var(--cl-r-xl)] flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-[var(--cl-muted-soft)]" />
                    </div>
                    <h3 className="font-semibold text-[var(--cl-ink)] mb-1">No Courses Enrolled</h3>
                    <p className="text-sm text-[var(--cl-muted)]">Student hasn't enrolled in any courses yet</p>
                  </div>
                </div>

                {/* GitHub Stats */}
                <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 md:p-8 border border-[var(--cl-hairline)]">
                {/* GitHub & LinkedIn Profiles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GitHub */}
                <div>
                  <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--cl-surface-inverse)] rounded-lg flex items-center justify-center">
                      <Github className="w-4 h-4 text-[var(--cl-on-dark)]" />
                    </div>
                    GitHub Profile
                  </h2>

                {!githubConn && !githubUrlData ? (
                    <div className="text-center py-10 bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-xl)] border border-dashed border-[var(--cl-hairline)]">
                      <Github className="w-10 h-10 text-[var(--cl-muted-soft)] mx-auto mb-3" />
                      <p className="text-sm font-medium text-[var(--cl-body)]">GitHub not connected</p>
                      <p className="text-xs text-[var(--cl-muted)] mt-1">Student hasn't linked their GitHub account</p>
                    </div>
                  ) : (
                    <div className="space-y-4 bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-lg)] p-4">
                      {/* Profile header */}
                      <div className="flex items-center gap-3 pb-3 border-b border-[var(--cl-hairline)]">
                        {(githubConn?.github_avatar_url || githubUrlData?.avatar_url) && (
                          <Image
                            src={githubConn?.github_avatar_url || githubUrlData?.avatar_url || ''}
                            alt={githubConn?.github_username || githubUrlData?.login || 'GitHub'}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full border border-[var(--cl-hairline)]"
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[var(--cl-ink)]">
                            @{githubConn?.github_username || githubUrlData?.login}
                          </p>
                          {githubUrlData?.name && <p className="text-xs text-[var(--cl-muted)]">{githubUrlData.name}</p>}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[var(--cl-surface-card)] rounded-lg p-2 text-center border border-[var(--cl-hairline)]">
                          <p className="text-lg font-semibold text-[var(--cl-ink)]">{githubConn?.public_repos || githubUrlData?.public_repos || 0}</p>
                          <p className="text-xs text-[var(--cl-body)]">Repos</p>
                        </div>
                        <div className="bg-[var(--cl-surface-card)] rounded-lg p-2 text-center border border-[var(--cl-hairline)]">
                          <p className="text-lg font-semibold text-[var(--cl-ink)]">{githubConn?.followers || githubUrlData?.followers || 0}</p>
                          <p className="text-xs text-[var(--cl-body)]">Followers</p>
                        </div>
                        <div className="bg-[var(--cl-surface-card)] rounded-lg p-2 text-center border border-[var(--cl-hairline)]">
                          <p className="text-lg font-semibold text-[var(--cl-ink)]">{githubConn?.following || githubUrlData?.following || 0}</p>
                          <p className="text-xs text-[var(--cl-body)]">Following</p>
                        </div>
                      </div>

                      {/* Profile details */}
                      <div className="space-y-2">
                        {githubUrlData?.bio && (
                          <p className="text-xs text-[var(--cl-body)] italic">&quot;{githubUrlData.bio}&quot;</p>
                        )}
                        {githubUrlData?.company && (
                          <div className="flex items-center gap-2 text-xs text-[var(--cl-body)]">
                            <Briefcase className="w-3 h-3 text-[var(--cl-muted-soft)]" />
                            <span>{githubUrlData.company}</span>
                          </div>
                        )}
                        {githubUrlData?.location && (
                          <div className="flex items-center gap-2 text-xs text-[var(--cl-body)]">
                            <MapPin className="w-3 h-3 text-[var(--cl-muted-soft)]" />
                            <span>{githubUrlData.location}</span>
                          </div>
                        )}
                        {githubUrlData?.created_at && (
                          <div className="flex items-center gap-2 text-xs text-[var(--cl-body)]">
                            <Clock className="w-3 h-3 text-[var(--cl-muted-soft)]" />
                            <span>Joined {new Date(githubUrlData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>

                      {/* Platform score */}
                      {avgPlatformScore !== null && githubConn && (
                        <div className="bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-[var(--cl-body)]">Consistency</span>
                            <span className="text-sm font-semibold text-[var(--cl-primary)]">{avgPlatformScore}%</span>
                          </div>
                          <div className="h-1 bg-[var(--cl-surface-strong)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--cl-primary)]" style={{ width: `${avgPlatformScore}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Top languages */}
                      {topLanguages.length > 0 && (
                        <div className="bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] rounded-lg p-3">
                          <p className="text-xs font-semibold text-[var(--cl-body)] mb-2">Top Languages</p>
                          <div className="flex flex-wrap gap-1">
                            {topLanguages.slice(0, 4).map((lang) => (
                              <span key={lang} className="text-xs bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] px-2 py-0.5 rounded-full">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* LinkedIn */}
                <div>
                  <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--cl-info)] rounded-lg flex items-center justify-center">
                      <Linkedin className="w-4 h-4 text-[var(--cl-on-dark)]" />
                    </div>
                    LinkedIn Profile
                  </h2>

                  {student.linkedin_url ? (
                    <div className="space-y-4 bg-[rgba(13,116,206,0.12)] rounded-[var(--cl-r-lg)] p-4 border border-[var(--cl-info)]">
                      <div className="flex items-center gap-3 pb-3 border-b border-[var(--cl-info)]">
                        <div className="w-10 h-10 rounded-full bg-[rgba(13,116,206,0.12)] flex items-center justify-center flex-shrink-0">
                          <Linkedin className="w-5 h-5 text-[var(--cl-info)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[var(--cl-ink)]">LinkedIn</p>
                          <a 
                            href={student.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-[var(--cl-info)] hover:underline flex items-center gap-1 mt-0.5"
                          >
                            View Profile <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="bg-[var(--cl-surface-card)] rounded-lg p-3 border border-[var(--cl-info)]">
                        <p className="text-sm text-[var(--cl-body)]">
                          Connect on LinkedIn to see {student.full_name}'s detailed career information, recommendations, and professional network.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-xl)] border border-dashed border-[var(--cl-hairline)]">
                      <Linkedin className="w-10 h-10 text-[var(--cl-muted-soft)] mx-auto mb-3" />
                      <p className="text-sm font-medium text-[var(--cl-body)]">LinkedIn not added</p>
                      <p className="text-xs text-[var(--cl-muted)] mt-1">Student hasn't linked their LinkedIn profile</p>
                    </div>
                  )}
                </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
