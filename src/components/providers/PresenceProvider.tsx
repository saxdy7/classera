'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PresenceProviderProps {
    userId: string;
    children: React.ReactNode;
}

export function PresenceProvider({ userId, children }: PresenceProviderProps) {
    const supabase = createClient();

    useEffect(() => {
        // Set user as online when component mounts
        const setOnline = async () => {
            await supabase
                .from('user_presence')
                .upsert({
                    user_id: userId,
                    status: 'online',
                    last_seen: new Date().toISOString(),
                });
        };

        // Set user as offline when component unmounts or page closes
        const setOffline = async () => {
            await supabase
                .from('user_presence')
                .update({
                    status: 'offline',
                    last_seen: new Date().toISOString(),
                })
                .eq('user_id', userId);
        };

        setOnline();

        // Update presence every 30 seconds to keep status fresh
        const interval = setInterval(setOnline, 30000);

        // Handle page visibility change (tab switching)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setOffline();
            } else {
                setOnline();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', setOffline);

        return () => {
            setOffline();
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', setOffline);
        };
    }, [userId, supabase]);

    return <>{children}</>;
}
