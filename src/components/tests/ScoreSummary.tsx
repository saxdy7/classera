'use client';

import { Award, FileText } from 'lucide-react';

interface ScoreSummaryProps {
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  passed: boolean;
  testTitle: string;
}

export function ScoreSummary({
  score,
  maxScore,
  percentage,
  grade,
  passed,
  testTitle,
}: ScoreSummaryProps) {
  return (
    <>
      {/* Result Header Card */}
      <div className={`rounded-[var(--cl-r-xl)] p-8 mb-8 ${passed ? 'bg-[var(--cl-success)]' : 'bg-[var(--cl-error)]'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--cl-on-dark)] mb-2">{testTitle}</h1>
            <p className="text-[rgba(255,255,255,0.8)]">Your test results</p>
          </div>
          <div className="text-center">
            {passed ? (
              <div className="text-6xl mb-2">✓</div>
            ) : (
              <div className="text-6xl mb-2">✕</div>
            )}
            <p className="text-[var(--cl-on-dark)] font-semibold text-lg">{passed ? 'PASSED' : 'FAILED'}</p>
          </div>
        </div>
      </div>

      {/* Score Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <ScoreCard
          icon={<Award className="w-6 h-6 text-[var(--cl-primary)]" />}
          bgColor="bg-[var(--cl-primary-soft)]"
          value={score}
          label="Score"
        />
        <ScoreCard
          icon={<FileText className="w-6 h-6 text-[var(--cl-info)]" />}
          bgColor="bg-[rgba(13,116,206,0.12)]"
          value={maxScore}
          label="Total Marks"
        />
        <ScoreCard
          value={`${percentage.toFixed(1)}%`}
          bgColor="bg-[rgba(22,163,74,0.12)]"
          label="Percentage"
          isPercentage
        />
        <ScoreCard
          value={grade}
          bgColor="bg-[var(--cl-primary-soft)]"
          label="Grade"
          isGrade
        />
      </div>
    </>
  );
}

function ScoreCard({
  icon,
  bgColor,
  value,
  label,
  isPercentage = false,
  isGrade = false,
}: {
  icon?: React.ReactNode;
  bgColor: string;
  value: string | number;
  label: string;
  isPercentage?: boolean;
  isGrade?: boolean;
}) {
  const textColor = bgColor.replace('bg-', 'text-').replace('-100', '-600');

  return (
    <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-hairline)] text-center">
      {icon && (
        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
          {icon}
        </div>
      )}
      {!icon && (
        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
          <span className={`text-xl font-semibold ${textColor}`}>{isPercentage ? '%' : isGrade ? value : '—'}</span>
        </div>
      )}
      <p className="text-3xl font-semibold text-[var(--cl-ink)]">{value}</p>
      <p className="text-[var(--cl-body)] text-sm">{label}</p>
    </div>
  );
}
