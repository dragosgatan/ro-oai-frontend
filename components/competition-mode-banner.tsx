'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, Clock3, Trophy } from 'lucide-react';

import { Link } from '@/i18n/routing';

type CompetitionModeBannerProps = {
    competition: {
        id: number;
        name: string;
        description: string;
        endTime: string;
        joined: boolean;
    };
    serverNow: string;
};

function getRemainingTime(endTime: string, now: number) {
    const difference = Math.max(0, new Date(endTime).getTime() - now);

    return {
        difference,
        days: Math.floor(difference / 86_400_000),
        hours: Math.floor((difference % 86_400_000) / 3_600_000),
        minutes: Math.floor((difference % 3_600_000) / 60_000),
        seconds: Math.floor((difference % 60_000) / 1_000),
    };
}

function getRelativeTimeLabel(locale: string, difference: number): string {
    const units = [
        { unit: 'day' as const, milliseconds: 86_400_000 },
        { unit: 'hour' as const, milliseconds: 3_600_000 },
        { unit: 'minute' as const, milliseconds: 60_000 },
        { unit: 'second' as const, milliseconds: 1_000 },
    ];
    const selected = units.find(({ milliseconds }) => difference >= milliseconds) ?? units[3];
    const value = Math.max(1, Math.ceil(difference / selected.milliseconds));

    return new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(value, selected.unit);
}

export function CompetitionModeBanner({ competition, serverNow }: CompetitionModeBannerProps) {
    const tStatus = useTranslations('competitions.status');
    const tDetails = useTranslations('competitions.details');
    const tDates = useTranslations('competitions.dates');
    const tList = useTranslations('competitions.list');
    const locale = useLocale();
    const [now, setNow] = useState(() => new Date(serverNow).getTime());

    useEffect(() => {
        setNow(Date.now());
        const interval = window.setInterval(() => setNow(Date.now()), 1_000);
        return () => window.clearInterval(interval);
    }, []);

    const remaining = getRemainingTime(competition.endTime, now);
    if (remaining.difference <= 0) return null;

    const clockFormatter = new Intl.NumberFormat(locale, {
        minimumIntegerDigits: 2,
        useGrouping: false,
    });
    const clockLabel = [remaining.hours, remaining.minutes, remaining.seconds]
        .map((value) => clockFormatter.format(value))
        .join(':');
    const visualTimer =
        remaining.days > 0
            ? `${clockFormatter.format(remaining.days)}${tDetails('timerDays')} · ${clockLabel}`
            : clockLabel;
    const accessibleTimer = `${tDates('ends')} ${getRelativeTimeLabel(locale, remaining.difference)}`;

    return (
        <section className="bg-[var(--home-violet)] text-[var(--home-paper)]">
            <div className="mx-auto grid max-w-[90rem] gap-8 px-5 py-9 sm:px-8 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-10 xl:px-12">
                <div className="flex h-14 w-14 items-center justify-center bg-[var(--home-coral)] text-[var(--home-on-accent)]">
                    <Trophy className="h-6 w-6" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                    <div className="home-letterspaced flex flex-wrap items-center gap-3 text-xs font-bold tracking-[0.12em]">
                        <span className="inline-flex min-h-7 items-center bg-[var(--home-coral)] px-2.5 text-[var(--home-on-accent)]">
                            {tStatus('ongoing')}
                        </span>
                        <span className="inline-flex items-center gap-2 text-[color:var(--home-paper-muted)]">
                            <Clock3 className="h-4 w-4" aria-hidden="true" />
                            <span className="tabular-nums" aria-hidden="true">
                                {visualTimer}
                            </span>
                            <span className="sr-only">{accessibleTimer}</span>
                        </span>
                    </div>
                    <h2 className="mt-4 text-pretty text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl">
                        {competition.name}
                    </h2>
                    {competition.description && (
                        <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-[color:var(--home-paper-muted)]">
                            {competition.description}
                        </p>
                    )}
                </div>

                <Link
                    href={`/competitions/${competition.id}`}
                    className="group inline-flex min-h-12 items-center justify-center gap-3 bg-[var(--home-citron)] px-5 py-3 font-semibold text-[var(--home-on-accent)] outline-none transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[var(--home-coral)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-violet)] active:translate-y-0"
                >
                    {competition.joined ? tList('view') : tDetails('join')}
                    <ArrowUpRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-rotate-90"
                        aria-hidden="true"
                    />
                </Link>
            </div>
        </section>
    );
}
