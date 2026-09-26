import { PageTransition } from '@/components/motion';

/**
 * Dashboard route-segment layout.
 *
 * Applies the Classera design-system surface (see /DESIGN.md) to every route
 * under /dashboard. Scoping the canvas + type here rather than on <body> is
 * what keeps the marketing landing page (/) visually untouched.
 *
 * `PageTransition` gives every dashboard route the same GSAP entrance
 * (a short fade + rise, keyed on the pathname) so individual pages need no
 * motion code of their own. It respects prefers-reduced-motion.
 *
 * Intentionally renders no sidebar: pages under this segment already mount
 * <Sidebar /> themselves, so adding one here would double it.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="cl-app cl-v3">
      <PageTransition>{children}</PageTransition>
    </div>
  );
}
