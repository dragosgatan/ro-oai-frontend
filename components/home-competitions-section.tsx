import { ArrowRight, CalendarDays } from 'lucide-react';

import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/types';

export type HomeCompetitionItem = {
    id: number;
    name: string;
    description: string;
    startTime: string;
    endTime: string;
    status: 'future' | 'ongoing' | 'ended';
    statusLabel: string;
    joined: boolean;
};

type HomeCompetitionsSectionProps = {
    locale: Locale;
    competitions: HomeCompetitionItem[];
    title: string;
    subtitle: string;
    viewAllLabel: string;
    joinedLabel: string;
    emptyMessage: string;
    unavailable: boolean;
    errorMessage: string;
};

const statusStyles: Record<HomeCompetitionItem['status'], string> = {
    future: 'bg-[var(--home-citron)] text-[var(--home-on-accent)]',
    ongoing: 'bg-[var(--home-coral)] text-[var(--home-on-accent)]',
    ended: 'bg-[var(--home-line)] text-[var(--home-ink-muted-strong)]',
};

function formatDateRange(startTime: string, endTime: string, locale: Locale) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const formatter = new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Europe/Bucharest',
    });

    const startLabel = formatter.format(start);
    const endLabel = formatter.format(end);
    return { startLabel, endLabel, isSameDay: startLabel === endLabel };
}

export function HomeCompetitionsSection({
    locale,
    competitions,
    title,
    subtitle,
    viewAllLabel,
    joinedLabel,
    emptyMessage,
    unavailable,
    errorMessage,
}: HomeCompetitionsSectionProps) {
    const indexFormatter = new Intl.NumberFormat(locale, {
        minimumIntegerDigits: 2,
        useGrouping: false,
    });

    return (
        <section
            id="competitions"
            className="scroll-mt-24 bg-[var(--home-paper)] py-[clamp(5rem,9vw,9rem)]"
        >
            <div className="mx-auto grid max-w-[90rem] gap-12 px-5 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20 xl:px-12">
                <div className="lg:sticky lg:top-28 lg:self-start">
                    <div className="flex items-center gap-3 text-sm font-semibold text-[var(--home-violet)]">
                        <CalendarDays className="h-5 w-5" aria-hidden="true" />
                        <span>{viewAllLabel}</span>
                    </div>
                    <h2 className="home-display mt-7 text-balance text-[clamp(2.6rem,5vw,5.4rem)] leading-[0.95] tracking-[-0.06em] text-[var(--home-ink)]">
                        {title}
                    </h2>
                    <p className="mt-6 max-w-[48ch] text-pretty text-base leading-7 text-[color:var(--home-ink-muted)] sm:text-lg">
                        {subtitle}
                    </p>
                    <Link
                        href="/competitions"
                        className="group mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--home-ink)] underline decoration-[var(--home-coral)] decoration-2 underline-offset-4 outline-none transition-colors hover:text-[var(--home-violet)] focus-visible:ring-2 focus-visible:ring-[var(--home-violet)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-paper)]"
                    >
                        {viewAllLabel}
                        <ArrowRight
                            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                            aria-hidden="true"
                        />
                    </Link>
                </div>

                <div>
                    {competitions.length > 0 ? (
                        <ol className="border-y border-[color:var(--home-line)]">
                            {competitions.map((competition, index) => {
                                const range = formatDateRange(
                                    competition.startTime,
                                    competition.endTime,
                                    locale,
                                );

                                return (
                                    <li
                                        key={competition.id}
                                        className="border-b border-[color:var(--home-line)] last:border-b-0"
                                    >
                                        <Link
                                            href={`/competitions/${competition.id}`}
                                            className="group grid min-h-48 gap-5 py-7 outline-none transition-[background-color,padding] duration-200 ease-out hover:bg-[var(--home-paper-strong)] focus-visible:bg-[var(--home-paper-strong)] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--home-coral)] sm:grid-cols-[3.25rem_1fr_auto] sm:items-start sm:px-5 sm:hover:px-7"
                                        >
                                            <span className="home-display text-sm tabular-nums text-[var(--home-violet)]">
                                                {indexFormatter.format(index + 1)}
                                            </span>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
                                                    <span
                                                        className={cn(
                                                            'inline-flex min-h-7 items-center rounded-md px-2.5',
                                                            statusStyles[competition.status],
                                                        )}
                                                    >
                                                        {competition.statusLabel}
                                                    </span>
                                                    {competition.joined && (
                                                        <span className="inline-flex min-h-7 items-center rounded-md border border-[color:var(--home-line-strong)] px-2.5 text-[color:var(--home-ink-muted-strong)]">
                                                            {joinedLabel}
                                                        </span>
                                                    )}
                                                    <span className="text-[color:var(--home-ink-muted)]">
                                                        <time dateTime={competition.startTime}>
                                                            {range.startLabel}
                                                        </time>
                                                        {!range.isSameDay && (
                                                            <>
                                                                {' · '}
                                                                <time
                                                                    dateTime={competition.endTime}
                                                                >
                                                                    {range.endLabel}
                                                                </time>
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                                <h3 className="mt-4 text-pretty text-xl font-semibold leading-tight tracking-[-0.025em] text-[var(--home-ink)] transition-colors group-hover:text-[var(--home-violet)] sm:text-2xl">
                                                    {competition.name}
                                                </h3>
                                                {competition.description &&
                                                    competition.description !==
                                                        competition.name && (
                                                        <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-[color:var(--home-ink-muted)]">
                                                            {competition.description}
                                                        </p>
                                                    )}
                                            </div>
                                            <span className="flex h-11 w-11 items-center justify-center bg-[var(--home-violet)] text-[var(--home-paper)] transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1">
                                                <ArrowRight
                                                    className="h-5 w-5 rtl:rotate-180"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ol>
                    ) : (
                        <div className="border-y border-[color:var(--home-line)] py-14 text-center">
                            <p className="text-sm text-[color:var(--home-ink-muted)]">
                                {unavailable ? errorMessage : emptyMessage}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
