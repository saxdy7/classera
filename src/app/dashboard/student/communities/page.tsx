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

  // Mock communities data
  const communities = [
    {
      id: 1,
      name: 'Web Development Study Group',
      description: 'Learn modern web technologies together',
      members: 45,
      mentor: 'Dr. Sarah Johnson',
      image: '💻',
      joined: true,
    },
    {
      id: 2,
      name: 'Data Science Enthusiasts',
      description: 'Explore data analysis and machine learning',
      members: 32,
      mentor: 'Prof. Michael Chen',
      image: '📊',
      joined: true,
    },
    {
      id: 3,
      name: 'Mobile App Developers',
      description: 'Build amazing mobile applications',
      members: 28,
      mentor: 'Dr. Emily Brown',
      image: '📱',
      joined: false,
    },
    {
      id: 4,
      name: 'AI & Machine Learning',
      description: 'Dive deep into artificial intelligence',
      members: 56,
      mentor: 'Prof. David Lee',
      image: '🤖',
      joined: false,
    },
    {
      id: 5,
      name: 'Cloud Computing',
      description: 'Master AWS, Azure, and GCP',
      members: 38,
      mentor: 'Dr. Robert Wilson',
      image: '☁️',
      joined: false,
    },
    {
      id: 6,
      name: 'Cybersecurity Warriors',
      description: 'Learn ethical hacking and security',
      members: 41,
      mentor: 'Prof. Lisa Anderson',
      image: '🔒',
      joined: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={profile} />
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
              <button className="pb-3 px-1 font-semibold text-purple-600">
                All Communities
              </button>
              <button className="pb-3 px-1 font-semibold text-slate-500 hover:text-slate-700">
                My Communities
              </button>
            </div>

            {/* Communities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communities.map((community) => (
                <div
                  key={community.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center text-3xl">
                      {community.image}
                    </div>
                    {community.joined ? (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                        Joined
                      </span>
                    ) : (
                      <button className="w-8 h-8 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center transition-colors">
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 mb-2">{community.name}</h3>
                  <p className="text-sm text-slate-600 mb-4">{community.description}</p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <UsersRound className="w-4 h-4" />
                      <span>{community.members} members</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-slate-500">Mentor: {community.mentor}</p>
                  </div>

                  {community.joined && (
                    <button className="w-full mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors">
                      View Community
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
