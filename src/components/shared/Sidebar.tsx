'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
import { useAITokenBalance } from '@/hooks/useAITokens';
import { CreditsModal } from '@/components/shared/CreditsDisplay';
import { SIDEBAR_EVENT } from '@/components/shared/SidebarTrigger';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, BookOpen, ClipboardCheck, Video, UsersRound, Sparkles, ChevronDown, ChevronRight, GraduationCap, Bot, MessageSquare, BarChart2, Zap, TrendingUp, LogOut, CornerDownRight, CheckCircle2, Circle,
} from 'lucide-react';

interface SidebarProps {
  role: 'student' | 'mentor';
}

type Leaf = { label: string; href: string; exact?: boolean };
type NavItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  exact?: boolean;
  children?: Leaf[];
};

/**
 * Dashboard sidebar — Amboras structure.
 *
 * Amboras's rail is: logo, a store/context switcher, then flat nav items and
 * collapsible groups whose sub-items are indented and unicorned; the active row
 * is a quiet `bg-muted` fill rather than a coloured rule. Pinned to the bottom
 * are a "Getting started" progress card, an upgrade card, and a utility row.
 *
 * The purple accent (aria) is kept, but only on the active item's icon and the
 * upgrade card — everything else stays neutral, as in the reference.
 *
 * The collapse control lives in the HEADER (see SidebarTrigger); this listens
 * for its `cl-sidebar-toggle` event.
 */

