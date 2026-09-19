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
  { badge: 'bg-[var(--cl-error)]', solid: 'bg-[var(--cl-error)] border-[var(--cl-error)]', ring: 'ring-[var(--cl-error)]', soft: 'hover:border-rose-300 hover:bg-rose-50' },
  { badge: 'bg-[var(--cl-info)]', solid: 'bg-[var(--cl-info)] border-[var(--cl-info)]', ring: 'ring-[var(--cl-info)]', soft: 'hover:border-sky-300 hover:bg-sky-50' },
  { badge: 'bg-[var(--cl-warning)]', solid: 'bg-[var(--cl-warning)] border-[var(--cl-warning)]', ring: 'ring-[var(--cl-warning)]', soft: 'hover:border-amber-300 hover:bg-amber-50' },
  { badge: 'bg-[var(--cl-success)]', solid: 'bg-[var(--cl-success)] border-[var(--cl-success)]', ring: 'ring-[var(--cl-success)]', soft: 'hover:border-emerald-300 hover:bg-emerald-50' },
  { badge: 'bg-[var(--cl-primary)]', solid: 'bg-[var(--cl-primary)] border-[var(--cl-primary)]', ring: 'ring-[var(--cl-primary)]', soft: 'hover:border-violet-300 hover:bg-violet-50' },
  { badge: 'bg-[var(--cl-primary)]', solid: 'bg-[var(--cl-primary)] border-[var(--cl-primary)]', ring: 'ring-[var(--cl-primary)]', soft: 'hover:border-fuchsia-300 hover:bg-fuchsia-50' },
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
        let tile = `bg-[var(--cl-surface-card)] border-[var(--cl-hairline)] text-[var(--cl-ink)] ${disabled ? '' : c.soft}`;
        let badge = `${c.badge} text-[var(--cl-on-dark)]`;
        if (isCorrect) {
          tile = 'bg-[var(--cl-success)] border-[var(--cl-success)] text-[var(--cl-on-dark)]';
          badge = 'bg-[rgba(255,255,255,0.25)] text-[var(--cl-on-dark)]';
        } else if (isWrong) {
          tile = 'bg-[var(--cl-error)] border-[var(--cl-error)] text-[var(--cl-on-dark)]';
          badge = 'bg-[rgba(255,255,255,0.25)] text-[var(--cl-on-dark)]';
        } else if (isSelected) {
          tile = `${c.solid} text-[var(--cl-on-dark)] ring-4 ${c.ring}`;
          badge = 'bg-[rgba(255,255,255,0.25)] text-[var(--cl-on-dark)]';
        }

        return (
          <button
            key={index}
            type="button"
            onClick={() => !disabled && onSelect?.(option)}
            disabled={disabled}
            className={`group relative flex items-center gap-4 p-4 md:p-5 rounded-[var(--cl-r-xl)] border-2 text-left transition-all duration-150 ${tile} ${
              disabled && !showCorrect ? 'cursor-not-allowed opacity-70' : 'cursor-pointer active:scale-[0.99]'
            }`}
          >
            <span className={`flex-shrink-0 w-10 h-10 rounded-[var(--cl-r-lg)] flex items-center justify-center font-semibold text-base ${badge}`}>
              {LETTERS[index] ?? index + 1}
            </span>
            <span className="flex-1 font-semibold text-sm md:text-base leading-snug">{option}</span>
            {(isCorrect || isWrong || isSelected) && (
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgba(255,255,255,0.9)] flex items-center justify-center">
                {isWrong ? (
                  <X className="w-4 h-4 text-[var(--cl-error)]" />
                ) : (
                  <Check className={`w-4 h-4 ${isCorrect ? 'text-[var(--cl-success)]' : isSelected ? 'text-[var(--cl-body)]' : 'text-[var(--cl-body)]'}`} />
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
