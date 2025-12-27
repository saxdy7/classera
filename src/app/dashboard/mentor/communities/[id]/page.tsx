import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Users, Settings, UserPlus, MessageSquare } from 'lucide-react';

export default async function CommunityDetailPage({ params }: { params: { id: string } }) {
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

  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!community) {
    redirect('/dashboard/mentor/communities');
  }

  // Get pending join requests
  const { data: pendingRequests } = await supabase
    .from('community_members')
    .select('*, users(full_name, email)')
    .eq('community_id', params.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Get approved members
  const { data: members } = await supabase
    .from('community_members')
    .select('*, users(full_name, email)')
    .eq('community_id', params.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Community Header */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-black mb-2">{community.name}</h1>
                    <p className="text-slate-600">{community.description}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4" />
                        {community.member_count} members
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        community.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {community.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pending Join Requests */}
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-black flex items-center gap-2">
                    <UserPlus className="w-6 h-6" />
                    Pending Requests
                  </h2>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    {pendingRequests?.length || 0}
                  </span>
                </div>

                <div className="space-y-3">
                  {pendingRequests && pendingRequests.length > 0 ? (
                    pendingRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <p className="font-medium text-black">{request.users.full_name}</p>
                          <p className="text-sm text-slate-600">{request.users.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                            Approve
                          </button>
                          <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No pending requests</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Community Members */}
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-black flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Members
                  </h2>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                    {members?.length || 0}
                  </span>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {members && members.length > 0 ? (
                    members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {member.users.full_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-black">{member.users.full_name}</p>
                            <p className="text-sm text-slate-600">{member.users.email}</p>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                          <MessageSquare className="w-5 h-5 text-slate-600" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No members yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Community Activity / Posts Section */}
            <div className="mt-8 bg-white rounded-xl p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-black mb-6">Recent Activity</h2>
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">No posts yet in this community</p>
                <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                  Create First Post
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
