'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type PauseReason = 'document-hidden' | 'focus' | 'hover';

type UsePausableDismissOptions = {
    duration: number;
    exitDuration?: number;
    onDismiss: () => void;
};

/**
 * Owns the complete lifecycle for a transient notification.
 *
 * Exactly one auto-dismiss timer is active at a time. Independent pause reasons
 * allow hover, keyboard focus, and a hidden document to overlap without one of
 * them accidentally restarting the countdown too early.
 */
export function usePausableDismiss({
    duration,
    exitDuration = 180,
    onDismiss,
}: UsePausableDismissOptions) {
    const [isExiting, setIsExiting] = useState(false);

    const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startedAtRef = useRef(0);
    const remainingTimeRef = useRef(Math.max(0, duration));
    const pauseReasonsRef = useRef(new Set<PauseReason>());
    const isDismissingRef = useRef(false);
    const onDismissRef = useRef(onDismiss);
    const exitDurationRef = useRef(exitDuration);

    useEffect(() => {
        onDismissRef.current = onDismiss;
    }, [onDismiss]);

    useEffect(() => {
        exitDurationRef.current = exitDuration;
    }, [exitDuration]);

    const clearAutoDismissTimer = useCallback((preserveElapsedTime: boolean) => {
        if (autoDismissTimerRef.current === null) return;

        if (preserveElapsedTime) {
            const elapsed = Date.now() - startedAtRef.current;
            remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
        }

        clearTimeout(autoDismissTimerRef.current);
        autoDismissTimerRef.current = null;
    }, []);

    const dismiss = useCallback(() => {
        if (isDismissingRef.current) return;

        isDismissingRef.current = true;
        clearAutoDismissTimer(false);
        setIsExiting(true);

        if (exitDurationRef.current <= 0) {
            onDismissRef.current();
            return;
        }

        exitTimerRef.current = setTimeout(() => {
            exitTimerRef.current = null;
            onDismissRef.current();
        }, exitDurationRef.current);
    }, [clearAutoDismissTimer]);

    const scheduleAutoDismiss = useCallback(() => {
        if (
            isDismissingRef.current ||
            autoDismissTimerRef.current !== null ||
            pauseReasonsRef.current.size > 0
        ) {
            return;
        }

        startedAtRef.current = Date.now();
        autoDismissTimerRef.current = setTimeout(dismiss, remainingTimeRef.current);
    }, [dismiss]);

    const pause = useCallback(
        (reason: PauseReason) => {
            if (pauseReasonsRef.current.has(reason) || isDismissingRef.current) return;

            pauseReasonsRef.current.add(reason);
            clearAutoDismissTimer(true);
        },
        [clearAutoDismissTimer],
    );

    const resume = useCallback(
        (reason: PauseReason) => {
            if (!pauseReasonsRef.current.delete(reason) || isDismissingRef.current) return;

            scheduleAutoDismiss();
        },
        [scheduleAutoDismiss],
    );

    useEffect(() => {
        remainingTimeRef.current = Math.max(0, duration);
        isDismissingRef.current = false;
        pauseReasonsRef.current.clear();

        if (document.visibilityState === 'hidden') {
            pauseReasonsRef.current.add('document-hidden');
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                pause('document-hidden');
            } else {
                resume('document-hidden');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        scheduleAutoDismiss();

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearAutoDismissTimer(false);

            if (exitTimerRef.current !== null) {
                clearTimeout(exitTimerRef.current);
                exitTimerRef.current = null;
            }
        };
    }, [clearAutoDismissTimer, duration, pause, resume, scheduleAutoDismiss]);

    return {
        dismiss,
        isExiting,
        pause,
        resume,
    };
}
