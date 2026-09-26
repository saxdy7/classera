'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePathname } from 'next/navigation';

/**
 * GSAP motion layer for the product surface.
 *
 * The reference repos (aria, looma) animate with framer-motion; this project
 * already depends on GSAP, so the same vocabulary is expressed with it:
 *   - page content rises and fades on mount
 *   - grids/lists stagger their children
 *   - long pages reveal sections on scroll
 *
 * Rules kept from the design system: motion is short (0.35–0.6s), eased with
 * `power3.out` (the Vercel-style ease the references use), transform+opacity
 * only, and fully disabled under `prefers-reduced-motion`.
 *
 * Every component here is a client boundary that renders a plain wrapper, so it
 * can wrap server-rendered children without making them client components.
 */

let registered = false;
function ensureGsap() {
  if (!registered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
}

const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fade + rise the wrapper once on mount. Re-runs on route change. */
export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ensureGsap();
    const el = ref.current;
    if (!el) return;
    if (reduced()) {
      gsap.set(el, { clearProps: 'all', opacity: 1, y: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        { opacity: 1, y: 0, duration: 0.5, delay, ease: 'power3.out', clearProps: 'transform' },
      );
    }, el);
    return () => ctx.revert();
  }, [pathname, delay, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * Stagger the wrapper's direct children — the card-grid entrance looma uses.
 * `selector` narrows which descendants animate when the children are nested.
 */
export function Stagger({
  children,
  className,
  delay = 0.05,
  each = 0.05,
  y = 16,
  selector,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  each?: number;
  y?: number;
  selector?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ensureGsap();
    const el = ref.current;
    if (!el) return;
    const targets = selector
      ? el.querySelectorAll(selector)
      : (Array.from(el.children) as Element[]);
    if (!targets || (targets as ArrayLike<Element>).length === 0) return;

    if (reduced()) {
      gsap.set(targets, { clearProps: 'all', opacity: 1, y: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          delay,
          ease: 'power3.out',
          stagger: each,
          clearProps: 'transform',
        },
      );
    }, el);
    return () => ctx.revert();
  }, [pathname, delay, each, y, selector]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Reveal on scroll — for sections far down a long page. */
export function ScrollReveal({
  children,
  className,
  y = 24,
  stagger,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  /** When set, staggers direct children instead of the wrapper. */
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ensureGsap();
    const el = ref.current;
    if (!el) return;
    if (reduced()) return;

    const targets = stagger ? (Array.from(el.children) as Element[]) : [el];
    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: 'power3.out',
          stagger: stagger ?? 0,
          clearProps: 'transform',
          scrollTrigger: {
            trigger: el,
            // Fire a little before the block reaches the fold.
            start: 'top 88%',
            once: true,
          },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [pathname, y, stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * Count a number up to its value. Used on stat tiles, where a figure landing
 * with the card reads as live data rather than a static label.
 */
export function CountUp({
  value,
  className,
  duration = 0.9,
  suffix = '',
}: {
  value: number;
  className?: string;
  duration?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced() || !Number.isFinite(value)) {
      el.textContent = `${value}${suffix}`;
      return;
    }
    const obj = { n: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        n: value,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = `${Math.round(obj.n)}${suffix}`;
        },
      });
    }, el);
    return () => ctx.revert();
  }, [value, duration, suffix]);

  return <span ref={ref} className={className}>0{suffix}</span>;
}

/**
 * Page-level entrance for the whole main column. Mounted once per route by the
 * dashboard layout wrapper, so individual pages need no motion code at all.
 */
export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ensureGsap();
    const el = ref.current;
    if (!el) return;
    if (reduced()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out', clearProps: 'transform' },
      );
    }, el);
    return () => ctx.revert();
  }, [pathname]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
