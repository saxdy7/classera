'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'test' | 'deadline' | 'event' | 'meeting';
  color: string;
  time?: string;
  description?: string;
}

export default function CalendarWidget() {
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
      const response = await fetch('/api/tests');
      const data = await response.json();

      const testEvents: CalendarEvent[] = (data.tests || [])
        .filter((test: any) => test.scheduled_at)
        .map((test: any) => ({
          id: test.id,
          title: test.title,
          date: new Date(test.scheduled_at),
          type: 'test',
          color: 'bg-[var(--cl-error)]',
          time: format(new Date(test.scheduled_at), 'HH:mm'),
          description: `Test • ${test.duration_minutes || 60} minutes`,
        }));

      // Fetch tasks with deadlines
      const tasksResponse = await fetch('/api/tasks');
      const tasksData = await tasksResponse.json();

      const taskEvents: CalendarEvent[] = (tasksData.tasks || [])
        .filter((task: any) => task.due_date)
        .map((task: any) => ({
          id: task.id,
          title: task.title,
          date: new Date(task.due_date),
          type: 'deadline',
          color: 'bg-[var(--cl-warning)]',
          description: `Task Deadline`,
        }));

      setEvents([...testEvents, ...taskEvents]);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the start of the month to align with the correct day of the week
  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array(startDayOfWeek).fill(null);

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(event.date, date));
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const dayEvents = getEventsForDate(selectedDate);

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--cl-ink)]">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={handleToday}>
              Today
            </Button>
            <Button size="sm" variant="ghost" onClick={handlePreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-[var(--cl-muted)] py-2"
            >
              {day}
            </div>
          ))}

          {/* Padding Days */}
          {paddingDays.map((_, index) => (
            <div key={`padding-${index}`} className="aspect-square" />
          ))}

          {/* Calendar Days */}
          {daysInMonth.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square p-1 rounded-lg text-sm transition-colors ${
                  !isSameMonth(day, currentDate)
                    ? 'text-[var(--cl-muted-soft)]'
                    : isSelected
                    ? 'bg-[var(--cl-primary)] text-[var(--cl-on-dark)] font-semibold'
                    : isCurrentDay
                    ? 'bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] font-semibold'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span>{format(day, 'd')}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex space-x-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((event, idx) => (
                        <div
                          key={idx}
                          className={`w-1 h-1 rounded-full ${
                            isSelected ? 'bg-[var(--cl-surface-card)]' : event.color
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Day Events */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--cl-ink)]">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h3>
          <Button size="sm" variant="ghost">
            <Plus className="w-4 h-4 mr-1" />
            Add Event
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-[var(--cl-surface-strong)] rounded animate-pulse" />
            ))}
          </div>
        ) : dayEvents.length === 0 ? (
          <div className="text-center py-8 text-[var(--cl-muted)]">
            <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-[var(--cl-muted-soft)]" />
            <p>No events scheduled</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-[var(--cl-canvas-soft)] transition-colors cursor-pointer"
              >
                <div className={`w-3 h-3 rounded-full ${event.color} mt-1.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[var(--cl-ink)] truncate">{event.title}</h4>
                  {event.description && (
                    <p className="text-sm text-[var(--cl-body)]">{event.description}</p>
                  )}
                  {event.time && (
                    <div className="flex items-center text-sm text-[var(--cl-muted)] mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {event.time}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Event Legend */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-[var(--cl-body)] mb-3">Event Types</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[var(--cl-error)]" />
            <span className="text-sm text-[var(--cl-body)]">Tests</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[var(--cl-warning)]" />
            <span className="text-sm text-[var(--cl-body)]">Deadlines</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[var(--cl-info)]" />
            <span className="text-sm text-[var(--cl-body)]">Meetings</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[var(--cl-success)]" />
            <span className="text-sm text-[var(--cl-body)]">Events</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
