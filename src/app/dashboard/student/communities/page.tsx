import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { UsersRound, Search, Plus } from 'lucide-react';

export default async function StudentCommunitiesPage() {
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
    redirect('/onboarding/student');
  }

  // Fetch real communities from database
  const { data: communities } = await supabase
    .from('communities')
    .select('*')
    .eq('university_id', profile.university_id);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={{ id: user.id, ...profile }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 p-4 md:p-8 md:ml-24">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-black flex items-center gap-3 mb-2">
                <UsersRound className="w-8 h-8 text-purple-600" />
                Communities
              </h2>
              <p className="text-slate-600">Connect with peers and learn together</p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search communities..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
              <button className="pb-3 px-1 font-semibold text-purple-600 border-b-2 border-purple-600">
                All Communities
              </button>
              <button className="pb-3 px-1 font-semibold text-slate-500 hover:text-slate-700">
                My Communities
              </button>
            </div>

            {/* Empty State */}
            {!communities || communities.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersRound className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Communities Yet</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  Communities will be created by mentors. Once a mentor creates a community,
                  you'll be able to join and collaborate with your peers.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                  <UsersRound className="w-4 h-4" />
                  Communities coming soon
                </div>
              </div>
            ) : (
              /* Communities Grid - Will show when communities exist */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {communities.map((community: any) => (
                  <div
                    key={community.id}
                    className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center text-3xl">
                        👥
                      </div>
                      <button className="w-8 h-8 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center transition-colors">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    <h3 className="font-bold text-slate-900 mb-2">{community.name}</h3>
                    <p className="text-sm text-slate-600 mb-4">{community.description}</p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-500">
                        <UsersRound className="w-4 h-4" />
                        <span>0 members</span>
                      </div>
                    </div>

                    <button className="w-full mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors">
                      Join Community
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
