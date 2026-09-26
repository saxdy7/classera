'use client';

import { useMemo, useState } from 'react';
import { Plus, MessageSquare, Trash2, Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

export interface AIToolHistoryItem {
  id: string;
  title: string;
  /** ISO string or anything Date can parse. Optional. */
  createdAt?: string | number | Date | null;
}

interface AIToolShellProps {
  /** Label for the primary action, e.g. "New Roadmap". */
  newLabel: string;
  onNew: () => void;
  history: AIToolHistoryItem[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  /** Optional: enables the per-item delete control. */
  onDelete?: (id: string) => void;
  /** Heading above the list, e.g. "Recent Roadmaps". */
  historyLabel?: string;
  emptyLabel?: string;
  children: ReactNode;
}

/**
 * Two-pane shell for the AI tools - a persistent history rail on the left and
 * the working surface on the right.
 *
 * This is the AI Career Coach layout generalised so Roadmaps, AI Course and
 * Study Guide share it. Those pages already loaded their history from
 * /api/history but rendered it as a cramped horizontally-scrolling strip under
 * the form, which truncated titles and hid older entries.
 *
 * The rail collapses below `lg` so small screens keep the full width for the
 * working surface.
 */
export function AIToolShell({
  newLabel,
  onNew,
  history,
  activeId,
  onSelect,
  onDelete,
  historyLabel = 'Recent',
  emptyLabel = 'Nothing here yet.',
  children,
}: AIToolShellProps) {
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const fmt = (d: AIToolHistoryItem['createdAt']) => {
    if (!d) return null;
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
  };

  // Filtering is local: the list is already loaded, so there is no reason to
  // round-trip the API for a substring match.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? history.filter((h) => h.title.toLowerCase().includes(q)) : history;
  }, [history, query]);

  return (
    <div className="flex min-h-0 w-full flex-1">
      {/* History rail */}
      <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="space-y-3 border-b border-border p-4">
          <button
            onClick={onNew}
            className="cl-press flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Plus size={16} aria-hidden="true" />
            {newLabel}
          </button>

          {history.length > 5 && (
            <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 transition-colors focus-within:border-foreground focus-within:ring-[3px] focus-within:ring-ring/50">
              <Search size={14} className="flex-shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter"
                aria-label={`Filter ${historyLabel.toLowerCase()}`}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] text-foreground shadow-none outline-none placeholder:text-muted-foreground focus:border-0 focus:outline-none focus:ring-0 [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear filter"
                  className="flex-shrink-0 rounded text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        <nav aria-label={historyLabel} className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
          <p className="cl-eyebrow px-3 pb-2 pt-1">
            {historyLabel}
            {history.length > 0 && (
              <span className="cl-mono ml-1.5 text-muted-foreground">{filtered.length}</span>
            )}
          </p>

          {history.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">{emptyLabel}</p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">
              Nothing matches &ldquo;{query}&rdquo;.
            </p>
          ) : (
            filtered.map((item) => {
              const active = activeId === item.id;
              const when = fmt(item.createdAt);
              const confirming = pendingDelete === item.id;

              return (
                <div key={item.id} className="group relative">
                  <button
                    onClick={() => onSelect(item.id)}
                    aria-current={active ? 'true' : undefined}
                    title={item.title}
                    className={`flex w-full items-start gap-2.5 rounded-lg py-2.5 pl-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                      onDelete ? 'pr-9' : 'pr-3'
                    } ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <MessageSquare
                      size={15}
                      className={`mt-0.5 flex-shrink-0 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{item.title}</span>
                      {when && (
                        <span
                          className={`block text-[11px] ${active ? 'text-[rgba(255,255,255,0.7)]' : 'text-muted-foreground'}`}
                        >
                          {when}
                        </span>
                      )}
                    </span>
                  </button>

                  {onDelete && (
                    <button
                      onClick={() => {
                        // Two-step: the first click arms, the second deletes.
                        // Deleting generated work on a single stray click is not
                        // something we want to be easy.
                        if (confirming) {
                          onDelete(item.id);
                          setPendingDelete(null);
                        } else {
                          setPendingDelete(item.id);
                        }
                      }}
                      onBlur={() => setPendingDelete((c) => (c === item.id ? null : c))}
                      aria-label={confirming ? `Confirm delete ${item.title}` : `Delete ${item.title}`}
                      title={confirming ? 'Click again to confirm' : 'Delete'}
                      className={`absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition-colors focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                        confirming
                          ? 'bg-destructive text-white opacity-100'
                          : `opacity-0 group-hover:opacity-100 ${
                              active
                                ? 'text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.15)]'
                                : 'text-muted-foreground hover:bg-muted hover:text-destructive'
                            }`
                      }`}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </nav>
      </aside>

      {/* Working surface */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
