'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'test' | 'deadline' | 'meeting' | 'event';
  time?: string;
}

interface RealCalendarProps {
  userId: string;
}

export default function RealCalendar({ userId }: RealCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch tests
      const testsResponse = await fetch('/api/tests');
      const testsData = await testsResponse.json();
      
      const testEvents: CalendarEvent[] = (testsData.tests || [])
        .filter((test: any) => test.scheduled_at)
        .map((test: any) => ({
          id: test.id,
          title: test.title,
          date: test.scheduled_at.split('T')[0],
          type: 'test' as const,
          time: new Date(test.scheduled_at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
        }));

      // Fetch tasks with deadlines
      const tasksResponse = await fetch('/api/tasks');
      const tasksData = await tasksResponse.json();
      
      const taskEvents: CalendarEvent[] = (tasksData.tasks || [])
        .filter((task: any) => task.due_date)
        .map((task: any) => ({
          id: task.id,
          title: task.title,
          date: task.due_date.split('T')[0],
          type: 'deadline' as const,
        }));

      setEvents([...testEvents, ...taskEvents]);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => event.date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const selectedDayEvents = getEventsForDate(selectedDate.getDate());

  return (
    <div className="bg-white rounded-2xl border border-slate-200 h-fit">
      {/* Calendar Header */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePreviousMonth}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-2.5">
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[9px] font-semibold text-slate-400 py-0.5">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }, (_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDate(day);
            const isTodayDate = isToday(day);
            const isSelectedDate = isSelected(day);

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`aspect-square flex flex-col items-center justify-center text-[10px] rounded-md transition-all relative ${
                  isSelectedDate
                    ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white font-bold shadow-md scale-105'
                    : isTodayDate
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>{day}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((event, idx) => (
                      <div
                        key={idx}
                        className={`w-1 h-1 rounded-full ${
                          isSelectedDate || isTodayDate
                            ? 'bg-white'
                            : event.type === 'test'
                            ? 'bg-red-500'
                            : event.type === 'deadline'
                            ? 'bg-orange-500'
                            : 'bg-blue-500'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      <div className="border-t border-slate-200 p-3">
        <div className="text-xs font-semibold text-slate-900 mb-2">
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
        
        {loading ? (
          <div className="space-y-1.5">
            {[1, 2].map((i) => (
              <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : selectedDayEvents.length === 0 ? (
          <div className="text-center py-4 text-slate-400">
            <p className="text-[10px]">No events</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {selectedDayEvents.map((event) => (
              <div
                key={event.id}
                className={`p-2 rounded-lg border ${
                  event.type === 'test'
                    ? 'bg-red-50 border-red-200'
                    : event.type === 'deadline'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-slate-900 truncate">
                      {event.title}
                    </p>
                    {event.time && (
                      <p className="text-[9px] text-slate-600 mt-0.5">
                        {event.time}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${
                      event.type === 'test'
                        ? 'bg-red-200 text-red-700'
                        : event.type === 'deadline'
                        ? 'bg-orange-200 text-orange-700'
                        : 'bg-blue-200 text-blue-700'
                    }`}
                  >
                    {event.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="border-t border-slate-200 p-2.5 bg-slate-50 rounded-b-2xl">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <p className="text-[10px] text-slate-500">Tests</p>
            <p className="text-sm font-bold text-red-600">
              {events.filter(e => e.type === 'test').length}
            </p>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="text-center">
            <p className="text-[10px] text-slate-500">Deadlines</p>
            <p className="text-sm font-bold text-orange-600">
              {events.filter(e => e.type === 'deadline').length}
            </p>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="text-center">
            <p className="text-[10px] text-slate-500">Events</p>
            <p className="text-sm font-bold text-blue-600">
              {events.filter(e => e.type === 'meeting' || e.type === 'event').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
