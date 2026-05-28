import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Calendar, CheckCircle, GitBranch, Hourglass, Plus, Star, Sparkles, Code, ExternalLink, Eye, Edit, Trash2, FileText, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StudentProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'student') redirect('/dashboard/mentor');

  // Get all assignments assigned to this student, with submissions
  const { data: assignedRows } = await admin
    .from('assignment_students')
    .select(`
      assignment_id,
      assigned_at,
      project_assignments (
        id, title, description, technologies, deadline, max_score, is_active,
        users!project_assignments_mentor_id_fkey (full_name, avatar_url)
      )
    `)
    .eq('student_id', user.id)
    .order('assigned_at', { ascending: false });

  // Get my submissions
  const assignmentIds = (assignedRows ?? []).map((r) => r.assignment_id);
  const { data: submissions } = assignmentIds.length
    ? await admin
        .from('assignment_submissions')
        .select('assignment_id, status, submitted_at, repo_full_name')
        .eq('student_id', user.id)
        .in('assignment_id', assignmentIds)
    : { data: [] };

  const { data: evaluations } = await admin
    .from('project_evaluations')
    .select('assignment_id, score')
    .eq('student_id', user.id);

  const submissionMap = new Map((submissions ?? []).map((s) => [s.assignment_id, s]));
  const evaluationMap = new Map((evaluations ?? []).map((e) => [e.assignment_id, e]));

  const now = new Date();
  const totalAssigned = (assignedRows ?? []).length;
  const totalSubmitted = (submissions ?? []).length;
  const totalGraded = (evaluations ?? []).filter(e => e.score !== null).length;
  const totalPending = totalAssigned - totalSubmitted;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header profile={{ id: '1', full_name: 'Student', role: 'student', avatar_url: '' }} />
      <div className="flex">
        <Sidebar role="student" />
        <main className="flex-1 md:ml-24 p-6 md:p-8">
          <div className="max-w-6xl mx-auto">

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-violet-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                <GitBranch className="w-4 h-4" />
                Clario Project Hub
              </div>
              <h1 className="text-3xl font-black text-slate-900 leading-none">Your Engineering Roadmap.</h1>
              <p className="text-slate-500 mt-2 font-medium">Build, commit, and master your technical skills.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Assigned', value: totalAssigned, color: 'bg-white border-slate-200', text: 'text-slate-900' },
                { label: 'Completed', value: totalSubmitted, color: 'bg-white border-slate-200', text: 'text-slate-900' },
                { label: 'Pending', value: totalPending, color: 'bg-white border-slate-200', text: 'text-amber-600' },
                { label: 'Market Ready', value: 'A+', color: 'bg-indigo-600 border-indigo-500', text: 'text-white' },
              ].map(({ label, value, color, text }) => (
                <div key={label} className={`${color} border rounded-3xl p-6 shadow-sm`}>
                  <p className={`text-3xl font-black italic ${text || 'text-slate-900'}`}>{value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">{label}</p>
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Projects List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Current Assignments</h3>
                {(!assignedRows || assignedRows.length === 0) ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                    <p className="text-slate-400 font-bold italic">No active projects yet.</p>
                  </div>
                ) : (
                  assignedRows.map((row) => {
                    const a = row.project_assignments as any;
                    if (!a) return null;
                    const submission = submissionMap.get(row.assignment_id);
                    const evaluation = evaluationMap.get(row.assignment_id);
                    
                    return (
                      <Link key={row.assignment_id} href={`/dashboard/student/projects/${row.assignment_id}`}
                        className="group bg-white border border-slate-200 p-6 rounded-[2rem] hover:border-indigo-400 transition-all flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-indigo-500/5">
                        <div className="flex gap-5 items-center">
                           <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <GitBranch size={20} />
                           </div>
                           <div>
                              <h4 className="text-lg font-black text-slate-800">{a.title}</h4>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Deadline: {a.deadline ? new Date(a.deadline).toLocaleDateString() : 'No limit'}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           {evaluation && (
                             <div className="text-right">
                                <p className="text-xl font-black text-indigo-600 italic leading-none">{evaluation.score}/{a.max_score}</p>
                                <p className="text-[10px] font-black text-slate-300 uppercase mt-1">Grade</p>
                             </div>
                           )}
                           <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                              <ArrowRight size={18} />
                           </div>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>

              {/* GitHub Insights Sidebar */}
              <div className="space-y-6">
                 <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center">
                          <GitBranch className="text-indigo-400 w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest">GitHub Intelligence</h4>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Commits</p>
                            <p className="text-xl font-black italic">1,240</p>
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Impact</p>
                            <p className="text-xl font-black italic">Top 5%</p>
                          </div>
                        </div>

                        <div className="p-6 bg-indigo-600/10 border border-indigo-500/30 rounded-3xl">
                          <div className="flex justify-between items-end mb-4">
                            <p className="text-[10px] font-black uppercase text-indigo-400">Market Readiness Score</p>
                            <Sparkles className="text-indigo-400 w-6 h-6" />
                          </div>
                          <p className="text-4xl font-black italic text-white mb-4">A+</p>
                          <p className="text-[11px] leading-relaxed text-slate-300 font-medium">
                            "You are demonstrating elite consistency in **Next.js** and **PostgreSQL** architectures."
                          </p>
                        </div>
                      </div>
                    </div>
                 </div>

                 <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Mentor Feedback</h4>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 italic font-medium text-slate-600 text-xs leading-relaxed">
                       "Focus on adding unit tests to your authentication flow. Great depth on the UI components."
                    </div>
                 </div>
              </div>

            </div>

            {/* Repository Explorer Section */}
            <div className="mt-16 pt-8 border-t border-slate-200">
              <div className="mb-8">
                <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                  <Code className="w-4 h-4" />
                  Source Code & Repository
                </div>
                <h2 className="text-2xl font-black text-slate-900">Explore Your Project Code</h2>
                <p className="text-slate-500 mt-2 font-medium">Browse repository structures, source code roadmap, and view files directly from GitHub.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedRows && assignedRows.length > 0 ? (
                  assignedRows
                    .filter((row) => {
                      const a = row.project_assignments as any;
                      return a && a.github_repo_url;
                    })
                    .slice(0, 6)
                    .map((row) => {
                      const a = row.project_assignments as any;
                      if (!a || !a.github_repo_url) return null;

                      const urlParts = a.github_repo_url
                        .replace('https://github.com/', '')
                        .replace('.git', '')
                        .split('/');

                      if (urlParts.length < 2) return null;

                      return (
                        <div
                          key={row.assignment_id}
                          className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition overflow-hidden"
                        >
                          {/* Header */}
                          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                                <Code className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm truncate">{a.title}</h4>
                                <p className="text-xs text-slate-500 mt-1 truncate">
                                  {urlParts[0]}/{urlParts[1]}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="px-6 py-3 text-xs text-slate-600 line-clamp-2 border-b border-slate-100">
                            {a.description || 'View source code and explore repository structure'}
                          </div>

                          {/* Actions */}
                          <div className="p-4 flex gap-2">
                            <Link
                              href={`/dashboard/student/projects/${row.assignment_id}/src`}
                              className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-xs font-bold text-center flex items-center justify-center gap-1"
                            >
                              <MapPin className="w-3 h-3" />
                              Src Roadmap
                            </Link>
                            <Link
                              href={`/dashboard/student/projects/${row.assignment_id}/repository`}
                              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-xs font-bold text-center flex items-center justify-center gap-1"
                            >
                              <Code className="w-3 h-3" />
                              Full Explorer
                            </Link>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <Code className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No projects with repositories yet</p>
                    <p className="text-xs text-slate-400 mt-1">Link a GitHub repository to any project to explore its source code</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
