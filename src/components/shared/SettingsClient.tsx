'use client';

import { useState } from 'react';
import { User, Bell, Lock, Save, CheckCircle } from 'lucide-react';

interface Props {
    profile: any;
}

export default function StudentSettingsClient({ profile }: Props) {
    const [form, setForm] = useState({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: form.full_name,
                    bio: form.bio,
                    linkedin_url: form.linkedin_url,
                    github_url: form.github_url,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save');
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        window.location.href = '/signin';
    };

    return (
        <div className="space-y-6 max-w-2xl">

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
            )}

            {saved && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Profile saved successfully!
                </div>
            )}

            {/* Profile Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Profile Information</h3>
                        <p className="text-sm text-slate-500">Update your personal details</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={form.full_name}
                            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all bg-white text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                        <input
                            type="email"
                            value={profile.email || ''}
                            disabled
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">University</label>
                        <input
                            type="text"
                            value={profile.universities?.name || 'Not set'}
                            disabled
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialization</label>
                        <input
                            type="text"
                            value={profile.specialization_board || 'Not set'}
                            disabled
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
                        <textarea
                            rows={3}
                            value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })}
                            placeholder="Tell mentors about yourself..."
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all bg-white text-slate-900 resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">LinkedIn URL</label>
                            <input
                                type="url"
                                value={form.linkedin_url}
                                onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                                placeholder="https://linkedin.com/in/..."
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all bg-white text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">GitHub URL</label>
                            <input
                                type="url"
                                value={form.github_url}
                                onChange={(e) => setForm({ ...form, github_url: e.target.value })}
                                placeholder="https://github.com/..."
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all bg-white text-slate-900"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Bell className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
                        <p className="text-sm text-slate-500">Manage notification preferences</p>
                    </div>
                </div>
                {[
                    { label: 'Email Notifications', desc: 'Receive updates via email' },
                    { label: 'Push Notifications', desc: 'Get alerts on your device' },
                    { label: 'Message Alerts', desc: 'Notify me of new messages' },
                ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                        <div>
                            <p className="font-medium text-slate-900 text-sm">{item.label}</p>
                            <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-600 transition-colors">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow translate-x-6 transition-transform" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Account */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <Lock className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Account</h3>
                        <p className="text-sm text-slate-500">Manage your account</p>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="px-6 py-2.5 bg-red-50 text-red-700 font-semibold rounded-xl hover:bg-red-100 transition-colors border border-red-200 text-sm"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
