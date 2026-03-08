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
    case 'graded':    return 'bg-violet-100 text-violet-700';
    case 'reviewed':  return 'bg-blue-100 text-blue-700';
    case 'analyzed':  return 'bg-emerald-100 text-emerald-700';
    case 'analyzing': return 'bg-amber-100 text-amber-700';
    case 'submitted': return 'bg-slate-100 text-slate-600';
    default:          return 'bg-slate-100 text-slate-500';
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
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Submissions</h2>
            <span className="text-sm text-slate-500">{submissions.length} total</span>
          </div>
          <div className="divide-y divide-slate-50">
            {submissions.map((sub) => {
              const hasSuspicious = sub.analytics?.suspicious_flags?.some((f) => f.severity === 'high');
              const score = sub.analytics?.overall_score;

              return (
                <div key={sub.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  {/* Avatar */}
                  {sub.student?.avatar_url ? (
                    <img
                      src={sub.student.avatar_url}
                      alt={sub.student.full_name}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700 flex-shrink-0">
                      {sub.student?.full_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/mentor/projects/${assignmentId}/${sub.student_id}`}
                        className="font-medium text-slate-800 hover:text-violet-700 truncate transition-colors"
                      >
                        {sub.student?.full_name ?? 'Unknown Student'}
                      </Link>
                      {hasSuspicious && (
                        <span title="Suspicious activity detected">
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    <a
                      href={sub.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-violet-600 hover:underline truncate block mt-0.5"
                    >
                      {sub.repo_full_name}
                    </a>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-shrink-0 text-sm">
                    {sub.analytics ? (
                      <>
                        <div className="text-center hidden sm:block">
                          <p className="font-bold text-slate-800">{sub.analytics.total_commits}</p>
                          <p className="text-xs text-slate-400">commits</p>
                        </div>
                        {score !== undefined && (
                          <div className="w-10 h-10 rounded-full border-2 border-violet-200 flex items-center justify-center text-sm font-bold text-violet-700">
                            {score}
                          </div>
                        )}
                      </>
                    ) : null}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(sub.status)}`}>
                      {sub.status}
                    </span>
                    {sub.evaluation?.score !== null && sub.evaluation?.score !== undefined && (
                      <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                        {sub.evaluation.score}/{maxScore}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/mentor/projects/${assignmentId}/${sub.student_id}`}
                    className="flex-shrink-0"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Not yet submitted */}
      {notSubmitted.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Circle className="w-4 h-4 text-slate-400" />
              Not Submitted ({notSubmitted.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {notSubmitted.map(({ student }) => (
              <div key={student?.id} className="flex items-center gap-4 px-6 py-3.5">
                {student?.avatar_url ? (
                  <img
                    src={student.avatar_url}
                    alt={student.full_name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                    {student?.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-600">{student?.full_name}</p>
                  <p className="text-xs text-slate-400">{student?.email}</p>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
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
