'use client';

import Link from 'next/link';
import { AlertTriangle, ChevronRight, Clock, Circle } from 'lucide-react';

type Submission = {
  id: string;
  student_id: string;
  repo_url: string;
  repo_full_name: string;
  submitted_at: string;
  status: string;
  student: { id: string; full_name: string; avatar_url: string | null; email: string } | null;
  analytics: {
    overall_score: number;
    total_commits: number;
    suspicious_flags: Array<{ severity: string }>;
  } | null;
  evaluation: { score: number | null } | null;
};

type NotSubmittedStudent = {
  student_id: string;
  student: { id: string; full_name: string; avatar_url: string | null; email: string } | null;
};

function statusColor(status: string) {
  switch (status) {
    case 'graded':    return 'bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]';
    case 'reviewed':  return 'bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)]';
    case 'analyzed':  return 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]';
    case 'analyzing': return 'bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)]';
    case 'submitted': return 'bg-[var(--cl-surface-strong)] text-[var(--cl-body)]';
    default:          return 'bg-[var(--cl-surface-strong)] text-[var(--cl-muted)]';
  }
}

interface Props {
  assignmentId: string;
  maxScore: number;
  submissions: Submission[];
  notSubmitted: NotSubmittedStudent[];
}

export default function SubmissionsList({ assignmentId, maxScore, submissions, notSubmitted }: Props) {
  return (
    <>
      {/* Submissions */}
      {submissions.length > 0 && (
        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--cl-hairline)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--cl-ink)]">Submissions</h2>
            <span className="text-sm text-[var(--cl-muted)]">{submissions.length} total</span>
          </div>
          <div className="divide-y divide-[var(--cl-hairline)]">
            {submissions.map((sub) => {
              const hasSuspicious = sub.analytics?.suspicious_flags?.some((f) => f.severity === 'high');
              const score = sub.analytics?.overall_score;

              return (
                <div key={sub.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--cl-canvas-soft)] transition-colors">
                  {/* Avatar */}
                  {sub.student?.avatar_url ? (
                    <img
                      src={sub.student.avatar_url}
                      alt={sub.student.full_name}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[var(--cl-primary-soft)] flex items-center justify-center text-sm font-semibold text-[var(--cl-primary)] flex-shrink-0">
                      {sub.student?.full_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/mentor/projects/${assignmentId}/${sub.student_id}`}
                        className="font-medium text-[var(--cl-ink)] hover:text-[var(--cl-primary)] truncate transition-colors"
                      >
                        {sub.student?.full_name ?? 'Unknown Student'}
                      </Link>
                      {hasSuspicious && (
                        <span title="Suspicious activity detected">
                          <AlertTriangle className="w-4 h-4 text-[var(--cl-error)] flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    <a
                      href={`https://github.com/${sub.repo_full_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--cl-primary)] hover:underline truncate block mt-0.5"
                    >
                      {sub.repo_full_name}
                    </a>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-shrink-0 text-sm">
                    {sub.analytics ? (
                      <>
                        <div className="text-center hidden sm:block">
                          <p className="font-semibold text-[var(--cl-ink)]">{sub.analytics.total_commits}</p>
                          <p className="text-xs text-[var(--cl-muted)]">commits</p>
                        </div>
                        {score !== undefined && (
                          <div className="w-10 h-10 rounded-full border-2 border-[var(--cl-primary)] flex items-center justify-center text-sm font-semibold text-[var(--cl-primary)]">
                            {score}
                          </div>
                        )}
                      </>
                    ) : null}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(sub.status)}`}>
                      {sub.status}
                    </span>
                    {sub.evaluation?.score !== null && sub.evaluation?.score !== undefined && (
                      <span className="text-xs font-semibold text-[var(--cl-primary)] bg-[var(--cl-primary-soft)] px-2 py-0.5 rounded-full">
                        {sub.evaluation.score}/{maxScore}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/mentor/projects/${assignmentId}/${sub.student_id}`}
                    className="flex-shrink-0"
                  >
                    <ChevronRight className="w-4 h-4 text-[var(--cl-muted-soft)]" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Not yet submitted */}
      {notSubmitted.length > 0 && (
        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--cl-hairline)]">
            <h2 className="font-semibold text-[var(--cl-ink)] flex items-center gap-2">
              <Circle className="w-4 h-4 text-[var(--cl-muted-soft)]" />
              Not Submitted ({notSubmitted.length})
            </h2>
          </div>
          <div className="divide-y divide-[var(--cl-hairline)]">
            {notSubmitted.map(({ student }) => (
              <div key={student?.id} className="flex items-center gap-4 px-6 py-3.5">
                {student?.avatar_url ? (
                  <img
                    src={student.avatar_url}
                    alt={student.full_name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--cl-surface-strong)] flex items-center justify-center text-xs font-semibold text-[var(--cl-muted)] flex-shrink-0">
                    {student?.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--cl-body)]">{student?.full_name}</p>
                  <p className="text-xs text-[var(--cl-muted)]">{student?.email}</p>
                </div>
                <span className="text-xs text-[var(--cl-muted)] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
