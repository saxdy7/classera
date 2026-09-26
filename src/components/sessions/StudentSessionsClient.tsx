'use client';

import { useState } from 'react';
import { Video, Calendar as CalendarIcon, Clock, Users, PlayCircle, ExternalLink, Shield, BookOpen, MessageSquare, Radio, ChevronRight, Download } from 'lucide-react';
import Link from 'next/link';
import { downloadICS } from '@/lib/calendar';
import { VideoTransmissionRoom } from './VideoTransmissionRoom';

interface Session {
    id: string;
    title: string;
    description?: string;
    session_type: 'mentor_meeting' | 'proctored_test' | 'group_study' | 'office_hours' | 'webinar';
    status: 'scheduled' | 'live' | 'ongoing' | 'ended' | 'completed' | 'cancelled';
    scheduled_at: string;
    duration_minutes: number;
    room_url?: string;
    /** Returned by /api/sessions (see route.ts) alongside room_url. */
    daily_room_url?: string | null;
    /** Passed straight through to VideoTransmissionRoom. */
    settings?: {
        require_camera?: boolean;
        require_microphone?: boolean;
        enable_chat?: boolean;
        allow_screen_share?: boolean;
    };
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
        bgColor: 'bg-accent-purple/10',
        textColor: 'text-accent-purple',
        borderColor: 'border-accent-purple',
    },
    proctored_test: {
        icon: Shield,
        color: 'red',
        label: 'Proctored Test',
        bgColor: 'bg-destructive/10',
        textColor: 'text-destructive',
        borderColor: 'border-destructive',
    },
    group_study: {
        icon: Users,
        color: 'green',
        label: 'Group Study',
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-600',
        borderColor: 'border-green-600',
    },
    office_hours: {
        icon: Clock,
        color: 'amber',
        label: 'Office Hours',
        bgColor: 'bg-amber-500/10',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-500',
    },
    webinar: {
        icon: Radio,
        color: 'purple',
        label: 'Webinar',
        bgColor: 'bg-accent-purple/10',
        textColor: 'text-accent-purple',
        borderColor: 'border-accent-purple',
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

function SessionCard({ session, isLive = false, onJoinVideo }: { session: Session; isLive?: boolean; onJoinVideo?: (session: Session) => void }) {
    const config = sessionTypeConfig[session.session_type] ?? sessionTypeConfig['mentor_meeting'];
    const Icon = config.icon;

    const handleJoin = () => {
        if (onJoinVideo) {
            onJoinVideo(session);
        } else {
            // Fallback to opening in new window
            const url = session.room_url ||
                `https://meet.jit.si/classera-${session.id.replace(/-/g, '').slice(0, 16)}`;
            window.open(url, '_blank');
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
        <div className={`bg-card rounded-lg border ${isLive ? 'border-green-600 ring-2 ring-[var(--cl-success)]' : 'border-border'} p-6 hover:shadow-md transition-all`}>
            {isLive && (
                <div className="flex items-center gap-2 mb-4">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-600 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
                    </span>
                    <span className="text-sm font-medium text-green-600">Live Now</span>
                </div>
            )}

            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${config.textColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-foreground mb-1">{session.title}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${config.bgColor} ${config.textColor}`}>
                                {config.label}
                            </span>
                        </div>

                        {!isLive && (
                            <span className="text-sm text-muted-foreground flex-shrink-0">
                                {getTimeUntil(session.scheduled_at)}
                            </span>
                        )}
                    </div>

                    {session.description && (
                        <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{session.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
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
                            <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-foreground/80">
                                    {session.host?.full_name?.charAt(0) ?? '?'}
                                </span>
                            </div>
                        )}
                        <span className="text-sm text-foreground/80">Hosted by {session.host?.full_name ?? 'Unknown'}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {session.session_type === 'proctored_test' && session.linked_test_id ? (
                        <Link
                            href={`/dashboard/student/tests/${session.linked_test_id}/take`}
                            className="flex items-center gap-2 text-sm text-accent-purple hover:text-accent-purple"
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
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground/80 hover:text-accent-purple border border-border hover:border-accent-purple rounded-lg transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Add to Calendar
                        </button>
                    )}
                </div>

                {(isLive || session.status === 'live') ? (
                    <button
                        onClick={handleJoin}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        <PlayCircle className="w-4 h-4" />
                        Join Session
                        <ExternalLink className="w-3 h-3" />
                    </button>
                ) : getTimeUntil(session.scheduled_at) === 'Started' ? (
                    <button
                        onClick={handleJoin}
                        className="flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple transition-colors"
                    >
                        <Video className="w-4 h-4" />
                        Join Now
                    </button>
                ) : (
                    <span className="text-sm text-muted-foreground">
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
    const [activeVideoRoom, setActiveVideoRoom] = useState<Session | null>(null);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Live Sessions</h1>
                <p className="text-foreground/80 mt-2">Join live sessions, webinars, and proctored tests</p>
            </div>

            {/* Live Sessions Banner */}
            {liveSessions.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-600 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
                        </span>
                        <h2 className="text-lg font-semibold text-foreground">Live Now</h2>
                        <span className="text-sm text-muted-foreground">({liveSessions.length} session{liveSessions.length > 1 ? 's' : ''})</span>
                    </div>

                    <div className="space-y-4">
                        {liveSessions.map((session) => (
                            <SessionCard key={session.id} session={session} isLive onJoinVideo={setActiveVideoRoom} />
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="mb-6 flex w-fit items-center gap-1 rounded border border-border/40 bg-muted p-1">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`cursor-pointer rounded-sm px-6 py-1.5 text-sm font-medium transition-colors ${activeTab === 'upcoming'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Upcoming ({upcomingSessions.length})
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`cursor-pointer rounded-sm px-6 py-1.5 text-sm font-medium transition-colors ${activeTab === 'past'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
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
                                <SessionCard key={session.id} session={session} onJoinVideo={setActiveVideoRoom} />
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CalendarIcon className="w-8 h-8 text-muted-foreground/70" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground mb-2">No Upcoming Sessions</h3>
                                <p className="text-foreground/80">
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
                                <SessionCard key={session.id} session={session} onJoinVideo={setActiveVideoRoom} />
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Video className="w-8 h-8 text-muted-foreground/70" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground mb-2">No Past Sessions</h3>
                                <p className="text-foreground/80">
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
                    className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border hover:border-accent-purple transition-all group"
                >
                    <div className="w-12 h-12 bg-accent-purple/10 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-accent-purple" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium text-foreground group-hover:text-accent-purple">Available Tests</h3>
                        <p className="text-sm text-foreground/80">View and take available tests</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/70 group-hover:text-accent-purple" />
                </Link>

                <Link
                    href="/dashboard/student/messages"
                    className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border hover:border-accent-purple transition-all group"
                >
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium text-foreground group-hover:text-accent-purple">Message Mentor</h3>
                        <p className="text-sm text-foreground/80">Request a session from your mentor</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/70 group-hover:text-accent-purple" />
                </Link>
            </div>

            {/* Active Video Room */}
            {activeVideoRoom && (
                <VideoTransmissionRoom
                    roomUrl={activeVideoRoom.daily_room_url || activeVideoRoom.room_url}
                    sessionTitle={activeVideoRoom.title}
                    sessionId={activeVideoRoom.id}
                    userId={profile.id}
                    userName={profile.full_name}
                    mentorName={activeVideoRoom.host?.full_name || 'Mentor'}
                    mentorAvatar={activeVideoRoom.host?.avatar_url}
                    onExit={() => setActiveVideoRoom(null)}
                    settings={activeVideoRoom.settings}
                />
            )}
        </div>
    );
}
