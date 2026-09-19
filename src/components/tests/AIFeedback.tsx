'use client';

import { TrendingUp, AlertCircle, Lightbulb, BookOpen, Sparkles } from 'lucide-react';
import type { AIAnalysis } from '@/lib/test-types';

interface AICFeedbackProps {
  analysis: AIAnalysis | null | undefined;
  evaluatedAt?: string;
}

export function AIFeedback({ analysis, evaluatedAt }: AICFeedbackProps) {
  if (!analysis) return null;

  return (
    <>
      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {analysis.strengths?.length > 0 && (
          <div className="rounded-[var(--cl-r-lg)] border border-[var(--cl-success)] p-6 bg-[rgba(22,163,74,0.12)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[rgba(22,163,74,0.12)] rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[var(--cl-success)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--cl-success)]">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {analysis.strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[var(--cl-success)]">
                  <span className="text-[var(--cl-success)] mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.weaknesses?.length > 0 && (
          <div className="rounded-[var(--cl-r-lg)] border border-[var(--cl-warning)] p-6 bg-[rgba(171,100,0,0.12)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[rgba(171,100,0,0.12)] rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-[var(--cl-warning)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--cl-warning)]">Areas to Improve</h3>
            </div>
            <ul className="space-y-2">
              {analysis.weaknesses.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[var(--cl-warning)]">
                  <Lightbulb className="w-4 h-4 text-[var(--cl-warning)] mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Study Recommendations */}
      {analysis.study_recommendations?.length > 0 && (
        <div className="rounded-[var(--cl-r-lg)] border border-[var(--cl-info)] p-6 mb-6 bg-[rgba(13,116,206,0.12)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[rgba(13,116,206,0.12)] rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[var(--cl-info)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--cl-info)]">Recommended Study Plan</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.study_recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-[rgba(255,255,255,0.6)] rounded-lg text-[var(--cl-info)]">
                <span className="w-6 h-6 bg-[rgba(13,116,206,0.12)] rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium text-[var(--cl-info)]">
                  {idx + 1}
                </span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Assessment */}
      {analysis.overall_feedback && (
        <div className="rounded-[var(--cl-r-lg)] border border-[var(--cl-primary)] p-6 bg-[var(--cl-primary-soft)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[var(--cl-primary-soft)] rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[var(--cl-primary)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--cl-primary)]">AI Assessment</h3>
              {evaluatedAt && (
                <p className="text-sm text-[var(--cl-primary)]">
                  {new Date(evaluatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <p className="text-[var(--cl-primary)] whitespace-pre-wrap leading-relaxed">
            {analysis.overall_feedback}
          </p>
        </div>
      )}
    </>
  );
}
