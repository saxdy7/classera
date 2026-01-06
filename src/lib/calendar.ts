/**
 * Calendar Integration Utilities
 * Generate .ics files for sessions to add to Google Calendar, Outlook, etc.
 */

export interface CalendarEvent {
    title: string;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    url?: string;
}

/**
 * Format date to ICS format: YYYY MM DD T HH mm ss Z
 * Example: 20260105T143000Z
 */
function formatICSDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');

    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hours = pad(date.getUTCHours());
    const minutes = pad(date.getUTCMinutes());
    const seconds = pad(date.getUTCSeconds());

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate ICS file content for a session
 */
export function generateICS(event: CalendarEvent): string {
    const now = new Date();
    const startDate = formatICSDate(event.startTime);
    const endDate = formatICSDate(event.endTime);
    const timestamp = formatICSDate(now);

    // Escape special characters in text fields
    const escapeText = (text: string) => {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n');
    };

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Classera//Live Sessions//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${timestamp}@classera.app`,
        `DTSTAMP:${timestamp}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${escapeText(event.title)}`,
        event.description ? `DESCRIPTION:${escapeText(event.description)}` : '',
        event.location ? `LOCATION:${escapeText(event.location)}` : '',
        event.url ? `URL:${event.url}` : '',
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'DESCRIPTION:Session starts in 15 minutes',
        'ACTION:DISPLAY',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ]
        .filter(line => line !== '') // Remove empty lines
        .join('\r\n');

    return icsContent;
}

/**
 * Download ICS file
 */
export function downloadICS(event: CalendarEvent, filename: string = 'session.ics'): void {
    const icsContent = generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}
