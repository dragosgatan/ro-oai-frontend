import {
    ArrowLeft,
    ArrowRight,
    CalendarClock,
    CheckCircle2,
    Clock3,
    Plus,
    Trophy,
    UsersRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PlatformEmptyState, PlatformPageShell } from '@/components/platform-page-shell';
import { Link } from '@/i18n/routing';
import type {
    CompetitionHostingPage,
    CompetitionHostingRequest,
    HostedCompetition,
} from '@/lib/competition-hosting';
import type { Locale } from '@/lib/types';

function formatDate(value: string, locale: Locale): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Europe/Bucharest',
    }).format(date);
}

function hubHref(competitionPage: number, requestPage: number): string {
    const query = new URLSearchParams();
    if (competitionPage > 1) query.set('competitionPage', String(competitionPage));
    if (requestPage > 1) query.set('requestPage', String(requestPage));
    const suffix = query.toString();
    return `/my-competitions${suffix ? `?${suffix}` : ''}`;
}

function HubPagination({
    page,
    section,
    queryKey,
    otherPage,
}: {
    page: CompetitionHostingPage<unknown>['page'];
    section: string;
    queryKey: 'competitionPage' | 'requestPage';
    otherPage: number;
}) {
    const t = useTranslations('competitionHosting');
    if (page.totalPages <= 1) return null;
    const currentPage = page.number + 1;
    const hrefFor = (targetPage: number) =>
        hubHref(
            queryKey === 'competitionPage' ? targetPage : otherPage,
            queryKey === 'requestPage' ? targetPage : otherPage,
        );

    return (
        <nav
            aria-label={t('pagination.label', { section })}
            className="flex flex-col items-center justify-between gap-4 border-t border-[var(--platform-line-strong)] pt-6 sm:flex-row"
        >
            <Link
                href={hrefFor(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage === 1}
                tabIndex={currentPage === 1 ? -1 : undefined}
                className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
            >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                {t('pagination.previous')}
            </Link>
            <p className="font-mono text-sm font-semibold tabular-nums text-[var(--platform-ink-muted)]">
                {t('pagination.page', { page: currentPage, pages: page.totalPages })}
            </p>
            <Link
                href={hrefFor(Math.min(page.totalPages, currentPage + 1))}
                aria-disabled={currentPage >= page.totalPages}
                tabIndex={currentPage >= page.totalPages ? -1 : undefined}
                className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
            >
                {t('pagination.next')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
        </nav>
    );
}

export function MyCompetitionsHub({
    requests,
    competitions,
    locale,
}: {
    requests: CompetitionHostingPage<CompetitionHostingRequest>;
    competitions: CompetitionHostingPage<HostedCompetition>;
    locale: Locale;
}) {
    const t = useTranslations('competitionHosting');

    return (
        <PlatformPageShell contentClassName="space-y-12">
            <header className="grid gap-8 border-b border-[var(--platform-line-strong)] pb-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
                <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--platform-violet)]">
                        <Trophy className="h-4 w-4" aria-hidden="true" />
                        {t('hub.eyebrow')}
                    </p>
                    <h1 className="mt-5 max-w-[17ch] text-balance text-4xl font-bold leading-[1.03] tracking-[-0.055em] text-[var(--platform-ink)] sm:text-5xl lg:text-6xl">
                        {t('hub.title')}
                    </h1>
                    <p className="mt-5 max-w-[68ch] text-pretty text-base leading-7 text-[var(--platform-ink-muted)] sm:text-lg">
                        {t('hub.description')}
                    </p>
                </div>
                <Link
                    href="/my-competitions/new"
                    className="inline-flex min-h-12 items-center justify-center gap-2 bg-[var(--platform-violet)] px-5 text-sm font-bold text-white shadow-[4px_4px_0_var(--platform-line)] dark:text-[var(--platform-on-accent)]"
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t('hub.newRequest')}
                </Link>
            </header>

            <section aria-labelledby="managed-competitions-title">
                <div className="border-b border-[var(--platform-line-strong)] pb-4">
                    <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">01</p>
                    <h2
                        id="managed-competitions-title"
                        className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                    >
                        {t('hub.managed.title')}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--platform-ink-muted)]">
                        {t('hub.managed.description')}
                    </p>
                </div>
                {competitions.content.length === 0 ? (
                    <PlatformEmptyState
                        icon={Trophy}
                        title={t('hub.managed.emptyTitle')}
                        description={t('hub.managed.emptyDescription')}
                    />
                ) : (
                    <div>
                        <ol className="border-b border-[var(--platform-line-strong)]">
                            {competitions.content.map((competition, index) => (
                                <li
                                    key={competition.id}
                                    className="border-b border-[var(--platform-line)] last:border-b-0"
                                >
                                    <Link
                                        href={`/my-competitions/${competition.id}`}
                                        className="group grid min-h-36 gap-5 px-2 py-6 transition-colors hover:bg-[var(--platform-paper-strong)] sm:grid-cols-[3rem_minmax(0,1fr)_13rem_11rem_auto] sm:items-center"
                                    >
                                        <span className="font-mono text-xs font-bold text-[var(--platform-violet)]">
                                            {String(
                                                competitions.page.number * competitions.page.size +
                                                    index +
                                                    1,
                                            ).padStart(2, '0')}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-xl font-bold tracking-[-0.025em] text-[var(--platform-ink)] group-hover:text-[var(--platform-violet-strong)] dark:group-hover:text-[var(--platform-violet)]">
                                                {competition.name}
                                            </span>
                                            <span className="mt-2 line-clamp-2 block text-sm leading-6 text-[var(--platform-ink-muted)]">
                                                {competition.shortDescription ||
                                                    t('hub.noDescription')}
                                            </span>
                                        </span>
                                        <span className="text-sm text-[var(--platform-ink-muted)]">
                                            <span className="flex items-center gap-2 font-semibold text-[var(--platform-ink)]">
                                                <CalendarClock
                                                    className="h-4 w-4 text-[var(--platform-violet)]"
                                                    aria-hidden="true"
                                                />
                                                {t(`lifecycle.${competition.lifecycle}`)}
                                            </span>
                                            <span className="mt-1 block text-xs">
                                                {formatDate(competition.startTime, locale)}
                                            </span>
                                        </span>
                                        <span className="text-sm text-[var(--platform-ink-muted)]">
                                            <span className="flex items-center gap-2 font-mono text-lg font-bold text-[var(--platform-ink)]">
                                                <UsersRound
                                                    className="h-4 w-4 text-[var(--platform-violet)]"
                                                    aria-hidden="true"
                                                />
                                                {competition.participantCount}
                                            </span>
                                            <span className="mt-1 block text-xs">
                                                {t('hub.participants')}
                                            </span>
                                        </span>
                                        <span className="grid h-11 w-11 place-items-center border border-[var(--platform-line-strong)] text-[var(--platform-violet)] group-hover:border-[var(--platform-violet)] group-hover:bg-[var(--platform-violet)] group-hover:text-white dark:group-hover:text-[var(--platform-on-accent)]">
                                            <ArrowRight
                                                className="h-4 w-4 rtl:rotate-180"
                                                aria-hidden="true"
                                            />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                        <HubPagination
                            page={competitions.page}
                            section={t('hub.managed.title')}
                            queryKey="competitionPage"
                            otherPage={requests.page.number + 1}
                        />
                    </div>
                )}
            </section>

            <section aria-labelledby="hosting-requests-title">
                <div className="border-b border-[var(--platform-line-strong)] pb-4">
                    <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">02</p>
                    <h2
                        id="hosting-requests-title"
                        className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                    >
                        {t('hub.requests.title')}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--platform-ink-muted)]">
                        {t('hub.requests.description')}
                    </p>
                </div>
                {requests.content.length === 0 ? (
                    <PlatformEmptyState
                        icon={Clock3}
                        title={t('hub.requests.emptyTitle')}
                        description={t('hub.requests.emptyDescription')}
                        action={
                            <Link
                                href="/my-competitions/new"
                                className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold"
                            >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                {t('hub.newRequest')}
                            </Link>
                        }
                    />
                ) : (
                    <div>
                        <ol className="border-b border-[var(--platform-line-strong)]">
                            {requests.content.map((request, index) => {
                                const StatusIcon =
                                    request.status === 'APPROVED' ? CheckCircle2 : Clock3;
                                return (
                                    <li
                                        key={request.id}
                                        className="border-b border-[var(--platform-line)] last:border-b-0"
                                    >
                                        <Link
                                            href={`/my-competitions/requests/${request.id}`}
                                            className="group grid min-h-28 gap-4 px-2 py-5 hover:bg-[var(--platform-paper-strong)] sm:grid-cols-[3rem_minmax(0,1fr)_12rem_11rem_auto] sm:items-center"
                                        >
                                            <span className="font-mono text-xs font-bold text-[var(--platform-violet)]">
                                                {String(
                                                    requests.page.number * requests.page.size +
                                                        index +
                                                        1,
                                                ).padStart(2, '0')}
                                            </span>
                                            <span>
                                                <span className="block font-bold text-[var(--platform-ink)]">
                                                    {request.name || t('requestEditor.untitled')}
                                                </span>
                                                <span className="mt-1 block text-xs text-[var(--platform-ink-muted)]">
                                                    {t(`requestMode.${request.requestMode}.short`)}
                                                </span>
                                            </span>
                                            <span className="inline-flex min-h-8 w-fit items-center gap-2 border border-[var(--platform-line-strong)] px-2.5 text-xs font-bold">
                                                <StatusIcon
                                                    className="h-3.5 w-3.5 text-[var(--platform-violet)]"
                                                    aria-hidden="true"
                                                />
                                                {t(`status.${request.status}`)}
                                            </span>
                                            <span className="text-xs text-[var(--platform-ink-muted)]">
                                                {t('hub.updated', {
                                                    date: formatDate(request.updatedAt, locale),
                                                })}
                                            </span>
                                            <span className="grid h-11 w-11 place-items-center border border-[var(--platform-line-strong)] text-[var(--platform-violet)] group-hover:border-[var(--platform-violet)]">
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
                        <HubPagination
                            page={requests.page}
                            section={t('hub.requests.title')}
                            queryKey="requestPage"
                            otherPage={competitions.page.number + 1}
                        />
                    </div>
                )}
            </section>
        </PlatformPageShell>
    );
}
