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
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-800">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {analysis.strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-green-700">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.weaknesses?.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-amber-800">Areas to Improve</h3>
            </div>
            <ul className="space-y-2">
              {analysis.weaknesses.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-amber-700">
                  <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Study Recommendations */}
      {analysis.study_recommendations?.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-blue-800">Recommended Study Plan</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.study_recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-white/60 rounded-lg text-blue-700">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium text-blue-600">
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
        <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 rounded-xl border border-fuchsia-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-fuchsia-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-fuchsia-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-fuchsia-800">AI Assessment</h3>
              {evaluatedAt && (
                <p className="text-sm text-fuchsia-600">
                  {new Date(evaluatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <p className="text-fuchsia-800 whitespace-pre-wrap leading-relaxed">
            {analysis.overall_feedback}
          </p>
        </div>
      )}
    </>
  );
}
