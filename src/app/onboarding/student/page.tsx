'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { UniversitySearch } from '@/components/ui/UniversitySearch';
import { FieldOfStudySearch } from '@/components/ui/FieldOfStudySearch';
import { getGravatarUrlClient } from '@/lib/utils/gravatar';
import { User, GraduationCap, BookOpen, Target, ArrowRight, ArrowLeft } from 'lucide-react';

const TOTAL_STEPS = 4;

export default function StudentOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    university: '',
    field_of_study: '',
    year_of_study: '',
    bio: '',
  });

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1 && !formData.full_name) {
      setError('Please enter your full name');
      return;
    }
    if (currentStep === 2 && !formData.university) {
      setError('Please select your university');
      return;
    }
    if (currentStep === 3 && !formData.field_of_study) {
      setError('Please enter your field of study');
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
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No user found');

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            university: formData.university,
            field_of_study: formData.field_of_study,
          })
          .eq('user_id', user.id)
          .select();

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }

        console.log('Profile updated successfully:', updateData);
      } else {
        // Create new profile
        const avatarUrl = await getGravatarUrlClient(user.email || '');
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            role: 'student',
            full_name: formData.full_name,
            email: user.email || '',
            university: formData.university,
            field_of_study: formData.field_of_study,
            avatar_url: avatarUrl,
          })
          .select();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }

        console.log('Profile created successfully:', insertData);
      }

      // Wait a bit for the database to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to dashboard
      window.location.href = '/dashboard/student';
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to complete onboarding');
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
                Welcome! Let's get started
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
              onChange={(value) => setFormData({ ...formData, university: value })}
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
                Field of Study
              </label>
              <FieldOfStudySearch
                value={formData.field_of_study}
                onChange={(value) => setFormData({ ...formData, field_of_study: value })}
                placeholder="Search for your field of study..."
              />
            </div>

            <Select
              label="Year of Study (Optional)"
              options={[
                { value: '', label: 'Select year' },
                { value: '1st', label: '1st Year' },
                { value: '2nd', label: '2nd Year' },
                { value: '3rd', label: '3rd Year' },
                { value: '4th', label: '4th Year' },
                { value: 'graduate', label: 'Graduate' },
              ]}
              value={formData.year_of_study}
              onChange={(e) => setFormData({ ...formData, year_of_study: e.target.value })}
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
                <p className="text-sm text-slate-600 mb-1">Field of Study</p>
                <p className="font-semibold text-black">{formData.field_of_study}</p>
              </div>
              {formData.year_of_study && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Year of Study</p>
                  <p className="font-semibold text-black">{formData.year_of_study}</p>
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
