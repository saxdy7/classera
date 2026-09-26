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
  { badge: 'bg-destructive', solid: 'bg-destructive border-destructive', ring: 'ring-[var(--cl-error)]', soft: 'hover:border-rose-300 hover:bg-rose-50' },
  { badge: 'bg-accent-purple', solid: 'bg-accent-purple border-accent-purple', ring: 'ring-[var(--cl-info)]', soft: 'hover:border-sky-300 hover:bg-sky-50' },
  { badge: 'bg-amber-500', solid: 'bg-amber-500 border-amber-500', ring: 'ring-[var(--cl-warning)]', soft: 'hover:border-amber-300 hover:bg-amber-50' },
  { badge: 'bg-green-600', solid: 'bg-green-600 border-green-600', ring: 'ring-[var(--cl-success)]', soft: 'hover:border-emerald-300 hover:bg-emerald-50' },
  { badge: 'bg-primary', solid: 'bg-primary border-accent-purple', ring: 'ring-ring', soft: 'hover:border-violet-300 hover:bg-violet-50' },
  { badge: 'bg-primary', solid: 'bg-primary border-accent-purple', ring: 'ring-ring', soft: 'hover:border-fuchsia-300 hover:bg-fuchsia-50' },
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
        let tile = `bg-card border-border text-foreground ${disabled ? '' : c.soft}`;
        let badge = `${c.badge} text-white`;
        if (isCorrect) {
          tile = 'bg-green-600 border-green-600 text-white';
          badge = 'bg-[rgba(255,255,255,0.25)] text-white';
        } else if (isWrong) {
          tile = 'bg-destructive border-destructive text-white';
          badge = 'bg-[rgba(255,255,255,0.25)] text-white';
        } else if (isSelected) {
          tile = `${c.solid} text-white ring-4 ${c.ring}`;
          badge = 'bg-[rgba(255,255,255,0.25)] text-white';
        }

        return (
          <button
            key={index}
            type="button"
            onClick={() => !disabled && onSelect?.(option)}
            disabled={disabled}
            className={`group relative flex items-center gap-4 p-4 md:p-5 rounded-xl border-2 text-left transition-all duration-150 ${tile} ${
              disabled && !showCorrect ? 'cursor-not-allowed opacity-70' : 'cursor-pointer active:scale-[0.99]'
            }`}
          >
            <span className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-base ${badge}`}>
              {LETTERS[index] ?? index + 1}
            </span>
            <span className="flex-1 font-semibold text-sm md:text-base leading-snug">{option}</span>
            {(isCorrect || isWrong || isSelected) && (
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgba(255,255,255,0.9)] flex items-center justify-center">
                {isWrong ? (
                  <X className="w-4 h-4 text-destructive" />
                ) : (
                  <Check className={`w-4 h-4 ${isCorrect ? 'text-green-600' : isSelected ? 'text-foreground/80' : 'text-foreground/80'}`} />
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
