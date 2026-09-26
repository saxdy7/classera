'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Video,
  Users,
  Calendar,
  Clock,
  Play,
  X,
  CheckCircle,
  FileText,
  Shield,
  Mic,
  MonitorPlay,
  Search
} from 'lucide-react';
import { MentorSessionPlayer } from './MentorSessionPlayer';

interface Session {
  id: string;
  title: string;
  description: string | null;
  session_type: 'mentor_meeting' | 'proctored_test' | 'group_study' | 'office_hours' | 'webinar';
  scheduled_at: string;
  duration_minutes: number;
  daily_room_url: string | null;
  status: 'scheduled' | 'live' | 'ongoing' | 'completed' | 'cancelled';
  test?: { id: string; title: string } | null;
  participants: any[];
  settings?: any;
}

interface LiveSessionsClientProps {
  profile: any;
  initialSessions: Session[];
  students: { id: string; full_name: string; avatar_url: string | null; email: string }[];
  tests: { id: string; title: string; duration_minutes: number }[];
}

export function LiveSessionsClient({ profile, initialSessions, students, tests }: LiveSessionsClientProps) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeSessionInPlayer, setActiveSessionInPlayer] = useState<Session | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    session_type: 'mentor_meeting' as Session['session_type'],
    scheduled_at: '',
    duration_minutes: 60,
    test_id: '',
    participant_ids: [] as string[],
    settings: {
      waiting_room: true,
      record_session: false,
      require_camera: false,
      require_microphone: false,
      allow_screen_share: true,
      chat_enabled: true,
    },
  });

  const sessionTypeLabels: Record<Session['session_type'], { label: string; icon: any; color: string }> = {
    mentor_meeting: { label: 'Mentor Meeting', icon: Video, color: 'indigo' },
    proctored_test: { label: 'Proctored Test', icon: Shield, color: 'red' },
    group_study: { label: 'Group Study', icon: Users, color: 'green' },
    office_hours: { label: 'Office Hours', icon: Clock, color: 'amber' },
    webinar: { label: 'Webinar', icon: MonitorPlay, color: 'purple' },
  };

  const handleCreateSession = async () => {
    if (!formData.title || !formData.scheduled_at) {
      alert('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session');
      }

      // Re-fetch to get session with full joins (participants, test)
      await fetchSessions();
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (session: Session) => {
    setLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id, action: 'start' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Preserve join data (participants, test) — PATCH response has no joins
      setSessions(sessions.map(s =>
        s.id === session.id
          ? { ...data.session, participants: s.participants, test: s.test }
          : s
      ));

      // Open video room — use updated URL from response, fall back to Jitsi
      const roomUrl =
        data.session.daily_room_url ||
        data.session.meeting_url ||
        session.daily_room_url;
      const jitsiUrl = `https://meet.jit.si/classera-${session.id.replace(/-/g, '').slice(0, 16)}`;
      window.open(roomUrl || jitsiUrl, '_blank');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async (session: Session) => {
    if (!confirm('Are you sure you want to end this session?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id, action: 'end' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Preserve join data (participants, test) — PATCH response has no joins
      setSessions(sessions.map(s =>
        s.id === session.id
          ? { ...data.session, participants: s.participants, test: s.test }
          : s
      ));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSession = async () => {
    if (!editingSession || !formData.title || !formData.scheduled_at) {
      alert('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: editingSession.id,
          title: formData.title,
          description: formData.description,
          scheduled_at: formData.scheduled_at,
          duration_minutes: formData.duration_minutes,
          settings: formData.settings
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update session');
      }

      await fetchSessions();
      setShowEditModal(false);
      setEditingSession(null);
      resetForm();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async (session: Session) => {
    if (!confirm('Are you sure you want to cancel this session? All participants will be notified.')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id, action: 'cancel' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Preserve join data (participants, test) — PATCH response has no joins
      setSessions(sessions.map(s =>
        s.id === session.id
          ? { ...data.session, participants: s.participants, test: s.test }
          : s
      ));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (session: Session) => {
    setEditingSession(session);

    // Extract participant IDs - handle both nested structure and direct IDs
    const participantIds = session.participants?.map((p: any) => {
      // If participant has user object (from JOIN), get user.id
      if (p.user?.id) return p.user.id;
      // If participant has user_id directly
      if (p.user_id) return p.user_id;
      // Fallback to id
      return p.id;
    }).filter(Boolean) || [];

    // Convert stored UTC time to local time for the datetime-local input
    const d = new Date(session.scheduled_at);
    const pad = (n: number) => String(n).padStart(2, '0');
    const localDatetime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setFormData({
      title: session.title,
      description: session.description || '',
      session_type: (session.session_type || 'mentor_meeting') as Session['session_type'],
      scheduled_at: localDatetime,
      duration_minutes: session.duration_minutes,
      test_id: session.test?.id || '',
      participant_ids: participantIds,
      settings: session.settings || {
        waiting_room: true,
        record_session: false,
        require_camera: false,
        require_microphone: false,
        allow_screen_share: true,
        chat_enabled: true,
      },
    });
    setShowEditModal(true);
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const { sessions: fetched } = await res.json();
        setSessions(fetched || []);
      }
    } catch (e) {
      console.error('Failed to refresh sessions', e);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      session_type: 'mentor_meeting',
      scheduled_at: '',
      duration_minutes: 60,
      test_id: '',
      participant_ids: [],
      settings: {
        waiting_room: true,
        record_session: false,
        require_camera: false,
        require_microphone: false,
        allow_screen_share: true,
        chat_enabled: true,
      },
    });
  };

  const toggleParticipant = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      participant_ids: prev.participant_ids.includes(studentId)
        ? prev.participant_ids.filter(id => id !== studentId)
        : [...prev.participant_ids, studentId],
    }));
  };

  // Filter sessions based on search and type filter
  const filterSessions = (sessionList: Session[]) => {
    return sessionList.filter(s => {
      const matchesSearch = !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = filterType === 'all' || s.session_type === filterType;

      return matchesSearch && matchesType;
    });
  };

  // Real-time updates for sessions
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_sessions',
          filter: `mentor_id=eq.${profile.id}`
        },
        async (payload) => {
          console.log('Session change detected:', payload);

          if (payload.eventType === 'INSERT' && payload.new) {
            // Only add if not already present (fetchSessions may have already added it)
            setSessions(prev => {
              if (prev.find(s => s.id === (payload.new as any).id)) return prev;
              return [...prev, payload.new as Session];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Preserve join data — realtime payload has no joins
            setSessions(prev => prev.map(s =>
              s.id === (payload.new as any).id
                ? { ...(payload.new as Session), participants: s.participants, test: s.test }
                : s
            ));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setSessions(prev => prev.filter(s => s.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id]);

  // Sessions are "still live" within scheduled_at + duration + 60 min grace period
  const isStillLive = (s: Session) =>
    Date.now() < new Date(s.scheduled_at).getTime() + (s.duration_minutes + 60) * 60000;

  const upcomingSessions = filterSessions(sessions.filter(s => s.status === 'scheduled'));
  const liveSessions = filterSessions(
    sessions.filter(s => (s.status === 'live' || s.status === 'ongoing') && isStillLive(s))
  );
  const pastSessions = filterSessions(
    sessions.filter(s =>
      s.status === 'completed' || s.status === 'cancelled' ||
      ((s.status === 'live' || s.status === 'ongoing') && !isStillLive(s))
    )
  );

  // Auto-end sessions that ran past their duration + grace period (runs once on mount)
  useEffect(() => {
    const expired = sessions.filter(
      s => (s.status === 'live' || s.status === 'ongoing') &&
           Date.now() >= new Date(s.scheduled_at).getTime() + (s.duration_minutes + 60) * 60000
    );
    if (expired.length === 0) return;
    // Optimistically update local state immediately
    setSessions(prev => prev.map(s =>
      expired.some(e => e.id === s.id) ? { ...s, status: 'completed' as const } : s
    ));
    // Persist to DB
    expired.forEach(s => {
      fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: s.id, action: 'end' }),
      }).catch(() => {});
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Live Sessions</h1>
          <p className="text-foreground/80">Schedule and manage live meetings, proctored tests, and more</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-all bg-primary"
        >
          <Plus className="w-5 h-5" />
          Schedule Session
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
          <input
            type="text"
            placeholder="Search sessions by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple bg-card"
        >
          <option value="all">All Types</option>
          <option value="mentor_meeting">Mentor Meetings</option>
          <option value="proctored_test">Proctored Tests</option>
          <option value="group_study">Group Study</option>
          <option value="office_hours">Office Hours</option>
          <option value="webinar">Webinars</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground/80">Total Sessions</span>
            <Calendar className="w-5 h-5 text-accent-purple" />
          </div>
          <p className="text-3xl font-semibold text-foreground">{sessions.length}</p>
        </div>

        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground/80">Live Now</span>
            <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse" />
          </div>
          <p className="text-3xl font-semibold text-green-600">{liveSessions.length}</p>
        </div>

        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground/80">Upcoming</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-semibold text-amber-600">{upcomingSessions.length}</p>
        </div>

        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground/80">Completed</span>
            <CheckCircle className="w-5 h-5 text-muted-foreground/70" />
          </div>
          <p className="text-3xl font-semibold text-foreground/80">{pastSessions.length}</p>
        </div>
      </div>

      {/* Live Sessions */}
      {liveSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
            Live Now
          </h2>
          <div className="grid gap-4">
            {liveSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                typeInfo={sessionTypeLabels[session.session_type] || sessionTypeLabels['mentor_meeting']}
                onStart={handleStartSession}
                onEnd={handleEndSession}
                onJoin={setActiveSessionInPlayer}
                isLive
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Upcoming Sessions</h2>
          <div className="grid gap-4">
            {upcomingSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                typeInfo={sessionTypeLabels[session.session_type] || sessionTypeLabels['mentor_meeting']}
                onStart={handleStartSession}
                onEnd={handleEndSession}
                onEdit={openEditModal}
                onCancel={handleCancelSession}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Past Sessions</h2>
          <div className="grid gap-4">
            {pastSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                typeInfo={sessionTypeLabels[session.session_type] || sessionTypeLabels['mentor_meeting']}
                onStart={handleStartSession}
                onEnd={handleEndSession}
                isPast
              />
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="bg-card rounded-xl p-16 text-center border border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-muted-foreground/70" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No sessions yet</h3>
          <p className="text-foreground/80 mb-6">Schedule your first live session to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium bg-primary"
          >
            <Plus className="w-5 h-5" />
            Schedule Session
          </button>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Schedule New Session</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Session Type */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Session Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(sessionTypeLabels).map(([type, info]) => {
                    const Icon = info.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, session_type: type as Session['session_type'] })}
                        className={`p-4 rounded-lg border-2 transition-all ${formData.session_type === type
                          ? `border-${info.color}-500 bg-${info.color}-50`
                          : 'border-border hover:border-border'
                          }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${formData.session_type === type ? `text-${info.color}-600` : 'text-muted-foreground/70'}`} />
                        <p className={`text-sm font-medium ${formData.session_type === type ? 'text-foreground' : 'text-foreground/80'}`}>
                          {info.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Weekly Check-in, Final Exam Proctoring"
                  className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What will this session cover?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    min={15}
                    max={480}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
                  />
                </div>
              </div>

              {/* Link Test (for proctored tests) */}
              {formData.session_type === 'proctored_test' && tests.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Link to Test (Optional)</label>
                  <select
                    value={formData.test_id}
                    onChange={(e) => setFormData({ ...formData, test_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
                  >
                    <option value="">Select a test...</option>
                    {tests.map(test => (
                      <option key={test.id} value={test.id}>
                        {test.title} ({test.duration_minutes} min)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Settings */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-3">Session Settings</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'waiting_room', label: 'Waiting Room', icon: Clock },
                    { key: 'record_session', label: 'Record Session', icon: Video },
                    { key: 'require_camera', label: 'Require Camera', icon: Video },
                    { key: 'require_microphone', label: 'Require Mic', icon: Mic },
                    { key: 'allow_screen_share', label: 'Screen Share', icon: MonitorPlay },
                    { key: 'chat_enabled', label: 'Chat', icon: Users },
                  ].map(setting => (
                    <label
                      key={setting.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.settings[setting.key as keyof typeof formData.settings]
                        ? 'border-accent-purple bg-accent-purple/10'
                        : 'border-border hover:border-border'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.settings[setting.key as keyof typeof formData.settings]}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, [setting.key]: e.target.checked }
                        })}
                        className="sr-only"
                      />
                      <setting.icon className={`w-4 h-4 ${formData.settings[setting.key as keyof typeof formData.settings] ? 'text-accent-purple' : 'text-muted-foreground/70'
                        }`} />
                      <span className="text-sm font-medium text-foreground/80">{setting.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Invite Participants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-foreground/80">
                    Invite Students ({formData.participant_ids.length} selected)
                  </label>
                  {students.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, participant_ids: formData.participant_ids.length === students.length ? [] : students.map(s => s.id) })}
                      className="text-xs text-accent-purple hover:text-accent-purple font-medium"
                    >
                      {formData.participant_ids.length === students.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>
                <div className="border border-border rounded-lg max-h-64 overflow-y-auto bg-muted/40">
                  {students.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users className="w-8 h-8 text-muted-foreground/70 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No students in your university yet</p>
                    </div>
                  ) : (
                    students.map(student => (
                      <label
                        key={student.id}
                        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted border-b border-border last:border-b-0 transition-colors ${formData.participant_ids.includes(student.id) ? 'bg-accent-purple/10' : ''
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.participant_ids.includes(student.id)}
                          onChange={() => toggleParticipant(student.id)}
                          className="rounded border-border text-accent-purple focus:ring-ring cursor-pointer"
                        />
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 bg-primary">
                          {student.full_name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-muted/40 border-t border-border p-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 text-foreground/80 font-medium hover:bg-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={loading}
                className="px-6 py-3 text-white font-medium rounded-lg transition-all disabled:opacity-50 bg-primary"
              >
                {loading ? 'Creating...' : 'Schedule Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {showEditModal && editingSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Edit Session</h2>
              <button onClick={() => { setShowEditModal(false); setEditingSession(null); resetForm(); }} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Session title"
                  className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What will this session cover?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    min={15}
                    max={480}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-ring focus:border-accent-purple"
                  />
                </div>
              </div>

              {/* Settings */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-3">Session Settings</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'waiting_room', label: 'Waiting Room', icon: Clock },
                    { key: 'record_session', label: 'Record Session', icon: Video },
                    { key: 'require_camera', label: 'Require Camera', icon: Video },
                    { key: 'require_microphone', label: 'Require Mic', icon: Mic },
                    { key: 'allow_screen_share', label: 'Screen Share', icon: MonitorPlay },
                    { key: 'chat_enabled', label: 'Chat', icon: Users },
                  ].map(setting => (
                    <label
                      key={setting.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.settings[setting.key as keyof typeof formData.settings]
                        ? 'border-accent-purple bg-accent-purple/10'
                        : 'border-border hover:border-border'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.settings[setting.key as keyof typeof formData.settings]}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, [setting.key]: e.target.checked }
                        })}
                        className="sr-only"
                      />
                      <setting.icon className={`w-4 h-4 ${formData.settings[setting.key as keyof typeof formData.settings] ? 'text-accent-purple' : 'text-muted-foreground/70'
                        }`} />
                      <span className="text-sm font-medium text-foreground/80">{setting.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-muted/40 border-t border-border p-6 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowEditModal(false); setEditingSession(null); resetForm(); }}
                className="px-6 py-3 text-foreground/80 font-medium hover:bg-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSession}
                disabled={loading}
                className="px-6 py-3 text-white font-medium rounded-lg transition-all disabled:opacity-50 bg-primary"
              >
                {loading ? 'Updating...' : 'Update Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Session Player */}
      {activeSessionInPlayer && (
        <MentorSessionPlayer
          sessionId={activeSessionInPlayer.id}
          roomUrl={
            activeSessionInPlayer.daily_room_url ||
            `https://meet.jit.si/classera-${activeSessionInPlayer.id.replace(/-/g, '').slice(0, 16)}`
          }
          sessionTitle={activeSessionInPlayer.title}
          participants={activeSessionInPlayer.participants?.length || 1}
          onClose={() => setActiveSessionInPlayer(null)}
        />
      )}
    </div>
  );
}

// Session Card Component
function SessionCard({
  session,
  typeInfo,
  onStart,
  onEnd,
  onEdit,
  onCancel,
  onJoin,
  isLive = false,
  isPast = false
}: {
  session: Session;
  typeInfo: { label: string; icon: any; color: string };
  onStart: (session: Session) => void;
  onEnd: (session: Session) => void;
  onEdit?: (session: Session) => void;
  onCancel?: (session: Session) => void;
  onJoin?: (session: Session) => void;
  isLive?: boolean;
  isPast?: boolean;
}) {
  const Icon = typeInfo.icon;
  const participantCount = session.participants?.length || 0;
  const scheduledDate = new Date(session.scheduled_at);

  return (
    <div className={`bg-card rounded-lg p-6 border-2 transition-all ${isLive ? 'border-green-600' : isPast ? 'border-border opacity-75' : 'border-border hover:border-accent-purple'
      }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg bg-${typeInfo.color}-100 flex items-center justify-center`}>
              <Icon className={`w-5 h-5 text-${typeInfo.color}-600`} />
            </div>
            <div>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}>
                {typeInfo.label}
              </span>
              {isLive && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-600">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">{session.title}</h3>
          {session.description && (
            <p className="text-sm text-foreground/80 mb-3 line-clamp-2">{session.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {scheduledDate.toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {participantCount} invited
            </span>
          </div>
          {session.test && (
            <p className="mt-2 text-sm text-accent-purple flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Linked: {session.test.title}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 ml-4">
          {isLive ? (
            <>
              <button
                onClick={() => onJoin?.(session)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                <Video className="w-4 h-4" />
                Join
              </button>
              <button
                onClick={() => onEnd(session)}
                className="px-4 py-2 text-destructive border border-destructive rounded-lg font-medium hover:bg-destructive/10 transition-colors"
              >
                End Session
              </button>
            </>
          ) : !isPast ? (
            <>
              <button
                onClick={() => onStart(session)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary transition-colors"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(session)}
                  className="px-4 py-2 text-accent-purple border border-accent-purple rounded-lg font-medium hover:bg-accent-purple/10 transition-colors"
                >
                  Edit
                </button>
              )}
              {onCancel && (
                <button
                  onClick={() => onCancel(session)}
                  className="px-4 py-2 text-amber-600 border border-amber-500 rounded-lg font-medium hover:bg-amber-500/10 transition-colors"
                >
                  Cancel
                </button>
              )}
            </>
          ) : (
            <span className="px-4 py-2 text-muted-foreground/70 text-sm">
              {session.status === 'cancelled' ? 'Cancelled' : 'Completed'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
