import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Mail, GraduationCap, BookOpen, ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';

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

  return (
    <div className="min-h-screen bg-white">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-6 md:p-12 lg:px-16 md:ml-24">
          <div className="max-w-[1400px] mx-auto">
            {/* Back Button */}
            <Link
              href="/dashboard/mentor/students"
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Students</span>
            </Link>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm sticky top-8">
                  {/* Profile Header */}
                  <div className="relative h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400">
                    <div className="absolute inset-0 bg-black/5"></div>
                  </div>
                  
                  <div className="px-6 pb-6">
                    {/* Avatar */}
                    <div className="relative -mt-16 mb-4">
                      {student.avatar_url ? (
                        <Image
                          src={student.avatar_url}
                          alt={student.full_name}
                          className="w-28 h-28 rounded-3xl border-4 border-white shadow-xl object-cover"
                          width={112}
                          height={112}
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-3xl border-4 border-white shadow-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 flex items-center justify-center text-white text-3xl font-bold">
                          {student.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>

                    {/* Name & Title */}
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">{student.full_name}</h1>
                    <p className="text-indigo-600 font-medium mb-4">{student.specialization_board || 'Student'}</p>
                    
                    {/* Action Button */}
                    <Link
                      href={`/dashboard/mentor/messages?userId=${student.id}`}
                      className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 mb-6"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Send Message
                    </Link>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-100">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">{enrolledCourses}</div>
                        <div className="text-xs text-slate-600">Courses</div>
                      </div>
                      <div className="text-center border-x border-slate-200">
                        <div className="text-2xl font-bold text-slate-900">{totalHours}h</div>
                        <div className="text-xs text-slate-600">Hours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">{completedAssignments}</div>
                        <div className="text-xs text-slate-600">Projects</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-semibold">Email Address</div>
                    <div className="text-sm text-slate-900 font-medium break-all">{student.email}</div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-semibold">University</div>
                    <div className="text-sm text-slate-900 font-medium">{student.universities?.name || student.university}</div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/30">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-semibold">Field of Study</div>
                    <div className="text-sm text-slate-900 font-medium">{student.specialization_board || 'Not specified'}</div>
                  </div>
                </div>

                {/* About Section */}
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    About
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    Student at <span className="font-semibold text-slate-900">{student.universities?.name || student.university}</span> studying <span className="font-semibold text-slate-900">{student.specialization_board || 'various subjects'}</span>.
                    Actively engaged in learning and seeking mentorship opportunities to excel in academic and professional pursuits.
                  </p>
                </div>

                {/* Learning Progress */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-blue-100">Study Hours</div>
                      <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold mb-1">{totalHours}h</p>
                    <p className="text-xs text-blue-100">Total learning time</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-purple-100">Assignments</div>
                      <svg className="w-5 h-5 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold mb-1">{completedAssignments}</p>
                    <p className="text-xs text-purple-100">Completed tasks</p>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-indigo-100">Achievements</div>
                      <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold mb-1">0</p>
                    <p className="text-xs text-indigo-100">Badges earned</p>
                  </div>
                </div>

                {/* Enrolled Courses */}
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                    </div>
                    Enrolled Courses
                  </h2>
                  <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">No Courses Enrolled</h3>
                    <p className="text-sm text-slate-500">Student hasn't enrolled in any courses yet</p>
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
