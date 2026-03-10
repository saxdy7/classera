'use client';

import { useState } from 'react';
import { Video, Calendar as CalendarIcon, Clock, Users, PlayCircle, ExternalLink, Shield, BookOpen, MessageSquare, Radio, ChevronRight, Download } from 'lucide-react';
import Link from 'next/link';
import { downloadICS } from '@/lib/calendar';

interface Session {
    id: string;
    title: string;
    description?: string;
    session_type: 'mentor_meeting' | 'proctored_test' | 'group_study' | 'office_hours' | 'webinar';
    status: 'scheduled' | 'live' | 'ongoing' | 'ended' | 'completed' | 'cancelled';
    scheduled_at: string;
    duration_minutes: number;
    room_url?: string;
    host: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
    linked_test_id?: string;
}

interface StudentSessionsClientProps {
    profile: any;
    upcomingSessions: Session[];
    liveSessions: Session[];
    pastSessions: Session[];
}

const sessionTypeConfig = {
    mentor_meeting: {
        icon: MessageSquare,
        color: 'blue',
        label: '1:1 Meeting',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200',
    },
    proctored_test: {
        icon: Shield,
        color: 'red',
        label: 'Proctored Test',
        bgColor: 'bg-red-50',
        textColor: 'text-red-600',
        borderColor: 'border-red-200',
    },
    group_study: {
        icon: Users,
        color: 'green',
        label: 'Group Study',
        bgColor: 'bg-green-50',
        textColor: 'text-green-600',
        borderColor: 'border-green-200',
    },
    office_hours: {
        icon: Clock,
        color: 'amber',
        label: 'Office Hours',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-200',
    },
    webinar: {
        icon: Radio,
        color: 'purple',
        label: 'Webinar',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-600',
        borderColor: 'border-purple-200',
    },
};

function formatDateTime(date: string) {
    return new Date(date).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

function getTimeUntil(date: string) {
    const now = new Date();
    const target = new Date(date);
    const diff = target.getTime() - now.getTime();

    if (diff < 0) return 'Started';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
}

function SessionCard({ session, isLive = false }: { session: Session; isLive?: boolean }) {
    const config = sessionTypeConfig[session.session_type] ?? sessionTypeConfig['mentor_meeting'];
    const Icon = config.icon;


    const handleJoin = () => {
        if (session.room_url) {
            window.open(session.room_url, '_blank');
        }
    };

    const handleAddToCalendar = () => {
        const startTime = new Date(session.scheduled_at);
        const endTime = new Date(startTime.getTime() + session.duration_minutes * 60000);

        downloadICS({
            title: session.title,
            description: `${session.description || ''}\n\nType: ${config.label}\nHosted by: ${session.host?.full_name ?? ''}`,
            location: session.room_url || 'Online',
            startTime,
            endTime,
            url: session.room_url
        }, `${session.title.replace(/\s+/g, '-').toLowerCase()}.ics`);
    };

    return (
        <div className={`bg-white rounded-xl border ${isLive ? 'border-green-300 ring-2 ring-green-100' : 'border-slate-200'} p-6 hover:shadow-md transition-all`}>
            {isLive && (
                <div className="flex items-center gap-2 mb-4">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-medium text-green-600">Live Now</span>
                </div>
            )}

            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${config.textColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-1">{session.title}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${config.bgColor} ${config.textColor}`}>
                                {config.label}
                            </span>
                        </div>

                        {!isLive && (
                            <span className="text-sm text-slate-500 flex-shrink-0">
                                {getTimeUntil(session.scheduled_at)}
                            </span>
                        )}
                    </div>

                    {session.description && (
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{session.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {formatDateTime(session.scheduled_at)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {session.duration_minutes} min
                        </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                        {session.host?.avatar_url ? (
                            <img
                                src={session.host.avatar_url}
                                alt={session.host?.full_name ?? ''}
                                className="w-6 h-6 rounded-full"
                            />
                        ) : (
                            <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-slate-600">
                                    {session.host?.full_name?.charAt(0) ?? '?'}
                                </span>
                            </div>
                        )}
                        <span className="text-sm text-slate-600">Hosted by {session.host?.full_name ?? 'Unknown'}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {session.session_type === 'proctored_test' && session.linked_test_id ? (
                        <Link
                            href={`/dashboard/student/tests/${session.linked_test_id}/take`}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                            <BookOpen className="w-4 h-4" />
                            View Test
                        </Link>
                    ) : (
                        <div />
                    )}

                    {!isLive && session.status === 'scheduled' && (
                        <button
                            onClick={handleAddToCalendar}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Add to Calendar
                        </button>
                    )}
                </div>

                {(isLive || session.status === 'live') && session.room_url ? (
                    <button
                        onClick={handleJoin}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <PlayCircle className="w-4 h-4" />
                        Join Session
                        <ExternalLink className="w-3 h-3" />
                    </button>
                ) : session.room_url && getTimeUntil(session.scheduled_at) === 'Started' ? (
                    <button
                        onClick={handleJoin}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Video className="w-4 h-4" />
                        Join Now
                    </button>
                ) : (
                    <span className="text-sm text-slate-500">
                        Starts in {getTimeUntil(session.scheduled_at)}
                    </span>
                )}
            </div>
        </div>
    );
}

export function StudentSessionsClient({
    profile,
    upcomingSessions,
    liveSessions,
    pastSessions
}: StudentSessionsClientProps) {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Live Sessions</h1>
                <p className="text-slate-600 mt-2">Join live sessions, webinars, and proctored tests</p>
            </div>

            {/* Live Sessions Banner */}
            {liveSessions.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <h2 className="text-lg font-semibold text-slate-900">Live Now</h2>
                        <span className="text-sm text-slate-500">({liveSessions.length} session{liveSessions.length > 1 ? 's' : ''})</span>
                    </div>

                    <div className="space-y-4">
                        {liveSessions.map((session) => (
                            <SessionCard key={session.id} session={session} isLive />
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-4 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'upcoming'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Upcoming ({upcomingSessions.length})
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'past'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Past ({pastSessions.length})
                </button>
            </div>

            {/* Session List */}
            <div className="space-y-4">
                {activeTab === 'upcoming' && (
                    <>
                        {upcomingSessions.length > 0 ? (
                            upcomingSessions.map((session) => (
                                <SessionCard key={session.id} session={session} />
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CalendarIcon className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">No Upcoming Sessions</h3>
                                <p className="text-slate-600">
                                    You don't have any scheduled sessions. Check back later or ask your mentor to schedule one.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'past' && (
                    <>
                        {pastSessions.length > 0 ? (
                            pastSessions.map((session) => (
                                <SessionCard key={session.id} session={session} />
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Video className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">No Past Sessions</h3>
                                <p className="text-slate-600">
                                    You haven't attended any sessions yet.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Quick Links */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    href="/dashboard/student/tests"
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium text-slate-900 group-hover:text-blue-600">Available Tests</h3>
                        <p className="text-sm text-slate-600">View and take available tests</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                </Link>

                <Link
                    href="/dashboard/student/messages"
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium text-slate-900 group-hover:text-blue-600">Message Mentor</h3>
                        <p className="text-sm text-slate-600">Request a session from your mentor</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                </Link>
            </div>
        </div>
    );
}