function NavLeaf({ leaf, active, expanded }: { leaf: Leaf; active: boolean; expanded: boolean }) {
  if (!expanded) return null;
  return (
    <Link
      href={leaf.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex h-8 items-center gap-2 rounded-lg pl-9 pr-3 text-sm transition-colors',
        active ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      {active && <CornerDownRight className="absolute left-3.5 size-3.5 text-muted-foreground" aria-hidden="true" />}
      <span className="truncate">{leaf.label}</span>
    </Link>
  );
}

function NavRow({
  item,
  active,
  expanded,
  open,
  onToggle,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  const base = cn(
    'flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm transition-colors',
    'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
    active ? 'bg-muted font-medium text-foreground' : 'text-foreground/80 hover:bg-muted/60 hover:text-foreground',
    !expanded && 'justify-center px-2',
  );
  const icon = (
    <item.icon className={cn('size-4 shrink-0', active ? 'text-accent-purple' : 'text-muted-foreground')} />
  );

  if (item.children) {
    return (
      <button type="button" onClick={onToggle} aria-expanded={open} title={!expanded ? item.label : undefined} className={cn(base, 'cursor-pointer')}>
        {icon}
        {expanded && (
          <>
            <span className="flex-1 truncate text-left">{item.label}</span>
            {open ? <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
          </>
        )}
      </button>
    );
  }

  return (
    <Link href={item.href!} aria-current={active ? 'page' : undefined} title={!expanded ? item.label : undefined} className={base}>
      {icon}
      {expanded && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [account, setAccount] = useState<{ id: string; name: string; email: string; avatar?: string } | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('cl-sidebar-expanded');
      if (saved === '0' || saved === '1') setExpanded(saved === '1');
    } catch {}
    const onToggle = (e: Event) => setExpanded((e as CustomEvent<boolean>).detail);
    window.addEventListener(SIDEBAR_EVENT, onToggle);
    return () => window.removeEventListener(SIDEBAR_EVENT, onToggle);
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
    { icon: LayoutDashboard, label: 'Home', href: '/dashboard/student', exact: true },
    {
      icon: BookOpen, label: 'Learning', children: [
        { label: 'My Courses', href: '/dashboard/student/courses' },
        { label: 'Tests', href: '/dashboard/student/tests' },
        { label: 'Projects', href: '/dashboard/student/projects' },
        { label: 'My Roadmap', href: '/dashboard/student/my-roadmap' },
      ],
    },
    {
      icon: UsersRound, label: 'People', children: [
        { label: 'Find Mentors', href: '/dashboard/student/find-mentors' },
        { label: 'Connect Students', href: '/dashboard/student/connect-students' },
        { label: 'Communities', href: '/dashboard/student/communities' },
        { label: 'Messages', href: '/dashboard/student/messages' },
      ],
    },
    { icon: Video, label: 'Live Sessions', href: '/dashboard/student/live-sessions' },
    {
      icon: TrendingUp, label: 'Progress', children: [
        { label: 'Analytics', href: '/dashboard/student/analytics' },
        { label: 'Achievements', href: '/dashboard/student/achievements' },
        { label: 'Leaderboard', href: '/dashboard/student/leaderboard' },
      ],
    },
    { icon: ClipboardCheck, label: 'Tasks', href: '/dashboard/student/tasks' },
    {
      icon: Sparkles, label: 'AI Tools', children: [
        { label: 'Career Coach', href: '/ai-tools/career-coach' },
        { label: 'Skill Roadmaps', href: '/roadmaps' },
        { label: 'AI Courses', href: '/courses' },
        { label: 'Study Guides', href: '/guides' },
      ],
    },
  ];

  const mentorNav: NavItem[] = [
    { icon: LayoutDashboard, label: 'Home', href: '/dashboard/mentor', exact: true },
    {
      icon: BookOpen, label: 'Teaching', children: [
        { label: 'Courses', href: '/dashboard/mentor/courses' },
        { label: 'Tests', href: '/dashboard/mentor/tests' },
        { label: 'Projects', href: '/dashboard/mentor/projects' },
        { label: 'Question Bank', href: '/dashboard/mentor/question-bank' },
      ],
    },
    {
      icon: UsersRound, label: 'People', children: [
        { label: 'My Students', href: '/dashboard/mentor/students' },
        { label: 'Communities', href: '/dashboard/mentor/communities' },
        { label: 'Messages', href: '/dashboard/mentor/messages' },
      ],
    },
    { icon: Video, label: 'Live Sessions', href: '/dashboard/mentor/live-sessions' },
    {
      icon: BarChart2, label: 'Analytics', children: [
        { label: 'Overview', href: '/dashboard/mentor/analytics' },
        { label: 'Student Analytics', href: '/dashboard/mentor/student-analytics' },
      ],
    },
    { icon: ClipboardCheck, label: 'Tasks', href: '/dashboard/mentor/tasks' },
    {
      icon: Sparkles, label: 'AI Tools', children: [
        { label: 'Career Coach', href: '/ai-tools/career-coach' },
        { label: 'Skill Roadmaps', href: '/roadmaps' },
        { label: 'AI Courses', href: '/courses' },
        { label: 'Study Guides', href: '/guides' },
      ],
    },
  ];

  const navItems = isStudent ? studentNav : mentorNav;
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));
  const groupActive = (it: NavItem) => !!it.children?.some((c) => isActive(c.href));

  // A group opens when the user expands it, or whenever it owns the route.
  const isOpen = (it: NavItem) => openGroups[it.label] ?? groupActive(it);
  const toggleGroup = (label: string, current: boolean) =>
    setOpenGroups((g) => ({ ...g, [label]: !current }));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  // "Getting started" checklist — mirrors Amboras's pinned progress card.
  const steps = [
    { label: 'Create your account', done: true },
    { label: 'Complete your profile', done: !!account?.name },
    { label: isStudent ? 'Join a community' : 'Create a community', done: false },
    { label: isStudent ? 'Take your first test' : 'Publish a test', done: false },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <>
      {/* Desktop rail */}
      <aside
        className="hidden md:flex md:fixed md:left-0 md:top-0 md:bottom-0 z-50 flex-col overflow-hidden border-r bg-[var(--sidebar)] text-[var(--sidebar-foreground)]"
        style={{ width: expanded ? 260 : 68, transition: 'width 200ms cubic-bezier(0.4,0,0.2,1)', willChange: 'width' }}
      >
        {/* Logo */}
        <div className={cn('flex h-14 shrink-0 items-center gap-2', expanded ? 'px-4' : 'justify-center px-2')}>
          <Link href={`/dashboard/${role}`} className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-purple text-white">
              <GraduationCap className="size-4" />
            </span>
            {expanded && <span className="truncate text-base font-semibold tracking-tight text-foreground">Classera</span>}
          </Link>
        </div>

        {/* Context switcher — Amboras's "My Store" combobox */}
        {expanded && (
          <div className="px-3 pb-2">
            <Link
              href={`/dashboard/${role}/settings`}
              className="flex h-10 w-full items-center gap-2 rounded-lg border bg-background px-2.5 text-sm transition-colors hover:bg-muted"
            >
              {account?.avatar ? (
                <Image src={account.avatar} alt="" width={20} height={20} className="size-5 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-purple/15 text-[10px] font-semibold text-accent-purple">
                  {account?.name?.charAt(0).toUpperCase() ?? 'C'}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{account?.name ?? 'My account'}</span>
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            </Link>
          </div>
        )}

        {/* Nav */}
        <div className="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2">
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const open = isOpen(item);
              const active = item.href ? isActive(item.href, item.exact) : groupActive(item);
              return (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <NavRow
                    item={item}
                    active={active && !item.children}
                    expanded={expanded}
                    open={open}
                    onToggle={item.children ? () => toggleGroup(item.label, open) : undefined}
                  />
                  {item.children && open && expanded && (
                    <div className="flex flex-col gap-0.5">
                      {item.children.map((leaf) => (
                        <NavLeaf key={leaf.href} leaf={leaf} active={isActive(leaf.href)} expanded={expanded} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

        </div>

        {/* Pinned bottom — Amboras: progress card, upgrade card, utility row */}
        <div className="shrink-0 space-y-2 border-t p-3">
          {expanded && doneCount < steps.length && (
            <div className="rounded-xl border bg-background p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Getting started</p>
                <span className="text-xs tabular-nums text-muted-foreground">{doneCount} of {steps.length}</span>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground transition-[width] duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
              </div>
              <ul className="mt-3 space-y-1.5">
                {steps.map((s) => (
                  <li key={s.label} className="flex items-center gap-2 text-xs">
                    {s.done
                      ? <CheckCircle2 className="size-3.5 shrink-0 text-accent-purple" />
                      : <Circle className="size-3.5 shrink-0 text-muted-foreground/50" />}
                    <span className={cn('truncate', s.done ? 'text-muted-foreground line-through' : 'text-foreground')}>{s.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCreditsModal(true)}
            title={expanded ? undefined : `${credits} credits`}
            className={cn(
              'flex w-full cursor-pointer items-center gap-2.5 rounded-xl border bg-background text-left transition-colors hover:bg-muted',
              expanded ? 'p-3' : 'size-9 justify-center p-0 mx-auto',
            )}
          >
            {expanded ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    <span className="tabular-nums">{credits}</span> credits
                  </p>
                  <p className="truncate text-xs text-muted-foreground">Top up for more AI tools</p>
                </div>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-purple text-white">
                  <Zap className="size-3.5" />
                </span>
              </>
            ) : (
              <Zap className="size-4 text-accent-purple" />
            )}
          </button>

          <div className={cn('flex items-center gap-2', expanded ? 'justify-between' : 'justify-center')}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {account?.avatar ? (
                <Image src={account.avatar} alt="" width={28} height={28} className="size-7 shrink-0 rounded-full border object-cover" />
              ) : (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-muted text-[10px] font-semibold text-foreground">
                  {account?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              {expanded && (
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-medium capitalize text-foreground">{account?.name ?? '…'}</span>
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
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-card px-1 py-1.5 md:hidden">
        {[
          { icon: LayoutDashboard, label: 'Home', href: `/dashboard/${role}`, exact: true },
          { icon: BookOpen, label: 'Learn', href: `/dashboard/${role}/${isStudent ? 'courses' : 'courses'}` },
          { icon: ClipboardCheck, label: 'Tests', href: `/dashboard/${role}/tests` },
          { icon: MessageSquare, label: 'Chat', href: `/dashboard/${role}/messages` },
        ].map(({ icon: Icon, label, href, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn('flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 transition-colors', active ? 'font-medium text-accent-purple' : 'text-muted-foreground')}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
        {isStudent && (
          <Link
            href="/ai-tools/career-coach"
            className={cn('flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 transition-colors', pathname.startsWith('/ai-tools') ? 'font-medium text-accent-purple' : 'text-muted-foreground')}
          >
            <Bot className="size-5" />
            <span className="text-[10px] font-medium">AI</span>
          </Link>
        )}
      </nav>

      {showCreditsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl">
            <CreditsModal onClose={() => setShowCreditsModal(false)} />
          </div>
        </div>
      )}
    </>
  );
}
