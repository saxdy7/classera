'use client';

import Link from 'next/link';
import { Copy, ArrowRight } from 'lucide-react';

interface SimilarityFlag {
  peer_submission_id: string;
  peer_student_id: string;
  similarity: number;
  files_compared: string[];
}

interface SimilarityFlagsAlertProps {
  flags: SimilarityFlag[];
  peerNames: Record<string, string>;
  assignmentId: string;
}

export default function SimilarityFlagsAlert({ flags, peerNames, assignmentId }: SimilarityFlagsAlertProps) {
  if (!flags || flags.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
        <Copy className="w-3.5 h-3.5 text-amber-600" />
        {flags.length} submission{flags.length !== 1 ? 's' : ''} flagged for code similarity
      </p>
      {flags.map((flag) => (
        <div key={flag.peer_submission_id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-amber-500 bg-amber-500/10">
          <div className="min-w-0">
            <p className="text-sm text-amber-600 font-medium">
              {flag.similarity}% similar to {peerNames[flag.peer_student_id] ?? 'another student'}
            </p>
            <p className="text-xs text-amber-600 opacity-80 truncate">
              Matched: {flag.files_compared.join(', ')}
            </p>
          </div>
          <Link
            href={`/dashboard/mentor/projects/${assignmentId}/${flag.peer_student_id}`}
            className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline flex-shrink-0"
          >
            Compare
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ))}
    </div>
  );
}
