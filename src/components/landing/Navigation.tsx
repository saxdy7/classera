'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-4 md:px-6 py-6 transition-all duration-500 ease-out animate-fade-in-up">
      <div
        className={`max-w-7xl mx-auto bg-white/80 backdrop-blur-md border border-slate-100 rounded-full px-4 md:px-6 py-4 flex justify-between items-center transition-all duration-500 ease-out ${
          scrollY > 50 ? 'shadow-2xl bg-white/95 py-3' : 'shadow-sm'
        }`}
      >
        {/* Logo */}
        <a href="#" className="text-2xl font-semibold tracking-tighter flex items-center gap-2">
          
          Classera
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center">
          <a href="#work" className="text-sm font-medium hover:text-fuchsia-600 transition-colors">
            Features
          </a>
          <a href="#services" className="text-sm font-medium hover:text-fuchsia-600 transition-colors">
            Services
          </a>
          <a href="/contact" className="text-sm font-medium hover:text-fuchsia-600 transition-colors">
            Contact
          </a>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex gap-3 items-center">
          <a
            href="/signin"
            className="px-6 py-2.5 border-2 border-black text-black rounded-full text-sm font-medium hover:bg-black hover:text-white transition-all duration-300"
          >
            Sign In
          </a>
          <a
            href="#contact"
            className="group relative px-6 py-2.5 bg-black text-white rounded-full text-sm font-medium overflow-hidden hover:scale-105 transition-transform"
          >
            <span className="relative z-10">Let&apos;s Talk</span>
            <div className="absolute inset-0 bg-fuchsia-500 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out"></div>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 hover:bg-slate-100 rounded-full transition-colors"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-24 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col gap-3">
            <a 
              href="#work" 
              onClick={closeMobileMenu}
              className="px-4 py-3 text-sm font-medium hover:bg-slate-100 hover:text-fuchsia-600 rounded-lg transition-colors"
            >
              Features
            </a>
            <a 
              href="#services" 
              onClick={closeMobileMenu}
              className="px-4 py-3 text-sm font-medium hover:bg-slate-100 hover:text-fuchsia-600 rounded-lg transition-colors"
            >
              Services
            </a>
            <a 
              href="/contact" 
              onClick={closeMobileMenu}
              className="px-4 py-3 text-sm font-medium hover:bg-slate-100 hover:text-fuchsia-600 rounded-lg transition-colors"
            >
              Contact
            </a>
            <hr className="my-2" />
            <a
              href="/signin"
              onClick={closeMobileMenu}
              className="px-4 py-3 border-2 border-black text-black rounded-lg text-sm font-medium hover:bg-black hover:text-white transition-all text-center"
            >
              Sign In
            </a>
            <a
              href="#contact"
              onClick={closeMobileMenu}
              className="px-4 py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-fuchsia-600 transition-all text-center"
            >
              Let&apos;s Talk
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
