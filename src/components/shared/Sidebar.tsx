'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
import { useAITokenBalance } from '@/hooks/useAITokens';
import { CreditsModal } from '@/components/shared/CreditsDisplay';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, BookOpen, ClipboardCheck,
  Users, Video, UsersRound, FileText, User,
  Sparkles, GraduationCap, Bot,
  MessageSquare, BarChart2, GitBranch, Clover,
  Target, TrendingUp, PanelLeftClose, PanelLeftOpen, LogOut,
} from 'lucide-react';

interface SidebarProps {
  role: 'student' | 'mentor';
}

type NavItem = { icon: React.ComponentType<{ className?: string }>; label: string; href: string; exact?: boolean };

/**
 * Dashboard sidebar — styled after aria-hackathon's `AppSidebar.tsx`.
 *
 * Structure (top → bottom), matching the reference:
 *   h-16 logo header with a bottom border
 *   main nav, `gap-1.5`, rows `h-10 px-3`
 *     active = `bg-linear-to-r from-purple-500/20 to-transparent` +
 *              `border-l-4 border-purple-500 pl-[10px] rounded`
 *   a group label (`text-[10px] font-semibold tracking-wider uppercase`)
 *   footer `p-3 mt-auto`: gradient plan card
 *     (`from-white via-purple-50 to-purple-500/30`) then a user row with a
 *     bordered `h-9` avatar, name/email, and a logout button
 *
 * The one accent is purple (`--accent-purple`), exactly as in the reference.
 * Collapse behaviour (pinned, persisted in localStorage) is unchanged.
 */
