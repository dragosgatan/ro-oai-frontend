'use client';

import { ArrowRight, BookOpenText, Lightbulb, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';

export function shouldShowProblemContributionInvite({
    currentPage,
    hasActiveFilters,
    resultCount,
}: {
    currentPage: number;
    hasActiveFilters: boolean;
    resultCount: number;
}): boolean {
    return currentPage === 0 && !hasActiveFilters && resultCount > 0;
}

export function ProblemContributionInvite() {
    const t = useTranslations('problems.contribution');

    return (
        <aside
            aria-labelledby="problem-contribution-heading"
            className="mt-12 border-y border-[var(--platform-line-strong)] bg-[color-mix(in_oklch,var(--platform-citron)_20%,var(--platform-paper))]"
        >
            <div className="grid gap-6 px-4 py-7 sm:px-6 sm:py-8 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-8">
                <span className="grid h-14 w-14 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)]">
                    <Lightbulb className="h-6 w-6" aria-hidden="true" />
                </span>

                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-violet)]">
                        {t('eyebrow')}
                    </p>
                    <h2
                        id="problem-contribution-heading"
                        className="mt-2 max-w-[32ch] text-balance text-2xl font-bold leading-tight tracking-[-0.035em] text-[var(--platform-ink)] sm:text-3xl"
                    >
                        {t('title')}
                    </h2>
                    <p className="mt-3 max-w-[68ch] text-pretty text-sm leading-6 text-[var(--platform-ink-muted)] sm:text-base">
                        {t('description')}
                    </p>
                    <p className="mt-4 flex max-w-[68ch] items-start gap-2 text-xs font-semibold leading-5 text-[var(--platform-ink-muted)]">
                        <ShieldCheck
                            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--platform-violet)]"
                            aria-hidden="true"
                        />
                        {t('reviewNote')}
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-64 lg:grid-cols-1">
                    <Link
                        href="/problem-proposals/new"
                        className="group inline-flex min-h-12 items-center justify-between gap-3 bg-[var(--platform-violet)] px-5 py-3 text-sm font-bold text-white outline-none transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--platform-violet-strong)] focus-visible:ring-4 focus-visible:ring-[var(--platform-coral)] focus-visible:ring-offset-2 dark:text-[var(--platform-on-accent)]"
                    >
                        {t('primaryAction')}
                        <ArrowRight
                            className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                            aria-hidden="true"
                        />
                    </Link>
                    <Link
                        href="/problem-proposals/evaluator-guide"
                        className="group inline-flex min-h-12 items-center justify-between gap-3 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-5 py-3 text-sm font-bold text-[var(--platform-ink)] outline-none transition-colors duration-200 ease-out hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)] focus-visible:ring-4 focus-visible:ring-[var(--platform-coral)]"
                    >
                        <span className="inline-flex items-center gap-2">
                            <BookOpenText className="h-4 w-4" aria-hidden="true" />
                            {t('guideAction')}
                        </span>
                        <ArrowRight
                            className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                            aria-hidden="true"
                        />
                    </Link>
                </div>
            </div>
        </aside>
    );
}
