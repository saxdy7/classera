/** aria-hackathon `home/page.tsx` — time-of-day greeting. */
export function getGreeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
