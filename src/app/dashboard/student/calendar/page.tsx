import CalendarWidget from '@/components/calendar/CalendarWidget';

export default function StudentCalendarPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Calendar
        </h1>
        <p className="text-gray-600 mt-2">View your schedule and upcoming events</p>
      </div>
      <CalendarWidget />
    </div>
  );
}
