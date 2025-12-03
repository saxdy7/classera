import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { BookOpen, Clock, Award, Play } from 'lucide-react';

export default async function StudentCoursesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile?.university || !profile?.full_name) {
    redirect('/onboarding/student');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-black mb-2">My Courses</h2>
              <p className="text-slate-600">Track your enrolled courses and progress</p>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-fuchsia-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-fuchsia-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Active Courses</p>
                    <p className="text-2xl font-bold text-black">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Hours Learned</p>
                    <p className="text-2xl font-bold text-black">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Completed</p>
                    <p className="text-2xl font-bold text-black">0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">No Courses Yet</h3>
              <p className="text-slate-600 mb-6">
                Start your learning journey by finding a mentor and enrolling in courses
              </p>
              <button className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
                Find Mentors
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
