'use client'

import { useEffect, useRef, useState } from 'react';

/**
 * Countdown driven by a server timestamp so every client sees roughly the
 * same time left, even after joining or reconnecting mid-stage.
 */
export function useCountdown(
    endsAt: number | null | undefined,
    duration: number,
    serverTime?: number,
): number {
    const [remaining, setRemaining] = useState(duration);
    const endRef = useRef<number>(Date.now() + duration * 1000);

    useEffect(() => {
        if (endsAt) {
            const left = Math.max(0, endsAt - (serverTime ?? Date.now()));
            endRef.current = Date.now() + left;
        } else {
            endRef.current = Date.now() + duration * 1000;
        }

        const update = () => {
            const timeLeft = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
            setRemaining(timeLeft);
        };

        update();
        const interval = setInterval(update, 100);
        return () => clearInterval(interval);
    }, [endsAt, duration, serverTime]);

    return remaining;
}
