'use client';

import { LogOut, ChevronDown, MessageSquare, HelpCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/shared/NotificationBell';
import GlobalSearch from '@/components/shared/GlobalSearch';
import { SidebarTrigger } from '@/components/shared/SidebarTrigger';
import { BreadCrumbs } from '@/components/shared/BreadCrumbs';

interface HeaderProps {
  profile?: {
    id?: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  };
  /** Renames the final breadcrumb. Falls back to the route segment. */
  title?: string;
  /** Small pills rendered beside the trail — status, context, counts. */
  meta?: React.ReactNode;
}

/**
 * App header.
 *
 * Left: the sidebar trigger and a route-derived breadcrumb trail
 * (Dashboard › Courses), matching the reference. A page may pass `title` to
 * rename the final crumb, and `meta` to sit status pills beside it.
 * Right: search, support, messages, notifications, one CTA, and the avatar.
 *
 * The sidebar is full-height and sits to the LEFT of the header, so on md+ the
 * bar is offset by the rail width via `--cl-sidebar-w`, which Sidebar publishes.
 */


export function Header({ profile = {}, title, meta }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowDropdown(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const ghost =
    'hidden lg:inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-4',
        'md:ml-[var(--cl-sidebar-w,260px)] md:transition-[margin-left] md:duration-200',
      )}
    >
      {/* Left: trigger · breadcrumb trail · status pills.
          The trail (Dashboard › Canvas) is the reference's header treatment;
          `title` still overrides the final crumb when a page passes one. */}
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1 hidden md:flex" />
        <Link href={`/dashboard/${profile.role ?? 'student'}`} className="shrink-0 text-base font-semibold tracking-tight text-foreground md:hidden">
          Classera
        </Link>
        <BreadCrumbs className="hidden md:flex" overrideLast={title ?? undefined} />
        {meta && <div className="hidden items-center gap-2 md:flex">{meta}</div>}
      </div>

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="hidden w-56 xl:block">
          <GlobalSearch />
        </div>

        <Link href="/contact" className={ghost}>
          <HelpCircle className="size-4" />
          Support
        </Link>

        {profile.role && (
          <Link
            href={`/dashboard/${profile.role}/messages`}
            aria-label="Messages"
            title="Messages"
            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <MessageSquare className="size-4" />
          </Link>
        )}

        {profile.id && <NotificationBell userId={profile.id} />}

        {/* The one prominent CTA, per Amboras */}
        <Link
          href="/roadmaps"
          className="ml-1 hidden h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex"
        >
          Explore
        </Link>

        {/* UserMenu */}
        <div className="relative ml-0.5" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            aria-haspopup="menu"
            aria-expanded={showDropdown}
            className="flex cursor-pointer items-center gap-1 rounded-lg p-0.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" className="size-7 rounded-full border object-cover" width={28} height={28} />
            ) : (
              <div className="flex size-7 items-center justify-center rounded-full border bg-muted text-[11px] font-semibold text-foreground">
                {getInitials(profile.full_name)}
              </div>
            )}
            <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform duration-200', showDropdown && 'rotate-180')} />
          </button>

          {showDropdown && (
            <div role="menu" className="absolute right-0 mt-2 w-60 rounded-xl border bg-popover py-1.5 text-popover-foreground shadow-md">
              <div className="border-b px-3 py-2.5">
                <p className="truncate text-sm font-semibold capitalize text-foreground">{profile.full_name || 'User'}</p>
                <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
              </div>
              <Link
                href={`/dashboard/${profile.role}/settings`}
                role="menuitem"
                onClick={() => setShowDropdown(false)}
                className="mt-1 flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                role="menuitem"
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
