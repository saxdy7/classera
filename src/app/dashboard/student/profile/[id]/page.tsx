import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Mail, BookOpen, ArrowLeft, Github, Users, Code, MapPin, ExternalLink, Award, Zap, MoreVertical, Download, Share2 } from 'lucide-react';
import Link from 'next/link';
import { StudentConnectionActions } from '@/components/student/StudentConnectionActions';
import { ProfileContent } from '@/components/student/ProfileContent';
import { btnPrimary, btnSecondary } from '@/components/shell';

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  // Get current user's profile
  const { data: currentProfile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!currentProfile?.university_id || !currentProfile?.full_name) {
    redirect('/onboarding/student');
  }

  // Prevent viewing own profile this way
  if (id === user.id) {
    redirect('/dashboard/student/profile');
  }

  // Get target student profile
  const { data: student } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', id)
    .eq('role', 'student')
    .single();

  if (!student) {
    redirect('/dashboard/student/connect-students');
  }

  // Check connection status
  const { data: connectionRequest } = await supabase
    .from('connection_requests')
    .select('*')
    .or(`and(requester_id.eq.${user.id},receiver_id.eq.${id}),and(requester_id.eq.${id},receiver_id.eq.${user.id})`)
    .single();

  // Get student's courses
  const { data: courses } = await supabase
    .from('course_enrollments')
    .select('courses(id, title, subject)')
    .eq('user_id', id)
    .limit(5);

  // Get student's GitHub connection
  const admin = createAdminClient();
  const { data: githubConn } = await admin
    .from('github_connections')
    .select('github_username, public_repos, followers')
    .eq('user_id', id)
    .single();

  // Get student's roadmaps
  const { data: roadmaps } = await supabase
    .from('roadmaps')
    .select('id, title, progress')
    .eq('created_by', id)
    .limit(5);

  return (
    <div className="min-h-screen bg-background">
      <Header profile={currentProfile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-8">
          {/* Header Section */}
          <div className="mb-8 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/dashboard/student/connect-students" className="inline-flex items-center gap-2 text-accent-purple hover:text-accent-purple text-sm font-medium mb-4">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Students
                </Link>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">{student.full_name}</h1>
              </div>
              
              {/* More Options Menu */}
              <div className="flex items-center gap-2">
                <button className={`${btnSecondary} size-9 px-0`}>
                  <Share2 className="size-4" />
                </button>
                <button className={`${btnSecondary} size-9 px-0`}>
                  <Download className="size-4" />
                </button>
                <button className={`${btnSecondary} size-9 px-0`}>
                  <MoreVertical className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Profile Header Card */}
          <div className="mb-6 rounded-xl border bg-card p-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <Image
                  src={student.avatar_url || `https://ui-avatars.com/api/?name=${student.full_name}`}
                  alt={student.full_name}
                  width={112}
                  height={112}
                  className="size-28 rounded-full border object-cover"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {student.specialization_board && (
                    <span className="inline-flex items-center rounded-full border bg-muted px-3 py-1 text-xs font-medium text-foreground">
                      {student.specialization_board}
                    </span>
                  )}
                  {student.current_semester && (
                    <span className="inline-flex items-center rounded-full border bg-muted px-3 py-1 text-xs font-medium text-foreground">
                      Semester {student.current_semester}
                    </span>
                  )}
                </div>

                {/* Bio */}
                {student.bio && (
                  <p className="text-foreground/80 mb-6 leading-relaxed">{student.bio}</p>
                )}

                {/* Contact Info */}
                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  {student.universities && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <MapPin className="size-4 shrink-0 text-muted-foreground" />
                      <span>{student.universities.name}</span>
                    </div>
                  )}
                  {student.email && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Mail className="size-4 shrink-0 text-muted-foreground" />
                      <a href={`mailto:${student.email}`} className="text-foreground hover:underline">
                        {student.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex gap-3">
                  {student.github_url && (
                    <a href={student.github_url} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
                      <Github className="w-4 h-4" />
                      GitHub
                    </a>
                  )}
                  {student.linkedin_url && (
                    <a href={student.linkedin_url} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
                      <ExternalLink className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>

              {/* Connection Action */}
              <div className="flex-shrink-0 w-full md:w-auto">
                <StudentConnectionActions
                  studentId={id}
                  currentUserId={user.id}
                  connectionStatus={connectionRequest?.status}
                  isRequester={connectionRequest?.requester_id === user.id}
                  studentName={student.full_name}
                />
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div>
            <ProfileContent 
              roadmaps={roadmaps}
              courses={courses ? courses.map((c: any) => (c.courses ? { id: c.courses.id, title: c.courses.title, subject: c.courses.subject } : null)).filter((c): c is any => c !== null) : null}
              githubConn={githubConn}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
