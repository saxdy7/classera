import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Users, Plus, Settings } from 'lucide-react';
import Link from 'next/link';

export default async function MentorCommunitiesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'mentor') redirect('/dashboard');

  // Get all communities
  const { data: communities } = await supabase
    .from('communities')
    .select(`
      *,
      community_members(count)
    `)
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Communities
                </h1>
                <p className="text-slate-600">Manage your student groups</p>
              </div>
              <Link
                href="/dashboard/mentor/communities/create"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Community
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{communities?.length || 0}</div>
                    <div className="text-sm text-slate-600">Total Communities</div>
                  </div>
                  <Users className="w-8 h-8 text-indigo-500" />
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {communities?.filter(c => c.is_active).length || 0}
                    </div>
                    <div className="text-sm text-slate-600">Active</div>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {communities?.reduce((sum, c) => sum + (c.community_members?.[0]?.count || 0), 0) || 0}
                    </div>
                    <div className="text-sm text-slate-600">Total Members</div>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Communities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities && communities.length > 0 ? (
                communities.map((community) => (
                  <div key={community.id} className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                        {community.name.charAt(0)}
                      </div>
                      <Link
                        href={`/dashboard/mentor/communities/${community.id}/settings`}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Settings className="w-5 h-5 text-slate-400" />
                      </Link>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">{community.name}</h3>
                    {community.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{community.description}</p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4" />
                        <span>{community.community_members?.[0]?.count || 0} members</span>
                      </div>
                      {community.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/dashboard/mentor/communities/${community.id}`}
                      className="block w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-semibold rounded-xl transition-colors"
                    >
                      View Community
                    </Link>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-slate-400">
                  <Users className="w-20 h-20 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">No communities yet</p>
                  <p className="text-sm mb-4">Create your first community to get started</p>
                  <Link
                    href="/dashboard/mentor/communities/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create Community
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
