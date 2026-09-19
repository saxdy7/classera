'use client';

import { useState } from 'react';
import { X, Plus, Trash2, BarChart3 } from 'lucide-react';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  channelId?: string;
  onPollCreated: () => void;
}

export function CreatePollModal({
  isOpen,
  onClose,
  communityId,
  channelId,
  onPollCreated
}: CreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState<number>(24);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    setLoading(true);
    try {
      const expiresAt = duration ? new Date(Date.now() + duration * 60 * 60 * 1000).toISOString() : null;

      const res = await fetch('/api/community-polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          community_id: communityId,
          channel_id: channelId,
          question,
          options: validOptions,
          expires_at: expiresAt
        })
      });

      if (res.ok) {
        onPollCreated();
        handleClose();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create poll');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuestion('');
    setOptions(['', '']);
    setDuration(24);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--cl-surface-card)] border-b border-[var(--cl-hairline)] px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--cl-primary-soft)] rounded-[var(--cl-r-lg)] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[var(--cl-primary)]" />
            </div>
            <h2 className="text-2xl font-semibold text-[var(--cl-ink)]">Create Poll</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[var(--cl-surface-strong)] rounded-[var(--cl-r-lg)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-semibold text-[var(--cl-body)] mb-2">
              Poll Question *
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your community a question..."
              required
              maxLength={200}
              className="w-full px-4 py-3 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent"
            />
            <p className="text-xs text-[var(--cl-muted)] mt-1">
              {question.length}/200 characters
            </p>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-semibold text-[var(--cl-body)] mb-2">
              Poll Options *
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                    maxLength={100}
                    className="flex-1 px-4 py-3 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-3 hover:bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)] rounded-[var(--cl-r-lg)] transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 10 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-[var(--cl-primary)] hover:bg-[var(--cl-primary-soft)] rounded-[var(--cl-r-lg)] font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Option
              </button>
            )}
            <p className="text-xs text-[var(--cl-muted)] mt-2">
              You can add up to 10 options
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-[var(--cl-body)] mb-2">
              Poll Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent"
            >
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>1 day</option>
              <option value={72}>3 days</option>
              <option value={168}>1 week</option>
              <option value={0}>No expiration</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-[var(--cl-hairline)] text-[var(--cl-body)] rounded-[var(--cl-r-lg)] font-semibold hover:bg-[var(--cl-canvas-soft)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-semibold hover:bg-[var(--cl-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
