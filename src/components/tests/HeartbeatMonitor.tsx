'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface HeartbeatMonitorProps {
  sessionId: string;
  testId: string;
  onViolation?: (type: string, count: number) => void;
  maxTabSwitches?: number;
  maxFullscreenExits?: number;
  autoSubmitOnViolations?: boolean;
}

export default function HeartbeatMonitor({
  sessionId,
  testId,
  onViolation,
  maxTabSwitches = 3,
  maxFullscreenExits = 2,
  autoSubmitOnViolations = true,
}: HeartbeatMonitorProps) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeat = useRef<number>(Date.now());

  // Send heartbeat to server
  const sendHeartbeat = useCallback(async () => {
    try {
      const response = await fetch('/api/proctoring/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          is_active: !document.hidden,
          is_fullscreen: !!document.fullscreenElement,
          timestamp: new Date().toISOString(),
          browser_info: {
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
          },
          latency_ms: Date.now() - lastHeartbeat.current,
        }),
      });

      lastHeartbeat.current = Date.now();

      if (!response.ok) {
        console.error('Failed to send heartbeat');
      }
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }, [sessionId]);

  // Monitor tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isHidden = document.hidden;
      setIsActive(!isHidden);

      if (isHidden) {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);

        // Log violation
        logViolation('tab_switch', newCount);

        if (newCount >= maxTabSwitches) {
          onViolation?.('tab_switch', newCount);

          if (autoSubmitOnViolations) {
            alert(`You have switched tabs ${newCount} times. Your test will be auto-submitted.`);
            autoSubmitTest();
          }
        } else {
          alert(`Warning: Tab switching detected (${newCount}/${maxTabSwitches}). Test will auto-submit after ${maxTabSwitches} violations.`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tabSwitchCount, maxTabSwitches, autoSubmitOnViolations, onViolation]);

  // Monitor fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);

      if (!isNowFullscreen && fullscreenExitCount >= 0) {
        const newCount = fullscreenExitCount + 1;
        setFullscreenExitCount(newCount);

        // Log violation
        logViolation('fullscreen_exit', newCount);

        if (newCount >= maxFullscreenExits) {
          onViolation?.('fullscreen_exit', newCount);

          if (autoSubmitOnViolations) {
            alert(`You have exited fullscreen ${newCount} times. Your test will be auto-submitted.`);
            autoSubmitTest();
          }
        } else {
          alert(`Warning: You exited fullscreen (${newCount}/${maxFullscreenExits}). Test will auto-submit after ${maxFullscreenExits} violations.`);
          
          // Give user 5 seconds to return to fullscreen
          setTimeout(() => {
            if (!document.fullscreenElement) {
              enterFullscreen();
            }
          }, 5000);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [fullscreenExitCount, maxFullscreenExits, autoSubmitOnViolations, onViolation]);

  // Monitor DevTools (F12)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12
      if (e.key === 'F12') {
        e.preventDefault();
        alert('Developer tools are disabled during the test.');
        logViolation('devtools_attempt', 1);
        return false;
      }

      // Block Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        alert('Developer tools are disabled during the test.');
        logViolation('devtools_attempt', 1);
        return false;
      }

      // Block Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        alert('Console access is disabled during the test.');
        logViolation('console_attempt', 1);
        return false;
      }

      // Block Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        alert('View source is disabled during the test.');
        return false;
      }
    };

    // Detect DevTools by console debugging
    const detectDevTools = () => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        logViolation('devtools_open', 1);
      }
    };

    const devToolsInterval = setInterval(detectDevTools, 1000);

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(devToolsInterval);
    };
  }, []);

  // Disable right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert('Right-click is disabled during the test.');
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Monitor copy/paste
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      // Allow copy but log it
      logViolation('copy_attempt', 1);
    };

    const handlePaste = (e: ClipboardEvent) => {
      // Allow paste but log it
      logViolation('paste_attempt', 1);
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  // Start heartbeat interval
  useEffect(() => {
    // Send initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 5 seconds
    heartbeatInterval.current = setInterval(sendHeartbeat, 5000);

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [sendHeartbeat]);

  // Request fullscreen on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      enterFullscreen();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.error('Failed to enter fullscreen:', err);
      });
    }
  };

  const logViolation = async (type: string, count: number) => {
    try {
      await fetch('/api/proctoring/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          violation_type: type,
          count,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to log violation:', error);
    }
  };

  const autoSubmitTest = async () => {
    try {
      // Auto-submit the test
      await fetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auto_submitted: true,
          reason: 'Multiple violations detected',
        }),
      });

      // Redirect to test results
      window.location.href = `/dashboard/student/tests/${testId}/result`;
    } catch (error) {
      console.error('Failed to auto-submit test:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border rounded-lg p-3 shadow-lg">
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-400">Status:</span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-medium">{isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-400">Fullscreen:</span>
          <span className={`font-medium ${isFullscreen ? 'text-green-600' : 'text-red-600'}`}>
            {isFullscreen ? 'Yes' : 'No'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-400">Tab Switches:</span>
          <span className={`font-medium ${tabSwitchCount >= maxTabSwitches ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
            {tabSwitchCount}/{maxTabSwitches}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-400">Fullscreen Exits:</span>
          <span className={`font-medium ${fullscreenExitCount >= maxFullscreenExits ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
            {fullscreenExitCount}/{maxFullscreenExits}
          </span>
        </div>

        {!isFullscreen && (
          <button
            onClick={enterFullscreen}
            className="w-full mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
          >
            Enter Fullscreen
          </button>
        )}
      </div>
    </div>
  );
}
