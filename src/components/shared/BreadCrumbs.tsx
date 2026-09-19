'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Route-derived breadcrumbs — the pattern from looma's
 * `modules/dashboard/BreadCrumbs.tsx` and aria's header. The trail is built from
 * the pathname: `/dashboard/student/tests/abc` → Dashboard › Tests › Detail.
 *
 * Segment labels come from a small dictionary; unknown segments (ids) render as
 * "Detail" rather than leaking a uuid into the chrome.
 */
const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  student: 'Student',
  mentor: 'Mentor',
  'find-mentors': 'Find Mentors',
  'connect-students': 'Connect Students',
  courses: 'Courses',
  tests: 'Tests',
  projects: 'Projects',
  'live-sessions': 'Live Sessions',
  communities: 'Communities',
  messages: 'Messages',
  students: 'Students',
  'student-analytics': 'Student Analytics',
  analytics: 'Analytics',
  settings: 'Settings',
  profile: 'Profile',
  notifications: 'Notifications',
  calendar: 'Calendar',
  schedule: 'Schedule',
  sessions: 'Sessions',
  tasks: 'Tasks',
  leaderboard: 'Leaderboard',
  achievements: 'Achievements',
  jobs: 'Jobs',
  'my-roadmap': 'My Roadmap',
  'ai-assistant': 'AI Assistant',
  'question-bank': 'Question Bank',
  create: 'Create',
  edit: 'Edit',
  results: 'Results',
  review: 'Review',
  take: 'Take',
  'take-secure': 'Secure Test',
  live: 'Live',
  monitor: 'Monitor',
  rubric: 'Rubric',
  compare: 'Compare',
  moderation: 'Moderation',
  today: 'Today',
  'ai-tools': 'AI Tools',
  'career-coach': 'Career Coach',
  roadmaps: 'Roadmaps',
  guides: 'Guides',
  portfolio: 'Portfolio',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function BreadCrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);

  // Collapse "/dashboard/student" into a single "Dashboard" crumb — the role is
  // already visible in the sidebar and the account row.
  const crumbs: { label: string; href: string }[] = [];
  let href = '';
  parts.forEach((seg, i) => {
    href += `/${seg}`;
    if (seg === 'student' || seg === 'mentor') {
      if (parts[i - 1] === 'dashboard') return;
    }
    const label = LABELS[seg] ?? (UUID.test(seg) ? 'Detail' : seg.replace(/-/g, ' '));
    crumbs.push({ label, href: seg === 'dashboard' ? `/dashboard/${parts[i + 1] ?? ''}` : href });
  });

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex min-w-0 items-center gap-1.5 text-sm', className)}>
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={c.href + i} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />}
            {last ? (
              <span className="truncate font-medium text-foreground" aria-current="page">{c.label}</span>
            ) : (
              <Link href={c.href} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                {c.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
