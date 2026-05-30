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
      <div className={`rounded-3xl p-8 mb-8 ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{testTitle}</h1>
            <p className="text-white/80">Your test results</p>
          </div>
          <div className="text-center">
            {passed ? (
              <div className="text-6xl mb-2">✓</div>
            ) : (
              <div className="text-6xl mb-2">✕</div>
            )}
            <p className="text-white font-bold text-lg">{passed ? 'PASSED' : 'FAILED'}</p>
          </div>
        </div>
      </div>

      {/* Score Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <ScoreCard
          icon={<Award className="w-6 h-6 text-purple-600" />}
          bgColor="bg-purple-100"
          value={score}
          label="Score"
        />
        <ScoreCard
          icon={<FileText className="w-6 h-6 text-blue-600" />}
          bgColor="bg-blue-100"
          value={maxScore}
          label="Total Marks"
        />
        <ScoreCard
          value={`${percentage.toFixed(1)}%`}
          bgColor="bg-green-100"
          label="Percentage"
          isPercentage
        />
        <ScoreCard
          value={grade}
          bgColor="bg-fuchsia-100"
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
    <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
      {icon && (
        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
          {icon}
        </div>
      )}
      {!icon && (
        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
          <span className={`text-xl font-bold ${textColor}`}>{isPercentage ? '%' : isGrade ? value : '—'}</span>
        </div>
      )}
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-slate-600 text-sm">{label}</p>
    </div>
  );
}
