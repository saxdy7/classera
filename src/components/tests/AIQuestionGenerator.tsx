'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Plus, X, Check, RefreshCw, FileText, Zap } from 'lucide-react';

interface GeneratedQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'short_answer' | 'descriptive';
  options?: string[];
  correctAnswer?: number | string;
  marks: number;
  explanation?: string;
  difficulty?: string;
  topic?: string;
}

interface AIQuestionGeneratorProps {
  onAddQuestions: (questions: GeneratedQuestion[]) => void;
  testSubject?: string;
}

export function AIQuestionGenerator({ onAddQuestions, testSubject }: AIQuestionGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'topic' | 'content'>('topic');

  // Form state
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(testSubject || '');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionType, setQuestionType] = useState('mcq');
  const [content, setContent] = useState('');

  const generateFromTopic = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          subject,
          count,
          difficulty,
          questionType,
          includeExplanations: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      setGeneratedQuestions(data.questions);
      setSelectedQuestions(new Set(data.questions.map((q: GeneratedQuestion) => q.id)));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateFromContent = async () => {
    if (!content.trim() || content.length < 100) {
      alert('Please enter at least 100 characters of content');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          count,
          questionTypes: [questionType],
          difficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      setGeneratedQuestions(data.questions);
      setSelectedQuestions(new Set(data.questions.map((q: GeneratedQuestion) => q.id)));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (id: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedQuestions(newSelected);
  };

  const addSelectedQuestions = () => {
    const questionsToAdd = generatedQuestions.filter(q => selectedQuestions.has(q.id));
    onAddQuestions(questionsToAdd);
    setIsOpen(false);
    setGeneratedQuestions([]);
    setSelectedQuestions(new Set());
  };

  const selectAll = () => {
    setSelectedQuestions(new Set(generatedQuestions.map(q => q.id)));
  };

  const deselectAll = () => {
    setSelectedQuestions(new Set());
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-4 border-2 border-dashed border-[var(--cl-primary)] rounded-[var(--cl-r-lg)] hover:border-[var(--cl-primary)] hover:bg-[var(--cl-primary-soft)] transition-all flex items-center justify-center gap-3 text-[var(--cl-primary)] font-medium"
      >
        <Sparkles className="w-6 h-6" />
        <span>Generate Questions with AI</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 text-[var(--cl-on-dark)] flex items-center justify-between bg-[var(--cl-primary)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[rgba(255,255,255,0.2)] rounded-[var(--cl-r-lg)] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">AI Question Generator</h2>
                  <p className="text-[rgba(255,255,255,0.8)] text-sm">Generate test questions using AI</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-[rgba(255,255,255,0.1)] rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {generatedQuestions.length === 0 ? (
                <div className="space-y-6">
                  {/* Tabs */}
                  <div className="flex gap-2 p-1 bg-[var(--cl-surface-strong)] rounded-[var(--cl-r-lg)]">
                    <button
                      onClick={() => setActiveTab('topic')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                        activeTab === 'topic'
                          ? 'bg-[var(--cl-surface-card)] text-[var(--cl-primary)]'
                          : 'text-[var(--cl-body)] hover:text-[var(--cl-ink)]'
                      }`}
                    >
                      <Zap className="w-4 h-4 inline mr-2" />
                      Generate by Topic
                    </button>
                    <button
                      onClick={() => setActiveTab('content')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                        activeTab === 'content'
                          ? 'bg-[var(--cl-surface-card)] text-[var(--cl-primary)]'
                          : 'text-[var(--cl-body)] hover:text-[var(--cl-ink)]'
                      }`}
                    >
                      <FileText className="w-4 h-4 inline mr-2" />
                      From Content
                    </button>
                  </div>

                  {activeTab === 'topic' ? (
                    <>
                      {/* Topic Input */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--cl-body)] mb-2">Topic *</label>
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g., Photosynthesis, World War II, Algebra"
                          className="w-full px-4 py-3 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline-strong)] focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-[var(--cl-primary)]"
                        />
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--cl-body)] mb-2">Subject (Optional)</label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g., Biology, History, Mathematics"
                          className="w-full px-4 py-3 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline-strong)] focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-[var(--cl-primary)]"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-[var(--cl-body)] mb-2">
                        Paste Content (min. 100 characters)
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Paste your study material, textbook content, or notes here. The AI will generate questions based on this content..."
                        rows={8}
                        className="w-full px-4 py-3 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline-strong)] focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-[var(--cl-primary)]"
                      />
                      <p className="text-sm text-[var(--cl-muted)] mt-1">{content.length} characters</p>
                    </div>
                  )}

                  {/* Options Row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--cl-body)] mb-2">Number of Questions</label>
                      <select
                        value={count}
                        onChange={(e) => setCount(parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline-strong)] focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-[var(--cl-primary)]"
                      >
                        {[3, 5, 10, 15, 20].map(n => (
                          <option key={n} value={n}>{n} questions</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--cl-body)] mb-2">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full px-4 py-3 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline-strong)] focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-[var(--cl-primary)]"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--cl-body)] mb-2">Question Type</label>
                      <select
                        value={questionType}
                        onChange={(e) => setQuestionType(e.target.value)}
                        className="w-full px-4 py-3 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline-strong)] focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-[var(--cl-primary)]"
                      >
                        <option value="mcq">Multiple Choice</option>
                        <option value="short_answer">Short Answer</option>
                        <option value="descriptive">Descriptive</option>
                      </select>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={activeTab === 'topic' ? generateFromTopic : generateFromContent}
                    disabled={loading || (activeTab === 'topic' ? !topic.trim() : content.length < 100)}
                    className="w-full py-4 text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-[var(--cl-primary)]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Questions
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Generated Questions Preview */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[var(--cl-ink)]">
                      Generated Questions ({generatedQuestions.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAll}
                        className="text-sm text-[var(--cl-primary)] hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-[var(--cl-muted-soft)]">|</span>
                      <button
                        onClick={deselectAll}
                        className="text-sm text-[var(--cl-body)] hover:underline"
                      >
                        Deselect All
                      </button>
                      <span className="text-[var(--cl-muted-soft)]">|</span>
                      <button
                        onClick={() => {
                          setGeneratedQuestions([]);
                          setSelectedQuestions(new Set());
                        }}
                        className="text-sm text-[var(--cl-body)] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Regenerate
                      </button>
                    </div>
                  </div>

                  {generatedQuestions.map((q, index) => (
                    <div
                      key={q.id}
                      onClick={() => toggleQuestion(q.id)}
                      className={`p-4 rounded-[var(--cl-r-lg)] border-2 cursor-pointer transition-all ${
                        selectedQuestions.has(q.id)
                          ? 'border-[var(--cl-primary)] bg-[var(--cl-primary-soft)]'
                          : 'border-[var(--cl-hairline)] hover:border-[var(--cl-hairline-strong)]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedQuestions.has(q.id)
                            ? 'border-[var(--cl-primary)] bg-[var(--cl-primary)]'
                            : 'border-[var(--cl-hairline-strong)]'
                        }`}>
                          {selectedQuestions.has(q.id) && <Check className="w-4 h-4 text-[var(--cl-on-dark)]" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-[var(--cl-ink)]">Q{index + 1}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              q.type === 'mcq' ? 'bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)]' :
                              q.type === 'short_answer' ? 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]' :
                              'bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]'
                            }`}>
                              {q.type === 'mcq' ? 'MCQ' : q.type === 'short_answer' ? 'Short' : 'Descriptive'}
                            </span>
                            <span className="text-xs text-[var(--cl-muted)]">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                            {q.difficulty && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                q.difficulty === 'easy' ? 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]' :
                                q.difficulty === 'hard' ? 'bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)]' :
                                'bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)]'
                              }`}>
                                {q.difficulty}
                              </span>
                            )}
                          </div>
                          <p className="text-[var(--cl-ink)] mb-2">{q.question}</p>
                          {q.type === 'mcq' && q.options && (
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              {q.options.map((opt, i) => (
                                <div
                                  key={i}
                                  className={`text-sm px-3 py-1 rounded ${
                                    i === q.correctAnswer
                                      ? 'bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)] font-medium'
                                      : 'bg-[var(--cl-surface-strong)] text-[var(--cl-body)]'
                                  }`}
                                >
                                  {String.fromCharCode(65 + i)}. {opt}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.explanation && (
                            <p className="text-xs text-[var(--cl-muted)] italic">💡 {q.explanation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {generatedQuestions.length > 0 && (
              <div className="border-t border-[var(--cl-hairline)] p-6 bg-[var(--cl-canvas-soft)] flex items-center justify-between">
                <p className="text-sm text-[var(--cl-body)]">
                  {selectedQuestions.size} of {generatedQuestions.length} questions selected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setGeneratedQuestions([]);
                      setSelectedQuestions(new Set());
                    }}
                    className="px-6 py-2 text-[var(--cl-body)] font-medium hover:bg-[var(--cl-surface-strong)] rounded-[var(--cl-r-lg)] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={addSelectedQuestions}
                    disabled={selectedQuestions.size === 0}
                    className="px-6 py-2 text-[var(--cl-on-dark)] font-medium rounded-[var(--cl-r-lg)] transition-all disabled:opacity-50 flex items-center gap-2 bg-[var(--cl-primary)]"
                  >
                    <Plus className="w-4 h-4" />
                    Add {selectedQuestions.size} Question{selectedQuestions.size !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
