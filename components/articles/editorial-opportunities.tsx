'use client';

import { useEffect, useState } from 'react';
import {
    ArrowRight,
    BookOpenCheck,
    CheckCircle2,
    CircleDashed,
    FilePenLine,
    RefreshCw,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

import { Link } from '@/i18n/routing';
import {
    getMyEditorialOpportunities,
    type EditorialOpportunityOverview,
    type EditorialOpportunityProblem,
} from '@/lib/articles';
import type { Locale } from '@/lib/types';

const INITIAL_VISIBLE_PROBLEMS = 4;

export function EditorialOpportunities() {
    const t = useTranslations('articles.editorialOpportunities');
    const locale = useLocale() as Locale;
    const { status: sessionStatus } = useSession();
    const [overview, setOverview] = useState<EditorialOpportunityOverview | null>(null);
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [attempt, setAttempt] = useState(0);
    const [showAllWithout, setShowAllWithout] = useState(false);
    const [showAllWith, setShowAllWith] = useState(false);

    useEffect(() => {
        if (sessionStatus !== 'authenticated') {
            setOverview(null);
            setState('idle');
            return;
        }

        let active = true;
        setState('loading');
        getMyEditorialOpportunities(locale)
            .then((result) => {
                if (!active) return;
                setOverview(result);
                setState('success');
            })
            .catch(() => {
                if (!active) return;
                setOverview(null);
                setState('error');
            });

        return () => {
            active = false;
        };
    }, [attempt, locale, sessionStatus]);

    if (sessionStatus !== 'authenticated') return null;

    return (
        <section
            aria-labelledby="editorial-opportunities-title"
            aria-busy={state === 'idle' || state === 'loading'}
            className="border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] shadow-[6px_6px_0_var(--platform-citron)]"
        >
            <header className="grid gap-5 border-b border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="min-w-0">
                    <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--platform-violet)]">
                        <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                        {t('eyebrow')}
                    </p>
                    <h2
                        id="editorial-opportunities-title"
                        className="mt-3 text-2xl font-bold leading-tight tracking-[-0.035em] text-[var(--platform-ink)] sm:text-3xl"
                    >
                        {t('title')}
                    </h2>
                    <p className="mt-3 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)] sm:text-base">
                        {t('description')}
                    </p>
                </div>
                {overview ? (
                    <p className="w-fit border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 py-2 font-mono text-xs font-bold tabular-nums text-[var(--platform-ink)]">
                        {t('total', { count: overview.totalProblems })}
                    </p>
                ) : null}
            </header>

            {state === 'idle' || state === 'loading' ? (
                <EditorialOpportunitiesSkeleton label={t('loading')} />
            ) : null}

            {state === 'error' ? (
                <div
                    className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"
                    role="alert"
                >
                    <div>
                        <p className="font-bold text-[var(--platform-ink)]">{t('error.title')}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--platform-ink-muted)]">
                            {t('error.description')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAttempt((current) => current + 1)}
                        className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] transition-colors hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        {t('error.retry')}
                    </button>
                </div>
            ) : null}

            {state === 'success' && overview?.totalProblems === 0 ? (
                <div className="p-5 sm:p-6">
                    <p className="font-bold text-[var(--platform-ink)]">{t('empty.title')}</p>
                    <p className="mt-2 max-w-[65ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('empty.description')}
                    </p>
                </div>
            ) : null}

            {state === 'success' && overview && overview.totalProblems > 0 ? (
                <div className="grid lg:grid-cols-2">
                    <OpportunityGroup
                        id="without-published-editorial"
                        icon={CircleDashed}
                        title={t('without.title')}
                        description={t('without.description')}
                        count={overview.withoutPublishedEditorialCount}
                        countLabel={t('without.count', {
                            count: overview.withoutPublishedEditorialCount,
                        })}
                        problems={overview.withoutPublishedEditorial}
                        emptyTitle={t('without.empty')}
                        expanded={showAllWithout}
                        onExpandedChange={setShowAllWithout}
                        showAllLabel={t('showAll', {
                            count: overview.withoutPublishedEditorialCount,
                        })}
                        showLessLabel={t('showLess')}
                        renderProblem={(problem) => <ProblemWithoutEditorial problem={problem} />}
                    />
                    <OpportunityGroup
                        id="with-published-editorial"
                        icon={CheckCircle2}
                        title={t('with.title')}
                        description={t('with.description')}
                        count={overview.withPublishedEditorialCount}
                        countLabel={t('with.count', {
                            count: overview.withPublishedEditorialCount,
                        })}
                        problems={overview.withPublishedEditorial}
                        emptyTitle={t('with.empty')}
                        expanded={showAllWith}
                        onExpandedChange={setShowAllWith}
                        showAllLabel={t('showAll', {
                            count: overview.withPublishedEditorialCount,
                        })}
                        showLessLabel={t('showLess')}
                        className="border-t border-[var(--platform-line-strong)] lg:border-s lg:border-t-0"
                        renderProblem={(problem) => (
                            <ProblemWithEditorial problem={problem} locale={locale} />
                        )}
                    />
                </div>
            ) : null}
        </section>
    );
}

