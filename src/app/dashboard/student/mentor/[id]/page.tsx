import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Mail, GraduationCap, BookOpen, ArrowLeft, Github, GitBranch, Users, TrendingUp, Linkedin, Briefcase, MapPin, ExternalLink, Clock } from 'lucide-react';
import Link from 'next/link';
import { MentorActions } from '@/components/student/MentorActions';
import { extractGithubUsername, getGithubUser } from '@/lib/github';

function parseExpertise(expertise: any): string {
  if (!expertise) return '';
  if (Array.isArray(expertise)) return expertise.join(', ');
  try {
    const parsed = JSON.parse(expertise);
    if (Array.isArray(parsed)) return parsed.join(', ');
  } catch {}
  return String(expertise);
}

export default async function MentorProfilePage({ params }: { params: Promise<{ id: string }> }) {
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
    redirect('/onboarding/student');
  }

  // Get mentor profile
  const { data: mentor } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', id)
    .eq('role', 'mentor')
    .single();

  if (!mentor) {
    redirect('/dashboard/student/find-mentors');
  }

  // Calculate years of experience
  const yearsExperience = mentor.created_at 
    ? Math.max(1, new Date().getFullYear() - new Date(mentor.created_at).getFullYear())
    : 1;

  // Get mentor's GitHub connection
  const admin = createAdminClient();
  const { data: githubConn } = await admin
    .from('github_connections')
    .select('github_username, github_avatar_url, public_repos, followers, following')
    .eq('user_id', id)
    .single();

  // Fallback: fetch GitHub data from profile URL if not connected via OAuth
  let githubUrlData = null;
  if (!githubConn && mentor.github_url) {
    const username = extractGithubUsername(mentor.github_url);
    if (username) {
      try {
        githubUrlData = await getGithubUser(username);
      } catch (err) {
        console.error('Failed to fetch GitHub user from URL:', err);
      }
    }
  }

  // Get mentor's GitHub analytics if connected
  let avgPlatformScore = null;
  let totalPlatformCommits = 0;
  let topLanguages: Record<string, number> = {};

  if (githubConn) {
    const { data: analyticsRows } = await admin
      .from('repo_analytics')
      .select('overall_score, languages, total_commits')
      .eq('student_id', id)
      .order('analyzed_at', { ascending: false })
      .limit(10);

    if (analyticsRows?.length) {
      avgPlatformScore = Math.round(analyticsRows.reduce((s, r) => s + (r.overall_score ?? 0), 0) / analyticsRows.length);
      totalPlatformCommits = analyticsRows.reduce((s, r) => s + (r.total_commits ?? 0), 0);

      const langTotals: Record<string, number> = {};
      analyticsRows.forEach((row) => {
        if (row.languages && typeof row.languages === 'object') {
          Object.entries(row.languages as Record<string, number>).forEach(([lang, bytes]) => {
            langTotals[lang] = (langTotals[lang] ?? 0) + bytes;
          });
        }
      });

      const sortedLangs = Object.entries(langTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      topLanguages = Object.fromEntries(sortedLangs);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--cl-surface-card)]">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-6 md:p-12 lg:px-16 cl-main">
          <div className="max-w-[1400px] mx-auto">
            {/* Back Button */}
            <Link
              href="/dashboard/student/find-mentors"
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-[var(--cl-body)] hover:text-[var(--cl-primary)] hover:bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Find Mentors</span>
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
                      {mentor.avatar_url ? (
                        <Image
                          src={mentor.avatar_url}
                          alt={mentor.full_name}
                          className="w-28 h-28 rounded-[var(--cl-r-xl)] border-4 border-[var(--cl-on-dark)] object-cover"
                          width={112}
                          height={112}
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-[var(--cl-r-xl)] border-4 border-[var(--cl-on-dark)] flex items-center justify-center text-[var(--cl-on-dark)] text-3xl font-semibold bg-[var(--cl-primary)]">
                          {mentor.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 w-6 h-6 bg-[var(--cl-success)] border-4 border-[var(--cl-on-dark)] rounded-full"></div>
                    </div>

                    {/* Name & Title */}
                    <h1 className="text-2xl font-semibold text-[var(--cl-ink)] mb-1">{mentor.full_name}</h1>
                    <p className="text-[var(--cl-primary)] font-medium mb-4">{parseExpertise(mentor.expertise) || 'Mentor'}</p>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2 mb-6">
                      <MentorActions mentorId={mentor.id} mentorEmail={mentor.email} />
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 p-4 rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] bg-[var(--cl-canvas)]">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-[var(--cl-ink)]">{yearsExperience}+</div>
                        <div className="text-xs text-[var(--cl-body)]">Years Exp.</div>
                      </div>
                      <div className="text-center border-x border-[var(--cl-hairline)]">
                        <div className="text-2xl font-semibold text-[var(--cl-ink)]">-</div>
                        <div className="text-xs text-[var(--cl-body)]">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-[var(--cl-ink)]">-</div>
                        <div className="text-xs text-[var(--cl-body)]">Rating</div>
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
                    <div className="text-sm text-[var(--cl-ink)] font-medium break-all">{mentor.email}</div>
                  </div>

                  <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-5 border border-[var(--cl-hairline)] transition-shadow">
                    <div className="w-12 h-12 rounded-[var(--cl-r-xl)] flex items-center justify-center mb-3 bg-[var(--cl-primary)]">
                      <GraduationCap className="w-6 h-6 text-[var(--cl-on-dark)]" />
                    </div>
                    <div className="text-xs text-[var(--cl-muted)] mb-1 uppercase tracking-wide font-semibold">University</div>
                    <div className="text-sm text-[var(--cl-ink)] font-medium">{mentor.universities?.name || mentor.university}</div>
                  </div>

                  <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-5 border border-[var(--cl-hairline)] transition-shadow">
                    <div className="w-12 h-12 rounded-[var(--cl-r-xl)] flex items-center justify-center mb-3 bg-[var(--cl-warning)]">
                      <BookOpen className="w-6 h-6 text-[var(--cl-on-dark)]" />
                    </div>
                    <div className="text-xs text-[var(--cl-muted)] mb-1 uppercase tracking-wide font-semibold">Expertise</div>
                    <div className="text-sm text-[var(--cl-ink)] font-medium">{parseExpertise(mentor.expertise) || 'Various Subjects'}</div>
                  </div>
                </div>

                {/* GitHub & LinkedIn Profiles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GitHub */}
                {(githubConn || githubUrlData) && (
                  <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
                    <h3 className="text-lg font-semibold text-[var(--cl-ink)] mb-4 flex items-center gap-2">
                      <Github className="w-5 h-5 text-[var(--cl-ink)]" />
                      GitHub Profile
                    </h3>
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center gap-4 pb-4 border-b border-[var(--cl-hairline)]">
                        {(githubConn?.github_avatar_url || githubUrlData?.avatar_url) ? (
                          <Image
                            src={githubConn?.github_avatar_url || githubUrlData?.avatar_url || ''}
                            alt={githubConn?.github_username || githubUrlData?.login || 'GitHub'}
                            className="w-12 h-12 rounded-full border border-[var(--cl-hairline)]"
                            width={48}
                            height={48}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[var(--cl-surface-strong)] flex items-center justify-center flex-shrink-0">
                            <Github className="w-6 h-6 text-[var(--cl-muted-soft)]" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[var(--cl-ink)]">@{githubConn?.github_username || githubUrlData?.login}</p>
                          {githubUrlData?.name && <p className="text-xs text-[var(--cl-body)]">{githubUrlData.name}</p>}
                          {githubUrlData?.bio && <p className="text-xs text-[var(--cl-muted)] mt-0.5 italic">&quot;{githubUrlData.bio}&quot;</p>}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[var(--cl-canvas-soft)] rounded-lg p-3 text-center border border-[var(--cl-hairline)]">
                          <p className="text-lg font-semibold text-[var(--cl-ink)]">{githubConn?.public_repos || githubUrlData?.public_repos || 0}</p>
                          <p className="text-xs text-[var(--cl-body)]">Repos</p>
                        </div>
                        <div className="bg-[var(--cl-canvas-soft)] rounded-lg p-3 text-center border border-[var(--cl-hairline)]">
                          <p className="text-lg font-semibold text-[var(--cl-ink)]">{githubConn?.followers || githubUrlData?.followers || 0}</p>
                          <p className="text-xs text-[var(--cl-body)]">Followers</p>
                        </div>
                        <div className="bg-[var(--cl-canvas-soft)] rounded-lg p-3 text-center border border-[var(--cl-hairline)]">
                          <p className="text-lg font-semibold text-[var(--cl-ink)]">{githubConn?.following || githubUrlData?.following || 0}</p>
                          <p className="text-xs text-[var(--cl-body)]">Following</p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-2">
                        {githubUrlData?.company && (
                          <div className="flex items-center gap-2 text-sm text-[var(--cl-body)]">
                            <Briefcase className="w-4 h-4 text-[var(--cl-muted-soft)]" />
                            <span>{githubUrlData.company}</span>
                          </div>
                        )}
                        {githubUrlData?.location && (
                          <div className="flex items-center gap-2 text-sm text-[var(--cl-body)]">
                            <MapPin className="w-4 h-4 text-[var(--cl-muted-soft)]" />
                            <span>{githubUrlData.location}</span>
                          </div>
                        )}
                        {githubUrlData?.blog && (
                          <div className="flex items-center gap-2 text-sm text-[var(--cl-body)]">
                            <ExternalLink className="w-4 h-4 text-[var(--cl-muted-soft)]" />
                            <a href={githubUrlData.blog} target="_blank" rel="noreferrer" className="text-[var(--cl-primary)] hover:underline">
                              Website
                            </a>
                          </div>
                        )}
                        {githubUrlData?.created_at && (
                          <div className="flex items-center gap-2 text-sm text-[var(--cl-body)]">
                            <Clock className="w-4 h-4 text-[var(--cl-muted-soft)]" />
                            <span>Joined {new Date(githubUrlData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>

                      {/* Languages */}
                      {Object.keys(topLanguages).length > 0 && (
                        <div className="bg-[var(--cl-canvas-soft)] rounded-lg p-3 border border-[var(--cl-hairline)]">
                          <p className="text-xs font-semibold text-[var(--cl-body)] mb-2 uppercase">Top Languages</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.keys(topLanguages).slice(0, 5).map((lang) => (
                              <span key={lang} className="text-xs bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] px-2 py-0.5 rounded-full">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* LinkedIn */}
                <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
                  <h3 className="text-lg font-semibold text-[var(--cl-ink)] mb-4 flex items-center gap-2">
                    <Linkedin className="w-5 h-5 text-[var(--cl-info)]" />
                    LinkedIn Profile
                  </h3>

                  {mentor.linkedin_url ? (
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center gap-4 pb-4 border-b border-[var(--cl-info)]">
                        <div className="w-12 h-12 rounded-full bg-[rgba(13,116,206,0.12)] flex items-center justify-center flex-shrink-0">
                          <Linkedin className="w-6 h-6 text-[var(--cl-info)]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--cl-ink)]">LinkedIn</p>
                          <a 
                            href={mentor.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[var(--cl-info)] hover:underline flex items-center gap-1 mt-1"
                          >
                            View Profile <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="bg-[rgba(13,116,206,0.12)] rounded-lg p-4 border border-[var(--cl-info)]">
                        <p className="text-sm text-[var(--cl-body)]">
                          Connect with {mentor.full_name} on LinkedIn to view their detailed professional background, endorsements, and recommendations.
                        </p>
                      </div>

                      {/* Action */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[var(--cl-canvas-soft)] rounded-lg p-3 text-center border border-[var(--cl-hairline)]">
                          <Users className="w-5 h-5 text-[var(--cl-muted-soft)] mx-auto mb-1" />
                          <p className="text-xs font-medium text-[var(--cl-body)]">Connect</p>
                        </div>
                        <div className="bg-[var(--cl-canvas-soft)] rounded-lg p-3 text-center border border-[var(--cl-hairline)]">
                          <Briefcase className="w-5 h-5 text-[var(--cl-muted-soft)] mx-auto mb-1" />
                          <p className="text-xs font-medium text-[var(--cl-body)]">Experience</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[var(--cl-muted-soft)]">
                      <Linkedin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">LinkedIn not linked</p>
                      <p className="text-xs text-[var(--cl-muted-soft)] mt-1">Mentor hasn't added a LinkedIn profile</p>
                    </div>
                  )}
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
                    Experienced mentor at <span className="font-semibold text-[var(--cl-ink)]">{mentor.universities?.name || mentor.university}</span> specializing in <span className="font-semibold text-[var(--cl-ink)]">{parseExpertise(mentor.expertise) || 'various subjects'}</span>. 
                    Dedicated to helping students succeed in their academic journey and providing career guidance with industry insights.
                  </p>
                </div>

                {/* Skills/Specializations */}
                <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 md:p-8 border border-[var(--cl-hairline)]">
                  <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[rgba(171,100,0,0.12)] rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-[var(--cl-warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    Specializations
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-2 bg-[var(--cl-primary-soft)] border border-[var(--cl-primary)] text-[var(--cl-primary)] rounded-[var(--cl-r-lg)] text-sm font-medium">{parseExpertise(mentor.expertise) || 'General Mentorship'}</span>
                    <span className="px-4 py-2 bg-[rgba(13,116,206,0.12)] border border-[var(--cl-info)] text-[var(--cl-info)] rounded-[var(--cl-r-lg)] text-sm font-medium">Career Guidance</span>
                    <span className="px-4 py-2 bg-[rgba(171,100,0,0.12)] border border-[var(--cl-warning)] text-[var(--cl-warning)] rounded-[var(--cl-r-lg)] text-sm font-medium">Academic Support</span>
                    <span className="px-4 py-2 bg-[var(--cl-primary-soft)] border border-[var(--cl-primary)] text-[var(--cl-primary)] rounded-[var(--cl-r-lg)] text-sm font-medium">Industry Insights</span>
                  </div>
                </div>

                {/* Available Courses */}
                <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 md:p-8 border border-[var(--cl-hairline)]">
                  <h2 className="text-xl font-semibold text-[var(--cl-ink)] mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[rgba(13,116,206,0.12)] rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-[var(--cl-info)]" />
                    </div>
                    Available Courses
                  </h2>
                  <div className="text-center py-12 rounded-[var(--cl-r-xl)] border-2 border-dashed border-[var(--cl-hairline)] bg-[var(--cl-canvas)]">
                    <div className="w-16 h-16 bg-[var(--cl-surface-strong)] rounded-[var(--cl-r-xl)] flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-[var(--cl-muted-soft)]" />
                    </div>
                    <h3 className="font-semibold text-[var(--cl-ink)] mb-1">No Courses Yet</h3>
                    <p className="text-sm text-[var(--cl-muted)]">Check back later for course offerings</p>
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
