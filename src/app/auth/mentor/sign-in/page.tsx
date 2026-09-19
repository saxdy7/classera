'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check user role and redirect accordingly
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (userData?.role === 'student') {
        router.push('/dashboard/student')
      } else if (userData?.role === 'mentor') {
        router.push('/dashboard/mentor')
      } else {
        router.push('/onboarding')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--cl-canvas)]">
      <div className="w-full max-w-md">
        <div className="bg-black/40 backdrop-blur-xl border border-[var(--cl-hairline)] rounded-[var(--cl-r-xl)] p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-[var(--cl-ink)]">
              Welcome Back
            </h1>
            <p className="text-[var(--cl-muted)] mt-2">Sign in to continue your journey</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--cl-muted)] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--cl-muted)]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] rounded-lg text-[var(--cl-ink)] placeholder-[var(--cl-muted-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent"
                  placeholder="you@university.edu"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--cl-muted)] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--cl-muted)]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3 bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] rounded-lg text-[var(--cl-ink)] placeholder-[var(--cl-muted-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cl-muted)] hover:text-[var(--cl-ink)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[rgba(239,68,68,0.1)] border border-[var(--cl-error)] rounded-lg p-3 text-[var(--cl-error)] text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--cl-on-primary)] font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 bg-[var(--cl-primary)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[var(--cl-muted)]">
              Don't have an account?{' '}
              <Link
                href="/auth/sign-up"
                className="text-[var(--cl-primary)] hover:text-[var(--cl-primary)] font-semibold transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-[var(--cl-muted)] hover:text-[var(--cl-muted)] transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
