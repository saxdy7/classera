/**
 * Dashboard route-segment layout.
 *
 * Applies the Classera design-system surface (see /DESIGN.md) to every route
 * under /dashboard. Scoping the canvas + type here rather than on <body> is
 * what keeps the marketing landing page (/) visually untouched.
 *
 * Intentionally renders no sidebar: pages under this segment already mount
 * <Sidebar /> themselves, so adding one here would double it.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="cl-app cl-v3">{children}</div>;
}