export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [account, setAccount] = useState<{ id: string; name: string; email: string; avatar?: string } | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('cl-sidebar-expanded');
      if (saved === '0' || saved === '1') setExpanded(saved === '1');
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--cl-sidebar-w', expanded ? '260px' : '68px');
    try { window.localStorage.setItem('cl-sidebar-expanded', expanded ? '1' : '0'); } catch {}
  }, [expanded]);

  useEffect(() => {
    const read = (u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!u) return setAccount(null);
      const m = u.user_metadata ?? {};
      setAccount({
        id: u.id,
        name: (m.full_name as string) || (m.name as string) || u.email?.split('@')[0] || 'User',
        email: u.email ?? '',
        avatar: (m.avatar_url as string) || undefined,
      });
    };
    supabase.auth.getUser().then(({ data }) => read(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => read(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const { data: tokenData } = useAITokenBalance(account?.id || '');
  const credits = tokenData?.balance || 0;

  const isStudent = role === 'student';

  const studentNav: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/student', exact: true },
    { icon: Users, label: 'Find Mentors', href: '/dashboard/student/find-mentors' },
    { icon: UsersRound, label: 'Connect Students', href: '/dashboard/student/connect-students' },
    { icon: BookOpen, label: 'My Courses', href: '/dashboard/student/courses' },
    { icon: ClipboardCheck, label: 'Tests', href: '/dashboard/student/tests' },
    { icon: GitBranch, label: 'Projects', href: '/dashboard/student/projects' },
    { icon: Video, label: 'Live Sessions', href: '/dashboard/student/live-sessions' },
    { icon: UsersRound, label: 'Communities', href: '/dashboard/student/communities' },
  ];

  const mentorNav: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/mentor', exact: true },
    { icon: Users, label: 'My Students', href: '/dashboard/mentor/students' },
    { icon: UsersRound, label: 'Communities', href: '/dashboard/mentor/communities' },
    { icon: ClipboardCheck, label: 'Tests', href: '/dashboard/mentor/tests' },
    { icon: GitBranch, label: 'Projects', href: '/dashboard/mentor/projects' },
    { icon: Video, label: 'Live Sessions', href: '/dashboard/mentor/live-sessions' },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/mentor/messages' },
    { icon: TrendingUp, label: 'Student Analytics', href: '/dashboard/mentor/student-analytics' },
    { icon: BarChart2, label: 'Analytics', href: '/dashboard/mentor/analytics' },
  ];

  const aiTools: NavItem[] = [
    { icon: Sparkles, label: 'AI Career Coach', href: '/ai-tools/career-coach' },
    { icon: Target, label: 'Skill Roadmaps', href: '/roadmaps' },
    { icon: GraduationCap, label: 'AI Course', href: '/courses' },
    { icon: FileText, label: 'AI Study Guide', href: '/guides' },
  ];

  const navItems = isStudent ? studentNav : mentorNav;
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));
  const settingsActive = pathname.startsWith(`/dashboard/${role}/settings`);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  /** aria's SidebarMenuButton recipe, verbatim in spirit. */
  const NavRow = ({ item, active }: { item: NavItem; active: boolean }) => (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      title={!expanded ? item.label : undefined}
      className={cn(
        'flex h-10 items-center gap-2 rounded-md px-3 text-sm transition-all duration-200',
        'text-foreground/80 hover:bg-[var(--sidebar-accent)]/50 hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        active && [
          'bg-linear-to-r from-accent-purple/20 to-transparent hover:from-accent-purple/15',
          'rounded border-l-4 border-accent-purple pl-[10px] font-medium text-foreground',
        ],
        !expanded && 'justify-center px-2',
        !expanded && active && 'rounded-xl border-l-0 p-2',
      )}
    >
      <item.icon className={cn('size-4 shrink-0 transition-colors duration-200', active ? 'text-foreground' : 'text-foreground/70')} />
      {expanded && <span className="truncate">{item.label}</span>}
    </Link>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside
        className="hidden md:flex md:fixed md:left-0 md:top-0 md:bottom-0 flex-col z-50 overflow-hidden border-r bg-[var(--sidebar)] text-[var(--sidebar-foreground)]"
        style={{ width: expanded ? 260 : 68, transition: 'width 200ms cubic-bezier(0.4,0,0.2,1)', willChange: 'width' }}
      >
        {/* Logo header — h-16, border-b (aria) */}
        <div className={cn('flex h-16 shrink-0 flex-row items-center gap-2 border-b py-3', expanded ? 'px-4' : 'px-2 justify-center')}>
          <Link href={`/dashboard/${role}`} className="flex w-full items-center gap-2 justify-center rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-purple text-white">
              <GraduationCap className="size-4.5" />
            </span>
            {expanded && <span className="truncate text-2xl font-semibold tracking-wide text-foreground">Classera</span>}
          </Link>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Main nav group */}
          <div className="p-2">
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => (
                <NavRow key={item.href} item={item} active={isActive(item.href, item.exact)} />
              ))}
            </nav>
          </div>

          {/* AI tools group (students) — aria's labelled SidebarGroup */}
          {isStudent && (
            <div className="p-2 pt-1">
              {expanded && (
                <p className="mb-1.5 select-none px-3 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                  AI Tools
                </p>
              )}
              <nav className="flex flex-col gap-1.5">
                {aiTools.map((item) => {
                  const base = item.href.split('?')[0];
                  const active = pathname === base || (base !== '/roadmaps' && pathname.startsWith(base));
                  return <NavRow key={item.href} item={item} active={active} />;
                })}
              </nav>
            </div>
          )}

          {/* Settings */}
          <div className="p-2 pt-1">
            <NavRow item={{ icon: User, label: 'Settings', href: `/dashboard/${role}/settings` }} active={settingsActive} />
          </div>
        </div>

        {/* Footer — aria: gradient plan card, then user row with logout */}
        <div className="mt-auto flex flex-col gap-2 p-3">
          <button
            type="button"
            onClick={() => setShowCreditsModal(true)}
            title={expanded ? undefined : `${credits} credits · top up`}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md border bg-linear-to-br from-white via-accent-purple-soft to-accent-purple/30 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              expanded ? 'px-3 py-3' : 'size-9 justify-center rounded-full border-accent-purple/30 bg-accent-purple/10 p-0 from-transparent via-transparent to-transparent mx-auto',
            )}
          >
            <Clover className="size-4 shrink-0 text-accent-purple" />
            {expanded && (
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="mb-0.5 text-xs leading-none text-foreground">
                  <span className="font-semibold tabular-nums">{credits}</span> credits
                </span>
                <span className="truncate text-[10px] leading-none text-muted-foreground">Top up for more AI tools</span>
              </div>
            )}
          </button>

          <div className={cn('flex w-full items-center gap-2 overflow-hidden border-t pt-2', expanded ? 'justify-between' : 'justify-center')}>
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              {account?.avatar ? (
                <Image src={account.avatar} alt="" width={36} height={36} className="size-9 shrink-0 select-none rounded-full border object-cover shadow-xs" />
              ) : (
                <div className="flex size-9 shrink-0 select-none items-center justify-center rounded-full border bg-primary/10 text-xs font-semibold text-primary shadow-xs">
                  {account?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              {expanded && (
                <div className="flex min-w-0 flex-1 select-none flex-col">
                  <span className="truncate text-xs font-semibold capitalize text-foreground">{account?.name ?? '…'}</span>
                  <span className="truncate text-[10px] text-muted-foreground">{account?.email ?? ''}</span>
                </div>
              )}
            </div>
            {expanded && (
              <button
                type="button"
                onClick={handleSignOut}
                title="Log out"
                className="shrink-0 cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="size-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setExpanded((o) => !o)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className={cn(
              'flex h-8 items-center gap-2 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-[var(--sidebar-accent)]/50 hover:text-foreground',
              !expanded && 'justify-center',
            )}
          >
            {expanded ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
            {expanded && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-card px-1 py-1.5">
        {navItems.slice(0, 4).map(({ icon: Icon, label, href, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn('flex flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 transition-colors duration-200', active ? 'font-medium text-accent-purple' : 'text-muted-foreground')}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-medium">{label.split(' ')[0]}</span>
            </Link>
          );
        })}
        {isStudent && (
          <Link
            href="/ai-tools/career-coach"
            className={cn('flex flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 transition-colors duration-200', pathname.startsWith('/ai-tools') ? 'font-medium text-accent-purple' : 'text-muted-foreground')}
          >
            <Bot className="size-5" />
            <span className="text-[10px] font-medium">AI</span>
          </Link>
        )}
      </nav>

      {showCreditsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl">
            <CreditsModal onClose={() => setShowCreditsModal(false)} />
          </div>
        </div>
      )}
    </>
  );
}
