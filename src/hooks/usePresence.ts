'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function usePresence(userId: string) {
    const [isOnline, setIsOnline] = useState(false);
    const [lastSeen, setLastSeen] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        // Fetch initial presence
        const fetchPresence = async () => {
            const { data } = await supabase
                .from('user_presence')
                .select('status, last_seen')
                .eq('user_id', userId)
                .single();

            if (data) {
                setIsOnline(data.status === 'online');
                setLastSeen(data.last_seen);
            }
        };

        fetchPresence();

        const topic = `presence:${userId}`;
        console.log('👤 Subscribing to presence topic:', topic);

        // Subscribe to broadcast events for presence changes
        const channel = supabase
            .channel(topic, {
                config: {
                    broadcast: { self: false },
                },
            })
            .on(
                'broadcast',
                {
                    event: 'INSERT',
                },
                (payload: any) => {
                    console.log('👤 Presence INSERT:', payload);
                    if (payload.payload?.new) {
                        setIsOnline(payload.payload.new.status === 'online');
                        setLastSeen(payload.payload.new.last_seen);
                    }
                }
            )
            .on(
                'broadcast',
                {
                    event: 'UPDATE',
                },
                (payload: any) => {
                    console.log('👤 Presence UPDATE:', payload);
                    if (payload.payload?.new) {
                        setIsOnline(payload.payload.new.status === 'online');
                        setLastSeen(payload.payload.new.last_seen);
                    }
                }
            )
            .subscribe((status) => {
                // Subscription status handled
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase]);

    return { isOnline, lastSeen };
}
