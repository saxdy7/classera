'use client';

import { GitBranch, FileCode, Clock, Star, GitFork, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CodeQualityCardProps {
  hasReadme: boolean;
  hasTests: boolean;
  complexityLevel: 'low' | 'medium' | 'high';
  totalFiles: number;
  totalBranches: number;
  folderDepth: number;
  totalLines: number;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  contributors: Array<{ login: string; avatar?: string; commits: number }>;
  consistencyScore: number;
  activityScore: number;
  qualityScore: number;
  overallScore: number;
}

function ScoreRing({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
          {value}
        </span>
      </div>
      <span className="text-xs text-slate-500 text-center">{label}</span>
    </div>
  );
}

const complexityColor: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

export default function CodeQualityCard({
  hasReadme,
  hasTests,
  complexityLevel,
  totalFiles,
  totalBranches,
  folderDepth,
  totalLines,
  languages,
  stars,
  forks,
  contributors,
  consistencyScore,
  activityScore,
  qualityScore,
  overallScore,
}: CodeQualityCardProps) {
  const totalLangBytes = Object.values(languages).reduce((s, v) => s + v, 0);

  const langColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#84cc16',
  ];

  return (
    <div className="space-y-6">
      {/* Score rings */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 text-center">Performance Scores</h3>
        <div className="flex items-center justify-around flex-wrap gap-4">
          <ScoreRing value={overallScore} color="#6366f1" label="Overall" />
          <ScoreRing value={consistencyScore} color="#8b5cf6" label="Consistency" />
          <ScoreRing value={activityScore} color="#ec4899" label="Activity" />
          <ScoreRing value={qualityScore} color="#10b981" label="Quality" />
        </div>
      </div>

      {/* Repository stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: FileCode, label: 'Files', value: totalFiles, color: 'text-violet-600' },
          { icon: GitBranch, label: 'Branches', value: totalBranches, color: 'text-indigo-600' },
          { icon: Clock, label: 'Est. Lines', value: totalLines.toLocaleString(), color: 'text-blue-600' },
          { icon: Star, label: 'Stars', value: stars, color: 'text-amber-600' },
          { icon: GitFork, label: 'Forks', value: forks, color: 'text-emerald-600' },
          { icon: Users, label: 'Contributors', value: contributors.length, color: 'text-pink-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3">
            <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
            <div>
              <p className="text-lg font-bold text-slate-800 leading-none">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quality checks */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Quality Checks</h3>
        {[
          { label: 'README present', passed: hasReadme },
          { label: 'Test files found', passed: hasTests },
          { label: 'Multiple branches', passed: totalBranches > 1 },
          { label: 'Folder structure', passed: folderDepth > 1 },
        ].map(({ label, passed }) => (
          <div key={label} className="flex items-center gap-2">
            {passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />
            )}
            <span className={`text-sm ${passed ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* Complexity badge */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">Code Complexity:</span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${complexityColor[complexityLevel] ?? 'bg-slate-100 text-slate-600'}`}>
          {complexityLevel}
        </span>
        <span className="text-xs text-slate-400">
          ({totalFiles} files, depth {folderDepth})
        </span>
      </div>

      {/* Language breakdown */}
      {totalLangBytes > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Languages</h3>
          {/* Bar */}
          <div className="flex rounded-full overflow-hidden h-2">
            {Object.entries(languages)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([lang, bytes], i) => (
                <div
                  key={lang}
                  style={{
                    width: `${(bytes / totalLangBytes) * 100}%`,
                    backgroundColor: langColors[i % langColors.length],
                  }}
                  title={`${lang}: ${((bytes / totalLangBytes) * 100).toFixed(1)}%`}
                />
              ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(languages)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([lang, bytes], i) => (
                <div key={lang} className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: langColors[i % langColors.length] }}
                  />
                  <span className="text-xs text-slate-600">{lang}</span>
                  <span className="text-xs text-slate-400">
                    {((bytes / totalLangBytes) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Top contributors */}
      {contributors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Contributors</h3>
          {contributors.slice(0, 5).map((c) => (
            <div key={c.login} className="flex items-center gap-2">
              {c.avatar ? (
                <img src={c.avatar} alt={c.login} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-violet-200 flex items-center justify-center text-xs font-bold text-violet-700">
                  {c.login[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm text-slate-700 flex-1">{c.login}</span>
              <span className="text-xs text-slate-500">{c.commits} commits</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
