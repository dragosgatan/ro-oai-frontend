'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import type { CompetitionUserListResponse } from '@/lib/types';
import { CompetitionList } from '@/components/competition-list';
import { ArrowLeft, ArrowRight, Trophy } from 'lucide-react';

import { PlatformPageHeader } from '@/components/platform-page-shell';

export type CompetitionsSectionProps = {
    title: string;
    subtitle?: string;
    competitions: CompetitionUserListResponse[];
    currentPage?: number; // zero-based
    totalPages?: number;
    size?: number;
    basePath?: string; // e.g. '/competitions'
    showNavigation?: boolean;
    sectionId?: string;
};

export function CompetitionsSection({
    title,
    subtitle,
    competitions,
    currentPage = 0,
    totalPages = 1,
    size = 9,
    basePath = '/competitions',
    showNavigation = true,
    sectionId = 'competitions',
}: CompetitionsSectionProps) {
    const t = useTranslations();

    const hasNext = currentPage + 1 < totalPages;
    const hasPrev = currentPage > 0;
    const pageLabel = `${t('pagination.page')} ${currentPage + 1} ${t('pagination.of')} ${Math.max(
        totalPages,
        1,
    )}`;

    return (
        <section id={sectionId}>
            <PlatformPageHeader
                eyebrow={t('navigation.competitions')}
                icon={Trophy}
                title={t(`competitions.list.${title}`)}
                description={subtitle ? t(`competitions.list.${subtitle}`) : undefined}
                aside={
                    showNavigation ? (
                        <span className="inline-flex min-h-11 items-center border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 font-mono text-xs font-bold tabular-nums text-[var(--platform-ink-muted-strong)]">
                            {pageLabel}
                        </span>
                    ) : null
                }
            />

            <CompetitionList competitions={competitions} />

            {showNavigation && (
                <nav
                    className="mt-8 flex flex-col gap-4 border-t border-[var(--platform-line-strong)] pt-6 sm:flex-row sm:items-center sm:justify-between"
                    aria-label={pageLabel}
                >
                    <p className="text-sm font-medium text-[var(--platform-ink-muted)]">
                        {pageLabel}
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:flex">
                        {hasPrev ? (
                            <Link
                                href={{
                                    pathname: basePath,
                                    query: { page: Math.max(currentPage - 1, 0), size },
                                }}
                                className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 text-sm font-semibold text-[var(--platform-ink)] transition-colors hover:border-[var(--platform-violet)] hover:text-[var(--platform-violet)]"
                            >
                                <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                                {t('pagination.previous')}
                            </Link>
                        ) : (
                            <span
                                className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 border border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-4 text-sm font-semibold text-[var(--platform-ink-muted)] opacity-60"
                                aria-disabled="true"
                            >
                                <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                                {t('pagination.previous')}
                            </span>
                        )}
                        {hasNext ? (
                            <Link
                                href={{
                                    pathname: basePath,
                                    query: { page: currentPage + 1, size },
                                }}
                                className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--platform-violet)] px-4 text-sm font-semibold text-[var(--platform-paper)] transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none"
                            >
                                {t('pagination.next')}
                                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                            </Link>
                        ) : (
                            <span
                                className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 border border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-4 text-sm font-semibold text-[var(--platform-ink-muted)] opacity-60"
                                aria-disabled="true"
                            >
                                {t('pagination.next')}
                                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                            </span>
                        )}
                    </div>
                </nav>
            )}
        </section>
    );
}
