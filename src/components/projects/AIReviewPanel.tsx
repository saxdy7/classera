'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Star, ChevronDown, ChevronUp, AlertCircle, Info, Zap } from 'lucide-react';

interface ReviewIssue {
  severity: 'critical' | 'warning' | 'info';
  line?: number;
  description: string;
  suggestion: string;
}

interface AIReview {
  summary: string;
  overall_rating: number;
  strengths: string[];
  issues: ReviewIssue[];
  cached_at?: string;
  is_cached?: boolean;
}

interface AIReviewPanelProps {
  submissionId: string;
  pendingFilePath?: string | null;
  onClearPendingFile?: () => void;
}

const SEV_CONFIG = {
  critical: { label: 'Critical', icon: Zap, bg: 'bg-destructive/10', border: 'border-destructive', text: 'text-destructive', iconColor: 'text-destructive' },
  warning:  { label: 'Warning',  icon: AlertCircle, bg: 'bg-amber-500/10', border: 'border-amber-500', text: 'text-amber-600', iconColor: 'text-amber-600' },
  info:     { label: 'Info',     icon: Info, bg: 'bg-accent-purple/10', border: 'border-accent-purple', text: 'text-accent-purple', iconColor: 'text-accent-purple' },
};

function IssueGroup({ severity, issues }: { severity: keyof typeof SEV_CONFIG; issues: ReviewIssue[] }) {
  const [showAll, setShowAll] = useState(false);
  const config = SEV_CONFIG[severity];
  const Icon = config.icon;
  const visible = showAll ? issues : issues.slice(0, 5);

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${config.bg} ${config.border}`}>
      <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${config.iconColor}`}>
        <Icon size={13} />
        {config.label} ({issues.length})
      </div>
      {visible.map((issue, i) => (
        <div key={i} className="bg-[rgba(255,255,255,0.7)] rounded-lg p-2.5 space-y-1">
          <p className={`text-xs font-medium ${config.text}`}>
            {issue.line !== undefined && <span className="font-mono mr-1">L{issue.line}:</span>}
            {issue.description}
          </p>
          <p className="text-xs text-muted-foreground">💡 {issue.suggestion}</p>
        </div>
      ))}
      {issues.length > 5 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className={`text-xs ${config.text} font-medium flex items-center gap-1`}
        >
          {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showAll ? 'Show less' : `Show ${issues.length - 5} more`}
        </button>
      )}
    </div>
  );
}

export default function AIReviewPanel({ submissionId, pendingFilePath, onClearPendingFile }: AIReviewPanelProps) {
  const [review, setReview] = useState<AIReview | null>(null);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When a new file is selected via the Files tab, auto-trigger review
  useEffect(() => {
    if (pendingFilePath && pendingFilePath !== currentFilePath) {
      handleReview(pendingFilePath, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFilePath]);

  async function handleReview(filePath: string | null, forceRefresh: boolean) {
    setLoading(true);
    setError(null);
    setCurrentFilePath(filePath);
    if (onClearPendingFile) onClearPendingFile();

    try {
      const res = await fetch('/api/github/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId, file_path: filePath, force_refresh: forceRefresh }),
      });
      const data = await res.json() as { review?: AIReview; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'AI review failed');
      setReview(data.review ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const criticalIssues = review?.issues.filter((i) => i.severity === 'critical') ?? [];
  const warningIssues  = review?.issues.filter((i) => i.severity === 'warning') ?? [];
  const infoIssues     = review?.issues.filter((i) => i.severity === 'info') ?? [];

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {pendingFilePath && (
          <button
            onClick={() => handleReview(pendingFilePath, false)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary disabled:opacity-50 transition-colors"
          >
            <Sparkles size={14} />
            Review Selected File
          </button>
        )}
        <button
          onClick={() => handleReview(null, false)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground/80 text-sm font-medium rounded-lg hover:bg-muted/40 disabled:opacity-50 transition-colors"
        >
          <Sparkles size={14} />
          Review Entire Project
        </button>
        {review && (
          <button
            onClick={() => handleReview(currentFilePath, true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-muted-foreground text-xs rounded-lg hover:bg-muted/40 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        )}
      </div>

      {/* Current scope indicator */}
      {currentFilePath && !loading && review && (
        <p className="text-xs text-muted-foreground/70 font-mono">
          Reviewing: <span className="text-foreground/80">{currentFilePath}</span>
        </p>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-accent-purple border-t-accent-purple animate-spin" />
          <p className="text-sm text-muted-foreground/70">Analyzing with AI…</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-lg bg-destructive/10 border border-destructive p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Review result */}
      {review && !loading && (
        <div className="space-y-4">
          {/* Header: rating + cache badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white text-lg font-semibold">{review.overall_rating}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Overall Rating</p>
                <div className="flex gap-0.5 mt-0.5">
                  {[...Array(10)].map((_, i) => (
                    <Star
                      key={i}
                      size={10}
                      className={i < review.overall_rating ? 'text-amber-600 fill-[var(--cl-warning)]' : 'text-muted-foreground/70 fill-muted-foreground'}
                    />
                  ))}
                </div>
              </div>
            </div>
            {review.is_cached && review.cached_at && (
              <span className="text-xs text-muted-foreground/70 bg-muted px-2 py-1 rounded-lg">
                Cached · {new Date(review.cached_at).toLocaleString()}
              </span>
            )}
          </div>

          {/* Summary */}
          <div className="bg-muted/40 rounded-lg p-4">
            <p className="text-sm text-foreground/80 leading-relaxed">{review.summary}</p>
          </div>

          {/* Strengths */}
          {review.strengths.length > 0 && (
            <div className="bg-green-500/10 border border-green-600 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Strengths</p>
              {review.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-green-600">
                  <span className="mt-0.5 text-green-600">✓</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* Issues grouped by severity */}
          {criticalIssues.length > 0 && <IssueGroup severity="critical" issues={criticalIssues} />}
          {warningIssues.length > 0  && <IssueGroup severity="warning"  issues={warningIssues} />}
          {infoIssues.length > 0     && <IssueGroup severity="info"     issues={infoIssues} />}

          {review.issues.length === 0 && (
            <div className="bg-green-500/10 border border-green-600 rounded-lg p-4 text-sm text-green-600 text-center">
              No issues detected — clean code!
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!review && !loading && !error && (
        <div className="text-center py-12 text-muted-foreground/70">
          <Sparkles className="mx-auto mb-2 opacity-40" size={32} />
          <p className="text-sm">Click a button above to start an AI review</p>
          <p className="text-xs mt-1">Or open a file and click &quot;Review with AI&quot;</p>
        </div>
      )}
    </div>
  );
}
