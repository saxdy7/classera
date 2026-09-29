'use client';

import { useEffect, useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Sidebar collapse trigger — aria/looma put this in the HEADER
 * (`<SidebarTrigger className="-ml-1" />` beside the breadcrumb divider),
 * not in the sidebar footer.
 *
 * Moving it here also clears a collision: Next's dev-mode indicator is pinned
 * to the bottom-left of the viewport and sat directly on top of the old
 * in-sidebar "Collapse" row.
 *
 * The rail's open/closed state lives in localStorage under `cl-sidebar-expanded`
 * and is published as the `--cl-sidebar-w` CSS variable. Both components read
 * and write that same pair, and a `cl-sidebar-toggle` window event keeps them in
 * sync without needing a shared provider.
 */
export const SIDEBAR_EVENT = 'cl-sidebar-toggle';

export function SidebarTrigger({ className }: { className?: string }) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('cl-sidebar-expanded');
      if (saved === '0' || saved === '1') setExpanded(saved === '1');
    } catch {}

    const onToggle = (e: Event) => setExpanded((e as CustomEvent<boolean>).detail);
    window.addEventListener(SIDEBAR_EVENT, onToggle);
    return () => window.removeEventListener(SIDEBAR_EVENT, onToggle);
  }, []);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    try { window.localStorage.setItem('cl-sidebar-expanded', next ? '1' : '0'); } catch {}
    document.documentElement.style.setProperty('--cl-sidebar-w', next ? '260px' : '68px');
    window.dispatchEvent(new CustomEvent(SIDEBAR_EVENT, { detail: next }));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      className={cn(
        'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
    >
      <PanelLeft className="size-4" />
    </button>
  );
}
