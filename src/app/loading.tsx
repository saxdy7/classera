/**
 * Route-level loading state - Classera design system v2.
 *
 * Replaces the original dark slate/purple screen with a light one that matches
 * the rest of the app. The previous version also stacked four blurred, infinitely
 * pulsing blobs plus two counter-rotating rings - a lot of continuous compositing
 * for a screen that should be brief - and its spinner used a raw `pink-500`
 * that no longer exists in the palette.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <div className="text-center">
        <div className="relative mx-auto mb-6 h-12 w-12">
          <div className="absolute inset-0 rounded-full border-[3px] border-border" />
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-accent-purple [animation-duration:800ms] motion-reduce:animate-none" />
        </div>

        <p className="text-[15px] font-medium text-foreground">Classera</p>
        <p className="mt-1 text-[13px] text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
