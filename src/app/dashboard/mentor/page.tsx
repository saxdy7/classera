import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';

export default async function MentorDashboard() {
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

  // Check if profile is complete - only redirect if critical fields are missing
  if (!profile) {
    redirect('/onboarding/mentor');
  }
  
  if (!profile.full_name || !profile.university || profile.university === '') {
    redirect('/onboarding/mentor');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-8">
          {/* Main content area - intentionally empty as requested */}
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-black mb-2">
                Welcome, {profile?.full_name}! 👨‍🏫
              </h2>
              <p className="text-slate-600">
                Your teaching dashboard
              </p>
            </div>

            <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-indigo-900">
                    Your University Community
                  </p>
                  <p className="text-xs text-indigo-700">
                    You can only see and connect with students and mentors from <strong>{profile.university}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="text-3xl font-bold text-indigo-600 mb-2">0</div>
                <div className="text-sm text-slate-600">Active Courses</div>
              </div>
              <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
                <div className="text-sm text-slate-600">Total Students</div>
              </div>
              <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="text-3xl font-bold text-green-600 mb-2">0</div>
                <div className="text-sm text-slate-600">Scheduled Sessions</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
