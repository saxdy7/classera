/**
 * Authentication Types and Schemas
 * Centralized type definitions for auth operations
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export type UserRole = 'student' | 'mentor';

export type AuthMode = 'signin' | 'signup';

export type OAuthProvider = 'google' | 'github';

// ============================================================================
// FORM SCHEMAS (with Zod validation)
// ============================================================================

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface SignInFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateProfileRequest {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface CreateProfileResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
  needsEmailConfirmation?: boolean;
}

// ============================================================================
// PROFILE TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  university_id?: string;
  avatar_url?: string;
  specialization_board?: string;
  current_semester?: number;
  expertise?: string;
  years_of_experience?: number;
  bio?: string;
  linkedin_url?: string;
  github_url?: string;
  interests?: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// AUTH STATE
// ============================================================================

export interface AuthState {
  loading: boolean;
  error: string;
  mode: AuthMode;
}
