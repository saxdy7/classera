import CalendarWidget from '@/components/calendar/CalendarWidget';

export default function StudentCalendarPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Calendar
        </h1>
        <p className="text-foreground/80 mt-2">View your schedule and upcoming events</p>
      </div>
      <CalendarWidget />
    </div>
  );
}
