'use client';

import { AlertTriangle, ArrowRight, BookOpenCheck, RotateCcw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/routing';
import type { ProfilePublishedProblem } from '@/lib/profile-published-problems';

type ProfilePublishedProblemsProps = {
    problems: ProfilePublishedProblem[];
    totalCount: number;
    status?: 'ready' | 'loading' | 'error';
    retryHref?: string;
};

export function ProfilePublishedProblems({
    problems,
    totalCount,
    status = 'ready',
    retryHref,
}: ProfilePublishedProblemsProps) {
    const t = useTranslations('profile.publishedProblems');
    const locale = useLocale();
    const safeTotalCount = Number.isFinite(totalCount) ? Math.max(0, Math.trunc(totalCount)) : 0;
    const count = Math.max(problems.length, safeTotalCount);

    return (
        <section
            aria-labelledby="profile-published-problems-title"
            aria-busy={status === 'loading'}
            className="platform-panel overflow-hidden bg-[var(--platform-paper)]"
        >
            <header className="flex flex-col gap-3 border-b border-[var(--platform-line-strong)] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6">
                <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[var(--platform-violet)]">
                        <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                        {t('eyebrow')}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <h2
                            id="profile-published-problems-title"
                            className="text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                        >
                            {t('title')}
                        </h2>
                        {status === 'loading' ? (
                            <Skeleton
                                className="h-7 w-24 rounded-none bg-[var(--platform-line)]"
                                aria-hidden="true"
                            />
                        ) : status === 'error' ? (
                            <span className="inline-flex min-h-7 items-center border border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-2.5 text-xs font-semibold text-[var(--platform-ink-muted)]">
                                {t('countUnavailable')}
                            </span>
                        ) : (
                            <span className="inline-flex min-h-7 items-center bg-[var(--platform-citron)] px-2.5 font-mono text-xs font-bold tabular-nums text-[var(--platform-on-accent)]">
                                {t('count', { count })}
                            </span>
                        )}
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('description')}
                    </p>
                </div>
            </header>

            {status === 'loading' ? (
                <PublishedProblemsSkeleton />
            ) : status === 'error' ? (
                <div role="alert" className="flex flex-col items-start gap-4 p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle
                            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--platform-coral)]"
                            aria-hidden="true"
                        />
                        <div>
                            <h3 className="font-semibold text-[var(--platform-ink)]">
                                {t('errorTitle')}
                            </h3>
                            <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                                {t('errorDescription')}
                            </p>
                        </div>
                    </div>
                    {retryHref ? (
                        <a
                            href={`/${locale}${retryHref}`}
                            className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 text-sm font-bold text-[var(--platform-ink)] transition-colors hover:border-[var(--platform-violet)] hover:text-[var(--platform-violet)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                        >
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            {t('retry')}
                        </a>
                    ) : null}
                </div>
            ) : problems.length === 0 ? (
                <div className="flex items-start gap-3 p-5 sm:p-6">
                    <span className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--platform-paper-strong)] text-[var(--platform-ink-muted)]">
                        <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                        <h3 className="font-semibold text-[var(--platform-ink)]">
                            {t('emptyTitle')}
                        </h3>
                        <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                            {t('emptyDescription')}
                        </p>
                    </div>
                </div>
            ) : (
                <ol aria-label={t('listLabel')} className="grid sm:grid-cols-2">
                    {problems.map((problem, index) => (
                        <li
                            key={problem.id}
                            className="border-b border-[var(--platform-line)] sm:odd:border-e"
                        >
                            <Link
                                href={`/problems/${problem.id}`}
                                className="group grid min-h-20 grid-cols-[2.5rem_minmax(0,1fr)_2.75rem] items-center gap-3 px-4 py-3 text-[var(--platform-ink)] transition-colors hover:bg-[var(--platform-paper-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--platform-violet)] sm:px-5"
                                aria-label={t('openProblem', { title: problem.title })}
                            >
                                <span
                                    className="font-mono text-xs font-bold tabular-nums text-[var(--platform-violet)]"
                                    aria-hidden="true"
                                >
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <span className="min-w-0">
                                    <span
                                        className="break-words font-semibold leading-6 tracking-[-0.015em]"
                                        dir="auto"
                                    >
                                        {problem.title}
                                    </span>
                                    <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-[var(--platform-ink-muted)]">
                                        #{problem.id}
                                    </span>
                                </span>
                                <span className="grid h-11 w-11 place-items-center border border-[var(--platform-line-strong)] text-[var(--platform-violet)] transition-colors group-hover:border-[var(--platform-violet)] group-hover:bg-[var(--platform-violet)] group-hover:text-white dark:group-hover:text-[var(--platform-on-accent)]">
                                    <ArrowRight
                                        className="h-4 w-4 rtl:rotate-180"
                                        aria-hidden="true"
                                    />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}

function PublishedProblemsSkeleton() {
    return (
        <div className="grid sm:grid-cols-2" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
                <div
                    key={index}
                    className="grid min-h-20 grid-cols-[2.5rem_minmax(0,1fr)_2.75rem] items-center gap-3 border-b border-[var(--platform-line)] px-4 py-3 sm:odd:border-e sm:px-5"
                >
                    <Skeleton className="h-3 w-5 rounded-none bg-[var(--platform-line)]" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded-none bg-[var(--platform-line)]" />
                        <Skeleton className="h-3 w-12 rounded-none bg-[var(--platform-line)]" />
                    </div>
                    <Skeleton className="h-11 w-11 rounded-none bg-[var(--platform-line)]" />
                </div>
            ))}
        </div>
    );
}
