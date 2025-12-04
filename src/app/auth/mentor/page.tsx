'use client';

import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Chrome, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getGravatarUrlClient } from '@/lib/utils/gravatar';

export default function MentorAuth() {
  const router = useRouter();
  const supabase = createClient();
  const [isSignIn, setIsSignIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignIn) {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        // Check profile completeness
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        const isComplete = profile?.university && profile?.full_name;
        if (!isComplete) {
          router.push('/onboarding/mentor');
        } else {
          router.push('/dashboard/mentor');
        }
      } else {
        // Sign Up
        // Check if passwords match
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        // Create profile
        if (authData.user) {
          const avatarUrl = await getGravatarUrlClient(formData.email);
          const { error: profileError } = await supabase.from('profiles').insert({
            user_id: authData.user.id,
            role: 'mentor',
            full_name: formData.name,
            email: formData.email,
            university: '',
            avatar_url: avatarUrl,
          });

          if (profileError) throw profileError;

          // Redirect to onboarding for profile completion
          router.push('/onboarding/mentor');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=mentor`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-blue-500/10"></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]"></div>
      
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-xl bg-slate-900/50 backdrop-blur-2xl border border-slate-800/50 rounded-3xl p-8 shadow-2xl">
          {/* Back Button */}
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 rounded-lg mb-8 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to role selection
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-sm font-semibold mb-6">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
              Mentor Portal
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}
            <h1 className="text-4xl font-bold text-white mb-3">
              {isSignIn ? 'Welcome back!' : 'Join as a Mentor'}
            </h1>
            <p className="text-slate-400">
              {isSignIn
                ? 'Sign in to access your teaching dashboard'
                : 'Create an account to start teaching and inspiring students'}
            </p>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl font-medium text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800 transition-all mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {loading ? 'Loading...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative px-4 bg-slate-900/50 text-sm text-slate-500">or</div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (Sign Up only) */}
            {!isSignIn && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Dr. Jane Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-slate-500"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  placeholder="mentor@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up only) */}
            {!isSignIn && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* Forgot Password (Sign In only) */}
            {isSignIn && (
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Terms (Sign Up only) */}
            {!isSignIn && (
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 rounded focus:ring-indigo-500"
                  required
                />
                <label htmlFor="terms" className="text-sm text-slate-400">
                  I agree to the{' '}
                  <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-blue-600 transition-all shadow-lg shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : (isSignIn ? 'Sign In' : 'Create Account')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Toggle Sign In/Up */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignIn(!isSignIn)}
              className="text-sm text-slate-400"
            >
              {isSignIn ? "Don't have an account? " : 'Already have an account? '}
              <span className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                {isSignIn ? 'Sign up' : 'Sign in'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center relative z-10">
        <div className="relative text-white max-w-md">
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
              <span className="text-4xl">👨‍🏫</span>
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Inspire the Next Generation</h2>
            <p className="text-slate-400 text-lg">
              Join our community of passionate educators. Create engaging courses, conduct live
              sessions, and make a real impact on students&apos; learning journeys.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-500/30">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-white">Create Engaging Content</h3>
                <p className="text-slate-400 text-sm">
                  Build courses with our intuitive tools and resources
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-500/30">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-white">Manage Students Efficiently</h3>
                <p className="text-slate-400 text-sm">
                  Track progress, provide feedback, and communicate seamlessly
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-500/30">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-white">Advanced Analytics</h3>
                <p className="text-slate-400 text-sm">
                  Gain insights into student performance and engagement
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
