'use client';

import { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import RepoFileTree, { type TreeNode } from '@/components/projects/RepoFileTree';
import ActivityHeatmap from '@/components/projects/ActivityHeatmap';
import CodeQualityCard from '@/components/projects/CodeQualityCard';
import SuspiciousActivityAlert from '@/components/projects/SuspiciousActivityAlert';
import SimilarityFlagsAlert from '@/components/projects/SimilarityFlagsAlert';
import ProjectTimeline from '@/components/projects/ProjectTimeline';
import CommitHistory from '@/components/projects/CommitHistory';
import AIReviewPanel from '@/components/projects/AIReviewPanel';
import ProgressChart, { type ProgressSnapshot } from '@/components/projects/ProgressChart';
import EvaluationPanel from './EvaluationPanel';
import FileViewer from './FileViewer';

type Analytics = {
  overall_score: number;
  consistency_score: number;
  activity_score: number;
  quality_score: number;
  total_commits: number;
  total_branches: number;
  total_files: number;
  total_lines: number;
  repo_size_kb: number;
  stars: number;
  forks: number;
  active_days: number;
  daily_activity: Record<string, number>;
  weekly_activity: Array<{ week: number; total: number; days: number[] }>;
  contributors: Array<{ login: string; avatar?: string; commits: number }>;
  languages: Record<string, number>;
  complexity_level: 'low' | 'medium' | 'high';
  has_readme: boolean;
  has_tests: boolean;
  folder_depth: number;
  suspicious_flags: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' | 'critical' }>;
  similarity_flags: Array<{ peer_submission_id: string; peer_student_id: string; similarity: number; files_compared: string[] }>;
  timeline_events: Array<{ date: string; type: string; message: string }>;
  file_tree: TreeNode[];
  last_push_at: string | null;
  repo_created_at: string | null;
  analyzed_at: string;
};

type Evaluation = {
  score: number | null;
  feedback: string | null;
  comments: Array<{ text: string; created_at: string }>;
} | null;

type Tab = 'overview' | 'commits' | 'files' | 'ai_review' | 'quality' | 'timeline' | 'evaluate';

type SubmissionType = 'github' | 'file_upload' | 'link' | 'written';

interface ProjectReviewClientProps {
  assignmentId: string;
  submissionId: string;
  studentId: string;
  maxScore: number;
  submissionType: SubmissionType;
  repoUrl: string | null;
  repoFullName: string | null;
  status: string;
  analytics: Analytics | null;
  evaluation: Evaluation;
  snapshots?: ProgressSnapshot[];
  peerNames?: Record<string, string>;
}

export default function ProjectReviewClient({
  assignmentId,
  submissionId,
  studentId,
  maxScore,
  submissionType,
  repoUrl,
  repoFullName,
  status,
  analytics,
  evaluation,
  snapshots,
  peerNames,
}: ProjectReviewClientProps) {
  const isGithub = submissionType === 'github';
  const [tab, setTab] = useState<Tab>(isGithub ? 'overview' : 'evaluate');
  const [reAnalyzing, setReAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | undefined>();
  const [aiPendingFilePath, setAiPendingFilePath] = useState<string | null>(null);

  const tabs: Array<{ id: Tab; label: string }> = isGithub
    ? [
        { id: 'overview',   label: 'Overview' },
        { id: 'commits',    label: 'Commits' },
        { id: 'files',      label: 'Files' },
        { id: 'ai_review',  label: 'AI Review' },
        { id: 'quality',    label: 'Quality' },
        { id: 'timeline',   label: 'Timeline' },
        { id: 'evaluate',   label: 'Evaluate' },
      ]
    : [{ id: 'evaluate', label: 'Evaluate' }];

  async function triggerReAnalysis() {
    setReAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/github/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setAnalysisError(data.error ?? 'Analysis failed');
        return;
      }
      window.location.reload();
    } catch {
      setAnalysisError('Network error — please try again');
    } finally {
      setReAnalyzing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-primary text-white'
                : 'text-foreground/80 hover:bg-muted/40'
            }`}
          >
            {t.label}
          </button>
        ))}
        {isGithub && (
          <button
            onClick={triggerReAnalysis}
            disabled={reAnalyzing}
            className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors flex items-center gap-1 text-sm"
            title="Re-analyze repository"
          >
            {reAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="hidden sm:inline">Re-analyze</span>
          </button>
        )}
      </div>

      {/* No analytics yet */}
      {isGithub && !analytics && tab !== 'evaluate' && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <RefreshCw className="w-10 h-10 text-muted-foreground/70 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium mb-1">Analysis not yet complete</p>
          <p className="text-muted-foreground text-sm mb-4">Status: <span className="font-mono">{status}</span></p>
          {analysisError && (
            <p className="text-sm text-destructive mb-4 bg-destructive/10 rounded-lg px-4 py-2 inline-block">{analysisError}</p>
          )}
          <button
            onClick={triggerReAnalysis}
            disabled={reAnalyzing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary transition-colors"
          >
            {reAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Run Analysis
          </button>
        </div>
      )}

      {/* ── Overview tab ── */}
      {tab === 'overview' && analytics && (
        <div className="space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Commits', value: analytics.total_commits },
              { label: 'Active Days', value: analytics.active_days },
              { label: 'Files', value: analytics.total_files },
              { label: 'Branches', value: analytics.total_branches },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Activity heatmap */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground/80 mb-4">Coding Activity</h3>
            <ActivityHeatmap dailyActivity={analytics.daily_activity} weeks={26} />
          </div>

          {/* Commit velocity chart */}
          {analytics.weekly_activity && analytics.weekly_activity.length > 0 && (() => {
            const weeks = analytics.weekly_activity.slice(-16);
            const maxVal = Math.max(...weeks.map(w => w.total), 1);
            return (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground/80">Commit Velocity (Weekly)</h3>
                  <span className="text-xs text-muted-foreground">
                    {weeks.reduce((s, w) => s + w.total, 0)} commits over {weeks.length} weeks
                  </span>
                </div>
                <div className="flex items-end gap-1 h-20">
                  {weeks.map((w) => {
                    const pct = Math.round((w.total / maxVal) * 100);
                    const date = new Date(w.week * 1000);
                    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return (
                      <div key={w.week} className="flex-1 flex flex-col items-center gap-1 group relative" title={`${label}: ${w.total} commits`}>
                        <div
                          className="w-full rounded-t-sm transition-all"
                          style={{
                            height: `${Math.max(pct, 4)}%`,
                            background: w.total === 0
                              ? '#e2e8f0'
                              : w.total >= maxVal * 0.7
                              ? '#7c3aed'
                              : w.total >= maxVal * 0.3
                              ? '#a78bfa'
                              : '#ddd6fe',
                          }}
                        />
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-neutral-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10">
                          {label}: {w.total}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground/70 mt-2">
                  <span>{new Date(weeks[0].week * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span>{new Date(weeks[weeks.length - 1].week * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            );
          })()}

          {/* Suspicious activity */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground/80 mb-3">Activity Integrity Check</h3>
            <SuspiciousActivityAlert flags={analytics.suspicious_flags} />
          </div>

          {/* Cross-submission similarity */}
          {analytics.similarity_flags && analytics.similarity_flags.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <SimilarityFlagsAlert flags={analytics.similarity_flags} peerNames={peerNames ?? {}} assignmentId={assignmentId} />
            </div>
          )}

          {/* Progress trend */}
          {snapshots && snapshots.length >= 2 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground/80 mb-4">Progress Trend</h3>
              <ProgressChart snapshots={snapshots} />
            </div>
          )}
        </div>
      )}

      {/* ── File Explorer tab ── */}
      {tab === 'files' && analytics && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-[600px]">
            {/* Tree */}
            <div className="border-r border-border overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-border bg-muted/40">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Repository Files</p>
              </div>
              <div className="flex-1 overflow-hidden py-2">
                <RepoFileTree
                  tree={analytics.file_tree}
                  selectedPath={selectedFilePath}
                  onFileClick={async (path) => {
                    setSelectedFilePath(path);
                    // Trigger file viewer via global ref
                    const fn = (window as Window & { __loadFile?: (path: string) => void }).__loadFile;
                    if (fn) fn(path);
                  }}
                />
              </div>
            </div>

            {/* Viewer */}
            <FileViewer
              submissionId={submissionId}
              repoUrl={repoUrl ?? ''}
              onReviewWithAI={(path) => { setAiPendingFilePath(path); setTab('ai_review'); }}
            />
          </div>
        </div>
      )}

      {/* ── Code Quality tab ── */}
      {tab === 'quality' && analytics && (
        <div className="bg-card border border-border rounded-xl p-5">
          <CodeQualityCard
            hasReadme={analytics.has_readme}
            hasTests={analytics.has_tests}
            complexityLevel={analytics.complexity_level}
            totalFiles={analytics.total_files}
            totalBranches={analytics.total_branches}
            folderDepth={analytics.folder_depth}
            totalLines={analytics.total_lines}
            languages={analytics.languages}
            stars={analytics.stars}
            forks={analytics.forks}
            contributors={analytics.contributors}
            consistencyScore={analytics.consistency_score}
            activityScore={analytics.activity_score}
            qualityScore={analytics.quality_score}
            overallScore={analytics.overall_score}
          />
        </div>
      )}

      {/* ── Timeline tab ── */}
      {tab === 'timeline' && analytics && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground/80 mb-4">Project Development Timeline</h3>
          <ProjectTimeline events={analytics.timeline_events} />
        </div>
      )}

      {/* ── Commits tab ── */}
      {tab === 'commits' && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground/80 mb-4">Commit History</h3>
          <CommitHistory submissionId={submissionId} />
        </div>
      )}

      {/* ── AI Review tab ── */}
      {tab === 'ai_review' && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground/80 mb-4">AI Code Review</h3>
          <AIReviewPanel
            submissionId={submissionId}
            pendingFilePath={aiPendingFilePath}
            onClearPendingFile={() => setAiPendingFilePath(null)}
          />
        </div>
      )}

      {/* ── Evaluate tab ── */}
      {tab === 'evaluate' && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground/80 mb-4">Evaluation & Grading</h3>
          <EvaluationPanel
            assignmentId={assignmentId}
            submissionId={submissionId}
            studentId={studentId}
            maxScore={maxScore}
            initial={evaluation}
          />
        </div>
      )}
    </div>
  );
}
