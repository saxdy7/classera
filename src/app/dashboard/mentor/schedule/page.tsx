import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Calendar, Clock, Plus } from 'lucide-react';

export default async function MentorSchedulePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(*)')
    .eq('id', user.id)
    .single();

  if (!profile?.university_id || !profile?.full_name) {
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
                <h2 className="text-3xl font-bold text-black mb-2">Schedule</h2>
                <p className="text-slate-600">Manage your teaching schedule</p>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Schedule Session
              </button>
            </div>

            {/* Calendar View */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-black">December 2025</h3>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    Previous
                  </button>
                  <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    Next
                  </button>
                </div>
              </div>

              {/* Empty Calendar State */}
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">No Scheduled Sessions</h3>
                <p className="text-slate-600 mb-6">
                  Schedule your teaching sessions and classes
                </p>
                <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Schedule Your First Session
                </button>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-black mb-4">Upcoming Sessions</h3>
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No upcoming sessions scheduled</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
