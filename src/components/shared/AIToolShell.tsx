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
      <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-[var(--cl-hairline)] bg-[var(--cl-surface-card)] lg:flex">
        <div className="space-y-3 border-b border-[var(--cl-hairline)] p-4">
          <button
            onClick={onNew}
            className="cl-press flex h-11 w-full items-center justify-center gap-2 rounded-[var(--cl-r-md)] bg-[var(--cl-primary)] px-4 text-sm font-semibold text-[var(--cl-on-primary)] transition-colors hover:bg-[var(--cl-primary-active)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.2)]"
          >
            <Plus size={16} aria-hidden="true" />
            {newLabel}
          </button>

          {history.length > 5 && (
            <div className="flex h-10 items-center gap-2 rounded-[var(--cl-r-md)] border border-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] px-3 transition-colors focus-within:border-[var(--cl-ink)] focus-within:ring-[3px] focus-within:ring-[rgba(10,10,10,0.12)]">
              <Search size={14} className="flex-shrink-0 text-[var(--cl-muted)]" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter"
                aria-label={`Filter ${historyLabel.toLowerCase()}`}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] text-[var(--cl-ink)] shadow-none outline-none placeholder:text-[var(--cl-muted)] focus:border-0 focus:outline-none focus:ring-0 [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear filter"
                  className="flex-shrink-0 rounded text-[var(--cl-muted)] hover:text-[var(--cl-ink)]"
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
              <span className="cl-mono ml-1.5 text-[var(--cl-muted)]">{filtered.length}</span>
            )}
          </p>

          {history.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-[var(--cl-muted)]">{emptyLabel}</p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-[var(--cl-muted)]">
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
                    className={`flex w-full items-start gap-2.5 rounded-[var(--cl-r-md)] py-2.5 pl-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.12)] ${
                      onDelete ? 'pr-9' : 'pr-3'
                    } ${
                      active
                        ? 'bg-[var(--cl-primary)] text-[var(--cl-on-primary)]'
                        : 'text-[var(--cl-body)] hover:bg-[var(--cl-surface-strong)] hover:text-[var(--cl-ink)]'
                    }`}
                  >
                    <MessageSquare
                      size={15}
                      className={`mt-0.5 flex-shrink-0 ${active ? 'text-[var(--cl-on-primary)]' : 'text-[var(--cl-muted)]'}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{item.title}</span>
                      {when && (
                        <span
                          className={`block text-[11px] ${active ? 'text-[rgba(255,255,255,0.7)]' : 'text-[var(--cl-muted)]'}`}
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
                      className={`absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[var(--cl-r-sm)] transition-colors focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.12)] ${
                        confirming
                          ? 'bg-[var(--cl-error)] text-white opacity-100'
                          : `opacity-0 group-hover:opacity-100 ${
                              active
                                ? 'text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.15)]'
                                : 'text-[var(--cl-muted)] hover:bg-[var(--cl-surface-strong)] hover:text-[var(--cl-error)]'
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
