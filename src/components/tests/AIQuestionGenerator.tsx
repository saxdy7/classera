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
        className="w-full py-4 border-2 border-dashed border-accent-purple rounded-lg hover:border-accent-purple hover:bg-accent-purple/10 transition-all flex items-center justify-center gap-3 text-accent-purple font-medium"
      >
        <Sparkles className="w-6 h-6" />
        <span>Generate Questions with AI</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 text-white flex items-center justify-between bg-primary">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[rgba(255,255,255,0.2)] rounded-lg flex items-center justify-center">
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
                  <div className="flex gap-2 p-1 bg-muted rounded-lg">
                    <button
                      onClick={() => setActiveTab('topic')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                        activeTab === 'topic'
                          ? 'bg-card text-accent-purple'
                          : 'text-foreground/80 hover:text-foreground'
                      }`}
                    >
                      <Zap className="w-4 h-4 inline mr-2" />
                      Generate by Topic
                    </button>
                    <button
                      onClick={() => setActiveTab('content')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                        activeTab === 'content'
                          ? 'bg-card text-accent-purple'
                          : 'text-foreground/80 hover:text-foreground'
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
                        <label className="block text-sm font-medium text-foreground/80 mb-2">Topic *</label>
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g., Photosynthesis, World War II, Algebra"
                          className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
                        />
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">Subject (Optional)</label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g., Biology, History, Mathematics"
                          className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-2">
                        Paste Content (min. 100 characters)
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Paste your study material, textbook content, or notes here. The AI will generate questions based on this content..."
                        rows={8}
                        className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
                      />
                      <p className="text-sm text-muted-foreground mt-1">{content.length} characters</p>
                    </div>
                  )}

                  {/* Options Row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-2">Number of Questions</label>
                      <select
                        value={count}
                        onChange={(e) => setCount(parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
                      >
                        {[3, 5, 10, 15, 20].map(n => (
                          <option key={n} value={n}>{n} questions</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-2">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-2">Question Type</label>
                      <select
                        value={questionType}
                        onChange={(e) => setQuestionType(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
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
                    className="w-full py-4 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-primary"
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
                    <h3 className="font-semibold text-foreground">
                      Generated Questions ({generatedQuestions.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAll}
                        className="text-sm text-accent-purple hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-muted-foreground/70">|</span>
                      <button
                        onClick={deselectAll}
                        className="text-sm text-foreground/80 hover:underline"
                      >
                        Deselect All
                      </button>
                      <span className="text-muted-foreground/70">|</span>
                      <button
                        onClick={() => {
                          setGeneratedQuestions([]);
                          setSelectedQuestions(new Set());
                        }}
                        className="text-sm text-foreground/80 hover:underline flex items-center gap-1"
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
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedQuestions.has(q.id)
                          ? 'border-accent-purple bg-accent-purple/10'
                          : 'border-border hover:border-border'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedQuestions.has(q.id)
                            ? 'border-accent-purple bg-primary'
                            : 'border-border'
                        }`}>
                          {selectedQuestions.has(q.id) && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-foreground">Q{index + 1}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              q.type === 'mcq' ? 'bg-accent-purple/10 text-accent-purple' :
                              q.type === 'short_answer' ? 'bg-green-500/10 text-green-600' :
                              'bg-accent-purple/10 text-accent-purple'
                            }`}>
                              {q.type === 'mcq' ? 'MCQ' : q.type === 'short_answer' ? 'Short' : 'Descriptive'}
                            </span>
                            <span className="text-xs text-muted-foreground">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                            {q.difficulty && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                q.difficulty === 'easy' ? 'bg-green-500/10 text-green-600' :
                                q.difficulty === 'hard' ? 'bg-destructive/10 text-destructive' :
                                'bg-amber-500/10 text-amber-600'
                              }`}>
                                {q.difficulty}
                              </span>
                            )}
                          </div>
                          <p className="text-foreground mb-2">{q.question}</p>
                          {q.type === 'mcq' && q.options && (
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              {q.options.map((opt, i) => (
                                <div
                                  key={i}
                                  className={`text-sm px-3 py-1 rounded ${
                                    i === q.correctAnswer
                                      ? 'bg-green-500/10 text-green-600 font-medium'
                                      : 'bg-muted text-foreground/80'
                                  }`}
                                >
                                  {String.fromCharCode(65 + i)}. {opt}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.explanation && (
                            <p className="text-xs text-muted-foreground italic">💡 {q.explanation}</p>
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
              <div className="border-t border-border p-6 bg-muted/40 flex items-center justify-between">
                <p className="text-sm text-foreground/80">
                  {selectedQuestions.size} of {generatedQuestions.length} questions selected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setGeneratedQuestions([]);
                      setSelectedQuestions(new Set());
                    }}
                    className="px-6 py-2 text-foreground/80 font-medium hover:bg-muted rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={addSelectedQuestions}
                    disabled={selectedQuestions.size === 0}
                    className="px-6 py-2 text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 bg-primary"
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
