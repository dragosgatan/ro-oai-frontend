'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

type CountdownProps = {
    // When the countdown should end. Accepts a Date, timestamp (ms), or ISO string.
    endTime: Date | number | string;
    className?: string;
};

function parseEndTime(endTime: Date | number | string): number {
    if (endTime instanceof Date) return endTime.getTime();
    if (typeof endTime === 'number') return endTime;
    // string
    const dt = new Date(endTime);
    return dt.getTime();
}

function formatTime(ms: number, t: (s: string) => string) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const two = (n: number) => n.toString().padStart(2, '0');

    return {
        days,
        hours,
        minutes,
        seconds,
        // Compact 00:00:00 with optional days prefix
        text:
            days > 0
                ? `${days}${t('timerDays')} ${two(hours)}:${two(minutes)}:${two(seconds)}`
                : `${two(hours)}:${two(minutes)}:${two(seconds)}`,
    };
}

export function CompetitionCountdown({ endTime, className }: CountdownProps) {
    const t = useTranslations('competitions.details');
    const target = useMemo(() => parseEndTime(endTime), [endTime]);
    const [now, setNow] = useState<number>(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const remaining = Math.max(0, target - now);
    const { days, hours, minutes, seconds, text } = formatTime(remaining, t);
    const isOver = remaining <= 0;
    const announcementInterval =
        remaining > 24 * 60 * 60 * 1000
            ? 60 * 60 * 1000
            : remaining > 60 * 60 * 1000
              ? 15 * 60 * 1000
              : remaining > 10 * 60 * 1000
                ? 5 * 60 * 1000
                : 60 * 1000;
    const announcedRemaining = isOver
        ? 0
        : Math.ceil(remaining / announcementInterval) * announcementInterval;
    const announcedTime = formatTime(announcedRemaining, t);
    const accessibleLabel = t('timerLabel', { days, hours, minutes, seconds });
    const announcement = t('timerLabel', {
        days: announcedTime.days,
        hours: announcedTime.hours,
        minutes: announcedTime.minutes,
        seconds: announcedTime.seconds,
    });

    return (
        <div
            className={
                `inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-3 py-2 ` +
                `bg-[var(--platform-paper-strong)] text-sm ${className ?? ''}`
            }
        >
            <span className="text-[var(--platform-ink-muted)]">{t('timerEndsIn')}</span>
            <span
                role="timer"
                className="font-mono font-bold tabular-nums text-[var(--platform-ink)]"
                aria-label={accessibleLabel}
                aria-live="off"
            >
                {isOver ? '00:00:00' : text}
            </span>
            <span className="sr-only" aria-live="polite" aria-atomic="true">
                {announcement}
            </span>
        </div>
    );
}

export default CompetitionCountdown;
