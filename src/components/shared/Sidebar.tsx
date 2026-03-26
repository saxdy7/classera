'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, BookOpen, ClipboardCheck,
  Users, Video, UsersRound, MapIcon, FileText, User,
  ChevronDown, ChevronUp, Sparkles, GraduationCap, Bot,
  MessageSquare, BarChart2, GitBranch,
} from 'lucide-react';

interface SidebarProps {
  role: 'student' | 'mentor';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);

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
    { icon: MapIcon, label: 'AI Roadmap', href: '/roadmaps' },
    { icon: GraduationCap, label: 'AI Course', href: '/courses' },
    { icon: FileText, label: 'AI Guide', href: '/guides' },
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
    </>
  );
}
