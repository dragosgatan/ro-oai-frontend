import {
    ArrowLeft,
    ArrowRight,
    Beaker,
    CheckCircle2,
    Clock3,
    FilePlus2,
    FileWarning,
    Lightbulb,
    Plus,
    ShieldCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PlatformEmptyState, PlatformPageShell } from '@/components/platform-page-shell';
import { Link } from '@/i18n/routing';
import {
    buildProblemProposalReadiness,
    type ProblemProposal,
    type ProblemProposalPage,
} from '@/lib/problem-proposals';
import type { Locale } from '@/lib/types';

function formatDate(value: string, locale: Locale): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Europe/Bucharest',
    }).format(date);
}

function readinessFor(proposal: ProblemProposal) {
    if (proposal.assets.length === 0 && !proposal.shortDescription && !proposal.longDescription) {
        const wasSubmitted =
            proposal.status === 'PENDING' ||
            proposal.status === 'CHANGES_REQUESTED' ||
            proposal.status === 'APPROVED' ||
            proposal.status === 'REJECTED';
        const validated = proposal.latestValidation?.status === 'PASSED';
        const completedCount = validated || wasSubmitted ? 5 : proposal.title ? 1 : 0;
        return {
            idea: Boolean(proposal.title),
            statement: wasSubmitted,
            files: validated || wasSubmitted,
            evaluator: validated || wasSubmitted,
            scoring: wasSubmitted,
            ready: completedCount === 5,
            completedCount,
            totalCount: 5,
        };
    }
    return buildProblemProposalReadiness(
        proposal,
        proposal.assets,
        proposal.latestValidation,
        proposal.version,
        proposal.revisionId,
    );
}

