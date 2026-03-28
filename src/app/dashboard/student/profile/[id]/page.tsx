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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Header profile={currentProfile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-8">
          {/* Header Section */}
          <div className="mb-8 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/dashboard/student/connect-students" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Students
                </Link>
                <h1 className="text-3xl font-bold text-black">{student.full_name}</h1>
              </div>
              
              {/* More Options Menu */}
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white rounded-lg transition border border-slate-200">
                  <Share2 className="w-5 h-5 text-slate-600" />
                </button>
                <button className="p-2 hover:bg-white rounded-lg transition border border-slate-200">
                  <Download className="w-5 h-5 text-slate-600" />
                </button>
                <button className="p-2 hover:bg-white rounded-lg transition border border-slate-200">
                  <MoreVertical className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-md p-8 mb-10 max-w-2xl">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <Image
                  src={student.avatar_url || `https://ui-avatars.com/api/?name=${student.full_name}`}
                  alt={student.full_name}
                  width={140}
                  height={140}
                  className="rounded-full border-4 border-indigo-100 shadow-md"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {student.specialization_board && (
                    <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-200">
                      {student.specialization_board}
                    </span>
                  )}
                  {student.current_semester && (
                    <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                      Semester {student.current_semester}
                    </span>
                  )}
                </div>

                {/* Bio */}
                {student.bio && (
                  <p className="text-slate-600 mb-6 leading-relaxed">{student.bio}</p>
                )}

                {/* Contact Info */}
                <div className="space-y-3 mb-6 pb-6 border-b border-slate-100">
                  {student.universities && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      <span>{student.universities.name}</span>
                    </div>
                  )}
                  {student.email && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <Mail className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      <a href={`mailto:${student.email}`} className="hover:text-indigo-600 underline">
                        {student.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex gap-3">
                  {student.github_url && (
                    <a href={student.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm font-medium">
                      <Github className="w-4 h-4" />
                      GitHub
                    </a>
                  )}
                  {student.linkedin_url && (
                    <a href={student.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
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
