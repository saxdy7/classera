/**
 * onboarding route-segment layout.
 *
 * Applies the Classera design-system surface (see /DESIGN.md). Scoped per
 * segment rather than on <body> so the marketing landing page (/) is untouched.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="cl-app cl-v3">{children}</div>;
}
