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
          <div className="rounded-lg border border-green-600 p-6 bg-green-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-600">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {analysis.strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-green-600">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.weaknesses?.length > 0 && (
          <div className="rounded-lg border border-amber-500 p-6 bg-amber-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-amber-600">Areas to Improve</h3>
            </div>
            <ul className="space-y-2">
              {analysis.weaknesses.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-amber-600">
                  <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Study Recommendations */}
      {analysis.study_recommendations?.length > 0 && (
        <div className="rounded-lg border border-accent-purple p-6 mb-6 bg-accent-purple/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent-purple/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent-purple" />
            </div>
            <h3 className="text-lg font-semibold text-accent-purple">Recommended Study Plan</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.study_recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-[rgba(255,255,255,0.6)] rounded-lg text-accent-purple">
                <span className="w-6 h-6 bg-accent-purple/10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium text-accent-purple">
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
        <div className="rounded-lg border border-accent-purple p-6 bg-accent-purple/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent-purple/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent-purple" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-accent-purple">AI Assessment</h3>
              {evaluatedAt && (
                <p className="text-sm text-accent-purple">
                  {new Date(evaluatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <p className="text-accent-purple whitespace-pre-wrap leading-relaxed">
            {analysis.overall_feedback}
          </p>
        </div>
      )}
    </>
  );
}
