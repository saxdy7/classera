'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
import { useAITokenBalance } from '@/hooks/useAITokens';
import { CreditsModal } from '@/components/shared/CreditsDisplay';
import {
  LayoutDashboard, BookOpen, ClipboardCheck,
  Users, Video, UsersRound, MapIcon, FileText, User,
  ChevronDown, ChevronUp, Sparkles, GraduationCap, Bot,
  MessageSquare, BarChart2, GitBranch, Wallet, Search,
  Briefcase, School, FileCheck, Target,
} from 'lucide-react';

interface SidebarProps {
  role: 'student' | 'mentor';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: tokenData } = useAITokenBalance(userId || '');
  const credits = tokenData?.balance || 0;

  const isStudent = role === 'student';

  // Color tokens per role
  const clr = isStudent
    ? { active: 'bg-indigo-600', dot: 'bg-indigo-400', section: 'text-indigo-400', icon: 'text-indigo-500' }
    : { active: 'bg-sky-600', dot: 'bg-sky-400', section: 'text-sky-400', icon: 'text-sky-500' };

  const studentNav = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/student', exact: true },
    { icon: Users, label: 'Find Mentors', href: '/dashboard/student/find-mentors' },
    { icon: BookOpen, label: 'My Courses', href: '/dashboard/student/courses' },
    { icon: ClipboardCheck, label: 'Tests', href: '/dashboard/student/tests' },
    { icon: GitBranch, label: 'Projects', href: '/dashboard/student/projects' },
    { icon: Video, label: 'Live Sessions', href: '/dashboard/student/live-sessions' },
    { icon: Briefcase, label: 'Job Portal', href: '/dashboard/student/jobs' },
    { icon: UsersRound, label: 'Communities', href: '/dashboard/student/communities' },
  ];

  const mentorNav = [
    { icon: LayoutDashboard, label: 'Dashboard',     href: '/dashboard/mentor',                exact: true },
    { icon: Users,           label: 'My Students',   href: '/dashboard/mentor/students' },
    { icon: UsersRound,      label: 'Communities',   href: '/dashboard/mentor/communities' },
    { icon: ClipboardCheck,  label: 'Tests',         href: '/dashboard/mentor/tests' },
    { icon: GitBranch,       label: 'Projects',      href: '/dashboard/mentor/projects' },
    { icon: Video,           label: 'Live Sessions', href: '/dashboard/mentor/live-sessions' },
    { icon: MessageSquare,   label: 'Messages',      href: '/dashboard/mentor/messages' },
    { icon: BarChart2,       label: 'Analytics',     href: '/dashboard/mentor/analytics' },
  ];

  const aiTools = [
    { icon: Sparkles, label: 'AI Career Coach', href: '/ai-tools/career-coach' },
    { icon: FileCheck, label: 'AI Resume Analysis', href: '/ai-tools/resume' },
    { icon: School, label: 'College Matches', href: '/ai-tools/colleges' },
    { icon: Target, label: 'Skill Roadmaps', href: '/roadmaps' },
    { icon: GraduationCap, label: 'Course Recommender', href: '/courses' },
    { icon: FileText, label: 'AI Study Guide', href: '/guides' },
  ];

  const navItems = isStudent ? studentNav : mentorNav;
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop Sidebar ────────────────────────────────── */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className="hidden md:flex md:fixed md:left-0 md:top-14 md:bottom-0 flex-col z-40 overflow-hidden"
        style={{
          width: expanded ? 260 : 68,
          transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'width',
        }}
      >
        {/* Glass panel */}
        <div className="h-full bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-lg shadow-slate-900/5 flex flex-col py-3 gap-0.5 overflow-y-auto overflow-x-hidden">

          {/* ── Main nav items ── */}
          {navItems.map(({ icon: Icon, label, href, exact }) => {
            const active = isActive(href, exact);
            return (
              <div key={href} className="px-2.5" title={!expanded ? label : undefined}>
                <Link href={href}
                  className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative overflow-hidden
                                        ${active
                      ? `${clr.active} text-white shadow-md`
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  style={{ minWidth: 0 }}
                >
                  {/* Active left bar */}
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-white/40 rounded-r-full" />
                  )}

                  <Icon
                    size={20}
                    className={`flex-shrink-0 transition-transform duration-200 ${active ? 'text-white' : 'text-slate-500 group-hover:scale-110 group-hover:text-slate-700'}`}
                  />

                  <span
                    className="whitespace-nowrap truncate transition-all duration-200"
                    style={{
                      opacity: expanded ? 1 : 0,
                      maxWidth: expanded ? 180 : 0,
                      overflow: 'hidden',
                    }}
                  >
                    {label}
                  </span>

                  {/* Active dot when collapsed */}
                  {active && !expanded && (
                    <span className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 ${clr.dot} rounded-full`} />
                  )}
                </Link>
              </div>
            );
          })}

          {/* ── AI Tools section (student only) ── */}
          {isStudent && (
            <div className="mt-1">
              <div className="mx-3 my-1.5 border-t border-slate-100" />

              {/* Section toggle header */}
              <div className="px-2.5">
                <button
                  onClick={() => setAiOpen(o => !o)}
                  className="w-full flex items-center gap-3.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors duration-150"
                >
                  <Bot size={20} className={`flex-shrink-0 ${clr.icon} transition-transform duration-200 ${aiOpen ? '' : 'opacity-60'}`} />
                  <span
                    className="flex-1 text-left text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-200"
                    style={{
                      opacity: expanded ? 1 : 0,
                      maxWidth: expanded ? 180 : 0,
                      overflow: 'hidden',
                      color: '#64748b',
                    }}
                  >
                    AI Tools
                  </span>
                  {expanded && (
                    <span className="text-slate-400 flex-shrink-0 transition-transform duration-200">
                      {aiOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </span>
                  )}
                </button>
              </div>

              {/* AI tool items */}
              <div
                style={{
                  maxHeight: aiOpen ? 300 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 280ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {aiTools.map(({ icon: Icon, label, href }) => {
                  const base = href.split('?')[0];
                  const active = pathname === base || (base !== '/roadmaps' && pathname.startsWith(base));
                  return (
                    <div key={href} className="px-2.5" title={!expanded ? label : undefined}>
                      <Link href={href}
                        className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group
                                                    ${active
                            ? `${clr.active} text-white shadow-md`
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                        style={{ minWidth: 0 }}
                      >
                        <Icon size={18} className={`flex-shrink-0 transition-transform duration-200 ${active ? 'text-white' : 'group-hover:scale-110'}`} />
                        <span
                          className="whitespace-nowrap truncate transition-all duration-200"
                          style={{
                            opacity: expanded ? 1 : 0,
                            maxWidth: expanded ? 180 : 0,
                            overflow: 'hidden',
                          }}
                        >
                          {label}
                        </span>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Credits Wallet Card */}
              <div className="px-3 mt-4 transition-all duration-300">
                <div 
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#e8f2fc] to-[#a1ccfb] transition-all duration-300 ${expanded ? 'p-3' : 'p-2 flex flex-col items-center'}`}
                  style={{ minHeight: expanded ? '90px' : 'auto' }}
                >
                  <div className="flex items-center gap-2 z-10 relative">
                    <Wallet className="text-blue-600 w-5 h-5 flex-shrink-0" />
                    {expanded && <span className="font-semibold text-slate-900 text-sm">Credits: {credits}</span>}
                  </div>
                  
                  {expanded && (
                    <div className="mt-3 z-10 relative">
                      <button 
                         onClick={() => setShowCreditsModal(true)}
                         className="bg-blue-50 hover:bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-blue-100/50"
                      >
                        Top Up <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {!expanded && (
                    <>
                      <span className="text-xs font-bold text-slate-900 mt-1">{credits}</span>
                      <button 
                         onClick={() => setShowCreditsModal(true)}
                         className="mt-2 bg-blue-50 p-1.5 rounded-md text-blue-600 hover:bg-white transition-colors border border-blue-100/50"
                         title="Top Up Credits"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  
                  {expanded && (
                    <div className="absolute right-[-25%] bottom-[-15%] w-32 h-20 bg-slate-700/90 rounded-xl rotate-[-12deg] shadow-lg flex flex-col px-3 py-3 pointer-events-none border border-slate-600/50 backdrop-blur-sm">
                       <div className="w-3 h-2 rounded-sm bg-[#e7a33a] mb-2 opacity-80"></div>
                       <div className="mt-auto space-y-1.5">
                         <div className="text-[6px] text-slate-300 tracking-[0.2em] font-mono opacity-60">0000 0000 0000 0000</div>
                         <div className="flex gap-1.5">
                           <div className="w-2 h-0.5 bg-slate-400 rounded opacity-50"></div>
                           <div className="w-3 h-0.5 bg-slate-400 rounded opacity-50"></div>
                         </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Divider */}
          <div className="mx-3 border-t border-slate-100 mb-1" />

          {/* Settings / Profile */}
          <div className="px-2.5">
            <Link
              href={`/dashboard/${role}/settings`}
              title={!expanded ? 'Settings' : undefined}
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group
                                ${pathname.startsWith(`/dashboard/${role}/settings`)
                  ? `${clr.active} text-white shadow-md`
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
            >
              <User size={20} className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110`} />
              <span
                className="whitespace-nowrap truncate transition-all duration-200"
                style={{
                  opacity: expanded ? 1 : 0,
                  maxWidth: expanded ? 180 : 0,
                  overflow: 'hidden',
                }}
              >
                Settings
              </span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ───────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 shadow-lg flex items-center justify-around px-1 py-1.5">
        {navItems.slice(0, 4).map(({ icon: Icon, label, href, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all duration-150
                                ${active ? clr.icon + ' font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Icon size={21} className={active ? 'scale-110' : ''} style={{ transition: 'transform 150ms' }} />
              <span className="text-[10px] font-medium">{label.split(' ')[0]}</span>
            </Link>
          );
        })}
        {isStudent && (
          <Link href="/ai-tools/career-coach"
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all duration-150
                            ${pathname.startsWith('/ai-tools') ? clr.icon + ' font-bold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Bot size={21} />
            <span className="text-[10px] font-medium">AI</span>
          </Link>
        )}
      </nav>

      {/* Credits Modal Overlay */}
      {showCreditsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
              <CreditsModal onClose={() => setShowCreditsModal(false)} />
           </div>
        </div>
      )}
    </>
  );
}
