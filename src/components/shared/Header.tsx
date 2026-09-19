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
import { BreadCrumbs } from '@/components/shared/BreadCrumbs';

interface HeaderProps {
  /**
   * Optional: the public portfolio page renders <Header /> with no profile.
   * Previously this was a required prop, so that page threw on `profile.role`.
   */
  profile?: {
    id?: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  };
}

/**
 * App header — composition taken from aria's `(main)/home/layout.tsx` and
 * looma's dashboard layout:
 *
 *   <header class="flex h-16 shrink-0 items-center justify-between px-4 border-b">
 *     [ divider · Breadcrumbs ]  ……  [ search ] [ outline icon-sm buttons ] [ UserMenu ]
 *
 * The sidebar is full-height and sits to the LEFT of the header (aria/looma
 * both do this), so on md+ the header is offset by the rail width via
 * `--cl-sidebar-w`, which the Sidebar publishes.
 */
export function Header({ profile = {} }: HeaderProps) {
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

  /** aria: `variant="outline" size="icon-sm"` with a neutral-100 fill. */
  const iconBtn =
    'flex size-8 items-center justify-center rounded-md border bg-neutral-100 text-foreground transition-all hover:text-accent-purple focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer';

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4',
        // Sit beside the full-height rail on desktop.
        'md:ml-[var(--cl-sidebar-w,260px)] md:transition-[margin-left] md:duration-200',
      )}
    >
      {/* Left: divider + breadcrumbs (aria) */}
      <div className="flex min-w-0 items-center gap-2">
        {/* Mobile wordmark — the rail (and its logo) is hidden below md */}
        <Link href={`/dashboard/${profile.role ?? 'student'}`} className="text-base font-semibold tracking-tight text-foreground md:hidden">
          Classera
        </Link>
        <div className="mx-2 hidden h-4 w-px bg-border md:block" />
        <BreadCrumbs className="hidden md:flex" />
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-3">
        <div className="hidden w-64 md:block">
          <GlobalSearch />
        </div>

        {profile.role && (
          <Link href={`/dashboard/${profile.role}/messages`} aria-label="Messages" title="Messages" className={iconBtn}>
            <MessageSquare className="size-4" />
          </Link>
        )}

        {profile.id && <NotificationBell userId={profile.id} />}

        <Link href="/contact" aria-label="Help & guides" title="Help & Guides" className={iconBtn}>
          <HelpCircle className="size-4" />
        </Link>

        {/* UserMenu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            aria-haspopup="menu"
            aria-expanded={showDropdown}
            className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" className="size-8 rounded-full border object-cover" width={32} height={32} />
            ) : (
              <div className="flex size-8 items-center justify-center rounded-full border bg-primary/10 text-[11px] font-semibold text-primary">
                {getInitials(profile.full_name)}
              </div>
            )}
            <ChevronDown className={cn('size-4 text-muted-foreground transition-transform duration-200', showDropdown && 'rotate-180')} />
          </button>

          {showDropdown && (
            <div role="menu" className="absolute right-0 mt-2 w-60 rounded-lg border bg-popover py-1.5 text-popover-foreground shadow-md">
              <div className="border-b px-3 py-2.5">
                <p className="truncate text-sm font-semibold capitalize text-foreground">{profile.full_name || 'User'}</p>
                <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
                {profile.role && <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{profile.role}</p>}
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
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
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
