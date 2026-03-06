'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { UniversitySearch } from '@/components/ui/UniversitySearch';
import { FieldOfStudySearch } from '@/components/ui/FieldOfStudySearch';
import { YearDropdown } from '@/components/ui/year-dropdown';
import { User, GraduationCap, BookOpen, Target, ArrowRight, ArrowLeft } from 'lucide-react';

const TOTAL_STEPS = 4;

export default function StudentOnboarding() {
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    university: '',
    university_id: null as string | null,
    degree_type: '',
    specialization_board: '',
    current_semester: '',
    graduation_year: '',
    linkedin_url: '',
    github_url: '',
    bio: '',
  });

  const handleNext = () => {
    if (currentStep === 1 && !formData.full_name) {
      setError('Please enter your full name');
      return;
    }
    if (currentStep === 2 && !formData.university) {
      setError('Please select your university');
      return;
    }
    if (currentStep === 3 && !formData.specialization_board) {
      setError('Please enter your specialization');
      return;
    }

    setError('');
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          university_id: formData.university_id || null,
          university_name: formData.university || null, // API auto-creates university if needed
          degree_type: formData.degree_type || null,
          specialization_board: formData.specialization_board || null,
          current_semester: formData.current_semester ? parseInt(formData.current_semester) : null,
          linkedin_url: formData.linkedin_url || null,
          github_url: formData.github_url || null,
          bio: formData.bio || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      await supabase.auth.refreshSession();
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.href = '/onboarding/student/quiz';
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to complete onboarding');
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-fuchsia-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-black mb-2">
                Welcome! Let&rsquo;s get started
              </h2>
              <p className="text-slate-600">
                Tell us a bit about yourself
              </p>
            </div>

            <Input
              label="Full Name"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              icon={<User className="w-5 h-5" />}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-black mb-2">
                Your Institution
              </h2>
              <p className="text-slate-600">
                Which university are you studying at?
              </p>
            </div>

            <UniversitySearch
              label="University"
              value={formData.university}
              onChange={(value, universityId) => setFormData({
                ...formData,
                university: value,
                university_id: universityId || null
              })}
              placeholder="Search for your university..."
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-black mb-2">
                Your Studies
              </h2>
              <p className="text-slate-600">
                What are you currently studying?
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Specialization
              </label>
              <FieldOfStudySearch
                value={formData.specialization_board}
                onChange={(value) => setFormData({ ...formData, specialization_board: value })}
                placeholder="e.g., Computer Science, Data Science..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current Semester (Optional)
              </label>
              <YearDropdown
                value={formData.current_semester}
                onChange={(semester) => setFormData({ ...formData, current_semester: semester })}
                placeholder="Select your current semester"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-black mb-2">
                Almost Done!
              </h2>
              <p className="text-slate-600">
                Review your information
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Full Name</p>
                <p className="font-semibold text-black">{formData.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">University</p>
                <p className="font-semibold text-black">{formData.university}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Specialization</p>
                <p className="font-semibold text-black">{formData.specialization_board}</p>
              </div>
              {formData.current_semester && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Current Semester</p>
                  <p className="font-semibold text-black">{formData.current_semester}</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-fuchsia-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

          <div className="mt-8 mb-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            {renderStep()}
          </div>

          <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
              className={currentStep === 1 ? 'invisible' : ''}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={loading}
              >
                Next
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Completing...' : 'Complete Setup'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
