import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ArrowLeft, ArrowRight, FilePlus2, Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { PlatformEmptyState } from '@/components/platform-page-shell';
import { Link } from '@/i18n/routing';
import {
    getHostedCompetitionProblemProposals,
    getMyHostedCompetition,
} from '@/lib/competition-hosting';

type Props = {
    params: Promise<{ locale: string; competitionId: string }>;
    searchParams: Promise<{ problemPage?: string | string[] }>;
};
export const metadata: Metadata = { robots: { index: false, follow: false } };

function parsePage(value: string | string[] | undefined): number {
    const candidate = Array.isArray(value) ? value[0] : value;
    const parsed = /^\d+$/.test(candidate ?? '') ? Number(candidate) : Number.NaN;
    return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 100_000) : 1;
}

export default async function HostedCompetitionProblemsPage({ params, searchParams }: Props) {
    const [{ locale, competitionId }, query] = await Promise.all([params, searchParams]);
    const id = Number(competitionId);
    const requestedPage = parsePage(query.problemPage);
    const [competition, problems, t] = await Promise.all([
        getMyHostedCompetition(id),
        getHostedCompetitionProblemProposals(id),
        getTranslations('competitionHosting'),
    ]);
    const pageSize = 20;
    const totalPages = Math.max(1, Math.ceil(problems.length / pageSize));
    if (requestedPage > totalPages) {
        redirect(`/${locale}/my-competitions/${id}/problems?problemPage=${totalPages}`);
    }
    const visibleProblems = problems.slice(
        (requestedPage - 1) * pageSize,
        requestedPage * pageSize,
    );

    return (
        <div className="space-y-7">
            <div className="flex flex-col gap-4 border-b border-[var(--platform-line-strong)] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">01</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]">
                        {t('organizer.problems.title')}
                    </h2>
                    <p className="mt-2 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('organizer.problems.description')}
                    </p>
                </div>
                {competition.permissions.canSubmitProblems ? (
                    <Link
                        href={`/my-competitions/${competition.id}/problems/new`}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-[var(--platform-violet)] px-5 text-sm font-bold text-white dark:text-[var(--platform-on-accent)]"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        {t('organizer.problems.add')}
                    </Link>
                ) : null}
            </div>

            {problems.length === 0 ? (
                <PlatformEmptyState
                    icon={FilePlus2}
                    title={t('organizer.problems.emptyTitle')}
                    description={t('organizer.problems.emptyDescription')}
                    action={
                        competition.permissions.canSubmitProblems ? (
                            <Link
                                href={`/my-competitions/${competition.id}/problems/new`}
                                className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold"
                            >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                {t('organizer.problems.add')}
                            </Link>
                        ) : null
                    }
                />
            ) : (
                <div>
                    <ol className="border-y border-[var(--platform-line-strong)]">
                        {visibleProblems.map((problem, index) => (
                            <li
                                key={problem.id}
                                className="border-b border-[var(--platform-line)] last:border-b-0"
                            >
                                <Link
                                    href={`/my-competitions/${competition.id}/problems/${problem.id}`}
                                    className="group grid min-h-28 gap-4 px-2 py-5 hover:bg-[var(--platform-paper-strong)] sm:grid-cols-[3rem_minmax(0,1fr)_11rem_7rem_auto] sm:items-center"
                                >
                                    <span className="font-mono text-xs font-bold text-[var(--platform-violet)]">
                                        {String(
                                            (requestedPage - 1) * pageSize + index + 1,
                                        ).padStart(2, '0')}
                                    </span>
                                    <span>
                                        <span className="block text-lg font-bold text-[var(--platform-ink)]">
                                            {problem.title || t('requestEditor.problems.untitled')}
                                        </span>
                                        <span className="mt-1 block text-xs text-[var(--platform-ink-muted)]">
                                            {t(`problemStatus.${problem.status}`)}
                                        </span>
                                    </span>
                                    <span className="inline-flex min-h-8 w-fit items-center border border-[var(--platform-line-strong)] px-2.5 text-xs font-bold">
                                        {problem.evaluationType}
                                    </span>
                                    <span className="text-xs font-bold text-[var(--platform-ink-muted)]">
                                        {t(`problemDifficulty.${problem.difficulty}`)}
                                    </span>
                                    <span className="grid h-11 w-11 place-items-center border border-[var(--platform-line-strong)] text-[var(--platform-violet)] group-hover:border-[var(--platform-violet)]">
                                        <ArrowRight
                                            className="h-4 w-4 rtl:rotate-180"
                                            aria-hidden="true"
                                        />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ol>
                    {totalPages > 1 ? (
                        <nav
                            aria-label={t('pagination.label', {
                                section: t('organizer.problems.title'),
                            })}
                            className="flex flex-col items-center justify-between gap-4 border-t border-[var(--platform-line-strong)] pt-6 sm:flex-row"
                        >
                            <Link
                                href={`/my-competitions/${id}/problems?problemPage=${Math.max(1, requestedPage - 1)}`}
                                aria-disabled={requestedPage === 1}
                                tabIndex={requestedPage === 1 ? -1 : undefined}
                                className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
                            >
                                <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                                {t('pagination.previous')}
                            </Link>
                            <p className="font-mono text-sm font-semibold tabular-nums text-[var(--platform-ink-muted)]">
                                {t('pagination.page', {
                                    page: requestedPage,
                                    pages: totalPages,
                                })}
                            </p>
                            <Link
                                href={`/my-competitions/${id}/problems?problemPage=${Math.min(totalPages, requestedPage + 1)}`}
                                aria-disabled={requestedPage >= totalPages}
                                tabIndex={requestedPage >= totalPages ? -1 : undefined}
                                className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
                            >
                                {t('pagination.next')}
                                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                            </Link>
                        </nav>
                    ) : null}
                </div>
            )}
        </div>
    );
}
