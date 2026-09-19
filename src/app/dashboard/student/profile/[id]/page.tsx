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
    <div className="min-h-screen bg-[var(--cl-canvas)]">
      <Header profile={currentProfile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 cl-main p-8">
          {/* Header Section */}
          <div className="mb-8 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/dashboard/student/connect-students" className="inline-flex items-center gap-2 text-[var(--cl-primary)] hover:text-[var(--cl-primary)] text-sm font-medium mb-4">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Students
                </Link>
                <h1 className="text-3xl font-semibold text-black">{student.full_name}</h1>
              </div>
              
              {/* More Options Menu */}
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-[var(--cl-surface-card)] rounded-lg transition border border-[var(--cl-hairline)]">
                  <Share2 className="w-5 h-5 text-[var(--cl-body)]" />
                </button>
                <button className="p-2 hover:bg-[var(--cl-surface-card)] rounded-lg transition border border-[var(--cl-hairline)]">
                  <Download className="w-5 h-5 text-[var(--cl-body)]" />
                </button>
                <button className="p-2 hover:bg-[var(--cl-surface-card)] rounded-lg transition border border-[var(--cl-hairline)]">
                  <MoreVertical className="w-5 h-5 text-[var(--cl-body)]" />
                </button>
              </div>
            </div>
          </div>

          {/* Profile Header Card */}
          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-8 mb-10 max-w-2xl">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <Image
                  src={student.avatar_url || `https://ui-avatars.com/api/?name=${student.full_name}`}
                  alt={student.full_name}
                  width={140}
                  height={140}
                  className="rounded-full border-4 border-[var(--cl-primary)]"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {student.specialization_board && (
                    <span className="px-3 py-1.5 bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] rounded-full text-xs font-semibold border border-[var(--cl-primary)]">
                      {student.specialization_board}
                    </span>
                  )}
                  {student.current_semester && (
                    <span className="px-3 py-1.5 bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)] rounded-full text-xs font-semibold border border-[var(--cl-info)]">
                      Semester {student.current_semester}
                    </span>
                  )}
                </div>

                {/* Bio */}
                {student.bio && (
                  <p className="text-[var(--cl-body)] mb-6 leading-relaxed">{student.bio}</p>
                )}

                {/* Contact Info */}
                <div className="space-y-3 mb-6 pb-6 border-b border-[var(--cl-hairline)]">
                  {student.universities && (
                    <div className="flex items-center gap-3 text-[var(--cl-body)]">
                      <MapPin className="w-5 h-5 text-[var(--cl-primary)] flex-shrink-0" />
                      <span>{student.universities.name}</span>
                    </div>
                  )}
                  {student.email && (
                    <div className="flex items-center gap-3 text-[var(--cl-body)]">
                      <Mail className="w-5 h-5 text-[var(--cl-primary)] flex-shrink-0" />
                      <a href={`mailto:${student.email}`} className="hover:text-indigo-600 underline">
                        {student.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex gap-3">
                  {student.github_url && (
                    <a href={student.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--cl-surface-inverse)] text-[var(--cl-on-dark)] rounded-lg hover:bg-[var(--cl-surface-inverse)] transition text-sm font-medium">
                      <Github className="w-4 h-4" />
                      GitHub
                    </a>
                  )}
                  {student.linkedin_url && (
                    <a href={student.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--cl-info)] text-[var(--cl-on-dark)] rounded-lg hover:bg-[var(--cl-info)] transition text-sm font-medium">
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
          <div className="max-w-2xl">
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
