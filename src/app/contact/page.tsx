'use client';

import { useState } from 'react';
import { ArrowLeft, Send, Check, Sparkles, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    organization: '',
    interests: [] as string[],
    message: ''
  });

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-[var(--cl-canvas)]">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto bg-[rgba(255,255,255,0.8)] backdrop-blur-md border border-[var(--cl-hairline)] rounded-full px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-semibold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-[var(--cl-on-dark)] text-sm font-semibold">
              C
            </div>
            Classera
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-black text-black rounded-full text-sm font-medium hover:bg-black hover:text-[var(--cl-on-dark)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[40vw] h-[40vw] bg-[var(--cl-primary)] rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[35vw] h-[35vw] bg-[var(--cl-primary)] rounded-full blur-3xl opacity-30"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] text-sm font-semibold mb-8 animate-bounce">
              <Sparkles className="w-4 h-4" />
              We'd Love to Hear From You
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-foreground text-5xl md:text-7xl mb-6">
              Get in <span className="text-[var(--cl-ink)]">Touch</span>
            </h1>

            <p className="text-xl text-[var(--cl-body)] max-w-2xl mx-auto leading-relaxed">
              Have a question, feedback, or just want to say hello? Fill out the form below and we'll get back to you within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Information Cards */}
            <div className="lg:col-span-1 space-y-6">
              {/* Email Card */}
              <div className="group bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border-2 border-[var(--cl-hairline)] hover:border-[var(--cl-primary)] transition-all">
                <div className="w-12 h-12 rounded-[var(--cl-r-xl)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-[var(--cl-primary)]">
                  <Mail className="w-6 h-6 text-[var(--cl-on-dark)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--cl-ink)] mb-2">Email Us</h3>
                <p className="text-[var(--cl-body)] text-sm mb-3">Our team is here to help</p>
                <a href="mailto:hello@classera.io" className="text-[var(--cl-primary)] font-semibold hover:text-[var(--cl-primary)] transition-colors">
                  hello@classera.io
                </a>
              </div>

              {/* Phone Card */}
              <div className="group bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border-2 border-[var(--cl-hairline)] hover:border-[var(--cl-primary)] transition-all">
                <div className="w-12 h-12 rounded-[var(--cl-r-xl)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-[var(--cl-primary)]">
                  <Phone className="w-6 h-6 text-[var(--cl-on-dark)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--cl-ink)] mb-2">Call Us</h3>
                <p className="text-[var(--cl-body)] text-sm mb-3">Mon-Fri, 9am-6pm EST</p>
                <a href="tel:+1234567890" className="text-[var(--cl-primary)] font-semibold hover:text-[var(--cl-primary)] transition-colors">
                  +1 (234) 567-890
                </a>
              </div>

              {/* Office Card */}
              <div className="group bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border-2 border-[var(--cl-hairline)] hover:border-[var(--cl-primary)] transition-all">
                <div className="w-12 h-12 rounded-[var(--cl-r-xl)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-[var(--cl-primary)]">
                  <MapPin className="w-6 h-6 text-[var(--cl-on-dark)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--cl-ink)] mb-2">Visit Us</h3>
                <p className="text-[var(--cl-body)] text-sm mb-3">Our headquarters</p>
                <address className="text-[var(--cl-primary)] font-semibold not-italic">
                  123 Education Lane<br />
                  San Francisco, CA 94103
                </address>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-8 md:p-10 border-2 border-[var(--cl-hairline)]">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="text-sm font-semibold text-[var(--cl-body)] mb-2 block">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full bg-[var(--cl-canvas-soft)] border-2 border-[var(--cl-hairline)] rounded-[var(--cl-r-xl)] px-5 py-4 text-[var(--cl-ink)] placeholder-[var(--cl-muted-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent transition-all group-hover:border-[var(--cl-hairline-strong)]"
                      />
                    </div>
                    <div className="group">
                      <label className="text-sm font-semibold text-[var(--cl-body)] mb-2 block">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="john@school.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-[var(--cl-canvas-soft)] border-2 border-[var(--cl-hairline)] rounded-[var(--cl-r-xl)] px-5 py-4 text-[var(--cl-ink)] placeholder-[var(--cl-muted-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent transition-all group-hover:border-[var(--cl-hairline-strong)]"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="text-sm font-semibold text-[var(--cl-body)] mb-2 block">Organization / School</label>
                    <input
                      type="text"
                      placeholder="Your institution name"
                      value={formData.organization}
                      onChange={(e) => setFormData({...formData, organization: e.target.value})}
                      className="w-full bg-[var(--cl-canvas-soft)] border-2 border-[var(--cl-hairline)] rounded-[var(--cl-r-xl)] px-5 py-4 text-[var(--cl-ink)] placeholder-[var(--cl-muted-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent transition-all group-hover:border-[var(--cl-hairline-strong)]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[var(--cl-body)] mb-3 block">I'm interested in...</label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { label: 'Live Classes', icon: '🎓' },
                        { label: 'Course Builder', icon: '📚' },
                        { label: 'Analytics', icon: '📊' },
                        { label: 'AI Grading', icon: '✨' },
                        { label: 'Student Management', icon: '👥' },
                        { label: 'Custom Solution', icon: '🚀' }
                      ].map((interest) => (
                        <button
                          key={interest.label}
                          type="button"
                          onClick={() => handleInterestToggle(interest.label)}
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                            formData.interests.includes(interest.label)
                              ? 'text-[var(--cl-on-dark)] bg-[var(--cl-primary)]'
                              : 'bg-[var(--cl-canvas-soft)] border-2 border-[var(--cl-hairline)] text-[var(--cl-body)] hover:border-[var(--cl-hairline-strong)]'
                          }`}
                        >
                          <span>{interest.icon}</span>
                          {interest.label}
                          {formData.interests.includes(interest.label) && (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="group">
                    <label className="text-sm font-semibold text-[var(--cl-body)] mb-2 block">Message *</label>
                    <textarea
                      required
                      rows={6}
                      placeholder="Tell us about your needs, questions, or how we can help you transform your educational experience..."
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full bg-[var(--cl-canvas-soft)] border-2 border-[var(--cl-hairline)] rounded-[var(--cl-r-xl)] px-5 py-4 text-[var(--cl-ink)] placeholder-[var(--cl-muted-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent transition-all resize-none group-hover:border-[var(--cl-hairline-strong)]"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="group w-full py-5 text-[var(--cl-on-dark)] rounded-[var(--cl-r-xl)] font-semibold text-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-3 bg-[var(--cl-primary)]"
                  >
                    Send Message
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>

                  <p className="text-sm text-[var(--cl-muted)] text-center">
                    By submitting this form, you agree to our Privacy Policy and Terms of Service.
                  </p>
                </form>
              </div>
            </div>
          </div>

          {/* FAQ or Additional Info */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-semibold text-[var(--cl-ink)] mb-4">Frequently Asked Questions</h2>
            <p className="text-[var(--cl-body)] mb-8">Check out our <Link href="#" className="text-[var(--cl-primary)] hover:text-[var(--cl-primary)] font-semibold">Help Center</Link> for instant answers</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border-2 border-[var(--cl-hairline)] text-left">
                <h3 className="font-semibold text-[var(--cl-ink)] mb-2">Response Time</h3>
                <p className="text-[var(--cl-body)] text-sm">We typically respond within 24 hours on business days.</p>
              </div>
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border-2 border-[var(--cl-hairline)] text-left">
                <h3 className="font-semibold text-[var(--cl-ink)] mb-2">Support Hours</h3>
                <p className="text-[var(--cl-body)] text-sm">Monday - Friday, 9:00 AM - 6:00 PM EST</p>
              </div>
              <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border-2 border-[var(--cl-hairline)] text-left">
                <h3 className="font-semibold text-[var(--cl-ink)] mb-2">Enterprise Inquiries</h3>
                <p className="text-[var(--cl-body)] text-sm">For custom solutions, contact <a href="mailto:enterprise@classera.io" className="text-[var(--cl-primary)] font-semibold">enterprise@classera.io</a></p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
