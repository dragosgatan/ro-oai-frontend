import type { Metadata } from 'next';
import { CalendarClock, FilePlus2, MailPlus, Settings2, UsersRound } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/routing';
import { getMyHostedCompetition } from '@/lib/competition-hosting';
import type { Locale } from '@/lib/types';

type Props = { params: Promise<{ locale: string; competitionId: string }> };
export const metadata: Metadata = { robots: { index: false, follow: false } };

function formatDate(value: string, locale: Locale): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(locale, {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'Europe/Bucharest',
    }).format(date);
}

export default async function HostedCompetitionOverviewPage({ params }: Props) {
    const { locale: localeParam, competitionId } = await params;
    const locale = localeParam as Locale;
    const [competition, t] = await Promise.all([
        getMyHostedCompetition(Number(competitionId)),
        getTranslations('competitionHosting'),
    ]);
    const actions = [
        {
            href: `/my-competitions/${competition.id}/participants`,
            icon: MailPlus,
            title: t('organizer.overview.actions.inviteTitle'),
            description: t('organizer.overview.actions.inviteDescription'),
            allowed:
                competition.permissions.approvedHosting &&
                competition.permissions.canInviteParticipants,
        },
        {
            href: `/my-competitions/${competition.id}/problems/new`,
            icon: FilePlus2,
            title: t('organizer.overview.actions.problemTitle'),
            description: t('organizer.overview.actions.problemDescription'),
            allowed: competition.permissions.canSubmitProblems,
        },
        {
            href: `/my-competitions/${competition.id}/details`,
            icon: Settings2,
            title: t('organizer.overview.actions.detailsTitle'),
            description: t('organizer.overview.actions.detailsDescription'),
            allowed:
                competition.permissions.canEditContent || competition.permissions.canEditSchedule,
        },
    ].filter((action) => action.allowed);

    return (
        <div className="space-y-10">
            <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div>
                    <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">01</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]">
                        {t('organizer.overview.title')}
                    </h2>
                    <p className="mt-3 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {competition.shortDescription || t('organizer.overview.noDescription')}
                    </p>
                    <dl className="mt-7 border-y border-[var(--platform-line-strong)]">
                        <div className="grid gap-2 border-b border-[var(--platform-line)] py-4 sm:grid-cols-[11rem_1fr]">
                            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--platform-ink-muted)]">
                                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                                {t('organizer.overview.starts')}
                            </dt>
                            <dd className="text-sm font-semibold text-[var(--platform-ink)]">
                                {formatDate(competition.startTime, locale)}
                            </dd>
                        </div>
                        <div className="grid gap-2 border-b border-[var(--platform-line)] py-4 sm:grid-cols-[11rem_1fr]">
                            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--platform-ink-muted)]">
                                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                                {t('organizer.overview.ends')}
                            </dt>
                            <dd className="text-sm font-semibold text-[var(--platform-ink)]">
                                {formatDate(competition.endTime, locale)}
                            </dd>
                        </div>
                        <div className="grid gap-2 py-4 sm:grid-cols-[11rem_1fr]">
                            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--platform-ink-muted)]">
                                <UsersRound className="h-4 w-4" aria-hidden="true" />
                                {t('organizer.overview.access')}
                            </dt>
                            <dd className="text-sm font-semibold text-[var(--platform-ink)]">
                                {t(`access.${competition.access}`)} ·{' '}
                                {t(`competitionType.${competition.competitionType}`)}
                            </dd>
                        </div>
                    </dl>
                </div>
                <aside className="border-y border-[var(--platform-line-strong)] py-5 lg:border lg:p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-ink)]">
                        {t('organizer.overview.attention')}
                    </p>
                    <dl className="mt-4 divide-y divide-[var(--platform-line)]">
                        <div className="flex items-center justify-between gap-4 py-3">
                            <dt className="text-sm text-[var(--platform-ink-muted)]">
                                {t('organizer.overview.pendingInvites')}
                            </dt>
                            <dd className="font-mono text-lg font-bold text-[var(--platform-violet)]">
                                {competition.pendingInvitationCount}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4 py-3">
                            <dt className="text-sm text-[var(--platform-ink-muted)]">
                                {t('organizer.overview.problemProposals')}
                            </dt>
                            <dd className="font-mono text-lg font-bold">
                                {competition.problemCount}
                            </dd>
                        </div>
                    </dl>
                </aside>
            </section>

            {actions.length > 0 ? (
                <section>
                    <div className="border-b border-[var(--platform-line-strong)] pb-4">
                        <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">
                            02
                        </p>
                        <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]">
                            {t('organizer.overview.nextTitle')}
                        </h2>
                    </div>
                    <ol className="border-b border-[var(--platform-line-strong)]">
                        {actions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <li
                                    key={action.href}
                                    className="border-b border-[var(--platform-line)] last:border-b-0"
                                >
                                    <Link
                                        href={action.href}
                                        className="group grid min-h-24 gap-4 px-2 py-4 hover:bg-[var(--platform-paper-strong)] sm:grid-cols-[3rem_auto_minmax(0,1fr)] sm:items-center"
                                    >
                                        <span className="font-mono text-xs font-bold text-[var(--platform-violet)]">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <span className="grid h-10 w-10 place-items-center border border-[var(--platform-line-strong)] text-[var(--platform-violet)]">
                                            <Icon className="h-4 w-4" aria-hidden="true" />
                                        </span>
                                        <span>
                                            <span className="block font-bold text-[var(--platform-ink)]">
                                                {action.title}
                                            </span>
                                            <span className="mt-1 block text-sm text-[var(--platform-ink-muted)]">
                                                {action.description}
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ol>
                </section>
            ) : null}
        </div>
    );
}
