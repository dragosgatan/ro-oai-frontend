'use client';

import { Calendar, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

interface CompetitionDateDisplayProps {
    startTime: string;
    endTime: string;
    variant?: 'compact' | 'detailed';
}

export function CompetitionDateDisplay({
    startTime,
    endTime,
    variant = 'detailed',
}: CompetitionDateDisplayProps) {
    const t = useTranslations('competitions.dates');
    const tCommon = useTranslations('common');
    const locale = useLocale();

    const start = new Date(startTime);
    const end = new Date(endTime);
    const hasValidRange =
        Number.isFinite(start.getTime()) &&
        Number.isFinite(end.getTime()) &&
        end.getTime() >= start.getTime();

    if (!hasValidRange) {
        return <span className="text-sm text-[var(--platform-ink-muted)]">{tCommon('na')}</span>;
    }

    const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
    const timeFormatter = new Intl.DateTimeFormat(locale, { timeStyle: 'short' });
    const dayFormatter = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    });
    const startDate = dateFormatter.format(start);
    const endDate = dateFormatter.format(end);
    const startTimeLabel = timeFormatter.format(start);
    const endTimeLabel = timeFormatter.format(end);

    const isSameDay = dayFormatter.format(start) === dayFormatter.format(end);

    if (variant === 'compact') {
        return (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--platform-ink-muted)]">
                <div className="flex items-center gap-1.5">
                    <Calendar
                        className="h-4 w-4 flex-shrink-0 text-[var(--platform-violet)]"
                        aria-hidden="true"
                    />
                    <span className="flex flex-wrap items-center gap-x-1">
                        {isSameDay ? (
                            <time dateTime={startTime}>{startDate}</time>
                        ) : (
                            <>
                                <time dateTime={startTime}>{startDate}</time>
                                <span aria-hidden="true">–</span>
                                <time dateTime={endTime}>{endDate}</time>
                            </>
                        )}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock
                        className="h-4 w-4 flex-shrink-0 text-[var(--platform-violet)]"
                        aria-hidden="true"
                    />
                    <span className="flex items-center gap-1">
                        <time dateTime={startTime}>{startTimeLabel}</time>
                        <span aria-hidden="true">–</span>
                        <time dateTime={endTime}>{endTimeLabel}</time>
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4">
            <div className="flex items-start gap-2">
                <Calendar
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--platform-violet)]"
                    aria-hidden="true"
                />
                <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--platform-ink-muted)]">
                        {t('starts')}
                    </span>
                    <span className="text-sm font-semibold text-[var(--platform-ink)]">
                        <time dateTime={startTime}>{startDate}</time>
                    </span>
                    <time dateTime={startTime} className="text-xs text-[var(--platform-ink-muted)]">
                        {startTimeLabel}
                    </time>
                </div>
            </div>

            <div
                className="hidden text-[var(--platform-coral)] sm:block rtl:rotate-180"
                aria-hidden="true"
            >
                →
            </div>

            <div className="flex items-start gap-2">
                <Calendar
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--platform-violet)]"
                    aria-hidden="true"
                />
                <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--platform-ink-muted)]">
                        {t('ends')}
                    </span>
                    <span className="text-sm font-semibold text-[var(--platform-ink)]">
                        <time dateTime={endTime}>{endDate}</time>
                    </span>
                    <time dateTime={endTime} className="text-xs text-[var(--platform-ink-muted)]">
                        {endTimeLabel}
                    </time>
                </div>
            </div>
        </div>
    );
}
