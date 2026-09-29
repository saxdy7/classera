'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, User, BookOpen, Users, MessageSquare, Loader2, Sparkles,
  LayoutDashboard, ClipboardCheck, GitBranch, Video, Settings, Plus,
  Map, FileText, CornerDownLeft,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import debounce from 'lodash/debounce';
import { cn } from '@/lib/utils';

interface SearchResults {
  users?: any[];
  courses?: any[];
  communities?: any[];
  tests?: any[];
  messages?: any[];
}

type Cmd = {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  hint?: string;
};

type Group = { heading: string; items: Cmd[] };

/**
 * Command palette (⌘K).
 *
 * Modelled on the reference command menu: one panel, a borderless query row,
 * then GROUPED sections — Navigate / Actions / results — where each row is an
 * icon plus a label and the highlighted row is a quiet `bg-muted` fill.
 *
 * With an empty query it behaves as a navigator (the reference's default
 * state) rather than showing an empty illustration, so ⌘K is useful the moment
 * it opens. Arrow keys move the selection and Enter follows it.
 */
export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({});
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // The palette is mounted in the header on both role dashboards, so the
  // navigate commands follow whichever section the user is currently in.
  const role = pathname.includes('/mentor') ? 'mentor' : 'student';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((o) => !o);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchDebounced = useMemo(
    () =>
      debounce(async (searchQuery: string) => {
        if (!searchQuery || searchQuery.length < 2) {
          setResults({});
          setLoading(false);
          return;
        }
        try {
          setLoading(true);
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=all`);
          const data = await response.json();
          setResults(data?.results ?? {});
        } catch (error) {
          console.error('Search error:', error);
          setResults({});
        } finally {
          setLoading(false);
        }
      }, 300),
    [],
  );

  useEffect(() => {
    searchDebounced(query);
    return () => searchDebounced.cancel();
  }, [query, searchDebounced]);

  const go = useCallback(
    (path: string) => {
      setIsOpen(false);
      setQuery('');
      router.push(path);
    },
    [router],
  );

  /** Default state: navigate + create, exactly as the reference opens. */
  const defaultGroups: Group[] = useMemo(
    () => [
      {
        heading: 'Navigate',
        items: [
          { id: 'home', label: 'Home', icon: LayoutDashboard, href: `/dashboard/${role}` },
          { id: 'courses', label: 'Courses', icon: BookOpen, href: `/dashboard/${role}/courses` },
          { id: 'tests', label: 'Tests', icon: ClipboardCheck, href: `/dashboard/${role}/tests` },
          { id: 'projects', label: 'Projects', icon: GitBranch, href: `/dashboard/${role}/projects` },
          { id: 'communities', label: 'Communities', icon: Users, href: `/dashboard/${role}/communities` },
          { id: 'sessions', label: 'Live Sessions', icon: Video, href: `/dashboard/${role}/live-sessions` },
          { id: 'messages', label: 'Messages', icon: MessageSquare, href: `/dashboard/${role}/messages` },
          { id: 'settings', label: 'Settings', icon: Settings, href: `/dashboard/${role}/settings` },
        ],
      },
      {
        heading: 'Actions',
        items: [
          { id: 'coach', label: 'Ask the AI Career Coach', icon: Sparkles, href: '/ai-tools/career-coach', hint: 'AI' },
          { id: 'roadmap', label: 'Build a skill roadmap', icon: Map, href: '/roadmaps', hint: 'AI' },
          { id: 'guide', label: 'Generate a study guide', icon: FileText, href: '/guides', hint: 'AI' },
          ...(role === 'mentor'
            ? [
                { id: 'newtest', label: 'Create a test', icon: Plus, href: '/dashboard/mentor/tests/create' },
                { id: 'newproj', label: 'Assign a project', icon: Plus, href: '/dashboard/mentor/projects/create' },
              ]
            : []),
        ],
      },
    ],
    [role],
  );

  /** Search state: one group per result type. */
  const resultGroups: Group[] = useMemo(() => {
    const g: Group[] = [];
    const push = (heading: string, arr: any[] | undefined, icon: Cmd['icon'], href: (x: any) => string, label: (x: any) => string, sub?: (x: any) => string) => {
      if (!Array.isArray(arr) || arr.length === 0) return;
      g.push({
        heading,
        items: arr.slice(0, 5).map((x, i) => ({
          id: `${heading}-${x.id ?? i}`,
          label: label(x) || 'Untitled',
          sublabel: sub?.(x),
          icon,
          href: href(x),
        })),
      });
    };
    push('People', results.users, User, (u) => `/dashboard/${role}/messages?userId=${u.id}`, (u) => u.full_name, (u) => u.email);
    push('Courses', results.courses, BookOpen, (c) => `/courses/${c.slug ?? c.id}`, (c) => c.title, (c) => c.description);
    push('Communities', results.communities, Users, (c) => `/dashboard/${role}/communities/${c.id}`, (c) => c.name, (c) => c.description);
    push('Tests', results.tests, ClipboardCheck, (t) => `/dashboard/${role}/tests/${t.id}`, (t) => t.title);
    push('Messages', results.messages, MessageSquare, (m) => `/dashboard/${role}/messages`, (m) => m.content);
    return g;
  }, [results, role]);

  const searching = query.trim().length >= 2;
  const groups = searching ? resultGroups : defaultGroups;
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Keep the highlight in range whenever the list changes.
  useEffect(() => setActive(0), [query, groups.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
      } else if (e.key === 'Enter') {
        const item = flat[active];
        if (item) {
          e.preventDefault();
          go(item.href);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, flat, active, go]);

  // Scroll the highlighted row into view as the selection moves.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden shrink-0 rounded border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground md:inline-block">
          ⌘K
        </kbd>
      </button>
    );
  }

  let index = -1;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      <div className="fixed inset-x-0 top-[12vh] z-50 mx-auto w-full max-w-xl px-4">
        <div className="overflow-hidden rounded-xl border bg-popover shadow-lg">
          {/* Query row */}
          <div className="flex h-12 items-center gap-3 border-b px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              data-bare
              autoFocus
              type="text"
              aria-label="Search"
              placeholder="Type a command or search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {loading && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
            <kbd className="shrink-0 rounded border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Groups */}
          <div ref={listRef} className="custom-scrollbar max-h-[55vh] overflow-y-auto p-2">
            {groups.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  {searching ? 'No results' : 'Start typing to search'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {searching ? `Nothing matched “${query}”.` : 'Search people, courses, communities and messages.'}
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.heading} className="mb-1 last:mb-0">
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{group.heading}</p>
                  {group.items.map((item) => {
                    index += 1;
                    const isActive = index === active;
                    const i = index;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-active={isActive}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(item.href)}
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors',
                          isActive ? 'bg-muted text-foreground' : 'text-foreground/90 hover:bg-muted/60',
                        )}
                      >
                        <item.icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{item.label}</span>
                          {item.sublabel && (
                            <span className="block truncate text-xs text-muted-foreground">{item.sublabel}</span>
                          )}
                        </span>
                        {item.hint && <span className="shrink-0 text-xs text-muted-foreground">{item.hint}</span>}
                        {isActive && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 font-sans">↑</kbd>
              <kbd className="rounded border bg-muted px-1 py-0.5 font-sans">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 font-sans">↵</kbd>
              to select
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
