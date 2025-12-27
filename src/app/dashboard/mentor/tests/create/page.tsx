'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Plus, Trash2, Save, Calendar, Clock, Users } from 'lucide-react';

type QuestionType = {
  id: string;
  type: 'mcq' | 'coding' | 'text';
  question: string;
  options?: string[];
  correct_answer?: string | number;
  marks: number;
};

export default function CreateTestPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    test_type: 'individual',
    question_type: 'mcq',
    duration_minutes: 60,
    total_marks: 100,
    scheduled_at: '',
    enable_screen_recording: true,
    enable_face_monitoring: true,
  });

  const [questions, setQuestions] = useState<QuestionType[]>([
    {
      id: '1',
      type: 'mcq',
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      marks: 10,
    }
  ]);

  const addQuestion = () => {
    const newQuestion: QuestionType = {
      id: Date.now().toString(),
      type: 'mcq',
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      marks: 10,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('users')
        .select('university_id')
        .eq('id', user.id)
        .single();

      const { error } = await supabase.from('tests').insert({
        ...testData,
        mentor_id: user.id,
        university_id: profile?.university_id,
        questions: questions,
        total_marks: questions.reduce((sum, q) => sum + q.marks, 0),
      });

      if (error) throw error;

      router.push('/dashboard/mentor/tests');
    } catch (error: any) {
      alert('Error creating test: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40">
      <div className="flex">
        <Sidebar role="mentor" />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Create New Test
              </h1>
              <p className="text-slate-600">Design an assessment for your students</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Test Title</label>
                    <input
                      type="text"
                      required
                      value={testData.title}
                      onChange={(e) => setTestData({...testData, title: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., Mid-term Data Structures Exam"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                    <textarea
                      value={testData.description}
                      onChange={(e) => setTestData({...testData, description: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                      placeholder="Brief description of the test..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Test Type</label>
                      <select
                        value={testData.test_type}
                        onChange={(e) => setTestData({...testData, test_type: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="individual">Individual</option>
                        <option value="group">Group</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Question Type</label>
                      <select
                        value={testData.question_type}
                        onChange={(e) => setTestData({...testData, question_type: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="mcq">Multiple Choice</option>
                        <option value="coding">Coding</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={testData.duration_minutes}
                        onChange={(e) => setTestData({...testData, duration_minutes: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Scheduled Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={testData.scheduled_at}
                        onChange={(e) => setTestData({...testData, scheduled_at: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={testData.enable_screen_recording}
                        onChange={(e) => setTestData({...testData, enable_screen_recording: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700">Enable Screen Recording</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={testData.enable_face_monitoring}
                        onChange={(e) => setTestData({...testData, enable_face_monitoring: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700">Enable Face Monitoring</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Questions</h2>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>

                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-slate-900">Question {index + 1}</h3>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(q.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Question Text</label>
                          <textarea
                            value={q.question}
                            onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                            rows={2}
                            placeholder="Enter your question..."
                            required
                          />
                        </div>

                        {q.type === 'mcq' && (
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Options</label>
                            {q.options?.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2 mb-2">
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={q.correct_answer === optIndex}
                                  onChange={() => updateQuestion(q.id, 'correct_answer', optIndex)}
                                  className="w-4 h-4"
                                />
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(q.options || [])];
                                    newOptions[optIndex] = e.target.value;
                                    updateQuestion(q.id, 'options', newOptions);
                                  }}
                                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                                  placeholder={`Option ${optIndex + 1}`}
                                  required
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="w-32">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Marks</label>
                          <input
                            type="number"
                            min="1"
                            value={q.marks}
                            onChange={(e) => updateQuestion(q.id, 'marks', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-indigo-50 rounded-xl">
                  <div className="text-sm text-slate-700">
                    <strong>Total Marks:</strong> {questions.reduce((sum, q) => sum + q.marks, 0)}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 transition-all"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Creating...' : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
