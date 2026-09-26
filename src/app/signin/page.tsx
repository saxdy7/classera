'use client';

import { useState } from 'react';
import { UserCircle, GraduationCap, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SignIn() {
  const [selectedRole, setSelectedRole] = useState<'student' | 'mentor' | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-accent-purple/10">
      <div className="max-w-6xl w-full">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground/80 hover:text-accent-purple hover:bg-card rounded-lg mb-8 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl mb-4">
            Welcome Back!
          </h1>
          <p className="text-lg text-foreground/80">
            Choose your role to continue to your dashboard
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Student Card */}
          <div
            onClick={() => setSelectedRole('student')}
            className={`group relative p-8 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
              selectedRole === 'student'
                ? 'border-accent-purple bg-accent-purple/10 scale-[1.02]'
                : 'border-border bg-card hover:border-accent-purple'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
                  selectedRole === 'student'
                    ? 'bg-primary text-white'
                    : 'bg-accent-purple/10 text-accent-purple group-hover:bg-primary'
                }`}
              >
                <GraduationCap className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-black">I&rsquo;m a Student</h2>
              <p className="text-foreground/80 mb-6">
                Access your courses, join live sessions, complete assignments, and track your progress
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-accent-purple/10 text-accent-purple rounded-full text-xs font-medium">
                  Live Classes
                </span>
                <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-medium">
                  Assignments
                </span>
                <span className="px-3 py-1 bg-accent-purple/10 text-accent-purple rounded-full text-xs font-medium">
                  Progress Tracking
                </span>
              </div>
            </div>
            {selectedRole === 'student' && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Mentor Card */}
          <div
            onClick={() => setSelectedRole('mentor')}
            className={`group relative p-8 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
              selectedRole === 'mentor'
                ? 'border-accent-purple bg-accent-purple/10 scale-[1.02]'
                : 'border-border bg-card hover:border-accent-purple'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
                  selectedRole === 'mentor'
                    ? 'bg-primary text-white'
                    : 'bg-accent-purple/10 text-accent-purple group-hover:bg-primary'
                }`}
              >
                <UserCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-black">I&rsquo;m a Mentor</h2>
              <p className="text-foreground/80 mb-6">
                Create courses, conduct live sessions, manage students, and provide personalized feedback
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs font-medium">
                  Course Creation
                </span>
                <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-medium">
                  Student Management
                </span>
                <span className="px-3 py-1 bg-accent-purple/10 text-accent-purple rounded-full text-xs font-medium">
                  Analytics
                </span>
              </div>
            </div>
            {selectedRole === 'mentor' && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Continue Button */}
        {selectedRole && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link
              href={`/auth/${selectedRole}`}
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-semibold text-white transition-all duration-300 hover:scale-105 ${
                selectedRole === 'student'
                  ? 'bg-primary hover:bg-primary'
                  : 'bg-primary hover:bg-primary'
              }`}
            >
              Continue as {selectedRole === 'student' ? 'Student' : 'Mentor'}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
