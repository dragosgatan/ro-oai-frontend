'use client';

import type { ReactNode } from 'react';
import {
    ArrowLeft,
    ExternalLink,
    LayoutDashboard,
    ListChecks,
    Settings2,
    Trophy,
    UsersRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/routing';
import type { HostedCompetition } from '@/lib/competition-hosting';
import { cn } from '@/lib/utils';

export function HostedCompetitionShell({
    competition,
    children,
}: {
    competition: HostedCompetition;
    children: ReactNode;
}) {
    const t = useTranslations('competitionHosting');
    const pathname = usePathname();
    const base = `/my-competitions/${competition.id}`;
    const isProblemEditor =
        pathname === `${base}/problems/new` ||
        new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/problems/\\d+$`).test(pathname);
    const tabs = [
        { href: base, key: 'overview', icon: LayoutDashboard },
        { href: `${base}/details`, key: 'details', icon: Settings2 },
        { href: `${base}/problems`, key: 'problems', icon: ListChecks },
        { href: `${base}/participants`, key: 'participants', icon: UsersRound },
    ] as const;

    if (isProblemEditor) return children;

    return (
        <div className="platform-page-shell">
            <div className="platform-page-inner space-y-8">
                <header className="border-b border-[var(--platform-line-strong)] pb-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Link
                            href="/my-competitions"
                            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 dark:text-[var(--platform-violet)]"
                        >
                            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                            {t('organizer.back')}
                        </Link>
                        {competition.access === 'PUBLIC' ? (
                            <Link
                                href={`/competitions/${competition.id}`}
                                className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)]"
                            >
                                {t('organizer.publicPage')}
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        ) : null}
                    </div>
                    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                        <div>
                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--platform-violet)]">
                                <Trophy className="h-4 w-4" aria-hidden="true" />
                                {t('organizer.eyebrow')}
                            </p>
                            <h1 className="mt-3 max-w-[24ch] text-balance text-3xl font-bold tracking-[-0.045em] text-[var(--platform-ink)] sm:text-4xl">
                                {competition.name}
                            </h1>
                        </div>
                        <dl className="grid grid-cols-3 border-y border-[var(--platform-line-strong)] py-3">
                            <div className="border-e border-[var(--platform-line)] px-4 ps-0">
                                <dt className="text-[0.7rem] uppercase tracking-[0.1em] text-[var(--platform-ink-muted)]">
                                    {t('organizer.stats.status')}
                                </dt>
                                <dd className="mt-1 text-sm font-bold">
                                    {t(`lifecycle.${competition.lifecycle}`)}
                                </dd>
                            </div>
                            <div className="border-e border-[var(--platform-line)] px-4">
                                <dt className="text-[0.7rem] uppercase tracking-[0.1em] text-[var(--platform-ink-muted)]">
                                    {t('organizer.stats.problems')}
                                </dt>
                                <dd className="mt-1 font-mono text-lg font-bold text-[var(--platform-violet)]">
                                    {competition.problemCount}
                                </dd>
                            </div>
                            <div className="px-4 pe-0">
                                <dt className="text-[0.7rem] uppercase tracking-[0.1em] text-[var(--platform-ink-muted)]">
                                    {t('organizer.stats.participants')}
                                </dt>
                                <dd className="mt-1 font-mono text-lg font-bold">
                                    {competition.participantCount}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </header>

                <nav
                    aria-label={t('organizer.tabs.label')}
                    className="overflow-x-auto border-b border-[var(--platform-line-strong)]"
                >
                    <ul className="flex min-w-max gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active =
                                tab.href === base
                                    ? pathname === base
                                    : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                            return (
                                <li key={tab.key}>
                                    <Link
                                        href={tab.href}
                                        aria-current={active ? 'page' : undefined}
                                        className={cn(
                                            'inline-flex min-h-12 items-center gap-2 border-b-2 px-4 text-sm font-bold transition-colors',
                                            active
                                                ? 'border-[var(--platform-violet)] text-[var(--platform-violet-strong)] dark:text-[var(--platform-violet)]'
                                                : 'border-transparent text-[var(--platform-ink-muted)] hover:text-[var(--platform-ink)]',
                                        )}
                                    >
                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                        {t(`organizer.tabs.${tab.key}`)}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <main>{children}</main>
            </div>
        </div>
    );
}
