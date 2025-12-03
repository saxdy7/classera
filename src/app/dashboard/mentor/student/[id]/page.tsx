import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
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
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile?.university || !profile?.full_name) {
    redirect('/onboarding/mentor');
  }

  // Get student profile
  const { data: student } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'student')
    .single();

  if (!student) {
    redirect('/dashboard/mentor/students');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link
              href="/dashboard/mentor/students"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-black mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Students
            </Link>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Header Background */}
              <div className="h-32 bg-gradient-to-r from-fuchsia-500 to-purple-500"></div>

              {/* Profile Content */}
              <div className="px-8 pb-8">
                {/* Avatar */}
                <div className="relative -mt-16 mb-6">
                  {student.avatar_url ? (
                    <img
                      src={student.avatar_url}
                      alt={student.full_name}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                      {student.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name and Role */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-black mb-2">{student.full_name}</h1>
                  <p className="text-xl text-slate-600 mb-4">{student.field_of_study || 'Student'}</p>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Send Message
                    </button>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Email</p>
                      <p className="font-medium text-black">{student.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">University</p>
                      <p className="font-medium text-black">{student.university}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-fuchsia-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-fuchsia-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Field of Study</p>
                      <p className="font-medium text-black">{student.field_of_study || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="border-t border-slate-200 pt-8">
                  <h2 className="text-xl font-bold text-black mb-4">About</h2>
                  <p className="text-slate-700 leading-relaxed">
                    Student at {student.university} studying {student.field_of_study || 'various subjects'}. 
                    Actively engaged in learning and seeking mentorship opportunities.
                  </p>
                </div>

                {/* Enrolled Courses Section */}
                <div className="border-t border-slate-200 pt-8 mt-8">
                  <h2 className="text-xl font-bold text-black mb-4">Enrolled Courses</h2>
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No courses enrolled yet</p>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="border-t border-slate-200 pt-8 mt-8">
                  <h2 className="text-xl font-bold text-black mb-4">Learning Progress</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                      <p className="text-sm text-blue-700 mb-1">Total Hours</p>
                      <p className="text-2xl font-bold text-blue-900">0h</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                      <p className="text-sm text-purple-700 mb-1">Assignments</p>
                      <p className="text-2xl font-bold text-purple-900">0</p>
                    </div>
                    <div className="bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 rounded-xl p-4">
                      <p className="text-sm text-fuchsia-700 mb-1">Achievements</p>
                      <p className="text-2xl font-bold text-fuchsia-900">0</p>
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
