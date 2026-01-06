'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Copy,
  CheckCircle,
  Code,
  FileText,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Question {
  id: string;
  mentor_id: string;
  question_text: string;
  question_type: 'mcq' | 'coding' | 'short_answer' | 'long_answer';
  subject: string | null;
  topic: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  options: any;
  correct_answer: string | null;
  code_template: string | null;
  test_cases: any;
  marks: number;
  tags: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export default function QuestionBankManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    subject: '',
    difficulty: '',
    search: '',
  });

  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'mcq' as Question['question_type'],
    subject: '',
    topic: '',
    difficulty: 'medium' as Question['difficulty'],
    options: ['', '', '', ''],
    correct_answer: '0',
    code_template: '',
    test_cases: [],
    marks: 1,
    tags: [] as string[],
  });

  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/question-bank?${params}`);
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        options:
          formData.question_type === 'mcq'
            ? formData.options.filter((o) => o.trim())
            : null,
      };

      if (editingQuestion) {
        await fetch('/api/question-bank', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingQuestion.id, ...payload }),
        });
      } else {
        await fetch('/api/question-bank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setShowAddModal(false);
      setEditingQuestion(null);
      resetForm();
      fetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await fetch(`/api/question-bank?id=${id}`, { method: 'DELETE' });
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      question_type: question.question_type,
      subject: question.subject || '',
      topic: question.topic || '',
      difficulty: question.difficulty,
      options: question.options || ['', '', '', ''],
      correct_answer: question.correct_answer || '0',
      code_template: question.code_template || '',
      test_cases: question.test_cases || [],
      marks: question.marks,
      tags: question.tags || [],
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      question_text: '',
      question_type: 'mcq',
      subject: '',
      topic: '',
      difficulty: 'medium',
      options: ['', '', '', ''],
      correct_answer: '0',
      code_template: '',
      test_cases: [],
      marks: 1,
      tags: [],
    });
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'mcq':
        return <CheckCircle className="w-5 h-5" />;
      case 'coding':
        return <Code className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Question Bank
          </h1>
          <p className="text-gray-600 mt-2">
            Create and manage your test questions
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingQuestion(null);
            setShowAddModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Types</option>
            <option value="mcq">Multiple Choice</option>
            <option value="coding">Coding</option>
            <option value="short_answer">Short Answer</option>
            <option value="long_answer">Long Answer</option>
          </select>

          <select
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <input
            type="text"
            placeholder="Subject filter..."
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          />
        </div>
      </Card>

      {/* Questions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">No questions yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Create your first question to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <Card key={question.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-purple-600">
                      {getQuestionTypeIcon(question.question_type)}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(
                        question.difficulty
                      )}`}
                    >
                      {question.difficulty}
                    </span>
                    <span className="text-sm text-gray-600">
                      {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                    </span>
                    <span className="text-sm text-gray-500">
                      Used {question.usage_count} times
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {question.question_text}
                  </h3>

                  {question.subject && (
                    <p className="text-sm text-gray-600 mb-2">
                      Subject: {question.subject}
                      {question.topic && ` • Topic: ${question.topic}`}
                    </p>
                  )}

                  {question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {question.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(question)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(question.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed inset-x-0 top-10 z-50 mx-auto max-w-3xl px-4 max-h-screen overflow-y-auto">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Question Text</label>
                  <textarea
                    value={formData.question_text}
                    onChange={(e) =>
                      setFormData({ ...formData, question_text: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      value={formData.question_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          question_type: e.target.value as Question['question_type'],
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="coding">Coding</option>
                      <option value="short_answer">Short Answer</option>
                      <option value="long_answer">Long Answer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          difficulty: e.target.value as Question['difficulty'],
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Topic</label>
                    <input
                      type="text"
                      value={formData.topic}
                      onChange={(e) =>
                        setFormData({ ...formData, topic: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                {formData.question_type === 'mcq' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Options</label>
                    {formData.options.map((option, idx) => (
                      <div key={idx} className="flex items-center space-x-2 mb-2">
                        <input
                          type="radio"
                          name="correct"
                          checked={formData.correct_answer === idx.toString()}
                          onChange={() =>
                            setFormData({ ...formData, correct_answer: idx.toString() })
                          }
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...formData.options];
                            newOptions[idx] = e.target.value;
                            setFormData({ ...formData, options: newOptions });
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 px-4 py-2 border rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Marks</label>
                  <input
                    type="number"
                    value={formData.marks}
                    onChange={(e) =>
                      setFormData({ ...formData, marks: parseInt(e.target.value) })
                    }
                    min="1"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex space-x-3">
                  <Button type="submit" className="flex-1">
                    {editingQuestion ? 'Update' : 'Create'} Question
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
