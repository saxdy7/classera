'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  MessageCircle, Users, Settings, Plus, Bell, Search, Hash, Eye, CheckCircle, AlertCircle, Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Stat, btnPrimary, btnSecondary } from '@/components/shell';
import Image from 'next/image';

interface Community {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  is_active: boolean;
  messaging_enabled?: boolean;
  mentor_id: string;
  community_members?: Array<{ count: number }>;
  created_at: string;
}

interface CommunityMember {
  id: string;
  role?: string;
  joined_at?: string;
  student?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string | null;
    specialization_board?: string | null;
  } | null;
}

interface MentorCommunitiesLayoutProps {
  communities: Community[];
  profile: any;
}

export function MentorCommunitiesLayout({
  communities,
}: MentorCommunitiesLayoutProps) {
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(
    communities && communities.length > 0 ? communities[0] : null
  );

  // Real roster for the selected community. The panel previously rendered a
  // hardcoded [1..5] of "Member 1…5" with fake online dots, which also
  // contradicted the real count shown in the heading beside it.
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!selectedCommunity?.id) {
      setMembers((prev) => (prev.length ? [] : prev));
      return () => { cancelled = true; };
    }
    setMembersLoading(true);
    fetch(`/api/community-members?communityId=${selectedCommunity.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setMembers(Array.isArray(data?.members) ? data.members : []);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedCommunity?.id]);

  const visibleMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.student?.full_name?.toLowerCase().includes(q) ||
        m.student?.email?.toLowerCase().includes(q),
    );
  }, [members, memberQuery]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const channels = [
    { id: 'general', name: 'General', icon: Hash, type: 'public' },
    { id: 'announcements', name: 'Announcements', icon: Bell, type: 'public' },
    { id: 'resources', name: 'Resources', icon: Zap, type: 'public' },
    { id: 'discussions', name: 'Discussions', icon: MessageCircle, type: 'public' },
  ];

  return (
    <div className="flex h-full bg-background">
      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        {selectedCommunity ? (
          <>
            {/* Header — the community switcher and channels live here now.
                They used to sit in a second persistent rail beside the app
                sidebar, which duplicated navigation and read as two shells. */}
            <div className="border-b px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground">
                    {selectedCommunity.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    {communities.length > 1 ? (
                      <select
                        value={selectedCommunity.id}
                        onChange={(e) => {
                          const next = communities.find((c) => c.id === e.target.value);
                          if (next) setSelectedCommunity(next);
                        }}
                        aria-label="Switch community"
                        className="h-8 max-w-full border-0 bg-transparent px-0 text-xl font-bold tracking-tight text-foreground"
                      >
                        {communities.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
                        {selectedCommunity.name}
                      </h1>
                    )}
                    <p className="truncate text-sm text-muted-foreground">
                      {selectedCommunity.description || 'Community of learners'}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link href="/dashboard/mentor/communities/create" className={btnSecondary}>
                    <Plus className="size-4" />
                    New community
                  </Link>
                  <Link href={`/dashboard/mentor/communities/${selectedCommunity.id}`} className={btnPrimary}>
                    View full
                  </Link>
                  <Link
                    href={`/dashboard/mentor/communities/${selectedCommunity.id}/settings`}
                    aria-label="Community settings"
                    className={`${btnSecondary} size-9 px-0`}
                  >
                    <Settings className="size-4" />
                  </Link>
                </div>
              </div>

              {/* Channels — a tab rail rather than a sidebar tree. */}
              <div className="no-scrollbar mt-4 flex items-center gap-1 overflow-x-auto">
                {channels.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/dashboard/mentor/communities/${selectedCommunity.id}?channel=${ch.id}`}
                    className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ch.icon className="size-3.5" />
                    {ch.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Content - Community Overview */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mx-auto w-full max-w-5xl">
                {/* Quick stats — neutral tiles, matching every other stat row.
                    These were three tinted cards whose "✓" glyphs stood in for
                    a value, so they read as data when they were really state. */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Stat label="Members" value={selectedCommunity.community_members?.[0]?.count || 0} icon={Users} />
                  <Stat
                    label="Status"
                    value={selectedCommunity.is_active ? 'Active' : 'Inactive'}
                    icon={CheckCircle}
                  />
                  <Stat
                    label="Messaging"
                    value={selectedCommunity.messaging_enabled ? 'On' : 'Off'}
                    icon={MessageCircle}
                  />
                </div>

                {/* Quick actions — neutral, so no single action looks more
                    urgent than the others purely because of its tint. */}
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="text-base font-bold tracking-tight text-foreground">Quick actions</h3>
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      { href: `/dashboard/mentor/communities/${selectedCommunity.id}?tab=feed`, icon: MessageCircle, label: 'View feed' },
                      { href: `/dashboard/mentor/communities/${selectedCommunity.id}?tab=members`, icon: Users, label: 'Manage members' },
                      { href: `/dashboard/mentor/communities/${selectedCommunity.id}/analytics`, icon: Eye, label: 'Analytics' },
                      { href: `/dashboard/mentor/communities/${selectedCommunity.id}/moderation`, icon: AlertCircle, label: 'Moderation' },
                    ].map((a) => (
                      <Link
                        key={a.label}
                        href={a.href}
                        className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <a.icon className="size-4 shrink-0 text-muted-foreground" />
                        {a.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground/70 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Select a community
              </h3>
              <p className="text-foreground/80">Choose a community from the left sidebar to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Team Members */}
      {selectedCommunity && (
        <div className="w-80 bg-muted/40 border-l border-border flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <input
                type="text"
                placeholder="Search members…"
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                className="h-9 w-full rounded-lg border bg-card pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          {/* Members list — real roster from /api/community-members */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Team members ({members.length})
              </div>

              {membersLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <div className="size-9 shrink-0 animate-pulse rounded-lg bg-muted" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                        <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : visibleMembers.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                  {memberQuery ? 'No members match that search.' : 'No members have joined yet.'}
                </p>
              ) : (
                <div className="space-y-1">
                  {visibleMembers.map((m) => {
                    const name = m.student?.full_name || 'Unknown member';
                    return (
                      <div key={m.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted">
                        {m.student?.avatar_url ? (
                          <Image
                            src={m.student.avatar_url}
                            alt=""
                            width={36}
                            height={36}
                            className="size-9 shrink-0 rounded-lg border object-cover"
                          />
                        ) : (
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-xs font-semibold text-foreground">
                            {getInitials(name)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-foreground">{name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {m.student?.specialization_board || m.role || 'Member'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="p-4 border-t border-border bg-card">
            <div className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-3">
              Community Info
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-foreground/80">Created</span>
                <span className="text-foreground font-semibold">
                  {new Date(selectedCommunity.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/80">Status</span>
                <span className="text-foreground font-semibold">
                  {selectedCommunity.is_active ? '🟢 Active' : '⚪ Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
