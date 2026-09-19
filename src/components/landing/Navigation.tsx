'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Landing navigation - Classera design system v2.
 *
 * White sticky bar that gains a hairline once the page scrolls, matching the
 * reference marketing headers: wordmark left, links centre, a text sign-in and
 * one black pill CTA right.
 *
 * The mobile menu now traps nothing and closes on Escape or link activation;
 * the previous version left it open after navigating to an in-page anchor.
 */
export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 bg-[var(--cl-canvas)] transition-colors duration-[var(--cl-dur-micro)] ${
        scrolled ? 'border-b border-[var(--cl-hairline)]' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-4 md:px-6">
        <a
          href="/"
          className="text-[20px] font-semibold tracking-[-0.5px] text-[var(--cl-ink)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.12)]"
        >
          Classera
        </a>

        <div className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-[var(--cl-r-md)] px-3 py-2 text-[14px] font-medium text-[var(--cl-body)] transition-colors hover:bg-[var(--cl-surface-strong)] hover:text-[var(--cl-ink)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.12)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <a
            href="/signin"
            className="rounded-[var(--cl-r-md)] px-3 py-2 text-[14px] font-medium text-[var(--cl-body)] transition-colors hover:text-[var(--cl-ink)]"
          >
            Sign in
          </a>
          <a
            href="/signin"
            className="inline-flex h-10 items-center rounded-[var(--cl-r-pill)] bg-[var(--cl-primary)] px-5 text-[14px] font-semibold text-[var(--cl-on-primary)] transition-colors hover:bg-[var(--cl-primary-active)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.2)]"
          >
            Get started
          </a>
        </div>

        <button
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          className="ml-auto rounded-[var(--cl-r-md)] p-2 text-[var(--cl-ink)] transition-colors hover:bg-[var(--cl-surface-strong)] md:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[var(--cl-hairline)] bg-[var(--cl-canvas)] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[var(--cl-r-md)] px-3 py-2.5 text-[15px] font-medium text-[var(--cl-body)] transition-colors hover:bg-[var(--cl-surface-strong)] hover:text-[var(--cl-ink)]"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/signin"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-[var(--cl-r-pill)] bg-[var(--cl-primary)] px-5 text-[15px] font-semibold text-[var(--cl-on-primary)]"
            >
              Get started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