export function ProblemProposalsWorkspace({
    proposalPage,
    locale,
}: {
    proposalPage: ProblemProposalPage;
    locale: Locale;
}) {
    const t = useTranslations('problemProposals');
    const proposals = proposalPage.content;
    const inReview = proposals.filter((proposal) => proposal.status === 'PENDING').length;
    const needsWork = proposals.filter(
        (proposal) => proposal.status === 'CHANGES_REQUESTED',
    ).length;

    return (
        <PlatformPageShell contentClassName="space-y-10 md:space-y-14">
            <header className="grid gap-8 border-b border-[var(--platform-line-strong)] pb-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
                <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--platform-violet)]">
                        <Lightbulb className="h-4 w-4" aria-hidden="true" />
                        {t('eyebrow')}
                    </p>
                    <h1 className="mt-5 max-w-[16ch] text-balance text-4xl font-bold leading-[1.03] tracking-[-0.055em] text-[var(--platform-ink)] sm:text-5xl lg:text-6xl">
                        {t('title')}
                    </h1>
                    <p className="mt-5 max-w-[68ch] text-pretty text-base leading-7 text-[var(--platform-ink-muted)] sm:text-lg">
                        {t('description')}
                    </p>
                </div>
                <div className="grid grid-cols-3 border-y border-[var(--platform-line-strong)] py-4">
                    <div className="border-e border-[var(--platform-line)] px-3 first:ps-0">
                        <p className="font-mono text-2xl font-bold tabular-nums text-[var(--platform-violet)]">
                            {proposalPage.page.totalElements}
                        </p>
                        <p className="mt-1 text-xs text-[var(--platform-ink-muted)]">
                            {t('stats.total')}
                        </p>
                    </div>
                    <div className="border-e border-[var(--platform-line)] px-3">
                        <p className="font-mono text-2xl font-bold tabular-nums text-[var(--platform-ink)]">
                            {inReview}
                        </p>
                        <p className="mt-1 text-xs text-[var(--platform-ink-muted)]">
                            {t('stats.inReview')}
                        </p>
                    </div>
                    <div className="px-3 pe-0">
                        <p className="font-mono text-2xl font-bold tabular-nums text-[var(--platform-coral)]">
                            {needsWork}
                        </p>
                        <p className="mt-1 text-xs text-[var(--platform-ink-muted)]">
                            {t('stats.needsWork')}
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid gap-4 border-y border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
                <div className="flex items-start gap-3">
                    <ShieldCheck
                        className="mt-0.5 h-5 w-5 shrink-0 text-[var(--platform-violet)]"
                        aria-hidden="true"
                    />
                    <div>
                        <p className="text-sm font-bold text-[var(--platform-ink)]">
                            {t('safety.title')}
                        </p>
                        <p className="mt-1 max-w-[70ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                            {t('safety.description')}
                        </p>
                    </div>
                </div>
                <Link
                    href="/problem-proposals/evaluator-guide"
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 text-sm font-bold text-[var(--platform-ink)] hover:border-[var(--platform-violet)]"
                >
                    <Beaker className="h-4 w-4" aria-hidden="true" />
                    {t('evaluatorGuide')}
                </Link>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]">
                        {t('library.title')}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--platform-ink-muted)]">
                        {t('library.description')}
                    </p>
                </div>
                <Link
                    href="/problem-proposals/new"
                    className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--platform-violet)] px-5 text-sm font-bold text-white shadow-[4px_4px_0_var(--platform-line)] transition-transform duration-200 ease-out hover:-translate-y-0.5 dark:text-[var(--platform-on-accent)]"
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t('newProposal')}
                </Link>
            </div>

            {proposals.length === 0 ? (
                <PlatformEmptyState
                    icon={FilePlus2}
                    title={t('empty.title')}
                    description={t('empty.description')}
                    action={
                        <Link
                            href="/problem-proposals/new"
                            className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)]"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            {t('empty.action')}
                        </Link>
                    }
                />
            ) : (
                <ol className="border-y border-[var(--platform-line-strong)]">
                    {proposals.map((proposal, index) => {
                        const readiness = readinessFor(proposal);
                        const StatusIcon =
                            proposal.status === 'APPROVED'
                                ? CheckCircle2
                                : proposal.status === 'CHANGES_REQUESTED' ||
                                    proposal.status === 'REJECTED'
                                  ? FileWarning
                                  : Clock3;
                        return (
                            <li
                                key={proposal.id}
                                className="border-b border-[var(--platform-line)] last:border-b-0"
                            >
                                <Link
                                    href={`/problem-proposals/${proposal.id}`}
                                    className="group grid min-h-40 gap-5 px-2 py-6 transition-[background-color,padding] hover:bg-[var(--platform-paper-strong)] hover:px-4 sm:grid-cols-[3rem_minmax(0,1fr)_14rem_auto] sm:items-center sm:px-4 sm:hover:px-6"
                                >
                                    <span className="font-mono text-xs font-bold tabular-nums text-[var(--platform-violet)]">
                                        {String(
                                            proposalPage.page.number * proposalPage.page.size +
                                                index +
                                                1,
                                        ).padStart(2, '0')}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-ink-muted)]">
                                            {t(`difficulty.${proposal.difficulty}`)} ·{' '}
                                            {proposal.evaluationType}
                                        </p>
                                        <h3 className="mt-2 text-pretty text-xl font-bold tracking-[-0.025em] text-[var(--platform-ink)] group-hover:text-[var(--platform-violet-strong)] dark:group-hover:text-[var(--platform-violet)] sm:text-2xl">
                                            {proposal.title || t('untitled')}
                                        </h3>
                                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--platform-ink-muted)]">
                                            {proposal.shortDescription || t('noSummary')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="inline-flex min-h-8 items-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-2.5 text-xs font-bold text-[var(--platform-ink)]">
                                            <StatusIcon
                                                className="h-3.5 w-3.5 text-[var(--platform-coral)]"
                                                aria-hidden="true"
                                            />
                                            {t(`status.${proposal.status}`)}
                                        </p>
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between gap-3 text-xs text-[var(--platform-ink-muted)]">
                                                <span>{t('readiness.label')}</span>
                                                <span className="font-mono tabular-nums">
                                                    {readiness.completedCount}/
                                                    {readiness.totalCount}
                                                </span>
                                            </div>
                                            <div
                                                className="mt-1.5 h-1.5 bg-[var(--platform-line)]"
                                                role="progressbar"
                                                aria-label={t('readiness.label')}
                                                aria-valuemin={0}
                                                aria-valuemax={readiness.totalCount}
                                                aria-valuenow={readiness.completedCount}
                                            >
                                                <span
                                                    className="block h-full bg-[var(--platform-violet)]"
                                                    style={{
                                                        width: `${(readiness.completedCount / readiness.totalCount) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--platform-ink-muted)]">
                                                <Clock3
                                                    className="h-3.5 w-3.5"
                                                    aria-hidden="true"
                                                />
                                                {t('updated', {
                                                    date: formatDate(proposal.updatedAt, locale),
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="grid h-11 w-11 place-items-center border border-[var(--platform-line-strong)] text-[var(--platform-violet)] transition-colors group-hover:border-[var(--platform-violet)] group-hover:bg-[var(--platform-violet)] group-hover:text-white dark:group-hover:text-[var(--platform-on-accent)]">
                                        <ArrowRight
                                            className="h-4 w-4 rtl:rotate-180"
                                            aria-hidden="true"
                                        />
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ol>
            )}

            {proposalPage.page.totalPages > 1 ? (
                <nav
                    aria-label={t('pagination.label')}
                    className="flex flex-col items-center justify-between gap-4 border-t border-[var(--platform-line-strong)] pt-6 sm:flex-row"
                >
                    <Link
                        href={`/problem-proposals?page=${Math.max(1, proposalPage.page.number)}`}
                        aria-disabled={proposalPage.page.number === 0}
                        tabIndex={proposalPage.page.number === 0 ? -1 : undefined}
                        className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
                    >
                        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                        {t('pagination.previous')}
                    </Link>
                    <p className="font-mono text-sm font-semibold tabular-nums text-[var(--platform-ink-muted)]">
                        {t('pagination.page', {
                            page: proposalPage.page.number + 1,
                            pages: proposalPage.page.totalPages,
                        })}
                    </p>
                    <Link
                        href={`/problem-proposals?page=${Math.min(
                            proposalPage.page.totalPages,
                            proposalPage.page.number + 2,
                        )}`}
                        aria-disabled={proposalPage.page.number + 1 >= proposalPage.page.totalPages}
                        tabIndex={
                            proposalPage.page.number + 1 >= proposalPage.page.totalPages
                                ? -1
                                : undefined
                        }
                        className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
                    >
                        {t('pagination.next')}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                    </Link>
                </nav>
            ) : null}
        </PlatformPageShell>
    );
}
