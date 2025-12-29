'use client';

import { useEffect, useRef } from 'react';

export function useMessageSound() {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create audio element with a simple notification sound
        // You can replace this with an actual audio file path
        audioRef.current = new Audio('/sounds/message-notification.mp3');
        audioRef.current.volume = 0.5;
    }, []);

    const playSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((error) => {
                console.log('Could not play sound:', error);
            });
        }
    };

    return { playSound };
}
