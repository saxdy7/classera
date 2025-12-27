import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { FileText, Plus, Calendar, Users, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function MentorTestsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'mentor') redirect('/dashboard');

  // Get all tests created by this mentor
  const { data: tests } = await supabase
    .from('tests')
    .select('*, communities(name)')
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Test Management
                </h1>
                <p className="text-slate-600">Create and manage your assessments</p>
              </div>
              <Link
                href="/dashboard/mentor/tests/create"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Test
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{tests?.length || 0}</div>
                    <div className="text-sm text-slate-600">Total Tests</div>
                  </div>
                  <FileText className="w-8 h-8 text-indigo-500" />
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {tests?.filter(t => t.is_live).length || 0}
                    </div>
                    <div className="text-sm text-slate-600">Live Now</div>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {tests?.filter(t => new Date(t.scheduled_at) > new Date()).length || 0}
                    </div>
                    <div className="text-sm text-slate-600">Upcoming</div>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {tests?.filter(t => new Date(t.scheduled_at) < new Date() && !t.is_live).length || 0}
                    </div>
                    <div className="text-sm text-slate-600">Completed</div>
                  </div>
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Tests List */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 shadow-lg">
              <h2 className="text-xl font-bold text-slate-900 mb-6">All Tests</h2>
              
              {tests && tests.length > 0 ? (
                <div className="space-y-3">
                  {tests.map((test) => (
                    <Link
                      key={test.id}
                      href={`/dashboard/mentor/tests/${test.id}`}
                      className="block p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                            {test.title}
                          </h3>
                          {test.description && (
                            <p className="text-sm text-slate-600 mt-1">{test.description}</p>
                          )}
                        </div>
                        {test.is_live && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-700 font-bold">LIVE</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(test.scheduled_at).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          {test.duration_minutes} minutes
                        </div>
                        <div className="px-3 py-1 bg-white/60 rounded-lg text-xs font-semibold text-indigo-700">
                          {test.test_type === 'individual' ? '👤 Individual' : '👥 Group'}
                        </div>
                        <div className="px-3 py-1 bg-white/60 rounded-lg text-xs font-semibold text-purple-700">
                          {test.question_type}
                        </div>
                        {test.communities && (
                          <div className="px-3 py-1 bg-white/60 rounded-lg text-xs font-semibold text-slate-700">
                            {test.communities.name}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400">
                  <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-3xl flex items-center justify-center">
                    <FileText className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-lg font-semibold mb-2">No tests created yet</p>
                  <p className="text-sm mb-4">Create your first test to get started</p>
                  <Link
                    href="/dashboard/mentor/tests/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create Test
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
