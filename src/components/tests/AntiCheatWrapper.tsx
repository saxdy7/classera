'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, Eye, Copy, ExternalLink } from 'lucide-react';

interface AntiCheatConfig {
    preventCopyPaste: boolean;
    detectTabSwitch: boolean;
    preventRightClick: boolean;
    detectScreenCapture: boolean;
    fullscreenMode: boolean;
    maxTabSwitches: number;
    maxWarnings: number;
}

interface AntiCheatProps {
    testId: string;
    studentId: string;
    sessionId?: string;
    config?: Partial<AntiCheatConfig>;
    onViolation: (violation: { type: string; count: number; timestamp: string }) => void;
    onMaxViolations: () => void;
    children: React.ReactNode;
}

const defaultConfig: AntiCheatConfig = {
    preventCopyPaste: true,
    detectTabSwitch: true,
    preventRightClick: true,
    detectScreenCapture: true,
    fullscreenMode: false,
    maxTabSwitches: 3,
    maxWarnings: 5,
};

export function AntiCheatWrapper({
    testId,
    studentId,
    sessionId,
    config: userConfig,
    onViolation,
    onMaxViolations,
    children
}: AntiCheatProps) {
    const config = { ...defaultConfig, ...userConfig };
    const [warnings, setWarnings] = useState<{ type: string; timestamp: string }[]>([]);
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const tabSwitchCount = useRef(0);
    const isFullscreen = useRef(false);

    const addViolation = useCallback((type: string, message: string) => {
        const timestamp = new Date().toISOString();
        const newWarning = { type, timestamp };
        
        setWarnings(prev => {
            const updated = [...prev, newWarning];
            
            // Check if max violations reached
            if (updated.length >= config.maxWarnings) {
                onMaxViolations();
            }
            
            return updated;
        });

        setWarningMessage(message);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);

        // Report violation
        onViolation({ type, count: warnings.length + 1, timestamp });

        // Log to server
        logViolation(type, timestamp);
    }, [warnings.length, config.maxWarnings, onMaxViolations, onViolation]);

    const logViolation = async (type: string, timestamp: string) => {
        try {
            const body: Record<string, any> = {
                violation_type: type,
                timestamp,
            };

            if (sessionId) {
                body.session_id = sessionId;
            }

            await fetch(`/api/tests/${testId}/violations-secure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        } catch (error) {
            console.error('Failed to log violation:', error);
        }
    };

    // Prevent copy/paste
    useEffect(() => {
        if (!config.preventCopyPaste) return;

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            addViolation('copy_attempt', 'Copying is not allowed during the test');
        };

        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            addViolation('paste_attempt', 'Pasting is not allowed during the test');
        };

        const handleCut = (e: ClipboardEvent) => {
            e.preventDefault();
            addViolation('cut_attempt', 'Cutting is not allowed during the test');
        };

        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('cut', handleCut);

        return () => {
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('cut', handleCut);
        };
    }, [config.preventCopyPaste, addViolation]);

    // Detect tab/window switch
    useEffect(() => {
        if (!config.detectTabSwitch) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                tabSwitchCount.current++;
                
                if (tabSwitchCount.current >= config.maxTabSwitches) {
                    addViolation(
                        'tab_switch_max',
                        `Maximum tab switches (${config.maxTabSwitches}) exceeded. Your test may be auto-submitted.`
                    );
                } else {
                    addViolation(
                        'tab_switch',
                        `Tab switch detected (${tabSwitchCount.current}/${config.maxTabSwitches}). Please stay on the test page.`
                    );
                }
            }
        };

        const handleBlur = () => {
            // Window lost focus
            addViolation('window_blur', 'Window focus lost. Please return to the test.');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        // window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // window.removeEventListener('blur', handleBlur);
        };
    }, [config.detectTabSwitch, config.maxTabSwitches, addViolation]);

    // Prevent right-click
    useEffect(() => {
        if (!config.preventRightClick) return;

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            addViolation('right_click', 'Right-click is disabled during the test');
        };

        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [config.preventRightClick, addViolation]);

    // Prevent keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent Ctrl+C, Ctrl+V, Ctrl+X
            if (config.preventCopyPaste && (e.ctrlKey || e.metaKey)) {
                if (['c', 'v', 'x'].includes(e.key.toLowerCase())) {
                    e.preventDefault();
                    return;
                }
            }

            // Prevent F12 (DevTools)
            if (e.key === 'F12') {
                e.preventDefault();
                addViolation('devtools_attempt', 'Developer tools are disabled during the test');
                return;
            }

            // Prevent Ctrl+Shift+I (DevTools)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                addViolation('devtools_attempt', 'Developer tools are disabled during the test');
                return;
            }

            // Prevent Ctrl+U (View Source)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
                e.preventDefault();
                addViolation('view_source_attempt', 'Viewing source is disabled during the test');
                return;
            }

            // Prevent Print Screen
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                addViolation('screenshot_attempt', 'Screenshots are not allowed during the test');
                return;
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [config.preventCopyPaste, addViolation]);

    // Fullscreen mode
    useEffect(() => {
        if (!config.fullscreenMode) return;

        const enterFullscreen = async () => {
            try {
                await document.documentElement.requestFullscreen();
                isFullscreen.current = true;
            } catch (err) {
                console.error('Failed to enter fullscreen:', err);
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && isFullscreen.current) {
                addViolation('fullscreen_exit', 'Fullscreen mode exited. Please return to fullscreen.');
                // Try to re-enter fullscreen
                enterFullscreen();
            }
        };

        enterFullscreen();
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        };
    }, [config.fullscreenMode, addViolation]);

    // Disable text selection (optional)
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .anti-cheat-container {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
            .anti-cheat-container input,
            .anti-cheat-container textarea {
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
                user-select: text;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <div className="anti-cheat-container relative">
            {/* Warning Overlay */}
            {showWarning && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
                    <div className="flex items-center gap-3 px-6 py-4 bg-red-600 text-white rounded-xl shadow-2xl">
                        <AlertTriangle className="w-6 h-6" />
                        <div>
                            <p className="font-semibold">Warning!</p>
                            <p className="text-sm opacity-90">{warningMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Violation Counter */}
            {warnings.length > 0 && (
                <div className="fixed top-4 right-4 z-[99]">
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                        <Eye className="w-4 h-4 text-yellow-700" />
                        <span className="text-sm font-medium text-yellow-800">
                            {warnings.length}/{config.maxWarnings} violations
                        </span>
                    </div>
                </div>
            )}

            {children}
        </div>
    );
}

// API endpoint for logging violations
export function ViolationLogger() {
    return null; // Server-side only
}
