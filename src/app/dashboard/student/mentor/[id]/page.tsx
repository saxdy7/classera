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
    <div className="min-h-screen bg-card">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-6 md:p-12 lg:px-16 cl-main">
          <div className="max-w-[1400px] mx-auto">
            {/* Back Button */}
            <Link
              href="/dashboard/student/find-mentors"
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-foreground/80 hover:text-accent-purple hover:bg-card rounded-lg transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Find Mentors</span>
            </Link>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl border border-border overflow-hidden sticky top-8">
                  {/* Profile Header */}
                  <div className="relative h-32 bg-primary">
                    <div className="absolute inset-0 bg-black/5"></div>
                  </div>
                  
                  <div className="px-6 pb-6">
                    {/* Avatar */}
                    <div className="relative -mt-16 mb-4">
                      {mentor.avatar_url ? (
                        <Image
                          src={mentor.avatar_url}
                          alt={mentor.full_name}
                          className="w-28 h-28 rounded-xl border-4 border-white object-cover"
                          width={112}
                          height={112}
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-xl border-4 border-white flex items-center justify-center text-white text-3xl font-semibold bg-primary">
                          {mentor.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-600 border-4 border-white rounded-full"></div>
                    </div>

                    {/* Name & Title */}
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">{mentor.full_name}</h1>
                    <p className="text-accent-purple font-medium mb-4">{parseExpertise(mentor.expertise) || 'Mentor'}</p>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2 mb-6">
                      <MentorActions mentorId={mentor.id} mentorEmail={mentor.email} />
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-background">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-foreground">{yearsExperience}+</div>
                        <div className="text-xs text-foreground/80">Years Exp.</div>
                      </div>
                      <div className="text-center border-x border-border">
                        <div className="text-2xl font-semibold text-foreground">-</div>
                        <div className="text-xs text-foreground/80">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-foreground">-</div>
                        <div className="text-xs text-foreground/80">Rating</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card rounded-xl p-5 border border-border transition-shadow">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-accent-purple">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-semibold">Email Address</div>
                    <div className="text-sm text-foreground font-medium break-all">{mentor.email}</div>
                  </div>

                  <div className="bg-card rounded-xl p-5 border border-border transition-shadow">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-primary">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-semibold">University</div>
                    <div className="text-sm text-foreground font-medium">{mentor.universities?.name || mentor.university}</div>
                  </div>

                  <div className="bg-card rounded-xl p-5 border border-border transition-shadow">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-amber-500">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-semibold">Expertise</div>
                    <div className="text-sm text-foreground font-medium">{parseExpertise(mentor.expertise) || 'Various Subjects'}</div>
                  </div>
                </div>

                {/* GitHub & LinkedIn Profiles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GitHub */}
                {(githubConn || githubUrlData) && (
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Github className="w-5 h-5 text-foreground" />
                      GitHub Profile
                    </h3>
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center gap-4 pb-4 border-b border-border">
                        {(githubConn?.github_avatar_url || githubUrlData?.avatar_url) ? (
                          <Image
                            src={githubConn?.github_avatar_url || githubUrlData?.avatar_url || ''}
                            alt={githubConn?.github_username || githubUrlData?.login || 'GitHub'}
                            className="w-12 h-12 rounded-full border border-border"
                            width={48}
                            height={48}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <Github className="w-6 h-6 text-muted-foreground/70" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground">@{githubConn?.github_username || githubUrlData?.login}</p>
                          {githubUrlData?.name && <p className="text-xs text-foreground/80">{githubUrlData.name}</p>}
                          {githubUrlData?.bio && <p className="text-xs text-muted-foreground mt-0.5 italic">&quot;{githubUrlData.bio}&quot;</p>}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-muted/40 rounded-lg p-3 text-center border border-border">
                          <p className="text-lg font-semibold text-foreground">{githubConn?.public_repos || githubUrlData?.public_repos || 0}</p>
                          <p className="text-xs text-foreground/80">Repos</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-3 text-center border border-border">
                          <p className="text-lg font-semibold text-foreground">{githubConn?.followers || githubUrlData?.followers || 0}</p>
                          <p className="text-xs text-foreground/80">Followers</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-3 text-center border border-border">
                          <p className="text-lg font-semibold text-foreground">{githubConn?.following || githubUrlData?.following || 0}</p>
                          <p className="text-xs text-foreground/80">Following</p>
                        </div>
                      </div>

                      {/* Details */}
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
                              Website
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

                      {/* Languages */}
                      {Object.keys(topLanguages).length > 0 && (
                        <div className="bg-muted/40 rounded-lg p-3 border border-border">
                          <p className="text-xs font-semibold text-foreground/80 mb-2 uppercase">Top Languages</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.keys(topLanguages).slice(0, 5).map((lang) => (
                              <span key={lang} className="text-xs bg-accent-purple/10 text-accent-purple px-2 py-0.5 rounded-full">
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
                <div className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Linkedin className="w-5 h-5 text-accent-purple" />
                    LinkedIn Profile
                  </h3>

                  {mentor.linkedin_url ? (
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center gap-4 pb-4 border-b border-accent-purple">
                        <div className="w-12 h-12 rounded-full bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
                          <Linkedin className="w-6 h-6 text-accent-purple" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">LinkedIn</p>
                          <a 
                            href={mentor.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent-purple hover:underline flex items-center gap-1 mt-1"
                          >
                            View Profile <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="bg-accent-purple/10 rounded-lg p-4 border border-accent-purple">
                        <p className="text-sm text-foreground/80">
                          Connect with {mentor.full_name} on LinkedIn to view their detailed professional background, endorsements, and recommendations.
                        </p>
                      </div>

                      {/* Action */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/40 rounded-lg p-3 text-center border border-border">
                          <Users className="w-5 h-5 text-muted-foreground/70 mx-auto mb-1" />
                          <p className="text-xs font-medium text-foreground/80">Connect</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-3 text-center border border-border">
                          <Briefcase className="w-5 h-5 text-muted-foreground/70 mx-auto mb-1" />
                          <p className="text-xs font-medium text-foreground/80">Experience</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground/70">
                      <Linkedin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">LinkedIn not linked</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Mentor hasn't added a LinkedIn profile</p>
                    </div>
                  )}
                </div>
                </div>

                {/* About Section */}
                <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent-purple/10 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    About
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    Experienced mentor at <span className="font-semibold text-foreground">{mentor.universities?.name || mentor.university}</span> specializing in <span className="font-semibold text-foreground">{parseExpertise(mentor.expertise) || 'various subjects'}</span>. 
                    Dedicated to helping students succeed in their academic journey and providing career guidance with industry insights.
                  </p>
                </div>

                {/* Skills/Specializations */}
                <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    Specializations
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-2 bg-accent-purple/10 border border-accent-purple text-accent-purple rounded-lg text-sm font-medium">{parseExpertise(mentor.expertise) || 'General Mentorship'}</span>
                    <span className="px-4 py-2 bg-accent-purple/10 border border-accent-purple text-accent-purple rounded-lg text-sm font-medium">Career Guidance</span>
                    <span className="px-4 py-2 bg-amber-500/10 border border-amber-500 text-amber-600 rounded-lg text-sm font-medium">Academic Support</span>
                    <span className="px-4 py-2 bg-accent-purple/10 border border-accent-purple text-accent-purple rounded-lg text-sm font-medium">Industry Insights</span>
                  </div>
                </div>

                {/* Available Courses */}
                <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent-purple/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-accent-purple" />
                    </div>
                    Available Courses
                  </h2>
                  <div className="text-center py-12 rounded-xl border-2 border-dashed border-border bg-background">
                    <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-muted-foreground/70" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">No Courses Yet</h3>
                    <p className="text-sm text-muted-foreground">Check back later for course offerings</p>
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
