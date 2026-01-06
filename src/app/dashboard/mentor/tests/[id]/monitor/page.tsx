'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, Camera, Monitor, Users, RefreshCw, Eye, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProctoringSession {
  id: string;
  student_id: string;
  daily_room_url: string;
  daily_room_name: string;
  started_at: string;
  is_being_monitored: boolean;
  student: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    triggered_at: string;
    is_resolved: boolean;
  }>;
}

export default function MentorProctoringDashboard() {
  const params = useParams();
  const testId = params.id as string;

  const [sessions, setSessions] = useState<ProctoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchSessions, 5000);
    
    return () => clearInterval(interval);
  }, [testId]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/proctoring/sessions?test_id=${testId}`);
      const data = await response.json();
      
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAlertCount = (session: ProctoringSession, severity?: string) => {
    if (!session.alerts) return 0;
    
    if (severity) {
      return session.alerts.filter(a => a.severity === severity && !a.is_resolved).length;
    }
    
    return session.alerts.filter(a => !a.is_resolved).length;
  };

  const joinMonitoring = async (session: ProctoringSession) => {
    // Open Daily.co room in new window
    window.open(
      session.daily_room_url,
      '_blank',
      'width=1200,height=800'
    );

    // Update session as being monitored
    await fetch('/api/proctoring/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        is_being_monitored: true,
        mentor_joined_at: new Date().toISOString(),
      }),
    });

    fetchSessions();
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch('/api/proctoring/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: alertId,
          is_resolved: true,
          resolution_note: 'Reviewed by mentor',
        }),
      });

      fetchSessions();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const activeSessions = sessions.filter(s => !s.ended_at);
  const criticalAlerts = sessions.reduce((sum, s) => sum + getAlertCount(s, 'critical'), 0);
  const highAlerts = sessions.reduce((sum, s) => sum + getAlertCount(s, 'high'), 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Students</p>
              <p className="text-2xl font-bold">{activeSessions.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-600">{criticalAlerts}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Alerts</p>
              <p className="text-2xl font-bold text-orange-600">{highAlerts}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Being Monitored</p>
              <p className="text-2xl font-bold">
                {sessions.filter(s => s.is_being_monitored).length}
              </p>
            </div>
            <Eye className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {criticalAlerts} critical alert{criticalAlerts > 1 ? 's' : ''} require immediate attention!
          </AlertDescription>
        </Alert>
      )}

      {/* Student Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => {
          const unresolvedAlerts = getAlertCount(session);
          const criticalCount = getAlertCount(session, 'critical');
          const highCount = getAlertCount(session, 'high');

          return (
            <Card
              key={session.id}
              className={`p-4 ${
                criticalCount > 0
                  ? 'border-red-500 border-2'
                  : highCount > 0
                  ? 'border-orange-500 border-2'
                  : ''
              }`}
            >
              <div className="space-y-3">
                {/* Student Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={session.student.avatar_url || undefined} />
                      <AvatarFallback>
                        {session.student.full_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{session.student.full_name}</p>
                      <p className="text-xs text-gray-500">
                        Started {new Date(session.started_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {session.is_being_monitored && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Eye className="h-3 w-3 mr-1" />
                      Monitoring
                    </Badge>
                  )}
                </div>

                {/* Alerts */}
                {unresolvedAlerts > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">{unresolvedAlerts} Active Alert{unresolvedAlerts > 1 ? 's' : ''}</span>
                    </div>

                    <div className="space-y-1">
                      {session.alerts
                        ?.filter(a => !a.is_resolved)
                        .slice(0, 3)
                        .map((alert) => (
                          <div
                            key={alert.id}
                            className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                              <span>{alert.title}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => resolveAlert(alert.id)}
                              className="h-6 px-2"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => joinMonitoring(session)}
                    className="flex-1"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Monitor
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/dashboard/mentor/tests/${testId}/session/${session.id}`, '_blank')}
                  >
                    Details
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No active proctoring sessions</p>
          <p className="text-sm">Students will appear here when they start the test</p>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="text-center text-xs text-gray-500">
        <RefreshCw className="h-3 w-3 inline-block mr-1" />
        Auto-refreshing every 5 seconds
      </div>
    </div>
  );
}
