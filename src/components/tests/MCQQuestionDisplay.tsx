'use client';

import { Check, X } from 'lucide-react';
import type { Question } from '@/lib/test-types';

interface MCQQuestionProps {
  question: Question;
  selectedAnswer?: string;
  onSelect?: (answer: string) => void;
  showCorrect?: boolean;
  disabled?: boolean;
}

export function MCQQuestion({
  question,
  selectedAnswer,
  onSelect,
  showCorrect = false,
  disabled = false,
}: MCQQuestionProps) {
  const options = question.options || [];
  const correctAnswer = question.correct_answer ?? question.correctAnswer;

  const getCorrectOption = () => {
    if (typeof correctAnswer === 'number') {
      return options[correctAnswer];
    }
    return correctAnswer;
  };

  const correctOption = showCorrect ? getCorrectOption() : null;

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const isSelected = selectedAnswer === option;
        const isCorrect = showCorrect && option === correctOption;
        const isWrong = showCorrect && isSelected && !isCorrect;

        return (
          <button
            key={index}
            onClick={() => !disabled && onSelect?.(option)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              isCorrect
                ? 'bg-green-50 border-green-400'
                : isWrong
                ? 'bg-red-50 border-red-400'
                : isSelected
                ? 'bg-blue-50 border-blue-400'
                : 'bg-white border-slate-200 hover:border-slate-300'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              {isCorrect ? (
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : isWrong ? (
                <X className="w-5 h-5 text-red-600 flex-shrink-0" />
              ) : (
                <div className={`w-5 h-5 rounded border-2 flex-shrink-0 ${
                  isSelected ? 'bg-blue-400 border-blue-400' : 'border-slate-300'
                }`} />
              )}
              <span className={`font-medium ${
                isCorrect ? 'text-green-700' : isWrong ? 'text-red-700' : 'text-slate-700'
              }`}>
                {option}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
