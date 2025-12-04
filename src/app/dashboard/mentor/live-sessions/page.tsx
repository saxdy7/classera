import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Video, Plus, Clock } from 'lucide-react';

export default async function MentorLiveSessionsPage() {
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
    redirect('/onboarding/mentor');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-black mb-2">Live Sessions</h2>
                <p className="text-slate-600">Host and manage live teaching sessions</p>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Start Live Session
              </button>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Video className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Live Now</p>
                    <p className="text-2xl font-bold text-black">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Scheduled</p>
                    <p className="text-2xl font-bold text-black">0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Sessions List */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-black">Your Sessions</h3>
              </div>

              {/* Empty State */}
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">No Live Sessions</h3>
                <p className="text-slate-600 mb-6">
                  Start hosting live sessions with your students
                </p>
                <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Host Your First Session
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
