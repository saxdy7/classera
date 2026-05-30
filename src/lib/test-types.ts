// Shared types for test system

export type QuestionType = 'mcq' | 'short_answer' | 'descriptive';

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correct_answer?: string | number;
  correctAnswer?: string | number;
  marks: number;
  explanation?: string;
}

export interface Test {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  questions: Question[];
  is_live: boolean;
  mentor_id: string;
  university_id: string;
  scheduled_at?: string;
}

export interface StudentTestInvitation {
  id: string;
  test_id: string;
  student_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed';
  invited_at: string;
  test?: Test;
}

export interface TestSubmission {
  id: string;
  test_id: string;
  student_id: string;
  answers: Record<string, string>;
  score: number;
  max_score: number;
  percentage: number;
  submitted_at: string;
  ai_evaluated_at?: string;
  ai_analysis?: AIAnalysis;
  session_id?: string;
  warnings_count?: number;
  is_disqualified?: boolean;
}

export interface AIAnalysis {
  overall_score: number;
  max_score: number;
  percentage: number;
  grade: string;
  question_analysis: QuestionAnalysis[];
  strengths: string[];
  weaknesses: string[];
  study_recommendations: string[];
  overall_feedback: string;
}

export interface QuestionAnalysis {
  question_id: string;
  question_text: string;
  student_answer: string;
  correct_answer?: string;
  is_correct: boolean;
  earned_marks: number;
  feedback: string;
}

export interface TestSession {
  id: string;
  test_id: string;
  student_id: string;
  session_token: string;
  is_active: boolean;
  is_submitted: boolean;
  expires_at: string;
  total_violations: number;
  is_flagged: boolean;
}

export interface Violation {
  type: 'tab_switch' | 'fullscreen_exit' | 'copy_paste_attempt' | 'face_not_detected' | 'screen_share_stopped' | 'suspicious_activity';
  count: number;
  timestamp: string;
}
