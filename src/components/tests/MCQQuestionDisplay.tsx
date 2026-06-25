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

// Wayground/Quizizz-style bold answer palette — one vivid colour per option slot
const PALETTE = [
  { badge: 'bg-rose-500', solid: 'bg-rose-500 border-rose-500', ring: 'ring-rose-200', soft: 'hover:border-rose-300 hover:bg-rose-50' },
  { badge: 'bg-sky-500', solid: 'bg-sky-500 border-sky-500', ring: 'ring-sky-200', soft: 'hover:border-sky-300 hover:bg-sky-50' },
  { badge: 'bg-amber-500', solid: 'bg-amber-500 border-amber-500', ring: 'ring-amber-200', soft: 'hover:border-amber-300 hover:bg-amber-50' },
  { badge: 'bg-emerald-500', solid: 'bg-emerald-500 border-emerald-500', ring: 'ring-emerald-200', soft: 'hover:border-emerald-300 hover:bg-emerald-50' },
  { badge: 'bg-violet-500', solid: 'bg-violet-500 border-violet-500', ring: 'ring-violet-200', soft: 'hover:border-violet-300 hover:bg-violet-50' },
  { badge: 'bg-fuchsia-500', solid: 'bg-fuchsia-500 border-fuchsia-500', ring: 'ring-fuchsia-200', soft: 'hover:border-fuchsia-300 hover:bg-fuchsia-50' },
];

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

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
    if (typeof correctAnswer === 'number') return options[correctAnswer];
    return correctAnswer;
  };
  const correctOption = showCorrect ? getCorrectOption() : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
      {options.map((option, index) => {
        const c = PALETTE[index % PALETTE.length];
        const isSelected = selectedAnswer === option;
        const isCorrect = showCorrect && option === correctOption;
        const isWrong = showCorrect && isSelected && !isCorrect;

        // Resolve visual state
        let tile = `bg-white border-slate-200 text-slate-800 ${disabled ? '' : c.soft}`;
        let badge = `${c.badge} text-white`;
        if (isCorrect) {
          tile = 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20';
          badge = 'bg-white/25 text-white';
        } else if (isWrong) {
          tile = 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20';
          badge = 'bg-white/25 text-white';
        } else if (isSelected) {
          tile = `${c.solid} text-white shadow-lg ring-4 ${c.ring}`;
          badge = 'bg-white/25 text-white';
        }

        return (
          <button
            key={index}
            type="button"
            onClick={() => !disabled && onSelect?.(option)}
            disabled={disabled}
            className={`group relative flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 text-left transition-all duration-150 ${tile} ${
              disabled && !showCorrect ? 'cursor-not-allowed opacity-70' : 'cursor-pointer active:scale-[0.99]'
            }`}
          >
            <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-base ${badge}`}>
              {LETTERS[index] ?? index + 1}
            </span>
            <span className="flex-1 font-semibold text-sm md:text-base leading-snug">{option}</span>
            {(isCorrect || isWrong || isSelected) && (
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
                {isWrong ? (
                  <X className="w-4 h-4 text-rose-600" />
                ) : (
                  <Check className={`w-4 h-4 ${isCorrect ? 'text-emerald-600' : isSelected ? 'text-slate-700' : 'text-slate-700'}`} />
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
