'use client';

import { useState } from 'react';
import { UserCircle, GraduationCap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SignIn() {
  const [selectedRole, setSelectedRole] = useState<'student' | 'mentor' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-black">
            Welcome Back!
          </h1>
          <p className="text-lg text-slate-600">
            Choose your role to continue to your dashboard
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Student Card */}
          <div
            onClick={() => setSelectedRole('student')}
            className={`group relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 ${
              selectedRole === 'student'
                ? 'border-fuchsia-500 bg-fuchsia-50 shadow-xl shadow-fuchsia-500/20 scale-[1.02]'
                : 'border-slate-200 bg-white hover:border-fuchsia-300 hover:shadow-lg'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
                  selectedRole === 'student'
                    ? 'bg-fuchsia-500 text-white'
                    : 'bg-fuchsia-100 text-fuchsia-600 group-hover:bg-fuchsia-200'
                }`}
              >
                <GraduationCap className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-extrabold mb-3 text-black">I'm a Student</h2>
              <p className="text-slate-600 mb-6">
                Access your courses, join live sessions, complete assignments, and track your progress
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Live Classes
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Assignments
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  Progress Tracking
                </span>
              </div>
            </div>
            {selectedRole === 'student' && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-fuchsia-500 rounded-full flex items-center justify-center">
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
            className={`group relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 ${
              selectedRole === 'mentor'
                ? 'border-indigo-500 bg-indigo-50 shadow-xl shadow-indigo-500/20 scale-[1.02]'
                : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-lg'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
                  selectedRole === 'mentor'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200'
                }`}
              >
                <UserCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-extrabold mb-3 text-black">I'm a Mentor</h2>
              <p className="text-slate-600 mb-6">
                Create courses, conduct live sessions, manage students, and provide personalized feedback
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                  Course Creation
                </span>
                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                  Student Management
                </span>
                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                  Analytics
                </span>
              </div>
            </div>
            {selectedRole === 'mentor' && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
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
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-semibold text-white transition-all duration-300 hover:scale-105 shadow-xl ${
                selectedRole === 'student'
                  ? 'bg-fuchsia-500 hover:bg-fuchsia-600 shadow-fuchsia-500/30'
                  : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/30'
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