function OpportunityGroup({
    id,
    icon: Icon,
    title,
    description,
    count,
    countLabel,
    problems,
    emptyTitle,
    expanded,
    onExpandedChange,
    showAllLabel,
    showLessLabel,
    renderProblem,
    className = '',
}: {
    id: string;
    icon: typeof CircleDashed;
    title: string;
    description: string;
    count: number;
    countLabel: string;
    problems: EditorialOpportunityProblem[];
    emptyTitle: string;
    expanded: boolean;
    onExpandedChange: (expanded: boolean) => void;
    showAllLabel: string;
    showLessLabel: string;
    renderProblem: (problem: EditorialOpportunityProblem) => React.ReactNode;
    className?: string;
}) {
    const visibleProblems = expanded ? problems : problems.slice(0, INITIAL_VISIBLE_PROBLEMS);
    const canExpand = problems.length > INITIAL_VISIBLE_PROBLEMS;

    return (
        <section aria-labelledby={`${id}-title`} className={className}>
            <header className="flex min-h-32 items-start justify-between gap-4 border-b border-[var(--platform-line)] p-5 sm:p-6">
                <div>
                    <h3
                        id={`${id}-title`}
                        className="flex items-center gap-2 text-base font-bold text-[var(--platform-ink)]"
                    >
                        <Icon
                            className="h-4 w-4 text-[var(--platform-violet)]"
                            aria-hidden="true"
                        />
                        {title}
                    </h3>
                    <p className="mt-2 max-w-[48ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {description}
                    </p>
                </div>
                <span
                    className="shrink-0 border border-[var(--platform-line-strong)] px-2.5 py-1 font-mono text-xs font-bold tabular-nums text-[var(--platform-violet)]"
                    aria-label={countLabel}
                >
                    {count}
                </span>
            </header>
            {visibleProblems.length > 0 ? (
                <ol id={`${id}-list`} className="divide-y divide-[var(--platform-line)]">
                    {visibleProblems.map((problem) => (
                        <li key={problem.id}>{renderProblem(problem)}</li>
                    ))}
                </ol>
            ) : (
                <p className="p-5 text-sm leading-6 text-[var(--platform-ink-muted)] sm:p-6">
                    {emptyTitle}
                </p>
            )}
            {canExpand ? (
                <div className="border-t border-[var(--platform-line)] p-3 sm:px-5">
                    <button
                        type="button"
                        aria-controls={`${id}-list`}
                        aria-expanded={expanded}
                        onClick={() => onExpandedChange(!expanded)}
                        className="min-h-11 px-2 text-sm font-bold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-violet)]"
                    >
                        {expanded ? showLessLabel : showAllLabel}
                    </button>
                </div>
            ) : null}
        </section>
    );
}

function ProblemWithoutEditorial({ problem }: { problem: EditorialOpportunityProblem }) {
    const t = useTranslations('articles.editorialOpportunities');

    return (
        <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
            <ProblemLink problem={problem} label={t('openProblem', { title: problem.title })} />
            <Link
                href={`/writing/new?problemId=${problem.id}`}
                aria-label={t('writeFor', { title: problem.title })}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[var(--platform-violet)] bg-[var(--platform-violet)] px-3 text-sm font-bold text-[var(--platform-on-accent)] transition-colors hover:bg-[var(--platform-violet-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] sm:w-auto"
            >
                <FilePenLine className="h-4 w-4" aria-hidden="true" />
                {t('writeEditorial')}
            </Link>
        </div>
    );
}

function ProblemWithEditorial({
    problem,
    locale,
}: {
    problem: EditorialOpportunityProblem;
    locale: Locale;
}) {
    const t = useTranslations('articles.editorialOpportunities');

    return (
        <div className="p-4 sm:px-5">
            <ProblemLink problem={problem} label={t('openProblem', { title: problem.title })} />
            <ul className="mt-3 space-y-2 ps-14">
                {problem.publishedEditorials.map((editorial) => (
                    <li key={editorial.id}>
                        <Link
                            href={`/articles/${editorial.slug}`}
                            locale={editorial.language}
                            className="group inline-flex min-h-11 max-w-full items-center gap-2 text-sm font-semibold text-[var(--platform-violet-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-violet)]"
                        >
                            <span className="truncate underline decoration-[var(--platform-line-strong)] underline-offset-4 group-hover:decoration-[var(--platform-coral)]">
                                {editorial.title}
                            </span>
                            {formatEditorialDate(editorial.publishedAt, locale) ? (
                                <span className="hidden shrink-0 font-mono text-[0.68rem] font-medium text-[var(--platform-ink-muted)] sm:inline">
                                    {formatEditorialDate(editorial.publishedAt, locale)}
                                </span>
                            ) : null}
                            <ArrowRight
                                className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                                aria-hidden="true"
                            />
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ProblemLink({ problem, label }: { problem: EditorialOpportunityProblem; label: string }) {
    return (
        <Link
            href={`/problems/${problem.id}`}
            aria-label={label}
            className="group grid min-h-11 min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
        >
            <span className="font-mono text-xs font-bold tabular-nums text-[var(--platform-violet)]">
                #{problem.id}
            </span>
            <span className="line-clamp-2 font-bold leading-5 text-[var(--platform-ink)] underline decoration-transparent underline-offset-4 group-hover:decoration-[var(--platform-coral)]">
                {problem.title}
            </span>
        </Link>
    );
}

function EditorialOpportunitiesSkeleton({ label }: { label: string }) {
    return (
        <div className="grid lg:grid-cols-2" role="status" aria-label={label}>
            {[0, 1].map((column) => (
                <div
                    key={column}
                    className="space-y-4 p-5 motion-safe:animate-pulse sm:p-6 lg:border-s lg:first:border-s-0"
                    aria-hidden="true"
                >
                    <span className="block h-5 w-40 bg-[var(--platform-line)]" />
                    <span className="block h-4 w-4/5 bg-[var(--platform-paper-strong)]" />
                    <span className="block h-16 w-full bg-[var(--platform-paper-strong)]" />
                    <span className="block h-16 w-full bg-[var(--platform-paper-strong)]" />
                </div>
            ))}
        </div>
    );
}

function formatEditorialDate(value: string | null, locale: Locale): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Europe/Bucharest',
    }).format(date);
}
