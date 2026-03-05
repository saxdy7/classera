'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Calendar,
  Users,
  Video,
  UsersRound,
  Bot,
  FileText,
  User,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Map,
  GraduationCap,
} from 'lucide-react';

interface SidebarProps {
  role: 'student' | 'mentor';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);

  const isStudent = role === 'student';
  const accent = isStudent
    ? { bg: 'bg-indigo-600', activeBg: 'bg-indigo-600', text: 'text-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-200' }
    : { bg: 'bg-sky-600', activeBg: 'bg-sky-600', text: 'text-sky-600', light: 'bg-sky-50', border: 'border-sky-200' };

  const studentNav = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/student', exact: true },
    { icon: BookOpen, label: 'My Courses', href: '/dashboard/student/courses' },
    { icon: ClipboardCheck, label: 'Tests', href: '/dashboard/student/tests' },
    { icon: Calendar, label: 'Schedule', href: '/dashboard/student/schedule' },
    { icon: Users, label: 'Find Mentors', href: '/dashboard/student/find-mentors' },
    { icon: Video, label: 'Live Sessions', href: '/dashboard/student/live-sessions' },
    { icon: UsersRound, label: 'Communities', href: '/dashboard/student/communities' },
  ];

  const mentorNav = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/mentor', exact: true },
    { icon: BookOpen, label: 'My Courses', href: '/dashboard/mentor/courses' },
    { icon: ClipboardCheck, label: 'Tests', href: '/dashboard/mentor/tests' },
    { icon: Calendar, label: 'Schedule', href: '/dashboard/mentor/schedule' },
    { icon: Users, label: 'Students', href: '/dashboard/mentor/students' },
    { icon: Video, label: 'Live Sessions', href: '/dashboard/mentor/live-sessions' },
    { icon: UsersRound, label: 'Communities', href: '/dashboard/mentor/communities' },
    { icon: Map, label: 'Roadmaps', href: '/roadmaps' },
  ];

  const aiTools = [
    { icon: Sparkles, label: 'AI Career Coach', href: '/ai-tools/career-coach' },
    { icon: Map, label: 'AI Roadmap', href: '/roadmaps' },
    { icon: GraduationCap, label: 'AI Course', href: '/courses' },
    { icon: FileText, label: 'AI Guide', href: '/guides' },
  ];

  const navItems = isStudent ? studentNav : mentorNav;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className="hidden md:flex md:fixed md:left-0 md:top-14 md:bottom-0 flex-col z-40 transition-all duration-300 ease-in-out overflow-hidden"
        style={{ width: expanded ? 220 : 56 }}
      >
        <div className="h-full bg-white border-r border-slate-200 flex flex-col overflow-y-auto overflow-x-hidden py-3 gap-0.5">

          {/* Main nav */}
          {navItems.map(({ icon: Icon, label, href, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                title={!expanded ? label : undefined}
                className={`flex items-center gap-3 mx-2 px-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group flex-shrink-0
                  ${active
                    ? `${accent.activeBg} text-white shadow-sm`
                    : `text-slate-600 hover:bg-slate-100 hover:text-slate-900`
                  }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {expanded && (
                  <span className="whitespace-nowrap truncate transition-opacity duration-200">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* AI Tools section — student only */}
          {isStudent && (
            <div className="mt-2">
              {/* Divider */}
              <div className="mx-3 mb-1 border-t border-slate-100" />

              {/* Toggle header */}
              <button
                onClick={() => setAiOpen(o => !o)}
                className="w-full flex items-center justify-between mx-0 px-4 py-2 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Bot size={18} className={`flex-shrink-0 ${accent.text}`} />
                  {expanded && (
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      AI Tools
                    </span>
                  )}
                </div>
                {expanded && (
                  <span className="text-slate-400 flex-shrink-0">
                    {aiOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </span>
                )}
              </button>

              {/* AI tool items */}
              {aiOpen && aiTools.map(({ icon: Icon, label, href }) => {
                const active = pathname === href || (href !== '/roadmaps' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    title={!expanded ? label : undefined}
                    className={`flex items-center gap-3 mx-2 px-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex-shrink-0
                      ${active
                        ? `${accent.activeBg} text-white shadow-sm`
                        : `text-slate-600 hover:bg-slate-100 hover:text-slate-900`
                      }`}
                  >
                    <Icon size={17} className="flex-shrink-0" />
                    {expanded && (
                      <span className="whitespace-nowrap truncate">{label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Divider */}
          <div className="mx-3 border-t border-slate-100 mb-1" />

          {/* Profile / Settings */}
          <Link
            href={`/dashboard/${role}/settings`}
            title={!expanded ? 'Settings' : undefined}
            className={`flex items-center gap-3 mx-2 px-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex-shrink-0
              ${pathname.startsWith(`/dashboard/${role}/settings`)
                ? `${accent.activeBg} text-white shadow-sm`
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <User size={18} className="flex-shrink-0" />
            {expanded && <span className="whitespace-nowrap">Settings</span>}
          </Link>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-1">
        {navItems.slice(0, 5).map(({ icon: Icon, label, href, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors
                ${active ? accent.text : 'text-slate-400'}`}>
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label.split(' ')[0]}</span>
            </Link>
          );
        })}
        {isStudent && (
          <Link href="/ai-tools/career-coach"
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors
              ${pathname.startsWith('/ai-tools') ? accent.text : 'text-slate-400'}`}>
            <Bot size={20} />
            <span className="text-[10px] font-medium">AI</span>
          </Link>
        )}
      </nav>
    </>
  );
}
