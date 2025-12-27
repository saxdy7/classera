export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      universities: {
        Row: {
          id: string
          name: string
          domain: string
          country: string
          state: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          domain: string
          country?: string
          state?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          country?: string
          state?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'student' | 'mentor'
          university_id: string | null
          avatar_url: string | null
          phone: string | null
          bio: string | null
          degree_type: string | null
          graduation_year: number | null
          specialization_board: string | null
          current_semester: number | null
          expertise: string[] | null
          years_of_experience: number | null
          profile_verified: boolean
          linkedin_url: string | null
          github_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'student' | 'mentor'
          university_id?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          degree_type?: string | null
          graduation_year?: number | null
          specialization_board?: string | null
          current_semester?: number | null
          expertise?: string[] | null
          years_of_experience?: number | null
          profile_verified?: boolean
          linkedin_url?: string | null
          github_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'student' | 'mentor'
          university_id?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          degree_type?: string | null
          graduation_year?: number | null
          specialization_board?: string | null
          current_semester?: number | null
          expertise?: string[] | null
          years_of_experience?: number | null
          profile_verified?: boolean
          linkedin_url?: string | null
          github_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      communities: {
        Row: {
          id: string
          name: string
          description: string | null
          mentor_id: string | null
          university_id: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          mentor_id?: string | null
          university_id?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          mentor_id?: string | null
          university_id?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      community_members: {
        Row: {
          id: string
          community_id: string
          student_id: string
          status: 'pending' | 'approved' | 'rejected'
          joined_at: string
        }
        Insert: {
          id?: string
          community_id: string
          student_id: string
          status?: 'pending' | 'approved' | 'rejected'
          joined_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          student_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          joined_at?: string
        }
      }
      tests: {
        Row: {
          id: string
          title: string
          description: string | null
          mentor_id: string | null
          university_id: string | null
          community_id: string | null
          test_type: 'individual' | 'group'
          question_type: 'mcq' | 'coding' | 'mixed'
          duration_minutes: number
          total_marks: number
          scheduled_at: string | null
          is_live: boolean
          questions: Json
          enable_screen_recording: boolean
          enable_face_monitoring: boolean
          daily_room_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          mentor_id?: string | null
          university_id?: string | null
          community_id?: string | null
          test_type: 'individual' | 'group'
          question_type: 'mcq' | 'coding' | 'mixed'
          duration_minutes: number
          total_marks: number
          scheduled_at?: string | null
          is_live?: boolean
          questions: Json
          enable_screen_recording?: boolean
          enable_face_monitoring?: boolean
          daily_room_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          mentor_id?: string | null
          university_id?: string | null
          community_id?: string | null
          test_type?: 'individual' | 'group'
          question_type?: 'mcq' | 'coding' | 'mixed'
          duration_minutes?: number
          total_marks?: number
          scheduled_at?: string | null
          is_live?: boolean
          questions?: Json
          enable_screen_recording?: boolean
          enable_face_monitoring?: boolean
          daily_room_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      test_submissions: {
        Row: {
          id: string
          test_id: string
          student_id: string
          answers: Json
          score: number | null
          max_score: number | null
          percentage: number | null
          ai_analysis: Json | null
          ai_evaluated_at: string | null
          mentor_feedback: string | null
          mentor_evaluated_at: string | null
          screen_recording_url: string | null
          face_snapshots: string[] | null
          activity_log: Json | null
          started_at: string
          submitted_at: string | null
        }
        Insert: {
          id?: string
          test_id: string
          student_id: string
          answers: Json
          score?: number | null
          max_score?: number | null
          percentage?: number | null
          ai_analysis?: Json | null
          ai_evaluated_at?: string | null
          mentor_feedback?: string | null
          mentor_evaluated_at?: string | null
          screen_recording_url?: string | null
          face_snapshots?: string[] | null
          activity_log?: Json | null
          started_at?: string
          submitted_at?: string | null
        }
        Update: {
          id?: string
          test_id?: string
          student_id?: string
          answers?: Json
          score?: number | null
          max_score?: number | null
          percentage?: number | null
          ai_analysis?: Json | null
          ai_evaluated_at?: string | null
          mentor_feedback?: string | null
          mentor_evaluated_at?: string | null
          screen_recording_url?: string | null
          face_snapshots?: string[] | null
          activity_log?: Json | null
          started_at?: string
          submitted_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string | null
          community_id: string | null
          content: string
          message_type: 'text' | 'image' | 'file'
          attachment_url: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id?: string | null
          community_id?: string | null
          content: string
          message_type?: 'text' | 'image' | 'file'
          attachment_url?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string | null
          community_id?: string | null
          content?: string
          message_type?: 'text' | 'image' | 'file'
          attachment_url?: string | null
          read_at?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          student_id: string
          title: string
          description: string | null
          status: 'todo' | 'in_progress' | 'completed'
          priority: 'low' | 'medium' | 'high' | null
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          title: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'completed'
          priority?: 'low' | 'medium' | 'high' | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          title?: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'completed'
          priority?: 'low' | 'medium' | 'high' | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leaderboard: {
        Row: {
          id: string
          student_id: string
          university_id: string
          month: number
          year: number
          total_score: number
          tests_completed: number
          tasks_completed: number
          average_percentage: number
          rank: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          university_id: string
          month: number
          year: number
          total_score?: number
          tests_completed?: number
          tasks_completed?: number
          average_percentage?: number
          rank?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          university_id?: string
          month?: number
          year?: number
          total_score?: number
          tests_completed?: number
          tasks_completed?: number
          average_percentage?: number
          rank?: number | null
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          specialization: string | null
          difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
          youtube_playlist_id: string | null
          video_count: number | null
          total_duration_minutes: number | null
          thumbnail_url: string | null
          is_mentor_recommended: boolean
          recommended_by_mentor_id: string | null
          university_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          specialization?: string | null
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | null
          youtube_playlist_id?: string | null
          video_count?: number | null
          total_duration_minutes?: number | null
          thumbnail_url?: string | null
          is_mentor_recommended?: boolean
          recommended_by_mentor_id?: string | null
          university_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          specialization?: string | null
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | null
          youtube_playlist_id?: string | null
          video_count?: number | null
          total_duration_minutes?: number | null
          thumbnail_url?: string | null
          is_mentor_recommended?: boolean
          recommended_by_mentor_id?: string | null
          university_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      course_progress: {
        Row: {
          id: string
          student_id: string
          course_id: string
          videos_completed: number
          total_videos: number | null
          progress_percentage: number
          last_watched_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          videos_completed?: number
          total_videos?: number | null
          progress_percentage?: number
          last_watched_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          videos_completed?: number
          total_videos?: number | null
          progress_percentage?: number
          last_watched_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_leaderboard_ranks: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
