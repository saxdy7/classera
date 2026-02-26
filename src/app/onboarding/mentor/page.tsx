'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { UniversitySearch } from '@/components/ui/UniversitySearch';
import { User, GraduationCap, Briefcase, Target, ArrowRight, ArrowLeft } from 'lucide-react';
import { getGravatarUrlClient } from '@/lib/utils/gravatar';

const TOTAL_STEPS = 4;

export default function MentorOnboarding() {
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    university: '',
    university_id: null as string | null,
    expertise: '',
    years_of_experience: '',
    linkedin_url: '',
    github_url: '',
    bio: '',
  });

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1 && !formData.full_name) {
      setError('Please enter your full name');
      return;
    }
    if (currentStep === 2 && !formData.university) {
      setError('Please select your institution');
      return;
    }
    if (currentStep === 3 && !formData.expertise) {
      setError('Please enter your area of expertise');
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
          expertise: formData.expertise ? formData.expertise.split(',').map(s => s.trim()).filter(s => s) : [],
          years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : null,
          linkedin_url: formData.linkedin_url || null,
          github_url: formData.github_url || null,
          bio: formData.bio || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.href = '/dashboard/mentor';
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
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-black mb-2">
                Welcome, Mentor!
              </h2>
              <p className="text-slate-600">
                Let&rsquo;s set up your teaching profile
              </p>
            </div>

            <Input
              label="Full Name"
              placeholder="Dr. Jane Smith"
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
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-black mb-2">
                Your Institution
              </h2>
              <p className="text-slate-600">
                Where do you teach or mentor?
              </p>
            </div>

            <UniversitySearch
              label="Institution"
              value={formData.university}
              onChange={(value, universityId) => setFormData({
                ...formData,
                university: value,
                university_id: universityId || null
              })}
              placeholder="Search for your institution..."
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-black mb-2">
                Your Expertise
              </h2>
              <p className="text-slate-600">
                What subjects do you teach?
              </p>
            </div>

            <Input
              label="Area of Expertise"
              placeholder="e.g., Full Stack Development, AI/ML, Web Development (comma-separated)"
              value={formData.expertise}
              onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
              icon={<Briefcase className="w-5 h-5" />}
            />

            <Select
              label="Years of Experience (Optional)"
              options={[
                { value: '', label: 'Select experience' },
                { value: '0-2', label: '0-2 years' },
                { value: '3-5', label: '3-5 years' },
                { value: '6-10', label: '6-10 years' },
                { value: '10+', label: '10+ years' },
              ]}
              value={formData.years_of_experience}
              onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
            />
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
                All Set!
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
                <p className="text-sm text-slate-600 mb-1">Institution</p>
                <p className="font-semibold text-black">{formData.university}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Area of Expertise</p>
                <p className="font-semibold text-black">{formData.expertise}</p>
              </div>
              {formData.years_of_experience && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Experience</p>
                  <p className="font-semibold text-black">{formData.years_of_experience} years</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 p-4">
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
                variant="secondary"
                onClick={handleNext}
                disabled={loading}
              >
                Next
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                variant="secondary"
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
