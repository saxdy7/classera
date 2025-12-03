import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';

export default async function StudentDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Check if profile is complete
  if (!profile?.university || !profile?.full_name) {
    redirect('/onboarding/student');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-8">
          {/* Main content area - intentionally empty as requested */}
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-black mb-2">
                Welcome back, {profile?.full_name}! 🎓
              </h2>
              <p className="text-slate-600">
                Your learning journey continues here
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="text-3xl font-bold text-fuchsia-600 mb-2">0</div>
                <div className="text-sm text-slate-600">Enrolled Courses</div>
              </div>
              <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                <div className="text-sm text-slate-600">Upcoming Classes</div>
              </div>
              <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="text-3xl font-bold text-green-600 mb-2">0%</div>
                <div className="text-sm text-slate-600">Progress</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
