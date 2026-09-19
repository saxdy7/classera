export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_history: {
        Row: {
          created_at: string
          data: Json
          id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_moderation_flags: {
        Row: {
          confidence: number | null
          created_at: string | null
          flag_type: string
          id: string
          message_id: string
          reviewed: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          flag_type: string
          id?: string
          message_id: string
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          flag_type?: string
          id?: string
          message_id?: string
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: []
      }
      ai_token_transactions: {
        Row: {
          ai_tool_id: string | null
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: number
          stripe_session_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          ai_tool_id?: string | null
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: number
          stripe_session_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          ai_tool_id?: string | null
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: number
          stripe_session_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_tool_tokens: {
        Row: {
          balance: number | null
          created_at: string | null
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analysis_snapshots: {
        Row: {
          active_days: number
          activity_score: number
          analyzed_at: string
          consistency_score: number
          id: string
          overall_score: number
          quality_score: number
          submission_id: string
          total_commits: number
        }
        Insert: {
          active_days?: number
          activity_score?: number
          analyzed_at?: string
          consistency_score?: number
          id?: string
          overall_score?: number
          quality_score?: number
          submission_id: string
          total_commits?: number
        }
        Update: {
          active_days?: number
          activity_score?: number
          analyzed_at?: string
          consistency_score?: number
          id?: string
          overall_score?: number
          quality_score?: number
          submission_id?: string
          total_commits?: number
        }
        Relationships: [
          {
            foreignKeyName: "analysis_snapshots_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_rubrics: {
        Row: {
          assignment_id: string
          created_at: string
          criteria: Json
          id: string
          mentor_id: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          criteria?: Json
          id?: string
          mentor_id: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          criteria?: Json
          id?: string
          mentor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_rubrics_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_rubrics_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_students: {
        Row: {
          assigned_at: string | null
          assignment_id: string
          id: string
          student_id: string
        }
        Insert: {
          assigned_at?: string | null
          assignment_id: string
          id?: string
          student_id: string
        }
        Update: {
          assigned_at?: string | null
          assignment_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_students_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          deploy_url: string | null
          file_name: string | null
          file_url: string | null
          id: string
          repo_full_name: string | null
          repo_name: string | null
          repo_owner: string | null
          repo_url: string | null
          status: string | null
          student_id: string
          submission_text: string | null
          submission_url: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          deploy_url?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          repo_full_name?: string | null
          repo_name?: string | null
          repo_owner?: string | null
          repo_url?: string | null
          status?: string | null
          student_id: string
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          deploy_url?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          repo_full_name?: string | null
          repo_name?: string | null
          repo_owner?: string | null
          repo_url?: string | null
          status?: string | null
          student_id?: string
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          start_time: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          start_time: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          start_time?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_activity: {
        Row: {
          action: string
          assignment_id: string
          created_at: string | null
          data: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          assignment_id: string
          created_at?: string | null
          data?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          assignment_id?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_activity_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_comments: {
        Row: {
          assignment_id: string
          content: string
          created_at: string | null
          id: string
          is_resolved: boolean | null
          line_number: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          content: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          line_number?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          line_number?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_comments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_invites: {
        Row: {
          assignment_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          invitee_email: string
          inviter_id: string
          role: string | null
          status: string | null
          token: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitee_email: string
          inviter_id: string
          role?: string | null
          status?: string | null
          token?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitee_email?: string
          inviter_id?: string
          role?: string | null
          status?: string | null
          token?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_invites_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_members: {
        Row: {
          assignment_id: string
          id: string
          joined_at: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_members_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_versions: {
        Row: {
          assignment_id: string
          char_count: number | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          updated_at: string | null
          user_id: string
          user_name: string | null
          word_count: number | null
        }
        Insert: {
          assignment_id: string
          char_count?: number | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          user_name?: string | null
          word_count?: number | null
        }
        Update: {
          assignment_id?: string
          char_count?: number | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          user_name?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_versions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_versions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          mentor_id: string
          messaging_enabled: boolean
          name: string
          university_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          mentor_id: string
          messaging_enabled?: boolean
          name: string
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          mentor_id?: string
          messaging_enabled?: boolean
          name?: string
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_channels: {
        Row: {
          community_id: string
          created_at: string | null
          description: string | null
          id: string
          is_locked: boolean
          name: string
          type: string | null
          updated_by: string | null
        }
        Insert: {
          community_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_locked?: boolean
          name: string
          type?: string | null
          updated_by?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_locked?: boolean
          name?: string
          type?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_channels_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          images: string[] | null
          is_best_answer: boolean | null
          is_deleted: boolean | null
          likes_count: number | null
          marked_as_best_at: string | null
          marked_as_best_by: string | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          images?: string[] | null
          is_best_answer?: boolean | null
          is_deleted?: boolean | null
          likes_count?: number | null
          marked_as_best_at?: string | null
          marked_as_best_by?: string | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          images?: string[] | null
          is_best_answer?: boolean | null
          is_deleted?: boolean | null
          likes_count?: number | null
          marked_as_best_at?: string | null
          marked_as_best_by?: string | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          is_muted: boolean | null
          joined_at: string
          muted_at: string | null
          status: string
          student_id: string
        }
        Insert: {
          community_id: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          muted_at?: string | null
          status?: string
          student_id: string
        }
        Update: {
          community_id?: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          muted_at?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_mentions: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          mentioned_by: string
          mentioned_user_id: string
          message_id: string | null
          post_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          mentioned_by: string
          mentioned_user_id: string
          message_id?: string | null
          post_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          mentioned_by?: string
          mentioned_user_id?: string
          message_id?: string | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_mentions_mentioned_by_fkey"
            columns: ["mentioned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean
          parent_message_id: string | null
          thread_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          parent_message_id?: string | null
          thread_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          parent_message_id?: string | null
          thread_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_moderation_logs: {
        Row: {
          action: string
          action_type: string | null
          community_id: string
          created_at: string | null
          id: string
          mentor_id: string
          metadata: Json | null
          reason: string | null
          related_object_id: string | null
          related_object_type: string | null
          target_message_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          action_type?: string | null
          community_id: string
          created_at?: string | null
          id?: string
          mentor_id: string
          metadata?: Json | null
          reason?: string | null
          related_object_id?: string | null
          related_object_type?: string | null
          target_message_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          action_type?: string | null
          community_id?: string
          created_at?: string | null
          id?: string
          mentor_id?: string
          metadata?: Json | null
          reason?: string | null
          related_object_id?: string | null
          related_object_type?: string | null
          target_message_id?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      community_muted_users: {
        Row: {
          community_id: string
          created_at: string | null
          id: string
          muted_by: string | null
          muted_until: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          id?: string
          muted_by?: string | null
          muted_until?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          id?: string
          muted_by?: string | null
          muted_until?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_polls: {
        Row: {
          anonymous: boolean | null
          channel_id: string | null
          community_id: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          multiple_choice: boolean | null
          options: Json
          question: string
          updated_at: string | null
        }
        Insert: {
          anonymous?: boolean | null
          channel_id?: string | null
          community_id: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          multiple_choice?: boolean | null
          options: Json
          question: string
          updated_at?: string | null
        }
        Update: {
          anonymous?: boolean | null
          channel_id?: string | null
          community_id?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          multiple_choice?: boolean | null
          options?: Json
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      community_post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_reports: {
        Row: {
          comment_id: string | null
          created_at: string | null
          description: string | null
          id: string
          post_id: string | null
          reason: string
          reported_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          post_id?: string | null
          reason: string
          reported_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          post_id?: string | null
          reason?: string
          reported_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_post_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_views: {
        Row: {
          id: string
          post_id: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          post_id: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          best_answer_id: string | null
          comments_count: number | null
          community_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          files: Json | null
          id: string
          images: string[] | null
          is_answered: boolean | null
          is_deleted: boolean | null
          is_locked: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          locked_at: string | null
          locked_by: string | null
          metadata: Json | null
          pinned_at: string | null
          pinned_by: string | null
          tags: string[] | null
          title: string | null
          type: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_id: string
          best_answer_id?: string | null
          comments_count?: number | null
          community_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          files?: Json | null
          id?: string
          images?: string[] | null
          is_answered?: boolean | null
          is_deleted?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          pinned_at?: string | null
          pinned_by?: string | null
          tags?: string[] | null
          title?: string | null
          type: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string
          best_answer_id?: string | null
          comments_count?: number | null
          community_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          files?: Json | null
          id?: string
          images?: string[] | null
          is_answered?: boolean | null
          is_deleted?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          pinned_at?: string | null
          pinned_by?: string | null
          tags?: string[] | null
          title?: string | null
          type?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_saved_posts: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          created_at: string | null
          id: string
          mentor_id: string
          message: string | null
          status: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentor_id: string
          message?: string | null
          status?: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mentor_id?: string
          message?: string | null
          status?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          title: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          title?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          title?: string | null
          type?: string
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          current_lesson_id: string | null
          enrolled_at: string | null
          id: string
          progress: number | null
          progress_percentage: number | null
          student_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          current_lesson_id?: string | null
          enrolled_at?: string | null
          id?: string
          progress?: number | null
          progress_percentage?: number | null
          student_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          current_lesson_id?: string | null
          enrolled_at?: string | null
          id?: string
          progress?: number | null
          progress_percentage?: number | null
          student_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_current_lesson_id_fkey"
            columns: ["current_lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_favorites: {
        Row: {
          course_id: string | null
          created_at: string | null
          external_course_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          external_course_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          external_course_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_favorites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "mentor_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          module_id: string
          order_index: number
          resources: Json | null
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          module_id: string
          order_index: number
          resources?: Json | null
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          module_id?: string
          order_index?: number
          resources?: Json | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          order_index: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          last_watched_at: string | null
          progress_percentage: number | null
          student_id: string | null
          total_videos: number | null
          updated_at: string | null
          videos_completed: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          last_watched_at?: string | null
          progress_percentage?: number | null
          student_id?: string | null
          total_videos?: number | null
          updated_at?: string | null
          videos_completed?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          last_watched_at?: string | null
          progress_percentage?: number | null
          student_id?: string | null
          total_videos?: number | null
          updated_at?: string | null
          videos_completed?: number | null
        }
        Relationships: []
      }
      course_reviews: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          rating: number
          review_text: string | null
          user_id: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          rating: number
          review_text?: string | null
          user_id?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          review_text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "mentor_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: string | null
          estimated_hours: number | null
          id: string
          instructor_id: string | null
          is_published: boolean | null
          thumbnail_url: string | null
          title: string
          university_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          thumbnail_url?: string | null
          title: string
          university_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          thumbnail_url?: string | null
          title?: string
          university_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      credentials: {
        Row: {
          badge_url: string | null
          certificate_url: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_public: boolean | null
          issued_at: string | null
          issued_by: string
          issuer_id: string | null
          proof_id: string | null
          proof_type: string | null
          skills_verified: string[] | null
          title: string
          user_id: string
          verification_code: string | null
        }
        Insert: {
          badge_url?: string | null
          certificate_url?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          issued_at?: string | null
          issued_by: string
          issuer_id?: string | null
          proof_id?: string | null
          proof_type?: string | null
          skills_verified?: string[] | null
          title: string
          user_id: string
          verification_code?: string | null
        }
        Update: {
          badge_url?: string | null
          certificate_url?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          issued_at?: string | null
          issued_by?: string
          issuer_id?: string | null
          proof_id?: string | null
          proof_type?: string | null
          skills_verified?: string[] | null
          title?: string
          user_id?: string
          verification_code?: string | null
        }
        Relationships: []
      }
      github_connections: {
        Row: {
          access_token: string
          connected_at: string | null
          followers: number | null
          following: number | null
          github_avatar_url: string | null
          github_name: string | null
          github_profile_url: string | null
          github_user_id: number | null
          github_username: string
          id: string
          public_repos: number | null
          token_scope: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string | null
          followers?: number | null
          following?: number | null
          github_avatar_url?: string | null
          github_name?: string | null
          github_profile_url?: string | null
          github_user_id?: number | null
          github_username: string
          id?: string
          public_repos?: number | null
          token_scope?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string | null
          followers?: number | null
          following?: number | null
          github_avatar_url?: string | null
          github_name?: string | null
          github_profile_url?: string | null
          github_user_id?: number | null
          github_username?: string
          id?: string
          public_repos?: number | null
          token_scope?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guides: {
        Row: {
          author_id: string | null
          category: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string | null
          difficulty: string | null
          excerpt: string | null
          id: string
          is_published: boolean | null
          likes: number | null
          linked_skills: string[] | null
          reading_time_minutes: number | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          difficulty?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          likes?: number | null
          linked_skills?: string[] | null
          reading_time_minutes?: number | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          difficulty?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          likes?: number | null
          linked_skills?: string[] | null
          reading_time_minutes?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      hub_external_resources: {
        Row: {
          certificate_offered: boolean | null
          content: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          difficulty: string | null
          duration: string | null
          enrolled_count: string | null
          id: string
          image_url: string | null
          last_updated_at: string | null
          location: string | null
          metadata: Json | null
          price: string | null
          prize_pool: string | null
          rating: string | null
          source: string | null
          start_date: string | null
          team_size: string | null
          title: string
          type: string
          url: string
        }
        Insert: {
          certificate_offered?: boolean | null
          content?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: string | null
          enrolled_count?: string | null
          id?: string
          image_url?: string | null
          last_updated_at?: string | null
          location?: string | null
          metadata?: Json | null
          price?: string | null
          prize_pool?: string | null
          rating?: string | null
          source?: string | null
          start_date?: string | null
          team_size?: string | null
          title: string
          type: string
          url: string
        }
        Update: {
          certificate_offered?: boolean | null
          content?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: string | null
          enrolled_count?: string | null
          id?: string
          image_url?: string | null
          last_updated_at?: string | null
          location?: string | null
          metadata?: Json | null
          price?: string | null
          prize_pool?: string | null
          rating?: string | null
          source?: string | null
          start_date?: string | null
          team_size?: string | null
          title?: string
          type?: string
          url?: string
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          average_percentage: number | null
          id: string
          month: number
          rank: number | null
          student_id: string | null
          tasks_completed: number | null
          tests_completed: number | null
          total_score: number | null
          university_id: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          average_percentage?: number | null
          id?: string
          month: number
          rank?: number | null
          student_id?: string | null
          tasks_completed?: number | null
          tests_completed?: number | null
          total_score?: number | null
          university_id?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          average_percentage?: number | null
          id?: string
          month?: number
          rank?: number | null
          student_id?: string | null
          tasks_completed?: number | null
          tests_completed?: number | null
          total_score?: number | null
          university_id?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          category: string | null
          id: string
          period: string | null
          points: number | null
          rank: number | null
          university_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          id?: string
          period?: string | null
          points?: number | null
          rank?: number | null
          university_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          id?: string
          period?: string | null
          points?: number | null
          rank?: number | null
          university_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_plans: {
        Row: {
          actual_end_date: string | null
          ai_generated: boolean | null
          ai_prompt: string | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          current_node_id: string | null
          daily_time_minutes: number | null
          id: string
          notes: string | null
          roadmap_id: string
          start_date: string
          status: string
          target_end_date: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_end_date?: string | null
          ai_generated?: boolean | null
          ai_prompt?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_node_id?: string | null
          daily_time_minutes?: number | null
          id?: string
          notes?: string | null
          roadmap_id: string
          start_date?: string
          status?: string
          target_end_date?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_end_date?: string | null
          ai_generated?: boolean | null
          ai_prompt?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_node_id?: string | null
          daily_time_minutes?: number | null
          id?: string
          notes?: string | null
          roadmap_id?: string
          start_date?: string
          status?: string
          target_end_date?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_plans_current_node_id_fkey"
            columns: ["current_node_id"]
            isOneToOne: false
            referencedRelation: "roadmap_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_plans_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_completions: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          student_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          student_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_completions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          lesson_id: string
          time_spent_minutes: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          time_spent_minutes?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          time_spent_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          created_at: string | null
          created_by: string | null
          daily_room_name: string | null
          daily_room_url: string | null
          description: string | null
          duration_minutes: number | null
          ended_at: string | null
          google_meet_id: string | null
          google_meet_url: string | null
          host_id: string | null
          id: string
          max_participants: number | null
          meeting_url: string | null
          mentor_id: string
          scheduled_at: string
          session_type: string | null
          settings: Json | null
          started_at: string | null
          status: string | null
          target_student_id: string | null
          test_id: string | null
          title: string
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          daily_room_name?: string | null
          daily_room_url?: string | null
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          google_meet_id?: string | null
          google_meet_url?: string | null
          host_id?: string | null
          id?: string
          max_participants?: number | null
          meeting_url?: string | null
          mentor_id: string
          scheduled_at: string
          session_type?: string | null
          settings?: Json | null
          started_at?: string | null
          status?: string | null
          target_student_id?: string | null
          test_id?: string | null
          title: string
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          daily_room_name?: string | null
          daily_room_url?: string | null
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          google_meet_id?: string | null
          google_meet_url?: string | null
          host_id?: string | null
          id?: string
          max_participants?: number | null
          meeting_url?: string | null
          mentor_id?: string
          scheduled_at?: string
          session_type?: string | null
          settings?: Json | null
          started_at?: string | null
          status?: string | null
          target_student_id?: string | null
          test_id?: string | null
          title?: string
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_target_student_id_fkey"
            columns: ["target_student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_courses: {
        Row: {
          course_type: string
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_hours: number | null
          enrolled_count: number | null
          id: string
          instructor_id: string | null
          is_published: boolean | null
          level: string
          mentor_id: string | null
          price: number | null
          skills: string[] | null
          thumbnail_url: string | null
          title: string
          total_lessons: number | null
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          course_type?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          enrolled_count?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          level?: string
          mentor_id?: string | null
          price?: number | null
          skills?: string[] | null
          thumbnail_url?: string | null
          title: string
          total_lessons?: number | null
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          course_type?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          enrolled_count?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          level?: string
          mentor_id?: string | null
          price?: number | null
          skills?: string[] | null
          thumbnail_url?: string | null
          title?: string
          total_lessons?: number | null
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mentor_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string | null
          employee_id: string
          full_name: string
          id: string
          profile_photo_url: string | null
          specialization: string
          university: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          employee_id: string
          full_name: string
          id?: string
          profile_photo_url?: string | null
          specialization: string
          university: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          employee_id?: string
          full_name?: string
          id?: string
          profile_photo_url?: string | null
          specialization?: string
          university?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          message_id: string | null
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          message_id?: string | null
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string | null
          uploaded_at?: string | null
        }
        Relationships: []
      }
      message_edit_history: {
        Row: {
          edited_at: string | null
          id: string
          message_id: string | null
          old_content: string
        }
        Insert: {
          edited_at?: string | null
          id?: string
          message_id?: string | null
          old_content: string
        }
        Update: {
          edited_at?: string | null
          id?: string
          message_id?: string | null
          old_content?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: []
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string | null
          read_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          message_id?: string | null
          read_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          message_id?: string | null
          read_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          read_by: string[] | null
          receiver_id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_by?: string[] | null
          receiver_id: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_by?: string[] | null
          receiver_id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          community_id: string | null
          id: string
          mute_notifications: boolean | null
          notification_type: string | null
          user_id: string | null
        }
        Insert: {
          community_id?: string | null
          id?: string
          mute_notifications?: boolean | null
          notification_type?: string | null
          user_id?: string | null
        }
        Update: {
          community_id?: string | null
          id?: string
          mute_notifications?: boolean | null
          notification_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_object_id: string | null
          action_object_type: string | null
          action_url: string | null
          actor_id: string | null
          actor_name: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string | null
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_object_id?: string | null
          action_object_type?: string | null
          action_url?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type?: string | null
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_object_id?: string | null
          action_object_type?: string | null
          action_url?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_sessions: {
        Row: {
          created_at: string | null
          created_by: string
          google_meet_id: string
          google_meet_url: string
          id: string
          status: string | null
          target_student_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          google_meet_id: string
          google_meet_url: string
          id?: string
          status?: string | null
          target_student_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          google_meet_id?: string
          google_meet_url?: string
          id?: string
          status?: string | null
          target_student_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peer_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_sessions_target_student_id_fkey"
            columns: ["target_student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_messages: {
        Row: {
          community_id: string | null
          id: string
          message_id: string | null
          pinned_at: string | null
          pinned_by: string | null
        }
        Insert: {
          community_id?: string | null
          id?: string
          message_id?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
        }
        Update: {
          community_id?: string | null
          id?: string
          message_id?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
        }
        Relationships: []
      }
      plan_tasks: {
        Row: {
          actual_minutes: number | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          node_id: string | null
          notes: string | null
          plan_id: string
          priority: string | null
          scheduled_date: string
          status: string
          task_type: string
          title: string
        }
        Insert: {
          actual_minutes?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          node_id?: string | null
          notes?: string | null
          plan_id: string
          priority?: string | null
          scheduled_date: string
          status?: string
          task_type: string
          title: string
        }
        Update: {
          actual_minutes?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          node_id?: string | null
          notes?: string | null
          plan_id?: string
          priority?: string | null
          scheduled_date?: string
          status?: string
          task_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_tasks_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "roadmap_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "learning_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      proctoring_alerts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_resolved: boolean | null
          metadata: Json | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          screenshot_url: string | null
          session_id: string
          severity: string
          title: string
          triggered_at: string | null
          type: string
          video_timestamp: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_resolved?: boolean | null
          metadata?: Json | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_url?: string | null
          session_id: string
          severity: string
          title: string
          triggered_at?: string | null
          type: string
          video_timestamp?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_resolved?: boolean | null
          metadata?: Json | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_url?: string | null
          session_id?: string
          severity?: string
          title?: string
          triggered_at?: string | null
          type?: string
          video_timestamp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proctoring_alerts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "test_proctoring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      proctoring_logs: {
        Row: {
          details: Json | null
          id: string
          student_id: string
          test_id: string
          timestamp: string | null
          violation_type: string
        }
        Insert: {
          details?: Json | null
          id?: string
          student_id: string
          test_id: string
          timestamp?: string | null
          violation_type: string
        }
        Update: {
          details?: Json | null
          id?: string
          student_id?: string
          test_id?: string
          timestamp?: string | null
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "proctoring_logs_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      proctoring_sessions: {
        Row: {
          ended_at: string | null
          id: string
          started_at: string | null
          status: string | null
          student_id: string
          test_id: string
          violations: Json | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          student_id: string
          test_id: string
          violations?: Json | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          student_id?: string
          test_id?: string
          violations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "proctoring_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proctoring_sessions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          expertise: string | null
          field_of_study: string | null
          full_name: string
          id: string
          role: string
          university: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          expertise?: string | null
          field_of_study?: string | null
          full_name: string
          id?: string
          role: string
          university: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          expertise?: string | null
          field_of_study?: string | null
          full_name?: string
          id?: string
          role?: string
          university?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_assignments: {
        Row: {
          created_at: string | null
          deadline: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_score: number | null
          mentor_id: string
          requirements: string | null
          submission_type: string
          technologies: string[] | null
          title: string
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_score?: number | null
          mentor_id: string
          requirements?: string | null
          submission_type?: string
          technologies?: string[] | null
          title: string
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_score?: number | null
          mentor_id?: string
          requirements?: string | null
          submission_type?: string
          technologies?: string[] | null
          title?: string
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      project_evaluations: {
        Row: {
          assignment_id: string
          comments: Json | null
          evaluated_at: string | null
          featured_on_portfolio: boolean | null
          feedback: string | null
          id: string
          mentor_id: string
          score: number | null
          student_id: string
          submission_id: string
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          comments?: Json | null
          evaluated_at?: string | null
          featured_on_portfolio?: boolean | null
          feedback?: string | null
          id?: string
          mentor_id: string
          score?: number | null
          student_id: string
          submission_id: string
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          comments?: Json | null
          evaluated_at?: string | null
          featured_on_portfolio?: boolean | null
          feedback?: string | null
          id?: string
          mentor_id?: string
          score?: number | null
          student_id?: string
          submission_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_evaluations_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_evaluations_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_evaluations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_evaluations_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank: {
        Row: {
          code_template: string | null
          correct_answer: string | null
          created_at: string | null
          difficulty: string | null
          id: string
          marks: number | null
          mentor_id: string
          options: Json | null
          question_text: string
          question_type: string
          subject: string | null
          tags: string[] | null
          test_cases: Json | null
          topic: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          code_template?: string | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          marks?: number | null
          mentor_id: string
          options?: Json | null
          question_text: string
          question_type: string
          subject?: string | null
          tags?: string[] | null
          test_cases?: Json | null
          topic?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          code_template?: string | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          marks?: number | null
          mentor_id?: string
          options?: Json | null
          question_text?: string
          question_type?: string
          subject?: string | null
          tags?: string[] | null
          test_cases?: Json | null
          topic?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      repo_analytics: {
        Row: {
          active_days: number | null
          activity_score: number | null
          ai_file_reviews: Json | null
          ai_review: Json | null
          analyzed_at: string | null
          commit_frequency: Json | null
          complexity_level: string | null
          consistency_score: number | null
          contributors: Json | null
          daily_activity: Json | null
          file_tree: Json | null
          folder_depth: number | null
          forks: number | null
          has_readme: boolean | null
          has_tests: boolean | null
          id: string
          is_stale: boolean | null
          languages: Json | null
          last_commit_at: string | null
          last_push_at: string | null
          open_issues: number | null
          overall_score: number | null
          quality_score: number | null
          repo_created_at: string | null
          repo_full_name: string
          repo_size_kb: number | null
          similarity_flags: Json | null
          stars: number | null
          student_id: string | null
          submission_id: string | null
          suspicious_flags: Json | null
          timeline_events: Json | null
          total_branches: number | null
          total_commits: number | null
          total_files: number | null
          total_lines: number | null
          weekly_activity: Json | null
        }
        Insert: {
          active_days?: number | null
          activity_score?: number | null
          ai_file_reviews?: Json | null
          ai_review?: Json | null
          analyzed_at?: string | null
          commit_frequency?: Json | null
          complexity_level?: string | null
          consistency_score?: number | null
          contributors?: Json | null
          daily_activity?: Json | null
          file_tree?: Json | null
          folder_depth?: number | null
          forks?: number | null
          has_readme?: boolean | null
          has_tests?: boolean | null
          id?: string
          is_stale?: boolean | null
          languages?: Json | null
          last_commit_at?: string | null
          last_push_at?: string | null
          open_issues?: number | null
          overall_score?: number | null
          quality_score?: number | null
          repo_created_at?: string | null
          repo_full_name: string
          repo_size_kb?: number | null
          similarity_flags?: Json | null
          stars?: number | null
          student_id?: string | null
          submission_id?: string | null
          suspicious_flags?: Json | null
          timeline_events?: Json | null
          total_branches?: number | null
          total_commits?: number | null
          total_files?: number | null
          total_lines?: number | null
          weekly_activity?: Json | null
        }
        Update: {
          active_days?: number | null
          activity_score?: number | null
          ai_file_reviews?: Json | null
          ai_review?: Json | null
          analyzed_at?: string | null
          commit_frequency?: Json | null
          complexity_level?: string | null
          consistency_score?: number | null
          contributors?: Json | null
          daily_activity?: Json | null
          file_tree?: Json | null
          folder_depth?: number | null
          forks?: number | null
          has_readme?: boolean | null
          has_tests?: boolean | null
          id?: string
          is_stale?: boolean | null
          languages?: Json | null
          last_commit_at?: string | null
          last_push_at?: string | null
          open_issues?: number | null
          overall_score?: number | null
          quality_score?: number | null
          repo_created_at?: string | null
          repo_full_name?: string
          repo_size_kb?: number | null
          similarity_flags?: Json | null
          stars?: number | null
          student_id?: string | null
          submission_id?: string | null
          suspicious_flags?: Json | null
          timeline_events?: Json | null
          total_branches?: number | null
          total_commits?: number | null
          total_files?: number | null
          total_lines?: number | null
          weekly_activity?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "repo_analytics_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repo_analytics_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_contributions: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          roadmap_id: string
          status: string
          suggestion_data: Json
          suggestion_type: string
          user_id: string
          votes: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roadmap_id: string
          status?: string
          suggestion_data: Json
          suggestion_type: string
          user_id: string
          votes?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roadmap_id?: string
          status?: string
          suggestion_data?: Json
          suggestion_type?: string
          user_id?: string
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_contributions_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_nodes: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          icon: string | null
          id: string
          is_optional: boolean | null
          node_type: string
          order_index: number
          position_x: number | null
          position_y: number | null
          prerequisite_nodes: string[] | null
          resources: Json | null
          roadmap_id: string
          skills_unlocked: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          icon?: string | null
          id?: string
          is_optional?: boolean | null
          node_type: string
          order_index: number
          position_x?: number | null
          position_y?: number | null
          prerequisite_nodes?: string[] | null
          resources?: Json | null
          roadmap_id: string
          skills_unlocked?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          icon?: string | null
          id?: string
          is_optional?: boolean | null
          node_type?: string
          order_index?: number
          position_x?: number | null
          position_y?: number | null
          prerequisite_nodes?: string[] | null
          resources?: Json | null
          roadmap_id?: string
          skills_unlocked?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_nodes_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          node_id: string
          notes: string | null
          rating: number | null
          roadmap_id: string
          started_at: string | null
          status: string
          time_spent_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          node_id: string
          notes?: string | null
          rating?: number | null
          roadmap_id: string
          started_at?: string | null
          status?: string
          time_spent_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          node_id?: string
          notes?: string | null
          rating?: number | null
          roadmap_id?: string
          started_at?: string | null
          status?: string
          time_spent_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_progress_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "roadmap_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_progress_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          review: string | null
          roadmap_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          review?: string | null
          roadmap_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          review?: string | null
          roadmap_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_ratings_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          average_rating: number | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string
          creator_id: string | null
          description: string | null
          difficulty: string
          estimated_weeks: number | null
          icon_url: string | null
          id: string
          is_ai_generated: boolean | null
          is_premium: boolean | null
          is_published: boolean | null
          slug: string
          status: string | null
          steps: Json | null
          tags: string[] | null
          title: string
          total_enrollments: number | null
          total_nodes: number | null
          type: string
          university_id: string | null
          updated_at: string | null
          user_id: string | null
          views: number | null
        }
        Insert: {
          average_rating?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by: string
          creator_id?: string | null
          description?: string | null
          difficulty: string
          estimated_weeks?: number | null
          icon_url?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_premium?: boolean | null
          is_published?: boolean | null
          slug: string
          status?: string | null
          steps?: Json | null
          tags?: string[] | null
          title: string
          total_enrollments?: number | null
          total_nodes?: number | null
          type: string
          university_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          views?: number | null
        }
        Update: {
          average_rating?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string
          creator_id?: string | null
          description?: string | null
          difficulty?: string
          estimated_weeks?: number | null
          icon_url?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_premium?: boolean | null
          is_published?: boolean | null
          slug?: string
          status?: string | null
          steps?: Json | null
          tags?: string[] | null
          title?: string
          total_enrollments?: number | null
          total_nodes?: number | null
          type?: string
          university_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          views?: number | null
        }
        Relationships: []
      }
      rubric_scores: {
        Row: {
          comment: string | null
          criterion_id: string
          id: string
          rubric_id: string
          score: number
          scored_at: string
          submission_id: string
        }
        Insert: {
          comment?: string | null
          criterion_id: string
          id?: string
          rubric_id: string
          score?: number
          scored_at?: string
          submission_id: string
        }
        Update: {
          comment?: string | null
          criterion_id?: string
          id?: string
          rubric_id?: string
          score?: number
          scored_at?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubric_scores_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "assignment_rubrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubric_scores_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_messages: {
        Row: {
          answered_by: string | null
          created_at: string | null
          id: string
          is_answered: boolean | null
          is_question: boolean | null
          message: string
          message_type: string | null
          sender_id: string
          session_id: string
        }
        Insert: {
          answered_by?: string | null
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          is_question?: boolean | null
          message: string
          message_type?: string | null
          sender_id: string
          session_id: string
        }
        Update: {
          answered_by?: string | null
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          is_question?: boolean | null
          message?: string
          message_type?: string | null
          sender_id?: string
          session_id?: string
        }
        Relationships: []
      }
      session_participants: {
        Row: {
          id: string
          joined_at: string | null
          role: string | null
          session_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role?: string | null
          session_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          role?: string | null
          session_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      session_recordings: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          recording_url: string
          session_id: string
          status: string | null
          transcription: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          recording_url: string
          session_id: string
          status?: string | null
          transcription?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          recording_url?: string
          session_id?: string
          status?: string | null
          transcription?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          color: string | null
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          icon_url: string | null
          id: string
          name: string
          parent_skill_id: string | null
          related_skills: string[] | null
          slug: string
          total_users: number | null
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          icon_url?: string | null
          id?: string
          name: string
          parent_skill_id?: string | null
          related_skills?: string[] | null
          slug: string
          total_users?: number | null
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          icon_url?: string | null
          id?: string
          name?: string
          parent_skill_id?: string | null
          related_skills?: string[] | null
          slug?: string
          total_users?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_parent_skill_id_fkey"
            columns: ["parent_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          academic_year: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          profile_photo_url: string | null
          student_id: string
          university: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          academic_year?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          profile_photo_url?: string | null
          student_id: string
          university: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          academic_year?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          profile_photo_url?: string | null
          student_id?: string
          university?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suspicious_activities: {
        Row: {
          activity_type: string
          details: Json | null
          detected_by: string | null
          id: string
          is_auto_detected: boolean | null
          screenshot_url: string | null
          session_id: string
          timestamp: string | null
        }
        Insert: {
          activity_type: string
          details?: Json | null
          detected_by?: string | null
          id?: string
          is_auto_detected?: boolean | null
          screenshot_url?: string | null
          session_id: string
          timestamp?: string | null
        }
        Update: {
          activity_type?: string
          details?: Json | null
          detected_by?: string | null
          id?: string
          is_auto_detected?: boolean | null
          screenshot_url?: string | null
          session_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suspicious_activities_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "test_proctoring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignment_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          mentor_id: string | null
          priority: string | null
          status: string
          student_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          mentor_id?: string | null
          priority?: string | null
          status?: string
          student_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          mentor_id?: string | null
          priority?: string | null
          status?: string
          student_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      test_audit_log: {
        Row: {
          created_at: string
          event_details: Json | null
          event_type: string
          id: string
          session_id: string
          severity: string | null
          student_id: string
          test_id: string
        }
        Insert: {
          created_at?: string
          event_details?: Json | null
          event_type: string
          id?: string
          session_id: string
          severity?: string | null
          student_id: string
          test_id: string
        }
        Update: {
          created_at?: string
          event_details?: Json | null
          event_type?: string
          id?: string
          session_id?: string
          severity?: string | null
          student_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_audit_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "test_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_audit_log_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_heartbeats: {
        Row: {
          browser_info: Json | null
          id: string
          is_active: boolean | null
          is_fullscreen: boolean | null
          latency_ms: number | null
          session_id: string
          timestamp: string | null
        }
        Insert: {
          browser_info?: Json | null
          id?: string
          is_active?: boolean | null
          is_fullscreen?: boolean | null
          latency_ms?: number | null
          session_id: string
          timestamp?: string | null
        }
        Update: {
          browser_info?: Json | null
          id?: string
          is_active?: boolean | null
          is_fullscreen?: boolean | null
          latency_ms?: number | null
          session_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_heartbeats_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "test_proctoring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_invitations: {
        Row: {
          id: string
          invited_at: string | null
          invited_by: string | null
          responded_at: string | null
          started_at: string | null
          status: string
          student_id: string | null
          test_id: string | null
        }
        Insert: {
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          responded_at?: string | null
          started_at?: string | null
          status?: string
          student_id?: string | null
          test_id?: string | null
        }
        Update: {
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          responded_at?: string | null
          started_at?: string | null
          status?: string
          student_id?: string | null
          test_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_invitations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_invitations_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_proctoring_sessions: {
        Row: {
          created_at: string | null
          daily_room_name: string | null
          daily_room_url: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          is_being_monitored: boolean | null
          mentor_joined_at: string | null
          recording_ended_at: string | null
          recording_started_at: string | null
          recording_url: string | null
          started_at: string | null
          student_id: string
          test_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_room_name?: string | null
          daily_room_url?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_being_monitored?: boolean | null
          mentor_joined_at?: string | null
          recording_ended_at?: string | null
          recording_started_at?: string | null
          recording_url?: string | null
          started_at?: string | null
          student_id: string
          test_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_room_name?: string | null
          daily_room_url?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_being_monitored?: boolean | null
          mentor_joined_at?: string | null
          recording_ended_at?: string | null
          recording_started_at?: string | null
          recording_url?: string | null
          started_at?: string | null
          student_id?: string
          test_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_proctoring_sessions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_proctoring_violations: {
        Row: {
          additional_data: Json | null
          created_at: string
          device_info: Json | null
          id: string
          session_id: string
          severity: string | null
          violation_timestamp: string
          violation_type: string
        }
        Insert: {
          additional_data?: Json | null
          created_at?: string
          device_info?: Json | null
          id?: string
          session_id: string
          severity?: string | null
          violation_timestamp?: string
          violation_type: string
        }
        Update: {
          additional_data?: Json | null
          created_at?: string
          device_info?: Json | null
          id?: string
          session_id?: string
          severity?: string | null
          violation_timestamp?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_proctoring_violations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_question_usage: {
        Row: {
          created_at: string | null
          id: string
          question_id: string
          test_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id: string
          test_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_question_usage_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_question_usage_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          id: string
          marks: number | null
          options: Json | null
          order_index: number | null
          question: string
          test_id: string
          type: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          marks?: number | null
          options?: Json | null
          order_index?: number | null
          question: string
          test_id: string
          type?: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          marks?: number | null
          options?: Json | null
          order_index?: number | null
          question?: string
          test_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sessions: {
        Row: {
          browser_fingerprint: string | null
          copy_paste_attempts_count: number | null
          created_at: string
          ended_at: string | null
          expires_at: string
          face_detection_failures_count: number | null
          flag_reason: string | null
          fullscreen_exits_count: number | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          is_flagged: boolean | null
          is_submitted: boolean | null
          screen_share_stopped_count: number | null
          session_token: string
          started_at: string
          student_id: string
          submission_id: string | null
          suspicious_activity_count: number | null
          tab_switches_count: number | null
          test_id: string
          total_violations: number | null
          updated_at: string
          user_agent: string | null
          was_interrupted: boolean | null
        }
        Insert: {
          browser_fingerprint?: string | null
          copy_paste_attempts_count?: number | null
          created_at?: string
          ended_at?: string | null
          expires_at: string
          face_detection_failures_count?: number | null
          flag_reason?: string | null
          fullscreen_exits_count?: number | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          is_flagged?: boolean | null
          is_submitted?: boolean | null
          screen_share_stopped_count?: number | null
          session_token: string
          started_at?: string
          student_id: string
          submission_id?: string | null
          suspicious_activity_count?: number | null
          tab_switches_count?: number | null
          test_id: string
          total_violations?: number | null
          updated_at?: string
          user_agent?: string | null
          was_interrupted?: boolean | null
        }
        Update: {
          browser_fingerprint?: string | null
          copy_paste_attempts_count?: number | null
          created_at?: string
          ended_at?: string | null
          expires_at?: string
          face_detection_failures_count?: number | null
          flag_reason?: string | null
          fullscreen_exits_count?: number | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          is_flagged?: boolean | null
          is_submitted?: boolean | null
          screen_share_stopped_count?: number | null
          session_token?: string
          started_at?: string
          student_id?: string
          submission_id?: string | null
          suspicious_activity_count?: number | null
          tab_switches_count?: number | null
          test_id?: string
          total_violations?: number | null
          updated_at?: string
          user_agent?: string | null
          was_interrupted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "test_sessions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "test_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_sessions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_submission_integrity: {
        Row: {
          created_at: string
          id: string
          integrity_verified: boolean | null
          session_id: string
          submission_encrypted: string | null
          submission_hash: string
          submission_id: string
          verification_timestamp: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          integrity_verified?: boolean | null
          session_id: string
          submission_encrypted?: string | null
          submission_hash: string
          submission_id: string
          verification_timestamp?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          integrity_verified?: boolean | null
          session_id?: string
          submission_encrypted?: string | null
          submission_hash?: string
          submission_id?: string
          verification_timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_submission_integrity_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "test_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_submission_integrity_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "test_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_submissions: {
        Row: {
          activity_log: Json | null
          ai_analysis: Json | null
          ai_evaluated_at: string | null
          answers: Json
          created_at: string | null
          face_snapshots: string[] | null
          graded_at: string | null
          graded_by: string | null
          id: string
          is_disqualified: boolean | null
          manual_grades: Json | null
          max_score: number | null
          mentor_evaluated_at: string | null
          mentor_feedback: string | null
          percentage: number | null
          proctoring_room_url: string | null
          score: number | null
          screen_recording_url: string | null
          session_id: string | null
          started_at: string | null
          status: string | null
          student_device_info: Json | null
          student_id: string | null
          submission_encrypted: string | null
          submission_hash: string | null
          submission_integrity_verified: boolean | null
          submitted_at: string | null
          test_id: string | null
          time_taken_seconds: number | null
          warnings_count: number | null
        }
        Insert: {
          activity_log?: Json | null
          ai_analysis?: Json | null
          ai_evaluated_at?: string | null
          answers: Json
          created_at?: string | null
          face_snapshots?: string[] | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_disqualified?: boolean | null
          manual_grades?: Json | null
          max_score?: number | null
          mentor_evaluated_at?: string | null
          mentor_feedback?: string | null
          percentage?: number | null
          proctoring_room_url?: string | null
          score?: number | null
          screen_recording_url?: string | null
          session_id?: string | null
          started_at?: string | null
          status?: string | null
          student_device_info?: Json | null
          student_id?: string | null
          submission_encrypted?: string | null
          submission_hash?: string | null
          submission_integrity_verified?: boolean | null
          submitted_at?: string | null
          test_id?: string | null
          time_taken_seconds?: number | null
          warnings_count?: number | null
        }
        Update: {
          activity_log?: Json | null
          ai_analysis?: Json | null
          ai_evaluated_at?: string | null
          answers?: Json
          created_at?: string | null
          face_snapshots?: string[] | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_disqualified?: boolean | null
          manual_grades?: Json | null
          max_score?: number | null
          mentor_evaluated_at?: string | null
          mentor_feedback?: string | null
          percentage?: number | null
          proctoring_room_url?: string | null
          score?: number | null
          screen_recording_url?: string | null
          session_id?: string | null
          started_at?: string | null
          status?: string | null
          student_device_info?: Json | null
          student_id?: string | null
          submission_encrypted?: string | null
          submission_hash?: string | null
          submission_integrity_verified?: boolean | null
          submitted_at?: string | null
          test_id?: string | null
          time_taken_seconds?: number | null
          warnings_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_submissions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "test_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_submissions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          auto_submit_on_violations: boolean | null
          community_id: string | null
          created_at: string | null
          daily_room_url: string | null
          description: string | null
          duration_minutes: number
          enable_face_monitoring: boolean | null
          enable_proctoring: boolean | null
          enable_recording: boolean | null
          enable_screen_recording: boolean | null
          expires_at: string | null
          id: string
          instructions: string | null
          is_live: boolean | null
          is_published: boolean | null
          max_fullscreen_exits: number | null
          max_tab_switches: number | null
          mentor_id: string | null
          passing_marks: number | null
          proctoring_settings: Json | null
          question_type: string
          questions: Json
          require_screen_share: boolean | null
          require_webcam: boolean | null
          scheduled_at: string | null
          settings: Json | null
          test_type: string
          title: string
          total_marks: number
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          auto_submit_on_violations?: boolean | null
          community_id?: string | null
          created_at?: string | null
          daily_room_url?: string | null
          description?: string | null
          duration_minutes: number
          enable_face_monitoring?: boolean | null
          enable_proctoring?: boolean | null
          enable_recording?: boolean | null
          enable_screen_recording?: boolean | null
          expires_at?: string | null
          id?: string
          instructions?: string | null
          is_live?: boolean | null
          is_published?: boolean | null
          max_fullscreen_exits?: number | null
          max_tab_switches?: number | null
          mentor_id?: string | null
          passing_marks?: number | null
          proctoring_settings?: Json | null
          question_type: string
          questions: Json
          require_screen_share?: boolean | null
          require_webcam?: boolean | null
          scheduled_at?: string | null
          settings?: Json | null
          test_type: string
          title: string
          total_marks: number
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_submit_on_violations?: boolean | null
          community_id?: string | null
          created_at?: string | null
          daily_room_url?: string | null
          description?: string | null
          duration_minutes?: number
          enable_face_monitoring?: boolean | null
          enable_proctoring?: boolean | null
          enable_recording?: boolean | null
          enable_screen_recording?: boolean | null
          expires_at?: string | null
          id?: string
          instructions?: string | null
          is_live?: boolean | null
          is_published?: boolean | null
          max_fullscreen_exits?: number | null
          max_tab_switches?: number | null
          mentor_id?: string | null
          passing_marks?: number | null
          proctoring_settings?: Json | null
          question_type?: string
          questions?: Json
          require_screen_share?: boolean | null
          require_webcam?: boolean | null
          scheduled_at?: string | null
          settings?: Json | null
          test_type?: string
          title?: string
          total_marks?: number
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tests_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_indicators: {
        Row: {
          conversation_with: string
          created_at: string | null
          id: string
          is_typing: boolean | null
          user_id: string
        }
        Insert: {
          conversation_with: string
          created_at?: string | null
          id?: string
          is_typing?: boolean | null
          user_id: string
        }
        Update: {
          conversation_with?: string
          created_at?: string | null
          id?: string
          is_typing?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          country: string | null
          created_at: string | null
          domain: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          domain: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          domain?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      university_email_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          is_primary: boolean | null
          university_id: string
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          is_primary?: boolean | null
          university_id: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          is_primary?: boolean | null
          university_id?: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          last_seen: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          last_seen?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          last_seen?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          created_at: string | null
          id: string
          last_practiced: string | null
          practice_count: number | null
          proficiency: number | null
          skill_id: string
          updated_at: string | null
          user_id: string
          verification_proof: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_practiced?: string | null
          practice_count?: number | null
          proficiency?: number | null
          skill_id: string
          updated_at?: string | null
          user_id: string
          verification_proof?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_practiced?: string | null
          practice_count?: number | null
          proficiency?: number | null
          skill_id?: string
          updated_at?: string | null
          user_id?: string
          verification_proof?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          current_semester: number | null
          degree_type: string | null
          email: string
          expertise: string | null
          full_name: string
          github_url: string | null
          id: string
          interests: string[] | null
          linkedin_url: string | null
          phone: string | null
          quiz_completed: boolean | null
          role: string
          specialization_board: string | null
          student_preferences: Json | null
          twitter_url: string | null
          university_id: string | null
          updated_at: string | null
          website_url: string | null
          years_of_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_semester?: number | null
          degree_type?: string | null
          email: string
          expertise?: string | null
          full_name: string
          github_url?: string | null
          id: string
          interests?: string[] | null
          linkedin_url?: string | null
          phone?: string | null
          quiz_completed?: boolean | null
          role: string
          specialization_board?: string | null
          student_preferences?: Json | null
          twitter_url?: string | null
          university_id?: string | null
          updated_at?: string | null
          website_url?: string | null
          years_of_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_semester?: number | null
          degree_type?: string | null
          email?: string
          expertise?: string | null
          full_name?: string
          github_url?: string | null
          id?: string
          interests?: string[] | null
          linkedin_url?: string | null
          phone?: string | null
          quiz_completed?: boolean | null
          role?: string
          specialization_board?: string | null
          student_preferences?: Json | null
          twitter_url?: string | null
          university_id?: string | null
          updated_at?: string | null
          website_url?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_bonus_tokens: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: {
          new_balance: number
          success: boolean
        }[]
      }
      auto_end_proctoring_sessions: { Args: never; Returns: undefined }
      calculate_leaderboard_ranks: { Args: never; Returns: undefined }
      cleanup_expired_invites: {
        Args: never
        Returns: {
          removed_count: number
        }[]
      }
      cleanup_expired_test_sessions: { Args: never; Returns: undefined }
      cleanup_old_notifications: { Args: never; Returns: number }
      cleanup_old_typing_indicators: { Args: never; Returns: undefined }
      create_notification:
        | {
            Args: {
              p_actor_id?: string
              p_message: string
              p_notification_type: string
              p_related_link?: string
              p_title: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_action_url?: string
              p_message: string
              p_metadata?: Json
              p_related_id?: string
              p_related_type?: string
              p_title: string
              p_type: string
              p_user_id: string
            }
            Returns: string
          }
      deduct_ai_tokens: {
        Args: { p_amount: number; p_user_id: string }
        Returns: {
          message: string
          new_balance: number
          success: boolean
        }[]
      }
      extract_mentions: { Args: { p_text: string }; Returns: string[] }
      get_my_university_id: { Args: never; Returns: string }
      get_post_details: {
        Args: { post_uuid: string; user_uuid: string }
        Returns: {
          author_data: Json
          is_liked: boolean
          is_saved: boolean
          post_data: Json
          user_can_moderate: boolean
        }[]
      }
      get_unread_notifications_count: { Args: never; Returns: number }
      get_user_university_id: { Args: never; Returns: string }
      is_service_role: { Args: never; Returns: boolean }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      process_mentions: {
        Args: {
          p_comment_id?: string
          p_content: string
          p_mentioned_by?: string
          p_message_id?: string
          p_post_id?: string
        }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      soft_delete_comment: {
        Args: { comment_id: string; reason?: string }
        Returns: boolean
      }
      soft_delete_message: {
        Args: { message_id: string; reason?: string }
        Returns: boolean
      }
      soft_delete_post: {
        Args: { post_id: string; reason?: string }
        Returns: boolean
      }
      validate_test_session: {
        Args: { p_session_token: string }
        Returns: {
          is_expired: boolean
          is_valid: boolean
          session_id: string
          student_id: string
          test_id: string
          time_remaining_seconds: number
          violations_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
