import CalendarWidget from '@/components/calendar/CalendarWidget';

export default function StudentCalendarPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-[var(--cl-ink)]">
          Calendar
        </h1>
        <p className="text-[var(--cl-body)] mt-2">View your schedule and upcoming events</p>
      </div>
      <CalendarWidget />
    </div>
  );
}
